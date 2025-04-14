<?php
include 'config.php';
include 'cors.php';
session_start();
header("Content-Type: application/json");

// Check if admin is authenticated
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Unauthorized. Admin access required"
    ]);
    exit;
}

try {
    // Cache key for admin dashboard data
    $cache_key = 'admin_dashboard_stats';
    
    // Try to get data from cache first
    $dashboard_data = $cache->remember($cache_key, function() use ($conn) {
        // Get total employees count
        $employee_count = $conn->query("SELECT COUNT(*) as total FROM employees")->fetch_assoc()['total'];

        // Get today's attendance statistics
        $today = date('Y-m-d');
        $attendance_stmt = $conn->prepare("
            SELECT 
                COUNT(*) as total_present,
                SUM(CASE WHEN TIME(punch_in) <= '09:15:00' THEN 1 ELSE 0 END) as on_time,
                SUM(CASE WHEN TIME(punch_in) > '09:15:00' THEN 1 ELSE 0 END) as late
            FROM attendance 
            WHERE date = ?
        ");
        $attendance_stmt->bind_param("s", $today);
        $attendance_stmt->execute();
        $attendance_stats = $attendance_stmt->get_result()->fetch_assoc();

        // Get current month's payroll statistics
        $current_month = date('Y-m-01');
        $payroll_stmt = $conn->prepare("
            SELECT 
                COUNT(*) as total_processed,
                SUM(net_salary) as total_payout,
                COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_payrolls
            FROM payroll 
            WHERE month >= ?
        ");
        $payroll_stmt->bind_param("s", $current_month);
        $payroll_stmt->execute();
        $payroll_stats = $payroll_stmt->get_result()->fetch_assoc();

        // Get pending leave requests
        $leave_stmt = $conn->prepare("
            SELECT l.*, e.name as employee_name
            FROM leaves l
            JOIN employees e ON l.employee_id = e.id
            WHERE l.status = 'pending'
            ORDER BY l.start_date ASC
            LIMIT 5
        ");
        $leave_stmt->execute();
        $pending_leaves = $leave_stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Get recent activities (combine attendance, payroll, and leaves)
        $activity_stmt = $conn->query("
            (SELECT 
                'attendance' as type,
                date as activity_date,
                CONCAT(e.name, ' - ', 
                    CASE 
                        WHEN TIME(punch_in) <= '09:15:00' THEN 'On time'
                        ELSE 'Late'
                    END
                ) as description
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
            ORDER BY date DESC, punch_in DESC
            LIMIT 3)
            UNION ALL
            (SELECT 
                'payroll' as type,
                month as activity_date,
                CONCAT(e.name, ' - Salary: ', net_salary) as description
            FROM payroll p
            JOIN employees e ON p.employee_id = e.id
            ORDER BY month DESC
            LIMIT 3)
            UNION ALL
            (SELECT 
                'leave' as type,
                start_date as activity_date,
                CONCAT(e.name, ' - ', type, ' leave') as description
            FROM leaves l
            JOIN employees e ON l.employee_id = e.id
            ORDER BY start_date DESC
            LIMIT 3)
            ORDER BY activity_date DESC
            LIMIT 10
        ");
        $recent_activities = $activity_stmt->fetch_all(MYSQLI_ASSOC);

        // Get upcoming holidays
        $holiday_stmt = $conn->prepare("
            SELECT *
            FROM holidays
            WHERE date >= CURDATE()
            ORDER BY date ASC
            LIMIT 5
        ");
        $holiday_stmt->execute();
        $upcoming_holidays = $holiday_stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Get department-wise employee count
        $dept_stmt = $conn->query("
            SELECT 
                department,
                COUNT(*) as count
            FROM employees
            GROUP BY department
        ");
        $department_stats = $dept_stmt->fetch_all(MYSQLI_ASSOC);

        return [
            'overview' => [
                'total_employees' => $employee_count,
                'present_today' => $attendance_stats['total_present'] ?? 0,
                'on_time_today' => $attendance_stats['on_time'] ?? 0,
                'late_today' => $attendance_stats['late'] ?? 0
            ],
            'payroll' => [
                'processed_this_month' => $payroll_stats['total_processed'] ?? 0,
                'total_payout' => $payroll_stats['total_payout'] ?? 0,
                'pending_payrolls' => $payroll_stats['pending_payrolls'] ?? 0
            ],
            'leaves' => [
                'pending_requests' => $pending_leaves
            ],
            'activities' => $recent_activities,
            'holidays' => $upcoming_holidays,
            'department_stats' => $department_stats
        ];
    }, 300); // 5 minute cache

    echo json_encode([
        "success" => true,
        "data" => $dashboard_data,
        "cached" => $cache->isEnabled()
    ]);

} catch(Exception $e) {
    error_log("Admin Dashboard API Error: " . $e->getMessage());
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