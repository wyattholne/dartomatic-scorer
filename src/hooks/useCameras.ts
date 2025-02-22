import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export const useCameras = () => {
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraStreams, setCameraStreams] = useState<{
    [key: string]: MediaStream;
  }>({});
  const { toast } = useToast();

  const getCameras = useCallback(async () => {
    try {
      // Request permission with specific constraints, retrying if needed
      let permission: MediaStream;
      let permissionAttempts = 0;
      const MAX_PERMISSION_ATTEMPTS = 5; // Increased retries for Step 1 reliability

      while (permissionAttempts < MAX_PERMISSION_ATTEMPTS) {
        try {
          permission = await navigator.mediaDevices.getUserMedia({ 
            video: {
              width: { ideal: 1280, max: 1280 },
              height: { ideal: 720, max: 720 },
              frameRate: { ideal: 30, max: 30 },
            },
            audio: false
          });
          permission.getTracks().forEach(track => track.stop());
          break;
        } catch (permissionError) {
          permissionAttempts++;
          console.warn(`Permission attempt ${permissionAttempts}/${MAX_PERMISSION_ATTEMPTS} failed in Camera Setup:`, permissionError);
          if (permissionAttempts === MAX_PERMISSION_ATTEMPTS) {
            throw permissionError;
          }
          await new Promise(resolve => setTimeout(resolve, 3000)); // Increased delay to 3 seconds for Step 1
        }
      }

      // Enumerate devices, even if permission check fails
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('Available cameras in Camera Setup:', videoDevices.map((device, index) => ({
        index,
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`
      })));
      
      if (videoDevices.length === 0) {
        throw new Error("No video input devices detected in Camera Setup");
      }

      setCameraDevices(videoDevices);
      toast({
        title: "Cameras Detected",
        description: `Found ${videoDevices.length} cameras in Camera Setup`,
      });
    } catch (error) {
      console.error('Error getting cameras in Camera Setup:', error);
      toast({
        title: "Camera Error",
        description: "Could not access cameras in Camera Setup. Please ensure camera permissions are granted, no other apps are using them, and hardware is connected. Attempting to refresh permissions...",
        variant: "destructive",
      });
      setCameraDevices([]); // Reset to empty, but log for debugging
      console.log('Falling back to empty camera devices in Camera Setup due to error');
    }
  }, [toast]);

  useEffect(() => {
    getCameras();
    
    const handleDeviceChange = () => {
      console.log("Device change detected, refreshing camera list in Camera Setup");
      getCameras();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      Object.values(cameraStreams).forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
    };
  }, [getCameras, cameraStreams]);

  const handleStreamCapture = (deviceId: string, stream: MediaStream) => {
    console.log(`Stream captured for device in Camera Setup: ${deviceId}`);
    setCameraStreams(prev => {
      const oldStream = prev[deviceId];
      if (oldStream) {
        oldStream.getTracks().forEach(track => track.stop());
      }
      return {
        ...prev,
        [deviceId]: stream,
      };
    });
    toast({
      title: "Camera Connected",
      description: `Successfully connected to camera with deviceId ${deviceId} in Camera Setup`,
    });
  };

  return {
    cameraDevices,
    cameraStreams,
    handleStreamCapture,
    refreshCameras: getCameras, // Ensure this is available and works
  };
};