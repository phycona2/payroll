<?php
include 'config.php';
include 'cors.php';
session_start();
header("Content-Type: application/json");

// Check if user is authenticated
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Unauthorized. Please log in"
    ]);
    exit;
}

$employee_id = $_SESSION['user_id'];

try {
    // Cache key for this employee's dashboard data
    $cache_key = 'dashboard_employee_' . $employee_id;
    
    // Try to get data from cache first
    $dashboard_data = $cache->remember($cache_key, function() use ($conn, $employee_id) {
        // Get basic employee info
        $stmt = $conn->prepare("SELECT name, email, department, designation FROM employees WHERE id = ?");
        $stmt->bind_param("i", $employee_id);
        $stmt->execute();
        $employee = $stmt->get_result()->fetch_assoc();

        if (!$employee) {
            return null;
        }

        // Get latest attendance record
        $attendance_stmt = $conn->prepare("
            SELECT punch_in, punch_out, hours_worked, date 
            FROM attendance 
            WHERE employee_id = ? 
            ORDER BY date DESC, id DESC 
            LIMIT 1
        ");
        $attendance_stmt->bind_param("i", $employee_id);
        $attendance_stmt->execute();
        $attendance = $attendance_stmt->get_result()->fetch_assoc();

        // Get latest payroll data
        $payroll_stmt = $conn->prepare("
            SELECT base_salary, overtime, deductions, net_salary, month 
            FROM payroll 
            WHERE employee_id = ? 
            ORDER BY month DESC 
            LIMIT 1
        ");
        $payroll_stmt->bind_param("i", $employee_id);
        $payroll_stmt->execute();
        $salary = $payroll_stmt->get_result()->fetch_assoc();

        // Get current month's attendance statistics
        $current_month = date('Y-m-01');
        $time_track_stmt = $conn->prepare("
            SELECT 
                COUNT(DISTINCT date) as days_present,
                SUM(hours_worked) as total_hours 
            FROM attendance 
            WHERE employee_id = ? 
            AND date >= ?
        ");
        $time_track_stmt->bind_param("is", $employee_id, $current_month);
        $time_track_stmt->execute();
        $time_tracking = $time_track_stmt->get_result()->fetch_assoc();

        // Get recent activities (combine attendance and payroll)
        $activity_stmt = $conn->prepare("
            (SELECT 
                'payroll' as type,
                month as date,
                net_salary as amount,
                'Salary Processed' as status
            FROM payroll 
            WHERE employee_id = ?
            ORDER BY month DESC LIMIT 2)
            UNION ALL
            (SELECT 
                'attendance' as type,
                date,
                hours_worked as amount,
                CASE 
                    WHEN punch_out IS NULL THEN 'Punched In'
                    ELSE 'Completed'
                END as status
            FROM attendance 
            WHERE employee_id = ?
            ORDER BY date DESC, id DESC LIMIT 3)
            ORDER BY date DESC
            LIMIT 5
        ");
        $activity_stmt->bind_param("ii", $employee_id, $employee_id);
        $activity_stmt->execute();
        $activities = $activity_stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Get pending leave requests
        $leave_stmt = $conn->prepare("
            SELECT COUNT(*) as pending_leaves 
            FROM leaves 
            WHERE employee_id = ? AND status = 'pending'
        ");
        $leave_stmt->bind_param("i", $employee_id);
        $leave_stmt->execute();
        $leaves = $leave_stmt->get_result()->fetch_assoc();

        return [
            'employee' => $employee,
            'dashboard' => [
                'attendance' => [
                    'last_punch_in' => $attendance['punch_in'] ?? null,
                    'last_punch_out' => $attendance['punch_out'] ?? null,
                    'last_date' => $attendance['date'] ?? null,
                    'hours_worked' => $attendance['hours_worked'] ?? 0
                ],
                'salary' => [
                    'base_salary' => $salary['base_salary'] ?? 0,
                    'overtime' => $salary['overtime'] ?? 0,
                    'deductions' => $salary['deductions'] ?? 0,
                    'net_salary' => $salary['net_salary'] ?? 0,
                    'last_payment_month' => $salary['month'] ?? null
                ],
                'time_tracking' => [
                    'days_present' => $time_tracking['days_present'] ?? 0,
                    'total_hours' => $time_tracking['total_hours'] ?? 0,
                    'current_month' => date('F Y')
                ],
                'leaves' => [
                    'pending_requests' => $leaves['pending_leaves'] ?? 0
                ],
                'recent_activity' => array_map(function($activity) {
                    return [
                        'type' => $activity['type'],
                        'date' => $activity['date'],
                        'amount' => $activity['type'] === 'payroll' 
                            ? number_format($activity['amount'], 2)
                            : number_format($activity['amount'], 1),
                        'status' => $activity['status']
                    ];
                }, $activities)
            ]
        ];
    }, 300); // 5 minute cache

    if ($dashboard_data === null) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Employee not found"
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "data" => $dashboard_data,
        "cached" => $cache->isEnabled()
    ]);

} catch(Exception $e) {
    error_log("Dashboard API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Internal server error",
        "debug" => $e->getMessage()
    ]);
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}
?> 