from fpdf import FPDF

class SchoolCRMDoc(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(100, 100, 100)
            self.cell(0, 10, 'School CRM - Complete Module Documentation', 0, 0, 'C')
            self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('Helvetica', 'B', 18)
        self.set_text_color(25, 118, 210)
        self.cell(0, 12, title, 0, 1, 'L')
        self.set_draw_color(25, 118, 210)
        self.set_line_width(0.8)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 13)
        self.set_text_color(56, 56, 56)
        self.cell(0, 8, title, 0, 1)
        self.ln(2)

    def sub_section(self, title):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(80, 80, 80)
        self.cell(0, 7, title, 0, 1)
        self.ln(1)

    def body_text(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(60, 60, 60)
        x = self.get_x()
        self.cell(8, 5.5, chr(8226), 0, 0)
        self.multi_cell(0, 5.5, text)

    def table_header(self, cols, widths):
        self.set_font('Helvetica', 'B', 9)
        self.set_fill_color(25, 118, 210)
        self.set_text_color(255, 255, 255)
        for i, col in enumerate(cols):
            self.cell(widths[i], 7, col, 1, 0, 'C', True)
        self.ln()

    def table_row(self, cols, widths, fill=False):
        self.set_font('Helvetica', '', 9)
        self.set_text_color(50, 50, 50)
        if fill:
            self.set_fill_color(240, 245, 255)
        else:
            self.set_fill_color(255, 255, 255)
        max_h = 7
        # Calculate max height needed
        for i, col in enumerate(cols):
            lines = self.multi_cell(widths[i], 5, col, 0, 'L', False, output='LINES') if hasattr(self, '_') else 1
        for i, col in enumerate(cols):
            self.cell(widths[i], 7, col[:int(widths[i]/2.2)], 1, 0, 'L', fill)
        self.ln()

    def add_feature_table(self, features, w1=8, w2=55, w3=127):
        widths = [w1, w2, w3]
        self.table_header(['#', 'Feature', 'Description'], widths)
        for i, (feat, desc) in enumerate(features):
            fill = i % 2 == 0
            self.set_font('Helvetica', '', 9)
            self.set_text_color(50, 50, 50)
            if fill:
                self.set_fill_color(240, 245, 255)
            else:
                self.set_fill_color(255, 255, 255)
            self.cell(w1, 7, str(i+1), 1, 0, 'C', fill)
            self.cell(w2, 7, feat, 1, 0, 'L', fill)
            self.cell(w3, 7, desc[:70], 1, 0, 'L', fill)
            self.ln()
            if self.get_y() > 265:
                self.add_page()

    def check_page_break(self, h=30):
        if self.get_y() + h > 270:
            self.add_page()


pdf = SchoolCRMDoc()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)

# ==================== COVER PAGE ====================
pdf.add_page()
pdf.ln(40)
pdf.set_font('Helvetica', 'B', 36)
pdf.set_text_color(25, 118, 210)
pdf.cell(0, 20, 'School CRM', 0, 1, 'C')
pdf.set_font('Helvetica', '', 18)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 12, 'Complete School Operating System', 0, 1, 'C')
pdf.ln(5)
pdf.set_draw_color(25, 118, 210)
pdf.set_line_width(1)
pdf.line(60, pdf.get_y(), 150, pdf.get_y())
pdf.ln(10)
pdf.set_font('Helvetica', '', 14)
pdf.set_text_color(80, 80, 80)
pdf.cell(0, 10, 'Module Documentation & Feature Specification', 0, 1, 'C')
pdf.ln(5)
pdf.cell(0, 10, '20 Major Modules | 180+ Sub-Features', 0, 1, 'C')
pdf.ln(30)
pdf.set_font('Helvetica', '', 11)
pdf.cell(0, 8, 'Version: 2.0', 0, 1, 'C')
pdf.cell(0, 8, 'Date: April 2026', 0, 1, 'C')
pdf.cell(0, 8, 'Type: Multi-Tenant SaaS Platform', 0, 1, 'C')
pdf.cell(0, 8, 'Stack: Flask + React + MySQL', 0, 1, 'C')

# ==================== TABLE OF CONTENTS ====================
pdf.add_page()
pdf.chapter_title('Table of Contents')
pdf.ln(5)

toc = [
    ('1', 'Admission & Enrollment Lifecycle', '4'),
    ('2', 'Student Complete Lifecycle', '6'),
    ('3', 'Complete Examination System', '8'),
    ('4', 'Academic & Curriculum Management', '10'),
    ('5', 'Attendance Management (Advanced)', '12'),
    ('6', 'HR & Staff Management', '14'),
    ('7', 'Complete Finance System', '16'),
    ('8', 'Parent Engagement', '18'),
    ('9', 'Transport & Fleet Management', '20'),
    ('10', 'Health & Safety', '22'),
    ('11', 'Inventory & Asset Management', '24'),
    ('12', 'Library Management', '26'),
    ('13', 'Hostel Management', '28'),
    ('14', 'Canteen / Cafeteria', '30'),
    ('15', 'Sports & Extra-Curricular', '31'),
    ('16', 'Communication (Multi-Channel)', '33'),
    ('17', 'Compliance & Government', '35'),
    ('18', 'AI / Smart Features', '37'),
    ('19', 'Analytics & Business Intelligence', '39'),
    ('20', 'Multi-Branch & Trust Level', '41'),
]

for num, title, pg in toc:
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(25, 118, 210)
    pdf.cell(12, 8, num, 0, 0)
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(145, 8, title, 0, 0)
    pdf.set_font('Helvetica', '', 11)
    pdf.cell(0, 8, pg, 0, 1, 'R')

# ==================== MODULE 1: ADMISSION ====================
pdf.add_page()
pdf.chapter_title('Module 1: Admission & Enrollment Lifecycle')

pdf.section_title('1.1 Overview')
pdf.body_text('The Admission module handles the complete journey from initial enquiry to final enrollment. It replaces paper-based admission forms, manual seat tracking, and disconnected follow-up processes with a unified digital pipeline.')

pdf.section_title('1.2 Features')
pdf.add_feature_table([
    ('Online Admission Form', 'Parents apply online with document upload from phone/PC'),
    ('Lead Pipeline (Kanban)', 'Enquiry > Follow-up > Campus Visit > Document Verify > Admit'),
    ('Real-time Seat Matrix', 'Class-wise, section-wise available seats dashboard'),
    ('Auto Sibling Detection', 'Same parent 2nd child auto-detect, auto-discount apply'),
    ('Auto TC Generation', 'Transfer Certificate 1-click generate with school stamp'),
    ('Online Entrance Test', 'MCQ test, auto-grading, auto merit list generation'),
    ('Auto Age Verification', 'DOB based class eligibility check, auto-reject if invalid'),
    ('Aadhaar Deduplication', 'Same student cannot be admitted twice across branches'),
    ('Smart Waitlist', 'Seat free hone par auto-notify next parent in queue'),
    ('Document Checklist', 'Auto-verify uploaded docs vs required docs per class'),
    ('Admission Fee Payment', 'Online payment integrated with admission confirmation'),
    ('Bulk Admission Import', 'Excel upload for migrating data from other systems'),
    ('Public School Page', 'Landing page with virtual tour, fee structure, reviews'),
    ('Application Tracking', 'Parents can track application status via SMS/app link'),
    ('Merit List Generator', 'Auto-rank applicants by entrance test + criteria'),
])

