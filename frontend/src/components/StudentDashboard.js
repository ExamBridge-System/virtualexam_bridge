import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { studentAPI } from '../utils/api';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [examStatuses, setExamStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailChangeStep, setEmailChangeStep] = useState(1);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUsingDefaultPassword, setIsUsingDefaultPassword] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/student/exams');
      setExams(response.data.exams);

      const statuses = {};
      for (const exam of response.data.exams) {
        try {
          const statusResponse = await api.get(`/student/exam/${exam._id}/status`);
          statuses[exam._id] = statusResponse.data;
        } catch (statusError) {
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

  const handleChangePassword = async () => {
    setPasswordError('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All fields are required.');
      return;
    }

    if (user?.role === 'student' && user.email === 'admin@example.com') {
      setModalTitle('Action Required');
      setModalMessage('You must change your default email (admin@example.com) before changing your password.');
      setIsModalOpen(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      return;
    }

    try {
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      });

      setModalTitle('Success');
      setModalMessage('Password updated successfully. For security, please log in with your new password.');
      setIsModalOpen(true);
      setShowPasswordChange(false);

      logout();
      navigate('/login');
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to update password.');
    } finally {
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const checkExamAccess = async (examId) => {
    try {
      const response = await api.get(`/student/exam/${examId}/access`);

      if (response.data.canAccess) {
        try {
          const statusResponse = await api.get(`/student/exam/${examId}/status`);
          if (statusResponse.data.status === 'submitted') {
            setModalTitle('Exam Already Submitted');
            setModalMessage('You have already submitted this exam and cannot access it again.');
            setIsModalOpen(true);
            return;
          }
        } catch (statusError) {
          // Continue to exam
        }

        navigate(`/student/exam/${examId}`);
      } else {
        setModalTitle('Access Denied');
        setModalMessage(response.data.message || 'Exam is not currently available. Please check the scheduled time.');
        setIsModalOpen(true);
      }
    } catch (error) {
      setModalTitle('Error');
      setModalMessage(error.response?.data?.message || 'Cannot access exam due to a server error.');
      setIsModalOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getQuestionCount = (exam) => {
    const dist = exam.questionsPerSet || {};
    const easy = dist.easy || 0;
    const medium = dist.medium || 0;
    const hard = dist.hard || 0;
    return easy + medium + hard;
  };

  const isExamActive = (exam) => {
    const examStartTime = new Date(`${new Date(exam.scheduledDate).toISOString().split('T')[0]}T${exam.scheduledTime}`);
    const currentTime = new Date();
    const examEndTime = new Date(examStartTime.getTime() + exam.duration * 60000);
    return currentTime >= examStartTime && currentTime <= examEndTime;
  };

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

  const handleSendVerificationCode = async () => {
    try {
      await studentAPI.sendVerificationCode(newEmail);
      setModalTitle('Code Sent');
      setModalMessage('A verification code has been sent to your new email address.');
      setIsModalOpen(true);
      setEmailChangeStep(2);
    } catch (error) {
      setModalTitle('Error');
      setModalMessage(error.response?.data?.message || 'Failed to send verification code.');
      setIsModalOpen(true);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await studentAPI.verifyEmail(newEmail, verificationCode);
      setModalTitle('Email Updated');
      setModalMessage('Your email address has been successfully updated.');
      setIsModalOpen(true);
      setShowEmailChange(false);
      setNewEmail('');
      setVerificationCode('');
      setEmailChangeStep(1);
      window.location.reload();
    } catch (error) {
      setModalTitle('Verification Failed');
      setModalMessage(error.response?.data?.message || 'Invalid verification code.');
      setIsModalOpen(true);
    }
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
          <h1>Welcome back, {user?.name}!</h1>
          <p>View and take your scheduled exams</p>
        </div>

        {/* Student Info Card */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '15px' }}>
            <h2>Student Information</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowPasswordChange(true)}
                className="btn btn-secondary"
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                Change Password
              </button>
              <button
                onClick={() => setShowEmailChange(true)}
                className="btn btn-secondary"
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                Change Email
              </button>
            </div>
          </div>

          <div className="info-box">
            <p><strong> Full Name:</strong> {user?.name}</p>
            <p><strong> Roll Number:</strong> {user?.rollNumber}</p>
            <p><strong> Class:</strong> {user?.class}</p>
            {user?.batch && <p><strong> Batch:</strong> {user?.batch}</p>}
            <p><strong> Email:</strong> {user?.email}</p>
            {user?.branch && <p><strong> Branch:</strong> {user?.branch}</p>}
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Three Column Grid */}
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
                      <div><strong>Class:</strong> {exam.class}</div>
                      <div><strong>Date:</strong> {new Date(exam.scheduledDate).toLocaleDateString()}</div>
                      <div><strong>Time:</strong> {exam.scheduledTime}</div>
                      <div><strong>Duration:</strong> {exam.duration} minutes</div>
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

      {/* Modals */}
      <ErrorModal
        isOpen={isModalOpen}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Email Change Modal */}
      {showEmailChange && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2563eb' }}>
              {emailChangeStep === 1 ? 'Change Email Address' : 'Verify New Email'}
            </h3>

            {emailChangeStep === 1 ? (
              <>
                <p style={{ marginBottom: '15px', color: '#6b7280' }}>
                  Enter your new email address. A verification code will be sent to confirm the change.
                </p>
                <input
                  type="email"
                  placeholder="New email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="form-input"
                  style={{ marginBottom: '20px' }}
                />
                <div className="flex-between">
                  <button onClick={() => setShowEmailChange(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={handleSendVerificationCode}
                    className="btn btn-primary"
                    disabled={!newEmail.trim()}
                  >
                    Send Code
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ marginBottom: '15px', color: '#6b7280' }}>
                  Enter the verification code sent to <strong>{newEmail}</strong>
                </p>
                <input
                  type="text"
                  placeholder="Verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="form-input"
                  style={{ marginBottom: '20px' }}
                />
                <div className="flex-between">
                  <button
                    onClick={() => {
                      setEmailChangeStep(1);
                      setVerificationCode('');
                    }}
                    className="btn btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyEmail}
                    className="btn btn-primary"
                    disabled={!verificationCode.trim()}
                  >
                    Verify & Update
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2563eb' }}>
              Change Password
            </h3>

            {user?.role === 'student' && user.email === 'admin@example.com' && (
              <div className="warning" style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ffc107', borderRadius: '4px', background: '#fff3cd', color: '#856404' }}>
                ⚠️ **Security Policy:** You must first change your **default email** (`admin@example.com`) to a personal email to proceed with a password change.
              </div>
            )}

            {passwordError && <div className="error" style={{ marginBottom: '10px' }}>{passwordError}</div>}

            <label>Old Password</label>
            <input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="form-input"
              style={{ marginBottom: '10px' }}
            />

            <label>New Password</label>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input"
              style={{ marginBottom: '10px' }}
            />

            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="form-input"
              style={{ marginBottom: '20px' }}
            />

            <div className="flex-between">
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordError('');
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="btn btn-primary"
                disabled={user?.role === 'student' && user.email === 'admin@example.com'}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;