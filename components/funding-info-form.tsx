"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

interface FundingInfoFormData {
  estimatedBudget: string;
  fundingSources: string;
  fundingSecured: string;
  sustainabilityPlan: string;
  fundingProof?: FileList;
  fundingPlan?: FileList;
}

interface FundingInfoFormProps {
  applicationId: string;
  darkMode: boolean;
}

export default function FundingInfoForm({ applicationId, darkMode }: FundingInfoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FundingInfoFormData>({
    mode: "onChange",
  });

  const fundingSecured = watch("fundingSecured");

  useEffect(() => {
    // Fetch application details to verify access
    const fetchApplication = async () => {
      try {
        const response = await fetch(`/api/applications/${applicationId}/funding-info`);
        if (response.ok) {
          const data = await response.json();
          setApplication(data.application);
        } else {
          setSubmitError("Application not found or access denied");
        }
      } catch (error) {
        setSubmitError("Error loading application");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId]);

  const onSubmit = async (data: FundingInfoFormData) => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const formData = new FormData();
      formData.append("estimatedBudget", data.estimatedBudget);
      formData.append("fundingSources", data.fundingSources);
      formData.append("fundingSecured", data.fundingSecured);
      formData.append("sustainabilityPlan", data.sustainabilityPlan);

      // Handle file uploads
      if (data.fundingProof && data.fundingProof.length > 0) {
        formData.append("fundingProof", data.fundingProof[0]);
      }
      if (data.fundingPlan && data.fundingPlan.length > 0) {
        formData.append("fundingPlan", data.fundingPlan[0]);
      }

      const response = await fetch(`/api/applications/${applicationId}/funding-info`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
      } else {
        setSubmitError(result.message || "Failed to submit funding information");
      }
    } catch (error) {
      setSubmitError("An error occurred while submitting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Loading...</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className={`max-w-md w-full ${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg p-8 text-center`}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Thank You!
          </h2>
          <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mb-6`}>
            Your funding information has been submitted successfully. We will review your submission and contact you if we need any additional information.
          </p>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            You can close this window now.
          </p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className={`max-w-md w-full ${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg p-8 text-center`}>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Access Denied
          </h2>
          <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {submitError || "You don't have permission to access this form."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} py-8`}>
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg p-6 mb-6`}>
          <div className="flex items-center mb-4">
            <img src="/Rwanda-coat-of-arms.png" alt="Ministry of Health" className="h-12 w-auto mr-4" />
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                MoH Affiliate Fellowship Program
              </h1>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Additional Information Required
              </p>
            </div>
          </div>
          <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Dear {application.firstName} {application.lastName},<br />
            Please complete the following information regarding your project funding and sustainability.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg p-6`}>
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {submitError}
            </div>
          )}

          {/* Estimated Budget */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              What is the estimated budget for your project? *
            </label>
            <input
              type="text"
              {...register("estimatedBudget", { required: "Estimated budget is required" })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? "bg-gray-700 border-gray-600 text-white" 
                  : "bg-white border-gray-300 text-gray-900"
              } ${errors.estimatedBudget ? "border-red-500" : ""}`}
              placeholder="e.g., $50,000 USD"
            />
            {errors.estimatedBudget && (
              <p className="text-red-500 text-sm mt-1">{errors.estimatedBudget.message}</p>
            )}
          </div>

          {/* Funding Sources */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              What are the potential or secured sources of funding? *
            </label>
            <textarea
              {...register("fundingSources", { required: "Funding sources are required" })}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? "bg-gray-700 border-gray-600 text-white" 
                  : "bg-white border-gray-300 text-gray-900"
              } ${errors.fundingSources ? "border-red-500" : ""}`}
              placeholder="e.g., grants, institutional support, personal contributions, partnerships..."
            />
            {errors.fundingSources && (
              <p className="text-red-500 text-sm mt-1">{errors.fundingSources.message}</p>
            )}
          </div>

          {/* Funding Secured */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Is funding secured or not yet secured? *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="secured"
                  {...register("fundingSecured", { required: "Please select funding status" })}
                  className="mr-2"
                />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>Funding is secured</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="not_secured"
                  {...register("fundingSecured", { required: "Please select funding status" })}
                  className="mr-2"
                />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>Funding is not yet secured</span>
              </label>
            </div>
            {errors.fundingSecured && (
              <p className="text-red-500 text-sm mt-1">{errors.fundingSecured.message}</p>
            )}
          </div>

          {/* Funding Proof (if secured) */}
          {fundingSecured === "secured" && (
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Proof of Funding (PDF, DOC, or DOCX) *
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                {...register("fundingProof", { 
                  required: fundingSecured === "secured" ? "Proof of funding is required" : false 
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-gray-300 text-gray-900"
                } ${errors.fundingProof ? "border-red-500" : ""}`}
              />
              {errors.fundingProof && (
                <p className="text-red-500 text-sm mt-1">{errors.fundingProof.message}</p>
              )}
            </div>
          )}

          {/* Funding Plan (if not secured) */}
          {fundingSecured === "not_secured" && (
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Plan to Obtain Financial Support (PDF, DOC, or DOCX) *
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                {...register("fundingPlan", { 
                  required: fundingSecured === "not_secured" ? "Funding plan is required" : false 
                })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-gray-300 text-gray-900"
                } ${errors.fundingPlan ? "border-red-500" : ""}`}
              />
              {errors.fundingPlan && (
                <p className="text-red-500 text-sm mt-1">{errors.fundingPlan.message}</p>
              )}
            </div>
          )}

          {/* Sustainability Plan */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              How will the project be sustained beyond the fellowship period? *
            </label>
            <textarea
              {...register("sustainabilityPlan", { required: "Sustainability plan is required" })}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? "bg-gray-700 border-gray-600 text-white" 
                  : "bg-white border-gray-300 text-gray-900"
              } ${errors.sustainabilityPlan ? "border-red-500" : ""}`}
              placeholder="Describe your plans for project sustainability..."
            />
            {errors.sustainabilityPlan && (
              <p className="text-red-500 text-sm mt-1">{errors.sustainabilityPlan.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className={`px-6 py-2 rounded-md font-medium ${
                isSubmitting || !isValid
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              } transition-colors`}
            >
              {isSubmitting ? "Submitting..." : "Submit Information"}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className={`text-center mt-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Ministry of Health Rwanda. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
