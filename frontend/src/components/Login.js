import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if it's admin login
      if (formData.email === 'admin@example.com') {
        const response = await api.post('/admin/login', formData);
        login(response.data.user, response.data.token);
        navigate('/admin/dashboard');
      } else {
        const response = await api.post('/auth/login', formData);
        login(response.data.user, response.data.token);

        if (response.data.user.role === 'teacher') {
          navigate('/teacher/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Forgot Password Handlers
  const handleSendResetCode = async () => {
    setForgotMessage('');
    setForgotError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password/send-code', { email: forgotEmail });
      setForgotMessage(response.data.message);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotMessage('');
    setForgotError('');
    setLoading(true);
    if (newPwd !== confirmNewPwd) {
      setForgotError('New passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/forgot-password/reset', { 
        email: forgotEmail, 
        code: forgotCode, 
        newPassword: newPwd, 
        confirmPassword: confirmNewPwd 
      });
      
      setForgotMessage(response.data.message + " You can now log in.");
      
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotCode('');
        setNewPwd('');
        setConfirmNewPwd('');
      }, 3000);
      
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '60px' }}>
      <div className="card" style={{ maxWidth: '450px', margin: '0 auto', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img
            src="/logo192.png"
            alt="CBIT Logo"
            style={{ width: '80px', height: '80px', marginBottom: '15px' }}
          />
          <h1 style={{ margin: '0', fontSize: '22px', color: '#2563eb', fontWeight: '600' }}>
            Chaitanya Bharathi Institute of Technology
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#6b7280' }}>
            Internal Test System
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#374151'
            }}>
              ID
            </label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your ID (Roll No or Teacher ID)"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#374151'
            }}>
              PASSWORD
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '12px',
              fontSize: '15px',
              fontWeight: '600',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            disabled={loading}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
          
          {/* Forgot Password Link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              type="button" 
              onClick={() => {
                setShowForgotModal(true);
                setForgotError('');
                setForgotMessage('');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#2563eb', 
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'none',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
      
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '20px', color: '#2563eb' }}>
              {forgotStep === 1 ? 'Reset Password' : 'Verify & Reset Password'}
            </h3>
            
            {forgotMessage && (
              <div style={{
                padding: '12px',
                marginBottom: '15px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                color: '#16a34a',
                fontSize: '14px'
              }}>
                {forgotMessage}
              </div>
            )}
            
            {forgotError && (
              <div style={{
                padding: '12px',
                marginBottom: '15px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#dc2626',
                fontSize: '14px'
              }}>
                {forgotError}
              </div>
            )}

            {forgotStep === 1 ? (
              <>
                <p style={{ marginBottom: '15px', color: '#6b7280', fontSize: '14px' }}>
                  Enter the email address linked to your account. We'll send you a verification code.
                </p>
                <input
                  type="email"
                  placeholder="Your Email Address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="form-input"
                  style={{ 
                    marginBottom: '20px',
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  disabled={loading}
                />
                <div className="flex-between" style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotStep(1);
                      setForgotEmail('');
                      setForgotError('');
                      setForgotMessage('');
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendResetCode}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={!forgotEmail.trim() || loading}
                  >
                    {loading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ marginBottom: '15px', color: '#6b7280', fontSize: '14px' }}>
                  A verification code has been sent to <strong>{forgotEmail}</strong>. Enter it below along with your new password.
                </p>
                
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Verification Code
                </label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value)}
                  className="form-input"
                  style={{ 
                    marginBottom: '15px',
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  disabled={loading}
                />
                
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="form-input"
                  style={{ 
                    marginBottom: '15px',
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  disabled={loading}
                />
                
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPwd}
                  onChange={(e) => setConfirmNewPwd(e.target.value)}
                  className="form-input"
                  style={{ 
                    marginBottom: '20px',
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  disabled={loading}
                />

                <div className="flex-between" style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setForgotStep(1);
                      setForgotCode('');
                      setNewPwd('');
                      setConfirmNewPwd('');
                      setForgotError('');
                      setForgotMessage('');
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleResetPassword}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={!forgotCode.trim() || !newPwd.trim() || !confirmNewPwd.trim() || loading}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;