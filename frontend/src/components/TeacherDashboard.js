import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteExam = async (examId, examName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${examName}"?\n\nThis will permanently delete:\n- All questions\n- All student submissions\n- All uploaded files\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/teacher/exam/${examId}`);
      alert('Exam deleted successfully!');
      fetchExams();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete exam');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { color: '#fef3c7', textColor: '#92400e', text: '📅 Scheduled' },
      active: { color: '#d1fae5', textColor: '#065f46', text: '🟢 Active' },
      completed: { color: '#e0e7ff', textColor: '#3730a3', text: '✅ Completed' }
    };
    const badge = badges[status] || badges.scheduled;
    return <span className="badge" style={{ background: badge.color, color: badge.textColor }}>{badge.text}</span>;
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <h2>📚 Teacher Portal</h2>
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
          <h1>👋 Welcome back, {user?.name}!</h1>
          <p>Manage your exams, questions, and view student submissions</p>
        </div>

        {/* Classes Section */}
        <div className="card">
          <h2>📖 Your Classes</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
            You are teaching {user?.classes?.length || 0} classes
          </p>
          <div className="grid">
            {user?.classes && user.classes.length > 0 ? (
              user.classes.map((cls, index) => (
                <div key={index} className="class-card">
                  <h3>{cls}</h3>
                  <p style={{ marginTop: '10px', fontSize: '13px', opacity: 0.9 }}>Class ID: {cls}</p>
                </div>
              ))
            ) : (
              <p style={{ color: '#9ca3af', gridColumn: '1 / -1' }}>No classes assigned yet</p>
            )}
          </div>
          <button
            onClick={() => navigate('/teacher/exam/create')}
            className="btn btn-secondary"
            style={{ marginTop: '30px', padding: '14px 28px', fontSize: '15px' }}
          >
            ➕ Schedule New Exam
          </button>
        </div>

        {/* Exams Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h2>📋 All Exams</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>
                Total exams: {exams.length}
              </p>
            </div>
            {!loading && exams.length > 0 && (
              <button
                onClick={() => navigate('/teacher/exam/create')}
                className="btn btn-primary"
                style={{ padding: '12px 20px' }}
              >
                ➕ Add Exam
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading">⏳ Loading exams...</div>
          ) : exams.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>📝 Exam Name</th>
                    <th>👥 Class</th>
                    <th>📅 Date</th>
                    <th>🕐 Time</th>
                    <th>👨‍🎓 Students</th>
                    <th>📊 Status</th>
                    <th>⚙️ Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam._id}>
                      <td>
                        <strong>{exam.examName}</strong>
                      </td>
                      <td>
                        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                          {exam.class}
                        </span>
                      </td>
                      <td>{new Date(exam.scheduledDate).toLocaleDateString()}</td>
                      <td><strong>{exam.scheduledTime}</strong></td>
                      <td>
                        <span style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                          {exam.numberOfStudents}
                        </span>
                      </td>
                      <td>{getStatusBadge(exam.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => navigate(`/teacher/exam/${exam._id}/questions`)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            title="Manage questions"
                          >
                            Questions
                          </button>
                          <button
                            onClick={() => navigate(`/teacher/exam/${exam._id}/submissions`)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            title="View submissions"
                          >
                            Submissions
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam._id, exam.examName)}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            title="Delete exam"
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
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '2px dashed #e5e7eb'
            }}>
              <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '20px' }}>
                📭 No exams scheduled yet
              </p>
              <button
                onClick={() => navigate('/teacher/exam/create')}
                className="btn btn-primary"
              >
                ➕ Create Your First Exam
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {exams.length > 0 && (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '30px' }}>
            <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)', border: '2px solid #bfdbfe' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>{exams.length}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Total Exams</div>
            </div>
            <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%)', border: '2px solid #bbf7d0' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{exams.filter(e => e.status === 'completed').length}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Completed</div>
            </div>
            <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)', border: '2px solid #fef08a' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🟢</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{exams.filter(e => e.status === 'active').length}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Active</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;