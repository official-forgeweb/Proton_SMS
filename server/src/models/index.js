const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student', 'parent'], required: true },
    is_active: { type: Boolean, default: true },
    is_verified: { type: Boolean, default: true },
    last_login: { type: Date },
    failed_login_attempts: { type: Number, default: 0 },
    locked_until: { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Student Schema
const StudentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    PRO_ID: { type: String, unique: true },
    first_name: String,
    last_name: String,
    date_of_birth: String,
    gender: String,
    email: String,
    phone: String,
    school_name: String,
    enrollment_date: String,
    enrollment_number: String,
    admission_type: String,
    academic_status: { type: String, default: 'active' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Parent Schema
const ParentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    first_name: String,
    last_name: String,
    email: String,
    phone: String,
    relationship: String,
    occupation: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const ParentStudentMappingSchema = new mongoose.Schema({
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    relationship: String,
    is_primary: { type: Boolean, default: true },
    can_make_payments: { type: Boolean, default: true },
});

// Teacher Schema
const TeacherSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employee_id: String,
    first_name: String,
    last_name: String,
    email: String,
    phone: String,
    qualification: String,
    specialization: String,
    experience_years: Number,
    date_of_joining: String,
    role_type: String,
    subjects: [String],
    employment_status: { type: String, default: 'active' },
    gender: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Class Schema
const ClassSchema = new mongoose.Schema({
    class_code: { type: String, unique: true },
    class_name: String,
    grade_level: String,
    subject: String,
    section: String,
    academic_year: String,
    batch_type: String,
    batch_timing: String,
    start_date: String,
    end_date: String,
    class_days: [String],
    class_time_start: String,
    class_time_end: String,
    duration_minutes: Number,
    primary_teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    assistant_teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    max_students: Number,
    current_students_count: { type: Number, default: 0 },
    room_number: String,
    is_online: { type: Boolean, default: false },
    status: { type: String, default: 'ongoing' },
    course_fee: Number,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const StudentClassEnrollmentSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    enrollment_date: String,
    enrollment_status: { type: String, default: 'active' },
    overall_attendance_percentage: { type: Number, default: 0 },
    average_marks: { type: Number, default: 0 },
    rank_in_class: Number,
});

// Enquiry Schema
const EnquirySchema = new mongoose.Schema({
    enquiry_number: { type: String, unique: true },
    student_name: String,
    email: String,
    phone: String,
    parent_name: String,
    parent_phone: String,
    parent_email: String,
    relationship: String,
    current_class: String,
    school_name: String,
    interested_course: String,
    source: String,
    status: { type: String, default: 'new' },
    priority: { type: String, default: 'medium' },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    followup_count: { type: Number, default: 0 },
    converted_to_student: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const EnquiryRemarkSchema = new mongoose.Schema({
    enquiry_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry' },
    remark: String,
    remark_type: String,
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const DemoClassSchema = new mongoose.Schema({
    demo_number: String,
    enquiry_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry' },
    demo_date: String,
    demo_time: String,
    subject: String,
    topic: String,
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    status: { type: String, default: 'scheduled' },
    demo_count: { type: Number, default: 1 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Tests & Attendance
const AttendanceSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    attendance_date: String,
    status: { type: String, enum: ['present', 'absent', 'late'] },
    marked_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const TestSchema = new mongoose.Schema({
    test_code: { type: String, unique: true },
    test_name: String,
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    subject: String,
    test_type: String,
    test_date: String,
    duration_minutes: Number,
    total_marks: Number,
    passing_marks: Number,
    status: { type: String, default: 'scheduled' },
    results_published: { type: Boolean, default: false },
    students_appeared: { type: Number, default: 0 },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const TestResultSchema = new mongoose.Schema({
    test_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    marks_obtained: Number,
    total_marks: Number,
    percentage: Number,
    grade: String,
    pass_fail: String,
    rank_in_class: Number,
    was_present: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const HomeworkSchema = new mongoose.Schema({
    homework_code: String,
    title: String,
    description: String,
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    assigned_date: String,
    due_date: String,
    total_marks: Number,
    attachments: [String],
    status: { type: String, default: 'active' },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const HomeworkSubmissionSchema = new mongoose.Schema({
    homework_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework' },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    submission_date: String,
    status: { type: String, default: 'pending' },
    marks_obtained: Number,
    feedback: String,
    attachments: [String],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Fees
const FeeStructureSchema = new mongoose.Schema({
    structure_name: String,
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    academic_year: String,
    tuition_fee: Number,
    registration_fee: Number,
    development_fee: Number,
    examination_fee: Number,
    library_fee: Number,
    total_annual_fee: Number,
    installment_plan: String,
    installment_count: Number,
    is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const StudentFeeAssignmentSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    fee_structure_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure' },
    academic_year: String,
    total_fee: Number,
    discount_percentage: Number,
    discount_amount: Number,
    final_fee: Number,
    total_paid: { type: Number, default: 0 },
    total_pending: Number,
    payment_status: { type: String, default: 'pending' },
    assigned_date: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const FeePaymentSchema = new mongoose.Schema({
    payment_number: { type: String, unique: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    amount_paid: Number,
    payment_date: String,
    payment_method: String,
    transaction_id: String,
    payment_status: { type: String, default: 'completed' },
    installment_number: Number,
    receipt_number: String,
    receipt_generated_at: Date,
    received_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = {
    User: mongoose.models.User || mongoose.model('User', UserSchema),
    Student: mongoose.models.Student || mongoose.model('Student', StudentSchema),
    Parent: mongoose.models.Parent || mongoose.model('Parent', ParentSchema),
    ParentStudentMapping: mongoose.models.ParentStudentMapping || mongoose.model('ParentStudentMapping', ParentStudentMappingSchema),
    Teacher: mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema),
    Class: mongoose.models.Class || mongoose.model('Class', ClassSchema),
    StudentClassEnrollment: mongoose.models.StudentClassEnrollment || mongoose.model('StudentClassEnrollment', StudentClassEnrollmentSchema),
    Enquiry: mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema),
    EnquiryRemark: mongoose.models.EnquiryRemark || mongoose.model('EnquiryRemark', EnquiryRemarkSchema),
    DemoClass: mongoose.models.DemoClass || mongoose.model('DemoClass', DemoClassSchema),
    Attendance: mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema),
    Test: mongoose.models.Test || mongoose.model('Test', TestSchema),
    TestResult: mongoose.models.TestResult || mongoose.model('TestResult', TestResultSchema),
    Homework: mongoose.models.Homework || mongoose.model('Homework', HomeworkSchema),
    HomeworkSubmission: mongoose.models.HomeworkSubmission || mongoose.model('HomeworkSubmission', HomeworkSubmissionSchema),
    FeeStructure: mongoose.models.FeeStructure || mongoose.model('FeeStructure', FeeStructureSchema),
    StudentFeeAssignment: mongoose.models.StudentFeeAssignment || mongoose.model('StudentFeeAssignment', StudentFeeAssignmentSchema),
    FeePayment: mongoose.models.FeePayment || mongoose.model('FeePayment', FeePaymentSchema),
};
