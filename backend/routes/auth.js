const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
// *** FIX: IMPORTING MIDDLEWARE FOR AUTHENTICATED ROUTES ***
const { authMiddleware } = require('../middleware/auth'); 

const router = express.Router();

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  }
});
// ------------------------------------

// Helper function to find user by ID regardless of role
const findUserById = async (id) => {
    let user = await Student.findById(id);
    let role = 'student';
    if (!user) {
        user = await Teacher.findById(id);
        role = 'teacher';
    }
    return { user, role };
};

// Teacher Registration (Unchanged)
router.post('/teacher/register', async (req, res) => {
  try {
    const { name, email, password, teacherId, department, branchSection, timetable } = req.body;
    let teacher = await Teacher.findOne({ email });
    if (teacher) {
      return res.status(400).json({ message: 'Teacher already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    teacher = new Teacher({
      name,
      email,
      password: hashedPassword,
      teacherId,
      department,
      branchSection: branchSection || [],
      timetable: timetable || {},
    });
    await teacher.save();
    res.status(201).json({ message: 'Teacher registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher Login (Unchanged)
router.post('/teacher/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: teacher._id, role: 'teacher' },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        teacherId: teacher.teacherId,
        branchSection: teacher.branchSection,
        role: 'teacher',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student Registration (Unchanged)
router.post('/student/register', async (req, res) => {
  try {
    const { name, email, password, rollNumber, class: studentClass, batch } = req.body;
    // Check for existing student by email if email is provided
    if (email) {
      let student = await Student.findOne({ email });
      if (student) {
        return res.status(400).json({ message: 'Student already exists' });
      }
    }
    // Check for existing student by rollNumber
    let studentByRoll = await Student.findOne({ rollNumber });
    if (studentByRoll) {
      return res.status(400).json({ message: 'Roll number already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    student = new Student({
      name,
      email,
      password: hashedPassword,
      rollNumber,
      class: studentClass,
      batch,
    });
    await student.save();
    res.status(201).json({ message: 'Student registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unified Login for both Teacher and Student, with first-time login support (Unchanged)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`\n--- DEBUG: LOGIN ATTEMPT ---`);
    console.log(`Input ID (req.body.email): ${email}`);
    // DO NOT LOG THE INPUT PASSWORD

    let user = null;
    let role = null;
    let foundBy = null; // Track how the user was found

    // 1. Check if email is teacherId
    user = await Teacher.findOne({ teacherId: email });
    if (user) {
      role = 'teacher';
      foundBy = 'Teacher ID';
    } 
    
    // 2. Check if email is rollNumber (Only if not found yet)
    if (!user) {
      user = await Student.findOne({ rollNumber: email });
      if (user) {
        role = user.email === 'admin@example.com' ? 'admin' : 'student';
        foundBy = 'Roll Number';
      } 
    }
    
    // 3. Check by email (Only if not found yet)
    if (!user) {
      user = await Teacher.findOne({ email });
      if (user) {
        role = 'teacher';
        foundBy = 'Teacher Email';
      } 
    }
    
    // 4. Check by email (Student) (Only if not found yet)
    if (!user) {
      user = await Student.findOne({ email });
      if (user) {
        role = user.email === 'admin@example.com' ? 'admin' : 'student';
        foundBy = 'Student Email';
      }
    }

    if (!user) {
        console.log(`STATUS: FAILED - User not found in DB.`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log(`STATUS: User FOUND! Found By: ${foundBy}. Role: ${role}. DB Hash starts with: ${user.password.substring(0, 10)}...`);


        // Verify password: do not auto-reset the stored password on login
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

    console.log(`STATUS: SUCCESS! Token generating...`);

    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    // Building the user response object
    const userResponse = role === 'teacher' ? {
        id: user._id, name: user.name, email: user.email, teacherId: user.teacherId,
        department: user.department, branchSection: user.branchSection,
        timetable: user.timetable, role: 'teacher',
    } : role === 'admin' ? {
        id: user._id, name: user.name, email: user.email, role: 'admin',
    } : {
        id: user._id, name: user.name, email: user.email, rollNumber: user.rollNumber,
        class: user.class, batch: user.batch, branch: user.branch,
        section: user.section, semester: user.semester, role: 'student',
    };

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('SERVER ERROR during login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    console.log(`--- END LOGIN ATTEMPT DEBUG ---`);
  }
});

// Student Login (keeping for backward compatibility if needed) (Unchanged)
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: student._id, role: 'student' },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: {
        id: student._id, name: student.name, email: student.email,
        rollNumber: student.rollNumber, class: student.class,
        batch: student.batch, role: 'student',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// =========================================================================
// !!! NEW PASSWORD MANAGEMENT ROUTES !!!
// =========================================================================

// Route 1: Change Password (Requires Old Password, Authenticated)
// *** FIX: authMiddleware is NOW correctly applied ***
router.post('/change-password', authMiddleware, async (req, res) => { 
    try {
        // req.user.id is now guaranteed by authMiddleware
        const userId = req.user.id; 
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirmation do not match.' });
        }
        
        const { user, role } = await findUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // --- SECURITY CHECK: Default Email Policy (Student Only) ---
        if (role === 'student' && user.email === 'admin@example.com') {
            return res.status(403).json({ 
                message: 'Action Blocked: Please change your default email first before changing your password.' 
            });
        }
        // --- END SECURITY CHECK ---

        // Check if old password matches
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            // This is the error path if the user enters the wrong old password
            return res.status(400).json({ message: 'Invalid old password.' });
        }

        // Hash and save the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password updated successfully. You will be logged out for security.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Route 2: Forgot Password - Send Code (Unauthenticated)
router.post('/forgot-password/send-code', async (req, res) => {
    try {
        const { email } = req.body;

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Please enter your email address.' });
        }
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        let user = await Student.findOne({ email });
        if (!user) {
            user = await Teacher.findOne({ email });
        }

        if (!user) {
            return res.status(400).json({ message: 'No account found with this email address.' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        global.passwordResetCodes = global.passwordResetCodes || {};
        global.passwordResetCodes[email] = {
            code: verificationCode,
            userId: user._id.toString(),
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        };

        const mailOptions = {
             from: process.env.EMAIL_USER, 
             to: email, 
             subject: 'Password Reset Code - Virtual Exam Bridge',
             html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Password Reset Request</h2>
                  <p>You requested to reset your password for the Virtual Exam Bridge account associated with this email.</p>
                  <p>Your verification code is:</p>
                  <h1 style="color: #dc2626; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
                  <p>This code will expire in 10 minutes.</p>
                  <p>If you did not request a password reset, you can safely ignore this email.</p>
                </div>
             `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Password Reset Code for ${email}: ${verificationCode}`);

        res.json({ message: 'Verification code sent to your email.' });
    } catch (error) {
        console.error('Error sending reset code:', error);
        res.status(500).json({ message: 'Failed to send verification code', error: error.message });
    }
});

// Route 3: Forgot Password - Verify Code and Reset Password (Unauthenticated)
router.post('/forgot-password/reset', async (req, res) => {
    try {
        const { email, code, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New password and confirmation do not match.' });
        }

        const resetData = global.passwordResetCodes && global.passwordResetCodes[email];

        if (!resetData || resetData.code !== code || Date.now() > resetData.expiresAt) {
            // Clean up if expired
            if (resetData && Date.now() > resetData.expiresAt) {
                 delete global.passwordResetCodes[email];
            }
            return res.status(400).json({ message: 'Invalid or expired verification code.' });
        }


        let user = await Student.findById(resetData.userId) || await Teacher.findById(resetData.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        delete global.passwordResetCodes[email];

        res.json({ message: 'Password successfully reset. Please log in with your new password.' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;