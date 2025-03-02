
import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, XCircle, Image as ImageIcon, Save } from "lucide-react";
import { CameraView } from "./CameraView";
import { useToast } from "@/components/ui/use-toast";
import { useCameras } from "@/hooks/useCameras";

const YoloTraining: React.FC = () => {
  const { cameraDevices, handleStreamCapture } = useCameras();
  const videoRefs = [
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
  ];
  const canvasRefs = [
    useRef<HTMLCanvasElement>(null),
    useRef<HTMLCanvasElement>(null),
    useRef<HTMLCanvasElement>(null),
  ];
  const [captures, setCaptures] = useState<string[][]>([[], [], []]);
  const [activeCamera, setActiveCamera] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const { toast } = useToast();

  // Function to capture an image from the current camera feed
  const captureImage = useCallback((cameraIndex: number) => {
    setIsCapturing(true);
    
    const videoEl = videoRefs[cameraIndex]?.current;
    const canvasEl = canvasRefs[cameraIndex]?.current;
    
    if (!videoEl || !canvasEl) {
      toast({
        title: "Capture Error",
        description: "Could not access camera or canvas element",
        variant: "destructive",
      });
      setIsCapturing(false);
      return;
    }

    try {
      // Set canvas dimensions to match video
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      
      // Draw current video frame to canvas
      const ctx = canvasEl.getContext('2d');
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }
      
      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
      
      // Convert to base64 image
      const imageData = canvasEl.toDataURL('image/jpeg', 0.95);

      // Add to captures array
      setCaptures(prev => {
        const newCaptures = [...prev];
        newCaptures[cameraIndex] = [...newCaptures[cameraIndex], imageData];
        return newCaptures;
      });

      toast({
        title: "Image Captured",
        description: `Successfully captured image from Camera ${cameraIndex + 1}`,
      });
    } catch (error) {
      console.error("Error capturing image:", error);
      toast({
        title: "Capture Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  }, [toast, videoRefs, canvasRefs]);

  // Delete a specific captured image
  const deleteCapture = useCallback((cameraIndex: number, captureIndex: number) => {
    setCaptures(prev => {
      const newCaptures = [...prev];
      newCaptures[cameraIndex] = newCaptures[cameraIndex].filter((_, index) => index !== captureIndex);
      return newCaptures;
    });

    toast({
      title: "Image Deleted",
      description: `Deleted image ${captureIndex + 1} from Camera ${cameraIndex + 1}`,
    });
  }, [toast]);

  // Export all captures for YOLOv8 training
  const exportCaptures = useCallback(() => {
    // This is a placeholder for the actual export functionality
    // In a real application, this might upload to a server or download a ZIP
    const totalImages = captures.flat().length;
    
    if (totalImages === 0) {
      toast({
        title: "Export Failed",
        description: "No images to export",
        variant: "destructive",
      });
      return;
    }

    console.log("Exporting captures for YOLOv8 training:", captures);
    
    toast({
      title: "Export Successful",
      description: `Exported ${totalImages} images for YOLOv8 training`,
    });
    
    // You would typically integrate with your backend here
    // For example:
    // const response = await fetch('/api/export-for-yolo', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ captures })
    // });
  }, [captures, toast]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">YOLOv8 Training Data Collection</h2>
        <Button 
          variant="default" 
          onClick={exportCaptures}
          disabled={captures.flat().length === 0}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Export Images for Training
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((index) => (
          <div 
            key={index}
            className={`relative border rounded-lg overflow-hidden ${
              activeCamera === index ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setActiveCamera(index)}
          >
            <div className="aspect-video bg-gray-900 relative">
              {cameraDevices[index] ? (
                <CameraView
                  deviceId={cameraDevices[index]?.deviceId}
                  onStream={(stream) => handleStreamCapture(cameraDevices[index].deviceId, stream)}
                  videoRef={videoRefs[index]}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Camera {index + 1} Detected
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                Camera {index + 1}
              </div>
            </div>
            
            <canvas ref={canvasRefs[index]} className="hidden" />
            
            <div className="p-3 bg-muted/30">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  captureImage(index);
                }}
                disabled={isCapturing || !cameraDevices[index]}
                className="w-full flex items-center justify-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {isCapturing && activeCamera === index 
                  ? "Capturing..." 
                  : `Capture Camera ${index + 1}`}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {[0, 1, 2].map((cameraIndex) => (
          <div key={`captures-${cameraIndex}`} className="space-y-3">
            <h3 className="font-medium">Camera {cameraIndex + 1} Captures ({captures[cameraIndex].length})</h3>
            
            {captures[cameraIndex].length === 0 ? (
              <div className="border rounded-lg p-8 bg-muted/30 flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                <p>No images captured</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {captures[cameraIndex].map((capture, captureIndex) => (
                  <div key={captureIndex} className="relative group">
                    <img 
                      src={capture} 
                      alt={`Capture ${captureIndex + 1}`}
                      className="w-full aspect-video object-cover rounded-md border"
                    />
                    <button 
                      onClick={() => deleteCapture(cameraIndex, captureIndex)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete image"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default YoloTraining;
