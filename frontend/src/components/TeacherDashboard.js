import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format for exam scheduling
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format for viewing schedule

  // Generate date options for dropdown
  const dateOptions = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    let label;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    dateOptions.push({ value: dateStr, label });
  }

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/teacher/exams');
      setExams(response.data.exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the exam "${name}"?`)) {
      try {
        await api.delete(`/teacher/exam/${id}`);
        setExams(exams.filter((exam) => exam._id !== id));
      } catch (error) {
        console.error('Error deleting exam:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badgeClass = {
      active: 'badge badge-success',
      completed: 'badge badge-primary',
      upcoming: 'badge badge-warning',
    };

    return (
      <span className={badgeClass[status] || 'badge badge-secondary'}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar */}
      <nav className="navbar">
        <h2>Teacher Portal</h2>
        <div className="navbar-right">
          <span>Welcome, <strong>{user?.name}</strong></span>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn btn-danger"
            style={{ padding: '10px 20px' }}
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <h1>Welcome back, {user?.name}!</h1>
          <p>Manage your exams, questions, and view student submissions</p>
        </div>

        {/* Teacher Details Section */}
        <div className="card">
          <h2>Teacher Details</h2>
          <div className="info-box">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Teacher ID:</strong> {user?.teacherId}</p>
            <p><strong>Department:</strong> {user?.department}</p>
            <p><strong>Classes:</strong> {user?.classes?.join(', ') || 'None'}</p>
          </div>
        </div>

        {/* View Schedule Section */}
        <div className="card">
          <h2>View Schedule</h2>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="view-date" style={{ fontSize: '14px', color: '#6b7280', marginRight: '10px' }}>
              Select Date:
            </label>
            <input
              id="view-date"
              type="date"
              value={viewDate}
              onChange={(e) => setViewDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
          <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
            Schedule for {new Date(viewDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {(() => {
            const selectedDateObj = new Date(viewDate);
            const dayOfWeek = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const daySchedule = user?.timetable?.[dayOfWeek] || [];
            if (daySchedule.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px' }}>
                  <p style={{ fontSize: '16px', color: '#6b7280' }}>No classes scheduled for this date</p>
                </div>
              );
            }
            return (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Subject</th>
                      <th>Class</th>
                      <th>Batches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daySchedule.map((slot, index) => (
                    <tr key={index}>
                        <td><strong>{slot.time}</strong></td>
                        <td>{slot.subject}</td>
                        <td>{slot.class}</td>
                        <td>{slot.type === 'lab' && slot.batches ? slot.batches.join(', ') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>

        {/* Schedule Exams Section */}
      <div className="card">
        <h2>Schedule Exams</h2>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="date-select" style={{ fontSize: '14px', color: '#6b7280', marginRight: '10px' }}>
            Select Date:
          </label>
          <select
            id="date-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
          Schedule exams for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <div className="grid">
          {(() => {
            const selectedDateObj = new Date(selectedDate);
            const dayOfWeek = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const daySchedule = user?.timetable?.[dayOfWeek] || [];

            // Group slots by batch for labs, by subject for non-labs
            const groupedSchedule = {};
            daySchedule.forEach(slot => {
              if (slot.type === 'lab') {
                slot.batches.forEach(batch => {
                  if (!groupedSchedule[batch]) {
                    groupedSchedule[batch] = {
                      batch,
                      subjects: new Set(),
                      times: [],
                      class: slot.class,
                      type: 'lab'
                    };
                  }
                  groupedSchedule[batch].subjects.add(slot.subject);
                  groupedSchedule[batch].times.push(slot.time);
                });
              } else {
                if (!groupedSchedule[slot.subject]) {
                  groupedSchedule[slot.subject] = {
                    subject: slot.subject,
                    class: slot.class,
                    type: slot.type,
                    times: [],
                    batches: new Set()
                  };
                }
                groupedSchedule[slot.subject].times.push(slot.time);
                if (slot.batches) {
                  slot.batches.forEach(batch => groupedSchedule[slot.subject].batches.add(batch));
                }
              }
            });

            const groupedArray = Object.values(groupedSchedule);

            return groupedArray.length > 0 ? (
              groupedArray.map((group, index) => (
                <div
                  key={index}
                  className="schedule-card"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <h3 style={{ color: '#000000', marginBottom: '10px' }}>{group.batch ? `Batch ${group.batch}` : group.subject}</h3>
                  <div className="exam-card-info">
                    <p style={{ color: '#000000' }}><strong>Class:</strong> {group.class}</p>
                    <p style={{ color: '#000000' }}><strong>Time:</strong> {group.times.join(', ')}</p>
                    {group.batch && (
                      <p style={{ color: '#000000' }}><strong>Subjects:</strong> {Array.from(group.subjects).join(', ')}</p>
                    )}
                    {!group.batch && group.batches.size > 0 && (
                      <p style={{ color: '#000000' }}><strong>Batches:</strong> {Array.from(group.batches).join(', ')}</p>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: '15px', backgroundColor: '#3b82f6', color: '#ffffff' }}
                    onClick={() => navigate('/teacher/exam/create', { state: group.batch ? { selectedClass: group.class, selectedSubject: Array.from(group.subjects)[0], selectedDate, selectedBatch: group.batch } : { selectedClass: group.class, selectedSubject: group.subject, selectedDate } })}
                  >
                    {group.batch ? `Create Exam for ${group.batch}` : 'Create Exam'}
                  </button>
                </div>
              ))
            ) : (
              <p style={{ color: '#9ca3af', gridColumn: '1 / -1' }}>No classes scheduled for this date</p>
            );
          })()}
        </div>
        <button
          onClick={() => navigate('/teacher/exam/create')}
          className="btn btn-secondary"
          style={{ marginTop: '30px', padding: '14px 28px', fontSize: '15px' }}
        >
          ➕ Schedule New Exam
        </button>
      </div>

      {/* Exams Section */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '30px' }}>
          <div>
            <h2>All Exams</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '5px' }}>
              Total exams: {exams.length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading">⏳ Loading exams...</div>
        ) : exams.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Class</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam._id}>
                    <td><strong>{exam.examName}</strong></td>
                    <td>
                      <span className="badge badge-primary">
                        {exam.class}
                      </span>
                    </td>
                    <td>{new Date(exam.scheduledDate).toLocaleDateString()}</td>
                    <td>
                      <strong>{(() => {
                        // Parse start time
                        const [startHour, startMinute] = exam.scheduledTime.split(':').map(Number);
                        const startDate = new Date(exam.scheduledDate);
                        startDate.setHours(startHour, startMinute, 0, 0);
                        // Calculate end time
                        const endDate = new Date(startDate.getTime() + (exam.duration || 0) * 60000);
                        // Format times as 12-hour with AM/PM
                        function format12Hour(date) {
                          let hour = date.getHours();
                          const minute = date.getMinutes();
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          hour = hour % 12;
                          if (hour === 0) hour = 12;
                          return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
                        }
                        const startStr = format12Hour(startDate);
                        const endStr = format12Hour(endDate);
                        return `${startStr} - ${endStr}`;
                      })()}</strong>
                    </td>
                    <td>
                      <span className="badge badge-secondary">
                        {exam.numberOfStudents}
                      </span>
                    </td>
                    <td>{getStatusBadge(exam.status)}</td>
                    <td>
                      <div className="flex-wrap">
                        <button
                          onClick={() => navigate(`/teacher/exam/${exam._id}/questions`)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Questions
                        </button>
                        <button
                          onClick={() => navigate(`/teacher/exam/${exam._id}/submissions`)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Submissions
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam._id, exam.examName)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '2px dashed #e5e7eb',
            }}
          >
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '20px' }}>
              📭 No exams scheduled yet
            </p>
            <button onClick={() => navigate('/teacher/exam/create')} className="btn btn-primary">
              ➕ Create Your First Exam
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {exams.length > 0 && (() => {
        const now = new Date();
        let completed = 0;
        let active = 0;
        exams.forEach((exam) => {
          let examDateTime;
          if (exam.scheduledDate && exam.scheduledTime) {
            const [hour, minute] = exam.scheduledTime.split(':');
            examDateTime = new Date(exam.scheduledDate);
            examDateTime.setHours(Number(hour), Number(minute), 0, 0);
          } else {
            examDateTime = new Date(exam.scheduledDate);
          }
          if (examDateTime < now) completed++;
          if (exam.status === 'active') active++;
        });
        return (
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '30px' }}
          >
            <div
              className="card"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
                border: '2px solid #bfdbfe',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                {exams.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Total Exams</div>
            </div>
            <div
              className="card"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%)',
                border: '2px solid #bbf7d0',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{completed}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Completed</div>
            </div>
            <div
              className="card"
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)',
                border: '2px solid #fef08a',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🟢</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{active}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Active</div>
            </div>
          </div>
        );
      })()}
      </div>
    </div>
  );
}

export default TeacherDashboard;
