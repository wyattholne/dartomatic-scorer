import React, { useState, useEffect, useRef } from "react"; // Ensure React is imported
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { CameraSetupStep } from "@/components/steps/CameraSetupStep";
import { IntrinsicCalibrationStep } from "@/components/steps/IntrinsicCalibrationStep";
import { NavigationButtons } from "@/components/steps/NavigationButtons";
import ExtrinsicCalibration from "@/components/ExtrinsicCalibration";
import { useCameras } from "@/hooks/useCameras";
import { CalibrationStep } from "@/components/CalibrationStep";

const STEPS = [
  "Camera Setup",
  "Intrinsic Calibration",
  "Extrinsic Calibration",
  "Board Registration",
  "Verification",
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentCamera, setCurrentCamera] = useState(0);
  const [captureCounts, setCaptureCounts] = useState<number[]>([0, 0, 0]); // Per-camera capture counts (Camera 0, 1, 2)
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRefs = [
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
  ];
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { cameraDevices, handleStreamCapture, refreshCameras } = useCameras(); // Added refreshCameras

  const handleCameraSwitch = (index: number) => {
    setCurrentCamera(index);
    // Reset capture count for the new camera only
    setCaptureCounts((prev) => {
      const newCounts = [...prev];
      newCounts[index] = 0;
      return newCounts;
    });
  };

  const handleCapture = (cameraIndex: number) => {
    setCaptureCounts((prev) => {
      const newCounts = [...prev];
      newCounts[cameraIndex] = Math.min(newCounts[cameraIndex] + 1, 15); // Cap at 15 per camera
      return newCounts;
    });
    setIsCapturing(false);
  };

  // Refresh cameras if none detected
  useEffect(() => {
    if (cameraDevices.length === 0) {
      console.warn("No cameras detected in wizard, attempting refresh");
      const timer = setTimeout(() => {
        refreshCameras();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cameraDevices, refreshCameras]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Camera Calibration Wizard
          </h1>
          <ProgressIndicator
            steps={STEPS}
            currentStep={currentStep}
            className="pt-4"
          />
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {currentStep === 0 && (
            <CameraSetupStep
              cameraDevices={cameraDevices}
              videoRefs={videoRefs}
              onStreamCapture={handleStreamCapture}
            />
          )}

          {currentStep === 1 && (
            <IntrinsicCalibrationStep
              videoRefs={videoRefs}
              canvasRef={canvasRef}
              cameraDevices={cameraDevices}
              handleCameraSwitch={handleCameraSwitch}
              currentCamera={currentCamera}
              captureCounts={captureCounts} // Pass per-camera counts
              onCapture={(cameraIndex: number) => handleCapture(cameraIndex)} // Pass cameraIndex explicitly
              isCapturing={isCapturing}
            />
          )}

          {currentStep === 2 && (
            <CalibrationStep
              title="Extrinsic Calibration"
              description="Calculate the relative positions of all cameras."
            >
              <ExtrinsicCalibration
                videoRefs={videoRefs}
                canvasRef={canvasRef}
                cameraDevices={cameraDevices}
              />
            </CalibrationStep>
          )}

          <NavigationButtons
            currentStep={currentStep}
            totalSteps={STEPS.length}
            onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
            onNext={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;