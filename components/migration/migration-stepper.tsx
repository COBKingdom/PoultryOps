"use client";

import { Check, Circle } from "lucide-react";

interface MigrationStepperProps {
  currentStage: "prepare" | "upload" | "review" | "confirm" | "results";
}

const STAGES = [
  { id: "prepare", label: "Prepare" },
  { id: "upload", label: "Upload" },
  { id: "review", label: "Review" },
  { id: "confirm", label: "Confirm" },
  { id: "results", label: "Results" },
] as const;

export function MigrationStepper({ currentStage }: MigrationStepperProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={stage.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : isCurrent
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`mt-1 text-xs font-medium ${
                    isCurrent
                      ? "text-blue-600"
                      : isCompleted
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {index < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    index < currentIndex ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}