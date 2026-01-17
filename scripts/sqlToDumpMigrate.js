const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Subject = require('../models/Subject');
const Video = require('../models/Video');
const Enquiry = require('../models/Enquiry');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

// Extract values from SQL INSERT statement using regex
function extractValues(sqlContent) {
  const valueBlocks = [];
  
  // Match all VALUE blocks
  const valueRegex = /VALUES\s*([\s\S]*?)(?=;|(?=INSERT INTO))/gi;
  let match;
  
  while ((match = valueRegex.exec(sqlContent)) !== null) {
    const valueStr = match[1].trim();
    
    // Parse individual rows
    const rowRegex = /\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
    let rowMatch;
    
    while ((rowMatch = rowRegex.exec(valueStr)) !== null) {
      const rowData = rowMatch[1];
      const values = parseSQLRow(rowData);
      valueBlocks.push(values);
    }
  }
  
  return valueBlocks;
}

// Parse a single row of SQL values
function parseSQLRow(rowStr) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let inParens = 0;
  
  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    const prevChar = i > 0 ? rowStr[i - 1] : '';
    
    if (char === "'" && prevChar !== '\\') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '(' && !inQuotes) {
      inParens++;
      current += char;
    } else if (char === ')' && !inQuotes) {
      inParens--;
      current += char;
    } else if (char === ',' && !inQuotes && inParens === 0) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current) {
    values.push(current.trim());
  }
  
  // Clean up values
  return values.map(v => {
    if (v === 'NULL') return null;
    if (v === 'CURRENT_TIMESTAMP') return new Date();
    if (v.startsWith("'") && v.endsWith("'")) {
      return v.slice(1, -1).replace(/\\'/g, "'");
    }
    if (!isNaN(v) && v !== '') return Number(v);
    return v;
  });
}

