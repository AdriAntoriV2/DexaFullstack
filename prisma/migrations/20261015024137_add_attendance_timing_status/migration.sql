-- CreateEnum
CREATE TYPE "AttendanceTimingStatus" AS ENUM ('EARLY', 'ON_TIME', 'LATE');

-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "check_in_status" "AttendanceTimingStatus",
ADD COLUMN     "check_out_status" "AttendanceTimingStatus";
