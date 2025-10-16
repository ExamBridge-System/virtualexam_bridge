import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function TakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [setGenerated, setSetGenerated] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedScreenshots, setUploadedScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchExamDetails();
    checkExamStatus();
  }, []);

  const fetchExamDetails = async () => {
    try {
      const response = await api.get(`/exam/${examId}`);
      setExam(response.data.exam);
    } catch (error) {
      console.error('Error fetching exam:', error);
    }
  };

  const checkExamStatus = async () => {
    try {
      const response = await api.get(`/student/exam/${examId}/status`);
      
      if (response.data.setGenerated) {
        setSetGenerated(true);
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await api.get(`/student/exam/${examId}/questions`);
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleGenerateSet = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.post(`/student/exam/${examId}/generate-set`);
      setQuestions(response.data.questions);
      setSetGenerated(true);
      setSuccess('Your question set has been generated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate question set');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadScreenshot = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('screenshot', selectedFile);

    try {
      const response = await api.post(`/student/exam/${examId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadedScreenshots([...uploadedScreenshots, response.data.filename]);
      setSuccess('Screenshot uploaded successfully!');
      setSelectedFile(null);
      document.getElementById('fileInput').value = '';
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload screenshot');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitExam = async () => {
    if (uploadedScreenshots.length === 0) {
      setError('Please upload at least one screenshot before submitting');
      return;
    }

    const confirmSubmit = window.confirm('Are you sure you want to submit the exam? You cannot make changes after submission.');
    
    if (!confirmSubmit) return;

    setError('');
    setSubmitting(true);

    try {
      await api.post(`/student/exam/${examId}/submit`);
      alert('Exam submitted successfully!');
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading exam...</div>;
  }

  return (
    <div>
      <nav className="navbar">
        <h2 style={{ color: '#667eea' }}>{exam?.examName || 'Exam'}</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span>{user?.name} ({user?.rollNumber})</span>
        </div>
      </nav>

      <div className="container">
        {exam && (
          <div className="card">
            <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px' }}>
              <h3>{exam.examName}</h3>
              <p style={{ color: '#718096', marginTop: '10px' }}>
                <strong>Class:</strong> {exam.class}<br />
                <strong>Duration:</strong> {exam.duration} minutes<br />
                <strong>Date:</strong> {new Date(exam.scheduledDate).toLocaleDateString()} at {exam.scheduledTime}
              </p>
            </div>
          </div>
        )}

        {!setGenerated ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '20px' }}>Generate Your Question Set</h3>
            <p style={{ color: '#718096', marginBottom: '30px' }}>
              Click the button below to generate your unique set of questions. Once generated, 
              the same set will be shown every time you access this exam.
            </p>
            <button
              onClick={handleGenerateSet}
              className="btn btn-secondary"
              style={{ padding: '15px 40px', fontSize: '18px' }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Question Set'}
            </button>
            {error && <div className="error" style={{ marginTop: '20px' }}>{error}</div>}
            {success && <div className="success" style={{ marginTop: '20px' }}>{success}</div>}
          </div>
        ) : (
          <>
            <div className="card">
              <h3 style={{ marginBottom: '20px' }}>Your Questions</h3>
              
              {questions.map((q, index) => (
                <div
                  key={index}
                  style={{
                    padding: '20px',
                    marginBottom: '20px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#f7fafc',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <strong style={{ fontSize: '18px' }}>Question {index + 1}</strong>
                    <span
                      style={{
                        padding: '6px 16px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        background:
                          q.level === 'easy'
                            ? '#d1fae5'
                            : q.level === 'medium'
                            ? '#fef3c7'
                            : '#fecaca',
                        color:
                          q.level === 'easy'
                            ? '#065f46'
                            : q.level === 'medium'
                            ? '#92400e'
                            : '#991b1b',
                        textTransform: 'capitalize',
                      }}
                    >
                      {q.level}
                    </span>
                  </div>
                  <p style={{ fontSize: '16px', lineHeight: '1.6' }}>{q.questionText}</p>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '20px' }}>Upload Answer Screenshots</h3>
              <p style={{ color: '#718096', marginBottom: '20px' }}>
                Write your answers on paper, take clear screenshots, and upload them here.
              </p>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleUploadScreenshot}
                  className="btn btn-secondary"
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              {uploadedScreenshots.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                  <h4 style={{ marginBottom: '15px' }}>
                    Uploaded Screenshots ({uploadedScreenshots.length})
                  </h4>
                  <div className="grid">
                    {uploadedScreenshots.map((filename, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '15px',
                          border: '2px solid #48bb78',
                          borderRadius: '8px',
                          background: '#f0fff4',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ marginBottom: '10px', fontSize: '24px' }}>✓</div>
                        <p style={{ fontSize: '14px', color: '#2d3748', wordBreak: 'break-all' }}>
                          {filename}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '15px' }}>Submit Your Exam</h3>
              <p style={{ color: '#718096', marginBottom: '25px' }}>
                Make sure you have uploaded all your answer screenshots before submitting.
              </p>
              <button
                onClick={handleSubmitExam}
                className="btn btn-primary"
                style={{ padding: '15px 50px', fontSize: '18px' }}
                disabled={submitting || uploadedScreenshots.length === 0}
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TakeExam;
