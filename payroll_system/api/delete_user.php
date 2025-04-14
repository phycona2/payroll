<?php
include 'config.php';
include 'cors.php';
session_start();

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

// Only allow DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$user_id = $_SESSION['user_id'];
$stmt = $conn->prepare("DELETE FROM employees WHERE id = ?");
$stmt->bind_param("i", $user_id);

if ($stmt->execute()) {
    session_destroy();
    echo json_encode(["success" => true, "message" => "Employee deleted successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Deletion failed"]);
}
?>
