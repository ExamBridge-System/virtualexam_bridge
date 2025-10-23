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

  return (
    <div className="container" style={{ paddingTop: '60px' }}>
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img
            src="/logo192.png"
            alt="Chaitanya Bharathi Institute of Technology Logo"
            style={{ width: '80px', height: '80px', marginBottom: '15px' }}
          />
          <h1 style={{ margin: '0', fontSize: '24px', color: '#2563eb' }}>
            Chaitanya Bharathi Institute of Technology
          </h1>
          <h2 style={{ margin: '5px 0 0 0', fontSize: '18px', color: '#6b7280', fontWeight: 'normal' }}>
            Internal Test System
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ID</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your ID"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
