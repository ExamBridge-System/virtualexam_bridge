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
