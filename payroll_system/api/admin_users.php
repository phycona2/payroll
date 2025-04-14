<?php
include 'config.php';
include 'cors.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

// Get all admin users
if ($method === 'GET') {
    $result = $conn->query("SELECT id, username, email, role, created_at FROM admin_users");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
}

// Add new admin user
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (isset($data['username'], $data['email'], $data['password'], $data['role'])) {
        $stmt = $conn->prepare("INSERT INTO admin_users (username, email, password, role) VALUES (?, ?, ?, ?)");
        $password = password_hash($data['password'], PASSWORD_BCRYPT);
        $stmt->bind_param("ssss", 
            $data['username'], 
            $data['email'], 
            $password,
            $data['role']
        );
        
        if ($stmt->execute()) {
            echo json_encode([
                "success" => true,
                "message" => "Admin user created successfully"
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Error creating admin user: " . $stmt->error
            ]);
        }
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Missing required fields"
        ]);
    }
}

// Update admin user
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (isset($data['id'])) {
        $query = "UPDATE admin_users SET ";
        $params = [];
        $types = "";
        
        if (isset($data['username'])) {
            $query .= "username=?, ";
            $params[] = $data['username'];
            $types .= "s";
        }
        if (isset($data['email'])) {
            $query .= "email=?, ";
            $params[] = $data['email'];
            $types .= "s";
        }
        if (isset($data['password'])) {
            $query .= "password=?, ";
            $params[] = password_hash($data['password'], PASSWORD_BCRYPT);
            $types .= "s";
        }
        if (isset($data['role'])) {
            $query .= "role=?, ";
            $params[] = $data['role'];
            $types .= "s";
        }
        
        $query = rtrim($query, ", ") . " WHERE id=?";
        $params[] = $data['id'];
        $types .= "i";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        
        echo json_encode([
            "success" => $stmt->execute(),
            "message" => $stmt->error ? "Update failed: " . $stmt->error : "Admin user updated successfully"
        ]);
    }
}

// Delete admin user
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $conn->prepare("DELETE FROM admin_users WHERE id=?");
        $stmt->bind_param("i", $id);
        echo json_encode([
            "success" => $stmt->execute(),
            "message" => $stmt->error ? "Deletion failed: " . $stmt->error : "Admin user deleted successfully"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No ID provided"
        ]);
    }
}
?>
