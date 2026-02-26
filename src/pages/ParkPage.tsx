import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle, Clock, Users, Camera, Info, Trophy, Navigation, Leaf } from 'lucide-react';
import { getParkProfile, getParkActivity, checkInToPark, getUsers, confirmParkAmenity, addParkAmenity } from '../lib/db';
import type { ParkProfile, ParkActivityItem, ParkAmenity } from '../lib/db';
import { isFeatureEnabled } from '../lib/featureFlags';
import './ParkPage.css';

// Extended mock features/amenities
const FALLBACK_AMENITIES = [
  { icon: '🏃‍♂️', label: 'Open Field' },
  { icon: '🛹', label: 'Skate Park' },
  { icon: '🛝', label: 'Playground' },
  { icon: '♿', label: 'Accessible Equipment' },
  { icon: '🚽', label: 'Public Restrooms' },
  { icon: '🐾', label: 'Dog Park Area' }
];

const AMENITY_OPTIONS = [
  { icon: '🎾', label: 'Tennis Courts' },
  { icon: '🏀', label: 'Basketball' },
  { icon: '🚲', label: 'Bike Trails' },
  { icon: '🍖', label: 'BBQ Pits' },
  { icon: '🎣', label: 'Fishing' },
  { icon: '🎒', label: 'Hiking' },
  { icon: '🌳', label: 'Benches' }
];

