import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/student/exams');
      setExams(response.data.exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExamAccess = async (examId) => {
    try {
      const response = await api.get(`/student/exam/${examId}/access`);

      if (response.data.canAccess) {
        navigate(`/student/exam/${examId}`);
      } else {
        alert(response.data.message || 'Exam is not currently available. Please check the scheduled time.');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Cannot access exam');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <h2>🎓 Student Portal</h2>
        <div className="navbar-right">
          <span>Welcome, <strong>{user?.name}</strong></span>
          <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '10px 20px' }}>
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <h1>👋 Hello, {user?.name}!</h1>
          <p>View and take your scheduled exams</p>
        </div>

        {/* Student Info Card */}
        <div className="card">
          <h2>📋 Student Information</h2>
          <div className="info-box">
            <p><strong>👤 Full Name:</strong> {user?.name}</p>
            <p><strong>🆔 Roll Number:</strong> {user?.rollNumber}</p>
            <p><strong>📖 Class:</strong> {user?.class}</p>
            <p><strong>📧 Email:</strong> {user?.email}</p>
          </div>
        </div>

        {/* Available Exams Section */}
        <div className="card">
          <div style={{ marginBottom: '25px' }}>
            <h2>Available Exams</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>
              {loading ? 'Loading...' : `${exams.length} exam(s) available for your class`}
            </p>
          </div>

          {loading ? (
            <div className="loading">⏳ Loading exams...</div>
          ) : exams.length > 0 ? (
            <div className="grid">
              {exams.map((exam) => (
                <div key={exam._id} className="exam-card">
                  <h3>📝 {exam.examName}</h3>
                  
                  <div className="exam-card-info">
                    <div>
                      <strong>📖 Class:</strong> {exam.class}
                    </div>
                    <div>
                      <strong>📅 Date:</strong> {new Date(exam.scheduledDate).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>🕐 Time:</strong> {exam.scheduledTime}
                    </div>
                    <div>
                      <strong>⏱️ Duration:</strong> {exam.duration} minutes
                    </div>
                    <div>
                      <strong>📊 Questions:</strong> {exam.questionsPerSet.easy + exam.questionsPerSet.medium + exam.questionsPerSet.hard} total
                    </div>
                  </div>

                  <button
                    onClick={() => checkExamAccess(exam._id)}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    🚀 Enter Exam
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '2px dashed #e5e7eb'
            }}>
              <p style={{ fontSize: '18px', color: '#6b7280' }}>
                📭 No exams scheduled for your class at the moment
              </p>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '10px' }}>
                Please check back later or contact your instructor
              </p>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)', border: '2px solid #bfdbfe' }}>
          <h3 style={{ color: '#2563eb', marginBottom: '15px' }}>ℹ️ Important Information</h3>
          <ul style={{ listPosition: 'inside', color: '#374151', lineHeight: '1.8' }}>
            <li>✅ Exams are only accessible during their scheduled time</li>
            <li>✅ Your question set is unique and remains the same on refresh</li>
            <li>✅ Upload clear screenshots of your handwritten answers OR Clear screenshots</li>
            <li>✅ You can delete screenshots before submission</li>
            <li>✅ Once submitted, you cannot make any changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;