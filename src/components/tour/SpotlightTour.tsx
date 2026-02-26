import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import './SpotlightTour.css';

interface TourStep {
  target: string;
  title: string;
  description: string;
  icon?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'nav-brand',
    title: 'Welcome to Cleanup Ranger 🌲',
    description: 'Your civic environmental field ops dashboard. Let\'s walk you through the key features that make this platform a game-changer for community stewardship.',
    icon: '🛡️',
  },
  {
    target: 'sidebar-territory',
    title: 'Local Territory Panel',
    description: 'This sidebar auto-populates nearby parks using the Google Places API. Each park card shows a real-time health bar based on crowdsourced hazard reports and AI-verified cleanups.',
    icon: '📡',
  },
  {
    target: 'park-list',
    title: 'Park Health Intelligence',
    description: 'Click any park to open its full profile — including an activity feed of hazards, cleanups, amenity status, and the option to adopt it as a Guardian Ranger.',
    icon: '🗺️',
  },
  {
    target: 'scan-hazard-btn',
    title: 'AI-Powered Hazard Reporting',
    description: 'Snap a photo and Gemini AI classifies the severity, generates a smart equipment manifest, and runs anti-fraud checks (EXIF GPS + authenticity verification) before submission.',
    icon: '📸',
  },
  {
    target: 'nav-map',
    title: 'Civic Heatmap Layer',
    description: 'The map view includes a real-time heatmap layer that visualizes areas with lower park integrity scores. Red = high risk. Powered by aggregated Firestore data.',
    icon: '🔥',
  },
  {
    target: 'nav-login',
    title: 'Gamified Stewardship',
    description: 'Earn Ranger Points for every verified cleanup. Organize Rally events with AI-generated mission briefings, form Squads, collect badges, and climb the leaderboard!',
    icon: '🏆',
  },
];

interface SpotlightTourProps {
  isOpen: boolean;
  onClose: () => void;
}

function getTargetRect(target: string): DOMRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  return el ? el.getBoundingClientRect() : null;
}

export function SpotlightTour({ isOpen, onClose }: SpotlightTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setTick] = useState(0);

  const step = TOUR_STEPS[currentStep];

  // Re-render on resize/scroll so rect stays fresh
  useEffect(() => {
    if (!isOpen) return;
    const bump = () => setTick(t => t + 1);
    window.addEventListener('resize', bump);
    window.addEventListener('scroll', bump);
    return () => {
      window.removeEventListener('resize', bump);
      window.removeEventListener('scroll', bump);
    };
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  if (!isOpen || !step) return null;

  // Computed during render — no setState needed
  const targetRect = getTargetRect(step.target);
  const padding = 12;
  const tooltipOffset = 16;
  let tooltipStyle: React.CSSProperties = {};

  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;

    if (spaceBelow > 200) {
      tooltipStyle = {
        top: targetRect.bottom + tooltipOffset,
        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 360)),
      };
    } else if (targetRect.top > 200) {
      tooltipStyle = {
        bottom: window.innerHeight - targetRect.top + tooltipOffset,
        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 360)),
      };
    } else {
      // It's a tall element, try putting it to the right or left
      const spaceRight = window.innerWidth - targetRect.right;
      if (spaceRight > 360) {
        // Place on the right
        tooltipStyle = {
          top: targetRect.top + 24,
          left: targetRect.right + tooltipOffset,
        };
      } else {
        // Place on the left (or inside if very wide)
        tooltipStyle = {
          top: targetRect.top + 24,
          left: Math.max(16, targetRect.left - 360 - tooltipOffset),
        };
      }
    }
  } else {
    tooltipStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  return (
    <>
      {/* SVG backdrop with cutout */}
      <svg
        className="spotlight-backdrop"
        width="100%"
        height="100%"
        onClick={handleClose}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Pulse ring around target */}
      {targetRect && (
        <div
          className="spotlight-highlight-ring"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div className="spotlight-tooltip" style={tooltipStyle} key={currentStep}>
        <div className="spotlight-step-badge">
          <Sparkles size={10} />
          Feature {currentStep + 1} of {TOUR_STEPS.length}
        </div>
        <div className="spotlight-title">
          {step.icon} {step.title}
        </div>
        <div className="spotlight-description">
          {step.description}
        </div>
        <div className="spotlight-actions">
          <div className="spotlight-dots">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`spotlight-dot ${i === currentStep ? 'active' : i < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
          <div className="spotlight-btn-group">
            <button className="spotlight-btn-skip" onClick={handleClose}>
              Skip
            </button>
            <button className="spotlight-btn-next" onClick={handleNext}>
              {currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Floating button to trigger the tour */
export function TourTriggerButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="tour-trigger-btn" onClick={onClick} title="Take a Feature Tour">
      <Sparkles size={20} />
    </button>
  );
}
