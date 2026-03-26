-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'teacher', 'student', 'parent');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "PRO_ID" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" TEXT,
    "gender" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "school_name" TEXT,
    "enrollment_date" TEXT,
    "enrollment_number" TEXT,
    "admission_type" TEXT,
    "academic_status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "relationship" TEXT,
    "occupation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_student_mappings" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "relationship" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "can_make_payments" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "parent_student_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "qualification" TEXT,
    "specialization" TEXT,
    "experience_years" INTEGER,
    "date_of_joining" TEXT,
    "role_type" TEXT,
    "subjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "employment_status" TEXT NOT NULL DEFAULT 'active',
    "gender" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY['classes', 'students', 'enquiries', 'tests', 'homework', 'demos', 'attendance']::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "class_code" TEXT NOT NULL,
    "class_name" TEXT,
    "grade_level" TEXT,
    "academic_year" TEXT,
    "batch_type" TEXT,
    "start_date" TEXT,
    "end_date" TEXT,
    "max_students" INTEGER,
    "current_students_count" INTEGER NOT NULL DEFAULT 0,
    "room_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "course_fee" DOUBLE PRECISION,
    "subject" TEXT,
    "primary_teacher_id" TEXT,
    "class_days" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "class_time_start" TEXT,
    "class_time_end" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_schedules" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject" TEXT,
    "teacher_id" TEXT,
    "time_start" TEXT,
    "time_end" TEXT,
    "days" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_class_enrollments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "enrollment_date" TEXT,
    "enrollment_status" TEXT NOT NULL DEFAULT 'active',
    "overall_attendance_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_marks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank_in_class" INTEGER,

    CONSTRAINT "student_class_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "enquiry_number" TEXT NOT NULL,
    "student_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "parent_name" TEXT,
    "parent_phone" TEXT,
    "parent_email" TEXT,
    "relationship" TEXT,
    "current_class" TEXT,
    "school_name" TEXT,
    "interested_course" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assigned_to" TEXT,
    "followup_count" INTEGER NOT NULL DEFAULT 0,
    "converted_to_student" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiry_remarks" (
    "id" TEXT NOT NULL,
    "enquiry_id" TEXT NOT NULL,
    "remark" TEXT,
    "remark_type" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiry_remarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_classes" (
    "id" TEXT NOT NULL,
    "demo_number" TEXT,
    "enquiry_id" TEXT NOT NULL,
    "demo_date" TEXT,
    "demo_time" TEXT,
    "subject" TEXT,
    "topic" TEXT,
    "class_id" TEXT,
    "teacher_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "demo_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "attendance_date" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "marked_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "test_code" TEXT NOT NULL,
    "test_name" TEXT,
    "class_id" TEXT NOT NULL,
    "subject" TEXT,
    "test_type" TEXT,
    "test_date" TEXT,
    "duration_minutes" INTEGER,
    "total_marks" DOUBLE PRECISION,
    "passing_marks" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "results_published" BOOLEAN NOT NULL DEFAULT false,
    "students_appeared" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "marks_obtained" DOUBLE PRECISION,
    "total_marks" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "grade" TEXT,
    "pass_fail" TEXT,
    "rank_in_class" INTEGER,
    "was_present" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework" (
    "id" TEXT NOT NULL,
    "homework_code" TEXT,
    "title" TEXT,
    "description" TEXT,
    "class_id" TEXT NOT NULL,
    "assigned_date" TEXT,
    "due_date" TEXT,
    "total_marks" DOUBLE PRECISION,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_submissions" (
    "id" TEXT NOT NULL,
    "homework_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "submission_date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "marks_obtained" DOUBLE PRECISION,
    "feedback" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homework_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" TEXT NOT NULL,
    "structure_name" TEXT,
    "class_id" TEXT,
    "academic_year" TEXT,
    "tuition_fee" DOUBLE PRECISION,
    "registration_fee" DOUBLE PRECISION,
    "development_fee" DOUBLE PRECISION,
    "examination_fee" DOUBLE PRECISION,
    "library_fee" DOUBLE PRECISION,
    "total_annual_fee" DOUBLE PRECISION,
    "installment_plan" TEXT,
    "installment_count" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_fee_assignments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fee_structure_id" TEXT,
    "academic_year" TEXT,
    "total_fee" DOUBLE PRECISION,
    "discount_percentage" DOUBLE PRECISION,
    "discount_amount" DOUBLE PRECISION,
    "final_fee" DOUBLE PRECISION,
    "total_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_pending" DOUBLE PRECISION,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "assigned_date" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_fee_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payments" (
    "id" TEXT NOT NULL,
    "payment_number" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "amount_paid" DOUBLE PRECISION,
    "payment_date" TEXT,
    "payment_method" TEXT,
    "transaction_id" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'completed',
    "installment_number" INTEGER,
    "receipt_number" TEXT,
    "receipt_generated_at" TIMESTAMP(3),
    "received_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_PRO_ID_key" ON "students"("PRO_ID");

