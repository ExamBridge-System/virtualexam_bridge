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
  // Removed distribution state and related handlers

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

  // Removed handleSetDistribution function

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
        {/* Changed gridTemplateColumns to '1fr' to make it a single column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          {/* Add New Question Card (now spans full width) */}
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

            {/* Question Statistics integrated here */}
            <div style={{ marginTop: '20px', background: '#f7fafc', padding: '15px', borderRadius: '8px' }}>
              <h4>Question Statistics</h4>
              <p>Easy: {getQuestionCountByLevel('easy')}</p>
              <p>Medium: {getQuestionCountByLevel('medium')}</p>
              <p>Hard: {getQuestionCountByLevel('hard')}</p>
              <p><strong>Total: {questions.length}</strong></p>
              <p style={{ color: '#718096', marginTop: '10px', fontSize: '0.9em' }}>
                Questions will be randomly distributed to students during the exam.
              </p>
            </div>
          </div>
          
          {/* The second card (Set Distribution) has been removed */}
        </div>

        {/* All Questions Card */}
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