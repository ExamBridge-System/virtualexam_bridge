import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function Login() {
  const [userType, setUserType] = useState('teacher');
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
      const endpoint = userType === 'teacher' ? '/auth/teacher/login' : '/auth/student/login';
      const response = await api.post(endpoint, formData);

      login(response.data.user, response.data.token);

      if (userType === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
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
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          Internal Test System
        </h1>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '30px' }}>
          <button
            className={`btn ${userType === 'teacher' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setUserType('teacher')}
          >
            Teacher Login
          </button>
          <button
            className={`btn ${userType === 'student' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setUserType('student')}
          >
            Student Login
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
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

        <div className="info-box" style={{ marginTop: '20px', textAlign: 'center' }}>
          <p>For demo purposes, register users using API endpoints</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
