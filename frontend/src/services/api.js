import axios from 'axios';

// API Base URL - Update with your backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  register: (userData) => apiClient.post('/api/auth/register', userData),
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  getProfile: () => apiClient.get('/api/auth/me'),
};

// Courses Service
export const courseService = {
  getCourses: (page = 1, limit = 20) => apiClient.get(`/api/courses?page=${page}&limit=${limit}`),
  getCourseById: (id) => apiClient.get(`/api/courses/${id}`),
  createCourse: (courseData) => apiClient.post('/api/courses', courseData),
  updateCourse: (id, courseData) => apiClient.put(`/api/courses/${id}`, courseData),
  publishCourse: (id) => apiClient.put(`/api/courses/${id}/publish`, {}),
};

// Batches Service
export const batchService = {
  getBatches: (page = 1, limit = 20) => apiClient.get(`/api/batches?page=${page}&limit=${limit}`),
  getBatchById: (id) => apiClient.get(`/api/batches/${id}`),
  getBatchesByCourse: (courseId) => apiClient.get(`/api/batches/course/${courseId}`),
  createBatch: (batchData) => apiClient.post('/api/batches', batchData),
  updateBatch: (id, batchData) => apiClient.put(`/api/batches/${id}`, batchData),
  addStudentToBatch: (batchId, studentId) => apiClient.post(`/api/batches/${batchId}/add-student`, { studentId }),
};

// Videos Service
export const videoService = {
  getVideos: (page = 1, limit = 20) => apiClient.get(`/api/videos?page=${page}&limit=${limit}`),
  getVideoById: (id) => apiClient.get(`/api/videos/${id}`),
  getVideosBatch: (batchId) => apiClient.get(`/api/videos?batchId=${batchId}`),
  getVideosCourse: (courseId) => apiClient.get(`/api/videos?courseId=${courseId}`),
  createVideo: (videoData) => apiClient.post('/api/videos', videoData),
  updateVideo: (id, videoData) => apiClient.put(`/api/videos/${id}`, videoData),
  deleteVideo: (id) => apiClient.delete(`/api/videos/${id}`),
  incrementViews: (id) => apiClient.put(`/api/videos/${id}/view`, {}),
};

// Enrollments Service
export const enrollmentService = {
  enrollCourse: (courseId) => apiClient.post(`/api/enrollments/${courseId}/enroll`, {}),
  getStudentEnrollments: (studentId) => apiClient.get(`/api/enrollments/student/${studentId}`),
  completeLessonInCourse: (courseId, lessonId) => apiClient.put(`/api/enrollments/complete-lesson`, { courseId, lessonId }),
};

// Enquiries Service
export const enquiryService = {
  getEnquiries: () => apiClient.get('/api/enquiries'),
  getEnquiryById: (id) => apiClient.get(`/api/enquiries/${id}`),
  submitEnquiry: (enquiryData) => apiClient.post('/api/enquiries', enquiryData),
  updateEnquiryStatus: (id, status) => apiClient.put(`/api/enquiries/${id}`, { status }),
};

// Transactions Service
export const transactionService = {
  getTransactions: () => apiClient.get('/api/transactions'),
  getUserTransactions: (userId) => apiClient.get(`/api/transactions/user/${userId}`),
  createTransaction: (transactionData) => apiClient.post('/api/transactions', transactionData),
  updateTransactionStatus: (id, status) => apiClient.put(`/api/transactions/${id}`, { status }),
};

// Subjects Service
export const subjectService = {
  getSubjects: () => apiClient.get('/api/subjects'),
  getSubjectsByCourse: (courseId) => apiClient.get(`/api/subjects/course/${courseId}`),
  createSubject: (subjectData) => apiClient.post('/api/subjects', subjectData),
  updateSubject: (id, subjectData) => apiClient.put(`/api/subjects/${id}`, subjectData),
};

export default apiClient;
