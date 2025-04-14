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

if(isset($data['email'], $data['password'])) {
    $email = $data['email'];
    $password = $data['password'];

    $stmt = $conn->prepare("SELECT id, name, email, password, department, designation FROM employees WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    if ($result && password_verify($password, $result['password'])) {
        // Set session data
        $_SESSION['user_id'] = $result['id'];
        $_SESSION['name'] = $result['name'];
        $_SESSION['email'] = $result['email'];
        $_SESSION['role'] = 'employee';
        
        // Remove sensitive data before sending
        unset($result['password']);
        
        echo json_encode([
            "success" => true, 
            "message" => "Login successful", 
            "user" => $result,
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
