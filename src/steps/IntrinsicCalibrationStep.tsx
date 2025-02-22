import { CalibrationStep } from "@/components/CalibrationStep";
import IntrinsicCalibration from "@/components/IntrinsicCalibration";
import { RefObject } from "react";

interface IntrinsicCalibrationStepProps {
  videoRefs: RefObject<HTMLVideoElement>[];
  canvasRef: RefObject<HTMLCanvasElement>;
  cameraDevices: MediaDeviceInfo[];
  handleCameraSwitch: (index: number) => void;
  currentCamera: number;
  captureCounts: number[]; // Per-camera capture counts
  onCapture: () => void;
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
            onCapture={() => onCapture()}
          />
        ))}
      </div>
      {cameraDevices.length === 0 && (
        <div className="text-center p-4 text-muted-foreground">
          No cameras detected. Please connect cameras and ensure permissions are granted.
        </div>
      )}
    </CalibrationStep>
  );
};