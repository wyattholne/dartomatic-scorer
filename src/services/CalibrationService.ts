import { useEffect } from 'react'; // For environment variable access in development

export interface CalibrationResult {
  success: boolean;
  message?: string;
  detected?: boolean;
  markers?: {
    corners: number[][][];
    ids: number[];
  };
}

export interface CalibrationProgress {
  status: string;
  progress: number;
  message?: string;
}

export interface CalibrationConfig {
  numCameras: number;
  resolution: [number, number];
  markerSize: number;
  minMarkersDetected: number;
  maxReprojError: number;
}

// Dynamically get VITE_CALIBRATION_API_URL from environment variables
const getCalibrationApiUrl = () => {
  if (typeof window !== 'undefined' && window.env && window.env.VITE_CALIBRATION_API_URL) {
    return window.env.VITE_CALIBRATION_API_URL;
  }
  return process.env.VITE_CALIBRATION_API_URL || 'http://127.0.0.1:8000'; // Default to your backend
};

class CalibrationService {
  private readonly config: CalibrationConfig = {
    numCameras: 3,
    resolution: [1280, 720], // Match OV9732 720p resolution
    markerSize: 0.05, // meters (adjust based on your ArUco marker size)
    minMarkersDetected: 4,
    maxReprojError: 1.0
  };
  
  private isCalibrating: boolean = false;
  private progressInterval: NodeJS.Timeout | null = null;

  async detectMarkers(imageData: ImageData, cameraIndex: number): Promise<CalibrationResult> {
    try {
      // Convert ImageData to base64
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx.putImageData(imageData, 0, 0);
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.95); // Match Intrinsic Calibration quality

      // Use environment variable or default to 127.0.0.1:8000
      const apiUrl = getCalibrationApiUrl();
      console.log(`Sending detect_markers request to ${apiUrl}/detect_markers for Camera ${cameraIndex + 1}`);

      const response = await fetch(`${apiUrl}/detect_markers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Image,
          camera_index: cameraIndex,
          config: this.config
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Detection failed');
      }

      console.log(`ArUco marker detection for Camera ${cameraIndex + 1}:`, {
        markersDetected: result.markers?.ids?.length || 0,
        resolution: this.config.resolution,
        markerSize: this.config.markerSize
      });

      return {
        success: true,
        detected: (result.markers?.ids?.length || 0) >= this.config.minMarkersDetected,
        message: `Detected ${result.markers?.ids?.length || 0} markers for Camera ${cameraIndex + 1}`,
        markers: result.markers
      };
    } catch (error) {
      console.error(`Detection error for Camera ${cameraIndex + 1}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to detect markers",
        detected: false
      };
    }
  }

  async startCalibration(cameraIndices: number[]): Promise<CalibrationResult> {
    try {
      const apiUrl = getCalibrationApiUrl();
      console.log(`Sending start_calibration request to ${apiUrl}/start_calibration`);

      const response = await fetch(`${apiUrl}/start_calibration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          camera_indices: cameraIndices,
          config: this.config
        })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }

      this.isCalibrating = true;
      this.startProgressPolling();
      
      return {
        success: true,
        message: `Extrinsic calibration started with ${cameraIndices.length} cameras at ${this.config.resolution[0]}x${this.config.resolution[1]}`
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Extrinsic calibration failed to start"
      };
    }
  }

  private startProgressPolling() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    
    this.progressInterval = setInterval(async () => {
      try {
        const progress = await this.getProgress();
        if (!this.isCalibrating || progress.progress >= 100) {
          this.stopProgressPolling();
        }
      } catch (error) {
        console.error('Error polling progress:', error);
        this.stopProgressPolling();
      }
    }, 1000);
  }

  private stopProgressPolling() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.isCalibrating = false;
  }

  async getProgress(): Promise<CalibrationProgress> {
    try {
      const apiUrl = getCalibrationApiUrl();
      console.log(`Fetching progress from ${apiUrl}/calibration_progress`);

      const response = await fetch(`${apiUrl}/calibration_progress`, {
        method: 'GET'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      return {
        status: data.is_running ? 'running' : 'stopped',
        progress: data.progress,
        message: data.message
      };
    } catch (error) {
      console.error('Error getting progress:', error);
      throw error;
    }
  }

  async stopCalibration(): Promise<CalibrationResult> {
    try {
      const apiUrl = getCalibrationApiUrl();
      console.log(`Sending stop request to ${apiUrl}/stop`);

      const response = await fetch(`${apiUrl}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }

      this.stopProgressPolling();
      
      return {
        success: true,
        message: 'Extrinsic calibration stopped successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to stop extrinsic calibration"
      };
    }
  }
}

export const calibrationService = new CalibrationService();
export const calibrationApi = calibrationService; // Alias for backward compatibility