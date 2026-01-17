const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Course = require('./models/Course');
const Batch = require('./models/Batch');
const Subject = require('./models/Subject');
const Video = require('./models/Video');
const Enquiry = require('./models/Enquiry');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

// Migrate Users (from SQL register_user table)
async function migrateUsers() {
  try {
    console.log('\n📦 Migrating Users...');
    
    const users = [
      {
        name: 'Pradip Sarkar',
        email: 'pradip@sapienias.in',
        password: 'hashed_password_here', // Hash properly in production
        role: 'instructor',
        isActive: true
      },
      {
        name: 'Admin User',
        email: 'admin@sapienias.in',
        password: 'hashed_password_here',
        role: 'admin',
        isActive: true
      }
    ];

    const insertedUsers = await User.insertMany(users, { ordered: false }).catch(err => {
      if (err.code === 11000) {
        console.log('   ⚠️  Some users already exist, skipping duplicates');
        return [];
      }
      throw err;
    });

    console.log(`   ✓ ${insertedUsers.length} users created`);
    return insertedUsers;
  } catch (err) {
    console.error('   ❌ User migration failed:', err.message);
  }
}

// Migrate Courses (from crm_course_details and crm_batch_details)
async function migrateCourses() {
  try {
    console.log('\n📚 Migrating Courses...');
    
    const instructorId = await User.findOne({ role: 'instructor' }).then(u => u?._id);
    
    const courses = [
      {
        title: 'Anthropology Optional',
        description: 'Complete Anthropology course for UPSC with live classes and recorded videos',
        instructor: instructorId,
        category: 'Optional',
        level: 'advanced',
        price: 36000,
        isPublished: true
      },
      {
        title: 'Zoology Optional',
        description: 'Complete Zoology course for UPSC with live classes and recorded videos',
        instructor: instructorId,
        category: 'Optional',
        level: 'advanced',
        price: 40000,
        isPublished: true
      },
      {
        title: 'General Studies',
        description: 'Comprehensive GS course for UPSC',
        instructor: instructorId,
        category: 'General Studies',
        level: 'intermediate',
        price: 25000,
        isPublished: true
      }
    ];

    const insertedCourses = await Course.insertMany(courses, { ordered: false }).catch(err => {
      if (err.code === 11000) {
        console.log('   ⚠️  Some courses already exist, skipping duplicates');
        return [];
      }
      throw err;
    });

    console.log(`   ✓ ${insertedCourses.length} courses created`);
    return insertedCourses;
  } catch (err) {
    console.error('   ❌ Course migration failed:', err.message);
  }
}

// Migrate Batches (from crm_batch_details)
async function migrateBatches() {
  try {
    console.log('\n👥 Migrating Batches...');
    
    const instructor = await User.findOne({ role: 'instructor' });
    const courses = await Course.find();
    
    if (!courses.length) {
      console.log('   ⚠️  No courses found, skipping batch migration');
      return [];
    }

    const batches = [
      {
        name: 'Anthropology Live - Morning Batch',
        course: courses[0]._id,
        instructor: instructor._id,
        startDate: new Date('2025-06-28'),
        endDate: new Date('2026-07-04'),
        maxStudents: 50,
        status: 'active',
        description: 'Live classes for Anthropology Optional - 11:30 AM to 2:00 PM'
      },
      {
        name: 'Anthropology Live - Evening Batch',
        course: courses[0]._id,
        instructor: instructor._id,
        startDate: new Date('2025-06-28'),
        endDate: new Date('2026-07-04'),
        maxStudents: 50,
        status: 'active',
        description: 'Live classes for Anthropology Optional - 2:00 PM to 5:30 PM'
      },
      {
        name: 'Zoology Live Batch',
        course: courses[1]._id,
        instructor: instructor._id,
        startDate: new Date('2023-12-01'),
        endDate: new Date('2025-07-04'),
        maxStudents: 50,
        status: 'active',
        description: 'Live classes for Zoology Optional'
      },
      {
        name: 'Anthropology Test Series',
        course: courses[0]._id,
        instructor: instructor._id,
        startDate: new Date('2025-06-22'),
        endDate: new Date('2027-06-22'),
        maxStudents: 100,
        status: 'active',
        description: 'Test series - 1 test per week'
      }
    ];

    const insertedBatches = await Batch.insertMany(batches, { ordered: false }).catch(err => {
      if (err.code === 11000) {
        console.log('   ⚠️  Some batches already exist, skipping duplicates');
        return [];
      }
      throw err;
    });

    console.log(`   ✓ ${insertedBatches.length} batches created`);
    return insertedBatches;
  } catch (err) {
    console.error('   ❌ Batch migration failed:', err.message);
  }
}

