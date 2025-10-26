# TODO: Reduce Field Spaces and Add CSV Downloads in Admin Dashboard

## 1. Adjust CSS for Compact Forms
- [ ] Reduce .form-group margin-bottom from 25px to 15px in index.css
- [ ] Reduce label margin-top from 20px to 10px in index.css
- [ ] Reduce input margin from 10px 0 to 5px 0 in index.css

## 2. Add Download Buttons in SuperAdminDashboard.js
- [ ] Add a new card section for downloads after the hero section
- [ ] Add "Download Teacher Timetables CSV" button
- [ ] Add "Download Student Details CSV" button
- [ ] Implement handleDownloadTeacherTimetables function to call API and trigger download
- [ ] Implement handleDownloadStudentDetails function to call API and trigger download

## 3. Implement Backend Download Routes in admin.js
- [ ] Add /download-teacher-timetable route
  - [ ] Query all teachers from database
  - [ ] Flatten timetable data into CSV rows (TeacherID, Name, Department, Day, Time, Subject, Branch, Section, Batches, Semester)
  - [ ] Use csv-stringify to generate CSV
  - [ ] Send as attachment with filename 'teacher_timetables.csv'
- [ ] Add /download-student-details route
  - [ ] Query all students from database
  - [ ] Generate CSV rows (RollNumber, Name, Email, Class, Batch, Branch, Section, Semester)
  - [ ] Use csv-stringify to generate CSV
  - [ ] Send as attachment with filename 'student_details.csv'

## 4. Testing
- [ ] Run frontend and backend servers
- [ ] Check UI compactness in forms
- [ ] Test download buttons for correct CSV generation and download
