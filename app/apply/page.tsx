"use client";

import { useState } from "react";
import ApplicationForm from "@/components/application-form";
import { Sidebar } from "@/components/sidebar";

export default function ApplyPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      name: "Personal Information",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: 2,
      name: "Career & Education",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
          />
        </svg>
      ),
    },
    {
      id: 3,
      name: "Professional Context",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: 4,
      name: "Project Information",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
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
      ),
    },
    {
      id: 5,
      name: "Review & Submit",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
  ];

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <>
      <style jsx global>{`
        /* Improve input text visibility */
        input,
        select,
        textarea {
          font-weight: 500 !important;
        }

        /* Dark mode specific improvements */
        .dark-mode input,
        .dark-mode select,
        .dark-mode textarea {
          color: #e5e7eb !important; /* text-gray-200 */
        }
      `}</style>

      <div
        className={`min-h-screen ${
          darkMode ? "bg-gray-900 dark-mode" : "bg-gray-50"
        } transition-colors duration-200`}
      >
        <header
          className={`py-3 px-4 ${
            darkMode ? "bg-gray-800 border-b border-gray-700" : "bg-white border-b border-gray-200"
          } shadow-sm sticky top-0 z-20`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src="/Rwanda-coat-of-arms.png"
                    alt="Rwanda Coat of Arms"
                    className="h-8 w-auto"
                  />
                  <div className={`absolute -inset-1 rounded-full ${
                    darkMode ? "bg-blue-600/20" : "bg-blue-100"
                  } blur-sm opacity-50`}></div>
                </div>
                <div>
                  <h1
                    className={`text-lg font-semibold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Affiliates Fellowship Application
                  </h1>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Ministry of Health
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                darkMode 
                  ? "bg-green-900/30 text-green-300 border border-green-800" 
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                Step {activeStep} of 5
              </div>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${
                  darkMode
                    ? "bg-gray-700 text-yellow-300 hover:bg-gray-600 border border-gray-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                } transition-all duration-200 shadow-sm`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 py-3">
          {/* <div
            className={`${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-lg shadow-md p-4 mb-6`}
          >
            <p
              className={`${
                darkMode ? "text-gray-300" : "text-gray-600"
              } mb-0 text-sm`}
            >
              Welcome to the Affiliates Fellowship Program application process.
              Please complete all required fields in each section. Your progress
              will be saved as you navigate through the form.
            </p>
          </div> */}

          <div className="flex flex-col lg:flex-row gap-3">
            <div className="lg:w-auto lg:max-w-[100px] sticky top-24 self-start">
              <Sidebar
                steps={steps}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                darkMode={darkMode}
              />
            </div>
            <div className="lg:flex-1 overflow-hidden">
              <ApplicationForm
                darkMode={darkMode}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
              />
            </div>
          </div>
        </main>

        <footer
          className={`py-3 ${
            darkMode ? "bg-gray-800 text-gray-400 border-t border-gray-700" : "bg-gray-50 text-gray-500 border-t border-gray-200"
          } text-center text-xs mt-4`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            &copy; {new Date().getFullYear()} Affiliates Fellowship Program. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
