import React, { useState } from 'react'; // <-- Corrected import statement
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Papa from 'papaparse';

// --- Style Objects for Inline Styling ---
const styles = {
  difficultySelector: {
    marginLeft: '12px',
    display: 'flex',
    whiteSpace: 'nowrap',
  },
  difficultyLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    marginRight: '15px', // Spacing between options
  },
  difficultyRadio: (isChecked) => ({ // Function to handle checked state
    appearance: 'none',
    WebkitAppearance: 'none', // For Safari/Chrome
    MozAppearance: 'none',    // For Firefox
    width: '16px',
    height: '16px',
    // Change checked color here:
    border: `1px solid ${isChecked ? '#2196F3' : '#ccc'}`, // Use blue border when checked
    borderRadius: '3px',
    marginRight: '5px',
    position: 'relative',
    outline: 'none',
    transition: 'background-color 0.2s, border-color 0.2s',
    // Change checked color here:
    backgroundColor: isChecked ? '#2196F3' : 'white', // Use blue background when checked
  }),
  // Checkmark style (positioning might need minor tweaks)
  checkmark: {
    position: 'absolute',
    top: '0px',
    left: '2px',
    fontSize: '12px',
    color: 'white', // Checkmark color
    lineHeight: 1,
  },
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
};
// --- End Style Objects ---

function CreateExam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedClass = location.state?.selectedClass || '';
  const selectedBatch = location.state?.selectedBatch || '';

  const [formData, setFormData] = useState({
    examName: '',
    class: selectedClass,
    batch: selectedBatch,
    numberOfStudents: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const response = await api.post('/exam/create', formData);
      setSuccess('Exam created successfully!');
      setTimeout(() => navigate(`/teacher/exam/${response.data.exam._id}/questions`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
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
    if (!csvFile) return;
    setBulkProcessing(true); setError(''); setParsedQuestions([]);
    Papa.parse(csvFile, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        const validQuestions = results.data
          .filter(row => row.questionText && !row.questionText.trim().startsWith('#'))
          .map(row => ({
            questionText: row.questionText || '',
            level: ['easy', 'medium', 'hard'].includes(row.level?.toLowerCase()) ? row.level.toLowerCase() : 'easy',
          }));
        setParsedQuestions(validQuestions);
        setBulkProcessing(false);
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
      const response = await api.post('/exam/create', formData);
      const examId = response.data.exam._id;
      await api.post(`/exam/${examId}/questions/bulk`, { questions: parsedQuestions });
      setSuccess('Exam and questions uploaded successfully!');
      setTimeout(() => navigate(`/teacher/exam/${examId}/questions`), 1200);
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
        <h2 style={{ color: '#667eea' }}>Schedule New Exam</h2>
        <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-primary">
          Back to Dashboard
        </button>
      </nav>
      <div className="container">
        <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>Create Exam</h2>
          <form onSubmit={handleSubmit}>
            <fieldset disabled={bulkOpen}>
              {/* Exam Form Groups */}
              <div className="form-group">
                <label>Exam Name</label>
                <input type="text" name="examName" value={formData.examName} onChange={handleChange} required placeholder="e.g., Mid-Term Exam" />
              </div>
              <div className="form-group">
                <label>Class</label>
                {selectedClass ? (
                  <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>{selectedClass}</div>
                ) : (
                  <select name="class" value={formData.class} onChange={handleChange} required>
                    <option value="">-- Select Class --</option>
                    {user?.classes && user.classes.map((cls, index) => (
                      <option key={index} value={cls}>{cls}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>Batch</label>
                <input type="text" name="batch" value={formData.batch} onChange={handleChange} placeholder="e.g., B1 (Optional)"/>
              </div>
              <div className="form-group">
                <label>Number of Students</label>
                <input type="number" name="numberOfStudents" value={formData.numberOfStudents} onChange={handleChange} required min="1" placeholder="Enter number of students" />
              </div>
              <div className="form-group">
                <label>Scheduled Date</label>
                <input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Scheduled Time</label>
                <input type="time" name="scheduledTime" value={formData.scheduledTime} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Duration (in minutes)</label>
                <input type="number" name="duration" value={formData.duration} onChange={handleChange} required min="1" placeholder="e.g., 60" />
              </div>
            </fieldset>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-secondary" style={{ flex: 1 }} disabled={loading || bulkOpen}>
                {loading ? 'Creating...' : 'Create & Add Manually'}
              </button>
              <button
                type="button"
                className="btn btn-outline" // Keep this for base styling
                style={ bulkOpen ? styles.cancelButtonStyle : styles.defaultOutlineButtonStyle }
                onClick={() => { setBulkOpen(!bulkOpen); setParsedQuestions([]); setError(''); }}
                disabled={loading}
              >
                {bulkOpen ? 'Cancel Bulk Upload' : 'Bulk Upload Questions'}
              </button>
            </div>
          </form>

          {/* Bulk Upload Section */}
          {bulkOpen && (
            <div style={{ marginTop: '20px', padding: '16px', border: '1px dashed #e2e8f0', borderRadius: '8px' }}>
              <p style={{ marginTop: 0 }}><strong>Bulk upload format</strong>: <strong>questionText,level</strong></p>
              <a href="#" onClick={handleDownloadTemplate}>Download CSV template</a>
              <div style={{ marginTop: '12px' }}>
                <input type="file" accept=".csv,text/csv" onChange={(e) => setCsvFile(e.target.files[0] || null)} />
                <button type="button" className="btn btn-primary" style={{ marginLeft: '8px' }} disabled={!csvFile || bulkProcessing} onClick={handleParseCsv}>
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

                      {/* Apply Inline Styles for radio buttons */}
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
                              style={styles.difficultyRadio(q.level === level)} // Pass checked state
                            />
                            {/* Checkmark Span - only visible when checked */}
                            {q.level === level && (
                              <span style={styles.checkmark}>✔</span>
                            )}
                            {/* Need a placeholder span when not checked to maintain alignment if checkmark pushes text */}
                            {! (q.level === level) && <span style={{width: '1em', display: 'inline-block'}}></span>}
                            {' '}{/* Add a space */}
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-secondary" onClick={handleBulkSubmit} disabled={bulkProcessing}>
                      {bulkProcessing ? 'Processing...' : 'Create Exam & Upload Questions'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => { setParsedQuestions([]); setCsvFile(null); }}>Clear</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateExam;