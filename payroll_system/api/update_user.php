<?php
include 'config.php';
include 'cors.php';
session_start();

// Add complete CORS headers

header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Check authentication
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

// Only allow PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $_SESSION['user_id'];

// Validate required fields
if (isset($data['name'], $data['email'], $data['department'], $data['designation'], $data['bank_account'])) {
    $stmt = $conn->prepare("UPDATE employees SET name = ?, email = ?, department = ?, designation = ?, bank_account = ? WHERE id = ?");
    $stmt->bind_param("sssssi", 
        $data['name'],
        $data['email'],
        $data['department'],
        $data['designation'],
        $data['bank_account'],
        $user_id
    );

    if ($stmt->execute()) {
        $_SESSION['name'] = $data['name']; // Update session name
        echo json_encode([
            "success" => true, 
            "message" => "Profile updated successfully"
        ]);
    } else {
        echo json_encode([
            "success" => false, 
            "message" => "Update failed: " . $stmt->error
        ]);
    }
} else {
    echo json_encode([
        "success" => false, 
        "message" => "Missing required fields"
    ]);
}
?>
