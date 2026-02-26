import { useState } from 'react';
import { Users, X, AlertTriangle, Calendar, Clock, Sparkles } from 'lucide-react';
import { createRally } from '../../lib/db';
import { type HazardAnalysis, generateMissionBriefing } from '../../lib/gemini';
import '../scanner/DriftScanner.css'; // Reusing modal styles

interface OrganizeRallyModalProps {
  parkId: string;
  parkName: string;
  hazard?: HazardAnalysis & { id?: string }; // Optional pre-filled hazard data
  onClose: () => void;
  onRallyCreated: () => void;
}

export function OrganizeRallyModal({ parkId, parkName, hazard, onClose, onRallyCreated }: OrganizeRallyModalProps) {
  const [title, setTitle] = useState(hazard ? `Cleanup: ${hazard.tags[0] || 'Hazard'}` : `Cleanup at ${parkName}`);
  const [description, setDescription] = useState(hazard ? `Join us to clean up the ${hazard.summary}` : '');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  // In a real app we'd use useAuth(), but for now we hardcode:
  const organizerName = 'Local Ranger';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateBriefing = async () => {
    setIsGenerating(true);
    try {
      const generatedBriefing = await generateMissionBriefing(
        parkName, 
        hazard?.summary, 
        hazard?.smartEquipmentManifest
      );
      setDescription(generatedBriefing);
    } catch (e) {
      console.error(e);
      // Fallback or ignore
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dateStr || !timeStr) {
      setError("Please fill out all rally details.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Combine date and time
      const dateTime = new Date(`${dateStr}T${timeStr}`);
      
      await createRally(
        parkId,
        parkName,
        title.trim(),
        description.trim(),
        dateTime,
        organizerName,
        hazard?.id,
        hazard?.smartEquipmentManifest
      );
      
      onRallyCreated();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to create rally", err);
      setError("Failed to organize this rally. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="scanner-overlay animate-fade-in z-50">
      <div className="scanner-modal glass-panel">
        <div className="scanner-header flex items-center justify-between border-b border-border-light pb-4 mb-4">
          <h3 className="flex items-center gap-3 text-accent-green">
            <Users className="text-accent-green" /> 
            Organize Rally
          </h3>
          <button onClick={onClose} className="btn-close"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="scanner-body">
          <p className="text-sm text-text-secondary mb-4">
            Calling all Rangers! Organize a community squad to assemble at <strong className="text-accent-green">{parkName}</strong>.
          </p>

          <div className="form-group mb-4">
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-2">Rally Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-bg-dark border border-border-light rounded-md p-3 text-text-primary focus:border-accent-green outline-none"
              required
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="form-group flex-1">
              <label className="block text-xs uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1"><Calendar size={12}/> Date</label>
              <input 
                type="date" 
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-bg-dark border border-border-light rounded-md p-3 text-text-primary focus:border-accent-green outline-none"
                required
              />
            </div>
            <div className="form-group flex-1">
              <label className="block text-xs uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1"><Clock size={12}/> Time</label>
              <input 
                type="time" 
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full bg-bg-dark border border-border-light rounded-md p-3 text-text-primary focus:border-accent-green outline-none"
                required
              />
            </div>
          </div>

          <div className="form-group mb-6 relative">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs uppercase tracking-wider text-text-muted">Mission Briefing</label>
              <button 
                type="button" 
                onClick={handleGenerateBriefing}
                disabled={isGenerating}
                className="text-xs flex items-center gap-1 text-accent-purple hover:text-purple-400 transition-colors bg-accent-purple/10 px-2 py-1 rounded"
              >
                {isGenerating ? <div className="w-3 h-3 rounded-full border border-purple-400 border-t-transparent animate-spin"></div> : <Sparkles size={12} />}
                Auto-draft with AI
              </button>
            </div>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-bg-dark border border-border-light rounded-md p-3 text-text-primary focus:border-accent-green outline-none min-h-[100px]"
              required
            />
          </div>

          {hazard?.smartEquipmentManifest && hazard.smartEquipmentManifest.length > 0 && (
            <div className="mb-6 p-3 bg-accent-orange/10 border border-accent-orange/30 rounded-md">
              <p className="text-xs uppercase tracking-wider text-accent-orange mb-2">Required Gear (Auto-Detected)</p>
              <ul className="text-sm list-disc pl-4 text-text-primary">
                {hazard.smartEquipmentManifest.map(tool => <li key={tool}>{tool}</li>)}
              </ul>
            </div>
          )}

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
               className="btn bg-accent-green hover:bg-green-600 text-white flex-1 py-3 border-none flex items-center justify-center gap-2"
               disabled={isSubmitting}
             >
               {isSubmitting ? 'Transmitting...' : 'Issue Call to Action'}
             </button>
           </div>
        </form>
      </div>
    </div>
  );
}
