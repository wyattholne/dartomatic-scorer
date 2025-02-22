import { CameraView } from "@/components/CameraView"; // Verify this path is correct
import { CalibrationStep } from "@/components/CalibrationStep";
import { RefObject, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface CameraSetupStepProps {
  cameraDevices: MediaDeviceInfo[];
  videoRefs: RefObject<HTMLVideoElement>[];
  onStreamCapture: (deviceId: string, stream: MediaStream) => void;
}

export const CameraSetupStep = ({ cameraDevices, videoRefs, onStreamCapture }: CameraSetupStepProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (cameraDevices.length === 0) {
      toast({
        title: "Camera Error",
        description: "No cameras detected in Camera Setup. Please connect cameras, grant permissions, and refresh.",
        variant: "destructive",
      });
    }
  }, [cameraDevices, toast]);

  return (
    <CalibrationStep
      title="Camera Setup"
      description="Connect and position your cameras around the dartboard."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[0, 1, 2].map((index) => {
          const device = cameraDevices[index];
          return device ? (
            <div
              key={index}
              className="relative aspect-video overflow-hidden rounded-lg border bg-muted"
            >
              <CameraView
                deviceId={device.deviceId}
                onStream={(stream) => onStreamCapture(device.deviceId, stream)}
                className="h-full w-full object-cover"
                videoRef={videoRefs[index]}
              />
              <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                Camera {index + 1}
              </div>
            </div>
          ) : (
            <div
              key={index}
              className="relative aspect-video overflow-hidden rounded-lg border bg-muted flex items-center justify-center text-muted-foreground"
            >
              No Camera {index + 1}
            </div>
          );
        })}
      </div>
      {cameraDevices.length === 0 && (
        <div className="text-center p-4 text-muted-foreground">
          No cameras detected in Camera Setup. Please connect cameras and ensure permissions are granted.
        </div>
      )}
    </CalibrationStep>
  );
};