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

  // State for teacher search
  const [teacherSearchForm, setTeacherSearchForm] = useState({
    department: '',
    teacherId: '',
    name: '',
  });
  const [teachers, setTeachers] = useState([]);

  // State for student search
  const [studentSearchForm, setStudentSearchForm] = useState({
    name: '',
    rollNumber: '',
    branch: '',
    section: '',
    semester: '',
  });
  const [students, setStudents] = useState([]);

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

  const handleTeacherSearchFormChange = (e) => {
    setTeacherSearchForm({
      ...teacherSearchForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleStudentSearchFormChange = (e) => {
    setStudentSearchForm({
      ...studentSearchForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearchTeachers = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (teacherSearchForm.department) params.append('department', teacherSearchForm.department);
      if (teacherSearchForm.teacherId) params.append('teacherId', teacherSearchForm.teacherId);
      if (teacherSearchForm.name) params.append('name', teacherSearchForm.name);

      const response = await api.get(`/admin/search-teachers?${params.toString()}`);
      setTeachers(response.data.teachers);
    } catch (err) {
      setError(err.response?.data?.message || 'Error searching teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStudents = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (studentSearchForm.name) params.append('name', studentSearchForm.name);
      if (studentSearchForm.rollNumber) params.append('rollNumber', studentSearchForm.rollNumber);
      if (studentSearchForm.branch) params.append('branch', studentSearchForm.branch);
      if (studentSearchForm.section) params.append('section', studentSearchForm.section);
      if (studentSearchForm.semester) params.append('semester', studentSearchForm.semester);

      const response = await api.get(`/admin/search-students?${params.toString()}`);
      setStudents(response.data.students);
    } catch (err) {
      setError(err.response?.data?.message || 'Error searching students');
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

  const handleDownloadTeacherTimetableFormat = () => {
    const csvContent = `Day,Time,Subject,Branch,Section,Batches,Semester
Monday,9:00 AM - 10:00 AM,Mathematics,IT,1,B1,3
Monday,10:00 AM - 11:00 AM,Physics,CSE,2,B2,5
Tuesday,11:00 AM - 12:00 PM,Chemistry,ECE,B1,C,7`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'teacher_timetable_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadStudentFormat = () => {
    const csvContent = `Roll No.,Name,Batch
12345,John Doe,2020-2024
12346,Jane Smith,2021-2025
12347,Alice Johnson,2022-2026`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_details_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <p>Upload a CSV file with teacher timetable data. Expected columns: Day, Time, Subject, Branch, Section, Batches, Semester</p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginBottom: '20px' }}
            onClick={handleDownloadTeacherTimetableFormat}
          >
            Download Sample CSV Format
          </button>
          <form onSubmit={handleTeacherTimetableUpload} className="form">
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
                <option value="EE">EE</option>
                <option value="CHE">CHE</option>
                <option value="BIO">BIO</option>
                <option value="AE">AE</option>
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
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginBottom: '20px' }}
            onClick={handleDownloadStudentFormat}
          >
            Download Sample CSV Format
          </button>
          <form onSubmit={handleStudentDetailsUpload} className="form">
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
                <option value="EE">EE</option>
                <option value="CHE">CHE</option>
                <option value="BIO">BIO</option>
                <option value="AE">AE</option>
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

        {/* Search Teachers */}
        <div className="card">
          <h2>Search Teachers</h2>
          <form onSubmit={handleSearchTeachers} className="form">
            <div className="form-group">
              <label>Department</label>
              <select
                name="department"
                value={teacherSearchForm.department}
                onChange={handleTeacherSearchFormChange}
              >
                <option value="">All Departments</option>
                <option value="IT">IT</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
                <option value="EE">EE</option>
                <option value="CHE">CHE</option>
                <option value="BIO">BIO</option>
                <option value="AE">AE</option>
              </select>
            </div>
            <div className="form-group">
              <label>Teacher ID</label>
              <input
                type="text"
                name="teacherId"
                value={teacherSearchForm.teacherId}
                onChange={handleTeacherSearchFormChange}
                placeholder="Enter teacher ID"
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={teacherSearchForm.name}
                onChange={handleTeacherSearchFormChange}
                placeholder="Enter teacher name"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: 'auto', marginTop: '20px', padding: '10px 20px' }}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search Teachers'}
            </button>
          </form>
          {teachers.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3>Search Results</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Email</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Teacher ID</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Department</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Branch-Sections</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher._id}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{teacher.name}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{teacher.email}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{teacher.teacherId}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{teacher.department}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{teacher.branchSection.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Search Students */}
        <div className="card">
          <h2>Search Students</h2>
          <form onSubmit={handleSearchStudents} className="form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={studentSearchForm.name}
                onChange={handleStudentSearchFormChange}
                placeholder="Enter student name"
              />
            </div>
            <div className="form-group">
              <label>Roll Number</label>
              <input
                type="text"
                name="rollNumber"
                value={studentSearchForm.rollNumber}
                onChange={handleStudentSearchFormChange}
                placeholder="Enter roll number"
              />
            </div>
            <div className="form-group">
              <label>Branch</label>
              <select
                name="branch"
                value={studentSearchForm.branch}
                onChange={handleStudentSearchFormChange}
              >
                <option value="">All Branches</option>
                <option value="IT">IT</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
                <option value="EE">EE</option>
                <option value="CHE">CHE</option>
                <option value="BIO">BIO</option>
                <option value="AE">AE</option>
              </select>
            </div>
            <div className="form-group">
              <label>Section</label>
              <input
                type="text"
                name="section"
                value={studentSearchForm.section}
                onChange={handleStudentSearchFormChange}
                placeholder="Enter section"
              />
            </div>
            <div className="form-group">
              <label>Semester</label>
              <input
                type="text"
                name="semester"
                value={studentSearchForm.semester}
                onChange={handleStudentSearchFormChange}
                placeholder="Enter semester"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: 'auto', marginTop: '20px', padding: '10px 20px' }}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search Students'}
            </button>
          </form>
          {students.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3>Search Results</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Email</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Roll Number</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Branch</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Section</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{student.name}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{student.email}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{student.rollNumber}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{student.branch}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{student.section}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{student.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Single Student */}
        <div className="card">
          <h2>Add Single Student</h2>
          <form onSubmit={handleAddStudent} className="form">
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
              <select
                name="branch"
                value={studentForm.branch}
                onChange={handleStudentFormChange}
              >
                <option value="">Select Branch</option>
                <option value="IT">IT</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
                <option value="EE">EE</option>
                <option value="CHE">CHE</option>
                <option value="BIO">BIO</option>
                <option value="AE">AE</option>
              </select>
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
