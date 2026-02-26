import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import './Navbar.css';
import { UserProfileModal, type UserStats } from '../squads/UserProfileModal';
import { getUsers } from '../../lib/db';

export function Navbar() {
  const location = useLocation();
  const isMap = location.pathname === '/map';
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserStats | null>(null);

  const handleLogin = async () => {
    try {
      const users = await getUsers();
      if (users.length > 0) {
        setCurrentUser(users[0]); // Captain is always first
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error("Failed to load user profile", e);
    }
  };

  return (
    <>
      <nav className={`navbar ${isMap ? 'navbar-glass' : ''}`}>
        <div className="navbar-container">
          <Link to="/" className="navbar-brand" data-tour="nav-brand">
            <Leaf className="brand-icon" />
            <span>Cleanup Ranger</span>
          </Link>
          <div className="navbar-actions">
            <Link to="/about" className="btn btn-secondary">Roadmap</Link>
            <Link to="/dashboard" className="btn btn-secondary" data-tour="nav-dashboard">Dashboard</Link>
            <Link to="/map" className="btn btn-secondary" data-tour="nav-map">Map</Link>
            {!isLoggedIn ? (
              <button 
                className="btn btn-primary" 
                data-tour="nav-login"
                onClick={handleLogin}
              >
                Sign In
              </button>
            ) : (
              <button 
                className="btn btn-secondary flex items-center justify-center gap-2 p-2 rounded-full border border-border-light hover:bg-white/10"
                onClick={() => setShowProfile(true)}
                title="View Profile"
              >
                <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{currentUser?.avatar || '🧑‍🌾'}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {showProfile && currentUser && (
        <UserProfileModal 
          user={currentUser} 
          onClose={() => setShowProfile(false)} 
        />
      )}
    </>
  );
}
