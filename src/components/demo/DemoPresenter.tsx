import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './DemoPresenter.css';

interface Scene {
  path?: string;
  caption: string;
  duration: number;
  action?: () => void;
}

const DEMO_SCENES: Scene[] = [
  {
    path: '/',
    caption: '🌍 Welcome to Cleanup Ranger: Protecting the Green Commons.',
    duration: 4000
  },
  {
    caption: '🛡️ A decentralized platform merging AI with community stewardship.',
    duration: 4000,
    action: () => window.scrollTo({ top: 800, behavior: 'smooth' })
  },
  {
    caption: '🛰️ Real-time Command Radar: Powered by Google Maps & Places telemetry.',
    duration: 4000,
    action: () => window.scrollTo({ top: 1600, behavior: 'smooth' })
  },
  {
    path: '/map',
    caption: '📡 Initializing Territory Scan... Discovering local park infrastructure.',
    duration: 5000
  },
  {
    caption: '🔍 Detecting "State Drifts": Identifying hazards and sanitation gaps.',
    duration: 4500,
    action: () => {
       const el = document.querySelector('[data-tour="scan-hazard-btn"]');
       el?.classList.add('demo-pulse');
       setTimeout(() => el?.classList.remove('demo-pulse'), 3000);
    }
  },
  {
    caption: '🤖 Gemini AI classifications turn raw reports into mission-ready manifests.',
    duration: 4500
  },
  {
    caption: '✅ High-Trust Verification: Rewarding Squads for verified site remediation.',
    duration: 4500,
    action: () => {
        // Highlight verify button
        const btn = document.querySelector('.btn-verify-cleanup'); // hypothetical class I'll add
        btn?.classList.add('demo-pulse');
        setTimeout(() => btn?.classList.remove('demo-pulse'), 3000);
    }
  },
  {
    caption: '👥 Form specializes Squads and track local legacy points.',
    duration: 4500,
    action: () => {
        const btn = document.querySelector('[data-tour="nav-dashboard"]');
        btn?.classList.add('demo-pulse');
        setTimeout(() => btn?.classList.remove('demo-pulse'), 3000);
    }
  },
  {
    path: '/about',
    caption: '🚀 Building the future of green infrastructure.',
    duration: 4000
  },
  {
    caption: '📅 2026-2027 Roadmap: IoT Sensors, Drone Recon, and Business Bounties.',
    duration: 5000,
    action: () => window.scrollTo({ top: 1200, behavior: 'smooth' })
  },
  {
    caption: '🫡 Join the Rangers. Stand Ready. Protect the Wild.',
    duration: 5000
  }
];

export function DemoPresenter() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const startDemo = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    // Listen for custom event to start demo from Navbar
    const handleStart = () => startDemo();
    window.addEventListener('start-demo', handleStart);
    return () => window.removeEventListener('start-demo', handleStart);
  }, [startDemo]);

  useEffect(() => {
    if (!isActive) return;

    const scene = DEMO_SCENES[currentStep];
    if (!scene) return;

    // Handle Path Change
    if (scene.path && location.pathname !== scene.path) {
      navigate(scene.path);
    }

    // Trigger Action
    if (scene.action) {
      scene.action();
    }

    const timer = setTimeout(() => {
      if (currentStep + 1 >= DEMO_SCENES.length) {
        setIsActive(false);
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }, scene.duration);

    return () => clearTimeout(timer);
  }, [isActive, currentStep, navigate, location.pathname]);

  if (!isActive) return null;

  const scene = DEMO_SCENES[currentStep];
  if (!scene) return null;

  return (
    <div className="demo-overlay">
      <div className="demo-caption-container">
        <div className="demo-progress-bar" style={{ width: `${(currentStep / DEMO_SCENES.length) * 100}%` }}></div>
        <p className="demo-caption">{scene.caption}</p>
        <button className="demo-skip" onClick={() => setIsActive(false)}>Exit Demo</button>
      </div>
    </div>
  );
}
