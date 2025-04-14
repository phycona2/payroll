<?php
include 'config.php';
include 'cors.php';
session_start();
header("Content-Type: application/json");

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized. Admin access required"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Get all employees
if ($method === 'GET') {
    // Use cache for employee list with a 2-minute TTL
    $employees = $cache->remember('all_employees', function() use ($conn) {
        $result = $conn->query("SELECT id, name, email, department, designation, bank_account, created_at FROM employees");
        return $result->fetch_all(MYSQLI_ASSOC);
    }, 120); // 2 minute cache
    
    echo json_encode([
        "success" => true,
        "data" => $employees,
        "cached" => $cache->isEnabled() // For debugging
    ]);
}

// Add an employee
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields
    if (!isset($data['name'], $data['email'], $data['password'], $data['department'], $data['designation'], $data['bank_account'])) {
        echo json_encode(["success" => false, "message" => "Missing required fields"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO employees (name, email, password, department, designation, bank_account) VALUES (?, ?, ?, ?, ?, ?)");
    $password = password_hash($data['password'], PASSWORD_BCRYPT);
    $stmt->bind_param("ssssss", $data['name'], $data['email'], $password, $data['department'], $data['designation'], $data['bank_account']);
    
    if ($stmt->execute()) {
        // Clear the employees cache when adding a new employee
        $cache->delete('all_employees');
        
        echo json_encode(["success" => true, "message" => "Employee added successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error adding employee: " . $stmt->error]);
    }
}

// Update an employee
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['id'])) {
        echo json_encode(["success" => false, "message" => "Employee ID is required"]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE employees SET name=?, email=?, department=?, designation=?, bank_account=? WHERE id=?");
    $stmt->bind_param("sssssi", $data['name'], $data['email'], $data['department'], $data['designation'], $data['bank_account'], $data['id']);
    
    if ($stmt->execute()) {
        // Clear the employees cache when updating an employee
        $cache->delete('all_employees');
        // Also clear any individual employee cache
        $cache->delete('employee_' . $data['id']);
        
        echo json_encode(["success" => true, "message" => "Employee updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error updating employee: " . $stmt->error]);
    }
}

// Delete an employee
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $conn->prepare("DELETE FROM employees WHERE id=?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            // Clear the employees cache when deleting an employee
            $cache->delete('all_employees');
            // Also clear any individual employee cache
            $cache->delete('employee_' . $id);
            
            echo json_encode(["success" => true, "message" => "Employee deleted successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Error deleting employee: " . $stmt->error]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Employee ID is required"]);
    }
}
?>