pdf.check_page_break(40)
pdf.section_title('1.3 Database Tables')
pdf.body_text('admission_applications - Stores all applications with status tracking\nadmission_documents - Uploaded documents linked to applications\nadmission_tests - Entrance test configuration and questions\nadmission_test_results - Student test scores and rankings\nseat_matrix - Class/section wise seat availability\nwaitlist - Queue management for overbooked classes\nadmission_settings - School-specific admission configuration')

pdf.check_page_break(40)
pdf.section_title('1.4 API Endpoints')
pdf.body_text('POST /api/admissions/apply - Submit new application\nGET /api/admissions/applications - List all applications with filters\nPUT /api/admissions/applications/<id>/status - Update application status\nGET /api/admissions/seat-matrix - Get seat availability\nPOST /api/admissions/entrance-test - Create entrance test\nPOST /api/admissions/entrance-test/<id>/submit - Submit test answers\nGET /api/admissions/merit-list/<class_id> - Generate merit list\nPOST /api/admissions/bulk-import - Import from Excel\nGET /api/admissions/waitlist - View waitlist\nPOST /api/admissions/generate-tc/<student_id> - Generate TC')

pdf.check_page_break(40)
pdf.section_title('1.5 User Roles & Permissions')
pdf.body_text('School Admin - Full access, configure settings, approve admissions\nReceptionist - Create applications, update status, print forms\nCounselor - Follow-up tracking, campus visit scheduling\nAccountant - Fee payment verification, refund processing\nParent (Public) - Online form fill, document upload, track status')

pdf.section_title('1.6 Workflow')
pdf.body_text('1. Parent fills online form OR receptionist creates from walk-in\n2. System auto-checks: age eligibility, seat availability, duplicate\n3. Application moves to document verification stage\n4. If entrance test required, student gets test link/schedule\n5. Merit list auto-generated from test results + criteria\n6. Selected students get admission offer notification\n7. Parent pays admission fee online\n8. System auto-creates student record, assigns section\n9. Rejected/waitlisted parents get notification\n10. Waitlist auto-moves when seats open')

# ==================== MODULE 2: STUDENT ====================
pdf.add_page()
pdf.chapter_title('Module 2: Student Complete Lifecycle')

pdf.section_title('2.1 Overview')
pdf.body_text('360-degree student management from admission to alumni. Every aspect of a student life - academic, behavioral, medical, financial, attendance - accessible from one unified profile.')

pdf.section_title('2.2 Features')
pdf.add_feature_table([
    ('360 Student Profile', 'Academic, medical, behavioral, financial, attendance in 1 screen'),
    ('Smart Section Allocation', 'Gender ratio, merit-based, or random balanced allocation'),
    ('Auto Promotion Engine', 'Rules: min marks + attendance, bulk promote entire class'),
    ('Achievement Portfolio', 'Sports medals, science fair, certificates, awards tracking'),
    ('Special Education (IEP)', 'Individual Education Plan for special needs students'),
    ('Alumni Network', 'Pass-out student database, placements, reunion management'),
    ('Counselor Dashboard', 'Behavioral incidents, counseling sessions, parent meetings'),
    ('Digital Diary', 'Teacher assigns homework, parent sees on phone instantly'),
    ('Student Timeline', 'Chronological log of every event in student school life'),
    ('ID Card Generator', 'Auto-generate ID cards with photo, barcode, QR code'),
    ('Sibling Linking', 'Link siblings for combined reports and fee management'),
    ('Document Vault', 'Birth certificate, Aadhaar, TC, marksheets stored securely'),
    ('Behavior Points', 'Reward/penalty points, leaderboard, parent notification'),
    ('House Assignment', 'Auto-assign to school houses, track house competition points'),
    ('Student Transfer', 'Inter-branch transfer with complete history migration'),
])

pdf.check_page_break(40)
pdf.section_title('2.3 Database Tables')
pdf.body_text('students - Core student data with school_id multi-tenant\nstudent_documents - Uploaded documents vault\nstudent_achievements - Awards, medals, certificates\nstudent_counseling - Counseling session records\nstudent_behavior - Behavior points and incidents\nstudent_medical - Health records, allergies, conditions\nstudent_timeline - Chronological event log\nalumni - Pass-out student records\nstudent_siblings - Sibling relationship mapping')

pdf.check_page_break(40)
pdf.section_title('2.4 API Endpoints')
pdf.body_text('POST /api/students - Create new student\nGET /api/students - List with search, filter, pagination\nGET /api/students/<id>/profile - Full 360 profile\nPUT /api/students/<id> - Update student details\nPOST /api/students/bulk-promote - Promote entire class\nPOST /api/students/<id>/achievements - Add achievement\nGET /api/students/<id>/timeline - Get student timeline\nPOST /api/students/generate-id-card - Generate ID card PDF\nPOST /api/students/section-allocation - Auto-allocate sections\nGET /api/students/alumni - Alumni list with filters\nPOST /api/students/<id>/transfer - Transfer to another branch')

pdf.section_title('2.5 Workflow')
pdf.body_text('1. Student created from admission approval OR manual entry\n2. Auto-assigned to section based on allocation rules\n3. Daily: attendance, homework, classwork tracked\n4. Periodic: exams, grades, report cards generated\n5. Behavioral incidents logged by teachers\n6. Annual: promotion/detention based on defined rules\n7. On leaving: TC generated, moved to alumni database\n8. Alumni: placement tracking, reunion invitations')

# ==================== MODULE 3: EXAMINATION ====================
pdf.add_page()
pdf.chapter_title('Module 3: Complete Examination System')

pdf.section_title('3.1 Overview')
pdf.body_text('End-to-end examination management covering exam scheduling, question bank, hall tickets, marks entry, grading, report cards, and result analysis. Supports CBSE, ICSE, State Board and custom grading systems.')

pdf.section_title('3.2 Features')
pdf.add_feature_table([
    ('AI Exam Scheduler', 'No subject clash, auto room allocation, invigilator auto-assign'),
    ('Question Bank', 'Chapter-wise, difficulty-wise, Blooms taxonomy tagged questions'),
    ('Secure Paper Mgmt', 'Encrypted papers until exam day, digital distribution'),
    ('Bulk Marks Entry', 'Excel upload, OCR OMR scan, barcode-based entry'),
    ('Auto Grading Engine', 'CBSE/ICSE/State board grading system support'),
    ('1-Click Report Card', 'PDF with graphs, teacher remarks, AI-generated analysis'),
    ('Re-exam Workflow', 'Auto-identify failed, reschedule, re-grade workflow'),
    ('Competitive Tracker', 'Olympiad/NTSE/external exam results and preparation'),
    ('Continuous Assessment', 'CCE/FA/SA activity marks, project marks, viva marks'),
    ('Auto Hall Ticket', 'Photo, roll number, exam center, barcode auto-generated'),
    ('Evaluation Tracking', 'Teacher-wise pending/completed answer sheet evaluation'),
    ('Auto Merit List', 'Class-wise, subject-wise, overall toppers auto-generated'),
    ('Grade Analytics', 'Subject difficulty analysis, pass %, topper trends'),
    ('Parent Result Access', 'Parents view results on app with detailed analysis'),
    ('Board Exam Support', 'Registration, admit card, practical marks, IA upload'),
])

pdf.check_page_break(40)
pdf.section_title('3.3 Database Tables')
pdf.body_text('exams - Exam configuration (name, type, dates, classes)\nexam_schedules - Date/time/room per subject per exam\nquestion_bank - Questions with metadata and difficulty tags\nquestion_papers - Generated papers from question bank\nexam_marks - Student marks per subject per exam\ngrade_rules - Grading system configuration\nreport_cards - Generated report card data\nhall_tickets - Hall ticket records\nexam_invigilators - Duty assignment records\ncontinuous_assessment - FA/SA/activity marks')

