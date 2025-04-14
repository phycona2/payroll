CREATE DATABASE payroll_system;
USE payroll_system;

-- Employees Table
CREATE TABLE employees (  
  id INT PRIMARY KEY AUTO_INCREMENT,  
  name VARCHAR(100) NOT NULL,  
  email VARCHAR(100) UNIQUE NOT NULL,  
  password VARCHAR(255) NOT NULL,  
  department VARCHAR(50),  
  designation VARCHAR(50),  
  bank_account VARCHAR(30),  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

-- Admin Table
CREATE TABLE admin_users (  
  id INT PRIMARY KEY AUTO_INCREMENT,  
  username VARCHAR(100) UNIQUE NOT NULL,  
  email VARCHAR(100) UNIQUE NOT NULL,  
  password VARCHAR(255) NOT NULL,  
  role ENUM('Admin') DEFAULT 'Admin',  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

-- Attendance Table
CREATE TABLE attendance (  
  id INT PRIMARY KEY AUTO_INCREMENT,  
  employee_id INT,  
  punch_in DATETIME,  
  punch_out DATETIME,  
  date DATE,  
  hours_worked DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE  
);

-- Add triggers to automatically calculate hours_worked
DELIMITER //

-- Trigger for INSERT operations
CREATE TRIGGER before_attendance_insert
BEFORE INSERT ON attendance
FOR EACH ROW
BEGIN
    IF NEW.punch_in IS NOT NULL AND NEW.punch_out IS NOT NULL THEN
        SET NEW.hours_worked = TIMESTAMPDIFF(MINUTE, NEW.punch_in, NEW.punch_out) / 60;
    END IF;
END;
//

-- Trigger for UPDATE operations
CREATE TRIGGER before_attendance_update
BEFORE UPDATE ON attendance
FOR EACH ROW
BEGIN
    IF NEW.punch_in IS NOT NULL AND NEW.punch_out IS NOT NULL THEN
        SET NEW.hours_worked = TIMESTAMPDIFF(MINUTE, NEW.punch_in, NEW.punch_out) / 60;
    END IF;
END;
//

DELIMITER ;

-- Update existing records with calculated hours
UPDATE attendance
SET hours_worked = TIMESTAMPDIFF(MINUTE, punch_in, punch_out) / 60
WHERE punch_in IS NOT NULL AND punch_out IS NOT NULL;

-- Payroll Table
CREATE TABLE payroll (  
  id INT PRIMARY KEY AUTO_INCREMENT,  
  employee_id INT,  
  month DATE,  
  base_salary DECIMAL(10,2),  
  overtime DECIMAL(10,2),  
  deductions DECIMAL(10,2),  
  net_salary DECIMAL(10,2),
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE  
); 

-- Leaves Table
CREATE TABLE leaves (  
  id INT PRIMARY KEY AUTO_INCREMENT,  
  employee_id INT,  
  start_date DATE,  
  end_date DATE,  
  type VARCHAR(50) NOT NULL, -- e.g., "Sick", "Vacation"  
  status VARCHAR(20) DEFAULT "Pending", -- "Approved", "Rejected"  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE  
);

-- Holidays Table
CREATE TABLE holidays (  
  id INT PRIMARY KEY AUTO_INCREMENT,  
  name VARCHAR(100) NOT NULL,  
  date DATE NOT NULL  
);
