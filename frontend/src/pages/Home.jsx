import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Fitness App Dashboard</h1>
        <nav>
          <ul className="nav-list">
            <li>
              <Link to="/plans">Plans</Link>
            </li>
            <li>
              <Link to="/profile">View Profile</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
            <li>
              <Link to="/logout">Logout</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="home-main">
        <section className="welcome-section">
          <h2>Welcome Back!</h2>
          <p>
            Your personalized fitness journey starts here. Check your progress,
            explore tailored workout plans, and manage your profile.
          </p>
        </section>
        <section className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <Link to="/plans" className="action-button">
              View Plans
            </Link>
            <Link to="/profile" className="action-button">
              View Profile
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
