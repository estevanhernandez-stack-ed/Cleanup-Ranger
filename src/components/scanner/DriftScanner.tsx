import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { analyzeParkHazard, analyzeFraud, type HazardAnalysis, type FraudAnalysis } from '../../lib/gemini';
import exifr from 'exifr';
import './DriftScanner.css';

interface DriftScannerProps {
  onClose: () => void;
  onReportSubmitted: (analysis: HazardAnalysis, file: File) => void;
}

export function DriftScanner({ onClose, onReportSubmitted }: DriftScannerProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<HazardAnalysis | null>(null);
  const [fraudAnalysis, setFraudAnalysis] = useState<FraudAnalysis | null>(null);
  const [exifData, setExifData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showCamera, setShowCamera] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Ensure camera stops when modal closes
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setShowCamera(true);
      // Wait for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err: unknown) {
      console.error("Camera error:", err);
      setError("Camera permission denied or camera not available. Please use the upload option.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas to match actual video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `hazard-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setShowCamera(false);
            stopCamera();
            setAnalysis(null);
            setFraudAnalysis(null);
            setExifData(null);
            setError(null);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      setAnalysis(null);
      setFraudAnalysis(null);
      setExifData(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const [exifResult, fraudResult, hazardResult] = await Promise.all([
        exifr.parse(selectedImage).catch(() => null),
        analyzeFraud(selectedImage),
        analyzeParkHazard(selectedImage)
      ]);
      setExifData(exifResult);
      setFraudAnalysis(fraudResult);
      setAnalysis(hazardResult);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze drift.';
      setError(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (analysis && selectedImage) {
      onReportSubmitted(analysis, selectedImage);
      onClose();
    }
  };

  return (
    <div className="scanner-overlay animate-fade-in">
      <div className="scanner-modal glass-panel">
        <div className="scanner-header flex items-center">
          <h3 className="flex items-center gap-3">
            <Camera className="text-accent-green" /> 
            Report Local Hazard
          </h3>
          <button onClick={onClose} className="btn-close"><X /></button>
        </div>

        <div className="scanner-body">
          {!previewUrl && !showCamera ? (
            <div className="flex flex-col gap-4">
              <div 
                className="upload-area cursor-pointer border-2 border-dashed border-accent-green/30 rounded-xl p-8 text-center transition-all hover:bg-white/5"
                onClick={startCamera}
              >
                <Camera size={48} className="text-accent-green mb-4 mx-auto" />
                <p className="font-bold">Take a Photo</p>
                <p className="text-sm text-muted mt-2">Use your device camera</p>
              </div>
              <div 
                className="upload-area cursor-pointer border-2 border-dashed border-white/10 rounded-xl p-6 text-center transition-all hover:bg-white/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} className="text-muted mb-2 mx-auto" />
                <p>Upload Photo Evidence</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden-input" 
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handleImageSelect}
                />
              </div>
            </div>
          ) : showCamera ? (
            <div className="camera-container relative rounded-xl overflow-hidden bg-black">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-auto max-h-[60vh] object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                <button 
                  className="btn bg-white/20 text-white backdrop-blur-md px-6 py-3 rounded-full font-bold shadow-lg flex-1"
                  onClick={() => {
                    stopCamera();
                    setShowCamera(false);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn bg-accent-green text-black px-6 py-3 rounded-full font-bold shadow-lg flex-1 flex items-center justify-center gap-2"
                  onClick={capturePhoto}
                >
                  <Camera size={20} /> Capture
                </button>
              </div>
            </div>
          ) : (
            <div className="preview-container">
              <img src={previewUrl!} alt="Evidence" className="evidence-preview" />
              <div className="flex gap-2">
                <button 
                  className="btn btn-secondary mt-4 flex-1"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                    setAnalysis(null);
                    startCamera();
                  }}
                >
                  Retake Photo
                </button>
                <button 
                  className="btn bg-white/10 text-white mt-4 flex-1"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                    setAnalysis(null);
                    fileInputRef.current?.click();
                  }}
                >
                  Upload New
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-box mt-6 flex items-center gap-3">
              <AlertTriangle className="text-accent-red" />
              <p>{error}</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="analyzing-state mt-6 text-center">
              <div className="radar-spinner mx-auto mb-4"></div>
              <p className="text-accent-green font-semibold animate-pulse">Gemini AI is analyzing evidence...</p>
            </div>
          )}

          {fraudAnalysis && !isAnalyzing && (
            <div className={`mt-6 p-3 rounded-md border ${fraudAnalysis.isAuthentic ? 'bg-accent-green/10 border-accent-green/30' : 'bg-red-900/20 border-accent-red/50'}`}>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${fraudAnalysis.isAuthentic ? 'text-accent-green' : 'text-accent-red'}`}>
                {fraudAnalysis.isAuthentic ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                Anti-Fraud Guardrails
              </h4>
              <p className="text-xs text-text-secondary mt-1">
                {fraudAnalysis.isAuthentic 
                  ? 'Image passed AI authenticity checks.' 
                  : `Flagged: ${fraudAnalysis.fraudReason || 'Unknown Reason'}`}
              </p>
              {exifData?.latitude && exifData?.longitude ? (
                <p className="text-xs text-accent-orange mt-1 border-t border-white/10 pt-1 flex items-center gap-1">
                  📍 Verified EXIF GPS Data
                </p>
              ) : null}
            </div>
          )}

          {analysis && !isAnalyzing && (
            <div className="analysis-results mt-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className={`severity-badge severity-${analysis.severity.replace(/[^a-zA-Z]/g, '').toLowerCase()}`}>
                  {analysis.severity === 'Safe' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  {analysis.severity}
                </div>
                {analysis.severity === 'Hazardous/Biohazard' && (
                  <div className="severity-badge bg-accent-purple/20 text-accent-purple font-bold border-accent-purple/50">
                    💰 +50 Pt Bounty
                  </div>
                )}
              </div>
              
              <div className="result-details mt-4">
                <p className="text-sm font-semibold text-text-secondary">AI Summary</p>
                <p className="mb-4">{analysis.summary}</p>

                <p className="text-sm font-semibold text-text-secondary">Recommended Action</p>
                <p className="mb-4">{analysis.recommendedAction}</p>

                {analysis.smartEquipmentManifest && analysis.smartEquipmentManifest.length > 0 && (
                  <>
                    <p className="text-sm font-semibold text-text-secondary mt-4">Smart Equipment Manifest</p>
                    <ul className="mb-4 list-disc list-inside text-sm text-text-primary border-l-2 border-accent-orange pl-3 ml-1 bg-white/5 py-2 rounded-r">
                      {analysis.smartEquipmentManifest.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}

                <div className="tags-container flex flex-wrap gap-2 mt-4">
                  {analysis.tags.map((tag: string) => (
                    <span key={tag} className="tag-pill text-xs">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="action-buttons mt-6 flex gap-4">
                <button 
                  className={`btn flex-1 ${fraudAnalysis?.isAuthentic === false ? 'bg-border-light text-text-muted cursor-not-allowed' : 'btn-primary'}`} 
                  onClick={handleSubmit}
                  disabled={fraudAnalysis?.isAuthentic === false}
                >
                  {fraudAnalysis?.isAuthentic === false ? 'Submission Blocked' : 'Confirm & Report Hazard'}
                </button>
              </div>
            </div>
          )}

          {previewUrl && !analysis && !isAnalyzing && (
             <button className="btn btn-primary w-full mt-6" onClick={handleAnalyze}>
               Run AI Analysis
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
