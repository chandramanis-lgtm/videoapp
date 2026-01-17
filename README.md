# Video-Based LMS Backend

A comprehensive Learning Management System backend for video-based courses.

## Features

- **User Management**: Register, login, and manage user profiles
- **Course Management**: Create, publish, and manage courses
- **Video Lessons**: Organize lessons into modules with video content
- **Enrollments**: Track student enrollments and progress
- **Batch Management**: Organize students into cohorts/batches
- **Quiz System**: Create and manage quizzes for lessons
- **Progress Tracking**: Monitor student progress across courses

## Tech Stack

- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Project Structure

```
videoapp/
├── config/
│   └── db.js                 # MongoDB connection
├── models/
│   ├── User.js              # User schema
│   ├── Course.js            # Course schema
│   ├── Module.js            # Course modules
│   ├── Lesson.js            # Video lessons
│   ├── Quiz.js              # Quizzes
│   ├── Batch.js             # Batch/Cohort management
│   └── Enrollment.js        # Student enrollments
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── courses.js           # Course routes
│   ├── batches.js           # Batch routes
│   └── enrollments.js       # Enrollment routes
├── middleware/
│   └── auth.js              # JWT middleware
├── index.js                 # Main server file
├── package.json             # Dependencies
└── .env.example             # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Courses
- `GET /api/courses` - Get all published courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create new course (instructor)
- `PUT /api/courses/:id` - Update course (instructor)
- `PUT /api/courses/:id/publish` - Publish course (instructor)

### Enrollments
- `POST /api/enrollments/:courseId/enroll` - Enroll in course
- `GET /api/enrollments/student/:studentId` - Get student enrollments
- `PUT /api/enrollments/:enrollmentId/complete-lesson` - Mark lesson as completed

### Batches
- `GET /api/batches` - Get all batches
- `GET /api/batches/course/:courseId` - Get batches by course
- `GET /api/batches/:id` - Get batch details
- `POST /api/batches` - Create new batch (instructor)
- `PUT /api/batches/:id` - Update batch (instructor)
- `POST /api/batches/:id/add-student` - Add student to batch
- `POST /api/batches/:id/remove-student` - Remove student from batch

### Subjects
- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/course/:courseId` - Get subjects by course
- `GET /api/subjects/:id` - Get subject details
- `POST /api/subjects` - Create subject (instructor)
- `PUT /api/subjects/:id` - Update subject (admin)

### Videos
- `GET /api/videos` - Get all videos (with filters: batchId, courseId, subjectId, status)
- `GET /api/videos/:id` - Get video details
- `POST /api/videos` - Upload/create video (instructor)
- `PUT /api/videos/:id` - Update video (admin)
- `DELETE /api/videos/:id` - Delete video (admin)

### Transactions
- `GET /api/transactions` - Get all transactions (admin only)
- `GET /api/transactions/user/:userId` - Get user transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction status (admin)

### Enquiries
- `GET /api/enquiries` - Get all enquiries (admin only)
- `GET /api/enquiries/:id` - Get enquiry details
- `POST /api/enquiries` - Submit enquiry (public)
- `PUT /api/enquiries/:id` - Update enquiry status (admin)

## User Roles

- **student** - Can enroll in courses and complete lessons
- **instructor** - Can create and manage courses
- **admin** - Full system access

## License

ISC