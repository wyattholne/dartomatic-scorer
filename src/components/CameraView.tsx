import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface CameraViewProps {
  deviceId?: string;
  onStream?: (stream: MediaStream) => void;
  className?: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

export const CameraView = ({ deviceId, onStream, className, videoRef: externalVideoRef }: CameraViewProps) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const videoRef = externalVideoRef || internalVideoRef;
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);
  const initializingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 7; // Maintain high retries for reliability

    const initCamera = async () => {
      if (!deviceId || initializingRef.current) {
        return;
      }

      initializingRef.current = true;

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia is not supported');
        }

        // Stop any existing stream first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 1280, max: 1280 },  // Enforce 720p (1280x720) for OV9732
            height: { ideal: 720, max: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false
        };

        console.log(`Requesting camera with constraints for deviceId in Camera Setup: ${deviceId}`, constraints);

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          
          await new Promise<void>((resolve, reject) => {
            if (!videoRef.current) return reject(new Error('Video element not available'));
            videoRef.current.onloadedmetadata = () => resolve();
            videoRef.current.onerror = (e) => reject(e);
          });

          await videoRef.current.play();
          
          if (mounted) {
            setIsInitializing(false);
            setHasError(false);
            retryCount = 0;
            onStream?.(stream);
            toast({
              title: "Camera Connected",
              description: `Successfully connected to camera ${deviceId} in Camera Setup`,
            });
          }
        }
      } catch (error) {
        console.error("Error accessing camera in Camera Setup for deviceId:", deviceId, error);
        if (mounted) {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying camera initialization for device ${deviceId} (${retryCount}/${MAX_RETRIES})...`);
            retryTimeout = setTimeout(initCamera, 3000); // Maintain 3-second delay
          } else {
            setHasError(true);
            setIsInitializing(false);
            toast({
              title: "Camera Error",
              description: `Failed to initialize camera ${deviceId} after ${MAX_RETRIES} attempts: ${error.message || 'Unknown error'}`,
              variant: "destructive",
            });
          }
        }
      } finally {
        initializingRef.current = false;
      }
    };

    setTimeout(initCamera, 2500); // Maintain 2.5-second initial delay for reliability

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [deviceId, onStream, toast, videoRef]);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-red-50 ${className}`}>
        <p className="text-red-600 text-sm">Failed to initialize camera for device {deviceId}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={className}
      />
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <p className="text-white">Initializing camera for device {deviceId} in Camera Setup...</p>
        </div>
      )}
    </div>
  );
};