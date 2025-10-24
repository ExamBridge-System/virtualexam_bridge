const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Admin login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email !== 'admin@example.com') {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const admin = await Student.findOne({ email: 'admin@example.com' });
    if (!admin) {
      return res.status(400).json({ message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload teacher timetable CSV
router.post('/upload-teacher-timetable', authMiddleware, upload.single('timetable'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { teacherId, name, department } = req.body;
  if (!teacherId || !name || !department) {
    return res.status(400).json({ message: 'Teacher ID, name, and department are required' });
  }

  try {
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        const timetable = {};
        for (const row of results) {
          // CSV columns: Day, Time, Subject, Branch, Section, Batches, Semester
          const day = row.Day;
          if (!timetable[day]) timetable[day] = [];
          const className = `${row.Branch}-${row.Section}`;
          timetable[day].push({
            time: row.Time,
            subject: row.Subject,
            type: 'class', // Assuming all are class, or add type column if needed
            class: className,
            Branch: row.Branch,
            Section: row.Section,
            batches: row.Batches ? row.Batches.split(',') : undefined,
            semester: row.Semester,
          });
        }

        // Extract unique branch-sections from timetable
        const uniqueClasses = new Set();
        Object.values(timetable).forEach(daySlots => {
          daySlots.forEach(slot => {
            if (slot.class) {
              uniqueClasses.add(slot.class);
            }
          });
        });
        const branchSection = Array.from(uniqueClasses);

        // Generate email and password for teacher
        const email = `${teacherId}@example.com`;
        const hashedPassword = await bcrypt.hash('defaultpassword', 10); // Default password, can be changed later

        await Teacher.updateOne(
          { teacherId },
          {
            $set: {
              name,
              email,
              password: hashedPassword,
              department,
              branchSection,
              timetable
            }
          },
          { upsert: true }
        );

        fs.unlinkSync(req.file.path); // Remove uploaded file
        res.json({ message: 'Teacher timetables uploaded successfully' });
      });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading timetables', error: error.message });
  }
});

// Upload student details CSV
router.post('/upload-student-details', authMiddleware, upload.single('students'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { branch, section, semester } = req.body;
  if (!branch || !section || !semester) {
    return res.status(400).json({ message: 'Branch, section, and semester are required' });
  }

  try {
    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          console.log('CSV Results:', results.slice(0, 5)); // Log first 5 rows for debugging
          console.log('Total rows:', results.length);
          for (const row of results) {
            console.log('Processing row:', row);
            // CSV columns: Roll No., Name, Batch
            const rollNo = row['Roll No.'];
            const name = row.Name;
            const batch = row.Batch;
            console.log('Extracted:', { rollNo, name, batch });
            if (!rollNo || !name) {
              throw new Error(`Invalid row: Missing Roll No or Name. Row data: ${JSON.stringify(row)}`);
            }
            const hashedPassword = await bcrypt.hash(rollNo, 10); // First-time password is roll number
            const className = `${branch}-${section}`;
            console.log('Updating student:', rollNo);
            await Student.updateOne(
              { rollNumber: rollNo },
              {
                $set: {
                  name: name,
                  email: `${rollNo}@example.com`, // Generate email from roll number
                  password: hashedPassword,
                  class: className,
                  batch: batch,
                  branch,
                  section,
                  semester,
                }
              },
              { upsert: true }
            );
            console.log('Student updated:', rollNo);
          }
          fs.unlinkSync(req.file.path); // Remove uploaded file
          res.json({ message: 'Student details uploaded successfully' });
        } catch (innerError) {
          fs.unlinkSync(req.file.path); // Clean up file on error
          console.error('Processing error:', innerError);
          res.status(500).json({ message: 'Error processing student details', error: innerError.message });
        }
      })
      .on('error', (csvError) => {
        fs.unlinkSync(req.file.path); // Clean up file on error
        res.status(500).json({ message: 'Error reading CSV file', error: csvError.message });
      });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading student details', error: error.message });
  }
});

// Add single student
router.post('/add-student', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const { name, email, rollNumber, class: studentClass, batch, branch, section, semester } = req.body;

    let student = await Student.findOne({ rollNumber });
    if (student) {
      return res.status(400).json({ message: 'Student with this roll number already exists' });
    }

    const hashedPassword = await bcrypt.hash(rollNumber, 10); // First-time password is roll number

    student = new Student({
      name,
      email,
      password: hashedPassword,
      rollNumber,
      class: studentClass,
      batch,
      branch,
      section,
      semester,
    });

    await student.save();
    res.status(201).json({ message: 'Student added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
