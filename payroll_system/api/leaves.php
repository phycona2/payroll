<?php
include 'config.php';
include 'cors.php';
session_start();
header("Content-Type: application/json");

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

$method = $_SERVER['REQUEST_METHOD'];

// Get leave records
if ($method === 'GET') {
    checkAuth();
    
    // If employee is logged in, only show their records
    if (isset($_SESSION['user_id']) && !isset($_SESSION['admin_id'])) {
        $employee_id = $_SESSION['user_id'];
        
        // Cache key specific to this employee's leaves
        $cache_key = 'leaves_employee_' . $employee_id;
        
        $leaves_data = $cache->remember($cache_key, function() use ($conn, $employee_id) {
            $stmt = $conn->prepare("SELECT * FROM leaves WHERE employee_id = ?");
            $stmt->bind_param("i", $employee_id);
            $stmt->execute();
            $result = $stmt->get_result();
            return $result->fetch_all(MYSQLI_ASSOC);
        }, 300); // 5 minute cache for employee leaves
    } else {
        // Admin can see all records
        $leaves_data = $cache->remember('leaves_all', function() use ($conn) {
            $result = $conn->query("SELECT l.*, e.name as employee_name 
                                   FROM leaves l 
                                   JOIN employees e ON l.employee_id = e.id");
            return $result->fetch_all(MYSQLI_ASSOC);
        }, 120); // 2 minute cache for admin view
    }
    
    echo json_encode([
        "success" => true,
        "data" => $leaves_data,
        "cached" => $cache->isEnabled() // For debugging
    ]);
}

// Apply for leave
if ($method === 'POST') {
    checkAuth();
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields
    if (!isset($data['employee_id'], $data['start_date'], $data['end_date'], $data['type'])) {
        echo json_encode([
            "success" => false,
            "message" => "Missing required fields"
        ]);
        exit;
    }
    
    // If regular employee, can only apply for their own leave
    if (isset($_SESSION['user_id']) && !isset($_SESSION['admin_id']) && $data['employee_id'] != $_SESSION['user_id']) {
        echo json_encode([
            "success" => false,
            "message" => "You can only apply for your own leave"
        ]);
        exit;
    }
    
    // Set default status to 'pending' if not provided
    $status = $data['status'] ?? 'pending';
    
    $stmt = $conn->prepare("INSERT INTO leaves (employee_id, start_date, end_date, type, status) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("issss", $data['employee_id'], $data['start_date'], $data['end_date'], $data['type'], $status);
    
    if ($stmt->execute()) {
        // Clear relevant caches
        $cache->delete('leaves_all');
        $cache->delete('leaves_employee_' . $data['employee_id']);
        
        echo json_encode([
            "success" => true,
            "message" => "Leave application submitted successfully",
            "id" => $conn->insert_id
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error applying for leave: " . $stmt->error
        ]);
    }
}

// Update leave status
if ($method === 'PUT') {
    checkAuth();
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['id'], $data['status'])) {
        echo json_encode([
            "success" => false,
            "message" => "Leave ID and status are required"
        ]);
        exit;
    }
    
    // Only admin can update status (unless we're allowing employees to cancel their own leave)
    if (!isset($_SESSION['admin_id']) && $data['status'] !== 'cancelled') {
        echo json_encode([
            "success" => false,
            "message" => "Only administrators can update leave status"
        ]);
        exit;
    }
    
    // Get employee_id for cache invalidation
    $stmt = $conn->prepare("SELECT employee_id FROM leaves WHERE id = ?");
    $stmt->bind_param("i", $data['id']);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $employee_id = $result ? $result['employee_id'] : null;
    
    // If employee is trying to cancel, verify it's their own leave
    if (!isset($_SESSION['admin_id']) && isset($_SESSION['user_id'])) {
        if (!$result || $result['employee_id'] != $_SESSION['user_id']) {
            echo json_encode([
                "success" => false,
                "message" => "You can only cancel your own leave applications"
            ]);
            exit;
        }
    }
    
    $stmt = $conn->prepare("UPDATE leaves SET status=? WHERE id=?");
    $stmt->bind_param("si", $data['status'], $data['id']);
    
    if ($stmt->execute()) {
        // Clear relevant caches
        $cache->delete('leaves_all');
        if ($employee_id) {
            $cache->delete('leaves_employee_' . $employee_id);
        }
        
        echo json_encode([
            "success" => true,
            "message" => "Leave status updated successfully"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error updating leave status: " . $stmt->error
        ]);
    }
}

// Delete leave record
if ($method === 'DELETE') {
    checkAuth();
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        echo json_encode([
            "success" => false,
            "message" => "Leave ID is required"
        ]);
        exit;
    }
    
    // Get employee_id for cache invalidation and permission check
    $stmt = $conn->prepare("SELECT employee_id FROM leaves WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if (!$result) {
        echo json_encode([
            "success" => false,
            "message" => "Leave record not found"
        ]);
        exit;
    }
    
    $employee_id = $result['employee_id'];
    
    // If regular employee, verify they own this record before deleting
    if (isset($_SESSION['user_id']) && !isset($_SESSION['admin_id']) && $employee_id != $_SESSION['user_id']) {
        echo json_encode([
            "success" => false,
            "message" => "You can only delete your own leave records"
        ]);
        exit;
    }
    
    $stmt = $conn->prepare("DELETE FROM leaves WHERE id=?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        // Clear relevant caches
        $cache->delete('leaves_all');
        $cache->delete('leaves_employee_' . $employee_id);
        
        echo json_encode([
            "success" => true,
            "message" => "Leave record deleted successfully"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error deleting leave record: " . $stmt->error
        ]);
    }
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}
?>
