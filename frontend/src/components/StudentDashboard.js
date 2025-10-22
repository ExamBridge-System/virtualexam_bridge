import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [examStatuses, setExamStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  // State for potential error messages
  const [error, setError] = useState(null);
  // Custom State for the Modal (to avoid using alert())
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    fetchExams();

    // Update time every second to enable/disable buttons in real-time
    const timer = setInterval(() => {
      setExams(prevExams => [...prevExams]); // Force re-render
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/student/exams');
      setExams(response.data.exams);

      // Fetch status for each exam
      const statuses = {};
      for (const exam of response.data.exams) {
        try {
          const statusResponse = await api.get(`/student/exam/${exam._id}/status`);
          statuses[exam._id] = statusResponse.data;
        } catch (statusError) {
          // If status fetch fails, assume not started
          statuses[exam._id] = { status: 'not_started', setGenerated: false, uploadedScreenshots: {} };
        }
      }
      setExamStatuses(statuses);
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
        // Check if student has already submitted this exam
        try {
          const statusResponse = await api.get(`/student/exam/${examId}/status`);
          if (statusResponse.data.status === 'submitted') {
            setModalTitle('Exam Already Submitted');
            setModalMessage('You have already submitted this exam and cannot access it again.');
            setIsModalOpen(true);
            return;
          }
        } catch (statusError) {
          // If status check fails, continue to exam (might be first time)
        }

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

  // Helper to check if exam is currently active based on time
  const isExamActive = (exam) => {
    const examStartTime = new Date(`${new Date(exam.scheduledDate).toISOString().split('T')[0]}T${exam.scheduledTime}`);
    const currentTime = new Date();
    const examEndTime = new Date(examStartTime.getTime() + exam.duration * 60000);

    return currentTime >= examStartTime && currentTime <= examEndTime;
  };

  // Custom Modal Component (Inline for Single-File React)
  const ErrorModal = ({ isOpen, title, message, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3 style={{ color: title === 'Access Denied' ? 'var(--danger)' : 'var(--warning)', marginBottom: '15px' }}>{title}</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '25px' }}>{message}</p>
          <button
            onClick={onClose}
            className={`btn ${title === 'Access Denied' ? 'btn-danger' : 'btn-primary'}`}
            style={{ width: '100%' }}
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

        {/* Upcoming Exams Section */}
        <div className="card">
          <div style={{ marginBottom: '25px' }}>
            <h2>📅 Upcoming Exams</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>
              Exams scheduled for your class
            </p>
          </div>

          {loading ? (
            <div className="loading">⏳ Loading exams...</div>
          ) : (() => {
            // Filter upcoming exams (not submitted and not finished)
            const upcomingExams = exams.filter(exam => {
              const status = examStatuses[exam._id]?.status || 'not_started';
              const isSubmitted = status === 'submitted';

              // Check if exam has finished (scheduled time + duration has passed)
              const examStartTime = new Date(`${new Date(exam.scheduledDate).toISOString().split('T')[0]}T${exam.scheduledTime}`);
              const examEndTime = new Date(examStartTime.getTime() + exam.duration * 60000);
              const currentTime = new Date();
              const isFinished = currentTime > examEndTime;

              return !isSubmitted && !isFinished;
            });

            // Sort: exams starting within 30 minutes first, then by date/time
            const sortedExams = upcomingExams.sort((a, b) => {
              const now = new Date();
              const aStartTime = new Date(`${new Date(a.scheduledDate).toISOString().split('T')[0]}T${a.scheduledTime}`);
              const bStartTime = new Date(`${new Date(b.scheduledDate).toISOString().split('T')[0]}T${b.scheduledTime}`);

              const aTimeDiff = aStartTime - now;
              const bTimeDiff = bStartTime - now;

              // If both are within 30 minutes, sort by time difference (closer first)
              if (aTimeDiff <= 30 * 60 * 1000 && bTimeDiff <= 30 * 60 * 1000) {
                return aTimeDiff - bTimeDiff;
              }

              // If only a is within 30 minutes, it comes first
              if (aTimeDiff <= 30 * 60 * 1000) return -1;

              // If only b is within 30 minutes, it comes first
              if (bTimeDiff <= 30 * 60 * 1000) return 1;

              // Otherwise, sort by start time
              return aStartTime - bStartTime;
            });

            return sortedExams.length > 0 ? (
              <div className="grid">
                {sortedExams.map((exam) => {
                  const examStartTime = new Date(`${new Date(exam.scheduledDate).toISOString().split('T')[0]}T${exam.scheduledTime}`);
                  const currentTime = new Date();
                  const timeUntilStart = examStartTime - currentTime;
                  const isStartingSoon = timeUntilStart <= 30 * 60 * 1000 && timeUntilStart > 0;
                  const canStart = timeUntilStart <= 1000; // Allow 1 second buffer for timing precision

                  return (
                    <div
                      key={exam._id}
                      className="exam-card"
                      style={{
                        border: isStartingSoon ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                        background: isStartingSoon ? '#fffbeb' : 'white'
                      }}
                    >
                      {isStartingSoon && (
                        <div style={{
                          background: '#f59e0b',
                          color: 'white',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          marginBottom: '10px'
                        }}>
                          🚨 STARTING SOON
                        </div>
                      )}

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
                        {isStartingSoon && (
                          <div>
                            <strong>⏰ Starts in:</strong> {Math.floor(timeUntilStart / (60 * 1000))} minutes
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => checkExamAccess(exam._id)}
                        className={`btn ${canStart ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          width: '100%',
                          background: canStart ? '#10b981' : '#9ca3af',
                          cursor: canStart ? 'pointer' : 'not-allowed'
                        }}
                        disabled={!canStart}
                      >
                        {canStart ? '🚀 Start Exam' : '⏳ Not Yet Available'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '2px dashed #e5e7eb'
              }}>
                <p style={{ fontSize: '16px', color: '#6b7280' }}>
                  📭 No upcoming exams scheduled
                </p>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '10px' }}>
                  Check back later or contact your instructor
                </p>
              </div>
            );
          })()}
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