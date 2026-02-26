import { Link } from 'react-router-dom';
import { ShieldCheck, Map, Scan } from 'lucide-react';
import './LandingPage.css';

export function LandingPage() {
  return (
    <div className="landing-page animate-fade-in">
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">Environmental Field Ops</div>
          <h1 className="hero-title">Restore the Balance.<br/><span className="text-accent">Clear the Hazards.</span></h1>
          <p className="hero-subtitle">
            Cleanup Ranger acts as your local environmental inspection unit. Detect hazards in local parks, organize cleanup operations, and heal the map.
          </p>
        <div className="hero-cta">
             <Link to="/dashboard" className="btn btn-primary btn-lg">Launch Dashboard Hub</Link>
          </div>
        </div>
      </header>

      <section className="features-section">
        <div className="feature-card glass-panel">
          <Scan className="feature-icon text-accent-blue" />
          <h3>AI Photo Evidence</h3>
          <p>Snap a photo of environmental hazards. Our Gemini-powered AI classifies the severity, identifying trash, biohazards, or broken infrastructure for verifiable photo evidence.</p>
        </div>
        <div className="feature-card glass-panel">
          <Map className="feature-icon text-accent-green" />
          <h3>City Friendly Mapping</h3>
          <p>Local parks are populated automatically using Google Places. Pinpoint operations and track the "health score" of community territories, making it highly city friendly.</p>
        </div>
        <div className="feature-card glass-panel">
          <ShieldCheck className="feature-icon text-accent-orange" />
          <h3>Gamified Community Ops</h3>
          <p>Community driven action. Organize cleanup operations, track stewardship points, and earn the rank of Master Ranger in a fully gamified experience.</p>
        </div>
      </section>
    </div>
  );
}
