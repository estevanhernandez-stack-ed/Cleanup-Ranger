import { X, MapPin, Trash2, Award, TreePine } from 'lucide-react';
import '../scanner/DriftScanner.css'; // Reuse modal styles

export interface UserStats {
  id?: string;
  name: string;
  role: string;
  avatar: string;
  points: number;
  parksCleaned: number;
  trashBagsCollected: number;
  locationsVisited: number;
  rank: string;
  recentBadges: string[];
  territoryRank: number;
  lastCheckIn?: {
    parkId: string;
    parkName: string;
    lat: number;
    lng: number;
    timestamp: Date | string;
  };
}

interface UserProfileModalProps {
  user: UserStats;
  onClose: () => void;
}

export function UserProfileModal({ user, onClose }: UserProfileModalProps) {
  return (
    <div className="scanner-overlay" onClick={onClose} style={{ zIndex: 1000}}>
      <div 
        className="scanner-modal glass-panel"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="scanner-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '2rem' }}>{user.avatar}</span>
            <div>
              <h3 className="m-0 text-lg">{user.name}</h3>
              <p className="text-xs text-text-muted m-0">{user.role} • {user.rank}</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="scanner-body">
           <div className="park-card p-4 text-center mb-6">
              <p className="text-sm text-text-muted uppercase tracking-wider mb-1">Total Score</p>
              <p className="text-4xl font-bold text-accent-green">{user.points.toLocaleString()}</p>
              <p className="text-xs text-text-muted mt-2">Ranked #{user.territoryRank} in territory</p>
           </div>

           <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Lifetime Impact</h4>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div className="park-card p-3 flex flex-col items-center text-center">
                 <TreePine size={24} className="text-accent-green mb-2" />
                 <p className="text-2xl font-bold">{user.parksCleaned}</p>
                 <p className="text-xs text-text-muted mt-1">Parks Cleaned</p>
              </div>
              <div className="park-card p-3 flex flex-col items-center text-center">
                 <Trash2 size={24} className="text-text-primary mb-2" />
                 <p className="text-2xl font-bold">{user.trashBagsCollected}</p>
                 <p className="text-xs text-text-muted mt-1">Bags Collected</p>
              </div>
              <div className="park-card p-3 flex flex-col items-center text-center w-full" style={{ gridColumn: 'span 2' }}>
                 <MapPin size={24} className="text-accent-orange mb-2" />
                 <p className="text-2xl font-bold">{user.locationsVisited}</p>
                 <p className="text-xs text-text-muted mt-1">Unique Parks Visited</p>
              </div>
           </div>

           <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3">Recent Badges</h4>
           <div className="flex gap-2 flex-wrap">
              {user.recentBadges.map((badge, i) => (
                <div key={i} className="bg-white/10 px-3 py-1.5 rounded-full text-xs flex items-center gap-1 border border-white/5">
                   <Award size={12} className="text-accent-purple"/> {badge}
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
