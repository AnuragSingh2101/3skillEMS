import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EventDetail from './pages/EventDetail';
import MyTickets from './pages/MyTickets';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';

const BACKEND_URL = 'http://localhost:5001';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to authenticate token with server:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (newToken, newUserObj) => {
    setUser(newUserObj);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
    setUser(null);
  };

  if (loading) {
    return (
      <div className={`flex-center ${theme}`} style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem', background: theme === 'light' ? '#F8F9FA' : '#09090b', color: theme === 'light' ? '#09090b' : '#fff' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        <span>Verifying secure credentials...</span>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <div className="mouse-spotlight"></div>
        <Navbar user={user} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home backendUrl={BACKEND_URL} />} />
            
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" /> : <Login onLoginSuccess={handleLoginSuccess} backendUrl={BACKEND_URL} />} 
            />
            
            <Route 
              path="/register" 
              element={user ? <Navigate to="/" /> : <Register onLoginSuccess={handleLoginSuccess} backendUrl={BACKEND_URL} />} 
            />
            
            <Route 
              path="/event/:id" 
              element={<EventDetail user={user} backendUrl={BACKEND_URL} />} 
            />
            
            {/* Attendee Protected Routes */}
            <Route 
              path="/my-tickets" 
              element={
                user && user.role === 'attendee' ? (
                  <MyTickets backendUrl={BACKEND_URL} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />

            {/* Organizer Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                user && user.role === 'organizer' ? (
                  <Dashboard user={user} backendUrl={BACKEND_URL} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            
            <Route 
              path="/check-in" 
              element={
                user && user.role === 'organizer' ? (
                  <CheckIn backendUrl={BACKEND_URL} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
