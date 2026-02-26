import { useState } from 'react';
import { MapPin, X, AlertTriangle } from 'lucide-react';
import { addCustomPark, type ParkProfile } from '../../lib/db';
import '../scanner/DriftScanner.css';

interface AddParkModalProps {
  location: { lat: number; lng: number };
  onClose: () => void;
  onParkAdded: (park: ParkProfile) => void;
}

export function AddParkModal({ location, onClose, onParkAdded }: AddParkModalProps) {
  const [parkName, setParkName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parkName.trim()) {
      setError("Please enter a name for this territory.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newPark = await addCustomPark(parkName.trim(), location);
      onParkAdded(newPark);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to add park", err);
      setError("Failed to register this location. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="scanner-overlay animate-fade-in">
      <div className="scanner-modal glass-panel">
        <div className="scanner-header flex items-center justify-between border-b border-border-light pb-4 mb-4">
          <h3 className="flex items-center gap-3">
            <MapPin className="text-accent-orange" /> 
            Register New Territory
          </h3>
          <button onClick={onClose} className="btn-close"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="scanner-body">
          <p className="text-sm text-text-secondary mb-4">
            You are registering a new community space at coordinates 
            <span className="text-xs text-text-muted block mt-1">
              [ {location.lat.toFixed(4)}, {location.lng.toFixed(4)} ]
            </span>
          </p>

          <div className="form-group mb-6">
            <label htmlFor="parkName" className="block text-xs uppercase tracking-wider text-text-muted mb-2">
              Territory Name
            </label>
            <input 
              id="parkName"
              type="text" 
              value={parkName}
              onChange={(e) => setParkName(e.target.value)}
              placeholder="e.g., Hidden Creek Greenbelt"
              className="w-full bg-bg-dark border border-border-light rounded-md p-3 text-text-primary focus:outline-none focus:border-accent-green transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="error-box mb-6 flex items-center gap-3 bg-red-900/10 border border-accent-red/20 p-3 rounded">
              <AlertTriangle className="text-accent-red flex-shrink-0" size={18} />
              <p className="text-sm text-accent-red m-0">{error}</p>
            </div>
          )}

           <div className="flex gap-4">
             <button 
               type="button" 
               className="btn btn-secondary flex-1 py-3" 
               onClick={onClose}
               disabled={isSubmitting}
             >
               Cancel
             </button>
             <button 
               type="submit" 
               className="btn bg-accent-orange hover:bg-orange-500 text-white flex-1 py-3 border-none flex items-center justify-center gap-2"
               disabled={isSubmitting}
             >
               {isSubmitting ? (
                 <>
                   <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                   Registering...
                 </>
               ) : (
                 'Establish Territory'
               )}
             </button>
           </div>
        </form>
      </div>
    </div>
  );
}
