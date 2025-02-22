
import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000";

export interface DetectionQuality {
  score: number;
  recentScores: number[];
}

export const api = {
  async assessDetectionQuality(imageData: ImageData): Promise<DetectionQuality> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg')
      );

      const formData = new FormData();
      formData.append('image', blob);

      const response = await axios.post(`${BASE_URL}/assess-quality`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error assessing detection quality:', error);
      throw error;
    }
  },
};
