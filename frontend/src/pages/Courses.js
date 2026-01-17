import React, { useEffect, useState } from 'react';
import { courseService } from '../services/api';
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCourses();
  }, [page]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourses(page, 20);
      setCourses(response.data.courses);
      setTotalPages(Math.ceil(response.data.total / 20));
      setError('');
    } catch (err) {
      setError('Failed to load courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="courses-container">
      <h1>📚 Available Courses</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading courses...</div>
      ) : (
        <>
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course._id} className="course-card">
                <div className="course-header">
                  <h3>{course.title}</h3>
                  <span className="badge">{course.level}</span>
                </div>
                <p className="course-description">{course.description}</p>
                <div className="course-info">
                  <span>📊 {course.level}</span>
                  <span>💰 ₹{course.price}</span>
                </div>
                <button className="btn-enroll">Enroll Now</button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                ← Previous
              </button>
              <span>{page} / {totalPages}</span>
              <button 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Courses;
