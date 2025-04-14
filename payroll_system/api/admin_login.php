<?php
include 'config.php';
include 'cors.php';
session_start();

header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['email'], $data['password'])) {
    $stmt = $conn->prepare("SELECT id, username, email, password, role FROM admin_users WHERE email = ?");
    $stmt->bind_param("s", $data['email']);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if ($result && password_verify($data['password'], $result['password'])) {
        // Start session and set admin data
        $_SESSION['admin_id'] = $result['id'];
        $_SESSION['admin_username'] = $result['username'];
        $_SESSION['admin_role'] = $result['role'];
        
        // Remove password from result before sending
        unset($result['password']);
        
        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "admin" => $result,
            "sessionId" => session_id()
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Invalid credentials"
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Email and password required"
    ]);
}
?> 