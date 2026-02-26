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
    caption: '🌍 Cleanup Ranger: The Crisis of Ecological State Drift',
    duration: 5000
  },
  {
    isChapter: true,
    caption: '⚠️ Our public spaces are in decline. "State Drift"—the gradual loss of ecological integrity—often goes unreported for weeks.',
    duration: 7000
  },
  {
    isChapter: true,
    caption: '📉 Traditional reporting is fragmented. We need a unified, real-time response system to heal the map.',
    duration: 6500
  },

  // --- SEGMENT 2: FUNCTIONALITY ---
  {
    isChapter: true,
    caption: '🛠️ The Solution: A Decentralized Command Hub',
    duration: 5000
  },
  {
    path: '/',
    caption: '🏠 Every user is a Ranger, connected to a global network of territory stewards.',
    duration: 5000
  },
  {
    caption: '🛡️ We merge autonomous agent intelligence with boots-on-the-ground volunteer action.',
    duration: 5500,
    action: () => window.scrollTo({ top: 800, behavior: 'smooth' })
  },
  {
    path: '/map',
    caption: '📡 The Command Radar: Live telemetry tracking the structural health of every park in your sector.',
    duration: 7000
  },
  {
    caption: '🕵️ Detect & Report: Use the Drift Scanner to identify hazards. Gemini AI classifies the damage in seconds.',
    duration: 7000,
    action: () => {
       const el = document.querySelector('[data-tour="scan-hazard-btn"]');
       el?.classList.add('demo-pulse');
       setTimeout(() => el?.classList.remove('demo-pulse'), 3000);
    }
  },
  {
    caption: '🤖 Smart Manifests: The AI generates a tailored tool list and mission brief for every report.',
    duration: 6500
  },
  {
    caption: '✅ Proof of Impact: Verify your work with a follow-up scan. Our secondary AI pass confirms site remediation.',
    duration: 7000,
    action: () => {
        const btn = document.querySelector('.btn-verify-cleanup');
        btn?.classList.add('demo-pulse');
        setTimeout(() => btn?.classList.remove('demo-pulse'), 3000);
    }
  },
  {
    caption: '🏆 Squad Operations: Join a unit, earn legacy points, and dominate the local leaderboard through stewardship.',
    duration: 7000,
    action: () => {
        const btn = document.querySelector('[data-tour="nav-dashboard"]');
        btn?.classList.add('demo-pulse');
        setTimeout(() => btn?.classList.remove('demo-pulse'), 3000);
    }
  },

  // --- SEGMENT 3: HOW IT WAS CREATED ---
  {
    isChapter: true,
    caption: '🏗️ Behind the Tech: Rapid Prototyping in Google Antigravity',
    duration: 5500
  },
  {
    isChapter: true,
    caption: '⚡ This entire platform was architected and built in less than 72 hours using the Google Antigravity agentic environment.',
    duration: 7000
  },
  {
    isChapter: true,
    caption: '🧠 Intelligence by Gemini 3.1 Pro and 3 Flash: Our core engines for multimodal hazard classification and verification.',
    duration: 7000
  },
  {
    isChapter: true,
    caption: '🔥 Powered by Firebase: Real-time synchronization and decentralized data for a resilient stewardship network.',
    duration: 6500
  },

  // --- OUTRO ---
  {
    path: '/about',
    caption: '🚀 The Future roadmap: IoT Guardian Sensors, Drone Recon swarms, and Business Bounties.',
    duration: 7500
  },
  {
    isChapter: true,
    caption: '© 2026 Cleanup Ranger Operations by 626LabsLLC. Stand Ready. Protect the Wild.',
    duration: 8000
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

  const speak = useCallback((text: string, onEnd: () => void) => {
    window.speechSynthesis.cancel();
    
    // 1. Clean the text (strip emojis)
    let cleanText = text.replace(/[^\w\s\d.,!?'"()-:]/g, '').trim();
    
    // 2. Pronunciation fixes
    cleanText = cleanText.replace(/\blive\b/gi, 'real-time');
    cleanText = cleanText.replace(/3.1/g, '3 point 1');
    cleanText = cleanText.replace(/626LabsLLC/gi, 'six two six labs, L, L, C');
    
    // 3. Split by colon for the "Professional Beat"
    const segments = cleanText.split(':').map(s => s.trim());
    
    const speakSegment = (index: number) => {
      if (index >= segments.length) {
        // Add a final 1s buffer after all segments are finished
        setTimeout(onEnd, 1000);
        return;
      }

      if (!segments[index]) {
        speakSegment(index + 1);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(segments[index]);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Premium') || v.name.includes('Natural') || v.name.includes('Google'))
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        // Take a 650ms beat between segments (e.g. after the colon)
        setTimeout(() => speakSegment(index + 1), 650);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakSegment(0);
  }, []);

  useEffect(() => {
    if (!isActive) {
      window.speechSynthesis.cancel();
      return;
    }

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

    // Advance only AFTER speech finishes
    speak(scene.caption, () => {
      if (currentStep + 1 >= DEMO_SCENES.length) {
        setIsActive(false);
      } else {
        setCurrentStep(prev => prev + 1);
      }
    });

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isActive, currentStep, navigate, location.pathname, speak]);

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