pdf.check_page_break(40)
pdf.section_title('3.4 API Endpoints')
pdf.body_text('POST /api/exams - Create exam\nGET /api/exams - List exams with filters\nPOST /api/exams/<id>/schedule - Auto-generate schedule\nPOST /api/exams/question-bank - Add questions\nPOST /api/exams/<id>/generate-paper - Generate paper from bank\nPOST /api/exams/<id>/marks - Bulk marks entry\nGET /api/exams/<id>/results - Get results with grading\nPOST /api/exams/<id>/report-cards - Generate report cards\nGET /api/exams/<id>/merit-list - Get merit list\nPOST /api/exams/<id>/hall-tickets - Generate hall tickets\nGET /api/exams/analytics - Exam analytics dashboard')

pdf.section_title('3.5 Workflow')
pdf.body_text('1. Admin creates exam (Unit Test/Mid-term/Final/Board)\n2. AI Scheduler generates conflict-free timetable\n3. Invigilators auto-assigned based on availability\n4. Hall tickets auto-generated for students\n5. Question papers created from question bank OR uploaded\n6. Exam conducted, answer sheets collected\n7. Marks entered via Excel/OMR/manual\n8. System auto-calculates grades per grading rules\n9. Report cards generated with AI remarks\n10. Results published to parent portal\n11. Analytics dashboard shows trends and insights')

# ==================== MODULE 4: ACADEMIC ====================
pdf.add_page()
pdf.chapter_title('Module 4: Academic & Curriculum Management')

pdf.section_title('4.1 Overview')
pdf.body_text('Complete academic management including AI-powered timetable generation, syllabus tracking, lesson planning, homework management, and learning analytics. Ensures curriculum is delivered effectively and students learn optimally.')

pdf.section_title('4.2 Features')
pdf.add_feature_table([
    ('AI Timetable Generator', 'Teacher availability, room capacity, subject sequence auto'),
    ('Syllabus Tracker', 'Chapter-wise completion %, teacher logs daily progress'),
    ('Digital Homework', 'Assign, submit online, grade, plagiarism check'),
    ('Lesson Plan Builder', 'Template-based plans, principal review/approve workflow'),
    ('Virtual Classroom', 'Zoom/Meet integration, recording, auto attendance'),
    ('Resource Library', 'Videos, PDFs, links organized chapter-wise'),
    ('AI Learning Analytics', 'Weak topics identify, personalized recommendations'),
    ('Auto Subject Allocation', 'Teacher specialization + workload balance mapping'),
    ('Remedial Alerts', 'Low marks pattern auto-suggest remedial classes'),
    ('Academic Calendar', 'Holidays, events, exams, PTM all in one place'),
    ('Assignment Tracker', 'Submission tracking, late penalties, teacher grading'),
    ('Study Material Share', 'Teachers upload, students download class-wise'),
    ('Elective Management', 'Student elective choice, conflict check, allocation'),
    ('Lecture Recording', 'Auto-record and store online classes for replay'),
    ('Classroom Insights', 'AI analysis of teaching effectiveness per class'),
])

pdf.check_page_break(40)
pdf.section_title('4.3 Database Tables')
pdf.body_text('timetable - Period-wise schedule per class per day\nsubjects - Subject master with class mapping\nteacher_subjects - Teacher to subject/class mapping\nsyllabus - Chapter/topic structure per subject per class\nsyllabus_progress - Daily completion logs by teachers\nlesson_plans - Teacher lesson plans with approval status\nhomework - Homework assignments with deadlines\nhomework_submissions - Student submissions with grades\nstudy_materials - Uploaded resources per subject/chapter\nacademic_calendar - Events, holidays, exam dates')

pdf.section_title('4.4 API Endpoints')
pdf.body_text('POST /api/academics/timetable/generate - AI generate timetable\nGET /api/academics/timetable/<class_id> - View timetable\nPOST /api/academics/syllabus - Create syllabus structure\nPUT /api/academics/syllabus/<id>/progress - Update progress\nPOST /api/academics/homework - Assign homework\nPOST /api/academics/homework/<id>/submit - Student submit\nGET /api/academics/lesson-plans - List lesson plans\nPOST /api/academics/lesson-plans/<id>/approve - Approve plan\nGET /api/academics/analytics - Learning analytics dashboard\nGET /api/academics/calendar - Academic calendar')

# ==================== MODULE 5: ATTENDANCE ====================
pdf.add_page()
pdf.chapter_title('Module 5: Attendance Management (Advanced)')

pdf.section_title('5.1 Overview')
pdf.body_text('Beyond basic present/absent marking. Supports biometric, RFID, QR code, face recognition and geo-fenced attendance. Period-wise tracking, late arrival detection, leave management, and predictive alerts for attendance patterns.')

pdf.section_title('5.2 Features')
pdf.add_feature_table([
    ('Multi-mode Capture', 'QR/Biometric/RFID/Face Recognition/Manual/GPS-fenced'),
    ('Anti-Proxy System', 'Geo-fence + face verify prevents fake attendance'),
    ('Late Arrival Tracking', 'Gate entry time logged, pattern detect, auto-notify parent'),
    ('Digital Leave Mgmt', 'Apply online, teacher/principal approve, calendar sync'),
    ('Auto Alerts', 'Below 75%? Instant notification to parent and class teacher'),
    ('Unified System', 'Students + teachers + non-teaching staff in one system'),
    ('Period-wise Tracking', 'Every period attendance, bunk detection between periods'),
    ('Medical Leave Upload', 'Medical certificate attached with leave application'),
    ('Partial Attendance', 'Half-day, early leave, late entry all tracked separately'),
    ('Attendance Analytics', 'Trends, class comparison, day-wise patterns, heatmaps'),
    ('Holiday Calendar Sync', 'Auto-skip marking on holidays and vacations'),
    ('Substitute Tracking', 'When substitute teacher, track who took which period'),
    ('Bus Attendance', 'Mark attendance when student boards/exits school bus'),
    ('Event Attendance', 'Sports day, cultural event, trip attendance separately'),
    ('Report Generation', 'Monthly, term-wise, annual reports auto-generated'),
])

pdf.check_page_break(40)
pdf.section_title('5.3 Database Tables')
pdf.body_text('attendance - Daily/period-wise attendance records\nleave_applications - Student/staff leave requests\nleave_types - CL/EL/SL/Medical leave configuration\nattendance_devices - Biometric/RFID device configuration\nlate_arrivals - Gate entry timestamps and patterns\nattendance_rules - Minimum %, alert thresholds per school\nattendance_reports - Pre-generated report cache')

pdf.section_title('5.4 API Endpoints')
pdf.body_text('POST /api/attendance/mark - Mark attendance (manual/device)\nPOST /api/attendance/bulk-mark - Bulk mark for class\nGET /api/attendance/student/<id> - Student attendance history\nPOST /api/attendance/leave/apply - Apply for leave\nPUT /api/attendance/leave/<id>/approve - Approve/reject leave\nGET /api/attendance/analytics - Attendance analytics\nGET /api/attendance/alerts - Low attendance alerts\nGET /api/attendance/report/<class_id> - Class attendance report')

# ==================== MODULE 6: HR & STAFF ====================
pdf.add_page()
pdf.chapter_title('Module 6: HR & Staff Management')

pdf.section_title('6.1 Overview')
pdf.body_text('Complete Human Resource management for teaching and non-teaching staff. From recruitment to exit, covering payroll, leave management, performance appraisal, professional development, and compliance.')

