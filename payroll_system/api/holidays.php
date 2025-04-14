<?php
include 'config.php';
include 'cors.php';
session_start();
header("Content-Type: application/json");

// Check admin authentication for write operations
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

$method = $_SERVER['REQUEST_METHOD'];

// Get holidays
if ($method === 'GET') {
    // Holidays can be viewed by anyone, and they don't change often
    // So we can cache them for longer periods
    $holidays = $cache->remember('holidays_all', function() use ($conn) {
        $result = $conn->query("SELECT * FROM holidays ORDER BY date");
        return $result->fetch_all(MYSQLI_ASSOC);
    }, 3600); // 1 hour cache for holidays
    
    echo json_encode([
        "success" => true,
        "data" => $holidays,
        "cached" => $cache->isEnabled() // For debugging
    ]);
}

// Add a holiday
if ($method === 'POST') {
    checkAdminAuth();
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['name'], $data['date'])) {
        echo json_encode([
            "success" => false,
            "message" => "Holiday name and date are required"
        ]);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO holidays (name, date) VALUES (?, ?)");
    $stmt->bind_param("ss", $data['name'], $data['date']);
    
    if ($stmt->execute()) {
        // Clear holidays cache
        $cache->delete('holidays_all');
        
        echo json_encode([
            "success" => true,
            "message" => "Holiday added successfully",
            "id" => $conn->insert_id
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error adding holiday: " . $stmt->error
        ]);
    }
}

// Delete a holiday
if ($method === 'DELETE') {
    checkAdminAuth();
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        echo json_encode([
            "success" => false,
            "message" => "Holiday ID is required"
        ]);
        exit;
    }
    
    $stmt = $conn->prepare("DELETE FROM holidays WHERE id=?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        // Clear holidays cache
        $cache->delete('holidays_all');
        
        echo json_encode([
            "success" => true,
            "message" => "Holiday deleted successfully"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error deleting holiday: " . $stmt->error
        ]);
    }
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}
?>
