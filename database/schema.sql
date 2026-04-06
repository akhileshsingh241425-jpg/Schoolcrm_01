-- ============================================
-- SCHOOL CRM/ERP - Multi-Tenant SaaS System
-- MySQL Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS school_crm;
USE school_crm;

-- ============================================
-- 1. TENANT / SCHOOL MANAGEMENT
-- ============================================

CREATE TABLE schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    logo_url VARCHAR(500),
    website VARCHAR(255),
    theme_color VARCHAR(7) DEFAULT '#1976d2',
    subdomain VARCHAR(100) UNIQUE,
    custom_domain VARCHAR(255),
    plan ENUM('basic', 'standard', 'premium') DEFAULT 'basic',
    subscription_start DATE,
    subscription_end DATE,
    is_active TINYINT(1) DEFAULT 1,
    max_students INT DEFAULT 500,
    max_staff INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE school_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    is_enabled TINYINT(1) DEFAULT 0,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE KEY unique_school_feature (school_id, feature_name)
);

CREATE TABLE school_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE KEY unique_school_setting (school_id, setting_key)
);

-- ============================================
-- 2. USER & ROLE MANAGEMENT
-- ============================================

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    is_system_role TINYINT(1) DEFAULT 0
);

INSERT INTO roles (name, description, is_system_role) VALUES
('super_admin', 'Platform Super Admin', 1),
('school_admin', 'School Administrator', 1),
('teacher', 'Teacher', 1),
('accountant', 'Accountant', 1),
('counselor', 'Counselor / Marketing', 1),
('parent', 'Parent', 1),
('student', 'Student', 1),
('librarian', 'Librarian', 1),
('transport_manager', 'Transport Manager', 1);

CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(100) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    school_id INT,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_perm (role_id, permission_id, school_id)
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    role_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    is_active TINYINT(1) DEFAULT 1,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    UNIQUE KEY unique_school_email (school_id, email)
);

CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- 3. MARKETING & LEAD MANAGEMENT (CRM)
-- ============================================

CREATE TABLE lead_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    status ENUM('planned', 'active', 'completed', 'cancelled') DEFAULT 'planned',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    parent_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    source_id INT,
    campaign_id INT,
    class_interested VARCHAR(50),
    status ENUM('new', 'contacted', 'interested', 'visit_scheduled', 'visited', 'application', 'admitted', 'lost') DEFAULT 'new',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    notes TEXT,
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES lead_sources(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE INDEX idx_leads_school ON leads(school_id);
CREATE INDEX idx_leads_status ON leads(school_id, status);

CREATE TABLE lead_followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    school_id INT NOT NULL,
    followup_type ENUM('call', 'whatsapp', 'email', 'visit', 'sms') NOT NULL,
    notes TEXT,
    followup_date DATETIME NOT NULL,
    status ENUM('pending', 'completed', 'missed') DEFAULT 'pending',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE lead_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    school_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- 4. STUDENT MANAGEMENT
-- ============================================

CREATE TABLE academic_years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current TINYINT(1) DEFAULT 0,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    numeric_name INT,
    description VARCHAR(255),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    class_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 40,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    user_id INT,
    admission_no VARCHAR(50),
    roll_no VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    gender ENUM('male', 'female', 'other'),
    date_of_birth DATE,
    blood_group VARCHAR(5),
    religion VARCHAR(50),
    category VARCHAR(50),
    nationality VARCHAR(50) DEFAULT 'Indian',
    aadhar_no VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    photo_url VARCHAR(500),
    current_class_id INT,
    current_section_id INT,
    academic_year_id INT,
    admission_date DATE,
    status ENUM('active', 'inactive', 'graduated', 'transferred', 'dropout') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (current_class_id) REFERENCES classes(id),
    FOREIGN KEY (current_section_id) REFERENCES sections(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    UNIQUE KEY unique_admission (school_id, admission_no)
);

CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_class ON students(school_id, current_class_id);

CREATE TABLE parent_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    school_id INT NOT NULL,
    relation ENUM('father', 'mother', 'guardian') NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    occupation VARCHAR(100),
    income VARCHAR(50),
    aadhar_no VARCHAR(20),
    address TEXT,
    user_id INT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE student_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    school_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255),
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- ============================================
-- 5. ADMISSION MANAGEMENT
-- ============================================

