import React, { useState, useEffect, useCallback } from 'react';
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
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadedScreenshots, setUploadedScreenshots] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);

  const fetchExamDetails = useCallback(async () => {
    try {
      const response = await api.get(`/exam/${examId}`);
      setExam(response.data.exam);
    } catch (error) {
      console.error('Error fetching exam:', error);
    }
  }, [examId]);

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await api.get(`/student/exam/${examId}/questions`);
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  }, [examId]);

  const checkExamStatus = useCallback(async () => {
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
  }, [examId, fetchQuestions]);

  // Calculate time left for exam
  const calculateTimeLeft = useCallback(() => {
    if (!exam || !exam.scheduledDate || !exam.scheduledTime || !exam.duration) return null;

    try {
      // Parse scheduledDate (assuming it's a Date object or ISO string)
      const examDate = new Date(exam.scheduledDate);
      if (isNaN(examDate.getTime())) {
        console.error('Invalid exam date:', exam.scheduledDate);
        return null;
      }

      // Parse scheduledTime (assuming format like "HH:MM")
      const [hours, minutes] = exam.scheduledTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        console.error('Invalid exam time:', exam.scheduledTime);
        return null;
      }

      // Set the time on the date
      examDate.setHours(hours, minutes, 0, 0);

      // Adjust for server in Singapore (SGT, UTC+8) and user likely in IST (UTC+5:30)
      // Server is 2.5 hours ahead, so shift exam time later by 2.5 hours
      examDate.setTime(examDate.getTime() + 2.5 * 60 * 60 * 1000);

      const examEndTime = new Date(examDate.getTime() + exam.duration * 60000);
      const now = new Date();

      const timeDiff = examEndTime - now;
      if (timeDiff <= 0) return { minutes: 0, seconds: 0 };

      const minutesLeft = Math.floor(timeDiff / 60000);
      const secondsLeft = Math.floor((timeDiff % 60000) / 1000);

      return { minutes: minutesLeft, seconds: secondsLeft };
    } catch (error) {
      console.error('Error calculating time left:', error);
      return null;
    }
  }, [exam]);

  // Update time left every second
  useEffect(() => {
    if (!exam) return;

    const timer = setInterval(() => {
      const time = calculateTimeLeft();
      setTimeLeft(time);

      // Auto-submit if time is up
      if (time && time.minutes === 0 && time.seconds === 0) {
        // Auto-submit logic will be handled here
        if (!submitting) {
          handleSubmitExam();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, calculateTimeLeft, submitting]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchExamDetails();
    checkExamStatus();
  }, [fetchExamDetails, checkExamStatus]);

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

  const handleFileSelect = (questionId, e) => {
    const file = e.target.files[0];
    setSelectedFiles(prev => ({
      ...prev,
      [questionId]: file
    }));
  };

  const handleUploadScreenshot = async (questionId) => {
    const selectedFile = selectedFiles[questionId];
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('screenshot', selectedFile);

    try {
      const response = await api.post(`/student/exam/${examId}/question/${questionId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedScreenshots(prev => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), response.data.filename]
      }));
      setSuccess('Screenshot uploaded successfully!');
      setSelectedFiles(prev => ({
        ...prev,
        [questionId]: null
      }));
      // Clear the file input
      const fileInput = document.getElementById(`fileInput-${questionId}`);
      if (fileInput) fileInput.value = '';
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload screenshot');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteScreenshot = async (questionId, filename) => {
    if (!window.confirm('Are you sure you want to delete this screenshot?')) return;

    try {
      await api.delete(`/student/exam/${examId}/question/${questionId}/screenshot/${filename}`);
      setUploadedScreenshots(prev => ({
        ...prev,
        [questionId]: prev[questionId].filter(f => f !== filename)
      }));
      setSuccess('Screenshot deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete screenshot');
    }
  };

  const handleSubmitExam = async () => {
    // Check if at least one screenshot is uploaded across all questions
    const totalScreenshots = Object.values(uploadedScreenshots).reduce((total, screenshots) => total + screenshots.length, 0);
    if (totalScreenshots === 0) {
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
          <button
            onClick={() => navigate('/student/dashboard')}
            className="btn btn-outline"
            style={{ marginRight: '15px' }}
          >
            Back to Dashboard
          </button>
          <span>{user?.name} ({user?.rollNumber})</span>
        </div>
      </nav>

      <div className="container">
        {exam && (
          <div className="card">
            <div style={{
              background: timeLeft && timeLeft.minutes < 5 ? '#fed7d7' : '#f7fafc',
              padding: '20px',
              borderRadius: '8px',
              border: timeLeft && timeLeft.minutes < 5 ? '2px solid #e53e3e' : '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{exam.examName}</h3>
                  <p style={{ color: '#718096', marginTop: '10px' }}>
                    <strong>Class:</strong> {exam.branch}-{exam.section}<br />
                    <strong>Duration:</strong> {exam.duration} minutes<br />
                    <strong>Date:</strong> {new Date(exam.scheduledDate).toLocaleDateString()} at {exam.scheduledTime}
                  </p>
                </div>
                {timeLeft && (
                  <div style={{
                    textAlign: 'center',
                    padding: '15px',
                    background: timeLeft.minutes < 5 ? '#e53e3e' : '#667eea',
                    color: 'white',
                    borderRadius: '8px',
                    minWidth: '120px'
                  }}>
                    <div style={{ fontSize: '14px', marginBottom: '5px' }}>Time Left</div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      fontFamily: 'monospace'
                    }}>
                      {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    {timeLeft.minutes < 5 && (
                      <div style={{ fontSize: '12px', marginTop: '5px' }}>
                        ⚠️ Running out of time!
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ fontSize: '18px' }}>Question {index + 1}</strong>
                  </div>
                  <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>{q.questionText}</p>

                  {/* Upload section for this question */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#4a5568' }}>Upload Answer Screenshots</h4>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                      <input
                        id={`fileInput-${q.questionId}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(q.questionId, e)}
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={() => handleUploadScreenshot(q.questionId)}
                        className="btn btn-secondary"
                        disabled={uploading || !selectedFiles[q.questionId]}
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>

                    {/* Display uploaded screenshots for this question */}
                    {uploadedScreenshots[q.questionId] && uploadedScreenshots[q.questionId].length > 0 && (
                      <div style={{ marginTop: '15px' }}>
                        <h5 style={{ marginBottom: '10px', color: '#4a5568' }}>
                          Uploaded Screenshots ({uploadedScreenshots[q.questionId].length})
                        </h5>
                        <div className="grid">
                          {uploadedScreenshots[q.questionId].map((filename, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '15px',
                                border: '2px solid #48bb78',
                                borderRadius: '8px',
                                background: '#f0fff4',
                                textAlign: 'center',
                                position: 'relative',
                              }}
                            >
                              <button
                                onClick={() => handleDeleteScreenshot(q.questionId, filename)}
                                style={{
                                  position: 'absolute',
                                  top: '5px',
                                  right: '5px',
                                  background: '#e53e3e',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Delete screenshot"
                              >
                                ×
                              </button>
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
                </div>
              ))}
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
                disabled={submitting}
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
