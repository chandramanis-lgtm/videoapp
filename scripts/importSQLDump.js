const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
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

// Simple SQL value parser
function parseValues(valuesString) {
  const rows = [];
  let currentRow = '';
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < valuesString.length; i++) {
    const char = valuesString[i];

    if (escape) {
      currentRow += char;
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      currentRow += char;
      continue;
    }

    if (char === "'" && !escape) {
      inString = !inString;
      currentRow += char;
      continue;
    }

    if (!inString) {
      if (char === '(') {
        depth++;
        if (depth === 1) {
          currentRow = '';
          continue;
        }
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          if (currentRow.trim()) {
            rows.push(parseRow(currentRow));
          }
          currentRow = '';
          continue;
        }
      }
    }

    currentRow += char;
  }

  return rows;
}

function parseRow(rowStr) {
  const values = [];
  let current = '';
  let inString = false;
  let escape = false;
  let depth = 0;

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];

    if (escape) {
      current += char;
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      current += char;
      continue;
    }

    if (char === "'" && !escape) {
      inString = !inString;
      current += char;
      continue;
    }

    if (!inString) {
      if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
      } else if (char === ',' && depth === 0) {
        values.push(cleanValue(current.trim()));
        current = '';
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    values.push(cleanValue(current.trim()));
  }

  return values;
}

function cleanValue(val) {
  if (val === 'NULL') return null;
  if (val === 'CURRENT_TIMESTAMP') return new Date();

  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  const num = Number(val);
  if (!isNaN(num) && val !== '') {
    return num;
  }

  return val;
}

async function migrateAllData() {
  try {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  Full SQL Database Dump to MongoDB Migration    ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    const sqlFilePath = path.join(__dirname, '../data.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ data.sql not found');
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
    }

    // ===== MIGRATE VIDEOS =====
    console.log('🎥 Migrating Videos from crm_android_videos...');
    {
      const videoRegex = /INSERT INTO `crm_android_videos`[^V]*VALUES\s*([\s\S]*?);\s*--/i;
      const match = sqlContent.match(videoRegex);
      if (match) {
        const rows = parseValues(match[1]);
        let count = 0;
        const courses = await Course.find().limit(1);
        const batches = await Batch.find().limit(1);

        for (const row of rows) {
          try {
            // id, batch_id, course_id, sub_batch_id, subject_id, landing_page_id, title, youtube_video_id, status, created_date, modified_date
            if (!row[7]) continue; // Skip if no youtube video ID

            await Video.findOneAndUpdate(
              { youtubeVideoId: row[7] },
              {
                title: row[6] || 'Video',
                batch: batches.length > 0 ? batches[0]._id : undefined,
                course: courses.length > 0 ? courses[0]._id : undefined,
                youtubeVideoId: row[7],
                status: row[8] || 1,
                views: 0
              },
              { upsert: true, new: true }
            );
            count++;
          } catch (e) {
            // Continue on error
          }
        }
        console.log(`   ✓ ${count} videos imported`);
        totalRecords += count;
      }
    }

    // ===== MIGRATE BATCHES =====
    console.log('👥 Migrating Batches from crm_batch_details...');
    {
      const batchRegex = /INSERT INTO `crm_batch_details`[^V]*VALUES\s*([\s\S]*?);\s*--/i;
      const match = sqlContent.match(batchRegex);
      if (match) {
        const rows = parseValues(match[1]);
        let count = 0;
        const courses = await Course.find().limit(1);

        for (const row of rows) {
          try {
            // id, course_id, course_tag_id, batch_name, subject_id, start_time, end_time, batch_fee, batch_start_date, batch_end_date, duration, faculty, description, show_on_web, status, recorded, featured_batch, ...
            if (!row[3]) continue; // Skip if no batch name

            await Batch.findOneAndUpdate(
              { name: String(row[3]).substring(0, 50) },
              {
                name: String(row[3]).substring(0, 100),
                course: courses.length > 0 ? courses[0]._id : undefined,
                instructor: instructor._id,
                startDate: row[8] ? new Date(row[8]) : new Date(),
                endDate: row[9] ? new Date(row[9]) : new Date(),
                maxStudents: parseInt(row[7]) || 50,
                status: row[14] === 1 ? 'active' : 'upcoming',
                description: row[12] ? String(row[12]).substring(0, 500) : 'Batch'
              },
              { upsert: true, new: true }
            );
            count++;
          } catch (e) {
            // Continue on error
          }
        }
        console.log(`   ✓ ${count} batches imported`);
        totalRecords += count;
      }
    }

    // ===== MIGRATE COURSES =====
    console.log('📚 Migrating Courses (sample data)...');
    {
      const sampleCourses = [
        {
          title: 'Anthropology Optional Online',
          description: 'Comprehensive Anthropology course for UPSC preparation',
          instructor: instructor._id,
          category: 'Optional',
          level: 'advanced',
          price: 36000,
          isPublished: true
        },
        {
          title: 'Zoology Optional Online',
          description: 'Complete Zoology course with live classes and recorded videos',
          instructor: instructor._id,
          category: 'Optional',
          level: 'advanced',
          price: 40000,
          isPublished: true
        },
        {
          title: 'General Studies',
          description: 'General Studies foundation course for UPSC',
          instructor: instructor._id,
          category: 'General',
          level: 'intermediate',
          price: 0,
          isPublished: true
        }
      ];

      let count = 0;
      for (const courseData of sampleCourses) {
        try {
          await Course.findOneAndUpdate(
            { title: courseData.title },
            courseData,
            { upsert: true, new: true }
          );
          count++;
        } catch (e) {
          // Continue
        }
      }
      console.log(`   ✓ ${count} courses created`);
      totalRecords += count;
    }

    // ===== MIGRATE ENQUIRIES =====
    console.log('💬 Migrating Enquiries from crm_enquiry_details...');
    {
      const enquiryRegex = /INSERT INTO `crm_enquiry_details`[^V]*VALUES\s*([\s\S]*?);\s*--/i;
      const match = sqlContent.match(enquiryRegex);
      if (match) {
        const rows = parseValues(match[1]);
        let count = 0;

        for (const row of rows) {
          try {
            // id, name, email, mobile, course, message, status, created_date
            if (!row[2]) continue; // Skip if no email

            await Enquiry.findOneAndUpdate(
              { email: String(row[2]).toLowerCase() },
              {
                name: row[1] || 'Unknown',
                email: String(row[2]).toLowerCase(),
                mobile: row[3] || '',
                course: row[4] || 'General',
                message: row[5] ? String(row[5]).substring(0, 500) : '',
                status: row[6] || 'pending'
              },
              { upsert: true, new: true }
            );
            count++;
          } catch (e) {
            // Continue
          }
        }
        console.log(`   ✓ ${count} enquiries imported`);
        totalRecords += count;
      }
    }

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  ✅ Migration Completed Successfully!          ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    // Summary
    const stats = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Batch.countDocuments(),
      Video.countDocuments(),
      Enquiry.countDocuments()
    ]);

    console.log('📊 Database Summary:');
    console.log(`   • Users: ${stats[0]}`);
    console.log(`   • Courses: ${stats[1]}`);
    console.log(`   • Batches: ${stats[2]}`);
    console.log(`   • Videos: ${stats[3]}`);
    console.log(`   • Enquiries: ${stats[4]}`);
    console.log(`\n✓ Total Records Imported: ${totalRecords}\n`);

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

// Execute
(async () => {
  try {
    await connectDB();
    await migrateAllData();
  } catch (err) {
    console.error('Fatal:', err);
    process.exit(1);
  }
})();
