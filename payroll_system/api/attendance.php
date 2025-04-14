<?php
include 'config.php';
include 'cors.php';
session_start();
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

// Check if user is authenticated (either admin or employee)
function checkAuth() {
    if (!isset($_SESSION['admin_id']) && !isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized. Please log in"
        ]);
        exit;
    }
    return true;
}

// Get attendance records
if ($method === 'GET') {
    checkAuth();
    
    // If employee is logged in, only show their records
    if (isset($_SESSION['user_id']) && !isset($_SESSION['admin_id'])) {
        $employee_id = $_SESSION['user_id'];
        
        // Cache key specific to this employee's attendance
        $cache_key = 'attendance_employee_' . $employee_id;
        
        $attendance_data = $cache->remember($cache_key, function() use ($conn, $employee_id) {
            $stmt = $conn->prepare("SELECT * FROM attendance WHERE employee_id = ?");
            $stmt->bind_param("i", $employee_id);
            $stmt->execute();
            $result = $stmt->get_result();
            return $result->fetch_all(MYSQLI_ASSOC);
        }, 180); // 3 minute cache for employee attendance
    } else {
        // Admin can see all records - cache with shorter TTL
        $attendance_data = $cache->remember('attendance_all', function() use ($conn) {
            $result = $conn->query("SELECT a.*, e.name as employee_name 
                                   FROM attendance a 
                                   JOIN employees e ON a.employee_id = e.id");
            return $result->fetch_all(MYSQLI_ASSOC);
        }, 60); // 1 minute cache for admin view (attendance changes frequently)
    }
    
    echo json_encode([
        "success" => true,
        "data" => $attendance_data,
        "cached" => $cache->isEnabled() // For debugging
    ]);
}

// Add attendance record
if ($method === 'POST') {
    checkAuth();
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields
    if (!isset($data['employee_id'], $data['date'])) {
        echo json_encode([
            "success" => false,
            "message" => "Missing required fields"
        ]);
        exit;
    }
    
    // If regular employee, can only add their own attendance
    if (isset($_SESSION['user_id']) && !isset($_SESSION['admin_id']) && $data['employee_id'] != $_SESSION['user_id']) {
        echo json_encode([
            "success" => false,
            "message" => "You can only add your own attendance records"
        ]);
        exit;
    }
    
    // Check if this is a punch-in or punch-out operation
    $is_punch_in = isset($data['punch_in']) && empty($data['punch_out']);
    $is_punch_out = isset($data['punch_out']);
    
    // For punch-out, check if there's an existing record to update
    if ($is_punch_out) {
        // Look for an existing record with punch-in but no punch-out for this employee and date
        $check = $conn->prepare("SELECT id, punch_in FROM attendance WHERE employee_id = ? AND date = ? AND punch_out IS NULL ORDER BY id DESC LIMIT 1");
        $check->bind_param("is", $data['employee_id'], $data['date']);
        $check->execute();
        $existing_record = $check->get_result()->fetch_assoc();
        
        if ($existing_record) {
            // Found an existing record, update it with punch-out time
            $punch_out = date('Y-m-d H:i:s', strtotime($data['date'] . ' ' . $data['punch_out']));
            $punch_in_time = strtotime($existing_record['punch_in']);
            $punch_out_time = strtotime($punch_out);
            
            // Calculate hours worked
            $hours_worked = 0;
            if ($punch_in_time && $punch_out_time) {
                $hours_worked = round(($punch_out_time - $punch_in_time) / 3600, 2);
            }
            
            $update = $conn->prepare("UPDATE attendance SET punch_out = ?, hours_worked = ? WHERE id = ?");
            $update->bind_param("sdi", $punch_out, $hours_worked, $existing_record['id']);
            
            if ($update->execute()) {
                // Clear relevant caches
                $cache->delete('attendance_all');
                $cache->delete('attendance_employee_' . $data['employee_id']);
                
                echo json_encode([
                    "success" => true,
                    "message" => "Punch-out recorded successfully.",
                    "id" => $existing_record['id'],
                    "hours_worked" => $hours_worked
                ]);
                exit;
            } else {
                echo json_encode([
                    "success" => false,
                    "message" => "Error recording punch-out: " . $update->error
                ]);
                exit;
            }
        }
    }
    
    // Calculate hours worked (only if both punch-in and punch-out are provided)
    $hours_worked = 0;
    if (!empty($data['punch_in']) && !empty($data['punch_out'])) {
        $punch_in_time = strtotime($data['punch_in']);
        $punch_out_time = strtotime($data['punch_out']);
        
        if ($punch_in_time && $punch_out_time) {
            $hours_worked = round(($punch_out_time - $punch_in_time) / 3600, 2);
        }
    }
    
    // Make sure we're storing valid datetime values
    $punch_in = !empty($data['punch_in']) ? date('Y-m-d H:i:s', strtotime($data['date'] . ' ' . $data['punch_in'])) : null;
    $punch_out = !empty($data['punch_out']) ? date('Y-m-d H:i:s', strtotime($data['date'] . ' ' . $data['punch_out'])) : null;
    
    $stmt = $conn->prepare("INSERT INTO attendance (employee_id, punch_in, punch_out, date, hours_worked) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("isssd", $data['employee_id'], $punch_in, $punch_out, $data['date'], $hours_worked);
    
    if ($stmt->execute()) {
        // Clear relevant caches
        $cache->delete('attendance_all');
        $cache->delete('attendance_employee_' . $data['employee_id']);
        
        echo json_encode([
            "success" => true,
            "message" => $is_punch_in ? "Punch-in recorded successfully." : "Attendance record added successfully.",
            "id" => $conn->insert_id,
            "hours_worked" => $hours_worked
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error adding attendance record: " . $stmt->error
        ]);
    }
}

// Update attendance
if ($method === 'PUT') {
    checkAuth();
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields
    if (!isset($data['id'], $data['date'])) {
        echo json_encode([
            "success" => false,
            "message" => "Missing required fields"
        ]);
        exit;
    }
    
    // If regular employee, verify they own this record before updating
    if (isset($_SESSION['user_id']) && !isset($_SESSION['admin_id'])) {
        $check = $conn->prepare("SELECT employee_id FROM attendance WHERE id = ?");
        $check->bind_param("i", $data['id']);
        $check->execute();
        $result = $check->get_result()->fetch_assoc();
        
        if (!$result || $result['employee_id'] != $_SESSION['user_id']) {
            echo json_encode([
                "success" => false,
                "message" => "You can only update your own attendance records"
            ]);
            exit;
        }
    }
    
    // Get employee_id for cache invalidation
    $stmt = $conn->prepare("SELECT employee_id FROM attendance WHERE id = ?");
    $stmt->bind_param("i", $data['id']);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $employee_id = $result ? $result['employee_id'] : null;
    
    // Calculate hours worked
    $hours_worked = 0;
    if (!empty($data['punch_in']) && !empty($data['punch_out'])) {
        $punch_in_time = strtotime($data['punch_in']);
        $punch_out_time = strtotime($data['punch_out']);
        
        if ($punch_in_time && $punch_out_time) {
            $hours_worked = round(($punch_out_time - $punch_in_time) / 3600, 2);
        }
    }
    
    // Make sure we're storing valid datetime values
    $punch_in = !empty($data['punch_in']) && strtotime($data['punch_in']) ? date('Y-m-d H:i:s', strtotime($data['date'] . ' ' . $data['punch_in'])) : null;
    $punch_out = !empty($data['punch_out']) && strtotime($data['punch_out']) ? date('Y-m-d H:i:s', strtotime($data['date'] . ' ' . $data['punch_out'])) : null;
    
    $stmt = $conn->prepare("UPDATE attendance SET punch_in=?, punch_out=?, date=?, hours_worked=? WHERE id=?");
    $stmt->bind_param("sssdi", $punch_in, $punch_out, $data['date'], $hours_worked, $data['id']);
    
    if ($stmt->execute()) {
        // Clear relevant caches
        $cache->delete('attendance_all');
        if ($employee_id) {
            $cache->delete('attendance_employee_' . $employee_id);
        }
        
        echo json_encode([
            "success" => true,
            "message" => "Attendance record updated successfully.",
            "hours_worked" => $hours_worked
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error updating attendance record: " . $stmt->error
        ]);
    }
}

// Delete attendance
if ($method === 'DELETE') {
    checkAuth();
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        echo json_encode([
            "success" => false,
            "message" => "Attendance ID is required"
        ]);
        exit;
    }
    
    // If regular employee, verify they own this record before deleting
    if (isset($_SESSION['user_id']) && !isset($_SESSION['admin_id'])) {
        $check = $conn->prepare("SELECT employee_id FROM attendance WHERE id = ?");
        $check->bind_param("i", $id);
        $check->execute();
        $result = $check->get_result()->fetch_assoc();
        
        if (!$result || $result['employee_id'] != $_SESSION['user_id']) {
            echo json_encode([
                "success" => false,
                "message" => "You can only delete your own attendance records"
            ]);
            exit;
        }
    }
    
    // Get employee_id for cache invalidation
    $stmt = $conn->prepare("SELECT employee_id FROM attendance WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $employee_id = $result ? $result['employee_id'] : null;
    
    $stmt = $conn->prepare("DELETE FROM attendance WHERE id=?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        // Clear relevant caches
        $cache->delete('attendance_all');
        if ($employee_id) {
            $cache->delete('attendance_employee_' . $employee_id);
        }
        
        echo json_encode([
            "success" => true,
            "message" => "Attendance record deleted successfully."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error deleting attendance record: " . $stmt->error
        ]);
    }
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}
?>
