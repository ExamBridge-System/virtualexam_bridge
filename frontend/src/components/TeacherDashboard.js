import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/teacher/exams');
      setExams(response.data.exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the exam "${name}"?`)) {
      try {
        await api.delete(`/teacher/exam/${id}`);
        setExams(exams.filter((exam) => exam._id !== id));
      } catch (error) {
        console.error('Error deleting exam:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badgeClass = {
      active: 'badge badge-success',
      completed: 'badge badge-primary',
      upcoming: 'badge badge-warning',
    };

    return (
      <span className={badgeClass[status] || 'badge badge-secondary'}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar */}
      <nav className="navbar">
        <h2>Exam Management Portal</h2>
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
          <h1>Welcome back, {user?.name}!</h1>
          <p>Manage your exams, questions, and view student submissions</p>
        </div>

        {/* Teacher Information Section */}
        <div className="card">
          <h2>Teacher Information</h2>
          <div className="info-box">
            <p><strong> Full Name:</strong> {user?.name}</p>
            <p><strong> Teacher ID:</strong> {user?.teacherId}</p>
            <p><strong> Department:</strong> {user?.department}</p>
            <p><strong> Email:</strong> {user?.email}</p>
          </div>
        </div>

        {/* Schedule Exam Section */}
        <div className="card">
          <h2>Schedule Exam</h2>
          <button
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/teacher/exam/create');
            }}
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '15px' }}
          >
            ➕ Schedule New Exam
          </button>
        </div>

      {/* Exams Section */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '30px' }}>
          <div>
            <h2>All Exams</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>
              Total exams: {exams.length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading">⏳ Loading exams...</div>
        ) : exams.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Class</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam._id}>
                    <td><strong>{exam.examName}</strong></td>
                    <td>
                      <span className="badge badge-primary">
                        {exam.branch}-{exam.section}
                      </span>
                    </td>
                    <td>{new Date(exam.scheduledDate).toLocaleDateString()}</td>
                    <td>
                      <strong>{(() => {
                        // Parse start time
                        const [startHour, startMinute] = exam.scheduledTime.split(':').map(Number);
                        const startDate = new Date(exam.scheduledDate);
                        startDate.setHours(startHour, startMinute, 0, 0);
                        // Calculate end time
                        const endDate = new Date(startDate.getTime() + (exam.duration || 0) * 60000);
                        // Format times as 12-hour with AM/PM
                        function format12Hour(date) {
                          let hour = date.getHours();
                          const minute = date.getMinutes();
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          hour = hour % 12;
                          if (hour === 0) hour = 12;
                          return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
                        }
                        const startStr = format12Hour(startDate);
                        const endStr = format12Hour(endDate);
                        return `${startStr} - ${endStr}`;
                      })()}</strong>
                    </td>
                    <td>
                      <span className="badge badge-secondary">
                        {exam.numberOfStudents}
                      </span>
                    </td>
                    <td>{getStatusBadge(exam.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => navigate(`/teacher/exam/${exam._id}/questions`)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Questions
                        </button>
                        <button
                          onClick={() => navigate(`/teacher/exam/${exam._id}/submissions`)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Submissions
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam._id, exam.examName)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '2px dashed #e5e7eb',
            }}
          >
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '20px' }}>
              📭 No exams scheduled yet
            </p>
            <button onClick={() => {
              window.scrollTo(0, 0);
              navigate('/teacher/exam/create');
            }} className="btn btn-primary">
              ➕ Create Your First Exam
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {exams.length > 0 && (() => {
        const now = new Date();
        let completed = 0;
        let active = 0;
        exams.forEach((exam) => {
          let examDateTime;
          if (exam.scheduledDate && exam.scheduledTime) {
            const [hour, minute] = exam.scheduledTime.split(':');
            examDateTime = new Date(exam.scheduledDate);
            examDateTime.setHours(Number(hour), Number(minute), 0, 0);
          } else {
            examDateTime = new Date(exam.scheduledDate);
          }
          if (examDateTime < now) completed++;
          if (exam.status === 'active') active++;
        });
        return (
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '30px' }}
          >
            <div
              className="card"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
                border: '2px solid #bfdbfe',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                {exams.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Total Exams</div>
            </div>
            <div
              className="card"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%)',
                border: '2px solid #bbf7d0',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{completed}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Completed</div>
            </div>
            <div
              className="card"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)',
                border: '2px solid #fef08a',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🟢</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{active}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Active</div>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
}

export default TeacherDashboard;
