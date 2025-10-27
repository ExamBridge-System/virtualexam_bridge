import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & feedback
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Email change states
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailChangeStep, setEmailChangeStep] = useState(1);

  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Compute status from scheduledDate, scheduledTime and duration if available
  const computeExamStatus = (exam) => {
    try {
      const now = new Date();
      if (exam && exam.scheduledDate) {
        const startDate = new Date(exam.scheduledDate);
        let startHour = 0, startMinute = 0;
        if (exam.scheduledTime) {
          const parts = exam.scheduledTime.split(':').map(Number);
          startHour = parts[0] || 0;
          startMinute = parts[1] || 0;
        }
        startDate.setHours(startHour, startMinute, 0, 0);
        // Adjust for server in Singapore (SGT, UTC+8) and user likely in IST (UTC+5:30)
        // Server is 2.5 hours ahead, so shift exam time later by 2.5 hours
        startDate.setTime(startDate.getTime() + 2.5 * 60 * 60 * 1000);
        const durationMinutes = Number(exam.duration) || 0;
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
        if (now < startDate) return 'upcoming';
        if (now >= startDate && now <= endDate) return 'active';
        if (now > endDate) return 'completed';
      }
    } catch (e) {
      // fallback to stored status
      console.error('Error computing exam status', e);
    }
    return exam?.status || 'scheduled';
  };

  // Reusable Error/Info Modal
  const ErrorModal = ({ isOpen, title, message, onClose }) => {
    if (!isOpen) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3 style={{ marginBottom: '10px' }}>{title}</h3>
          <p style={{ marginBottom: '15px' }}>{message}</p>
          <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>OK</button>
        </div>
      </div>
    );
  };

  // Send verification code to new teacher email
  const handleSendVerificationCode = async () => {
    try {
      if (!newEmail.trim()) {
        setModalTitle('Error');
        setModalMessage('Please enter a valid email');
        setIsModalOpen(true);
        return;
      }
      await api.post('/teacher/send-verification-code', { newEmail });
      setModalTitle('Code Sent');
      setModalMessage('A verification code has been sent to your new email address.');
      setIsModalOpen(true);
      setEmailChangeStep(2);
    } catch (err) {
      setModalTitle('Error');
      setModalMessage(err.response?.data?.message || 'Failed to send verification code');
      setIsModalOpen(true);
    }
  };

  // Verify teacher email and update
  const handleVerifyEmail = async () => {
    try {
      await api.post('/teacher/verify-email', { newEmail, code: verificationCode });
      setModalTitle('Success');
      setModalMessage('Email updated successfully');
      setIsModalOpen(true);
      setShowEmailChange(false);
      setNewEmail('');
      setVerificationCode('');
      setEmailChangeStep(1);
      window.location.reload();
    } catch (err) {
      setModalTitle('Error');
      setModalMessage(err.response?.data?.message || 'Verification failed');
      setIsModalOpen(true);
    }
  };

  // Change password for teacher
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

    try {
      await api.post('/auth/change-password', { oldPassword, newPassword, confirmPassword: confirmNewPassword });
      setModalTitle('Success');
      setModalMessage('Password updated successfully. Please log in with your new password.');
      setIsModalOpen(true);
      setShowPasswordChange(false);
      logout();
      navigate('/login');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Teacher Information</h2>
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
                  <th>Semester</th>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span className="badge badge-primary">{exam.branch}-{exam.section}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {exam.batch && (
                            <span className="badge badge-secondary">Batch: {exam.batch}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{exam.semester || '-'}</td>
                    <td>{new Date(exam.scheduledDate).toLocaleDateString()}</td>
                    <td>
                      <strong>{(() => {
                        // Parse start time
                        const [startHour, startMinute] = exam.scheduledTime.split(':').map(Number);
                        const startDate = new Date(exam.scheduledDate);
                        startDate.setHours(startHour, startMinute, 0, 0);
                        // Adjust for server in Singapore (SGT, UTC+8) and user likely in IST (UTC+5:30)
                        // Server is 2.5 hours ahead, so shift exam time later by 2.5 hours
                        startDate.setTime(startDate.getTime() + 2.5 * 60 * 60 * 1000);
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
                    <td>{getStatusBadge(computeExamStatus(exam))}</td>
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
        let completed = 0;
        let active = 0;
        exams.forEach((exam) => {
          const status = computeExamStatus(exam);
          if (status === 'completed') completed++;
          if (status === 'active') active++;
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

      {/* Modals */}
      <ErrorModal isOpen={isModalOpen} title={modalTitle} message={modalMessage} onClose={() => setIsModalOpen(false)} />

      {/* Email Change Modal */}
      {showEmailChange && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2563eb' }}>{emailChangeStep === 1 ? 'Change Email Address' : 'Verify New Email'}</h3>
            {emailChangeStep === 1 ? (
              <>
                <p style={{ marginBottom: '15px', color: '#6b7280' }}>Enter your new email address. A verification code will be sent to confirm the change.</p>
                <input type="email" placeholder="New email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="form-input" style={{ marginBottom: '20px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={() => setShowEmailChange(false)} className="btn btn-secondary">Cancel</button>
                  <button onClick={handleSendVerificationCode} className="btn btn-primary" disabled={!newEmail.trim()}>Send Code</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ marginBottom: '15px', color: '#6b7280' }}>Enter the verification code sent to <strong>{newEmail}</strong></p>
                <input type="text" placeholder="Verification code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="form-input" style={{ marginBottom: '20px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={() => { setEmailChangeStep(1); setVerificationCode(''); }} className="btn btn-secondary">Back</button>
                  <button onClick={handleVerifyEmail} className="btn btn-primary" disabled={!verificationCode.trim()}>Verify & Update</button>
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
            <h3 style={{ marginBottom: '20px', color: '#2563eb' }}>Change Password</h3>
            {passwordError && <div className="error" style={{ marginBottom: '10px' }}>{passwordError}</div>}

            <label>Old Password</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
              <input type={showOldPassword ? 'text' : 'password'} placeholder="Old Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="form-input" style={{ flex: 1 }} />
              <button type="button" className="btn btn-outline" onClick={() => setShowOldPassword(s => !s)} aria-label={showOldPassword ? 'Hide old password' : 'Show old password'} style={{ padding: '6px 10px', background: 'none', border: 'none' }}>
                {showOldPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-7.5A11 11 0 0 1 6.06 6.06"/><path d="M1 1l22 22"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            <label>New Password</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
              <input type={showNewPassword ? 'text' : 'password'} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input" style={{ flex: 1 }} />
              <button type="button" className="btn btn-outline" onClick={() => setShowNewPassword(s => !s)} aria-label={showNewPassword ? 'Hide new password' : 'Show new password'} style={{ padding: '6px 10px', background: 'none', border: 'none' }}>
                {showNewPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-7.5A11 11 0 0 1 6.06 6.06"/><path d="M1 1l22 22"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            <label>Confirm New Password</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
              <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm New Password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="form-input" style={{ flex: 1 }} />
              <button type="button" className="btn btn-outline" onClick={() => setShowConfirmPassword(s => !s)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} style={{ padding: '6px 10px', background: 'none', border: 'none' }}>
                {showConfirmPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-7.5A11 11 0 0 1 6.06 6.06"/><path d="M1 1l22 22"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => { setShowPasswordChange(false); setPasswordError(''); setOldPassword(''); setNewPassword(''); setConfirmNewPassword(''); }} className="btn btn-secondary">Cancel</button>
              <button onClick={handleChangePassword} className="btn btn-primary">Update Password</button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default TeacherDashboard;
