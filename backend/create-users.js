const axios = require('axios');

const API_URL = 'http://localhost:3002/api';

async function createUsers() {
  try {
    // Create Teacher
    const teacher = await axios.post(`${API_URL}/auth/teacher/register`, {
      name: "Dr. John Smith",
      email: "john@example.com",
      password: "teacher123",
      teacherId: "T001",
      classes: ["IT-3", "IT-2", "CSE-4"]
    });
    console.log('✅ Teacher created:', teacher.data);

    // Create Students
    const students = [
      { name: "Alice Johnson", email: "alice@example.com", password: "student123", rollNumber: "IT3-001", class: "IT-3" },
      { name: "Bob Smith", email: "bob@example.com", password: "student123", rollNumber: "IT3-002", class: "IT-3" },
      { name: "Charlie Brown", email: "charlie@example.com", password: "student123", rollNumber: "IT2-001", class: "IT-2" }
    ];

    for (const student of students) {
      const result = await axios.post(`${API_URL}/auth/student/register`, student);
      console.log('✅ Student created:', result.data);
    }

    console.log('\n✅ All users created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Teacher: john@example.com / teacher123');
    console.log('Students: alice@example.com / student123');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createUsers();