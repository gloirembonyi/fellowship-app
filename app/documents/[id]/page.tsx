"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DocumentUploadForm from "@/components/document-upload-form";

export default function DocumentsSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<any>(null);
  const [additionalDocuments, setAdditionalDocuments] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch application and additional documents data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch application details
        const appResponse = await fetch(`/api/applications/${applicationId}`);

        if (!appResponse.ok) {
          throw new Error("Failed to fetch application");
        }

        const appData = await appResponse.json();

        // Verify this is an approved or received application
        if (appData.status !== "approved" && appData.status !== "received") {
          throw new Error(
            "This application is not approved for document submission"
          );
        }

        setApplication(appData);

        // Fetch additional documents if they exist
        try {
          const docsResponse = await fetch(
            `/api/applications/${applicationId}/documents`
          );

          if (docsResponse.ok) {
            const docsData = await docsResponse.json();

            // If we got an array, it might be empty or contain document records
            if (Array.isArray(docsData)) {
              if (docsData.length === 0) {
                // No documents found, initialize with empty object
                setAdditionalDocuments({});
              } else {
                // Process the array of documents into a single object with the latest URLs
                const combinedDocs = docsData.reduce((acc, doc) => {
                  // For each document field, take the most recent one that exists
                  Object.keys(doc).forEach((key) => {
                    // Skip non-document fields
                    if (
                      ![
                        "id",
                        "applicationId",
                        "createdAt",
                        "updatedAt",
                        "submissionStatus",
                        "submittedAt",
                      ].includes(key) &&
                      doc[key]
                    ) {
                      acc[key] = doc[key];
                    }
                  });
                  return acc;
                }, {} as Record<string, string>);

                setAdditionalDocuments(combinedDocs);
              }
            } else {
              // If it's not an array, use it directly
              setAdditionalDocuments(docsData);
            }
          } else {
            // If response is not OK, initialize with empty object
            setAdditionalDocuments({});
          }
        } catch (docsError) {
          // It's okay if there are no documents yet
          console.log("No documents found yet or error:", docsError);
          setAdditionalDocuments({});
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [applicationId]);

  // Handle document upload success
  const handleUploadSuccess = async (documentType: string, fileUrl: string) => {
    // If this is a completion notification, set success state
    if (documentType === "complete") {
      setSuccess(true);
      return;
    }

    console.log(
      `Document uploaded successfully: ${documentType} -> ${fileUrl}`
    );

    // Update the local state with the new document URL
    setAdditionalDocuments((prevDocs: Record<string, string> | null) => {
      // Create a new object if no previous documents
      const updatedDocs = prevDocs ? { ...prevDocs } : {};

      // Map the document type to its URL field
      if (fileUrl === "") {
        // If fileUrl is empty, it means the document was deleted
        const newDocs = { ...updatedDocs };
        delete newDocs[documentType];
        return newDocs;
      } else {
        // Update the URL for this document type
        return {
          ...updatedDocs,
          [documentType]: fileUrl,
        };
      }
    });
    
    // Immediately refresh document list to show the uploaded document
    try {
      const docsResponse = await fetch(
        `/api/applications/${applicationId}/documents`
      );
      
      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        
        if (Array.isArray(docsData) && docsData.length > 0) {
          // Process the array of documents into a single object with the latest URLs
          const combinedDocs = docsData.reduce((acc, doc) => {
            // For each document field, take the most recent one that exists
            Object.keys(doc).forEach((key) => {
              // Skip non-document fields
              if (
                ![
                  "id",
                  "applicationId",
                  "createdAt",
                  "updatedAt",
                  "submissionStatus",
                  "submittedAt",
                ].includes(key) &&
                doc[key]
              ) {
                acc[key] = doc[key];
              }
            });
            return acc;
          }, {} as Record<string, string>);
          
          setAdditionalDocuments(combinedDocs);
        }
      }
    } catch (error) {
      console.error("Error refreshing documents:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DocumentUploadForm
        applicationId={applicationId}
        additionalDocuments={additionalDocuments}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
} 