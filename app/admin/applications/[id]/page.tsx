"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";


type Application = {
  id: string;
  // Personal Information
  title: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  email: string;
  nationality: string;
  countryOfResidence: string;
  phone: string;
  address: string;

  // Career and Education
  workplace: string;
  position: string;
  educationLevel: string;
  otherEducation?: string;

  // Professional Context
  professionalContext: string;
  otherContext?: string;

  // Expected Contribution
  expectedContribution: string;
  otherContribution?: string;

  // Project Information
  projectType: string;
  projectArea: string;
  otherProjectArea?: string;
  projectSummary: string;
  projectMotivation: string;

  // Project Funding and Sustainability Information
  estimatedBudget?: string;
  fundingSources?: string;
  fundingSecured?: string;
  fundingProofUrl?: string;
  fundingPlanUrl?: string;
  sustainabilityPlan?: string;
  fundingInfoRequested?: boolean;
  fundingInfoSubmitted?: boolean;
  fundingInfoSubmittedAt?: string;

  // CV/Resume
  cvFileUrl?: string;

  // Status and timestamps
  status: "pending" | "approved" | "rejected" | "received";
  submittedAt: string;
  updatedAt: string;
};

// Modern Confirmation Modal Component
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmColor,
  darkMode,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmColor: string;
  darkMode: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm transition-all duration-300">
      <div
        className={`${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } rounded-xl shadow-2xl border w-full max-w-md overflow-hidden transform transition-all scale-in duration-200`}
      >
        <div className="p-6">
          <h3
            className={`text-xl font-bold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </h3>
          <p className={`mb-5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {message}
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                darkMode
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                confirmColor === "green"
                  ? darkMode
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                  : darkMode
                  ? "bg-rose-600 text-white hover:bg-rose-500"
                  : "bg-rose-500 text-white hover:bg-rose-600"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modern Toast Notification Component
function Toast({
  message,
  type,
  onClose,
  darkMode,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  darkMode: boolean;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`rounded-lg shadow-lg p-4 flex items-center ${
          type === "success"
            ? darkMode
              ? "bg-emerald-800 text-emerald-100"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : darkMode
            ? "bg-rose-800 text-rose-100"
            : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}
      >
        <div className="mr-3">
          {type === "success" ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              ></path>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              ></path>
            </svg>
          )}
        </div>
        <div className="mr-2 font-medium">{message}</div>
        <button
          onClick={onClose}
          className="ml-auto text-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ApplicationDetail() {
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [additionalDocuments, setAdditionalDocuments] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "documents">(
    "details"
  );
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    status: "approved" | "rejected" | null;
    title: string;
    message: string;
  }>({
    isOpen: false,
    status: null,
    title: "",
    message: "",
  });
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    reason: string;
    showTemplates: boolean;
    fullEmailMode: boolean;
    emailContent: string;
  }>({
    isOpen: false,
    reason: "",
    showTemplates: false,
    fullEmailMode: false,
    emailContent: "",
  });

  // Function to generate default email content based on the reason
  const generateEmailContent = (reason: string) => {
    return `Dear ${application?.firstName || "Applicant"},

Thank you for your interest in the Ministry of Health Affiliate Fellowship Program and for taking the time to submit your application.

After careful consideration of all applications, we regret to inform you that your application has not been selected for the current cohort of the fellowship program.

Feedback from the Selection Committee:
${reason}

We encourage you to apply for future cohorts of the program. We will announce new opportunities on our website and through our social media channels.

If you have any questions or would like additional feedback on your application, please don't hesitate to contact us at fellowship@moh.gov.rw.

We wish you the best in your future endeavors.

Best regards,
MoH Affiliate Fellowship Program Team`;
  };

  // Function to toggle between simple reason input and full email editing
  const toggleEmailMode = () => {
    if (!rejectionModal.fullEmailMode) {
      // Switching to full email mode - generate content from reason
      setRejectionModal({
        ...rejectionModal,
        fullEmailMode: true,
        emailContent: generateEmailContent(rejectionModal.reason),
      });
    } else {
      // Switching back to simple reason mode
      setRejectionModal({
        ...rejectionModal,
        fullEmailMode: false,
      });
    }
  };

  // Predefined rejection reason templates
  const rejectionTemplates = [
    {
      title: "Insufficient Experience",
      text: "After reviewing your application, we found that your experience level does not meet the minimum requirements for the current cohort of the fellowship program. We typically look for candidates with at least 3-5 years of relevant experience in their field.",
    },
    {
      title: "Project Alignment",
      text: "While your qualifications are impressive, we found that your proposed project does not align closely enough with the current priorities of the Ministry of Health. We are currently focusing on projects related to digital health solutions and infectious disease management.",
    },
    {
      title: "Incomplete Application",
      text: "Unfortunately, your application was missing some key information that prevented our selection committee from fully evaluating your candidacy. We encourage you to ensure all required fields and supporting documents are complete in future applications.",
    },
    {
      title: "High Competition",
      text: "We received an exceptionally high number of qualified applicants for this cohort. While your application demonstrated strong potential, we had to make difficult decisions based on our limited capacity and the specific needs of our current projects.",
    },
  ];

  // Function to apply a template
  const applyTemplate = (templateText: string) => {
    setRejectionModal({
      ...rejectionModal,
      reason: templateText,
      showTemplates: false,
      emailContent: rejectionModal.fullEmailMode
        ? generateEmailContent(templateText)
        : rejectionModal.emailContent,
    });
  };

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch application
        const response = await fetch(`/api/admin/applications/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch application");
        }
        const data = await response.json();
        setApplication(data);

        // Fetch additional documents if they exist
        try {
          const docsResponse = await fetch(`/api/applications/${id}/documents`);
          if (docsResponse.ok) {
            const docsData = await docsResponse.json();
            console.log("Fetched documents:", docsData);

            // Check if docsData is an array
            if (Array.isArray(docsData)) {
              setAdditionalDocuments(docsData);
            } else {
              // If it's not an array, wrap it in an array
              setAdditionalDocuments([docsData]);
            }
          }
        } catch (err) {
          console.log("No documents found or error fetching documents:", err);
        }
      } catch (err) {
        setError("Failed to load application details. Please try again.");
        console.error("Error fetching application:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleStatusUpdate = (status: "approved" | "rejected") => {
    if (status === "rejected") {
      // Open rejection reason modal instead of confirmation modal
      setRejectionModal({
        isOpen: true,
        reason: "",
        showTemplates: false,
        fullEmailMode: false,
        emailContent: "",
      });
    } else {
      setConfirmModal({
        isOpen: true,
        status,
        title: `Confirm ${status === "approved" ? "Approval" : "Rejection"}`,
        message: `Are you sure you want to ${
          status === "approved" ? "approve" : "reject"
        } this application? An email notification will be sent to the applicant.`,
      });
    }
  };

  // Update submitRejection to handle both modes
  const submitRejection = async () => {
    if (rejectionModal.fullEmailMode) {
      if (!rejectionModal.emailContent.trim()) {
        return; // Don't allow empty email content
      }
    } else {
      if (!rejectionModal.reason.trim()) {
        return; // Don't allow empty rejection reason
      }
    }

    setRejectionModal({ ...rejectionModal, isOpen: false });
    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "rejected",
          rejectionReason: rejectionModal.reason,
          customEmailContent: rejectionModal.fullEmailMode
            ? rejectionModal.emailContent
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update application status");
      }

      const updatedApplication = await response.json();
      setApplication(updatedApplication);

      setToast({
        show: true,
        message: `Application rejected successfully. Email notification has been sent to the applicant.`,
        type: "success",
      });
    } catch (err) {
      console.error("Error updating application status:", err);
      setToast({
        show: true,
        message: "Failed to update status. Please try again.",
        type: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  const updateStatus = async (status: "pending" | "approved" | "rejected") => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update application status");
      }

      const updatedApplication = await response.json();
      setApplication(updatedApplication);

      setToast({
        show: true,
        message: `Application ${
          status === "approved" ? "approved" : "rejected"
        } successfully. Email notification sent.`,
        type: "success",
      });
    } catch (err) {
      console.error("Error updating application status:", err);
      setToast({
        show: true,
        message: "Failed to update status. Please try again.",
        type: "error",
      });
    } finally {
      setProcessing(false);
      setConfirmModal({
        isOpen: false,
        status: null,
        title: "",
        message: "",
      });
    }
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  // Helper components
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3
      className={`text-xl font-semibold mb-4 ${
        darkMode ? "text-white" : "text-gray-800"
      }`}
    >
      {children}
    </h3>
  );

  const InfoRow = ({
    label,
    value,
    fullWidth = false,
  }: {
    label: string;
    value: string | undefined;
    fullWidth?: boolean;
  }) => (
    <div className={`mb-4 ${fullWidth ? "col-span-2" : ""}`}>
      <p
        className={`text-sm font-medium mb-1 ${
          darkMode ? "text-gray-300" : "text-gray-600"
        }`}
      >
        {label}
      </p>
      <p className={`${darkMode ? "text-white" : "text-gray-900"} mt-1`}>
        {value || "N/A"}
      </p>
    </div>
  );

  const Badge = ({ status }: { status: string }) => {
    const getStatusStyles = () => {
      switch (status) {
        case "pending":
          return darkMode
            ? "bg-yellow-800/30 text-yellow-200 border-yellow-700"
            : "bg-yellow-50 text-yellow-800 border-yellow-200";
        case "approved":
          return darkMode
            ? "bg-emerald-800/30 text-emerald-200 border-emerald-700"
            : "bg-emerald-50 text-emerald-800 border-emerald-200";
        case "rejected":
          return darkMode
            ? "bg-rose-800/30 text-rose-200 border-rose-700"
            : "bg-rose-50 text-rose-800 border-rose-200";
        case "received":
          return darkMode
            ? "bg-blue-800/30 text-blue-200 border-blue-700"
            : "bg-blue-50 text-blue-800 border-blue-200";
        default:
          return darkMode
            ? "bg-gray-800/30 text-gray-200 border-gray-700"
            : "bg-gray-50 text-gray-800 border-gray-200";
      }
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles()}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen ${
          darkMode ? "bg-gray-900" : "bg-gray-50"
        } flex items-center justify-center`}
      >
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Loading application details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div
        className={`min-h-screen ${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        } p-8`}
      >
        <div
          className={`max-w-4xl mx-auto ${
            darkMode ? "bg-gray-800" : "bg-white"
          } p-6 rounded-xl shadow-lg border ${
            darkMode ? "border-gray-700" : "border-gray-100"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p className={`${darkMode ? "text-red-400" : "text-red-600"} mb-4`}>
            {error || "Application not found"}
          </p>
          <Link
            href="/admin"
            className={`inline-flex items-center px-4 py-2 rounded-lg ${
              darkMode
                ? "bg-blue-700 text-white hover:bg-blue-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } transition-colors duration-150 shadow-sm`}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }



  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-6`}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin"
              className={`p-2.5 rounded-full ${
                darkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              } shadow-sm transition-colors duration-150 flex items-center justify-center`}
            >
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <div>
              <h1
                className={`text-2xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Application Review
              </h1>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Review and manage fellowship application
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-lg ${
                darkMode
                  ? "bg-gray-700 text-yellow-300 hover:bg-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              } transition-colors duration-200 shadow-sm`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Applicant Card */}
        <div
          className={`${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-100"
          } rounded-xl shadow-lg border p-6 mb-6`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-start space-x-4">
              <div
                className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
                  darkMode
                    ? "bg-blue-900 text-white"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {application.firstName[0]}
                {application.lastName[0]}
              </div>
              <div>
                <h2
                  className={`text-xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {application.title} {application.firstName}{" "}
                  {application.lastName}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mt-1">
                  <p
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {application.email}
                  </p>
                  <span
                    className={`hidden sm:block ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    •
                  </span>
                  <p
                    className={`${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {application.nationality}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Badge status={application.status} />
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Submitted:{" "}
                {new Date(application.submittedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => handleStatusUpdate("approved")}
              disabled={processing || application.status === "approved"}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 flex items-center ${
                processing || application.status === "approved"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              } ${
                darkMode
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              } shadow-sm`}
            >
              {processing ? (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              )}
              Approve Application
            </button>
            <button
              onClick={() => handleStatusUpdate("rejected")}
              disabled={processing || application.status === "rejected"}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 flex items-center ${
                processing || application.status === "rejected"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              } ${
                darkMode
                  ? "bg-rose-600 text-white hover:bg-rose-500"
                  : "bg-rose-500 text-white hover:bg-rose-600"
              } shadow-sm`}
            >
              {processing ? (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              )}
              Reject Application
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b mb-6 flex space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-1 py-3 border-b-2 text-sm font-medium whitespace-nowrap ${
                activeTab === "details"
                  ? darkMode
                    ? "border-blue-500 text-blue-400"
                    : "border-blue-600 text-blue-600"
                  : darkMode
                  ? "border-transparent text-gray-400 hover:text-gray-300"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              } transition-colors duration-150`}
            >
              Application Details
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-1 py-3 border-b-2 text-sm font-medium whitespace-nowrap flex items-center ${
                activeTab === "documents"
                  ? darkMode
                    ? "border-blue-500 text-blue-400"
                    : "border-blue-600 text-blue-600"
                  : darkMode
                  ? "border-transparent text-gray-400 hover:text-gray-300"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              } transition-colors duration-150`}
            >
              Additional Documents
              {additionalDocuments.length > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    darkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {additionalDocuments.length}
                </span>
              )}
            </button>
          </div>

          {/* Application Details Tab */}
          {activeTab === "details" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div
                  className={`p-6 rounded-xl ${
                    darkMode ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <SectionTitle>Personal Information</SectionTitle>
                  <div className="grid grid-cols-2 gap-x-4">
                    <InfoRow label="Title" value={application.title} />
                    <InfoRow label="Gender" value={application.gender} />
                    <InfoRow
                      label="Full Name"
                      value={`${application.firstName} ${
                        application.middleName || ""
                      } ${application.lastName}`.trim()}
                      fullWidth={true}
                    />
                    <InfoRow label="Email" value={application.email} />
                    <InfoRow label="Phone" value={application.phone} />
                    <InfoRow
                      label="Nationality"
                      value={application.nationality}
                    />
                    <InfoRow
                      label="Country of Residence"
                      value={application.countryOfResidence}
                    />
                    <InfoRow label="Address" value={application.address} />
                  </div>
                </div>

                <div
                  className={`p-6 rounded-xl ${
                    darkMode ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <SectionTitle>Career and Education</SectionTitle>
                  <InfoRow label="Workplace" value={application.workplace} />
                  <InfoRow label="Position" value={application.position} />
                  <InfoRow
                    label="Education Level"
                    value={
                      application.educationLevel === "Other"
                        ? `Other: ${application.otherEducation}`
                        : application.educationLevel
                    }
                  />

                  <div className="mt-6">
                    <SectionTitle>Professional Context</SectionTitle>
                    <InfoRow
                      label="Professional Context"
                      value={
                        application.professionalContext === "Other"
                          ? `Other: ${application.otherContext}`
                          : application.professionalContext
                      }
                    />
                    <InfoRow
                      label="Expected Contribution"
                      value={
                        application.expectedContribution === "Other"
                          ? `Other: ${application.otherContribution}`
                          : application.expectedContribution
                      }
                    />
                  </div>
                </div>
              </div>

              <div
                className={`p-6 rounded-xl mb-6 ${
                  darkMode ? "bg-gray-700/50" : "bg-gray-50"
                }`}
              >
                <SectionTitle>Project Information</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <InfoRow
                    label="Project Type"
                    value={application.projectType}
                  />
                  <InfoRow
                    label="Project Area"
                    value={
                      application.projectArea === "Other"
                        ? `Other: ${application.otherProjectArea}`
                        : application.projectArea
                    }
                  />
                </div>

                <div className="mb-6">
                  <p
                    className={`text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Project Summary
                  </p>
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-800" : "bg-white"
                    } border ${
                      darkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <p
                      className={`whitespace-pre-wrap ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {application.projectSummary}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p
                    className={`text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Motivation for conducting Project in Rwanda
                  </p>
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-800" : "bg-white"
                    } border ${
                      darkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <p
                      className={`whitespace-pre-wrap ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {application.projectMotivation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Funding and Sustainability Information */}
              {(application.estimatedBudget || application.fundingSources || application.fundingSecured || application.sustainabilityPlan) && (
                <div
                  className={`p-6 rounded-xl mb-6 ${
                    darkMode ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <SectionTitle>Project Funding and Sustainability</SectionTitle>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {application.estimatedBudget && (
                      <InfoRow
                        label="Estimated Budget"
                        value={application.estimatedBudget}
                      />
                    )}
                    {application.fundingSecured && (
                      <InfoRow
                        label="Funding Status"
                        value={application.fundingSecured}
                      />
                    )}
                  </div>

                  {application.fundingSources && (
                    <div className="mb-6">
                      <p
                        className={`text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Funding Sources
                      </p>
                      <div
                        className={`p-4 rounded-lg ${
                          darkMode ? "bg-gray-800" : "bg-white"
                        } border ${
                          darkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <p
                          className={`whitespace-pre-wrap ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {application.fundingSources}
                        </p>
                      </div>
                    </div>
                  )}

                  {application.sustainabilityPlan && (
                    <div className="mb-6">
                      <p
                        className={`text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Sustainability Plan
                      </p>
                      <div
                        className={`p-4 rounded-lg ${
                          darkMode ? "bg-gray-800" : "bg-white"
                        } border ${
                          darkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <p
                          className={`whitespace-pre-wrap ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {application.sustainabilityPlan}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Funding Documents */}
                  {(application.fundingProofUrl || application.fundingPlanUrl) && (
                    <div className="mb-4">
                      <p
                        className={`text-sm font-medium mb-3 ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Funding Documents
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {application.fundingProofUrl && (
                          <a
                            href={application.fundingProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm ${
                              darkMode
                                ? "bg-green-700 text-white hover:bg-green-600"
                                : "bg-green-600 text-white hover:bg-green-700"
                            } transition-colors duration-150`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Download Proof of Funding
                          </a>
                        )}
                        {application.fundingPlanUrl && (
                          <a
                            href={application.fundingPlanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm ${
                              darkMode
                                ? "bg-blue-700 text-white hover:bg-blue-600"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            } transition-colors duration-150`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Download Funding Plan
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Funding Information Status */}
                  {(application.fundingInfoRequested || application.fundingInfoSubmitted) && (
                    <div
                      className={`mt-4 p-4 rounded-lg border ${
                        darkMode
                          ? "border-blue-800 bg-blue-900/20"
                          : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <svg
                          className={`w-5 h-5 mr-2 ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              darkMode ? "text-blue-200" : "text-blue-800"
                            }`}
                          >
                            Funding Information Status
                          </p>
                          <div
                            className={`text-xs mt-1 ${
                              darkMode ? "text-blue-300" : "text-blue-600"
                            }`}
                          >
                            {application.fundingInfoRequested && (
                              <span className="inline-block mr-4">
                                📧 Request sent: {application.fundingInfoRequested ? "Yes" : "No"}
                              </span>
                            )}
                            {application.fundingInfoSubmitted && (
                              <span className="inline-block mr-4">
                                ✅ Submitted: {application.fundingInfoSubmitted ? "Yes" : "No"}
                              </span>
                            )}
                            {application.fundingInfoSubmittedAt && (
                              <span className="inline-block">
                                📅 Submitted on:{" "}
                                {new Date(application.fundingInfoSubmittedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {application.cvFileUrl && (
                <div
                  className={`p-6 rounded-xl ${
                    darkMode ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <SectionTitle>CV/Resume</SectionTitle>
                  <a
                    href={application.cvFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm ${
                      darkMode
                        ? "bg-blue-700 text-white hover:bg-blue-600"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    } transition-colors duration-150`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Download CV/Resume
                  </a>
                </div>
              )}
            </>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div
              className={`p-6 rounded-xl ${
                darkMode ? "bg-gray-700/50" : "bg-gray-50"
              }`}
            >
              <SectionTitle>Additional Documents</SectionTitle>

              {!additionalDocuments || additionalDocuments.length === 0 ? (
                <div
                  className={`p-8 text-center rounded-lg border ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-gray-400"
                      : "bg-white border-gray-200 text-gray-500"
                  }`}
                >
                  <svg
                    className="w-12 h-12 mx-auto mb-4 opacity-30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-lg font-medium mb-2">
                    No Documents Uploaded
                  </p>
                  <p className="max-w-md mx-auto">
                    This applicant hasn&apos;t uploaded any additional documents yet.
                    Documents will appear here after the applicant completes the
                    next step.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {additionalDocuments.map((doc, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        darkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <p
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Document Set {index + 1}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            darkMode
                              ? "bg-gray-700 text-gray-300"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {new Date((doc as any).createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(doc as Record<string, any>).map(([key, value]) => {
                          // Skip non-document fields
                          if (
                            [
                              "id",
                              "applicationId",
                              "createdAt",
                              "updatedAt",
                              "submissionStatus",
                              "submittedAt",
                            ].includes(key)
                          ) {
                            return null;
                          }

                          // Skip null or undefined values
                          if (!value) {
                            return null;
                          }

                          // Format the label from the key
                          const formatLabel = (key: string): string => {
                            // Skip if it's not a string
                            if (typeof key !== "string") {
                              return "Unknown";
                            }

                            // Handle special cases
                            if (key.endsWith("Url")) {
                              // Remove the &apos;Url&apos; suffix
                              key = key.substring(0, key.length - 3);
                            }

                            return key
                              .replace(/([A-Z])/g, " $1") // Insert a space before all capital letters
                              .replace(/^./, (str) => str.toUpperCase()); // Capitalize the first letter
                          };

                          // Use direct static file serving for uploads
                          const fileUrl = value.toString();

                          return (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              key={key}
                              className={`flex items-center p-3 rounded-lg border ${
                                darkMode
                                  ? "border-gray-700 hover:bg-gray-700"
                                  : "border-gray-100 hover:bg-gray-50"
                              } transition-colors duration-150 group`}
                            >
                              <div
                                className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center mr-3 ${
                                  darkMode ? "bg-gray-700" : "bg-blue-50"
                                }`}
                              >
                                <svg
                                  className={`w-5 h-5 ${
                                    darkMode ? "text-blue-400" : "text-blue-600"
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-sm font-medium truncate ${
                                    darkMode ? "text-gray-200" : "text-gray-900"
                                  }`}
                                >
                                  {formatLabel(key)}
                                </p>
                                <p
                                  className={`text-xs truncate ${
                                    darkMode ? "text-gray-400" : "text-gray-500"
                                  }`}
                                >
                                  View Document
                                </p>
                              </div>
                              <div
                                className={`flex-shrink-0 ml-2 text-sm ${
                                  darkMode
                                    ? "text-gray-400 group-hover:text-blue-400"
                                    : "text-gray-500 group-hover:text-blue-600"
                                }`}
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() =>
          confirmModal.status && updateStatus(confirmModal.status)
        }
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.status === "approved" ? "Approve" : "Reject"}
        confirmColor={confirmModal.status === "approved" ? "green" : "red"}
        darkMode={darkMode}
      />

      {/* Rejection Reason Modal */}
      <div
        className={`fixed inset-0 z-50 ${
          rejectionModal.isOpen ? "flex" : "hidden"
        } items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm transition-all duration-300`}
      >
        <div
          className={`${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } rounded-xl shadow-2xl border w-full max-w-2xl overflow-hidden transform transition-all scale-in duration-200`}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {rejectionModal.fullEmailMode
                  ? "Customize Rejection Email"
                  : "Provide Rejection Reason"}
              </h3>
              <button
                onClick={() =>
                  setRejectionModal({ ...rejectionModal, isOpen: false })
                }
                className={`p-1.5 rounded-full hover:bg-gray-200 focus:outline-none transition-colors`}
              >
                <svg
                  className={`w-5 h-5 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {rejectionModal.fullEmailMode
                  ? "Customize the full email content that will be sent to the applicant."
                  : "Provide a reason for rejecting this application. This message will be included in the email sent to the applicant."}
              </p>

              <button
                onClick={toggleEmailMode}
                className={`ml-4 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {rejectionModal.fullEmailMode ? "Simple Mode" : "Advanced Mode"}
              </button>
            </div>

            {!rejectionModal.fullEmailMode && (
              <>
                <div className="mb-4">
                  <button
                    onClick={() =>
                      setRejectionModal({
                        ...rejectionModal,
                        showTemplates: !rejectionModal.showTemplates,
                      })
                    }
                    className={`flex items-center text-sm ${
                      darkMode ? "text-blue-400" : "text-blue-600"
                    } hover:underline transition-colors`}
                  >
                    <span className="mr-1">
                      {rejectionModal.showTemplates ? "Hide" : "Show"} templates
                    </span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d={
                          rejectionModal.showTemplates
                            ? "M5 15l7-7 7 7"
                            : "M19 9l-7 7-7-7"
                        }
                      />
                    </svg>
                  </button>
                </div>

                {rejectionModal.showTemplates && (
                  <div
                    className={`mb-6 p-4 rounded-lg ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    } border ${
                      darkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    <h4
                      className={`text-sm font-medium mb-3 ${
                        darkMode ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      Template Library
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {rejectionTemplates.map((template, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg cursor-pointer border ${
                            darkMode
                              ? "border-gray-600 hover:bg-gray-600"
                              : "border-gray-200 hover:bg-gray-100"
                          } transition-colors`}
                          onClick={() => applyTemplate(template.text)}
                        >
                          <p
                            className={`text-sm font-medium mb-1 ${
                              darkMode ? "text-gray-200" : "text-gray-700"
                            }`}
                          >
                            {template.title}
                          </p>
                          <p
                            className={`text-xs line-clamp-2 ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {template.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  value={rejectionModal.reason}
                  onChange={(e) =>
                    setRejectionModal({
                      ...rejectionModal,
                      reason: e.target.value,
                    })
                  }
                  className={`w-full p-3 border rounded-lg mb-2 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  } transition-colors`}
                  rows={6}
                  placeholder="Enter rejection reason..."
                />

                <div
                  className={`flex justify-between items-center mb-4 text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <div>
                    <span
                      className={
                        rejectionModal.reason.length > 1000
                          ? "text-red-500"
                          : ""
                      }
                    >
                      {rejectionModal.reason.length}
                    </span>{" "}
                    / 2000 characters
                  </div>
                  {rejectionModal.reason.length > 1000 && (
                    <div className="text-yellow-500 flex items-center">
                      <svg
                        className="w-4 h-4 inline-block mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Long messages may be harder to read
                    </div>
                  )}
                </div>
              </>
            )}

            {rejectionModal.fullEmailMode && (
              <>
                <div
                  className={`p-3 mb-4 rounded-lg ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  } text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  <p>
                    <strong>Note:</strong> This is the full email content that
                    will be sent to {application?.firstName}{" "}
                    {application?.lastName} ({application?.email}).
                  </p>
                  <p className="mt-1">
                    You can customize it completely according to your
                    requirements.
                  </p>
                </div>

                <textarea
                  value={rejectionModal.emailContent}
                  onChange={(e) =>
                    setRejectionModal({
                      ...rejectionModal,
                      emailContent: e.target.value,
                    })
                  }
                  className={`w-full p-3 border rounded-lg mb-2 font-mono text-sm ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  } transition-colors`}
                  rows={15}
                  placeholder="Enter full email content..."
                />

                <div
                  className={`flex justify-between items-center mb-4 text-xs ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <div>
                    <span
                      className={
                        rejectionModal.emailContent.length > 3000
                          ? "text-red-500"
                          : ""
                      }
                    >
                      {rejectionModal.emailContent.length}
                    </span>{" "}
                    / 5000 characters
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between items-center">
              <div
                className={`text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <svg
                  className="w-4 h-4 inline-block mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                    clipRule="evenodd"
                  />
                </svg>
                Be professional and constructive in your feedback
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() =>
                    setRejectionModal({ ...rejectionModal, isOpen: false })
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    darkMode
                      ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  disabled={
                    rejectionModal.fullEmailMode
                      ? !rejectionModal.emailContent.trim() ||
                        rejectionModal.emailContent.length > 5000
                      : !rejectionModal.reason.trim() ||
                        rejectionModal.reason.length > 2000
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    (
                      rejectionModal.fullEmailMode
                        ? !rejectionModal.emailContent.trim() ||
                          rejectionModal.emailContent.length > 5000
                        : !rejectionModal.reason.trim() ||
                          rejectionModal.reason.length > 2000
                    )
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : darkMode
                      ? "bg-rose-600 text-white hover:bg-rose-500"
                      : "bg-rose-500 text-white hover:bg-rose-600"
                  }`}
                >
                  Send Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
