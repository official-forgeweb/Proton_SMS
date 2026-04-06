-- CreateTable
CREATE TABLE "student_subject_enrollments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "enrollment_date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_subject_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_subject_enrollments_class_id_subject_idx" ON "student_subject_enrollments"("class_id", "subject");

-- CreateIndex
CREATE INDEX "student_subject_enrollments_student_id_idx" ON "student_subject_enrollments"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_subject_enrollments_student_id_class_id_subject_key" ON "student_subject_enrollments"("student_id", "class_id", "subject");

-- AddForeignKey
ALTER TABLE "student_subject_enrollments" ADD CONSTRAINT "student_subject_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subject_enrollments" ADD CONSTRAINT "student_subject_enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