pdf.section_title('6.2 Features')
pdf.add_feature_table([
    ('Recruitment Pipeline', 'Job posting, applications, interview, offer letter workflow'),
    ('Auto Payroll', 'Salary structure, deductions, TDS, PF, ESI auto-calculate'),
    ('Leave Management', 'CL/EL/SL balance, apply, approve, carry forward rules'),
    ('360 Performance Review', 'Self, peer, student, principal rating, goal tracking'),
    ('Professional Dev', 'Training calendar, certifications, CPD points tracking'),
    ('Auto Substitute', 'Teacher absent? Auto-find available substitute teacher'),
    ('Workload Dashboard', 'Periods/week, subjects, sections per teacher visual'),
    ('Digital Staff File', 'PAN, Aadhaar, certificates, experience letters vault'),
    ('Duty Roster', 'Exam duty, assembly, event management auto-rotate'),
    ('Background Verify', 'Police verification, reference check status tracking'),
    ('Contract Management', 'Probation, renewal alerts, increment due tracking'),
    ('Exit Workflow', 'Resignation, handover, clearance, F&F settlement'),
    ('Salary Slip Email', 'Auto-generate and email salary slips monthly'),
    ('Overtime Tracking', 'Extra classes, event hours tracked and compensated'),
    ('Staff Attendance', 'Biometric integrated, late patterns, month reports'),
])

pdf.check_page_break(40)
pdf.section_title('6.3 Database Tables')
pdf.body_text('staff - Core staff data with role, department, designation\nstaff_documents - Document vault per staff\npayroll - Monthly payroll records\nsalary_structure - Basic, HRA, DA, allowances, deductions\nstaff_leave - Leave balance and history\nstaff_leave_applications - Leave requests and approvals\nperformance_reviews - Annual/periodic review records\nrecruitment - Job postings and applications\ntraining_records - Professional development tracking\nduty_roster - Duty assignments with calendar')

pdf.section_title('6.4 API Endpoints')
pdf.body_text('POST /api/staff - Add new staff\nGET /api/staff - List with department/role filters\nGET /api/staff/<id>/profile - Complete staff profile\nPOST /api/staff/payroll/generate - Generate monthly payroll\nGET /api/staff/payroll/<month> - View payroll details\nPOST /api/staff/leave/apply - Apply for leave\nPOST /api/staff/performance/review - Submit review\nGET /api/staff/workload - Teacher workload dashboard\nPOST /api/staff/recruitment/post - Post job opening\nPOST /api/staff/exit/<id> - Initiate exit process')

# ==================== MODULE 7: FINANCE ====================
pdf.add_page()
pdf.chapter_title('Module 7: Complete Finance System')

pdf.section_title('7.1 Overview')
pdf.body_text('Comprehensive financial management covering fee collection, expense tracking, vendor management, budget planning, payroll integration, and complete accounting. Supports online payments, EMI plans, scholarships, and auto-reconciliation.')

pdf.section_title('7.2 Features')
pdf.add_feature_table([
    ('Payment Gateway', 'Razorpay/Stripe - UPI, cards, net banking, auto-reconcile'),
    ('Flexible Fee Builder', 'Class/category/installment wise fee structure builder'),
    ('Auto Late Fee', 'Rules-based auto late fee calculation on overdue amount'),
    ('Scholarship Module', 'Types, eligibility criteria, approval, auto-deduction'),
    ('RTE Compliance', 'Quota tracking, free-ship, government reporting'),
    ('Expense Management', 'Category-wise, vendor-wise, budget vs actual tracking'),
    ('Vendor Management', 'PO, invoice matching, payment, GST reconciliation'),
    ('Payroll Integration', 'Bank file generation, salary slip auto-email'),
    ('Smart Collection', 'Auto-escalation: SMS > WhatsApp > Email > Call > Notice'),
    ('Complete Accounting', 'Day book, ledger, trial balance, P&L, balance sheet'),
    ('GST/TDS Module', 'Auto-calculate tax, return filing data generation'),
    ('Concession Workflow', 'Parent request > accountant review > principal approve'),
    ('Refund Workflow', 'Pro-rata calculation, approval, refund execution'),
    ('Annual Budget', 'Department-wise budget, approval flow, tracking'),
    ('Cheque/DD Tracking', 'Cheque bounce, DD clearing, bank reconciliation'),
    ('EMI/Installment', 'Fee split into EMI, auto-reminders before due date'),
    ('Fee Receipt PDF', 'Auto-generate professional receipt with school logo'),
    ('Financial Dashboard', 'Collection vs target, defaulters, trends, forecasts'),
])

pdf.check_page_break(40)
pdf.section_title('7.3 Database Tables')
pdf.body_text('fee_structures - Fee configuration per class/category\nfee_installments - Installment schedule per student\nfee_payments - Payment transactions with mode/gateway\nfee_receipts - Generated receipt records\nscholarships - Scholarship types and awards\nconcessions - Fee concession requests and approvals\nexpenses - School expense records\nvendors - Vendor master data\npurchase_orders - PO records\nbudgets - Annual budget per department\naccounting_entries - Double-entry accounting ledger\nbank_reconciliation - Bank statement matching records')

pdf.section_title('7.4 API Endpoints')
pdf.body_text('POST /api/fees/structure - Create fee structure\nPOST /api/fees/collect - Record fee payment\nPOST /api/fees/online/initiate - Start online payment\nPOST /api/fees/online/webhook - Payment gateway callback\nGET /api/fees/defaulters - List fee defaulters\nPOST /api/fees/reminder/send - Send payment reminders\nGET /api/fees/receipt/<id> - Generate fee receipt PDF\nPOST /api/fees/scholarship - Award scholarship\nGET /api/fees/dashboard - Financial analytics dashboard\nPOST /api/expenses - Record expense\nGET /api/finance/reports/pnl - Profit & Loss report\nGET /api/finance/reports/balance-sheet - Balance sheet')

# ==================== MODULE 8: PARENT ENGAGEMENT ====================
pdf.add_page()
pdf.chapter_title('Module 8: Parent Engagement')

pdf.section_title('8.1 Overview')
pdf.body_text('Complete parent communication and engagement platform. Parents get real-time visibility into their child academics, attendance, fees, and school activities through app/portal. Two-way communication with teachers and school management.')

pdf.section_title('8.2 Features')
pdf.add_feature_table([
    ('Parent Portal/App', 'Attendance, marks, fees, homework all on phone'),
    ('Online PTM Booking', 'Parent choose time slot, teacher sees dashboard'),
    ('Feedback & Survey', 'Satisfaction surveys, teacher rating, anonymous option'),
    ('Parent Profile Mgmt', 'Auto-reminder to update contact details yearly'),
    ('Live CCTV (Optional)', 'Classroom cameras viewable on parent portal'),
    ('Secure Pickup OTP', 'Authorized person list, OTP-based child release'),
    ('Daily Activity Feed', 'Photos, classwork, teacher notes, meals shared'),
    ('Volunteer Management', 'Parents register for school event volunteering'),
    ('Grievance System', 'Complaint > assign > track > resolve > feedback loop'),
    ('E-Consent Forms', 'Trip permission, photo consent, medical consent digital'),
    ('Fee Payment Online', 'Pay fees, view receipts, download from portal'),
    ('Push Notifications', 'Instant alerts for attendance, results, emergencies'),
    ('Chat with Teacher', 'Secure 1:1 messaging with moderation'),
    ('Report Card Access', 'View/download report cards from portal'),
    ('School Calendar View', 'See all upcoming events, exams, holidays'),
])

