import mongoose from 'mongoose';
import Department from '../models/Department.js';
import dotenv from 'dotenv';

dotenv.config();

const defaultDepartments = [
  { name: 'Computer Science & Engineering', code: 'CSE', description: 'Computer Science Department' },
  { name: 'Information Technology', code: 'IT', description: 'Information Technology Department' },
  { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'ECE Department' },
  { name: 'Electrical & Electronics Engineering', code: 'EEE', description: 'EEE Department' },
  { name: 'Mechanical Engineering', code: 'ME', description: 'Mechanical Department' },
  { name: 'Civil Engineering', code: 'CE', description: 'Civil Department' }
];

async function seedDepartments() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_attendance');
    console.log('Connected to MongoDB');

    // Check if departments already exist
    const existingCount = await Department.countDocuments();
    
    if (existingCount > 0) {
      console.log(`${existingCount} departments already exist in database. Skipping seed.`);
      const existing = await Department.find({}, 'name code');
      console.log('Existing departments:');
      existing.forEach(d => console.log(`  - ${d.name} (${d.code})`));
    } else {
      console.log('No departments found. Adding default departments...');
      
      for (const dept of defaultDepartments) {
        const created = await Department.create(dept);
        console.log(`Created: ${created.name} (${created.code})`);
      }
      
      console.log(`\nSuccessfully added ${defaultDepartments.length} departments.`);
    }

    await mongoose.disconnect();
    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedDepartments();
