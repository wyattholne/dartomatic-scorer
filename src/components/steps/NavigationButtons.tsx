interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const NavigationButtons = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
}: NavigationButtonsProps) => {
  return (
    <div className="mt-6 flex justify-between">
      <button
        onClick={onPrevious}
        disabled={currentStep === 0}
        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
      >
        Previous
      </button>
      <button
        onClick={onNext}
        disabled={currentStep === totalSteps - 1}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};