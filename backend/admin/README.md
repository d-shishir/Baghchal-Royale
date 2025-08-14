# Baghchal Royale - Admin Dashboard 🎯

A modern, professional admin dashboard for managing the Baghchal Royale game platform.

![Dashboard Preview](https://img.shields.io/badge/UI-Professional-blue)
![Status](https://img.shields.io/badge/Status-Active-success)
![Responsive](https://img.shields.io/badge/Design-Responsive-purple)

## ✨ Features

### 🎨 Modern Professional Design
- **Clean Interface**: Modern sidebar navigation with intuitive icons
- **Professional Color Scheme**: Sophisticated purple/blue gradient theme
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Subtle transitions and hover effects
- **Dark Sidebar**: Professional contrast with light content area

### 📊 Dashboard Sections

#### 1. **Overview Dashboard**
- Real-time statistics cards (Users, Games, Reports, Ratings)
- System status indicators (API, Database, WebSocket)
- Recent activity feed
- Performance metrics with trend indicators

#### 2. **User Management**
- Advanced data table with search functionality
- User status badges (Online, Offline, In-Game)
- Role management (Admin, User, Moderator)
- User action modals for muting/banning
- Profile information display

#### 3. **Reports Management**
- Card-based report display
- Report filtering (All, Pending, Resolved)
- Detailed report information
- Action buttons for investigation
- Status tracking

#### 4. **Feedback Management**
- Star rating display system
- Comment previews
- Rating-based filtering
- User feedback analytics
- Sentiment tracking

#### 5. **Game Analytics** *(Coming Soon)*
- Game statistics and metrics
- Player performance data
- Match history analysis
- Tournament management

### 🛡️ Security Features
- **Admin-only Access**: Role verification before dashboard access
- **Session Management**: Automatic logout on invalid tokens
- **Secure API Calls**: JWT token authentication
- **Input Validation**: XSS protection and data sanitization

### 📱 Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Collapsible Sidebar**: Space-efficient navigation on mobile
- **Touch-Friendly**: Large buttons and touch targets
- **Adaptive Layout**: Automatic grid adjustments

## 🚀 Getting Started

### Prerequisites
- Backend API server running on port 8000
- Admin user account (username: `admin`, password: `admin`)

### Quick Start
1. **Start the Backend**:
   ```bash
   cd backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. **Serve Admin Dashboard**:
   ```bash
   cd frontend/admin
   python -m http.server 3001
   ```

3. **Access Dashboard**:
   - Open http://localhost:3001
   - Login with admin credentials
   - Enjoy the professional interface!

### Login Credentials
- **Username**: `admin`
- **Password**: `admin`

## 🎯 Usage Guide

### Navigation
- Use the **sidebar navigation** to switch between sections
- Click the **hamburger menu** on mobile to toggle sidebar
- **Overview section** provides a quick dashboard summary
- Each section has **real-time refresh** capabilities

### User Management
- **Search users** by username or email
- **View user details** including status, role, and activity
- **Perform actions** like muting or banning through modals
- **Filter by status** or role as needed

### Report Handling
- **View all reports** in a clean card layout
- **Filter reports** by status (pending, resolved)
- **Take action** on reports with investigate/dismiss buttons
- **Track report details** including reporter and reported users

### System Monitoring
- **Check system status** in the overview section
- **Monitor activity** with the real-time activity feed
- **View statistics** with trend indicators
- **Track performance** metrics

## 🎨 Design System

### Color Palette
- **Primary**: `#6366f1` (Indigo)
- **Success**: `#10b981` (Emerald)
- **Warning**: `#f59e0b` (Amber)
- **Danger**: `#ef4444` (Red)
- **Gray Scale**: Modern neutral tones

### Typography
- **Font Family**: Inter (Professional system font)
- **Hierarchy**: Clear heading and body text distinction
- **Weight**: 300-700 font weights for emphasis

### Components
- **Cards**: Elevated surfaces with subtle shadows
- **Buttons**: Gradient backgrounds with hover effects
- **Tables**: Clean, sortable data presentation
- **Modals**: Centered overlays with backdrop blur
- **Badges**: Status indicators with color coding

## 🔧 Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript with modern ES6+
- **Styling**: CSS Custom Properties (CSS Variables)
- **Icons**: Font Awesome 6.4.0
- **Layout**: CSS Grid and Flexbox
- **Responsive**: Mobile-first responsive design

### Performance
- **Lazy Loading**: Sections load data on demand
- **Debounced Search**: Optimized search functionality
- **Smooth Animations**: 60fps transitions
- **Efficient Rendering**: Minimal DOM manipulation

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🐛 Troubleshooting

### Common Issues

1. **Login Failed**
   - Ensure backend server is running on port 8000
   - Check admin user exists in database
   - Verify network connectivity

2. **Data Not Loading**
   - Check browser console for API errors
   - Verify admin token is valid
   - Refresh the page and try again

3. **Responsive Issues**
   - Clear browser cache
   - Check viewport settings
   - Try different screen sizes

### Getting Help
- Check browser console for errors
- Verify API endpoints are accessible
- Contact system administrator if issues persist

## 🎯 Future Enhancements

### Planned Features
- [ ] **Real-time Notifications**: WebSocket-based updates
- [ ] **Advanced Analytics**: Charts and graphs
- [ ] **Bulk Actions**: Multi-select operations
- [ ] **Export Functionality**: CSV/PDF reports
- [ ] **Theme Switching**: Light/dark mode toggle
- [ ] **Advanced Filtering**: Complex filter combinations
- [ ] **Audit Logging**: Admin action tracking

### Performance Improvements
- [ ] **Virtual Scrolling**: For large data sets
- [ ] **Progressive Loading**: Infinite scroll
- [ ] **Caching Strategy**: Client-side data caching
- [ ] **PWA Support**: Offline functionality

---

## 📄 License

This admin dashboard is part of the Baghchal Royale project.

---

**Made with ❤️ for Baghchal Royale Game Platform** 