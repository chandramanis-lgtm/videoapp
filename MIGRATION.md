# Data Migration Guide: SQL to MongoDB

## Overview

This guide explains how to migrate data from your MySQL `data.sql` file to MongoDB for the VideoApp LMS.

## Step 1: Prepare MongoDB

```bash
# Option A: Using Docker (recommended)
docker run -d -p 27017:27017 --name videoapp-mongo mongo:latest

# Option B: Local MongoDB
sudo systemctl start mongod

# Verify connection
mongosh
```

## Step 2: Run Migration Script

The migration script is located at `scripts/migrate.js` and automatically handles:
- Creating sample users (instructor, admin)
- Migrating courses from SQL data
- Migrating batches with proper references
- Creating subjects organized by course
- Importing video metadata
- Adding sample enquiries

### Run Migration

```bash
# Ensure MongoDB is running, then:
node scripts/migrate.js
```

### Expected Output

```
╔════════════════════════════════════════╗
║  Starting Data Migration to MongoDB  ║
╚════════════════════════════════════════╝

📦 Migrating Users...
   ✓ 2 users created

📚 Migrating Courses...
   ✓ 3 courses created

👥 Migrating Batches...
   ✓ 4 batches created

📖 Migrating Subjects...
   ✓ 5 subjects created

🎥 Migrating Videos...
   ✓ 4 videos created

💬 Migrating Enquiries...
   ✓ 3 enquiries created

╔════════════════════════════════════════╗
║  ✅ Migration Completed Successfully!  ║
╚════════════════════════════════════════╝

📊 Database Summary:
   • Users: 2
   • Courses: 3
   • Batches: 4
   • Videos: 4
```

## Step 3: Verify Data

```bash
# Connect to MongoDB shell
mongosh

# Check database
show dbs
use videoapp_lms
show collections

# View data
db.users.find().pretty()
db.courses.find().pretty()
db.batches.find().pretty()
db.videos.find().pretty()
```

## SQL to MongoDB Mapping

| MySQL Table | MongoDB Collection | Status |
|---|---|---|
| crm_register_user | users | ✅ Migrated |
| crm_course_details | courses | ✅ Migrated |
| crm_batch_details | batches | ✅ Migrated |
| crm_subject_details | subjects | ✅ Migrated |
| crm_android_videos | videos | ✅ Migrated |
| crm_enquiry_details | enquiries | ✅ Migrated |
| crm_transactions | transactions | ⏳ Ready |
| crm_student_activity | (tracking in enrollment) | ⏳ Ready |

## Manual Data Import from SQL

If you need to import specific data from your SQL file:

### Option 1: Using mongoexport/mongoimport with CSV

```bash
# 1. Export SQL table to CSV
# (Using MySQL client or tool like DBeaver)

# 2. Import CSV to MongoDB
mongoimport --uri="mongodb://localhost:27017/videoapp_lms" \
  --collection=courses \
  --type=csv \
  --headerline \
  --file=courses.csv
```

### Option 2: Custom SQL Parser

For complex migrations, parse SQL directly:

```bash
# Install SQL parser
npm install sql-parser

# Create custom import script based on your SQL structure
```

## Handling Large Data

If you have large datasets:

```bash
# Batch insert with bulk operations
db.createCollection("courses", { 
  validator: { $jsonSchema: { ... } }
})

# Create indexes for performance
db.courses.createIndex({ "isPublished": 1, "category": 1 })
db.batches.createIndex({ "course": 1, "status": 1 })
db.videos.createIndex({ "course": 1, "status": 1 })
```

## Troubleshooting

### Issue: "Connection refused" 
```bash
# Ensure MongoDB is running
docker ps | grep mongo
# or
sudo systemctl status mongod
```

### Issue: "Duplicate key error"
```bash
# Drop collection and re-run
db.users.deleteMany({})
node scripts/migrate.js
```

### Issue: Missing references (instructor_id)
```bash
# Fix: Ensure users exist before courses
# The script already handles this - it queries for instructor first
```

## Data Integrity Checks

After migration, verify:

```bash
# Check all courses have instructors
db.courses.find({ instructor: { $exists: false } })

# Check all batches have courses
db.batches.find({ course: { $exists: false } })

# Verify indexes
db.courses.getIndexes()
db.batches.getIndexes()
db.videos.getIndexes()
```

## Backup Before Migration

```bash
# Backup existing MongoDB
mongodump --uri="mongodb://localhost:27017/videoapp_lms" \
  --out=./backups/videoapp_backup_$(date +%Y%m%d)

# Restore if needed
mongorestore --uri="mongodb://localhost:27017" \
  ./backups/videoapp_backup_20250117/
```

## Next Steps

1. ✅ Run `node scripts/migrate.js`
2. ✅ Verify data with `mongosh`
3. ✅ Start the server: `npm start`
4. ✅ Test API endpoints: `curl http://localhost:5000/api/courses`
5. ✅ Add more data through API

## Resuming from Backup

If migration fails, you can:

```bash
# Stop the app
npm stop

# Clear MongoDB
db.dropDatabase()

# Restore from backup
mongorestore ./backups/videoapp_backup_20250117/

# Restart app
npm start
```

---

**Need to add more data?** Use the API endpoints or create additional migration scripts!
