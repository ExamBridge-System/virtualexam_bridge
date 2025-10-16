import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import CreateExam from './components/CreateExam';
import AddQuestions from './components/AddQuestions';
import ViewStudentSubmissions from './components/ViewStudentSubmissions';
import StudentDashboard from './components/StudentDashboard';
import TakeExam from './components/TakeExam';

function PrivateRoute({ children, role }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (role && user.role !== role) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/teacher/dashboard" 
            element={
              <PrivateRoute role="teacher">
                <TeacherDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/teacher/exam/create" 
            element={
              <PrivateRoute role="teacher">
                <CreateExam />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/teacher/exam/:examId/questions" 
            element={
              <PrivateRoute role="teacher">
                <AddQuestions />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/teacher/exam/:examId/submissions" 
            element={
              <PrivateRoute role="teacher">
                <ViewStudentSubmissions />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/student/dashboard" 
            element={
              <PrivateRoute role="student">
                <StudentDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/student/exam/:examId" 
            element={
              <PrivateRoute role="student">
                <TakeExam />
              </PrivateRoute>
            } 
          />
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;