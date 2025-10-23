# TODO: Implement Super Admin Dashboard

## Backend Changes
- [x] Update Student Model: Add branch, section, semester fields to backend/models/Student.js
- [x] Update create-users.js: Add super admin user with credentials
- [x] Create backend/routes/admin.js: New routes for uploading teacher timetable CSV, student details CSV, and adding single student
- [x] Update backend/routes/auth.js: Add admin login route and modify unified login for first-time login using roll/ID

## Frontend Changes
- [x] Create frontend/src/components/SuperAdminDashboard.js: New component with forms for CSV uploads and single student addition
- [x] Update frontend/src/components/Login.js: Add option to login as admin or detect role
- [x] Update frontend/src/App.js: Add routes for super admin dashboard

## Followup Steps
- [x] Install multer for file uploads if not present
- [x] Test admin login, CSV uploads, single student add, first-time login flows
