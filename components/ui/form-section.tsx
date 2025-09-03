"use client";

import { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  children: ReactNode;
  darkMode?: boolean;
};

export function FormSection({
  title,
  children,
  darkMode = false,
}: FormSectionProps) {
  return (
    <div
      className={`mb-6 p-5 rounded-lg shadow-sm ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
      } border`}
    >
      <div className="flex items-center mb-4 pb-3 border-b border-opacity-50 border-gray-200">
        <div className="w-1.5 h-6 bg-blue-500 rounded-full mr-3"></div>
        <h2
          className={`text-lg font-semibold ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          {title}
        </h2>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}
