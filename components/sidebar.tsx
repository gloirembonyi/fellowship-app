"use client";

import { Dispatch, SetStateAction } from "react";
import { Tooltip } from "./ui/tooltip";

type Step = {
  id: number;
  name: string;
  icon: React.ReactNode;
};

type SidebarProps = {
  steps: Step[];
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
  darkMode?: boolean;
};

export function Sidebar({
  steps,
  activeStep,
  setActiveStep,
  darkMode = false,
}: SidebarProps) {
  return (
    <div
      className={`${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } rounded-lg shadow-md border p-3`}
    >
      <h2
        className={`text-xs font-semibold mb-5 ${
          darkMode ? "text-white" : "text-gray-800"
        } text-center uppercase tracking-wide`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mx-auto mb-1.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Steps
      </h2>
      <nav className="flex flex-col items-center space-y-5">
        {steps.map((step) => (
          <Tooltip key={step.id} content={step.name}>
            <button
              onClick={() => setActiveStep(step.id)}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                activeStep === step.id
                  ? darkMode
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/50"
                    : "bg-blue-500 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-300"
                  : darkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              aria-label={step.name}
            >
              {step.icon}
            </button>
          </Tooltip>
        ))}
      </nav>

      <div
        className={`mt-6 ${
          darkMode
            ? "bg-gray-700/50 border-gray-600"
            : "bg-gray-50 border-gray-200"
        } p-2.5 rounded-lg border text-xs`}
      >
        <h3
          className={`font-medium mb-1.5 ${
            darkMode ? "text-gray-200" : "text-gray-700"
          } text-center flex items-center justify-center`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Help
        </h3>
        <a
          href="mailto:support@example.com"
          className={`flex items-center justify-center text-xs font-medium mt-1.5 ${
            darkMode
              ? "text-blue-400 hover:text-blue-300"
              : "text-blue-600 hover:text-blue-800"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Contact Support
        </a>
      </div>
    </div>
  );
}
