import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import Papa from 'papaparse';

// --- Style Objects for Inline Styling ---
const styles = {
  difficultySelector: {
    marginLeft: '12px',
    display: 'flex',
    gap: '8px', // Better spacing between buttons
  },
  difficultyLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '6px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white',
    transition: 'background-color 0.2s, border-color 0.2s',
    fontSize: '14px',
    fontWeight: '500',
  },
  difficultyRadio: (isChecked) => ({
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    width: '0',
    height: '0',
    position: 'absolute',
    opacity: 0,
  }),
  difficultyButton: (isChecked) => ({
    // Use a subtle tinted background when selected, keep white otherwise
    backgroundColor: isChecked ? '#eaf4ff' : 'white',
    color: isChecked ? '#0b66d1' : '#333',
    borderColor: isChecked ? '#bfe1ff' : '#ccc',
  }),
  // Style for the cancel button
  cancelButtonStyle: {
    flex: 1,
    backgroundColor: '#f56565', // Red background
    color: 'white',           // White text
    borderColor: '#f56565',   // Matching border
  },
  defaultOutlineButtonStyle: {
    flex: 1,
  },
  // checkmark shown next to selected difficulty
  checkmark: {
    marginRight: '8px',
    color: '#0b66d1',
    fontWeight: 700,
  },
};
// --- End Style Objects ---

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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await api.get(`/teacher/exam/${examId}/questions`);
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  }, [examId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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

  const handleDownloadTemplate = async (e) => {
    e.preventDefault(); setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/exam/questions/template', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to download template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'question_template.csv';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to download template');
    }
  };

  const handleParseCsv = () => {
    const fileToParse = fileInputRef.current?.files[0] || null;
    if (!fileToParse) {
      setError('Please select a CSV file to parse');
      return;
    }
    // File is handled via ref
    setBulkProcessing(true); setError(''); setParsedQuestions([]);
    const normalizeHeader = (h) => (h || '').toString().replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const mapRowToQuestion = (row, qField, lField) => {
      const qText = (row[qField] || row.question || row.questionText || row.text || '') + '';
      const lvl = (lField ? (row[lField] || '') : (row.level || row.difficulty || '')) + '';
      return {
        questionText: qText.trim(),
        level: ['easy', 'medium', 'hard'].includes(lvl.toLowerCase()) ? lvl.toLowerCase() : 'easy',
      };
    };

    Papa.parse(fileToParse, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => normalizeHeader(h),
      complete: (results) => {
        try {
          const fields = results.meta && results.meta.fields ? results.meta.fields.map(f => (f || '').toString()) : [];
          const qField = fields.find(f => /question|qtext|text/.test(f)) || null;
          const lField = fields.find(f => /level|difficulty|diff/.test(f)) || null;

          let rows = results.data || [];

          if (!qField) {
            Papa.parse(fileToParse, {
              header: false,
              skipEmptyLines: true,
              complete: (raw) => {
                const parsed = (raw.data || [])
                  .map(r => ({ questionText: (r[0] || '') + '', level: ((r[1] || 'easy') + '').toLowerCase() }))
                  .filter(r => r.questionText && r.questionText.trim() && !r.questionText.trim().startsWith('#'))
                  .map(r => ({ questionText: r.questionText.trim(), level: ['easy','medium','hard'].includes(r.level) ? r.level : 'easy' }));
                if (parsed.length === 0) {
                  setError('No valid questions found in the CSV. Make sure the file has a question column.');
                }
                setParsedQuestions(parsed);
                setBulkProcessing(false);
              },
              error: (e) => {
                setError('Failed to parse CSV (headerless fallback): ' + e.message);
                setBulkProcessing(false);
              }
            });
            return;
          }

          const validQuestions = rows
            .map(r => mapRowToQuestion(r, qField, lField))
            .filter(r => r.questionText && r.questionText.trim() && !r.questionText.trim().startsWith('#'));

          if (validQuestions.length === 0) {
            setError('No valid questions found in the CSV. Ensure there is a question column (questionText, question, text) and optional level column (level, difficulty).');
          }

          setParsedQuestions(validQuestions);
        } catch (err) {
          setError('Failed to parse CSV: ' + (err.message || err));
        } finally {
          setBulkProcessing(false);
        }
      },
      error: (err) => {
        setError('Failed to parse CSV: ' + err.message);
        setBulkProcessing(false);
      },
    });
  };

  const handleDifficultyChange = (index, newLevel) => {
    const updatedQuestions = [...parsedQuestions];
    updatedQuestions[index].level = newLevel;
    setParsedQuestions(updatedQuestions);
  };

  const handleBulkSubmit = async () => {
    setBulkProcessing(true); setError(''); setSuccess('');

    try {
      await api.post(`/exam/${examId}/questions/bulk`, { questions: parsedQuestions });
      setSuccess('Questions uploaded successfully!');
      setParsedQuestions([]);
      // File cleared via ref
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchQuestions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("BULK UPLOAD FAILED:", err);
      if (err.response) {
        console.error("Backend Response:", err.response.data);
        setError(`Upload Failed: ${err.response.data.message || 'Check console for details.'}`);
      } else if (err.request) {
        console.error("No response from server:", err.request);
        setError('Upload failed: No response from the server.');
      } else {
        console.error('Error', err.message);
        setError(`Upload failed: ${err.message}`);
      }
    } finally {
      setBulkProcessing(false);
    }
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

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="submit"
                  className="btn btn-secondary"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Question'}
                </button>
                <span style={{ color: '#718096', fontSize: '14px' }}>or</span>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setBulkOpen(!bulkOpen)}
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  Bulk Upload Questions
                </button>
              </div>
            </form>

            {/* Bulk Upload Section */}
            {bulkOpen && (
              <div style={{ marginTop: '20px', padding: '16px', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
                <p style={{ marginTop: 0 }}><strong>Bulk upload format</strong>: <strong>questionText,level</strong></p>
                <button type="button" onClick={handleDownloadTemplate} style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}>Download CSV template</button>
                <div style={{ marginTop: '12px' }}>
                  <input ref={fileInputRef} type="file" accept=".csv,text/csv" />
                  <button type="button" className="btn btn-primary" style={{ marginLeft: '8px' }} disabled={bulkProcessing} onClick={handleParseCsv}>
                    {bulkProcessing ? 'Parsing...' : 'Parse CSV'}
                  </button>
                </div>

                {bulkProcessing && <p>Parsing...</p>}

                {parsedQuestions.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <h4>Preview & Set Difficulty ({parsedQuestions.length} questions)</h4>
                    {parsedQuestions.map((q, idx) => (
                      <div key={idx} style={{ padding: '8px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, fontWeight: 600 }}>{q.questionText}</div>
                        <div style={styles.difficultySelector}>
                          {[ 'easy', 'medium', 'hard' ].map((level, levelIdx) => (
                            <label
                              key={level}
                              style={{...styles.difficultyLabel, marginRight: levelIdx < 2 ? '15px' : '0'}}
                            >
                              <input
                                type="radio"
                                name={`diff-${idx}`}
                                checked={q.level === level}
                                onChange={() => handleDifficultyChange(idx, level)}
                                style={styles.difficultyRadio(q.level === level)}
                              />
                              {q.level === level && (
                                <span style={styles.checkmark}>✔</span>
                              )}
                              {! (q.level === level) && <span style={{width: '1em', display: 'inline-block'}}></span>}
                              {' '}{level.charAt(0).toUpperCase() + level.slice(1)}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <button type="button" className="btn btn-secondary" onClick={handleBulkSubmit} disabled={bulkProcessing}>
                        {bulkProcessing ? 'Processing...' : 'Upload Questions'}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => { setParsedQuestions([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}>Clear</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Question Statistics Card */}
          <div className="card">
            <h4>Question Statistics</h4>
            <p>Easy: {getQuestionCountByLevel('easy')}</p>
            <p>Medium: {getQuestionCountByLevel('medium')}</p>
            <p>Hard: {getQuestionCountByLevel('hard')}</p>
            <p><strong>Total: {questions.length}</strong></p>
            <p style={{ color: '#718096', marginTop: '10px', fontSize: '0.9em' }}>
              Questions will be randomly distributed to students during the exam.
            </p>
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