import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

// Get the backend URL from the API configuration
const BACKEND_URL = 'http://localhost:3001';

function ViewStudentSubmissions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubmissions = async () => {
    try {
      const [submissionsRes, examRes] = await Promise.all([
        api.get(`/teacher/exam/${examId}/submissions`),
        api.get(`/exam/${examId}`)
      ]);
      
      setSubmissions(submissionsRes.data.submissions);
      setExam(examRes.data.exam);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewSubmissionDetails = async (submissionId) => {
    try {
      const response = await api.get(`/teacher/submission/${submissionId}`);
      setSelectedSubmission(response.data.submission);
    } catch (error) {
      console.error('Error fetching submission details:', error);
    }
  };

  return (
    <div>
      <nav className="navbar">
        <h2 style={{ color: '#667eea' }}>Student Submissions</h2>
        <button onClick={() => navigate('/teacher/dashboard')} className="btn btn-primary">
          Back to Dashboard
        </button>
      </nav>

      <div className="container">
        {exam && (
          <div className="card">
            <h3>{exam.examName}</h3>
            <p style={{ color: '#718096', marginTop: '10px' }}>
              Class: {exam.class} | Date: {new Date(exam.scheduledDate).toLocaleDateString()} | 
              Time: {exam.scheduledTime}
            </p>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading submissions...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selectedSubmission ? '1fr 2fr' : '1fr', gap: '20px' }}>
            <div className="card">
              <h3 style={{ marginBottom: '20px' }}>All Students</h3>
              
              {submissions.length > 0 ? (
                <div>
                  {submissions.map((submission) => (
                    <div
                      key={submission._id}
                      style={{
                        padding: '15px',
                        marginBottom: '10px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: selectedSubmission?._id === submission._id ? '#f7fafc' : 'white',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => viewSubmissionDetails(submission._id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{submission.studentId?.name}</strong>
                          <p style={{ color: '#718096', fontSize: '14px', marginTop: '5px' }}>
                            Roll: {submission.studentId?.rollNumber}
                          </p>
                        </div>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            background:
                              submission.status === 'submitted'
                                ? '#d1fae5'
                                : submission.status === 'in_progress'
                                ? '#fef3c7'
                                : '#e2e8f0',
                            color:
                              submission.status === 'submitted'
                                ? '#065f46'
                                : submission.status === 'in_progress'
                                ? '#92400e'
                                : '#2d3748',
                          }}
                        >
                          {submission.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p style={{ color: '#718096', fontSize: '13px', marginTop: '8px' }}>
                        Screenshots: {submission.screenshots?.length || 0} | 
                        Questions: {submission.assignedQuestions?.length || 0}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#718096' }}>
                  No submissions yet
                </p>
              )}
            </div>

            {selectedSubmission && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Submission Details</h3>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="btn"
                    style={{ padding: '6px 12px', background: '#e2e8f0' }}
                  >
                    Close
                  </button>
                </div>

                <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4>{selectedSubmission.studentId?.name}</h4>
                  <p style={{ color: '#718096', marginTop: '5px' }}>
                    Roll Number: {selectedSubmission.studentId?.rollNumber}<br />
                    Email: {selectedSubmission.studentId?.email}<br />
                    Class: {selectedSubmission.studentId?.class}
                  </p>
                  {selectedSubmission.submittedAt && (
                    <p style={{ color: '#718096', marginTop: '10px' }}>
                      Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                <h4 style={{ marginBottom: '15px' }}>Assigned Questions</h4>
                {selectedSubmission.assignedQuestions?.map((q, index) => {
                  // Group screenshots by questionId
                  const questionScreenshots = selectedSubmission.screenshots?.filter(
                    screenshot => screenshot.questionId._id.toString() === q.questionId._id.toString()
                  ) || [];

                  return (
                    <div
                      key={index}
                      style={{
                        padding: '15px',
                        marginBottom: '15px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <strong>Question {index + 1}</strong>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
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
                          }}
                        >
                          {q.level}
                        </span>
                      </div>
                      <p>{q.questionText}</p>

                      {/* Screenshots for this question */}
                      <div style={{ marginTop: '15px' }}>
                        <h5 style={{ marginBottom: '10px', color: '#4a5568' }}>
                          Screenshots ({questionScreenshots.length})
                        </h5>
                        {questionScreenshots.length > 0 ? (
                          <div className="grid">
                            {questionScreenshots.map((screenshot, sIndex) => (
                              <div
                                key={sIndex}
                                style={{
                                  padding: '15px',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s',
                                }}
                                onClick={() => setFullScreenImage({
                                  url: `${BACKEND_URL}/uploads/screenshots/${screenshot.filename}`,
                                  filename: screenshot.filename,
                                  uploadedAt: screenshot.uploadedAt,
                                  index: sIndex + 1,
                                  questionIndex: index + 1
                                })}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <img
                                  src={`${BACKEND_URL}/uploads/screenshots/${screenshot.filename}`}
                                  alt={`Screenshot ${sIndex + 1} for Question ${index + 1}`}
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '200px',
                                    borderRadius: '8px',
                                    marginBottom: '10px',
                                  }}
                                />
                                <p style={{ fontSize: '12px', color: '#718096' }}>
                                  {screenshot.filename}
                                </p>
                                <p style={{ fontSize: '11px', color: '#718096' }}>
                                  {new Date(screenshot.uploadedAt).toLocaleString()}
                                </p>
                                <p style={{ fontSize: '11px', color: '#667eea', marginTop: '5px' }}>
                                  Click to view full size
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ textAlign: 'center', color: '#a0aec0', padding: '10px', fontSize: '14px' }}>
                            No screenshots uploaded for this question
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            overflow: 'auto',
          }}
          onClick={() => setFullScreenImage(null)}
        >
          {/* Close Button */}
          <button
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#333',
              fontWeight: 'bold',
              transition: 'all 0.3s',
              zIndex: 10000,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setFullScreenImage(null);
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>

          {/* Image Info Header */}
          <div
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '15px 20px',
              borderRadius: '8px',
              color: '#333',
              zIndex: 10000,
            }}
          >
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
              Screenshot {fullScreenImage.index} for Question {fullScreenImage.questionIndex}
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
              {fullScreenImage.filename}
            </p>
            <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#999' }}>
              {new Date(fullScreenImage.uploadedAt).toLocaleString()}
            </p>
          </div>

          {/* Full Size Image Container */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fullScreenImage.url}
              alt={`Screenshot ${fullScreenImage.index}`}
              style={{
                maxWidth: '90%',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                backgroundColor: 'white',
              }}
              onError={(e) => {
                console.error('Image failed to load:', fullScreenImage.url);
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<p style="color: white; text-align: center;">Failed to load image. Please check if the file exists.</p>';
              }}
            />
          </div>

          {/* Instructions */}
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '10px 20px',
              borderRadius: '8px',
              color: '#333',
              fontSize: '13px',
              zIndex: 10000,
            }}
          >
            Click anywhere outside the image or press the × button to close
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewStudentSubmissions;