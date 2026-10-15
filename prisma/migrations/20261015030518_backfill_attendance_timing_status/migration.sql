UPDATE attendance_records
SET check_in_status = (
  CASE
    WHEN (check_in_at AT TIME ZONE 'Asia/Jakarta')::time < TIME '08:00'
      THEN 'EARLY'
    WHEN (check_in_at AT TIME ZONE 'Asia/Jakarta')::time < TIME '08:01'
      THEN 'ON_TIME'
    ELSE 'LATE'
  END
)::"AttendanceTimingStatus"
WHERE check_in_at IS NOT NULL
  AND check_in_status IS NULL;

UPDATE attendance_records
SET check_out_status = (
  CASE
    WHEN (check_out_at AT TIME ZONE 'Asia/Jakarta')::time < TIME '17:00'
      THEN 'EARLY'
    WHEN (check_out_at AT TIME ZONE 'Asia/Jakarta')::time < TIME '17:01'
      THEN 'ON_TIME'
    ELSE 'LATE'
  END
)::"AttendanceTimingStatus"
WHERE check_out_at IS NOT NULL
  AND check_out_status IS NULL;