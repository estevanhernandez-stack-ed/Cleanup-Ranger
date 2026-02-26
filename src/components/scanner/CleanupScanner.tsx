import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { verifyParkCleanup, analyzeFraud, type CleanupAnalysis, type FraudAnalysis } from '../../lib/gemini';
import exifr from 'exifr';
import './DriftScanner.css';

interface CleanupScannerProps {
  onClose: () => void;
  onVerificationSubmitted: (analysis: CleanupAnalysis, file: File) => void;
}

export function CleanupScanner({ onClose, onVerificationSubmitted }: CleanupScannerProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [analysis, setAnalysis] = useState<CleanupAnalysis | null>(null);
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
            const file = new File([blob], `cleanup-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
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

  const handleVerify = async () => {
    if (!selectedImage) return;

    setIsVerifying(true);
    setError(null);

    try {
      const [exifResult, fraudResult, cleanupResult] = await Promise.all([
        exifr.parse(selectedImage).catch(() => null),
        analyzeFraud(selectedImage),
        verifyParkCleanup(selectedImage)
      ]);
      setExifData(exifResult);
      setFraudAnalysis(fraudResult);
      setAnalysis(cleanupResult);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to verify cleanup.';
      setError(errorMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = () => {
    if (analysis && selectedImage) {
      onVerificationSubmitted(analysis, selectedImage);
      onClose();
    }
  };

  return (
    <div className="scanner-overlay animate-fade-in">
      <div className="scanner-modal glass-panel">
        <div className="scanner-header flex items-center justify-between">
          <h3 className="flex items-center gap-3">
            <CheckCircle className="text-accent-green" /> 
            Verify Cleanup
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

          {isVerifying && (
            <div className="analyzing-state mt-6 text-center">
              <div className="radar-spinner mx-auto mb-4"></div>
              <p className="text-accent-green font-semibold animate-pulse">Gemini AI is analyzing proof...</p>
            </div>
          )}

          {fraudAnalysis && !isVerifying && (
            <div className={`mt-6 p-3 rounded-md border ${fraudAnalysis.isAuthentic ? 'bg-accent-green/10 border-accent-green/30' : 'bg-red-900/20 border-accent-red/50'}`}>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${fraudAnalysis.isAuthentic ? 'text-accent-green' : 'text-accent-red'}`}>
                {fraudAnalysis.isAuthentic ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                Anti-Fraud Guardrails
              </h4>
              <p className="text-xs text-text-secondary mt-1">
                {fraudAnalysis.isAuthentic 
                  ? 'Image passed AI authenticity checks.' 
                  : `Flagged: ${fraudAnalysis.fraudReason || 'Unknown reason'}`}
              </p>
              {exifData?.latitude && exifData?.longitude ? (
                <p className="text-xs text-accent-orange mt-1 border-t border-white/10 pt-1 flex items-center gap-1">
                  📍 Verified EXIF GPS Data
                </p>
              ) : null}
            </div>
          )}

          {analysis && !isVerifying && (
            <div className="analysis-results mt-4 animate-fade-in">
              <div className={`severity-badge ${analysis.isClean ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-orange/20 text-accent-orange'} p-3 rounded text-center font-bold mb-4`}>
                {analysis.isClean ? 'Cleanup Verified!' : 'Cleanup Incomplete / Hazards Remain'}
                <div className="text-xs font-normal mt-1 opacity-80">{analysis.confidence}% AI Confidence</div>
              </div>
              
              <div className="result-details mt-4">
                <p className="text-sm font-semibold text-text-secondary">AI Observation</p>
                <p className="mb-4">{analysis.summary}</p>

                {analysis.hypeMessage && (
                  <div className="mt-4 p-3 bg-accent-green/10 border border-accent-green/30 rounded-md">
                    <p className="text-sm font-bold text-accent-green flex items-center gap-2">
                       ⭐ Ranger Says: 
                    </p>
                    <p className="text-sm italic text-text-primary mt-1">"{analysis.hypeMessage}"</p>
                  </div>
                )}
              </div>

              <div className="action-buttons mt-6 flex gap-4">
                {analysis.isClean ? (
                  <button 
                    className={`btn flex-1 ${fraudAnalysis?.isAuthentic === false ? 'bg-border-light text-text-muted cursor-not-allowed' : 'btn-primary'}`} 
                    onClick={handleSubmit}
                    disabled={fraudAnalysis?.isAuthentic === false}
                  >
                    {fraudAnalysis?.isAuthentic === false ? 'Submission Blocked' : 'Claim Community Points'}
                  </button>
                ) : (
                  <button className="btn btn-secondary flex-1" onClick={() => {
                      setSelectedImage(null);
                      setPreviewUrl(null);
                      setAnalysis(null);
                  }}>
                    Try Again Later
                  </button>
                )}
              </div>
            </div>
          )}

          {previewUrl && !analysis && !isVerifying && (
             <button className="btn btn-primary w-full mt-6 flex justify-center items-center gap-2" onClick={handleVerify}>
               <Camera size={18} /> Run Verification
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