async function migrateAllData() {
  try {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     Full SQL Dump to MongoDB Migration         ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, '../data.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ data.sql file not found at', sqlFilePath);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    let totalRecords = 0;

    // Get or create instructor
    let instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      instructor = await User.create({
        name: 'Pradip Sarkar',
        email: 'pradip@sapienias.in',
        password: 'hashed_password',
        role: 'instructor',
        isActive: true
      });
      console.log('👤 Created default instructor');
    }

    // ========== Migrate crm_course_details ==========
    console.log('📚 Migrating Courses...');
    const coursePattern = /INSERT INTO `crm_course_details`[^V]*VALUES\s*([\s\S]*?)(?=;)/i;
    const courseMatch = sqlContent.match(coursePattern);
    if (courseMatch) {
      const courseValues = extractValues(`VALUES ${courseMatch[1]}`);
      let courseCount = 0;
      
      for (const row of courseValues) {
        try {
          // crm_course_details: id, course_name, description, created_date
          const course = await Course.findOneAndUpdate(
            { title: row[1] },
            {
              title: row[1] || 'Course',
              description: row[2] || 'Course Description',
              instructor: instructor._id,
              category: 'Optional',
              level: 'advanced',
              price: 0,
              isPublished: true
            },
            { upsert: true, new: true }
          );
          if (course) courseCount++;
        } catch (err) {
          // Skip duplicates
        }
      }
      totalRecords += courseCount;
      console.log(`   ✓ ${courseCount} courses migrated`);
    }

    // ========== Migrate crm_batch_details ==========
    console.log('👥 Migrating Batches...');
    const batchPattern = /INSERT INTO `crm_batch_details`[^V]*VALUES\s*([\s\S]*?)(?=;)/i;
    const batchMatch = sqlContent.match(batchPattern);
    if (batchMatch) {
      const batchValues = extractValues(`VALUES ${batchMatch[1]}`);
      let batchCount = 0;

      const courses = await Course.find();
      const courseMap = {};
      const courseList = await Course.find().lean();
      for (let i = 0; i < courseList.length; i++) {
        courseMap[i + 1] = courseList[i]._id; // Map by index
      }

      for (const row of batchValues) {
        try {
          // crm_batch_details: id, course_id, course_tag_id, batch_name, subject_id, start_time, 
          // end_time, batch_fee, batch_start_date, batch_end_date, duration, faculty, description, ...
          const courseId = courseMap[row[1]] || (courses[0] ? courses[0]._id : null);
          if (!courseId) continue;

          const batch = await Batch.findOneAndUpdate(
            { name: row[3] },
            {
              name: row[3] || 'Batch',
              course: courseId,
              instructor: instructor._id,
              startDate: row[8] ? new Date(row[8]) : new Date(),
              endDate: row[9] ? new Date(row[9]) : new Date(),
              maxStudents: parseInt(row[7]) || 50,
              status: row[14] === 1 ? 'active' : 'upcoming',
              description: (row[12] || 'Batch Description').substring(0, 500)
            },
            { upsert: true, new: true }
          );
          if (batch) batchCount++;
        } catch (err) {
          // Skip duplicates
        }
      }
      totalRecords += batchCount;
      console.log(`   ✓ ${batchCount} batches migrated`);
    }

    // ========== Migrate crm_android_videos ==========
    console.log('🎥 Migrating Videos...');
    const videoPattern = /INSERT INTO `crm_android_videos`[^V]*VALUES\s*([\s\S]*?)(?=;)/i;
    const videoMatch = sqlContent.match(videoPattern);
    if (videoMatch) {
      const videoValues = extractValues(`VALUES ${videoMatch[1]}`);
      let videoCount = 0;

      const batches = await Batch.find();
      const courses = await Course.find();

      for (const row of videoValues) {
        try {
          // crm_android_videos: id, batch_id, course_id, sub_batch_id, subject_id, landing_page_id,
          // title, youtube_video_id, status, created_date, modified_date
          const batch = batches.length > 0 ? batches[0] : null;
          const course = courses.length > 0 ? courses[0] : null;

          if (!batch || !course) continue;

          const video = await Video.findOneAndUpdate(
            { youtubeVideoId: row[7] },
            {
              title: row[6] || 'Video',
              batch: batch._id,
              course: course._id,
              youtubeVideoId: row[7],
              status: row[8] || 1,
              views: 0
            },
            { upsert: true, new: true }
          );
          if (video) videoCount++;
        } catch (err) {
          // Skip duplicates
        }
      }
      totalRecords += videoCount;
      console.log(`   ✓ ${videoCount} videos migrated`);
    }

    // ========== Migrate crm_enquiry_details ==========
    console.log('💬 Migrating Enquiries...');
    const enquiryPattern = /INSERT INTO `crm_enquiry_details`[^V]*VALUES\s*([\s\S]*?)(?=;)/i;
    const enquiryMatch = sqlContent.match(enquiryPattern);
    if (enquiryMatch) {
      const enquiryValues = extractValues(`VALUES ${enquiryMatch[1]}`);
      let enquiryCount = 0;

      for (const row of enquiryValues) {
        try {
          // crm_enquiry_details: id, name, email, mobile, course, message, status, created_date
          const enquiry = await Enquiry.findOneAndUpdate(
            { email: row[2] },
            {
              name: row[1] || 'Unknown',
              email: row[2] || '',
              mobile: row[3] || '',
              course: row[4] || 'General',
              message: row[5] || '',
              status: row[6] || 'pending'
            },
            { upsert: true, new: true }
          );
          if (enquiry) enquiryCount++;
        } catch (err) {
          // Skip duplicates
        }
      }
      totalRecords += enquiryCount;
      console.log(`   ✓ ${enquiryCount} enquiries migrated`);
    }

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  ✅ Full Migration Completed Successfully!     ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Show summary
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const batchCount = await Batch.countDocuments();
    const videoCount = await Video.countDocuments();
    const enquiryCount = await Enquiry.countDocuments();

    console.log('📊 Final Database Summary:');
    console.log(`   • Users: ${userCount}`);
    console.log(`   • Courses: ${courseCount}`);
    console.log(`   • Batches: ${batchCount}`);
    console.log(`   • Videos: ${videoCount}`);
    console.log(`   • Enquiries: ${enquiryCount}`);
    console.log(`\n✓ Total records migrated: ${totalRecords}\n`);

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    await connectDB();
    await migrateAllData();
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
