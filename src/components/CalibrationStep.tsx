
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CalibrationStepProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export const CalibrationStep = ({
  title,
  description,
  children,
  className,
}: CalibrationStepProps) => {
  return (
    <div className={cn("animate-fade-in space-y-6", className)}>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-h-[400px]">{children}</div>
    </div>
  );
};
