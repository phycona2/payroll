<?php
include 'config.php';
include 'cors.php';
session_start();

// Add debug logging to help troubleshoot session issues
error_log("Session data: " . print_r($_SESSION, true));
error_log("Cookie data: " . print_r($_COOKIE, true));

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

// Check admin authentication for all write operations
function checkAdminAuth() {
    if (!isset($_SESSION['admin_id'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized. Admin access required"
        ]);
        exit;
    }
}

// Check if user is authenticated (either admin or employee)
function checkAuth() {
    if (!isset($_SESSION['admin_id']) && !isset($_SESSION['user_id'])) {
        error_log("Authentication failed - no valid session found");
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized. Please log in",
            "debug" => [
                "session_id" => session_id(),
                "session_status" => session_status(),
                "session_data" => $_SESSION,
                "cookies" => $_COOKIE
            ]
        ]);
        exit;
    }
    return true;
}

// Get payroll records
if ($method === 'GET') {
    checkAuth();

    // If employee is logged in, only show their records
    if (isset($_SESSION['user_id']) && !isset($_SESSION['admin_id'])) {
        $employee_id = $_SESSION['user_id'];
        
        // Cache key specific to this employee
        $cache_key = 'payroll_employee_' . $employee_id;
        
        $payroll_data = $cache->remember($cache_key, function() use ($conn, $employee_id) {
            $stmt = $conn->prepare("SELECT p.*, e.name as employee_name 
                                   FROM payroll p 
                                   JOIN employees e ON p.employee_id = e.id 
                                   WHERE p.employee_id = ?");
            $stmt->bind_param("i", $employee_id);
            $stmt->execute();
            $result = $stmt->get_result();
            return $result->fetch_all(MYSQLI_ASSOC);
        }, 300); // 5 minute cache for employee payroll
    } else {
        // Admin can see all records - cache with shorter TTL as this data changes more often
        $payroll_data = $cache->remember('payroll_all', function() use ($conn) {
            $result = $conn->query("SELECT p.*, e.name as employee_name 
                                   FROM payroll p 
                                   JOIN employees e ON p.employee_id = e.id");
            return $result->fetch_all(MYSQLI_ASSOC);
        }, 120); // 2 minute cache for admin view
    }

    echo json_encode([
        "success" => true,
        "data" => $payroll_data,
        "user_type" => isset($_SESSION['admin_id']) ? 'admin' : 'employee',
        "cached" => $cache->isEnabled() // For debugging
    ]);
}

// Add payroll record
if ($method === 'POST') {
    checkAdminAuth();
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields
    if (!isset($data['employee_id'], $data['month'], $data['base_salary'], $data['overtime'], $data['deductions'])) {
        echo json_encode([
            "success" => false,
            "message" => "Missing required fields"
        ]);
        exit;
    }

    // Format the month to be MySQL compatible (YYYY-MM-DD)
    $formatted_month = date('Y-m-01', strtotime($data['month'] . '-01'));
    
    // Validate the date
    if ($formatted_month === false || $formatted_month === '1970-01-01') {
        echo json_encode([
            "success" => false,
            "message" => "Invalid month format. Please use YYYY-MM format"
        ]);
        exit;
    }

    // Calculate net salary
    $net_salary = $data['base_salary'] + $data['overtime'] - $data['deductions'];
    
    // Use provided status or default to "Pending"
    $status = $data['status'] ?? "Pending";

    $stmt = $conn->prepare("INSERT INTO payroll (employee_id, month, base_salary, overtime, deductions, net_salary, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issddds", 
        $data['employee_id'],
        $formatted_month, // Use the formatted date
        $data['base_salary'],
        $data['overtime'],
        $data['deductions'],
        $net_salary,
        $status
    );

    if ($stmt->execute()) {
        // Clear relevant caches
        $cache->delete('payroll_all');
        $cache->delete('payroll_employee_' . $data['employee_id']);
        
        echo json_encode([
            "success" => true,
            "message" => "Payroll record added successfully",
            "data" => [
                "id" => $conn->insert_id,
                "employee_id" => $data['employee_id'],
                "month" => $data['month'],
                "base_salary" => $data['base_salary'],
                "overtime" => $data['overtime'],
                "deductions" => $data['deductions'],
                "net_salary" => $net_salary,
                "status" => $status
            ]
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error adding payroll record: " . $stmt->error
        ]);
    }
}

// Update payroll record
if ($method === 'PUT') {
    checkAdminAuth();
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['id'])) {
        echo json_encode([
            "success" => false,
            "message" => "Payroll ID is required"
        ]);
        exit;
    }

    // Get employee_id and current record for cache invalidation
    $stmt = $conn->prepare("SELECT employee_id, month, base_salary, overtime, deductions, net_salary FROM payroll WHERE id = ?");
    $stmt->bind_param("i", $data['id']);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if (!$result) {
        echo json_encode([
            "success" => false,
            "message" => "Payroll record not found"
        ]);
        exit;
    }

    $employee_id = $result['employee_id'];

    // If only status needs to be updated (ignore other fields if they're present)
    if (isset($data['status']) && !isset($data['base_salary']) && !isset($data['overtime']) && !isset($data['deductions'])) {
        $stmt = $conn->prepare("UPDATE payroll SET status = ? WHERE id = ?");
        $stmt->bind_param("si", $data['status'], $data['id']);
    } else {
        // Format the month if it's being updated
        $formatted_month = date('Y-m-01', strtotime($data['month'] . '-01'));
        
        // Validate the date
        if ($formatted_month === false || $formatted_month === '1970-01-01') {
            echo json_encode([
                "success" => false,
                "message" => "Invalid month format. Please use YYYY-MM format"
            ]);
            exit;
        }

        // Calculate net salary for full update
        $net_salary = $data['base_salary'] + $data['overtime'] - $data['deductions'];
        
        $stmt = $conn->prepare("UPDATE payroll SET month = ?, base_salary = ?, overtime = ?, deductions = ?, net_salary = ?, status = ? WHERE id = ?");
        $stmt->bind_param("sddddsi", 
            $formatted_month, // Use the formatted date
            $data['base_salary'],
            $data['overtime'],
            $data['deductions'],
            $net_salary,
            $data['status'] ?? $result['status'],
            $data['id']
        );
    }

    if ($stmt->execute()) {
        // Clear relevant caches
        $cache->delete('payroll_all');
        if ($employee_id) {
            $cache->delete('payroll_employee_' . $employee_id);
        }
        
        // Get updated record
        $stmt = $conn->prepare("SELECT p.*, e.name as employee_name FROM payroll p JOIN employees e ON p.employee_id = e.id WHERE p.id = ?");
        $stmt->bind_param("i", $data['id']);
        $stmt->execute();
        $updated_record = $stmt->get_result()->fetch_assoc();
        
        echo json_encode([
            "success" => true,
            "message" => "Payroll record updated successfully",
            "data" => $updated_record
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error updating payroll record: " . $stmt->error
        ]);
    }
}

// Delete payroll record
if ($method === 'DELETE') {
    checkAdminAuth();
    $id = $_GET['id'] ?? null;
    if ($id) {
        // Get employee_id for cache invalidation
        $stmt = $conn->prepare("SELECT employee_id FROM payroll WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $employee_id = $result ? $result['employee_id'] : null;
        
        $stmt = $conn->prepare("DELETE FROM payroll WHERE id=?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            // Clear relevant caches
            $cache->delete('payroll_all');
            if ($employee_id) {
                $cache->delete('payroll_employee_' . $employee_id);
            }
            
            echo json_encode([
                "success" => true,
                "message" => "Payroll record deleted successfully"
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Error deleting payroll record: " . $stmt->error
            ]);
        }
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Payroll ID is required"
        ]);
    }
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}
?>
