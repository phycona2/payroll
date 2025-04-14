<?php
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "payroll_system";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

// Include cache helper
require_once __DIR__ . '/cache_helper.php';
$cache = new CacheHelper(300, 'payroll_'); // 5 minute default TTL

// Configure session
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 0); // Set to 1 if using HTTPS
ini_set('session.cookie_samesite', 'Lax');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => false, // Set to true if using HTTPS
    'httponly' => true,
    'samesite' => 'Lax'
]);
?>