pdf.check_page_break(40)
pdf.section_title('8.3 Database Tables')
pdf.body_text('parent_profiles - Parent/guardian data linked to students\nptm_slots - PTM time slot configuration\nptm_bookings - Parent-teacher meeting bookings\nfeedback_surveys - Survey configurations\nfeedback_responses - Parent responses to surveys\ngrievances - Complaint tickets with status tracking\nconsent_forms - Digital consent requests and responses\nparent_notifications - Push notification log\nparent_messages - Secure messaging records')

pdf.section_title('8.4 API Endpoints')
pdf.body_text('GET /api/parent/dashboard - Parent dashboard data\nGET /api/parent/child/<id>/attendance - Child attendance\nGET /api/parent/child/<id>/results - Child exam results\nPOST /api/parent/ptm/book - Book PTM slot\nPOST /api/parent/grievance - Submit grievance\nPOST /api/parent/feedback - Submit survey response\nPOST /api/parent/consent/<id>/respond - Respond to consent\nGET /api/parent/fees/pending - View pending fees\nPOST /api/parent/message/teacher - Message teacher')

# ==================== MODULE 9: TRANSPORT ====================
pdf.add_page()
pdf.chapter_title('Module 9: Transport & Fleet Management')

pdf.section_title('9.1 Overview')
pdf.body_text('Complete fleet management with GPS tracking, route optimization, driver management, vehicle maintenance, and parent real-time tracking. Ensures student safety during commute with automated check-in notifications.')

pdf.section_title('9.2 Features')
pdf.add_feature_table([
    ('Live GPS Tracking', 'Parents see real-time bus location on app map'),
    ('AI Route Optimization', 'Student addresses to optimal routes auto-generate'),
    ('Driving Score', 'Speed, braking, route deviation monitored and scored'),
    ('Dynamic Allocation', 'Student count vs bus capacity auto-balanced'),
    ('RFID Check-in', 'Student boards bus, parent gets instant notification'),
    ('Maintenance Scheduler', 'Service due, insurance renewal, fitness alerts'),
    ('Fuel Management', 'Mileage tracking, consumption analysis, theft detect'),
    ('Transport Fee Link', 'Route-based fee, distance-based auto-calculation'),
    ('Emergency SOS', 'Panic button sends instant alert to management + parents'),
    ('Fleet Dashboard', 'Active, under repair, spare vehicles in one view'),
    ('Driver Management', 'License expiry, medical fitness, behavior tracking'),
    ('Route Change Request', 'Parent request route/stop change, admin approve'),
    ('Trip Management', 'Field trips, special events transport planning'),
    ('Speed Alerts', 'Over-speed notification to admin in real-time'),
    ('Pick/Drop Zones', 'Define safe zones for student pickup and dropoff'),
])

pdf.check_page_break(40)
pdf.section_title('9.3 Database Tables')
pdf.body_text('vehicles - Vehicle master with registration, capacity, status\nroutes - Route definitions with stops and timing\nroute_students - Student-route-stop mapping\ndrivers - Driver data with license and medical details\ngps_tracking - Real-time GPS data points\nvehicle_maintenance - Service and repair records\nfuel_logs - Fuel fill records with mileage\ntransport_fees - Route-based fee structure\nsos_alerts - Emergency alert records\ntrip_management - Special trip planning records')

# ==================== MODULE 10: HEALTH & SAFETY ====================
pdf.add_page()
pdf.chapter_title('Module 10: Health & Safety')

pdf.section_title('10.1 Overview')
pdf.body_text('Complete health and safety management for students and staff. Digital health records, infirmary management, incident reporting, safety drills, visitor management, and mental health tracking.')

pdf.section_title('10.2 Features')
pdf.add_feature_table([
    ('Digital Health Card', 'Blood group, allergies, vaccinations, chronic conditions'),
    ('Infirmary Management', 'Visit log, medicines given, parent auto-notification'),
    ('Health Alerts', 'Fever/illness pattern detect, outbreak early warning'),
    ('Incident Reporting', 'Injury details, first aid, parent info, insurance claim'),
    ('Annual Health Camp', 'Schedule, results, BMI tracking, dental/eye checkup'),
    ('Allergy Alerts', 'Canteen + teacher notified about student food allergies'),
    ('Well-being Tracker', 'Mood check-in, counselor referral, intervention log'),
    ('Safety Drill Log', 'Fire/earthquake drill schedule, execution tracking'),
    ('eVisitor System', 'Gate entry, photo, purpose, OTP to staff, exit time'),
    ('CCTV Integration', 'Incident bookmarking, cloud storage, playback access'),
    ('Emergency Contacts', 'Multi-level emergency contact with auto-dial'),
    ('Medication Tracker', 'Students on regular medication, dose reminders'),
    ('Sanitization Log', 'Classroom/toilet cleaning schedule and verification'),
    ('Temperature Screen', 'Entry temperature check log (post-pandemic ready)'),
    ('Insurance Claims', 'Student accident insurance claim management'),
])

pdf.check_page_break(40)
pdf.section_title('10.3 Database Tables')
pdf.body_text('health_records - Student/staff health profiles\ninfirmary_visits - Infirmary visit log with treatment\nincident_reports - Accident/injury reports\nhealth_checkups - Annual checkup results\nvisitor_logs - Visitor entry/exit records\nsafety_drills - Drill schedule and execution\nmedication_tracking - Regular medication schedules\nemergency_contacts - Multi-level contact hierarchy')

# ==================== MODULE 11: INVENTORY ====================
pdf.add_page()
pdf.chapter_title('Module 11: Inventory & Asset Management')

pdf.section_title('11.1 Overview')
pdf.body_text('Track every school asset from furniture to computers. QR-tagged assets, lab equipment with expiry tracking, automated reorder for supplies, procurement workflow, and depreciation calculation for audits.')

pdf.section_title('11.2 Features')
pdf.add_feature_table([
    ('Asset Register', 'Furniture, computers, projectors with QR code tags'),
    ('Lab Inventory', 'Chemicals, glassware, equipment with expiry tracking'),
    ('Sports Equipment', 'Issue, return, condition tracking per student'),
    ('Auto Reorder', 'Stock below threshold? Auto-generate purchase request'),
    ('Uniform Management', 'Size-wise stock, online ordering by parents'),
    ('IT Asset Management', 'Laptops, tablets, software licenses, warranty alerts'),
    ('Room Management', 'Booking, AV equipment status, maintenance requests'),
    ('Procurement', 'Quotation comparison, PO generation, quality check'),
    ('Depreciation', 'Auto-calculate asset depreciation for audit reports'),
    ('Disposal Workflow', 'Condemn, auction, donate with proper documentation'),
    ('Barcode/QR Scan', 'Scan asset QR to see details, history, location'),
    ('Vendor Comparison', 'Side-by-side vendor quotation analysis'),
    ('Warranty Tracking', 'Warranty expiry alerts with vendor contact info'),
    ('Classroom Furniture', 'Desk, chair, board condition per room tracking'),
    ('Supply Chain', 'Order > receive > inspect > store > issue workflow'),
])

pdf.check_page_break(40)
pdf.section_title('11.3 Database Tables')
pdf.body_text('assets - Master asset register with QR codes\nasset_categories - Asset type classification\nasset_maintenance - Repair and service records\ninventory_items - Consumable stock items\ninventory_transactions - Stock in/out movements\npurchase_requests - Auto/manual purchase requests\npurchase_orders - Approved purchase orders\nvendor_quotations - Vendor wise price comparison\nasset_disposal - Disposal records')

