import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, LogOut, LayoutDashboard, Ticket, Scan, LogIn, UserPlus, Sun, Moon } from 'lucide-react';

const Navbar = ({ user, onLogout, theme, onToggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="nav-brand">
          <Calendar size={22} />
          <span>Evently</span>
        </Link>

        <ul className="nav-links">
          <li>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Explore
            </Link>
          </li>

          {user && user.role === 'attendee' && (
            <li>
              <Link
                to="/my-tickets"
                className={`nav-link ${isActive('/my-tickets') ? 'active' : ''} flex-between gap-2`}
              >
                <Ticket size={15} />
                <span>My Tickets</span>
              </Link>
            </li>
          )}

          {user && user.role === 'organizer' && (
            <>
              <li>
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''} flex-between gap-2`}
                >
                  <LayoutDashboard size={15} />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/check-in"
                  className={`nav-link ${isActive('/check-in') ? 'active' : ''} flex-between gap-2`}
                >
                  <Scan size={15} />
                  <span>QR Scan Check-in</span>
                </Link>
              </li>
            </>
          )}
        </ul>

        <div className="nav-user">
          {/* Theme Switch Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="theme-toggle-btn"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              <span className="user-badge">{user.role}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px' }}
                title="Log Out"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="flex-between gap-2">
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', borderRadius: '8px' }}>
                <LogIn size={14} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', borderRadius: '8px' }}>
                <UserPlus size={14} />
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
