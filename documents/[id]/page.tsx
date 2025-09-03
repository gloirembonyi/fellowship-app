"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
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
                      const urlField = `${key}Url`;
                      if (!acc[urlField]) {
                        acc[urlField] = doc[key];
                      }
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
      const updatedDocs = prevDocs || {};

      // Map the document type to its URL field
      const urlField = `${documentType}Url`;

      if (fileUrl === "") {
        // If fileUrl is empty, it means the document was deleted
        const newDocs = { ...updatedDocs };
        delete newDocs[urlField];
        return newDocs;
      } else {
        // Update the URL for this document type
        return {
          ...updatedDocs,
          [urlField]: fileUrl,
        };
      }
    });

    // Refresh document data from server
    try {
      const docsResponse = await fetch(
        `/api/applications/${applicationId}/documents`
      );
      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setAdditionalDocuments(docsData);

        // Check if the API response indicates completion
        if (docsData.submissionStatus === "complete") {
          setSuccess(true);
        }
      }

      // Also refresh application data to get the latest status
      const appResponse = await fetch(`/api/applications/${applicationId}`);
      if (appResponse.ok) {
        const appData = await appResponse.json();
        setApplication(appData);
      }
    } catch (error) {
      console.error("Error refreshing documents:", error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => router.push("/")}>
          Return to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ my: 8 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        align="center"
        sx={{ mb: 4 }}
      >
        Additional Documents Submission
      </Typography>

      {success ? (
        <Paper sx={{ p: 4, mb: 4, textAlign: "center" }}>
          <Alert severity="success" sx={{ mb: 4 }}>
            All required documents have been successfully submitted. Thank you!
          </Alert>
          <Typography variant="body1" paragraph>
            Your application is now complete. The MoH Affiliate Fellowship
            Program team will review your documents and contact you with further
            information.
          </Typography>
          <Button variant="contained" onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </Paper>
      ) : (
        <>
          <Paper sx={{ p: 4, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Welcome, {application?.firstName} {application?.lastName}
            </Typography>
            <Typography variant="body1" paragraph>
              Congratulations on your approval for the MoH Affiliate Fellowship
              Program! To complete your application, please submit the following
              required documents.
            </Typography>
            <Typography variant="body2" paragraph color="text.secondary">
              Application ID: {applicationId}
            </Typography>
          </Paper>

          <DocumentUploadForm
            applicationId={applicationId}
            additionalDocuments={additionalDocuments}
            onUploadSuccess={handleUploadSuccess}
          />
        </>
      )}
    </Container>
  );
}