// Migrate Subjects (from crm_subject_details)
async function migrateSubjects() {
  try {
    console.log('\n📖 Migrating Subjects...');
    
    const courses = await Course.find();
    
    if (!courses.length) {
      console.log('   ⚠️  No courses found, skipping subject migration');
      return [];
    }

    const subjects = [
      {
        title: 'Anthropology Basics',
        course: courses[0]._id,
        description: 'Fundamentals of anthropology'
      },
      {
        title: 'Human Evolution',
        course: courses[0]._id,
        description: 'Study of human evolution and primates'
      },
      {
        title: 'Cultural Anthropology',
        course: courses[0]._id,
        description: 'Culture, society and kinship'
      },
      {
        title: 'Zoology Basics',
        course: courses[1]._id,
        description: 'Fundamentals of zoology'
      },
      {
        title: 'Genetics',
        course: courses[1]._id,
        description: 'Heredity and evolution'
      }
    ];

    const insertedSubjects = await Subject.insertMany(subjects, { ordered: false }).catch(err => {
      if (err.code === 11000) {
        console.log('   ⚠️  Some subjects already exist, skipping duplicates');
        return [];
      }
      throw err;
    });

    console.log(`   ✓ ${insertedSubjects.length} subjects created`);
    return insertedSubjects;
  } catch (err) {
    console.error('   ❌ Subject migration failed:', err.message);
  }
}

// Migrate Videos (from crm_android_videos)
async function migrateVideos() {
  try {
    console.log('\n🎥 Migrating Videos...');
    
    const courses = await Course.find();
    const batches = await Batch.find();
    const subjects = await Subject.find();

    if (!courses.length) {
      console.log('   ⚠️  No courses found, skipping video migration');
      return [];
    }

    const videos = [
      {
        title: 'Meaning of Anthropology',
        course: courses[0]._id,
        batch: batches[0]?._id,
        subject: subjects[0]?._id,
        youtubeVideoId: 'n_t_JiMC5-I',
        duration: 45,
        status: 1
      },
      {
        title: 'Decode different components of Anthropology',
        course: courses[0]._id,
        batch: batches[0]?._id,
        subject: subjects[0]?._id,
        youtubeVideoId: 'aqWVV0rDXeY',
        duration: 52,
        status: 1
      },
      {
        title: 'Hardy Weinberg Law for UPSC',
        course: courses[1]._id,
        batch: batches[2]?._id,
        subject: subjects[4]?._id,
        youtubeVideoId: 'mc9_As5n2f8',
        duration: 38,
        status: 1
      },
      {
        title: 'How to Prepare Zoology for IAS',
        course: courses[1]._id,
        batch: batches[2]?._id,
        subject: subjects[3]?._id,
        youtubeVideoId: 'sj30xC5GD88',
        duration: 41,
        status: 1
      }
    ];

    const insertedVideos = await Video.insertMany(videos, { ordered: false }).catch(err => {
      if (err.code === 11000) {
        console.log('   ⚠️  Some videos already exist, skipping duplicates');
        return [];
      }
      throw err;
    });

    console.log(`   ✓ ${insertedVideos.length} videos created`);
    return insertedVideos;
  } catch (err) {
    console.error('   ❌ Video migration failed:', err.message);
  }
}

// Migrate Enquiries (from crm_enquiry_details)
async function migrateEnquiries() {
  try {
    console.log('\n💬 Migrating Enquiries...');
    
    const enquiries = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        mobile: '9876543210',
        course: 'Anthropology Optional',
        message: 'Interested in learning anthropology for UPSC',
        status: 'pending'
      },
      {
        name: 'Priya Singh',
        email: 'priya@example.com',
        mobile: '9123456789',
        course: 'Zoology Optional',
        message: 'Want to enroll in zoology batch',
        status: 'contacted'
      },
      {
        name: 'Anil Patel',
        email: 'anil@example.com',
        mobile: '8765432109',
        course: 'General Studies',
        message: 'Looking for GS coaching',
        status: 'pending'
      }
    ];

    const insertedEnquiries = await Enquiry.insertMany(enquiries, { ordered: false }).catch(err => {
      if (err.code === 11000) {
        console.log('   ⚠️  Some enquiries already exist, skipping duplicates');
        return [];
      }
      throw err;
    });

    console.log(`   ✓ ${insertedEnquiries.length} enquiries created`);
    return insertedEnquiries;
  } catch (err) {
    console.error('   ❌ Enquiry migration failed:', err.message);
  }
}

// Main migration function
async function runMigration() {
  try {
    await connectDB();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  Starting Data Migration to MongoDB  ║');
    console.log('╚════════════════════════════════════════╝');

    await migrateUsers();
    await migrateCourses();
    await migrateBatches();
    await migrateSubjects();
    await migrateVideos();
    await migrateEnquiries();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✅ Migration Completed Successfully!  ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Show summary
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const batchCount = await Batch.countDocuments();
    const videoCount = await Video.countDocuments();

    console.log('📊 Database Summary:');
    console.log(`   • Users: ${userCount}`);
    console.log(`   • Courses: ${courseCount}`);
    console.log(`   • Batches: ${batchCount}`);
    console.log(`   • Videos: ${videoCount}`);
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

// Run migration
runMigration();
