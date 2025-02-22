
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

export type CalibrationStatus = 'idle' | 'detecting' | 'calibrating' | 'complete' | 'error';

interface CalibrationProgress {
  status: CalibrationStatus;
  progress: number;
  message: string;
}

interface ExtrinsicCalibrationProgressProps {
  calibrationProgress: CalibrationProgress;
  isCalibrating: boolean;
}

export const ExtrinsicCalibrationProgress = ({
  calibrationProgress,
  isCalibrating
}: ExtrinsicCalibrationProgressProps) => {
  const getStatusColor = (status: CalibrationStatus) => {
    switch (status) {
      case 'detecting':
        return 'text-blue-500';
      case 'calibrating':
        return 'text-purple-500';
      case 'complete':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-neutral-500';
    }
  };

  if (!isCalibrating) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-6 p-4 bg-white rounded-lg border border-neutral-200"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`font-medium ${getStatusColor(calibrationProgress.status)}`}>
          {calibrationProgress.message}
        </span>
        <span className="text-sm text-neutral-500">
          {calibrationProgress.progress}%
        </span>
      </div>
      <Progress value={calibrationProgress.progress} className="h-2" />
      
      {calibrationProgress.status === 'complete' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Calibration completed successfully!</span>
        </motion.div>
      )}
    </motion.div>
  );
};
