import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

function AddQuestions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({
    questionText: '',
    level: 'easy',
  });
  const [distribution, setDistribution] = useState({
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await api.get(`/teacher/exam/${examId}/questions`);
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDistributionChange = (e) => {
    setDistribution({
      ...distribution,
      [e.target.name]: parseInt(e.target.value) || 0,
    });
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post(`/teacher/exam/${examId}/question`, formData);
      setSuccess('Question added successfully!');
      setFormData({ questionText: '', level: 'easy' });
      fetchQuestions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDistribution = async () => {
    setError('');
    setSuccess('');

    try {
      await api.put(`/teacher/exam/${examId}/distribution`, distribution);
      setSuccess('Question distribution set successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set distribution');
    }
  };

  const getQuestionCountByLevel = (level) => {
    return questions.filter(q => q.level === level).length;
  };

  return (
    <div>
      <nav className="navbar">
        <h2 style={{ color: '#667eea' }}>Add Questions</h2>
        <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-primary">
          Back to Dashboard
        </button>
      </nav>

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Add New Question</h3>
            <form onSubmit={handleAddQuestion}>
              <div className="form-group">
                <label>Question Text</label>
                <textarea
                  name="questionText"
                  value={formData.questionText}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Enter your question here..."
                />
              </div>

              <div className="form-group">
                <label>Difficulty Level</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  required
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <button
                type="submit"
                className="btn btn-secondary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Question'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Set Question Distribution</h3>
            <p style={{ color: '#718096', marginBottom: '20px' }}>
              Define how many questions of each level should appear in each student's set
            </p>

            <div className="form-group">
              <label>Easy Questions per Set (Available: {getQuestionCountByLevel('easy')})</label>
              <input
                type="number"
                name="easy"
                value={distribution.easy}
                onChange={handleDistributionChange}
                min="0"
                max={getQuestionCountByLevel('easy')}
              />
            </div>

            <div className="form-group">
              <label>Medium Questions per Set (Available: {getQuestionCountByLevel('medium')})</label>
              <input
                type="number"
                name="medium"
                value={distribution.medium}
                onChange={handleDistributionChange}
                min="0"
                max={getQuestionCountByLevel('medium')}
              />
            </div>

            <div className="form-group">
              <label>Hard Questions per Set (Available: {getQuestionCountByLevel('hard')})</label>
              <input
                type="number"
                name="hard"
                value={distribution.hard}
                onChange={handleDistributionChange}
                min="0"
                max={getQuestionCountByLevel('hard')}
              />
            </div>

            <div style={{ 
              background: '#f7fafc', 
              padding: '15px', 
              borderRadius: '8px', 
              marginTop: '15px' 
            }}>
              <strong>Total Questions per Set: {distribution.easy + distribution.medium + distribution.hard}</strong>
            </div>

            <button
              onClick={handleSetDistribution}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '15px' }}
            >
              Set Distribution
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>All Questions ({questions.length})</h3>
          
          {questions.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Level</th>
                  <th>Added On</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question, index) => (
                  <tr key={question._id}>
                    <td>{index + 1}</td>
                    <td>{question.questionText}</td>
                    <td>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background:
                            question.level === 'easy'
                              ? '#d1fae5'
                              : question.level === 'medium'
                              ? '#fef3c7'
                              : '#fecaca',
                          color:
                            question.level === 'easy'
                              ? '#065f46'
                              : question.level === 'medium'
                              ? '#92400e'
                              : '#991b1b',
                          textTransform: 'capitalize',
                        }}
                      >
                        {question.level}
                      </span>
                    </td>
                    <td>{new Date(question.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#718096' }}>
              No questions added yet. Add your first question above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddQuestions;