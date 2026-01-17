# VideoApp Frontend - Development Guide

## 📚 Code Overview

This document provides detailed information about the codebase structure and how different components work together.

---

## 🏗️ Architecture Overview

```
User Browser
    ↓
App.js (Routing + Auth Check)
    ↓
    ├─ AuthContext (Auth State)
    │   └─ API Service (Backend Communication)
    │
    ├─ Navbar (Navigation)
    ├─ Protected Routes
    │   ├─ Login Page
    │   └─ Courses Page
    └─ Error Handling
```

---

## 📄 File-by-File Guide

### **index.js**
**Purpose**: React entry point

```javascript
// Renders App component into root div
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### **App.js**
**Purpose**: Main application with routing and auth wrapper

**Key Features**:
- BrowserRouter setup
- Protected route component
- AuthProvider wrapper
- Route definitions

**Routes**:
- `/login` - Public login page
- `/courses` - Protected courses page
- `/` - Redirects to /courses

---

### **AuthContext.js**
**Purpose**: Global authentication state management

**Provided Context**:
- `user` - Current logged-in user
- `loading` - Loading state
- `error` - Error message
- `login()` - Login method
- `register()` - Register method
- `logout()` - Logout method

**Flow**:
1. Check localStorage for token on app load
2. If token exists, fetch user profile
3. Store user and token for future requests
4. Provide methods to login/register/logout

---

### **Navbar.js**
**Purpose**: Navigation bar component

**Displays**:
- App logo
- Navigation links (Courses, Batches, Videos)
- User info (if logged in)
- Login/Register/Logout buttons

**Styling**: Gradient background with responsive design

---

### **Login.js**
**Purpose**: User authentication page

**Features**:
- Email/password form
- Error messages
- Loading state
- Link to register page
- Auto-redirect on success

**Form Flow**:
1. User enters email & password
2. Submit → calls AuthContext.login()
3. On success → redirect to /courses
4. On error → display error message

---

### **Courses.js**
**Purpose**: Display available courses

**Features**:
- Paginated course list
- Course cards with details
- Enroll button
- Loading/error states

**Data Fetching**:
- Triggers on page load and page change
- Calls courseService.getCourses(page, limit)
- Displays courses in grid layout

---

### **api.js**
**Purpose**: API client and service definitions

**Key Components**:

1. **Axios Instance**
   ```javascript
   const apiClient = axios.create({
     baseURL: API_BASE_URL,
     headers: { 'Content-Type': 'application/json' }
   });
   ```

2. **Request Interceptor** - Adds auth token
   ```javascript
   config.headers.Authorization = `Bearer ${token}`;
   ```

3. **Response Interceptor** - Handles 401 errors
   ```javascript
   if (error.response?.status === 401) {
     // Auto-logout and redirect
   }
   ```

4. **Services**:
   - authService: login, register, profile
   - courseService: CRUD operations
   - batchService: batch management
   - videoService: video management
   - enrollmentService: student enrollments
   - And more...

---

## 🎨 Styling Architecture

### **CSS Files**
- `index.css` - Global styles
- `App.css` - App container styles
- `components/Navbar.css` - Navigation styles
- `pages/Login.css` - Login page styles
- `pages/Courses.css` - Courses page styles

### **Design System**
- **Primary Color**: #667eea (Purple)
- **Secondary Color**: #764ba2 (Darker Purple)
- **Gradients**: Used for headers and buttons
- **Shadows**: Used for depth
- **Border Radius**: 5-10px for modern look
- **Spacing**: 15px-20px padding

---

## 🔄 Data Flow

### Login Flow
```
User Input
  ↓
handleSubmit()
  ↓
AuthContext.login(email, password)
  ↓
API: POST /auth/login
  ↓
Save token to localStorage
  ↓
Update user state
  ↓
Redirect to /courses
```

### Course Listing Flow
```
User visits /courses
  ↓
ProtectedRoute checks user
  ↓
Courses component mounts
  ↓
useEffect triggers fetchCourses()
  ↓
API: GET /courses?page=1&limit=20
  ↓
Update courses state
  ↓
Render course grid
```

---

## 🔒 Security Features

### Token Management
- Token stored in localStorage
- Automatically included in all requests
- Auto-removed on 401 response

### Protected Routes
- Checks if user exists
- Redirects to login if not authenticated
- Shows loading spinner while checking

### Error Handling
- Server errors caught and displayed
- Network errors handled gracefully
- 401 triggers automatic logout

---

## 🧪 Testing Checklist

- [ ] Login works with correct credentials
- [ ] Error shown with wrong credentials
- [ ] Token persists on page refresh
- [ ] Redirect to login if no token
- [ ] Courses load and display
- [ ] Pagination works
- [ ] Logout clears token and redirects
- [ ] Navbar updates based on auth state
- [ ] Responsive design on mobile

---

## 📝 Common Tasks

### Add a New Page

1. Create file in `src/pages/`
2. Add component and styling
3. Add route in `App.js`
4. Protect if needed with `<ProtectedRoute>`

Example:
```javascript
// src/pages/Profile.js
function Profile() {
  const { user } = useAuth();
  return <div>{user.name}'s Profile</div>;
}
export default Profile;
```

```javascript
// App.js - Add route
<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
```

### Add API Service

1. Edit `src/services/api.js`
2. Add new service object

Example:
```javascript
export const profileService = {
  updateProfile: (data) => apiClient.put('/profile', data),
  uploadAvatar: (file) => apiClient.post('/profile/avatar', file),
};
```

### Add Styling

Create `.css` file and import in component:
```javascript
import './MyComponent.css';
```

---

## 🐛 Debugging Tips

### Check Authentication
```javascript
// In browser console
localStorage.getItem('token')
```

### Monitor API Calls
- Open DevTools Network tab
- Watch for failed requests
- Check response headers

### State Debugging
- Install React DevTools extension
- Inspect component props
- Monitor context changes

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 errors | Check token in localStorage |
| CORS errors | Enable CORS on backend |
| API not found | Verify REACT_APP_API_URL in .env |
| Blank page | Check console for errors |
| Styles not loading | Verify CSS file paths |

---

## 🚀 Production Build

```bash
npm build
```

Creates optimized build in `build/` folder ready for deployment.

---

## 📦 Deployment

### Vercel
```bash
vercel
```

### Netlify
```bash
netlify deploy --prod --dir=build
```

### Traditional Server
1. Run `npm build`
2. Copy `build/` contents to web server
3. Set backend URL in `.env`

---

## 🔗 Related Projects

- **Backend**: VideoApp LMS Backend API
- **Mobile**: VideoApp Mobile App (React Native)
- **Admin**: VideoApp Admin Dashboard

---

## 📞 Support

For issues or questions:
1. Check README.md
2. Review error messages
3. Check API responses
4. Verify environment configuration

---

**Last Updated**: January 17, 2026
**Status**: Production Ready ✅
