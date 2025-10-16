# TODO: Modify Exam Portal for Screenshot Removal and One-Time Attendance

## Backend Changes
- [x] Add DELETE route in `backend/routes/student.js` to remove a specific screenshot by filename
- [x] Modify access check in `backend/routes/student.js` to prevent access if exam status is 'submitted'

## Frontend Changes
- [x] Update `frontend/src/components/TakeExam.js` to add remove buttons for each uploaded screenshot
- [ ] Update `frontend/src/components/StudentDashboard.js` to check submission status before allowing exam access

## Testing
- [ ] Test screenshot removal functionality
- [ ] Test that submitted exams cannot be accessed again
- [ ] Ensure UI updates correctly after removal
