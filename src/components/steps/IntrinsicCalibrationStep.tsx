import { CalibrationStep } from "@/components/CalibrationStep";
import IntrinsicCalibration from "@/components/IntrinsicCalibration";
import { RefObject, useEffect } from "react";
import { useCameras } from "@/hooks/useCameras";

interface IntrinsicCalibrationStepProps {
  videoRefs: RefObject<HTMLVideoElement>[];
  canvasRef: RefObject<HTMLCanvasElement>;
  cameraDevices: MediaDeviceInfo[];
  handleCameraSwitch: (index: number) => void;
  currentCamera: number;
  captureCounts: number[]; // Per-camera capture counts
  onCapture: (cameraIndex: number) => void; // Updated to accept cameraIndex
  isCapturing: boolean;
}

export const IntrinsicCalibrationStep = ({
  videoRefs,
  canvasRef,
  cameraDevices,
  handleCameraSwitch,
  currentCamera,
  captureCounts,
  onCapture,
  isCapturing,
}: IntrinsicCalibrationStepProps) => {
  const { refreshCameras } = useCameras();

  // Fallback to refresh cameras if none detected, with proper error handling
  useEffect(() => {
    if (cameraDevices.length === 0) {
      console.warn("No cameras detected in Intrinsic Calibration, attempting refresh");
      const timer = setTimeout(async () => {
        try {
          await refreshCameras();
          console.log("Camera refresh attempted in Intrinsic Calibration");
        } catch (error) {
          console.error("Failed to refresh cameras:", error);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cameraDevices, refreshCameras]);

  return (
    <CalibrationStep
      title="Intrinsic Calibration"
      description="Calibrate each camera individually using the checkerboard pattern."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <IntrinsicCalibration
            key={index}
            videoRefs={videoRefs}
            canvasRef={canvasRef}
            cameraDevices={cameraDevices}
            handleCameraSwitch={handleCameraSwitch}
            cameraIndex={index}
            captureCount={captureCounts[index]} // Use per-camera count
            onCapture={() => onCapture(index)} // Pass the specific camera index
          />
        ))}
      </div>
      {cameraDevices.length === 0 && (
        <div className="text-center p-4 text-muted-foreground">
          No cameras detected. Please connect cameras and ensure permissions are granted. Attempting to refresh...
        </div>
      )}
    </CalibrationStep>
  );
};