# ==================== MODULE 12: LIBRARY ====================
pdf.add_page()
pdf.chapter_title('Module 12: Library Management')

pdf.section_title('12.1 Overview')
pdf.body_text('Modern library management beyond issue/return. Digital catalog with barcode/RFID, AI book recommendations, e-book integration, automatic fine calculation, and reading analytics to promote reading culture.')

pdf.section_title('12.2 Features')
pdf.add_feature_table([
    ('Digital Catalog', 'Search by title, author, ISBN, subject, barcode scan'),
    ('Barcode/RFID Issue', 'Scan and issue book in 2 seconds flat'),
    ('Auto Fine Calculator', 'Overdue alerts, auto-fine, block further issue'),
    ('AI Recommendations', 'Reading history based personalized suggestions'),
    ('Digital Library', 'E-books, PDFs, online journals integrated'),
    ('Acquisition Module', 'Budget, order, receive, catalog full workflow'),
    ('Serial Management', 'Magazine/periodical subscription and tracking'),
    ('Online Reservation', 'Students reserve books from app before visiting'),
    ('Reading Analytics', 'Student-wise, class-wise reading statistics'),
    ('Condition Tracking', 'Book condition: new, good, fair, poor, damaged, lost'),
    ('Multi-copy Manage', 'Track multiple copies with individual accession nos'),
    ('Label Printing', 'Spine labels, barcode labels auto-print'),
    ('Overdue Reports', 'Email/SMS to students + parents for overdue books'),
    ('Genre Analytics', 'Popular genres, trending books, seasonal patterns'),
    ('Budget Tracking', 'Annual library budget utilization and planning'),
])

pdf.check_page_break(40)
pdf.section_title('12.3 Database Tables')
pdf.body_text('books - Book master with ISBN, author, publisher details\nbook_copies - Individual copies with accession numbers\nbook_issues - Issue/return transactions\nbook_reservations - Online reservation queue\nbook_fines - Fine calculation and payment records\nebook_resources - Digital content library\nperiodicals - Magazine and journal subscriptions\nreading_history - Student reading analytics data\nlibrary_budget - Annual budget and utilization')

# ==================== MODULE 13: HOSTEL ====================
pdf.add_page()
pdf.chapter_title('Module 13: Hostel Management')

pdf.section_title('13.1 Overview')
pdf.body_text('Complete residential school management. Smart room allotment, mess management with meal tracking, hostel-specific attendance, visitor management, outpass system, and warden dashboard for daily operations.')

pdf.section_title('13.2 Features')
pdf.add_feature_table([
    ('Smart Room Allotment', 'Class, gender, preference based auto-allocation'),
    ('Mess Management', 'Menu planning, meal attendance, dietary preferences'),
    ('Hostel Attendance', 'Biometric entry/exit at hostel gate'),
    ('Visitor Log', 'Parent visit schedule, approve, time limit enforcement'),
    ('Hostel Helpdesk', 'Maintenance, food complaint, roommate issue tracking'),
    ('Warden Dashboard', 'Room inspections, night rounds, incident log'),
    ('Hostel Fee', 'Mess charges, room rent, deposit, laundry breakdown'),
    ('Digital Outpass', 'Student apply, warden approve, parent verify via OTP'),
    ('Room Inventory', 'Furniture, fixtures per room tracking'),
    ('Hygiene Inspection', 'Room cleanliness scoring, periodic inspections'),
    ('Medical Emergency', 'Night emergency protocols, hospital contact, parent alert'),
    ('Laundry Management', 'Laundry schedule, item tracking per student'),
])

pdf.check_page_break(40)
pdf.section_title('13.3 Database Tables')
pdf.body_text('hostel_blocks - Block/building master\nhostel_rooms - Room master with capacity and amenities\nhostel_allocations - Student room assignments\nmess_menu - Weekly menu planning\nmess_attendance - Meal-wise attendance\noutpass_requests - Outpass applications and approvals\nhostel_visitors - Visitor log with time tracking\nhostel_complaints - Helpdesk tickets\nhostel_inspections - Room inspection records')

# ==================== MODULE 14: CANTEEN ====================
pdf.add_page()
pdf.chapter_title('Module 14: Canteen / Cafeteria Management')

pdf.section_title('14.1 Overview')
pdf.body_text('Cashless canteen with RFID/app wallet, nutrition planning, spending controls, and allergy safety. Parents can top-up wallet online, set daily limits, and view child spending history.')

pdf.section_title('14.2 Features')
pdf.add_feature_table([
    ('Cashless Payment', 'RFID card or app wallet, parent online top-up'),
    ('Weekly Menu Planner', 'Nutrition-balanced menu published to parents'),
    ('Daily Spending Limit', 'Parent controls daily max spending amount'),
    ('Canteen Analytics', 'Popular items, revenue, wastage tracking reports'),
    ('Allergy Filter', 'Card scan shows student allergies to canteen staff'),
    ('Pre-Order System', 'Students/parents pre-order meals via app'),
    ('Inventory Management', 'Canteen raw material stock and reorder'),
    ('Vendor Management', 'Food supplier management and quality tracking'),
    ('Hygiene Compliance', 'FSSAI compliance, inspection records'),
    ('POS Integration', 'Point-of-sale billing system for canteen counter'),
])

pdf.check_page_break(40)
pdf.section_title('14.3 Database Tables')
pdf.body_text('canteen_wallet - Student wallet balances\ncanteen_transactions - Purchase transactions\ncanteen_menu - Menu items with nutrition info\ncanteen_inventory - Raw material stock\ncanteen_vendors - Food suppliers\ncanteen_preorders - Pre-order records')

# ==================== MODULE 15: SPORTS ====================
pdf.add_page()
pdf.chapter_title('Module 15: Sports & Extra-Curricular')

pdf.section_title('15.1 Overview')
pdf.body_text('Complete sports and extra-curricular activity management. Team management, tournament fixtures, club memberships, event planning, facility booking, and physical fitness tracking for holistic student development.')

pdf.section_title('15.2 Features')
pdf.add_feature_table([
    ('Sports Module', 'Sport-wise teams, practice schedule, match results'),
    ('Tournament Manager', 'Fixtures, scores, medals, certificate generation'),
    ('Club Management', 'Membership, meetings, events, achievements tracking'),
    ('Event Manager', 'Planning, rehearsals, budget, execution, photo gallery'),
    ('Facility Booking', 'Slot-based booking for courts, pools, labs, halls'),
    ('Physical Fitness', 'BMI, 50m run, flexibility tests yearly tracking'),
    ('Inter-school Events', 'External competition registration and results'),
    ('Coach Management', 'Coach assignments, certification, schedule'),
    ('Sports Inventory', 'Equipment issue, return, condition tracking'),
    ('Certificate Generator', 'Auto-generate participation/winner certificates'),
    ('Sports Calendar', 'Annual sports calendar with practice schedules'),
    ('Achievement Board', 'Digital trophy cabinet showcasing school achievements'),
])

pdf.check_page_break(40)
pdf.section_title('15.3 Database Tables')
pdf.body_text('sports - Sport master (Cricket, Football, etc.)\nsports_teams - Team composition per sport per year\ntournaments - Tournament/competition records\ntournament_matches - Match fixtures and results\nclubs - Club/society master\nclub_members - Membership records\nevents - School events with planning details\nfacility_bookings - Room/court/lab booking records\nfitness_records - Physical fitness test results\ncertificates - Generated certificate records')

# ==================== MODULE 16: COMMUNICATION ====================
pdf.add_page()
pdf.chapter_title('Module 16: Communication (Multi-Channel)')