-- CreateIndex
CREATE INDEX "students_academic_status_idx" ON "students"("academic_status");

-- CreateIndex
CREATE UNIQUE INDEX "parents_user_id_key" ON "parents"("user_id");

-- CreateIndex
CREATE INDEX "parent_student_mappings_parent_id_idx" ON "parent_student_mappings"("parent_id");

-- CreateIndex
CREATE INDEX "parent_student_mappings_student_id_idx" ON "parent_student_mappings"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE INDEX "teachers_employment_status_idx" ON "teachers"("employment_status");

-- CreateIndex
CREATE UNIQUE INDEX "classes_class_code_key" ON "classes"("class_code");

-- CreateIndex
CREATE INDEX "classes_status_idx" ON "classes"("status");

-- CreateIndex
CREATE INDEX "classes_primary_teacher_id_idx" ON "classes"("primary_teacher_id");

-- CreateIndex
CREATE INDEX "class_schedules_class_id_idx" ON "class_schedules"("class_id");

-- CreateIndex
CREATE INDEX "student_class_enrollments_class_id_enrollment_status_idx" ON "student_class_enrollments"("class_id", "enrollment_status");

-- CreateIndex
CREATE INDEX "student_class_enrollments_student_id_enrollment_status_idx" ON "student_class_enrollments"("student_id", "enrollment_status");

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_enquiry_number_key" ON "enquiries"("enquiry_number");

-- CreateIndex
CREATE INDEX "enquiries_status_idx" ON "enquiries"("status");

-- CreateIndex
CREATE INDEX "enquiries_assigned_to_idx" ON "enquiries"("assigned_to");

-- CreateIndex
CREATE INDEX "enquiry_remarks_enquiry_id_idx" ON "enquiry_remarks"("enquiry_id");

-- CreateIndex
CREATE INDEX "demo_classes_enquiry_id_idx" ON "demo_classes"("enquiry_id");

-- CreateIndex
CREATE INDEX "demo_classes_teacher_id_idx" ON "demo_classes"("teacher_id");

-- CreateIndex
CREATE INDEX "demo_classes_status_idx" ON "demo_classes"("status");

-- CreateIndex
CREATE INDEX "attendance_student_id_attendance_date_idx" ON "attendance"("student_id", "attendance_date");

-- CreateIndex
CREATE INDEX "attendance_class_id_attendance_date_idx" ON "attendance"("class_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "tests_test_code_key" ON "tests"("test_code");

-- CreateIndex
CREATE INDEX "tests_class_id_idx" ON "tests"("class_id");

-- CreateIndex
CREATE INDEX "tests_status_idx" ON "tests"("status");

-- CreateIndex
CREATE INDEX "test_results_test_id_idx" ON "test_results"("test_id");

-- CreateIndex
CREATE INDEX "test_results_student_id_idx" ON "test_results"("student_id");

-- CreateIndex
CREATE INDEX "homework_class_id_idx" ON "homework"("class_id");

-- CreateIndex
CREATE INDEX "homework_submissions_homework_id_idx" ON "homework_submissions"("homework_id");

-- CreateIndex
CREATE INDEX "homework_submissions_student_id_idx" ON "homework_submissions"("student_id");

-- CreateIndex
CREATE INDEX "fee_structures_class_id_idx" ON "fee_structures"("class_id");

-- CreateIndex
CREATE INDEX "student_fee_assignments_student_id_idx" ON "student_fee_assignments"("student_id");

-- CreateIndex
CREATE INDEX "student_fee_assignments_payment_status_idx" ON "student_fee_assignments"("payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_payment_number_key" ON "fee_payments"("payment_number");

-- CreateIndex
CREATE INDEX "fee_payments_student_id_idx" ON "fee_payments"("student_id");

-- CreateIndex
CREATE INDEX "fee_payments_payment_status_idx" ON "fee_payments"("payment_status");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_mappings" ADD CONSTRAINT "parent_student_mappings_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_mappings" ADD CONSTRAINT "parent_student_mappings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_primary_teacher_id_fkey" FOREIGN KEY ("primary_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_class_enrollments" ADD CONSTRAINT "student_class_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_class_enrollments" ADD CONSTRAINT "student_class_enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_remarks" ADD CONSTRAINT "enquiry_remarks_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_remarks" ADD CONSTRAINT "enquiry_remarks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_classes" ADD CONSTRAINT "demo_classes_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_classes" ADD CONSTRAINT "demo_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_classes" ADD CONSTRAINT "demo_classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework" ADD CONSTRAINT "homework_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_fee_structure_id_fkey" FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
