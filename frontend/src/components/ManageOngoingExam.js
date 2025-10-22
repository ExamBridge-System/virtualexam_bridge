import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

function ManageOngoingExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = async () => {
    try {
      const [studentsRes, examRes] = await Promise.all([
        api.get(`/teacher/exam/${examId}/students`),
        api.get(`/exam/${examId}`)
      ]);

      setStudents(studentsRes.data.students);
      setExam(examRes.data.exam);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExchangePermission = async (studentExamId) => {
    try {
      await api.post(`/teacher/exam/${examId}/student/${studentExamId}/toggle-exchange`);
      // Refresh the students list
      fetchStudents();
    } catch (error) {
      console.error('Error toggling exchange permission:', error);
    }
  };

  const viewStudentDetails = (studentExamId) => {
    navigate(`/teacher/submission/${studentExamId}`);
  };

  return (
    <div>
      <nav className="navbar">
        <h2 style={{ color: '#667eea' }}>Manage Ongoing Exam</h2>
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
              Time: {exam.scheduledTime} | Duration: {exam.duration} minutes
            </p>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading students...</div>
        ) : (
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Students Taking Exam</h3>

            {students.length > 0 ? (
              <div>
                {students.map((studentExam) => (
                  <div
                    key={studentExam._id}
                    style={{
                      padding: '20px',
                      marginBottom: '15px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      background: '#f7fafc',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <div>
                        <h4 style={{ margin: 0, color: studentExam.exchangeCount > 0 ? '#dc2626' : 'inherit' }}>
                          {studentExam.studentId?.name}
                        </h4>
                        <p style={{ color: '#718096', margin: '5px 0' }}>
                          Roll: {studentExam.studentId?.rollNumber} | Email: {studentExam.studentId?.email}
                        </p>
                        <p style={{ color: '#718096', fontSize: '14px', margin: '5px 0' }}>
                          Status: {studentExam.status} |
                          Started: {new Date(studentExam.startedAt).toLocaleString()} |
                          Screenshots: {studentExam.screenshots?.length || 0} |
                          Questions: {studentExam.assignedQuestions?.length || 0}
                          {studentExam.exchangeCount > 0 && (
                            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                              {' | '}Exchanged {studentExam.exchangeCount} time{studentExam.exchangeCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => toggleExchangePermission(studentExam._id)}
                          className={`btn ${studentExam.exchangeAllowed ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          {studentExam.exchangeAllowed ? 'Disable Exchange' : 'Allow Exchange'}
                        </button>
                        <button
                          onClick={() => viewStudentDetails(studentExam._id)}
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    {/* Show assigned questions */}
                    <div style={{ marginTop: '15px' }}>
                      <h5 style={{ marginBottom: '10px', color: '#4a5568' }}>Assigned Questions:</h5>
                      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
                        {studentExam.assignedQuestions?.map((q, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '10px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              background: 'white',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                              <strong style={{ fontSize: '14px' }}>Question {index + 1}</strong>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
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
                            <p style={{ fontSize: '13px', lineHeight: '1.4', margin: 0 }}>{q.questionText}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#718096' }}>
                No students are currently taking this exam
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageOngoingExam;