export function ParkPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [dbProfile, setDbProfile] = useState<ParkProfile | null>(null);
  const [activities, setActivities] = useState<ParkActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAmenityPicker, setShowAmenityPicker] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const users = await getUsers();
        if (users.length > 0 && users[0].id) setCurrentUserId(users[0].id);
      } catch (e) {
        console.error("Failed to fetch current user", e);
      }
    }
    fetchUser();
  }, []);

  const location = useLocation();
  const stateParkName = location.state?.parkName;
  const stateParkPhoto = location.state?.parkPhoto;
  const dbParkId = location.state?.dbParkId || id; // Fetch real ID from state, fallback to URL param

  // Prefer DB name, then Router state, then falback
  const displayPlaceName = dbProfile?.name || stateParkName || "Community Park";
  const displayPhoto = stateParkPhoto || dbProfile?.photoUrl || `https://images.unsplash.com/photo-1495584816685-4bdbf1b5057e?auto=format&fit=crop&q=80&w=1600`;


  useEffect(() => {
    async function fetchInitialData() {
      if (!dbParkId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // 1. Fetch Profile (Must succeed for page to be useful)
        const data = await getParkProfile(dbParkId);
        if (data) setDbProfile(data);

        // 2. Fetch Activity (Optional - don't let it crash the page if indexes missing)
        if (isFeatureEnabled('ENABLE_ACTIVITY_FEED')) {
           try {
              const activityData = await getParkActivity(dbParkId);
              setActivities(activityData);
           } catch (actErr: any) {
              console.warn("Activity feed failed (Check Firestore Indexes):", actErr);
           }
        }
      } catch (err) {
        console.error("Critical failure loading park profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, [dbParkId]);

  const handleCheckIn = async () => {
    setIsCheckedIn(true);
    
    // Wire up to Firestore Database Check-In!
    try {
      if (dbParkId) {
         // Get the current user (Mocking Captain persona)
         const users = await getUsers();
         if (users.length > 0 && users[0].id) {
            // In a real app the current user ID is known, here Captain is the first sorted user
            await checkInToPark(users[0].id, dbParkId, displayPlaceName, dbProfile?.location.lat || 0, dbProfile?.location.lng || 0);
         }
      }
    } catch (e) {
      console.error("Failed to check in to Firestore", e);
    }
    
    // Add mock check-in activity to UI feed
    setActivities([{
       id: `checkin-${Date.now()}`,
       parkId: dbParkId || '',
       activityType: 'cleanup', // loosely reusing this type for checkin
       summary: 'You checked in to this park!',
       createdAt: new Date(),
       photoUrl: ''
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any, ...activities]);
  };

  const toggleAmenity = async (amenityLabel: string) => {
    if (!dbParkId || !currentUserId) return;

    try {
      await confirmParkAmenity(dbParkId, amenityLabel, currentUserId);
      
      // If we have a profile, update it optimistically
      if (dbProfile) {
        setDbProfile({
          ...dbProfile,
          amenities: (dbProfile.amenities || []).map(a => {
            if (a.label === amenityLabel) {
              const confirmedBy = [...(a.confirmedBy || [])];
              const index = confirmedBy.indexOf(currentUserId);
              if (index > -1) confirmedBy.splice(index, 1);
              else confirmedBy.push(currentUserId);
              return { ...a, confirmedBy };
            }
            return a;
          })
        });
      } else {
        // If no profile yet, we just trigger a refresh or let the DB handle it
        // For better UX, we could force a profile fetch here
        const data = await getParkProfile(dbParkId);
        if (data) setDbProfile(data);
      }
    } catch (e) {
      console.error("Failed to toggle amenity confirmation", e);
    }
  };

  const handleAddAmenity = async (label: string, icon: string) => {
    if (!dbParkId || !currentUserId) return;

    try {
      await addParkAmenity(dbParkId, label, icon, currentUserId);
      setShowAmenityPicker(false);
      
      // Force refresh profile to show new amenity
      const data = await getParkProfile(dbParkId);
      if (data) setDbProfile(data);
    } catch (e) {
      console.error("Failed to add amenity", e);
    }
  };

  const parkAmenities = dbProfile?.amenities && dbProfile.amenities.length > 0 
    ? dbProfile.amenities 
    : FALLBACK_AMENITIES.map(a => ({ ...a, confirmedBy: [] }));

  const integrity = dbProfile ? dbProfile.integrity : 100;
  const statusLabel = loading ? "Loading..." : (integrity < 100 ? "Hazards Detected" : "Baseline Clean");

  return (
    <div className="park-page animate-fade-in flex flex-col h-full bg-bg-dark overflow-y-auto pb-24">
      {/* Header Image Gallery */}
      <div className="relative w-full bg-surface-dark border-b border-border-light overflow-hidden flex items-center justify-center park-hero-container">
         <img 
            src={displayPhoto} 
            alt="Park scenery" 
            className="absolute inset-0 w-full h-full object-cover park-hero-image z-0"
            data-photo-url={displayPhoto}
         />
         <div className="absolute inset-0 park-header-gradient z-10"></div>
         <div className="absolute inset-0 bg-accent-green/5 z-10"></div>
         <Leaf size={120} className="text-white/5 absolute z-10" />


         <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-10">
            <button 
                onClick={() => navigate(-1)} 
                className="btn btn-secondary flex items-center justify-center gap-2 bg-black/40 backdrop-blur border-white/10"
            >
                <ArrowLeft size={18} /> Back
            </button>
            <div className="flex gap-2">
                <button className="btn btn-secondary bg-black/40 backdrop-blur border-white/10 w-10 h-10 p-0 flex items-center justify-center rounded-full">
                    <Navigation size={18} />
                </button>
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto px-4 -mt-16 relative z-10">
         
         {/* Title Card */}
         <div className="glass-panel p-6 rounded-2xl shadow-2xl mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                   <h1 className="text-3xl md:text-4xl font-black mb-2 m-0 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                      {displayPlaceName}
                   </h1>
                   <div className="flex items-center gap-2 text-text-muted mt-2">
                      <MapPin size={16} className="text-accent-green" />
                      <span>Local Community Zone</span>
                      <span className="mx-2">•</span>
                      <span>2.4 miles away</span>
                   </div>
                </div>

                <button 
                  className={`btn flex-shrink-0 flex items-center justify-center gap-2 py-4 px-8 rounded-full font-bold shadow-xl transition-all ${
                     isCheckedIn 
                     ? 'bg-accent-purple/20 text-accent-purple border-2 border-accent-purple/50' 
                     : 'bg-accent-green text-black hover:scale-105'
                  }`}
                  onClick={handleCheckIn}
                  disabled={isCheckedIn}
                >
                   {isCheckedIn ? <><CheckCircle size={20} /> Checked In</> : <><MapPin size={20} /> Check In Here</>}
                </button>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-panel p-5 rounded-xl border border-border-light flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-2">
                   <div className={`p-2 rounded-full ${integrity < 100 ? 'bg-accent-orange/20 text-accent-orange' : 'bg-accent-green/20 text-accent-green'}`}>
                      <Info size={20} />
                   </div>
                   <p className="text-sm text-text-muted uppercase tracking-wider m-0">Park Status</p>
               </div>
               <p className={`text-xl font-bold m-0 ${integrity < 100 ? 'text-accent-orange' : 'text-accent-green'}`}>
                  {statusLabel}
               </p>
               <p className="text-xs text-text-muted mt-1">Integrity: {loading ? '--' : integrity}%</p>
            </div>
            
            <div className="glass-panel p-5 rounded-xl border border-border-light flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 rounded-full bg-accent-purple/20 text-accent-purple">
                      <Trophy size={20} />
                   </div>
                   <p className="text-sm text-text-muted uppercase tracking-wider m-0">Community Rank</p>
               </div>
               <p className="text-xl font-bold m-0 text-text-primary">
                  #12 Most Active
               </p>
               <p className="text-xs text-text-muted mt-1">1,450 points generated here</p>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-border-light flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 rounded-full bg-white/10 text-white">
                      <Users size={20} />
                   </div>
                   <p className="text-sm text-text-muted uppercase tracking-wider m-0">Live Traffic</p>
               </div>
               <p className="text-xl font-bold m-0 text-text-primary">
                  14 Rangers
               </p>
               <p className="text-xs text-text-muted mt-1">Busy with youth teams on weekdays</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Left Column - Details */}
             <div className="lg:col-span-2 space-y-8">
                
                {/* Amenities */}
                <section>
                   <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-border-light pb-2">
                      Community Insights & Amenities
                   </h3>
                   <div className="flex flex-wrap gap-3 pb-4">
                      {parkAmenities.map((item, i) => {
                         const isConfirmed = currentUserId ? item.confirmedBy?.includes(currentUserId) : false;
                         const confirmCount = item.confirmedBy?.length || 0;
                         
                         return (
                            <button 
                               key={i} 
                               onClick={() => toggleAmenity(item.label)}
                               className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm transition-all border ${
                                  isConfirmed 
                                  ? 'bg-accent-green/20 border-accent-green text-accent-green' 
                                  : 'bg-surface-dark border-white/10 text-text-muted hover:border-white/30'
                               }`}
                            >
                               <span>{item.icon}</span>
                               <span className="font-medium">{item.label}</span>
                               {confirmCount > 0 && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isConfirmed ? 'bg-accent-green/30' : 'bg-white/10'}`}>
                                     {confirmCount}
                                  </span>
                               )}
                            </button>
                         );
                      })}
                      
                      <div className="relative z-[60]">
                         <button 
                            onClick={() => setShowAmenityPicker(!showAmenityPicker)}
                            className="bg-surface-dark border border-dashed border-white/20 px-4 py-2 rounded-full flex items-center gap-2 text-sm text-text-muted hover:bg-white/5 transition-colors"
                         >
                            <span>➕</span>
                            <span>Suggest Amenity</span>
                         </button>
                         
                         {showAmenityPicker && (
                             <div className="amenity-dropdown glass-panel p-4">
                               <p className="text-xs font-bold uppercase text-text-muted mb-3 flex justify-between items-center">
                                  <span>Community Suggestion</span>
                                  <button onClick={() => setShowAmenityPicker(false)} className="text-white/50 hover:text-white">✕</button>
                               </p>
                               <div className="grid grid-cols-1 gap-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  {AMENITY_OPTIONS.map((opt, idx) => (
                                     <button 
                                        key={idx}
                                        onClick={() => handleAddAmenity(opt.label, opt.icon)}
                                        className="text-left py-2 px-3 rounded hover:bg-white/10 text-sm flex items-center gap-3 transition-colors border border-transparent hover:border-white/10"
                                     >
                                        <span className="text-lg">{opt.icon}</span>
                                        <span className="font-medium text-text-primary">{opt.label}</span>
                                     </button>
                                  ))}
                               </div>
                            </div>
                         )}
                      </div>
                   </div>
                   <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4 mt-2 text-sm text-accent-blue relative z-0">
                      <strong>Community Note:</strong> The water fountain near the east entrance is currently out of order. Reported 2 days ago.
                   </div>
                </section>

                {/* Activity Feed */}
                <section>
                   <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-border-light pb-2">
                      <Clock size={20} /> Recent Activity
                   </h3>
                   {activities.length > 0 ? (
                       <div className="flex flex-col gap-4">
                          {activities.map((activity, i) => (
                             <div key={i} className="glass-panel p-4 rounded-xl border-l-4 border-l-accent-green">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-accent-green bg-accent-green/10 px-2 py-1 rounded uppercase tracking-wide">
                                       {activity.activityType === 'hazard' ? 'Hazard Reported' : activity.activityType === 'rally' ? 'Rally Created' : 'Cleanup Verified'}
                                    </span>
                                    <span className="text-xs text-text-muted">
                                        {activity.createdAt instanceof Date ? activity.createdAt.toLocaleDateString() : 'Recent'}
                                    </span>
                                </div>
                                <p className="text-sm text-text-primary m-0">{'summary' in activity ? activity.summary : 'description' in activity ? activity.description : 'Community action taken.'}</p>
                             </div>
                          ))}
                       </div>
                   ) : (
                       <div className="text-center py-12 glass-panel rounded-xl text-text-muted border border-border-light border-dashed">
                          <Leaf size={32} className="mx-auto mb-3 opacity-50" />
                          <p>No recent activity. Be the first to check in!</p>
                       </div>
                   )}
                </section>
             </div>

             {/* Right Column - Actions */}
             <div className="space-y-4">
                <div className="glass-panel p-6 rounded-xl sticky top-24">
                   <h4 className="font-bold mb-4 text-center">Deploy Tools</h4>
                   <button 
                     className="btn flex items-center justify-center gap-2 bg-accent-orange/10 text-accent-orange border border-accent-orange/30 hover:bg-accent-orange/20 w-full py-4 mb-3"
                   >
                     <Camera size={20} />
                     Report Hazard
                   </button>
                   <button 
                     className="btn flex items-center justify-center gap-2 bg-accent-green/10 text-accent-green border border-accent-green/30 hover:bg-accent-green/20 w-full py-4"
                   >
                     <CheckCircle size={20} />
                     Verify Clean
                   </button>
                </div>
             </div>
         </div>

      </div>
    </div>
  );
}
