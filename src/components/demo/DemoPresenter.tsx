import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './DemoPresenter.css';

interface Scene {
  path?: string;
  caption: string;
  duration: number;
  action?: () => void;
  isChapter?: boolean;
}

const DEMO_SCENES: Scene[] = [
  // --- SEGMENT 1: THE ISSUE ---
  {
    isChapter: true,
    caption: '🌍 Cleanup Ranger: The Problem of State Drift',
    duration: 5000
  },
  {
    isChapter: true,
    caption: '⚠️ Our public spaces are declining. Hazards and litter often go unreported for weeks, degrading our local ecosystem.',
    duration: 6000
  },
  {
    isChapter: true,
    caption: '📉 Traditional reporting is slow and disconnected. We need a decentralized, real-time response system.',
    duration: 6000
  },

  // --- SEGMENT 2: FUNCTIONALITY ---
  {
    isChapter: true,
    caption: '🛠️ The Solution: A Decentralized Stewardship Hub',
    duration: 5000
  },
  {
    path: '/',
    caption: '🏠 It starts with a mission. Every user is a Ranger, sworn to protect the green commons.',
    duration: 4000
  },
  {
    caption: '🛡️ We merge autonomous agent intelligence with community action.',
    duration: 4000,
    action: () => window.scrollTo({ top: 800, behavior: 'smooth' })
  },
  {
    path: '/map',
    caption: '📡 The Command Radar: Dynamically tracking park health using Google Maps & Places.',
    duration: 6000
  },
  {
    caption: '🕵️ Detect & Report: Identify hazards instantly. Our AI scans photos to classify "State Drifts."',
    duration: 6000,
    action: () => {
       const el = document.querySelector('[data-tour="scan-hazard-btn"]');
       el?.classList.add('demo-pulse');
       setTimeout(() => el?.classList.remove('demo-pulse'), 3000);
    }
  },
  {
    caption: '🤖 Powered by Google Gemini: Turning raw data into mission-ready manifests and tool lists.',
    duration: 6000
  },
  {
    caption: '✅ High-Trust Verification: Rewarding Squads only after AI confirms a site remediation.',
    duration: 6000,
    action: () => {
        const btn = document.querySelector('.btn-verify-cleanup');
        btn?.classList.add('demo-pulse');
        setTimeout(() => btn?.classList.remove('demo-pulse'), 3000);
    }
  },
  {
    caption: '🏆 Gamified Community Ops: Rallies, squads, and legacy points for impact-driven stewardship.',
    duration: 6000,
    action: () => {
        const btn = document.querySelector('[data-tour="nav-dashboard"]');
        btn?.classList.add('demo-pulse');
        setTimeout(() => btn?.classList.remove('demo-pulse'), 3000);
    }
  },

  // --- SEGMENT 3: HOW IT WAS CREATED ---
  {
    isChapter: true,
    caption: '🏗️ How it was Created: The Tech Stack',
    duration: 5000
  },
  {
    isChapter: true,
    caption: '⚡ Built with Vite + React for high-performance, responsive UI and premium glassmorphism aesthetics.',
    duration: 6000
  },
  {
    isChapter: true,
    caption: '🔥 Powered by Firebase for real-time data persistence and decentralized user profiles.',
    duration: 6000
  },
  {
    isChapter: true,
    caption: '🧠 Integrated with Google Gemini 1.5 for complex image classification and stewardship verification.',
    duration: 6000
  },

  // --- OUTRO ---
  {
    path: '/about',
    caption: '🚀 Our 2026-2027 Roadmap: IoT Sensors, Drone Recon, and Business Bounties.',
    duration: 6000
  },
  {
    isChapter: true,
    caption: '🫡 Join the Rangers. Stand Ready. Protect the Wild.',
    duration: 7000
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
    <div className={`demo-overlay ${scene.isChapter ? 'demo-chapter-view' : ''}`}>
      <div className="demo-caption-container">
        <div className="demo-progress-bar" style={{ width: `${(currentStep / DEMO_SCENES.length) * 100}%` }}></div>
        <p className="demo-caption">{scene.caption}</p>
        <button className="demo-skip" onClick={() => setIsActive(false)}>Exit Demo</button>
      </div>
    </div>
  );
}
