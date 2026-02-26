import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, CheckCircle, Info, Loader2, Clock, Users, Navigation } from 'lucide-react';
import { getParkProfile, getParkActivity, joinRally, type ParkProfile, type ParkActivityItem } from '../../lib/db';
import type { HazardAnalysis } from '../../lib/gemini';
import { isFeatureEnabled } from '../../lib/featureFlags';
import { OrganizeRallyModal } from './OrganizeRallyModal';
import './ParkProfilePanel.css';

// Utility to create URL-friendly slugs from park names
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/(^-|-$)+/g, '');   // Remove leading/trailing hyphens
}

interface ParkProfilePanelProps {
  park: google.maps.places.PlaceResult;
  onClose: () => void;
  onReportHazard: (parkId: string) => void;
  onReportCleanup: (parkId: string) => void;
}

export function ParkProfilePanel({ park, onClose, onReportHazard, onReportCleanup }: ParkProfilePanelProps) {
  const navigate = useNavigate();
  // Use place_id as the unique identifier for the park in our database
  const parkId = park.place_id || park.name || 'unknown';
  const displayPlaceName = park.name || "Community Park";
  const parkSlug = createSlug(displayPlaceName);

  const [dbProfile, setDbProfile] = useState<ParkProfile | null>(null);
  const [activities, setActivities] = useState<ParkActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizingHazard, setOrganizingHazard] = useState<HazardAnalysis & { id?: string } | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const [data, activityData] = await Promise.all([
           getParkProfile(parkId),
           isFeatureEnabled('ENABLE_ACTIVITY_FEED') ? getParkActivity(parkId) : Promise.resolve([])
        ]);
        if (data) setDbProfile(data);
        setActivities(activityData);
      } catch (err) {
        console.error("Failed to load park profile", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [parkId]);

  const refreshActivity = async () => {
    if (isFeatureEnabled('ENABLE_ACTIVITY_FEED')) {
       const activityData = await getParkActivity(parkId);
       setActivities(activityData);
    }
  };

  const handleJoinRally = async (rallyId: string) => {
    try {
      // In a real app we'd use the logged-in user. For this prototype:
      await joinRally(rallyId, "Local Ranger");
      await refreshActivity();
    } catch (e) {
      console.error("Failed to RSVP", e);
    }
  };

  const integrity = dbProfile ? dbProfile.integrity : 100;
  const statusLabel = loading ? "Loading..." : (integrity < 100 ? "Hazards Detected" : "Baseline Clean");

  return (
    <div className="park-profile-overlay animate-fade-in flex items-center justify-center p-4">
      <div className="park-profile-modal glass-panel w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with Photo */}
        <div className="relative h-64 bg-bg-dark border-b border-border-light" style={{ flexShrink: 0 }}>
          {park.photos && park.photos.length > 0 ? (
            <img 
              src={park.photos[0].getUrl({ maxWidth: 800 })} 
              alt={park.name} 
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
              <span className="text-4xl mb-2">🌲</span>
              <p>No intel photo available</p>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-bg-dark/80 text-text-primary p-2 rounded-full hover:bg-bg-dark transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="absolute bottom-4 left-4 right-4 bg-bg-dark/90 backdrop-blur-md p-3 rounded-lg border border-border-light">
            <h2 className="text-xl font-bold m-0">{park.name}</h2>
            <p className="text-sm text-text-secondary mt-1 m-0">{park.vicinity}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-light border-dashed">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Status</p>
              <p className="text-lg font-semibold flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Info size={18} className={integrity < 100 ? "text-accent-orange" : "text-accent-green"} />} 
                <span className={integrity < 100 && !loading ? "text-accent-orange" : ""}>{statusLabel}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Current Integrity</p>
              <p className={`text-xl font-bold ${integrity < 100 ? "text-accent-orange" : "text-accent-green"}`}>
                {loading ? "--" : integrity}%
              </p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button 
              className="btn btn-primary flex-1 py-3 flex items-center justify-center gap-2 font-bold shadow-lg"
              onClick={() => {
                const photoUrl = park.photos && park.photos.length > 0 
                  ? park.photos[0].getUrl({ maxWidth: 1600 }) 
                  : undefined;
                navigate(`/park/${parkSlug}`, { 
                  state: { 
                    parkName: displayPlaceName, 
                    dbParkId: parkId,
                    parkPhoto: photoUrl
                  } 
                });
              }}
            >
              <Navigation size={16} /> Open Park Page
            </button>
          </div>

          <p className="mb-6 leading-relaxed text-sm">
            This territory requires community verification. Deploy on-site to scan for environmental hazards or confirm baseline integrity.
          </p>

          {isFeatureEnabled('ENABLE_ACTIVITY_FEED') && activities.length > 0 && (
            <div className="activity-feed mb-6">
              <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Clock size={16} /> Recent Activity
              </h4>
              <div className="flex flex-col gap-3">
                {activities.map((activity: ParkActivityItem) => (
                  <div key={activity.id} className="p-3 bg-white/5 border border-white/10 rounded flex items-start gap-3">
                     {'photoUrl' in activity && activity.photoUrl ? (
                        <img src={activity.photoUrl} alt="Activity Thumbnail" className="w-12 h-12 object-cover rounded opacity-80 mt-1 flex-shrink-0" />
                     ) : (
                        <div className="w-12 h-12 bg-white/10 rounded mt-1 flex-shrink-0 flex items-center justify-center text-xs">
                          {activity.activityType === 'rally' ? <Users size={20} className="text-accent-purple/50"/> : 'No img'}
                        </div>
                     )}
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                          {activity.activityType === 'hazard' ? (
                            <span className="text-xs font-bold text-accent-orange bg-accent-orange/10 px-2 py-0.5 rounded">Hazard Reported</span>
                          ) : activity.activityType === 'rally' ? (
                            <span className="text-xs font-bold text-accent-purple bg-accent-purple/10 px-2 py-0.5 rounded">Cleanup Rally</span>
                          ) : (
                            <span className="text-xs font-bold text-accent-green bg-accent-green/10 px-2 py-0.5 rounded">Cleanup Verified</span>
                          )}
                          <span className="text-[10px] text-text-muted">
                            {activity.createdAt 
                              ? (typeof (activity.createdAt as unknown as { toDate: () => Date }).toDate === 'function' 
                                  ? (activity.createdAt as unknown as { toDate: () => Date }).toDate().toLocaleDateString() 
                                  : activity.createdAt instanceof Date 
                                    ? activity.createdAt.toLocaleDateString()
                                    : 'Just now')
                              : 'Just now'}
                          </span>
                       </div>
                       
                       {activity.activityType === 'rally' ? (
                          <div className="text-sm">
                            <strong className="text-accent-secondary block mb-1">{activity.title}</strong>
                            <p className="text-text-primary m-0 mb-1">{activity.description}</p>
                            <p className="text-xs text-text-muted mt-1">
                               Organized by {activity.organizer} • {new Date(activity.date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-text-muted mt-1 font-semibold">
                               {activity.attendees?.length || 1} Rangers Attending
                            </p>
                            <button 
                               onClick={() => handleJoinRally(activity.id || '')}
                               className="btn btn-secondary mt-2 py-1 px-3 text-xs flex items-center gap-1 border-accent-purple/30 text-accent-purple hover:bg-accent-purple/10"
                            >
                              <Users size={12}/> RSVP to Rally
                            </button>
                          </div>
                       ) : (
                          <p className="text-sm text-text-primary m-0">{activity.summary}</p>
                       )}

                       {activity.activityType === 'hazard' && (
                         <button 
                           onClick={() => setOrganizingHazard(activity)}
                           className="btn btn-secondary mt-2 w-auto py-1 px-3 text-xs flex items-center gap-1 border-accent-green/30 text-accent-green hover:bg-accent-green/10"
                         >
                            <Users size={12}/> Organize Rally
                         </button>
                       )}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-3 mt-auto">
            <button 
              className="btn flex items-center justify-center gap-2 bg-accent-orange/10 text-accent-orange border border-accent-orange/30 hover:bg-accent-orange/20"
              onClick={() => onReportHazard(parkId)}
              data-tour="park-report-hazard-btn"
            >
              <Camera size={18} />
              Report Hazard
            </button>
            <button 
              className="btn flex items-center justify-center gap-2 bg-accent-green/10 text-accent-green border border-accent-green/30 hover:bg-accent-green/20"
              onClick={() => onReportCleanup(parkId)}
              data-tour="park-report-cleanup-btn"
            >
              <CheckCircle size={18} />
              Verify Clean / Report Cleanup
            </button>
          </div>
        </div>
        
        {organizingHazard && (
          <OrganizeRallyModal
            parkId={parkId}
            parkName={park.name || 'Unknown Park'}
            hazard={organizingHazard}
            onClose={() => setOrganizingHazard(null)}
            onRallyCreated={() => {
              setOrganizingHazard(null);
              refreshActivity();
            }}
          />
        )}
      </div>
    </div>
  );
}
