<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);


include 'config.php';
include 'cors.php';
session_start();


header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$data = json_decode(file_get_contents("php://input"), true);

if(isset($data['name'], $data['email'], $data['password'], $data['department'], $data['designation'], $data['bank_account'])) {
    // First check if email already exists
    $check_stmt = $conn->prepare("SELECT id FROM employees WHERE email = ?");
    $check_stmt->bind_param("s", $data['email']);
    $check_stmt->execute();
    $exists = $check_stmt->get_result()->fetch_assoc();
    
    if ($exists) {
        echo json_encode([
            "success" => false, 
            "message" => "Email already registered"
        ]);
        exit;
    }

    $name = $data['name'];
    $email = $data['email'];
    $password = password_hash($data['password'], PASSWORD_BCRYPT);
    $department = $data['department'];
    $designation = $data['designation'];
    $bank_account = $data['bank_account'];

    $stmt = $conn->prepare("INSERT INTO employees (name, email, password, department, designation, bank_account) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $name, $email, $password, $department, $designation, $bank_account);

    if ($stmt->execute()) {
        // Get the newly created user's ID
        $new_user_id = $stmt->insert_id;
        
        // Start session for the new user
        $_SESSION['user_id'] = $new_user_id;
        $_SESSION['name'] = $name;
        $_SESSION['email'] = $email;
        $_SESSION['role'] = 'employee';

        echo json_encode([
            "success" => true,
            "message" => "Employee registered successfully",
            "user" => [
                "id" => $new_user_id,
                "name" => $name,
                "email" => $email,
                "department" => $department,
                "designation" => $designation
            ],
            "sessionId" => session_id()
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error: " . $stmt->error
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required"
    ]);
}
?>
