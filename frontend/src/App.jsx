import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { MyBookingsPage } from './pages/MyBookingsPage';


function AppContent() {
  const { user, loading, logout } = useContext(AuthContext);
  
  // Custom routing states
  const [currentPage, setCurrentPage] = useState('events');
  const [navigationParams, setNavigationParams] = useState(null);

  const navigateTo = (pageName, params = null) => {
    setCurrentPage(pageName);
    setNavigationParams(params);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  // Routing Switch
  let PageComponent = null;
  switch (currentPage) {
    case 'login':
      PageComponent = <LoginPage navigateTo={navigateTo} params={navigationParams} />;
      break;
    case 'register':
      PageComponent = <RegisterPage navigateTo={navigateTo} params={navigationParams} />;
      break;
    case 'events':
      PageComponent = <EventsPage navigateTo={navigateTo} />;
      break;
    case 'event-details':
      PageComponent = (
        <EventDetailsPage navigateTo={navigateTo} params={navigationParams} />
      );
      break;
    case 'booking-confirmation':
      // Protected checkout page
      if (!user) {
        PageComponent = <LoginPage navigateTo={navigateTo} params={navigationParams} />;
      } else {
        PageComponent = (
          <BookingConfirmationPage navigateTo={navigateTo} params={navigationParams} />
        );
      }
      break;
    case 'bookings':
      // Protected bookings history page
      if (!user) {
        PageComponent = <LoginPage navigateTo={navigateTo} params={navigationParams} />;
      } else {
        PageComponent = <MyBookingsPage navigateTo={navigateTo} />;
      }
      break;
    default:
      PageComponent = <EventsPage navigateTo={navigateTo} />;
  }

  return (
    <div className="app">
      {/* Sticky navigation header - visible to both logged-in users and guests */}
      <nav className="navbar">
        <div className="container navbar-container">
          <a
            id="navbar-brand-link"
            href="#"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('events');
            }}
          >
            <span className="brand-dot"></span>
            SortMyScene
          </a>
          
          <div className="nav-links">
            {user ? (
              <>
                <span className="nav-user">Hello, {user.name}</span>
                <button
                  id="nav-bookings-btn"
                  className="btn btn-sm btn-outline"
                  onClick={() => navigateTo('bookings')}
                >
                  My Bookings
                </button>
                <button
                  id="logout-btn"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    logout();
                    navigateTo('events'); // Redirect to homepage on logout
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  id="nav-login-btn"
                  className="btn btn-sm btn-outline"
                  onClick={() => navigateTo('login')}
                >
                  Sign in
                </button>
                <button
                  id="nav-register-btn"
                  className="btn btn-sm btn-primary"
                  onClick={() => navigateTo('register')}
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flexGrow: 1, paddingBottom: '40px' }}>
        {PageComponent}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