CREATE TABLE admissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    lead_id INT,
    student_name VARCHAR(255) NOT NULL,
    parent_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    class_applied INT,
    academic_year_id INT,
    application_date DATE,
    status ENUM('applied', 'document_pending', 'under_review', 'test_scheduled', 'test_completed', 'approved', 'rejected', 'enrolled') DEFAULT 'applied',
    remarks TEXT,
    processed_by INT,
    student_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (class_applied) REFERENCES classes(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (processed_by) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- ============================================
-- 6. STAFF / TEACHER MANAGEMENT
-- ============================================

CREATE TABLE staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    user_id INT,
    employee_id VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    gender ENUM('male', 'female', 'other'),
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    qualification VARCHAR(255),
    experience_years INT,
    designation VARCHAR(100),
    department VARCHAR(100),
    date_of_joining DATE,
    salary DECIMAL(12,2),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    photo_url VARCHAR(500),
    aadhar_no VARCHAR(20),
    pan_no VARCHAR(20),
    bank_name VARCHAR(100),
    bank_account_no VARCHAR(50),
    ifsc_code VARCHAR(20),
    status ENUM('active', 'inactive', 'resigned', 'terminated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_employee (school_id, employee_id)
);

CREATE TABLE staff_payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    school_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    basic_salary DECIMAL(12,2),
    allowances DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2),
    payment_status ENUM('pending', 'paid') DEFAULT 'pending',
    payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- ============================================
-- 7. ACADEMIC MANAGEMENT
-- ============================================

CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    type ENUM('theory', 'practical', 'both') DEFAULT 'theory',
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE class_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES staff(id)
);

CREATE TABLE timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_no VARCHAR(20),
    academic_year_id INT,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES staff(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    academic_year_id INT,
    start_date DATE,
    end_date DATE,
    status ENUM('upcoming', 'ongoing', 'completed') DEFAULT 'upcoming',
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

CREATE TABLE exam_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    school_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    max_marks DECIMAL(5,2) NOT NULL,
    passing_marks DECIMAL(5,2),
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE exam_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_schedule_id INT NOT NULL,
    student_id INT NOT NULL,
    school_id INT NOT NULL,
    marks_obtained DECIMAL(5,2),
    grade VARCHAR(5),
    remarks VARCHAR(255),
    FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- ============================================
-- 8. ATTENDANCE MANAGEMENT
-- ============================================

CREATE TABLE student_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    school_id INT NOT NULL,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'half_day', 'leave') NOT NULL,
    remarks VARCHAR(255),
    marked_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id),
    UNIQUE KEY unique_student_date (student_id, date)
);

CREATE INDEX idx_attendance_date ON student_attendance(school_id, date);

CREATE TABLE staff_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    school_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'half_day', 'leave') NOT NULL,
    check_in TIME,
    check_out TIME,
    remarks VARCHAR(255),
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE KEY unique_staff_date (staff_id, date)
);

-- ============================================
-- 9. FEES & PAYMENT
-- ============================================

CREATE TABLE fee_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE fee_structures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    academic_year_id INT,
    class_id INT NOT NULL,
    fee_category_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE,
    frequency ENUM('one_time', 'monthly', 'quarterly', 'half_yearly', 'yearly') DEFAULT 'yearly',
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE CASCADE
);

CREATE TABLE fee_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    student_id INT NOT NULL,
    fee_structure_id INT NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode ENUM('cash', 'online', 'cheque', 'bank_transfer', 'upi') NOT NULL,
    transaction_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    receipt_no VARCHAR(50),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    remarks VARCHAR(255),
    collected_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE CASCADE,
    FOREIGN KEY (collected_by) REFERENCES users(id)
);

