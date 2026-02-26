import { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api';
import type { Library } from '@googlemaps/js-api-loader';
import { Camera, CheckCircle, Plus } from 'lucide-react';
import { DriftScanner } from '../components/scanner/DriftScanner';
import { CleanupScanner } from '../components/scanner/CleanupScanner';
import { ParkProfilePanel } from '../components/parks/ParkProfilePanel';
import { AddParkModal } from '../components/parks/AddParkModal';
import type { HazardAnalysis } from '../lib/gemini';
import { submitHazardReport, submitCleanupVerification, getCustomParks, getAllRegisteredParks, getUsers, type ParkProfile } from '../lib/db';
import { isFeatureEnabled } from '../lib/featureFlags';
import { SpotlightTour, TourTriggerButton } from '../components/tour/SpotlightTour';
import { ManageSquadModal } from '../components/squads/ManageSquadModal';
import type { UserStats } from '../components/squads/UserProfileModal';
import './MapPage.css';

// Extended type for selected parks, including custom ones
export type MapPark = google.maps.places.PlaceResult | (ParkProfile & { place_id?: string });

const containerStyle = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060 
};

// Custom styling is now handled via Google Cloud Console Maps Management
const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapId: "RANGER_OPS_MAP_ID", // mapId is required for AdvancedMarkerElement
};

const libraries: Library[] = ['places', 'marker', 'visualization'];

