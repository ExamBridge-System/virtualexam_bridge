<<<<<<< Updated upstream
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
=======
# TODO: Fix CSV Parsing Issue in CreateExam.js

- [x] Modify handleParseCsv to always use fileInputRef.current.files[0] directly and sync csvFile state
- [x] Update the "Clear" button onClick to reset the file input value
- [x] Update the "Cancel Bulk Upload" button onClick to reset the file input value
>>>>>>> Stashed changes
