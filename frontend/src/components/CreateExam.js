import React, { useState, useEffect } from 'react'; // <-- Corrected import statement
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
    semester: '',
    branch: '',
    section: '',
    subject: '',
    batch: selectedBatch,
    numberOfStudents: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: '',
  });

  const [examOptions, setExamOptions] = useState({
    semesters: [],
    branches: [],
    sections: {},
    subjects: {},
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchSemesters = async (date) => {
    if (date) {
      try {
        const response = await api.get(`/teacher/semesters/${date}`);
        const semesters = response.data.semesters;
        if (semesters.length === 1) {
          setFormData(prev => ({ ...prev, semester: semesters[0] }));
        }
        setExamOptions(prev => ({ ...prev, semesters }));
      } catch (error) {
        console.error('Error fetching semesters:', error);
      }
    }
  };

  const fetchBranches = async (date, semester) => {
    if (date && semester) {
      try {
        const response = await api.get(`/teacher/branches/${date}/${semester}`);
        setExamOptions(prev => ({ ...prev, branches: response.data.branches }));
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    }
  };

  const fetchSections = async (date, semester, branch) => {
    if (date && semester && branch) {
      try {
        const response = await api.get(`/teacher/sections/${date}/${semester}/${branch}`);
        setExamOptions(prev => ({ ...prev, sections: { ...prev.sections, [branch]: response.data.sections } }));
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    }
  };

  const fetchSubjects = async (date, semester, branch, section) => {
    if (date && semester && branch && section) {
      try {
        const response = await api.get(`/teacher/subjects/${date}/${semester}/${branch}/${section}`);
        setExamOptions(prev => ({ ...prev, subjects: { ...prev.subjects, [`${branch}-${section}`]: response.data.subjects } }));
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    }
  };

  useEffect(() => {
    if (formData.scheduledDate) {
      fetchSemesters(formData.scheduledDate);
    }
  }, [formData.scheduledDate]);

  useEffect(() => {
    if (formData.scheduledDate && formData.semester) {
      fetchBranches(formData.scheduledDate, formData.semester);
    }
  }, [formData.scheduledDate, formData.semester]);

  useEffect(() => {
    if (formData.scheduledDate && formData.semester && formData.branch) {
      fetchSections(formData.scheduledDate, formData.semester, formData.branch);
    }
  }, [formData.scheduledDate, formData.semester, formData.branch]);

  useEffect(() => {
    if (formData.scheduledDate && formData.semester && formData.branch && formData.section) {
      fetchSubjects(formData.scheduledDate, formData.semester, formData.branch, formData.section);
    }
  }, [formData.scheduledDate, formData.semester, formData.branch, formData.section]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Reset dependent fields
    if (name === 'scheduledDate') {
      setFormData(prev => ({ ...prev, semester: '', branch: '', section: '', subject: '', batch: '' }));
      setExamOptions(prev => ({ ...prev, semesters: [], branches: [], sections: {}, subjects: {} }));
    } else if (name === 'semester') {
      setFormData(prev => ({ ...prev, branch: '', section: '', subject: '', batch: '' }));
      setExamOptions(prev => ({ ...prev, branches: [], sections: {}, subjects: {} }));
    } else if (name === 'branch') {
      setFormData(prev => ({ ...prev, section: '', subject: '', batch: '' }));
      setExamOptions(prev => ({ ...prev, sections: {}, subjects: {} }));
    } else if (name === 'section') {
      setFormData(prev => ({ ...prev, subject: '', batch: '' }));
      setExamOptions(prev => ({ ...prev, subjects: {} }));
    } else if (name === 'subject') {
      // Auto-set batch if subject contains LAB
      if (value && value.toLowerCase().includes('lab')) {
        const date = new Date(formData.scheduledDate);
        const day = date.getDate();
        const autoBatch = day % 2 === 0 ? 'B1' : 'B2';
        setFormData(prev => ({ ...prev, batch: autoBatch }));
      } else {
        setFormData(prev => ({ ...prev, batch: '' }));
      }
    }
  };

  const fetchStudentCount = async (branch, section) => {
    if (branch && section) {
      try {
        const response = await api.get(`/teacher/students-count/${branch}/${section}`);
        setFormData(prev => ({ ...prev, numberOfStudents: response.data.count }));
      } catch (error) {
        console.error('Error fetching student count:', error);
      }
    }
  };

  useEffect(() => {
    if (formData.branch && formData.section) {
      fetchStudentCount(formData.branch, formData.section);
    }
  }, [formData.branch, formData.section]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);

    // Validate required fields
    if (!formData.semester || !formData.subject) {
      setError('Please select semester and subject before creating the exam.');
      setLoading(false);
      return;
    }

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

    // Validate required fields
    if (!formData.semester || !formData.subject) {
      setError('Please select semester and subject before creating the exam.');
      setBulkProcessing(false);
      return;
    }

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
                <label>Scheduled Date</label>
                <input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange} required />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleChange} required disabled={!formData.scheduledDate}>
                    <option value="">-- Select --</option>
                    {examOptions.semesters.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Branch</label>
                  <select name="branch" value={formData.branch} onChange={handleChange} required disabled={!formData.semester}>
                    <option value="">-- Select --</option>
                    {examOptions.branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Section</label>
                  <select name="section" value={formData.section} onChange={handleChange} required disabled={!formData.branch}>
                    <option value="">-- Select --</option>
                    {formData.branch && examOptions.sections[formData.branch]?.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Subject</label>
                  <select name="subject" value={formData.subject} onChange={handleChange} required disabled={!formData.section}>
                    <option value="">-- Select --</option>
                    {formData.section && examOptions.subjects[`${formData.branch}-${formData.section}`]?.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Batch</label>
                <input type="text" name="batch" value={formData.batch} onChange={handleChange} placeholder="e.g., B1 (Auto-filled for LAB subjects)"/>
              </div>
              <div className="form-group">
                <label>Number of Students</label>
                <input type="number" name="numberOfStudents" value={formData.numberOfStudents} onChange={handleChange} required min="1" placeholder="Enter number of students" />
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