CREATE TABLE fee_discounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    student_id INT NOT NULL,
    fee_category_id INT NOT NULL,
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(12,2) NOT NULL,
    reason VARCHAR(255),
    approved_by INT,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- ============================================
-- 10. COMMUNICATION MODULE
-- ============================================

CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_audience ENUM('all', 'students', 'parents', 'teachers', 'staff', 'class_specific') DEFAULT 'all',
    target_class_id INT,
    is_published TINYINT(1) DEFAULT 0,
    published_at TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (target_class_id) REFERENCES classes(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM('sms', 'whatsapp', 'email', 'push', 'in_app') NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sms_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    template TEXT NOT NULL,
    variables JSON,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- ============================================
-- 11. INVENTORY MANAGEMENT
-- ============================================

CREATE TABLE inventory_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INT DEFAULT 0,
    unit VARCHAR(50),
    unit_price DECIMAL(12,2),
    min_stock_level INT DEFAULT 0,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES inventory_categories(id) ON DELETE CASCADE
);

CREATE TABLE inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    item_id INT NOT NULL,
    type ENUM('in', 'out') NOT NULL,
    quantity INT NOT NULL,
    remarks VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- 12. TRANSPORT MANAGEMENT
-- ============================================

CREATE TABLE transport_routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    route_name VARCHAR(255) NOT NULL,
    description TEXT,
    vehicle_no VARCHAR(50),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    helper_name VARCHAR(100),
    helper_phone VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE transport_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    school_id INT NOT NULL,
    stop_name VARCHAR(255) NOT NULL,
    pickup_time TIME,
    drop_time TIME,
    fare DECIMAL(12,2),
    stop_order INT,
    FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE student_transport (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    school_id INT NOT NULL,
    route_id INT NOT NULL,
    stop_id INT NOT NULL,
    pickup_type ENUM('both', 'pickup_only', 'drop_only') DEFAULT 'both',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES transport_stops(id) ON DELETE CASCADE
);

-- ============================================
-- 13. LIBRARY MANAGEMENT
-- ============================================

CREATE TABLE library_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE library_books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(20),
    publisher VARCHAR(255),
    edition VARCHAR(50),
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    rack_no VARCHAR(20),
    price DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES library_categories(id)
);

CREATE TABLE library_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    book_id INT NOT NULL,
    issued_to INT NOT NULL,
    issued_to_type ENUM('student', 'staff') NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    fine_amount DECIMAL(12,2) DEFAULT 0,
    fine_paid TINYINT(1) DEFAULT 0,
    status ENUM('issued', 'returned', 'lost') DEFAULT 'issued',
    issued_by INT,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES library_books(id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(id)
);

-- ============================================
-- 14. SUBSCRIPTION & BILLING (SaaS)
-- ============================================

CREATE TABLE subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    monthly_price DECIMAL(12,2),
    yearly_price DECIMAL(12,2),
    max_students INT,
    max_staff INT,
    features JSON,
    is_active TINYINT(1) DEFAULT 1
);

INSERT INTO subscription_plans (name, description, monthly_price, yearly_price, max_students, max_staff, features) VALUES
('Basic', 'Student + Fees Management', 999.00, 9999.00, 500, 50, '["student_management", "fee_management", "attendance", "communication"]'),
('Standard', 'Basic + CRM + Academics', 2499.00, 24999.00, 2000, 200, '["student_management", "fee_management", "attendance", "communication", "marketing_crm", "admission", "academic", "staff_management"]'),
('Premium', 'All Modules', 4999.00, 49999.00, 10000, 500, '["student_management", "fee_management", "attendance", "communication", "marketing_crm", "admission", "academic", "staff_management", "inventory", "transport", "library", "reports"]');

CREATE TABLE school_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    plan_id INT NOT NULL,
    billing_cycle ENUM('monthly', 'yearly') DEFAULT 'yearly',
    amount DECIMAL(12,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    razorpay_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- ============================================
-- 15. AUDIT LOG
-- ============================================

CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_school ON audit_logs(school_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
