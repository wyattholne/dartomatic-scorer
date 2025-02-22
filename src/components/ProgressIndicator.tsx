
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const ProgressIndicator = ({
  steps,
  currentStep,
  className,
}: ProgressIndicatorProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => (
        <div
          key={step}
          className="flex items-center"
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-colors duration-200",
              index === currentStep
                ? "bg-accent"
                : index < currentStep
                ? "bg-accent/50"
                : "bg-gray-200"
            )}
          />
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-px w-8 transition-colors duration-200",
                index < currentStep ? "bg-accent/50" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};
