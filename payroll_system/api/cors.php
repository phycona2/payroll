<?php
// Remove any existing CORS headers to prevent duplicates
header_remove('Access-Control-Allow-Origin');
header_remove('Access-Control-Allow-Methods');
header_remove('Access-Control-Allow-Headers');
header_remove('Access-Control-Allow-Credentials');
header_remove('Access-Control-Max-Age');

// Get the requesting origin
$allowedOrigins = [
    'http://localhost:5173',  // Add your frontend URL here
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',  // Add any other development URLs
    'http://localhost:8080'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Set CORS headers
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, x-session-id");
header("Access-Control-Max-Age: 3600");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}
?> 