pdf.section_title('16.1 Overview')
pdf.body_text('Multi-channel communication hub connecting school with parents, students, and staff. WhatsApp Business API, bulk SMS, email campaigns, digital notice board, emergency broadcast, and secure parent-teacher messaging.')

pdf.section_title('16.2 Features')
pdf.add_feature_table([
    ('Digital Notice Board', 'Category-wise, audience-wise, acknowledge tracking'),
    ('Emergency Broadcast', '1-click push + SMS + WhatsApp to entire school'),
    ('WhatsApp Business', 'Fee reminders, attendance, results auto-send'),
    ('Read Receipt Track', 'Which parent read notification, which did not'),
    ('Auto Translate', 'Hindi/English/Regional language auto-translate'),
    ('Digital Circular', 'Template, approve workflow, distribute, acknowledge'),
    ('Staff Forums', 'Department-wise internal discussion boards'),
    ('Secure P-T Chat', 'Parent-teacher 1:1 messaging with moderation'),
    ('Email Campaigns', 'Template-based bulk email with tracking'),
    ('SMS Gateway', 'Promotional and transactional SMS with DND filter'),
    ('Push Notifications', 'App push notifications with deep linking'),
    ('Newsletter Builder', 'Monthly school newsletter with drag-drop editor'),
    ('Voice Broadcast', 'Auto voice call for important announcements'),
    ('Communication Log', 'Complete history of all communications per student'),
    ('Template Library', 'Pre-built message templates for common scenarios'),
])

pdf.check_page_break(40)
pdf.section_title('16.3 Database Tables')
pdf.body_text('notices - Notice/circular records\nnotice_recipients - Target audience and read status\nmessages - Chat messages (P-T, staff)\nmessage_threads - Conversation threads\ncommunication_templates - Message templates\ncommunication_logs - All sent communications log\nsms_logs - SMS delivery status tracking\nemail_logs - Email delivery and open tracking\nwhatsapp_logs - WhatsApp message delivery status\nnewsletters - Newsletter content and distribution')

# ==================== MODULE 17: COMPLIANCE ====================
pdf.add_page()
pdf.chapter_title('Module 17: Compliance & Government')

pdf.section_title('17.1 Overview')
pdf.body_text('Stay compliant with all government regulations. Auto-generate UDISE+ data, track RTE compliance, manage board affiliation requirements, handle RTI requests, and maintain safety audit records.')

pdf.section_title('17.2 Features')
pdf.add_feature_table([
    ('UDISE+ Auto Report', 'System data auto-populates UDISE+ report format'),
    ('RTE Dashboard', 'Quota tracking, admission lottery, compliance reports'),
    ('Affiliation Tracker', 'CBSE/ICSE requirements checklist, document management'),
    ('HR Compliance', 'PF, ESI, minimum wage, gratuity tracking for staff'),
    ('RTI Module', 'Request log, deadline tracking, response management'),
    ('Board Exam Support', 'Registration, admit card, practicals, IA upload'),
    ('Safety Audit', 'Fire safety, building safety, POCSO compliance checks'),
    ('Data Privacy', 'Consent management, data retention, deletion requests'),
    ('NOC Management', 'Track all NOCs and approvals from authorities'),
    ('Inspection Ready', 'Dashboard showing compliance status for inspections'),
    ('Document Repository', 'All government documents organized and accessible'),
    ('Deadline Alerts', 'Auto-remind before government filing deadlines'),
])

pdf.check_page_break(40)
pdf.section_title('17.3 Database Tables')
pdf.body_text('compliance_checklist - Regulatory requirement items\ncompliance_status - Status tracking per requirement\nudise_reports - Generated UDISE+ report data\nrte_admissions - RTE quota admission tracking\nrti_requests - RTI request and response log\naffiliation_docs - Board affiliation documents\nsafety_audits - Safety inspection records\ngovernment_filings - Filing deadline and status')

# ==================== MODULE 18: AI FEATURES ====================
pdf.add_page()
pdf.chapter_title('Module 18: AI / Smart Features')

pdf.section_title('18.1 Overview')
pdf.body_text('Artificial Intelligence integrated into every aspect of school operations. Predictive analytics for dropout prevention, smart scheduling, automated content generation, chatbot for 24/7 parent queries, and anomaly detection for fraud prevention.')

pdf.section_title('18.2 Features')
pdf.add_feature_table([
    ('AI Dropout Alert', 'Attendance + marks + fee pattern predicts dropout risk'),
    ('Demand Forecasting', 'Predict next year admission volume for planning'),
    ('Fee Optimizer', 'Area competition + parent income data for optimal fee'),
    ('Teaching Analytics', 'Student results vs teaching pattern effectiveness'),
    ('AI Scheduler', 'Timetable, exam, events conflict-free auto-scheduling'),
    ('School AI Chatbot', 'Parents/students/staff 24/7 query resolution'),
    ('AI Content Gen', 'Report card remarks, newsletter, circular auto-draft'),
    ('Anomaly Detection', 'Fee manipulation, attendance fraud, mark tampering'),
    ('Sentiment Analysis', 'Parent feedback sentiment score, priority ranking'),
    ('Language AI', 'Auto-translate notices to parent preferred language'),
    ('Performance Predict', 'Early warning for students likely to fail'),
    ('Smart Suggestions', 'AI suggests actions based on school data patterns'),
    ('Image Recognition', 'Auto-verify uploaded documents (Aadhaar, TC, etc.)'),
    ('Voice Assistant', 'Voice commands for quick data lookup by staff'),
])

pdf.check_page_break(40)
pdf.section_title('18.3 Technical Implementation')
pdf.body_text('ML Models: scikit-learn/TensorFlow for predictions\nNLP: OpenAI GPT API for content generation and chatbot\nOCR: Tesseract for document scanning and verification\nSentiment: TextBlob/VADER for feedback analysis\nDataset: School historical data trains custom models\nDeployment: Models served via Flask API endpoints\nRetraining: Automated monthly model retraining pipeline')

pdf.section_title('18.4 API Endpoints')
pdf.body_text('GET /api/ai/dropout-risk/<student_id> - Get dropout risk score\nGET /api/ai/demand-forecast - Admission demand prediction\nPOST /api/ai/chatbot - Chat with AI assistant\nPOST /api/ai/generate-remarks - Generate report card remarks\nGET /api/ai/anomalies - Detected anomalies dashboard\nGET /api/ai/sentiment-report - Feedback sentiment analysis\nPOST /api/ai/translate - Translate text to target language\nGET /api/ai/suggestions - AI action suggestions')

# ==================== MODULE 19: ANALYTICS ====================
pdf.add_page()
pdf.chapter_title('Module 19: Analytics & Business Intelligence')

pdf.section_title('19.1 Overview')
pdf.body_text('Transform raw school data into actionable insights. Interactive dashboards, drill-down reports, year-over-year trends, multi-branch benchmarking, custom report builder, and predictive forecasting for school leadership.')

pdf.section_title('19.2 Features')
pdf.add_feature_table([
    ('BI Dashboard', 'Interactive charts, drill-down, real-time data'),
    ('Trend Engine', 'Year-over-year comparison, growth rate tracking'),
    ('School Benchmarking', 'Multi-branch and national average comparison'),
    ('Report Builder', 'Drag-drop custom reports, filters, schedule, export'),
    ('Executive Summary', '1-page school health dashboard for board/trustees'),
    ('Predictive Forecast', 'Enrollment, revenue, expense 3-year projection'),
    ('KPI Tracking', 'Define and monitor key performance indicators'),
    ('Data Export', 'PDF, Excel, CSV export for any report or data'),
    ('Scheduled Reports', 'Auto-generate and email reports weekly/monthly'),
    ('Role-based Views', 'Different dashboard per role (admin, teacher, etc.)'),
    ('Cohort Analysis', 'Track student batches over years for outcomes'),
    ('Funnel Analytics', 'Admission funnel, fee collection funnel analysis'),
    ('Heatmap Views', 'Attendance heatmaps, performance heatmaps'),
    ('Comparison Charts', 'Class vs class, subject vs subject, year vs year'),
])

