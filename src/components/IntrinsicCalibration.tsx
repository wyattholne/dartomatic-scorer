import React, { type RefObject, useCallback, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { calibrationService } from '@/services/CalibrationService';
import { toast } from "@/components/ui/use-toast";
import { CameraView } from "./CameraView";

interface IntrinsicCalibrationProps {
    videoRefs: RefObject<HTMLVideoElement>[];
    canvasRef: RefObject<HTMLCanvasElement>;
    cameraDevices: MediaDeviceInfo[];
    handleCameraSwitch: (index: number) => void;
    cameraIndex: number;
    captureCount: number;  // Per-camera from parent
    onCapture: () => void;
}

const IntrinsicCalibration: React.FC<IntrinsicCalibrationProps> = ({
    videoRefs,
    canvasRef: providedCanvasRef,
    cameraDevices,
    handleCameraSwitch,
    cameraIndex,
    captureCount,
    onCapture,
}) => {
    const totalRequiredImages = 15;
    const localCanvasRef = useRef<HTMLCanvasElement>(null);
    const activeCanvasRef = providedCanvasRef || localCanvasRef;
    const [isCapturing, setIsCapturing] = useState(false);
    const [streamReady, setStreamReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const handleStreamReady = useCallback((stream: MediaStream) => {
        setStreamReady(true);
        setCameraError(null);
        console.log(`Stream ready for camera ${cameraIndex + 1} with deviceId ${cameraDevices[cameraIndex]?.deviceId}`);
    }, [cameraIndex, cameraDevices]);

    const captureAndDetect = useCallback(async () => {
        if (isCapturing || !streamReady || !cameraDevices[cameraIndex]) return;

        try {
            setIsCapturing(true);

            const video = videoRefs[cameraIndex]?.current;
            const canvas = activeCanvasRef.current;

            if (!video || !canvas) {
                toast({
                    title: "Error",
                    description: `Camera ${cameraIndex + 1} or canvas not ready. Please try again or check permissions.`,
                    variant: "destructive",
                });
                return;
            }

            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                toast({
                    title: "Error",
                    description: "Could not get canvas context.",
                    variant: "destructive",
                });
                return;
            }

            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0);
            const base64Image = canvas.toDataURL('image/jpeg', 0.95);  // Convert to base64 with quality 0.95

            // Send to backend
            const response = await fetch('http://127.0.0.1:8000/detect_markers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64Image,
                    camera_index: cameraIndex,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.detected) {
                // Draw detected markers on canvas
                if (result.markers?.corners) {
                    ctx.strokeStyle = '#00FF00';
                    ctx.lineWidth = 2;
                    result.markers.corners.forEach((markerCorners: number[][]) => {
                        ctx.beginPath();
                        ctx.moveTo(markerCorners[0][0], markerCorners[0][1]);
                        for (let i = 1; i < 4; i++) {
                            ctx.lineTo(markerCorners[i][0], markerCorners[i][1]);
                        }
                        ctx.closePath();
                        ctx.stroke();
                    });
                }

                onCapture();
                toast({
                    title: "Success",
                    description: `Captured image ${Math.min(captureCount + 1, totalRequiredImages)} of ${totalRequiredImages} for Camera ${cameraIndex + 1}`,
                });
                console.log(`Backend Marker Detection Response for Camera ${cameraIndex + 1}:`, result);

            } else {
                throw new Error(result.message || 'Failed to detect markers');
            }

        } catch (error) {
            console.error(`Error during capture for Camera ${cameraIndex + 1}:`, error);
            toast({
                title: "Capture Error",
                description: error instanceof Error ? error.message : "Failed to process image. Check backend connection or permissions.",
                variant: "destructive",
            });
        } finally {
            setIsCapturing(false);
        }
    }, [cameraIndex, videoRefs, activeCanvasRef, isCapturing, streamReady, cameraDevices, captureCount, onCapture, toast]);

    if (cameraIndex >= cameraDevices.length) {
        return null;
    }

    const currentDevice = cameraDevices[cameraIndex];

    return (
        <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Camera {cameraIndex + 1} Calibration</h3>
                    <p className="text-sm text-muted-foreground">
                        Capture {totalRequiredImages} images with ArUco markers visible from different angles
                    </p>
                </div>

                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                    <CameraView
                        deviceId={currentDevice?.deviceId}
                        videoRef={videoRefs[cameraIndex]}
                        onStream={handleStreamReady}
                        className="w-full h-full object-contain"
                    />
                    {cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                            {cameraError}
                        </div>
                    )}
                    {!streamReady && !cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                            Initializing camera...
                        </div>
                    )}
                </div>
                
                <div className="mt-4">
                    <div className="mb-4 h-2 rounded-full bg-secondary">
                        <div 
                            className="h-2 rounded-full bg-accent transition-all duration-300"
                            style={{ width: `${(Math.min(captureCount, totalRequiredImages) / totalRequiredImages) * 100}%` }}
                        />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                        <span>{Math.min(captureCount, totalRequiredImages)} captures</span>
                        <span>{totalRequiredImages - Math.min(captureCount, totalRequiredImages)} remaining</span>
                    </div>
                </div>

                <canvas
                    ref={activeCanvasRef}
                    style={{ display: 'none' }}
                />

                <Button
                    onClick={captureAndDetect}
                    disabled={!streamReady || captureCount >= totalRequiredImages || isCapturing}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
                >
                    <Camera className="h-4 w-4" />
                    {isCapturing ? 'Processing...' : !streamReady ? 'Initializing...' : 'Capture Image'}
                </Button>
            </div>
        </div>
    );
};

export default IntrinsicCalibration;