export function MapPage() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries
  });
  const [center, setCenter] = useState(defaultCenter);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCleanupScannerOpen, setIsCleanupScannerOpen] = useState(false);
  const [addingParkLocation, setAddingParkLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const [reports, setReports] = useState<HazardAnalysis[]>([]);
  const [placesParks, setPlacesParks] = useState<google.maps.places.PlaceResult[]>([]);
  const [customParks, setCustomParks] = useState<ParkProfile[]>([]);
  const [squadMembers, setSquadMembers] = useState<UserStats[]>([]);
  const [selectedPark, setSelectedPark] = useState<MapPark | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [heatmapData, setHeatmapData] = useState<google.maps.visualization.WeightedLocation[]>([]);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const seenParkIds = useRef<Set<string>>(new Set());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationReady(true);
        },
        (error) => {
          console.error("Error getting location: ", error);
          setLocationError("Could not get your location. Using default map center.");
          setLocationReady(true); // Still ready, just using default
        }
      );
    } else {
      setTimeout(() => {
        setLocationError("Geolocation is not supported by your browser.");
        setLocationReady(true);
      }, 0);
    }
  }, []);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMapInstance(map);
  }, []);

  useEffect(() => {
    if (!mapInstance || !locationReady || !window.google?.maps?.marker?.AdvancedMarkerElement || !window.google?.maps?.places) return;

    // Clear old markers when resetting
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];

    // Add marker for user location
    const userMarker = new window.google.maps.marker.AdvancedMarkerElement({
      map: mapInstance,
      position: center, 
      title: "Your Location"
    });
    markersRef.current.push(userMarker);

    // Fetch custom parks from database
    getCustomParks().then(dbParks => setCustomParks(dbParks)).catch(err => console.error("Error fetching custom parks", err));

    // Fetch squad members to plot their last check-ins
    // We filter down to only ones that actually have a checkin location
    getUsers()
      .then(users => setSquadMembers(users.filter(u => u.lastCheckIn)))
      .catch(err => console.error("Error fetching users for map pins", err));

    // Search for nearby parks based on current center
    setTimeout(() => setIsScanning(true), 0);
    const service = new window.google.maps.places.PlacesService(mapInstance);
    const request: google.maps.places.PlaceSearchRequest = {
      location: center,
      radius: 5000, 
      type: 'park'
    };

    service.nearbySearch(request, (results, status) => {
      setIsScanning(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setPlacesParks(results.slice(0, 10)); // keep top 10

        // Add markers for Places API parks
        results.slice(0, 10).forEach(park => {
          if (park.geometry?.location) {
            const markerDiv = document.createElement('div');
            markerDiv.className = 'park-marker-icon';
            markerDiv.innerHTML = '🌲';

            const parkMarker = new window.google.maps.marker.AdvancedMarkerElement({
              map: mapInstance,
              position: park.geometry.location,
              title: park.name || "Park",
              content: markerDiv
            });

            parkMarker.addListener('gmp-click', () => {
              setSelectedPark(park);
            });

            markersRef.current.push(parkMarker);
          }
        });
      }
    });

  // Only run on initial load (locationReady flips once)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInstance, locationReady]);
  // Note: center is intentionally included but guarded by hasFetchedParks
  // to only run the fetch once per map session, not on every pan.

  // Load heatmap data if enabled
  useEffect(() => {
    if (!mapInstance || !window.google?.maps?.visualization || !isFeatureEnabled('ENABLE_HEATMAP')) return;

    getAllRegisteredParks().then(parks => {
      const data = parks
        .filter(p => p.integrity < 100)
        .map(p => ({
           location: new window.google.maps.LatLng(p.location.lat, p.location.lng),
           weight: Math.max(0.1, (100 - p.integrity) / 10) // Scale weight for visualization
        }));
      setHeatmapData(data);
    }).catch(err => console.error("Error loading heatmap data", err));
  }, [mapInstance, reports]); // Reload if new reports are added

  // Secondary effect to render custom markers whenever `customParks` updates
  useEffect(() => {
    if (!mapInstance || !window.google?.maps?.marker?.AdvancedMarkerElement || customParks.length === 0) return;

    customParks.forEach(park => {
      const markerDiv = document.createElement('div');
      markerDiv.className = 'park-marker-icon custom-park-marker border-accent-orange';
      markerDiv.innerHTML = '🚩'; // Different icon for custom registered parks
      
      const pPosition = park.location;

      const customMarker = new window.google.maps.marker.AdvancedMarkerElement({
        map: mapInstance,
        position: pPosition,
        title: park.name || "Custom Territory",
        content: markerDiv
      });

      customMarker.addListener('gmp-click', () => {
        // Map it to a structure similar to PlaceResult so the profile panel doesn't crash
        setSelectedPark({
           ...park,
           place_id: park.id,
           name: park.name,
           geometry: {
             location: {
               lat: () => pPosition.lat,
               lng: () => pPosition.lng
             } as unknown as google.maps.LatLng
           } as google.maps.places.PlaceGeometry
        });
      });

      markersRef.current.push(customMarker);
    });

  }, [customParks, mapInstance]);

  // Effect to render squad member avatars on their last check-ins
  useEffect(() => {
    if (!mapInstance || !window.google?.maps?.marker?.AdvancedMarkerElement || squadMembers.length === 0) return;

    squadMembers.forEach(member => {
      if (!member.lastCheckIn) return;

      const markerDiv = document.createElement('div');
      markerDiv.className = 'park-marker-icon shadow-lg bg-surface flex items-center justify-center p-1 rounded-full border-2 border-accent-purple';
      markerDiv.innerHTML = `<span style="font-size: 1.25rem; line-height: 1;">${member.avatar}</span>`;
      
      const pPosition = { lat: member.lastCheckIn.lat, lng: member.lastCheckIn.lng };

      const userMarker = new window.google.maps.marker.AdvancedMarkerElement({
        map: mapInstance,
        position: pPosition,
        title: `${member.name} - Last spotted at ${member.lastCheckIn.parkName}`,
        content: markerDiv
      });

      // Optional: Add click listener to open their profile modal
      // We don't have a direct setSelectedMember state here, but we could trigger a custom event
      // or set a selectedSquadMember state to render UserProfileModal. For now, it's just a pin!

      markersRef.current.push(userMarker);
    });

  }, [squadMembers, mapInstance]);

  const searchParksAtCenter = useCallback((searchCenter: {lat: number; lng: number}) => {
    if (!mapInstance || !window.google?.maps?.places) return;

    setIsScanning(true);
    const service = new window.google.maps.places.PlacesService(mapInstance);
    const request: google.maps.places.PlaceSearchRequest = {
      location: searchCenter,
      radius: 5000,
      type: 'park'
    };

    service.nearbySearch(request, (results, status) => {
      setIsScanning(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const newParks = results.filter(p => p.place_id && !seenParkIds.current.has(p.place_id));
        
        // Cache the IDs
        newParks.forEach(p => { if (p.place_id) seenParkIds.current.add(p.place_id); });

        // Accumulate parks — viewport bounds filter handles sidebar display
        if (newParks.length > 0) {
          setPlacesParks(prev => [...prev, ...newParks]);

          // Add markers for new parks only
          newParks.forEach(park => {
            if (park.geometry?.location) {
              const markerDiv = document.createElement('div');
              markerDiv.className = 'park-marker-icon';
              markerDiv.innerHTML = '🌲';

              const parkMarker = new window.google.maps.marker.AdvancedMarkerElement({
                map: mapInstance,
                position: park.geometry.location,
                title: park.name || "Park",
                content: markerDiv
              });

              parkMarker.addListener('gmp-click', () => {
                setSelectedPark(park);
              });

              markersRef.current.push(parkMarker);
            }
          });
        }
      }
    });
  }, [mapInstance]);

  const handleMapIdle = useCallback(() => {
    if (!mapInstance) return;
    // Update bounds for sidebar filtering
    const bounds = mapInstance.getBounds();
    if (bounds) setMapBounds(bounds);
    // Debounce: wait 800ms after the user stops panning/zooming
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      const newCenter = mapInstance.getCenter();
      if (newCenter) {
        searchParksAtCenter({ lat: newCenter.lat(), lng: newCenter.lng() });
      }
    }, 800);
  }, [mapInstance, searchParksAtCenter]);

  const onUnmount = useCallback(function callback() {
    // Cleanup if needed
    setMapInstance(null);
  }, []);

  if (loadError) {
    return (
      <div className="map-page animate-fade-in flex items-center justify-center text-accent-red">
         Error loading maps: {loadError.message}
      </div>
    );
  }

  return (
    <div className="map-page animate-fade-in">
      <SpotlightTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      <TourTriggerButton onClick={() => setIsTourOpen(true)} />
      <div className="map-view-container">
        {!isLoaded ? (
          <div className="map-placeholder glass-panel text-center p-8">
            <p className="text-accent-green mb-2">Initializing Local Territory...</p>
            <p className="text-sm text-text-muted">Loading satellite arrays and civic databases</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onIdle={handleMapIdle}
            options={mapOptions}
          >
            {isFeatureEnabled('ENABLE_HEATMAP') && heatmapData.length > 0 && (
              <HeatmapLayer 
                data={heatmapData} 
                options={{ 
                  radius: 50, 
                  opacity: 0.8,
                  gradient: [
                    'rgba(0, 255, 255, 0)',
                    'rgba(0, 255, 255, 1)',
                    'rgba(0, 191, 255, 1)',
                    'rgba(0, 127, 255, 1)',
                    'rgba(0, 63, 255, 1)',
                    'rgba(0, 0, 255, 1)',
                    'rgba(0, 0, 223, 1)',
                    'rgba(0, 0, 191, 1)',
                    'rgba(0, 0, 159, 1)',
                    'rgba(0, 0, 127, 1)',
                    'rgba(63, 0, 91, 1)',
                    'rgba(127, 0, 63, 1)',
                    'rgba(191, 0, 31, 1)',
                    'rgba(255, 0, 0, 1)' // Red for highest danger/dirtiness
                  ]
                }} 
              />
            )}
          </GoogleMap>
        )}
      </div>
      
      <div className="map-sidebar glass-panel" data-tour="sidebar-territory">
        <div className="sidebar-header">
          <h2>Local Territory</h2>
          <span className="status-badge">{isScanning ? 'Scanning...' : 'Active'}</span>
        </div>
        
        <div className="park-list" data-tour="park-list">
           {locationError && (
             <div className="text-xs text-accent-red mb-2 p-2 border border-accent-red rounded bg-red-900/10">
               {locationError}
             </div>
           )}
           {reports.map((report, idx) => (
             <div key={idx} className="park-card">
                <h4>New Hazard Report</h4>
                <div className="health-bar">
                  <div className={`health-fill ${report.severity === 'Safe' ? '' : 'bg-accent-orange'}`} style={{ width: report.severity === 'Safe' ? '90%' : '30%' }}></div>
                </div>
                <p className={`health-text ${report.severity === 'Safe' ? '' : 'text-accent-orange'}`}>
                  {report.severity}
                </p>
                <p className="text-xs text-text-muted mt-2">{report.summary}</p>
             </div>
           ))}

           <div className="section-title mt-6 mb-2 text-sm text-text-secondary uppercase tracking-widest">
             Local Network
           </div>

           {isFeatureEnabled('ENABLE_SQUADS') && (
             <div className="squad-section mb-6">
               <div className="park-card border-l-2 border-accent-purple bg-accent-purple/5">
                  <h4 className="flex items-center gap-2 text-accent-purple">👑 Green Guardians</h4>
                  <div className="health-bar">
                    <div className="health-fill bg-accent-purple" style={{ width: '75%' }}></div>
                  </div>
                  <p className="health-text text-text-muted text-xs mt-1">Squad Rank: #3 in Territory</p>
                   <button 
                     className="btn btn-secondary w-full py-1.5 mt-3 text-xs border-accent-purple/30 text-accent-purple hover:bg-accent-purple/10"
                     onClick={() => setIsSquadModalOpen(true)}
                   >Manage Squad</button>
               </div>
             </div>
           )}
           
           <div className="mb-4 bg-white/5 p-3 rounded-lg border border-border-light">
             <p className="text-xs text-text-muted mb-2">
               Pan the map to an undocumented territory, then click below to record it.
             </p>
             <button 
               className="btn btn-secondary w-full py-2 text-sm flex items-center justify-center gap-2 border-dashed"
               onClick={() => {
                 if (mapInstance && mapInstance.getCenter()) {
                   const c = mapInstance.getCenter()!;
                   setAddingParkLocation({ lat: c.lat(), lng: c.lng() });
                 } else {
                   setAddingParkLocation(center);
                 }
               }}
             >
               <Plus size={16} /> Register New Territory
             </button>
           </div>

           {(placesParks.length === 0 && customParks.length === 0) && <p className="text-sm text-text-muted">Scanning radar for local parks...</p>}

           {/* Render Custom Parks First */}
           {customParks.map((park) => (
             <div 
               key={park.id} 
               className="park-card cursor-pointer hover:bg-white/5 transition-colors border-l-2 border-accent-orange"
               onClick={() => setSelectedPark({ place_id: park.id, name: park.name })}
             >
                <h4 className="flex items-center gap-2">🚩 {park.name}</h4>
                <div className="health-bar">
                  <div className="health-fill bg-text-muted" style={{ width: '100%' }}></div>
                </div>
                <p className="health-text text-text-muted text-xs">Custom Territory Registered</p>
             </div>
           ))}

           {/* Render Places API Parks — filtered to current viewport */}
           {placesParks
             .filter(park => {
               if (!mapBounds || !park.geometry?.location) return true;
               return mapBounds.contains(park.geometry.location);
             })
             .map((park, idx) => (
              <div 
                key={park.place_id || idx} 
                className="park-card cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setSelectedPark(park)}
              >
                 <h4>🌲 {park.name}</h4>
                 <div className="health-bar">
                   <div className="health-fill bg-text-muted" style={{ width: '100%' }}></div>
                 </div>
                 <p className="health-text text-text-muted text-xs">Status: Checking Database...</p>
              </div>
            ))}
        </div>

        <div className="mt-auto p-4 border-t border-border-light" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              onClick={() => setIsScannerOpen(true)}
              data-tour="scan-hazard-btn"
            >
              <Camera size={18} />
              Report Hazard
            </button>
            <button 
              className="btn flex-1 flex items-center justify-center gap-2 py-3 bg-accent-green/10 text-accent-green border border-accent-green/30 hover:bg-accent-green/20"
              onClick={() => setIsCleanupScannerOpen(true)}
              data-tour="scan-cleanup-btn"
            >
              <CheckCircle size={18} />
              Verify Cleanup
            </button>
          </div>
          <p className="text-xs text-text-muted text-center" style={{ marginTop: '0.25rem' }}>
            Tap a park above to view its profile & organize a rally
          </p>
        </div>
      </div>

      {isScannerOpen && (
        <DriftScanner 
          onClose={() => setIsScannerOpen(false)}
          onReportSubmitted={async (analysis, file) => {
            setReports(prev => [analysis, ...prev]);
            
            const targetPark = selectedPark || (placesParks.length > 0 ? placesParks[0] : (customParks.length > 0 ? customParks[0] : null));
            if (!targetPark) {
              alert("No nearby park detected to attach this report to.");
              return;
            }

            const isPlaceResult = 'place_id' in targetPark;
            const pResult = targetPark as google.maps.places.PlaceResult;
            const pProfile = targetPark as ParkProfile;
            
            const parkId = (isPlaceResult ? pResult.place_id : pProfile.id) || 'unknown';
            const parkName = targetPark.name || 'Unknown Park';
            const location = isPlaceResult && pResult.geometry?.location
              ? { lat: pResult.geometry.location.lat(), lng: pResult.geometry.location.lng() }
              : pProfile.location || center;

            try {
              await submitHazardReport(parkId, parkName, location, file, analysis);
              console.log("Hazard saved to Firestore successfully.");
            } catch (err) {
              console.error("Failed to save hazard report: ", err);
              alert("Failed to save report to database.");
            }
          }}
        />
      )}

      {selectedPark && !isScannerOpen && !isCleanupScannerOpen && !addingParkLocation && (
        <ParkProfilePanel
          park={selectedPark}
          onClose={() => setSelectedPark(null)}
          onReportHazard={() => setIsScannerOpen(true)}
          onReportCleanup={() => setIsCleanupScannerOpen(true)}
        />
      )}

      {addingParkLocation && (
        <AddParkModal 
          location={addingParkLocation}
          onClose={() => setAddingParkLocation(null)}
          onParkAdded={(newPark) => {
             setCustomParks(prev => [...prev, newPark]);
             setAddingParkLocation(null);
          }}
        />
      )}
      {isCleanupScannerOpen && (
        <CleanupScanner 
          onClose={() => setIsCleanupScannerOpen(false)}
          onVerificationSubmitted={async (analysis, file) => {
            const targetPark = selectedPark || (placesParks.length > 0 ? placesParks[0] : (customParks.length > 0 ? customParks[0] : null));
            if (!targetPark) {
              alert("No nearby park detected to attach this verification to.");
              return;
            }

            const isPlaceResult = 'place_id' in targetPark;
            const pResult = targetPark as google.maps.places.PlaceResult;
            const pProfile = targetPark as ParkProfile;
            
            const parkId = (isPlaceResult ? pResult.place_id : pProfile.id) || 'unknown';
            const parkName = targetPark.name || 'Unknown Park';
            const location = isPlaceResult && pResult.geometry?.location
              ? { lat: pResult.geometry.location.lat(), lng: pResult.geometry.location.lng() }
              : pProfile.location || center;

            try {
              await submitCleanupVerification(parkId, parkName, location, file, analysis);
              console.log("Cleanup verified and saved to Firestore successfully.");
              alert(`Awesome work! Based on AI verification, ${parkName} has regained ${analysis.isClean ? 15 : 0} Integrity Points!`);
            } catch (err) {
              console.error("Failed to save cleanup verification: ", err);
              alert("Failed to save report to database.");
            }
          }}
        />
      )}

      {isSquadModalOpen && (
        <ManageSquadModal onClose={() => setIsSquadModalOpen(false)} />
      )}
    </div>
  );
}
