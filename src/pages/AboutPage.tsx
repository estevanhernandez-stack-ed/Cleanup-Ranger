import { Rocket, Shield, Globe, Zap, Cpu, Award } from 'lucide-react';
import './AboutPage.css';

export function AboutPage() {
  const roadmapItems = [
    {
      quarter: 'Q2 2026',
      title: 'Business Bounties',
      description: 'Localized sponsorship system allowing small businesses to fund specific cleanup rallies in exchange for community recognition.',
      icon: <Award className="roadmap-icon" />,
      status: 'planned'
    },
    {
      quarter: 'Q3 2026',
      title: 'IoT Guardian Sensors',
      description: 'Deployment of real-time environmental monitoring nodes for soil quality, water levels, and air toxicity in high-risk zones.',
      icon: <Cpu className="roadmap-icon" />,
      status: 'design'
    },
    {
      quarter: 'Q4 2026',
      title: 'Drone Recon System',
      description: 'Automated hazard detection using autonomous drone swarms to scan difficult-to-reach terrain and update the map live.',
      icon: <Shield className="roadmap-icon" />,
      status: 'research'
    },
    {
      quarter: '2027',
      title: 'Invasive Species Tracker',
      description: 'Advanced AR computer vision tools to identify and map invasive flora and fauna, coordinating targeted removal efforts.',
      icon: <Globe className="roadmap-icon" />,
      status: 'concept'
    }
  ];

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="container">
          <h1 className="hero-title">Protecting the <span className="text-gradient">Green Commons</span></h1>
          <p className="hero-subtitle">
            Cleanup Ranger is a decentralized stewardship platform merging autonomous agent intelligence with community-driven environmental action.
          </p>
        </div>
      </div>

      <section className="about-section container">
        <div className="section-grid">
          <div className="section-content">
            <h2 className="section-title">The Mission</h2>
            <p>
              Our mission is to empower a new generation of "Civic Guardians" with the tools needed to monitor, report, and remediate local environmental drifts. By leveraging AI-driven verification and hyper-local data, we turn stewardship into a gamified, mission-critical operations system.
            </p>
          </div>
          <div className="feature-cards">
            <div className="feature-card glass-panel">
              <Zap className="feature-icon" />
              <h3>Real-Time Radar</h3>
              <p>Dynamic mapping of territory health via Places API and community telemetry.</p>
            </div>
            <div className="feature-card glass-panel">
              <Rocket className="feature-icon" />
              <h3>AI Verification</h3>
              <p>Gemini-powered visual analysis ensures every cleanup effort is valid and impactful.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="roadmap-section">
        <div className="container">
          <h2 className="section-title text-center">Future Roadmap</h2>
          <div className="roadmap-timeline">
            {roadmapItems.map((item, index) => (
              <div key={index} className="roadmap-item glass-panel">
                <div className="roadmap-header">
                  <div className="roadmap-tag">{item.quarter}</div>
                  {item.icon}
                </div>
                <h3 className="roadmap-item-title">{item.title}</h3>
                <p className="roadmap-item-desc">{item.description}</p>
                <div className="roadmap-status">
                  <span className={`status-dot ${item.status}`}></span>
                  {item.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="about-footer container">
        <p>© 2026 Cleanup Ranger Operations. Stand Ready. Protect the Wild.</p>
      </footer>
    </div>
  );
}
