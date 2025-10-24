<<<<<<< HEAD
# TODO: Remove class field from exams, add branch and section fields

## Backend Changes
- [ ] Update backend/models/Exam.js: Remove 'class' field, add 'branch' and 'section' fields
- [ ] Update backend/routes/exam.js: Change exam creation route to accept 'branch' and 'section' instead of 'class'
- [ ] Update backend/routes/student.js: Modify exam filtering to match where `${exam.branch}-${exam.section}` === student.class

## Frontend Changes
- [ ] Update frontend/src/components/CreateExam.js: Replace class select with separate branch and section selects
- [ ] Update frontend/src/components/TeacherDashboard.js: Display `${exam.branch}-${exam.section}` instead of exam.class
- [ ] Update frontend/src/components/ViewStudentSubmissions.js: Display `${exam.branch}-${exam.section}` instead of exam.class
- [ ] Update frontend/src/components/TakeExam.js: Display `${exam.branch}-${exam.section}` instead of exam.class
- [ ] Update frontend/src/components/StudentDashboard.js: Display `${exam.branch}-${exam.section}` instead of exam.class

## Testing
- [ ] Test exam creation with branch and section
- [ ] Test exam display in teacher dashboard
- [ ] Test student exam visibility (only matching branch-section)
- [ ] Test student submissions view
=======
# TODO: Add Default Email and Change/Verify Option in Student Dashboard

## Backend Changes
- [ ] Update Student model to make email optional but unique
- [ ] Update student registration in auth.js to allow no email
- [ ] Install nodemailer for email sending
- [ ] Add route to send verification code to new email (/student/send-verification-code)
- [ ] Add route to verify code and update email (/student/verify-email)

## Frontend Changes
- [ ] Update StudentDashboard to show email in info card with "Edit" button
- [ ] Add modal for email change with two steps: enter new email and send code, then enter code to verify
- [ ] Update api.js with functions for new endpoints

## Testing
- [ ] Test email sending (configure SMTP)
- [ ] Test email change flow in dashboard
- [ ] Ensure forgot password can use the email later
>>>>>>> origin/dev
