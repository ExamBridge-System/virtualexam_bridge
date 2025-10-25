# TODO: Implement Firebase Storage for Screenshots

## Information Gathered
- Current setup stores screenshots as local files in `backend/uploads/screenshots/` with filenames stored in StudentExam model
- Teachers view screenshots via static file serving at `/uploads/screenshots/filename`
- StudentExam model has screenshots array with questionId, filename, path, uploadedAt
- Frontend displays images using `${BACKEND_URL}/uploads/screenshots/${filename}`
- Need to migrate to Firebase Storage for cloud accessibility

## Plan
1. **Set up Firebase Project and Credentials**
   - Create Firebase project in console
   - Enable Storage
   - Generate service account key
   - Add credentials to backend .env

2. **Install Dependencies**
   - Install firebase-admin SDK in backend

3. **Update StudentExam Model**
   - Change screenshots.filename to screenshots.url (Firebase URL)
   - Remove screenshots.path (not needed for cloud)
   - Keep questionId and uploadedAt

4. **Create Firebase Config**
   - Add firebase.js config file with service account

5. **Update Student Routes (student.js)**
   - Modify upload endpoint to upload to Firebase and store URL
   - Update delete endpoint to remove from Firebase
   - Remove local file operations

6. **Update Teacher Routes (teacher.js)**
   - Ensure submissions endpoint returns Firebase URLs

7. **Update Frontend Components**
   - ViewStudentSubmissions.js: Use Firebase URLs directly
   - Remove BACKEND_URL prefix for screenshots

8. **Migration Script**
   - Optional: Script to upload existing local screenshots to Firebase

## Dependent Files to be edited
- backend/package.json (add firebase-admin)
- backend/models/StudentExam.js (update schema)
- backend/routes/student.js (upload/delete logic)
- backend/routes/teacher.js (submissions data)
- frontend/src/components/ViewStudentSubmissions.js (image URLs)
- New: backend/config/firebase.js (Firebase config)

## Followup steps
- Install firebase-admin: `npm install firebase-admin`
- Set up Firebase project and get service account JSON
- Add FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_STORAGE_BUCKET to .env
- Test upload/delete functionality
- Test teacher viewing screenshots
- Clean up local uploads folder (optional)
