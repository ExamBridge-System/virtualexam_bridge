# TODO: Update Student Dashboard to Show Upcoming Exams with Countdown

## Backend Changes
- [ ] Modify GET /student/exams route in backend/routes/student.js to filter for upcoming exams (scheduledDate + scheduledTime > current time).
- [ ] Ensure the response includes scheduledDate and scheduledTime for countdown calculation.

## Frontend Changes
- [ ] Update frontend/src/components/StudentDashboard.js to display upcoming exams instead of available exams.
- [ ] Add logic to calculate time until exam start.
- [ ] For exams starting within 15 minutes, display a live countdown timer updating every second.
- [ ] Style the countdown appropriately (e.g., red color when close).

## Testing
- [ ] Test that only upcoming exams are displayed.
- [ ] Test countdown timer for exams within 15 minutes.
- [ ] Verify timer updates every second and handles edge cases (e.g., exam starts).
