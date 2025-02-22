import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw } from "lucide-react";
import { calibrationService } from "@/services/CalibrationService";
import { toast } from "@/components/ui/use-toast";
import { CameraView } from "@/components/CameraView"; // Verify this path is correct
import { ExtrinsicCalibrationProgress, CalibrationStatus } from "./ExtrinsicCalibrationProgress";

interface ExtrinsicCalibrationProps {
  videoRefs: React.RefObject<HTMLVideoElement>[];
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraDevices: MediaDeviceInfo[];
  initializeCameras: () => Promise<void>;
}

const ExtrinsicCalibration: React.FC<ExtrinsicCalibrationProps> = ({
  videoRefs,
  canvasRef,
  cameraDevices,
  initializeCameras
}) => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState<{
    status: CalibrationStatus;
    progress: number;
    message: string;
  }>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const selectedCameras = [0, 1, 2]; // Ensure all cameras (1, 2, 3) are included

  const captureImage = useCallback(async () => {
    try {
      setIsCalibrating(true);
      setCalibrationProgress({
        status: 'detecting',
        progress: 0,
        message: 'Detecting markers across all cameras...',
      });

      const detectionPromises = selectedCameras.map(async (cameraIndex) => {
        const video = videoRefs[cameraIndex]?.current;
        if (!video) throw new Error(`Camera ${cameraIndex + 1} not available`);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return await calibrationService.detectMarkers(imageData, cameraIndex); // Use updated detectMarkers
      });

      const results = await Promise.all(detectionPromises);
      
      if (results.every(result => result.success && result.detected)) {
        setCalibrationProgress({
          status: 'calibrating',
          progress: 50,
          message: 'Starting calibration for all cameras...',
        });

        await calibrationService.startCalibration(selectedCameras); // Use updated startCalibration
        setCalibrationProgress({
          status: 'complete',
          progress: 100,
          message: 'Extrinsic calibration completed successfully for all cameras',
        });
        
        toast({
          title: "Success",
          description: "Markers detected and extrinsic calibration completed for all cameras",
        });
      } else {
        throw new Error("Failed to detect markers in all camera views");
      }
    } catch (error) {
      console.error('Error capturing image for extrinsic calibration:', error);
      setCalibrationProgress({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Failed to capture image for calibration',
      });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to capture image for calibration",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        if (calibrationProgress.status !== 'error') {
          setIsCalibrating(false);
        }
      }, 2000);
    }
  }, [videoRefs, calibrationProgress.status, selectedCameras]);

  const handleRefresh = useCallback(async () => {
    try {
      await initializeCameras();
      toast({
        title: "Success",
        description: "Camera feeds refreshed successfully in Extrinsic Calibration",
      });
    } catch (error) {
      console.error('Error refreshing camera feeds in Extrinsic Calibration:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh camera feeds in Extrinsic Calibration",
        variant: "destructive",
      });
    }
  }, [initializeCameras]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-medium text-neutral-800">
          Step 3: Extrinsic Calibration
        </h2>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="flex items-center gap-2"
          disabled={isCalibrating}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Feeds
        </Button>
      </div>
      <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-700 mb-4">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-3 text-neutral-600">
          <li>Position the ArUco markers so they're visible to all cameras</li>
          <li>Ensure good lighting and minimal reflections</li>
          <li>Press 'Capture Frame' to detect markers from all cameras</li>
          <li>Calibration will begin automatically when markers are detected</li>
        </ol>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {selectedCameras.map((cameraIndex, index) => (
          <div key={index} className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <CameraView
              deviceId={cameraDevices[cameraIndex]?.deviceId}
              videoRef={videoRefs[cameraIndex]}
              onStream={(stream) => {
                console.log(`Stream initialized for Camera ${cameraIndex + 1} with deviceId: ${cameraDevices[cameraIndex]?.deviceId} in Extrinsic Calibration`);
              }}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              Camera {cameraIndex + 1}
            </div>
          </div>
        ))}
      </div>
      <ExtrinsicCalibrationProgress 
        calibrationProgress={calibrationProgress}
        isCalibrating={isCalibrating}
      />
      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="bg-white hover:bg-gray-100"
          disabled={isCalibrating}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Cameras
        </Button>
        <Button
          onClick={captureImage}
          className="bg-blue-500 hover:bg-blue-600 text-white"
          disabled={isCalibrating || cameraDevices.length < 3}
        >
          <Camera className="mr-2 h-4 w-4" />
          {isCalibrating ? 'Capturing...' : 'Capture Frame'}
        </Button>
      </div>
    </motion.div>
  );
};

export default ExtrinsicCalibration;