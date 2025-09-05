"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import "../styles/animations.css";
import { ToastContainer } from "./toast";

// Document type definition
export interface Document {
  documentType: string;
  fileUrl: string;
  fileName?: string;
}

// Props for the DocumentUploadForm component
interface DocumentUploadFormProps {
  applicationId: string;
  additionalDocuments?: Record<string, string> | null;
  onUploadSuccess: (documentType: string, fileUrl: string) => void;
}

export default function DocumentUploadForm({
  applicationId,
  additionalDocuments,
  onUploadSuccess,
}: DocumentUploadFormProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; size: number; url: string }>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: "success" | "error" | "info";
    duration?: number;
  }>>([]);

  // Document types with their display names and descriptions
  const documentTypes = [
    {
      type: "identityDocument",
      name: "National ID or Passport",
      description: "A clear copy of your valid national ID or passport",
      required: true,
    },
    {
      type: "degreeCertifications",
      name: "Degrees or Certifications",
      description: "Official copies of your academic degrees and professional certifications",
      required: true,
    },
    {
      type: "referenceOne",
      name: "Reference Letter 1",
      description: "First letter of recommendation from a professional or academic referee",
      required: true,
    },
    {
      type: "referenceTwo",
      name: "Reference Letter 2",
      description: "Second letter of recommendation from a different referee",
      required: true,
    },
    {
      type: "fullProjectProposal",
      name: "Full Project Proposal",
      description: "Detailed project proposal (1,500 words) outlining your research objectives, methodology, and expected outcomes",
      required: true,
    },
    {
      type: "fundingPlan",
      name: "Funding and Sustainability Plan",
      description: "Document outlining your funding sources, budget, and sustainability strategy",
      required: true,
    },
    {
      type: "riskMitigation",
      name: "Risk Mitigation Strategy",
      description: "Document outlining potential risks and your strategies to mitigate them",
      required: false,
    },
    {
      type: "achievements",
      name: "Additional Achievements or Publications",
      description: "Document showcasing your additional achievements, publications, or notable accomplishments",
      required: false,
    },
    {
      type: "languageProficiency",
      name: "Language Proficiency Details",
      description: "Document providing details about your language proficiency and certifications",
      required: false,
    },
  ];

  // Handle file upload
  const handleUpload = async (documentType: string, file: File) => {
    // Check if already uploaded to prevent duplicates
    if (additionalDocuments?.[documentType] || uploadedFiles[documentType]) {
      setError("This document has already been uploaded. Please delete the existing file first if you want to replace it.");
      return;
    }

    setUploading(documentType);
    setError("");
    setUploadSuccess(prev => ({ ...prev, [documentType]: false }));
    setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

    // Enhanced file validation
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      setError(`File size exceeds 10MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
      setUploading(null);
      return;
    }

    // Validate file type more strictly
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedTypes.includes(fileExtension)) {
      setError(`Invalid file type "${fileExtension}". Only PDF, DOC, and DOCX files are allowed.`);
      setUploading(null);
      return;
    }

    // Check if file is empty
    if (file.size === 0) {
      setError("The selected file is empty. Please choose a valid document.");
      setUploading(null);
      return;
    }

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[documentType] || 0;
        if (current < 90) {
          return { ...prev, [documentType]: current + Math.random() * 20 };
        }
        return prev;
      });
    }, 200);

    // Create form data for file upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    try {
      // Send the file to the API
      const response = await fetch(`/api/applications/${applicationId}/documents`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [documentType]: 100 }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload file");
      }

      const data = await response.json();

      if (data.success) {
        // Show success feedback
        setUploadSuccess(prev => ({ ...prev, [documentType]: true }));
        setUploadedFiles(prev => ({ 
          ...prev, 
          [documentType]: { 
            name: file.name, 
            size: file.size, 
            url: data.fileUrl 
          } 
        }));
        
        // Show enhanced success toast
        const toastId = `success-${Date.now()}`;
        const docName = documentTypes.find(d => d.type === documentType)?.name || documentType;
        setToasts(prev => [...prev, {
          id: toastId,
          message: `✅ ${docName} uploaded successfully! File: ${file.name}`,
          type: "success",
          duration: 4000
        }]);
        
        // Call the parent callback
        onUploadSuccess(documentType, data.fileUrl);
        
        // Clear success message after 4 seconds
        setTimeout(() => {
          setUploadSuccess(prev => ({ ...prev, [documentType]: false }));
        }, 4000);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error uploading file:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      
      // Show error toast
      const toastId = `error-${Date.now()}`;
      setToasts(prev => [...prev, {
        id: toastId,
        message: `Upload failed: ${errorMessage}`,
        type: "error",
        duration: 5000
      }]);
    } finally {
      setUploading(null);
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));
      }, 1000);
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (documentType: string) => {
    const fileUrl = additionalDocuments?.[documentType];
    if (!fileUrl) return;

    setUploading(documentType);
    setError("");

    try {
      // Send delete request to the API
      const response = await fetch(`/api/documents/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentType,
          fileUrl,
          appId: applicationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete file");
      }

      const data = await response.json();

      if (data.success) {
        onUploadSuccess(documentType, "");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setUploading(null);
    }
  };

  // Extract filename from URL
  const getFilenameFromUrl = (url: string) => {
    if (!url) return "";
    const parts = url.split("/");
    let filename = parts[parts.length - 1];
    // Remove any query parameters
    filename = filename.split("?")[0];
    // Decode URL-encoded characters
    return decodeURIComponent(filename);
  };

  // View uploaded document in new tab
  const handleViewDocument = (fileUrl: string) => {
    // Use direct static file serving for uploads
    window.open(fileUrl, "_blank");
  };

  // Handle file input change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, documentType: string) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(documentType, e.target.files[0]);
    }
  };

  // Check if all required documents are uploaded
  const allRequiredUploaded = documentTypes
    .filter(doc => doc.required)
    .every(doc => additionalDocuments?.[doc.type] || uploadedFiles[doc.type]);

  // Remove toast function
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Handle completion submission
  const handleCompleteSubmission = async () => {
    if (!allRequiredUploaded) {
      setError("Please upload all required documents before submitting");
      return;
    }

    setUploading("complete");
    setError("");

    try {
      const response = await fetch(`/api/applications/${applicationId}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionStatus: "completed",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to complete submission");
      }

      setSuccess(true);
      onUploadSuccess("complete", "");
    } catch (error) {
      console.error("Error completing submission:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setUploading(null);
    }
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Documents Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for submitting your documents. Your application is now complete and will be reviewed by our team.
          </p>
          <button
            onClick={() => window.location.href = "/"}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Required Documents</h1>
        <p className="text-gray-600 mb-4">
          Please upload the following documents to complete your application. Required documents are marked with an asterisk (*).
        </p>
        
        {/* Important Warning */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> All required documents (*) must be uploaded before your application can be approved. 
                Missing required documents may result in application rejection. Please ensure all files are in PDF, DOC, or DOCX format and under 10MB.
              </p>
            </div>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-800">Upload Progress</h3>
              <p className="text-sm text-blue-600">
                {documentTypes.filter(doc => doc.required && (additionalDocuments?.[doc.type] || uploadedFiles[doc.type])).length} of {documentTypes.filter(doc => doc.required).length} required documents uploaded
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-800">
                {Math.round((documentTypes.filter(doc => doc.required && (additionalDocuments?.[doc.type] || uploadedFiles[doc.type])).length / documentTypes.filter(doc => doc.required).length) * 100)}%
              </div>
              <div className="text-xs text-blue-600">Complete</div>
            </div>
          </div>
          <div className="mt-2 bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(documentTypes.filter(doc => doc.required && (additionalDocuments?.[doc.type] || uploadedFiles[doc.type])).length / documentTypes.filter(doc => doc.required).length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {Object.values(uploadSuccess).some(success => success) && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-700 text-sm font-medium">
              Document uploaded successfully! Your file has been saved and is ready for submission.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Document Upload Cards */}
      <div className="space-y-6">
        {documentTypes.map((doc) => {
          const isUploaded = !!additionalDocuments?.[doc.type] || !!uploadedFiles[doc.type];
          const isUploading = uploading === doc.type;
          const fileUrl = additionalDocuments?.[doc.type] || uploadedFiles[doc.type]?.url;
          const showSuccess = uploadSuccess[doc.type];
          const uploadedFile = uploadedFiles[doc.type];

          return (
            <div
              key={doc.type}
              className={`bg-white rounded-lg border-2 transition-all duration-300 upload-card ${
                isUploaded
                  ? "border-green-300 bg-green-50 shadow-md"
                  : showSuccess
                  ? "border-green-400 bg-green-100 shadow-lg success-glow animate-fadeIn"
                  : "border-gray-200 hover:border-gray-300"
              } ${isUploading ? "opacity-50" : ""}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {doc.name}
                      {doc.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    <p className="text-sm text-gray-600">{doc.description}</p>
                  </div>
                  <div className="ml-4">
                    {showSuccess ? (
                      <div className="flex items-center text-green-600 animate-pulse">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Success!</span>
                      </div>
                    ) : isUploaded ? (
                      <div className="flex items-center text-green-600">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Uploaded</span>
                      </div>
                    ) : isUploading ? (
                      <div className="flex items-center text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm font-medium">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">Pending</span>
                      </div>
                    )}
                  </div>
                </div>

                {isUploaded ? (
                  <div className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                    showSuccess 
                      ? "bg-green-100 border-green-300 shadow-md" 
                      : "bg-white border-gray-200"
                  }`}>
                    <div className="flex items-center flex-1">
                      <div className={`w-8 h-8 mr-3 rounded-full flex items-center justify-center ${
                        showSuccess ? "bg-green-200" : "bg-blue-100"
                      }`}>
                        <svg className={`w-5 h-5 ${showSuccess ? "text-green-600" : "text-blue-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {uploadedFile?.name || getFilenameFromUrl(fileUrl)}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500">
                            {uploadedFile?.size ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : "PDF Document"}
                          </p>
                          {showSuccess && (
                            <span className="text-xs text-green-600 font-medium animate-pulse">
                              ✓ Uploaded successfully
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDocument(fileUrl)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View document"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteFile(doc.type)}
                        disabled={isUploading}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete document"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
                    isUploading 
                      ? "border-blue-300 bg-blue-50" 
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, doc.type)}
                      disabled={isUploading}
                      className="hidden"
                      id={`file-${doc.type}`}
                    />
                    <label
                      htmlFor={`file-${doc.type}`}
                      className={`cursor-pointer ${isUploading ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <div className="flex flex-col items-center">
                        {isUploading ? (
                          <div className="flex flex-col items-center w-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                            <p className="text-sm font-medium text-blue-600 mb-2">Uploading...</p>
                            <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mb-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full progress-bar"
                                style={{ width: `${uploadProgress[doc.type] || 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-blue-500">
                              {uploadProgress[doc.type] || 0}% complete
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <svg className="w-8 h-8 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm font-medium text-gray-900 mb-1">Click to upload</p>
                            <p className="text-xs text-gray-500 mb-2">
                              PDF, DOC, or DOCX (Max 10MB)
                            </p>
                            <p className="text-xs text-gray-400">
                              Drag and drop files here or click to browse
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="mt-8 text-center">
        {!allRequiredUploaded && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Missing Required Documents</p>
                <p className="text-sm text-red-700 mt-1">
                  You must upload all required documents (*) before submitting. Missing documents:
                </p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                  {documentTypes
                    .filter(doc => doc.required && !additionalDocuments?.[doc.type] && !uploadedFiles[doc.type])
                    .map(doc => (
                      <li key={doc.type}>{doc.name}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleCompleteSubmission}
          disabled={!allRequiredUploaded || uploading === "complete"}
          className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
            allRequiredUploaded && uploading !== "complete"
              ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {uploading === "complete" ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting Documents...
            </div>
          ) : allRequiredUploaded ? (
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Submit All Documents
            </div>
          ) : (
            "Upload Required Documents First"
          )}
        </button>
        
        {allRequiredUploaded && (
          <p className="text-sm text-green-600 mt-2 flex items-center justify-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            All required documents uploaded - ready to submit!
          </p>
        )}
      </div>
      </div>
    </>
  );
}