pdf.check_page_break(40)
pdf.section_title('19.3 Dashboard Components')
pdf.body_text('Overview: Total students, staff, revenue, growth rate\nAdmission: Applications, conversion rate, pipeline\nAcademic: Pass %, topper trends, subject analysis\nFinancial: Collection vs target, defaulters, P&L\nAttendance: Average %, trends, class comparison\nHR: Staff strength, attrition, workload\nMarketing: Lead sources, conversion, ROI\nCompliance: Filing status, pending actions')

pdf.section_title('19.4 API Endpoints')
pdf.body_text('GET /api/analytics/dashboard - Main analytics dashboard\nGET /api/analytics/trends - Year-over-year trends\nGET /api/analytics/kpi - KPI scorecard\nPOST /api/analytics/custom-report - Build custom report\nGET /api/analytics/forecast - Predictive forecasting\nGET /api/analytics/export/<type> - Export report as PDF/Excel\nGET /api/analytics/benchmark - Multi-branch benchmarking\nGET /api/analytics/funnel/<type> - Funnel analysis')

# ==================== MODULE 20: MULTI-BRANCH ====================
pdf.add_page()
pdf.chapter_title('Module 20: Multi-Branch & Trust Level')

pdf.section_title('20.1 Overview')
pdf.body_text('For school groups and educational trusts managing multiple branches. Centralized control with branch-level autonomy. Consolidated reporting, standardized policies, inter-branch transfers, and group purchasing to reduce costs.')

pdf.section_title('20.2 Features')
pdf.add_feature_table([
    ('Multi-Branch View', 'Trust/group level consolidated dashboard'),
    ('Centralized Reports', 'All branches combined analytics and comparison'),
    ('Policy Propagation', 'Define fee/rules once, apply across all branches'),
    ('Student Transfer', '1-click inter-branch transfer with full history'),
    ('Group Purchasing', 'Bulk procurement for all branches, cost saving'),
    ('Standardization', 'Uniform curriculum, exam pattern across branches'),
    ('Branch Comparison', 'Performance ranking among branches'),
    ('Central Admissions', 'Single form for all branches, preference based'),
    ('Shared Resources', 'Teachers, labs, buses shareable across branches'),
    ('Role Hierarchy', 'Trust Admin > Branch Admin > Staff role cascade'),
    ('Data Isolation', 'Branch data strictly separated with trust overview'),
    ('License Management', 'Module-wise feature enable per branch'),
])

pdf.check_page_break(40)
pdf.section_title('20.3 Architecture')
pdf.body_text('Multi-tenant: school_id based data isolation\nTrust Level: trust_id groups multiple schools\nRole Hierarchy: Super Admin > Trust Admin > School Admin > Staff\nData Access: Trust admin sees all branches, school admin sees own\nConfiguration: Trust-level defaults, branch-level overrides\nReporting: Branch-level + consolidated trust-level reports')

pdf.section_title('20.4 API Endpoints')
pdf.body_text('GET /api/trust/dashboard - Trust-level dashboard\nGET /api/trust/branches - List all branches\nPOST /api/trust/policy - Create trust-wide policy\nPOST /api/trust/transfer - Inter-branch student transfer\nGET /api/trust/reports/consolidated - All-branch reports\nGET /api/trust/comparison - Branch comparison metrics\nPOST /api/trust/procurement - Group purchase order')

# ==================== TECH STACK PAGE ====================
pdf.add_page()
pdf.chapter_title('Technology Stack & Architecture')

pdf.section_title('Backend')
pdf.body_text('Language: Python 3.13\nFramework: Flask 3.x with Blueprints\nORM: Flask-SQLAlchemy\nAuth: Flask-JWT-Extended (JWT tokens)\nDatabase: MySQL 8.0 (multi-tenant via school_id)\nCaching: Redis (planned)\nTask Queue: Celery (for async jobs)\nFile Storage: Local / AWS S3\nEmail: Flask-Mail + SendGrid/SES\nSMS: Twilio / MSG91 API\nWhatsApp: WhatsApp Business API / Interakt\nPayment: Razorpay / Stripe SDK\nAI/ML: scikit-learn, TensorFlow, OpenAI API\nOCR: Tesseract / Google Vision API\nPDF: ReportLab / WeasyPrint')

pdf.section_title('Frontend')
pdf.body_text('Framework: React 18 with Hooks\nUI Library: Material UI (MUI) 5\nState Management: Zustand\nRouting: React Router 6\nForms: React Hook Form + Yup validation\nCharts: Chart.js + react-chartjs-2\nHTTP Client: Axios with interceptors\nReal-time: Socket.IO client\nMaps: Google Maps / Leaflet (transport tracking)\nPDF Viewer: react-pdf\nCalendar: FullCalendar React\nDrag & Drop: react-beautiful-dnd (Kanban, timetable)')

pdf.section_title('Infrastructure')
pdf.body_text('Hosting: AWS / DigitalOcean / VPS\nCI/CD: GitHub Actions\nContainerization: Docker + Docker Compose\nReverse Proxy: Nginx\nSSL: Let\'s Encrypt\nMonitoring: Sentry (errors) + Grafana (metrics)\nBackup: Automated daily MySQL dumps to S3\nCDN: CloudFront for static assets')

pdf.section_title('Security')
pdf.body_text('Authentication: JWT with refresh tokens\nAuthorization: Role-based access control (RBAC)\nData Isolation: school_id tenant isolation\nEncryption: HTTPS + AES-256 for sensitive data\nInput Validation: Server + client side\nRate Limiting: Flask-Limiter\nAudit Log: Every action logged with user/timestamp\nCSRF Protection: Token-based\nSQL Injection: ORM parameterized queries\nXSS Prevention: React auto-escaping + CSP headers')

# ==================== SUMMARY ====================
pdf.add_page()
pdf.chapter_title('Summary')

pdf.section_title('Module Count: 20 Major Modules')
pdf.body_text('1. Admission & Enrollment\n2. Student Lifecycle\n3. Examination System\n4. Academic & Curriculum\n5. Attendance (Advanced)\n6. HR & Staff Management\n7. Finance System\n8. Parent Engagement\n9. Transport & Fleet\n10. Health & Safety\n11. Inventory & Assets\n12. Library\n13. Hostel\n14. Canteen\n15. Sports & Extra-Curricular\n16. Communication\n17. Compliance & Government\n18. AI / Smart Features\n19. Analytics & BI\n20. Multi-Branch & Trust')

pdf.section_title('Total Sub-Features: 180+')
pdf.section_title('Total Database Tables: 100+')
pdf.section_title('Total API Endpoints: 200+')
pdf.section_title('Target: Complete School Operating System')

pdf.ln(10)
pdf.body_text('This document serves as the blueprint for building a comprehensive, production-grade School CRM platform that solves every operational challenge faced by modern schools.')

# ==================== OUTPUT ====================
output_path = r'd:\software\school CRM\School_CRM_Complete_Module_Documentation.pdf'
pdf.output(output_path)
print(f'PDF generated successfully: {output_path}')
print(f'Total pages: {pdf.page_no()}')
