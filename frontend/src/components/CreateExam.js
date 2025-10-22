import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function CreateExam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    examName: '',
    class: '',
    numberOfStudents: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/teacher/exam/create', formData);
      setSuccess('Exam created successfully!');
      
      setTimeout(() => {
        navigate(`/teacher/exam/${response.data.exam._id}/questions`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <nav className="navbar">
        <h2 style={{ color: '#667eea' }}>Schedule New Exam</h2>
        <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-primary">
          Back to Dashboard
        </button>
      </nav>

      <div className="container">
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>Create Exam</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Exam Name</label>
              <input
                type="text"
                name="examName"
                value={formData.examName}
                onChange={handleChange}
                required
                placeholder="e.g., Mid-Term Exam"
              />
            </div>

            <div className="form-group">
              <label>Select Class</label>
              <select
                name="class"
                value={formData.class}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Class --</option>
                {user?.classes && user.classes.map((cls, index) => (
                  <option key={index} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Number of Students</label>
              <input
                type="number"
                name="numberOfStudents"
                value={formData.numberOfStudents}
                onChange={handleChange}
                required
                min="1"
                placeholder="Enter number of students"
              />
            </div>

            <div className="form-group">
              <label>Scheduled Date</label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Scheduled Time</label>
              <input
                type="time"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (in minutes)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                min="1"
                placeholder="e.g., 60"
              />
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '20px' }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Exam & Add Questions'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateExam;