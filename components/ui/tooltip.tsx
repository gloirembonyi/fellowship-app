"use client";

import React, { useState, ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
}

export function Tooltip({ children, content }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>

      {isVisible && (
        <div className="absolute left-full ml-2 transform -translate-y-1/2 top-1/2 z-10">
          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {content}
            <div className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2">
              <div className="border-solid border-r-gray-800 border-r-8 border-y-transparent border-y-4 border-l-0"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
