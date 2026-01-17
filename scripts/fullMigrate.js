const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Batch = require('../models/Batch');
const Video = require('../models/Video');
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');
const Course = require('../models/Course');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
};

// Extract SQL INSERT data
function extractTableData(sqlContent, tableName) {
  const pattern = new RegExp(`INSERT INTO \\`${tableName}\\`[^V]*VALUES\\s*([\\s\\S]*?)(?=;|INSERT INTO)`, 'i');
  const match = sqlContent.match(pattern);
  
  if (!match) return [];
  
  const valueStr = match[1];
  const rows = [];
  
  let current = '';
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < valueStr.length; i++) {
    const char = valueStr[i];
    
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
        if (depth === 1) {
          current = '';
          continue;
        }
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          if (current.trim()) {
            rows.push(parseSQLValues(current));
          }
          current = '';
          continue;
        }
      }
    }
    
    current += char;
  }
  
  return rows;
}

// Parse individual SQL row
function parseSQLValues(rowStr) {
  const values = [];
  let current = '';
  let inString = false;
  let inParens = 0;
  let escape = false;

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
        inParens++;
        current += char;
        continue;
      } else if (char === ')') {
        inParens--;
        current += char;
        continue;
      } else if (char === ',' && inParens === 0) {
        values.push(cleanSQLValue(current.trim()));
        current = '';
        continue;
      }
    }
    
    current += char;
  }
  
  if (current.trim()) {
    values.push(cleanSQLValue(current.trim()));
  }
  
  return values;
}

// Clean SQL value
function cleanSQLValue(val) {
  if (val === 'NULL' || val === '') return null;
  if (val === 'CURRENT_TIMESTAMP') return new Date();
  
  if (val.startsWith("'") && val.endsWith("'")) {
    const cleaned = val.slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    return cleaned;
  }
  
  const num = Number(val);
  if (!isNaN(num) && val.trim() !== '') {
    return num;
  }
  
  return val;
}

async function runMigration() {
  try {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  📊 Full SQL Dump to MongoDB Migration       ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    const sqlFile = path.join(__dirname, '../data.sql');
    if (!fs.existsSync(sqlFile)) {
      throw new Error('data.sql not found');
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    let totalImported = 0;

    // Create/get instructor
    let instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      instructor = await User.create({
        name: 'Pradip Sarkar',
        email: 'pradip@sapienias.in',
        password: 'hashed_pwd',
        role: 'instructor',
        isActive: true
      });
    }

    // Get/create courses
    let courses = await Course.find().lean();
    if (courses.length === 0) {
      const courseData = [
        { title: 'Anthropology Optional', description: 'Anthropology Optional Course', instructor: instructor._id, category: 'Optional', price: 0, isPublished: true, level: 'advanced' },
        { title: 'Zoology Optional', description: 'Zoology Optional Course', instructor: instructor._id, category: 'Optional', price: 0, isPublished: true, level: 'advanced' },
        { title: 'General Studies', description: 'General Studies', instructor: instructor._id, category: 'General', price: 0, isPublished: true, level: 'advanced' }
      ];
      for (const c of courseData) {
        await Course.create(c);
      }
      courses = await Course.find().lean();
    }

    const courseMap = {};
    courses.forEach((c, i) => {
      courseMap[i + 1] = c._id;
    });

    // ===== MIGRATE BATCHES =====
    console.log('👥 Migrating Batches from crm_batch_details...');
    const batchRows = extractTableData(sql, 'crm_batch_details');
    let batchCount = 0;

    for (const row of batchRows) {
      try {
        if (!row[3]) continue;

        const courseId = courseMap[row[1]] || courseMap[1];
        const batchName = String(row[3]).substring(0, 100);
        
        const existing = await Batch.findOne({ name: batchName });
        if (existing) continue;

        await Batch.create({
          name: batchName,
          course: courseId,
          instructor: instructor._id,
          startDate: row[8] ? new Date(row[8]) : new Date(),
          endDate: row[9] ? new Date(row[9]) : new Date(),
          maxStudents: parseInt(row[7]) || 50,
          status: row[14] === 1 ? 'active' : 'upcoming',
          description: row[12] ? String(row[12]).substring(0, 500).replace(/<[^>]*>/g, '') : 'Batch'
        });
        batchCount++;
      } catch (err) {
        // Continue
      }
    }
    console.log(`   ✓ ${batchCount} batches imported`);
    totalImported += batchCount;

    // ===== MIGRATE VIDEOS =====
    console.log('🎥 Migrating Videos from crm_android_videos...');
    const videoRows = extractTableData(sql, 'crm_android_videos');
    let videoCount = 0;
    const batches = await Batch.find().lean().limit(1);

    for (const row of videoRows) {
      try {
        if (!row[7]) continue;

        const existing = await Video.findOne({ youtubeVideoId: row[7] });
        if (existing) continue;

        const courseId = courseMap[row[2]] || courseMap[1];

        await Video.create({
          title: row[6] || 'Video',
          batch: batches.length > 0 ? batches[0]._id : undefined,
          course: courseId,
          youtubeVideoId: row[7],
          status: row[8] || 1,
          views: 0
        });
        videoCount++;
      } catch (err) {
        // Continue
      }
    }
    console.log(`   ✓ ${videoCount} videos imported`);
    totalImported += videoCount;

    // ===== MIGRATE ENQUIRIES =====
    console.log('💬 Migrating Enquiries from crm_enquiry_details...');
    const enquiryRows = extractTableData(sql, 'crm_enquiry_details');
    let enquiryCount = 0;

    for (const row of enquiryRows) {
      try {
        if (!row[2]) continue;

        const email = String(row[2]).toLowerCase().trim();
        const existing = await Enquiry.findOne({ email });
        if (existing) continue;

        await Enquiry.create({
          name: row[1] || 'Unknown',
          email: email,
          mobile: row[3] || '',
          course: row[4] || 'General',
          message: row[5] ? String(row[5]).substring(0, 500) : '',
          status: row[6] || 'pending'
        });
        enquiryCount++;
      } catch (err) {
        // Continue
      }
    }
    console.log(`   ✓ ${enquiryCount} enquiries imported`);
    totalImported += enquiryCount;

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  ✅ Migration Completed!                       ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    // Summary
    const [userCount, courseCount, batchCount2, videoCount2, enquiryCount2] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Batch.countDocuments(),
      Video.countDocuments(),
      Enquiry.countDocuments()
    ]);

    console.log('📊 Database Summary:');
    console.log(`   • Users: ${userCount}`);
    console.log(`   • Courses: ${courseCount}`);
    console.log(`   • Batches: ${batchCount2}`);
    console.log(`   • Videos: ${videoCount2}`);
    console.log(`   • Enquiries: ${enquiryCount2}`);
    console.log(`\n✓ Total Records Migrated: ${totalImported}\n`);

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

// Main
(async () => {
  await connectDB();
  await runMigration();
})();
