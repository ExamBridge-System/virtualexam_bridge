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
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <h1>Hello, {user?.name}!</h1>
          <p>View and take your scheduled exams</p>
        </div>

        {/* Student Info Card */}
        <div className="card">
          <h2>Student Information</h2>
          <div className="info-box">
            <p><strong> Full Name:</strong> {user?.name}</p>
            <p><strong> Roll Number:</strong> {user?.rollNumber}</p>
            <p><strong> Class:</strong> {user?.class}</p>
            {user?.batch && <p><strong> Batch:</strong> {user?.batch}</p>}
            <p><strong> Email:</strong> {user?.email}</p>
          </div>
        </div>
        
        {/* Global Error Message Display */}
        {error && <div className="error">{error}</div>}

        {/* Available Exams Section */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {/* Active Exams Panel */}
          <div className="card">
            <div style={{ marginBottom: '25px' }}>
              <h2>Active Exams</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>
                Currently available exams
              </p>
            </div>

            {loading ? (
              <div className="loading">⏳ Loading exams...</div>
            ) : exams.filter(exam => isExamActive(exam)).length > 0 ? (
              <div className="grid">
                {exams.filter(exam => isExamActive(exam)).map((exam) => (
                  <div key={exam._id} className="exam-card" style={{ border: '2px solid #10b981' }}>
                    <h3>{exam.examName}</h3>

                    <div className="exam-card-info">
                      <div>
                        <strong>Class:</strong> {exam.class}
                      </div>
                      <div>
                        <strong>Date:</strong> {new Date(exam.scheduledDate).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Time:</strong> {exam.scheduledTime}
                      </div>
                      <div>
                        <strong>Duration:</strong> {exam.duration} minutes
                      </div>
                    </div>

                    <button
                      onClick={() => checkExamAccess(exam._id)}
                      className="btn btn-primary"
                      style={{ width: '100%', background: '#10b981' }}
                    >
                      Enter Exam
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#f0fdf4',
                borderRadius: '8px',
                border: '2px dashed #bbf7d0'
              }}>
                <p style={{ fontSize: '16px', color: '#6b7280' }}>
                  📭 No active exams at the moment
                </p>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '10px' }}>
                  Check back during exam time
                </p>
              </div>
            )}
          </div>

          {/* Completed Exams Panel */}
          <div className="card">
            <div style={{ marginBottom: '25px' }}>
              <h2>Completed Exams</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>
                Exams you have submitted
              </p>
            </div>

            {loading ? (
              <div className="loading">⏳ Loading exams...</div>
            ) : exams.filter(exam => examStatuses[exam._id]?.status === 'submitted').length > 0 ? (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {exams.filter(exam => examStatuses[exam._id]?.status === 'submitted').map((exam) => (
                  <div
                    key={exam._id}
                    style={{
                      padding: '15px',
                      marginBottom: '10px',
                      border: '2px solid #10b981',
                      borderRadius: '8px',
                      background: '#f0fdf4',
                      cursor: 'default',
                    }}
                  >
                    <div className="flex-between" style={{ marginBottom: '10px' }}>
                      <strong>{exam.examName}</strong>
                      <span className="badge badge-success">Submitted</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#718096' }}>
                      <div>Class: {exam.class}</div>
                      <div>Date: {new Date(exam.scheduledDate).toLocaleDateString()}</div>
                      <div>Time: {exam.scheduledTime} ({exam.duration} min)</div>
                      <div>Screenshots: {Object.keys(examStatuses[exam._id]?.uploadedScreenshots || {}).length} questions</div>
                    </div>
                  </div>
                ))}
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
                  📭 No completed exams yet
                </p>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '10px' }}>
                  Complete exams to see them here
                </p>
              </div>
            )}
          </div>

          {/* All Exams Panel */}
          <div className="card">
            <div style={{ marginBottom: '25px' }}>
              <h2>All Exams</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>
                {loading ? 'Loading...' : `${exams.length} exam(s) scheduled for your class`}
              </p>
            </div>

            {loading ? (
              <div className="loading">⏳ Loading exams...</div>
            ) : exams.length > 0 ? (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {exams.map((exam) => {
                  const status = examStatuses[exam._id]?.status || 'not_started';
                  const isActive = isExamActive(exam);
                  const isSubmitted = status === 'submitted';

                  return (
                    <div
                      key={exam._id}
                      style={{
                        padding: '15px',
                        marginBottom: '10px',
                        border: isActive ? '2px solid #10b981' : '2px solid #e2e8f0',
                        borderRadius: '8px',
                        background: isActive ? '#f0fdf4' : isSubmitted ? '#fefce8' : 'white',
                        cursor: isActive ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => isActive && checkExamAccess(exam._id)}
                    >
                      <div className="flex-between" style={{ marginBottom: '10px' }}>
                        <strong>{exam.examName}</strong>
                        <span className={`badge ${isActive ? 'badge-success' : isSubmitted ? 'badge-warning' : 'badge-secondary'}`}>
                          {isSubmitted ? 'Submitted' : exam.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#718096' }}>
                        <div>Class: {exam.class}</div>
                        <div>Date: {new Date(exam.scheduledDate).toLocaleDateString()}</div>
                        <div>Time: {exam.scheduledTime} ({exam.duration} min)</div>
                        {isSubmitted && (
                          <div>Screenshots: {Object.keys(examStatuses[exam._id]?.uploadedScreenshots || {}).length} questions</div>
                        )}
                      </div>
                      {isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            checkExamAccess(exam._id);
                          }}
                          className="btn btn-primary"
                          style={{ width: '100%', marginTop: '10px', background: '#10b981' }}
                        >
                          Enter Exam
                        </button>
                      )}
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
                  📭 No exams scheduled for your class at the moment
                </p>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '10px' }}>
                  Please check back later or contact your instructor
                </p>
              </div>
            )}
          </div>
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