import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  // State for potential error messages
  const [error, setError] = useState(null); 
  // Custom State for the Modal (to avoid using alert())
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/student/exams');
      setExams(response.data.exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Failed to load exams. Please try again later.');
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
        // Use custom modal instead of alert()
        setModalTitle('Access Denied');
        setModalMessage(response.data.message || 'Exam is not currently available. Please check the scheduled time.');
        setIsModalOpen(true);
      }
    } catch (error) {
      // Use custom modal instead of alert()
      setModalTitle('Error');
      setModalMessage(error.response?.data?.message || 'Cannot access exam due to a server error.');
      setIsModalOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Helper to safely access questionsPerSet
  const getQuestionCount = (exam) => {
    // FIX: Use optional chaining and default to an empty object
    const dist = exam.questionsPerSet || {}; 
    const easy = dist.easy || 0;
    const medium = dist.medium || 0;
    const hard = dist.hard || 0;
    
    // The previous error occurred when accessing dist.easy directly if exam.questionsPerSet was undefined or null.
    // By providing || {} and then || 0, we ensure no property of undefined is read.
    return easy + medium + hard;
  };

  // Custom Modal Component (Inline for Single-File React)
  const ErrorModal = ({ isOpen, title, message, onClose }) => {
    if (!isOpen) return null;

    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          fontFamily: 'Inter, sans-serif'
        }}
      >
        <div 
          style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}
        >
          <h3 style={{ color: title === 'Access Denied' ? '#dc2626' : '#f59e0b', marginBottom: '15px' }}>{title}</h3>
          <p style={{ color: '#4b5563', marginBottom: '25px' }}>{message}</p>
          <button 
            onClick={onClose} 
            className="btn btn-primary"
            style={{ width: '100%', backgroundColor: title === 'Access Denied' ? '#dc2626' : '#2563eb' }}
          >
            OK
          </button>
        </div>
      </div>
    );
  };


  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
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
        
        {/* Global Error Message Display */}
        {error && <div className="error">{error}</div>}

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
                      {/* FIX: Use the safe accessor function here */}
                      <strong>📊 Questions:</strong> {getQuestionCount(exam)} total
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
      
      {/* Custom Error/Access Denied Modal */}
      <ErrorModal
        isOpen={isModalOpen}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default StudentDashboard;