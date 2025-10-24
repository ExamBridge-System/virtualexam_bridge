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
    backgroundColor: isChecked ? '#2196F3' : 'white',
    color: isChecked ? 'white' : '#333',
    borderColor: isChecked ? '#2196F3' : '#ccc',
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
    scheduledDate: new Date().toISOString().split('T')[0], // Default to today's date
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
      console.log('Fetching semesters for date:', date);
      try {
        const response = await api.get(`/teacher/semesters/${date}`);
        console.log('Semesters response:', response.data);
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
        const branches = response.data.branches;
        if (branches.length === 1) {
          setFormData(prev => ({ ...prev, branch: branches[0] }));
        }
        setExamOptions(prev => ({ ...prev, branches }));
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    }
  };

  const fetchSections = async (date, semester, branch) => {
    if (date && semester && branch) {
      try {
        const response = await api.get(`/teacher/sections/${date}/${semester}/${branch}`);
        const sections = response.data.sections;
        if (sections.length === 1) {
          setFormData(prev => ({ ...prev, section: sections[0] }));
        }
        setExamOptions(prev => ({ ...prev, sections: { ...prev.sections, [branch]: sections } }));
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    }
  };

  const fetchSubjects = async (date, semester, branch, section) => {
    if (date && semester && branch && section) {
      try {
        const response = await api.get(`/teacher/subjects/${date}/${semester}/${branch}/${section}`);
        const subjects = response.data.subjects;
        if (subjects.length === 1) {
          setFormData(prev => ({ ...prev, subject: subjects[0] }));
        }
        setExamOptions(prev => ({ ...prev, subjects: { ...prev.subjects, [`${branch}-${section}`]: subjects } }));
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    }
  };

  const fetchBatch = async (date, semester, branch, section, subject) => {
    if (date && semester && branch && section && subject) {
      try {
        const response = await api.get(`/teacher/batch/${date}/${semester}/${branch}/${section}/${encodeURIComponent(subject)}`);
        const batch = response.data.batch;
        if (batch) {
          setFormData(prev => ({ ...prev, batch }));
        } else {
          setFormData(prev => ({ ...prev, batch: '' }));
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
        setFormData(prev => ({ ...prev, batch: '' }));
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

  // Auto-select single options
  useEffect(() => {
    if (examOptions.branches.length === 1 && !formData.branch) {
      setFormData(prev => ({ ...prev, branch: examOptions.branches[0] }));
    }
  }, [examOptions.branches]);

  useEffect(() => {
    if (formData.branch && examOptions.sections[formData.branch]?.length === 1 && !formData.section) {
      setFormData(prev => ({ ...prev, section: examOptions.sections[formData.branch][0] }));
    }
  }, [examOptions.sections, formData.branch]);

  useEffect(() => {
    if (formData.branch && formData.section && examOptions.subjects[`${formData.branch}-${formData.section}`]?.length === 1 && !formData.subject) {
      setFormData(prev => ({ ...prev, subject: examOptions.subjects[`${formData.branch}-${formData.section}`][0] }));
    }
  }, [examOptions.subjects, formData.branch, formData.section]);

  useEffect(() => {
    if (formData.scheduledDate && formData.semester && formData.branch && formData.section && formData.subject) {
      fetchBatch(formData.scheduledDate, formData.semester, formData.branch, formData.section, formData.subject);
    }
  }, [formData.scheduledDate, formData.semester, formData.branch, formData.section, formData.subject]);

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
      // Batch is now auto-filled via API call in useEffect
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
              {/* Exam Form Groups - Reordered for logical flow */}
              <div className="form-group">
                <label>Exam Name</label>
                <input type="text" name="examName" value={formData.examName} onChange={handleChange} required placeholder="e.g., Mid-Term Exam" style={{ padding: '10px', height: '40px', fontSize: '16px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Scheduled Date</label>
                  <input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange} required style={{ padding: '10px', height: '40px', fontSize: '16px' }} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Scheduled Time</label>
                  <input type="time" name="scheduledTime" value={formData.scheduledTime} onChange={handleChange} required style={{ padding: '10px', height: '40px', fontSize: '16px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Duration (in minutes)</label>
                  <input type="number" name="duration" value={formData.duration} onChange={handleChange} required min="1" placeholder="e.g., 60" style={{ padding: '10px', height: '40px', fontSize: '16px' }} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleChange} required disabled={!formData.scheduledDate} style={{ padding: '10px', height: '40px', fontSize: '16px' }}>
                    <option value="">-- Select --</option>
                    {examOptions.semesters.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Branch</label>
                  <select name="branch" value={formData.branch} onChange={handleChange} required disabled={!formData.semester} style={{ padding: '10px', height: '40px', fontSize: '16px' }}>
                    <option value="">-- Select --</option>
                    {examOptions.branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Section</label>
                  <select name="section" value={formData.section} onChange={handleChange} required disabled={!formData.branch} style={{ padding: '10px', height: '40px', fontSize: '16px' }}>
                    <option value="">-- Select --</option>
                    {formData.branch && examOptions.sections[formData.branch]?.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Subject</label>
                  <select name="subject" value={formData.subject} onChange={handleChange} required disabled={!formData.section} style={{ padding: '10px', height: '40px', fontSize: '16px' }}>
                    <option value="">-- Select --</option>
                    {formData.section && examOptions.subjects[`${formData.branch}-${formData.section}`]?.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Batch</label>
                  <input type="text" name="batch" value={formData.batch} onChange={handleChange} placeholder="e.g., B1 (Auto-filled for LAB subjects)" style={{ padding: '10px', height: '40px', fontSize: '16px' }} />
                </div>
              </div>
              <div className="form-group">
                <label>Number of Students</label>
                <input type="number" name="numberOfStudents" value={formData.numberOfStudents} onChange={handleChange} required min="1" placeholder="Enter number of students" style={{ padding: '10px', height: '40px', fontSize: '16px' }} />
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