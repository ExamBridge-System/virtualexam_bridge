import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // State for teacher timetable upload
  const [teacherForm, setTeacherForm] = useState({
    teacherId: '',
    name: '',
    department: '',
    timetableFile: null,
  });

  // State for student details upload
  const [studentUploadForm, setStudentUploadForm] = useState({
    branch: '',
    section: '',
    semester: '',
    studentsFile: null,
  });

  // State for single student addition
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    class: '',
    batch: '',
    branch: '',
    section: '',
    semester: '',
  });

  const handleStudentFormChange = (e) => {
    setStudentForm({
      ...studentForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.post('/admin/add-student', studentForm);
      setMessage('Student added successfully!');
      setStudentForm({
        name: '',
        email: '',
        rollNumber: '',
        class: '',
        batch: '',
        branch: '',
        section: '',
        semester: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding student');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'timetableFile') {
      setTeacherForm({
        ...teacherForm,
        [name]: files[0],
      });
    } else {
      setTeacherForm({
        ...teacherForm,
        [name]: value,
      });
    }
  };

  const handleStudentUploadFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'studentsFile') {
      setStudentUploadForm({
        ...studentUploadForm,
        [name]: files[0],
      });
    } else {
      setStudentUploadForm({
        ...studentUploadForm,
        [name]: value,
      });
    }
  };

  const handleTeacherTimetableUpload = async (e) => {
    e.preventDefault();
    if (!teacherForm.timetableFile) {
      setError('Please select a timetable file');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    const formData = new FormData();
    formData.append('timetable', teacherForm.timetableFile);
    formData.append('teacherId', teacherForm.teacherId);
    formData.append('name', teacherForm.name);
    formData.append('department', teacherForm.department);

    try {
      await api.post('/admin/upload-teacher-timetable', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Teacher timetable uploaded successfully!');
      setTeacherForm({
        teacherId: '',
        name: '',
        department: '',
        timetableFile: null,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentDetailsUpload = async (e) => {
    e.preventDefault();
    if (!studentUploadForm.studentsFile) {
      setError('Please select a students file');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    const formData = new FormData();
    formData.append('students', studentUploadForm.studentsFile);
    formData.append('branch', studentUploadForm.branch);
    formData.append('section', studentUploadForm.section);
    formData.append('semester', studentUploadForm.semester);

    try {
      await api.post('/admin/upload-student-details', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Student details uploaded successfully!');
      setStudentUploadForm({
        branch: '',
        section: '',
        semester: '',
        studentsFile: null,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading student details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar */}
      <nav className="navbar">
        <h2>Admin Portal</h2>
        <div className="navbar-right">
          <span>Welcome, <strong>{user?.name}</strong></span>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn btn-danger"
            style={{ padding: '10px 20px' }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <h1>Welcome, Super Admin!</h1>
          <p>Manage teacher timetables, student details, and system administration</p>
        </div>

        {/* Messages */}
        {message && (
          <div
            className="alert alert-success"
            style={{
              position: 'fixed',
              top: '80px',
              right: '20px',
              zIndex: 1000,
              maxWidth: '400px',
              padding: '15px',
              borderRadius: '5px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
          >
            {message}
          </div>
        )}
        {error && (
          <div
            className="alert alert-danger"
            style={{
              position: 'fixed',
              top: '80px',
              right: '20px',
              zIndex: 1000,
              maxWidth: '400px',
              padding: '15px',
              borderRadius: '5px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
          >
            {error}
          </div>
        )}

        {/* Upload Teacher Timetable CSV */}
        <div className="card">
          <h2>Upload Teacher Timetable CSV</h2>
          <p>Upload a CSV file with teacher timetable data. Expected columns: day, time, subject, branch, section, batches, semester</p>
          <form onSubmit={handleTeacherTimetableUpload}>
            <div className="form-group">
              <label>Teacher ID</label>
              <input
                type="text"
                name="teacherId"
                value={teacherForm.teacherId}
                onChange={handleTeacherFormChange}
                required
                placeholder="Enter teacher ID"
              />
            </div>
            <div className="form-group">
              <label>Teacher Name</label>
              <input
                type="text"
                name="name"
                value={teacherForm.name}
                onChange={handleTeacherFormChange}
                required
                placeholder="Enter teacher name"
              />
            </div>
            <div className="form-group">
              <label>Department (Branch)</label>
              <select
                name="department"
                value={teacherForm.department}
                onChange={handleTeacherFormChange}
                required
              >
                <option value="">Select Department</option>
                <option value="IT">IT</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
              </select>
            </div>
            <div className="form-group">
              <label>Timetable CSV File</label>
              <input
                type="file"
                name="timetableFile"
                accept=".csv"
                onChange={handleTeacherFormChange}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: 'auto', marginTop: '20px', padding: '10px 20px' }}
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Timetable'}
            </button>
          </form>
        </div>

        {/* Upload Student Details CSV */}
        <div className="card">
          <h2>Upload Student Details CSV</h2>
          <p>Upload a CSV file with student details. Expected columns: Roll No., Name, Batch</p>
          <form onSubmit={handleStudentDetailsUpload}>
            <div className="form-group">
              <label>Branch</label>
              <select
                name="branch"
                value={studentUploadForm.branch}
                onChange={handleStudentUploadFormChange}
                required
              >
                <option value="">Select Branch</option>
                <option value="IT">IT</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
              </select>
            </div>
            <div className="form-group">
              <label>Section</label>
              <select
                name="section"
                value={studentUploadForm.section}
                onChange={handleStudentUploadFormChange}
                required
              >
                <option value="">Select Section</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <div className="form-group">
              <label>Semester</label>
              <select
                name="semester"
                value={studentUploadForm.semester}
                onChange={handleStudentUploadFormChange}
                required
              >
                <option value="">Select Semester</option>
                <option value="1">1st Sem</option>
                <option value="3">3rd Sem</option>
                <option value="5">5th Sem</option>
                <option value="7">7th Sem</option>
              </select>
            </div>
            <div className="form-group">
              <label>Students CSV File</label>
              <input
                type="file"
                name="studentsFile"
                accept=".csv"
                onChange={handleStudentUploadFormChange}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: 'auto', marginTop: '20px', padding: '10px 20px' }}
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Students'}
            </button>
          </form>
        </div>

        {/* Add Single Student */}
        <div className="card">
          <h2>Add Single Student</h2>
          <form onSubmit={handleAddStudent}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={studentForm.name}
                onChange={handleStudentFormChange}
                required
                placeholder="Enter student name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={studentForm.email}
                onChange={handleStudentFormChange}
                required
                placeholder="Enter student email"
              />
            </div>
            <div className="form-group">
              <label>Roll Number</label>
              <input
                type="text"
                name="rollNumber"
                value={studentForm.rollNumber}
                onChange={handleStudentFormChange}
                required
                placeholder="Enter roll number"
              />
            </div>
            <div className="form-group">
              <label>Class</label>
              <input
                type="text"
                name="class"
                value={studentForm.class}
                onChange={handleStudentFormChange}
                required
                placeholder="Enter class"
              />
            </div>
            <div className="form-group">
              <label>Batch</label>
              <input
                type="text"
                name="batch"
                value={studentForm.batch}
                onChange={handleStudentFormChange}
                placeholder="Enter batch"
              />
            </div>
            <div className="form-group">
              <label>Branch</label>
              <input
                type="text"
                name="branch"
                value={studentForm.branch}
                onChange={handleStudentFormChange}
                placeholder="Enter branch"
              />
            </div>
            <div className="form-group">
              <label>Section</label>
              <input
                type="text"
                name="section"
                value={studentForm.section}
                onChange={handleStudentFormChange}
                placeholder="Enter section"
              />
            </div>
            <div className="form-group">
              <label>Semester</label>
              <input
                type="text"
                name="semester"
                value={studentForm.semester}
                onChange={handleStudentFormChange}
                placeholder="Enter semester"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: 'auto', marginTop: '20px', padding: '10px 20px' }}
              disabled={loading}
            >
              {loading ? 'Adding Student...' : 'Add Student'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
