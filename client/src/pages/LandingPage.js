import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main className="container hero">
      <div>
        <h1>Emergency Response, Unified.</h1>
        <p>
          Request ambulances in seconds, dispatch nearest drivers, and track live location in real time.
        </p>
        <div className="hero-actions">
          <Link className="btn" to="/register">
            Get Started
          </Link>
          <Link className="btn secondary" to="/login">
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}

