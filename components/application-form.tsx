"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { FormSection } from "@/components/ui/form-section";
import { countries } from "countries-list";
import {
  parsePhoneNumberFromString,
  AsYouType,
  isValidPhoneNumber,
  CountryCode,
} from "libphonenumber-js";
import Select, { StylesConfig, SingleValue, ActionMeta } from "react-select";
import { Icon } from "@mui/material";
import "@/styles/react-select.css";

type ApplicationFormProps = {
  darkMode: boolean;
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
};

type CountryOption = {
  value: string;
  label: string;
  code: string;
  phone?: number | string | number[];
  name?: string;
};

type ApplicationFormData = {
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

  // Project Funding and Sustainability
  estimatedBudget: string;
  fundingSources: string;
  fundingSecured: string;
  fundingProof?: FileList;
  fundingPlan?: FileList;
  sustainabilityPlan: string;

  // CV/Resume
  cvFile?: FileList;
};

function ApplicationForm({
  darkMode,
  activeStep,
  setActiveStep,
}: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [showSummary, setShowSummary] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] =
    useState<CountryCode>("RW");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  useEffect(() => {
    setCurrentStep(activeStep);
  }, [activeStep]);

  useEffect(() => {
    setActiveStep(currentStep);
  }, [currentStep, setActiveStep]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ApplicationFormData>({
    mode: "onChange",
  });

  const totalSteps = 5;

  const handleConfirmSubmission = async () => {
    setShowSubmissionModal(false);
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const formValues = watch();
      
      // Check that all required fields are filled
      const allStepRequiredFields: Array<{ field: string; label: string }> = [
        { field: "title", label: "Title" },
        { field: "firstName", label: "First Name" },
        { field: "lastName", label: "Last Name" },
        { field: "gender", label: "Gender" },
        { field: "email", label: "Email Address" },
        { field: "nationality", label: "Nationality" },
        { field: "countryOfResidence", label: "Country of Residence" },
        { field: "phone", label: "Phone Number" },
        { field: "address", label: "Address" },
        { field: "workplace", label: "Workplace" },
        { field: "position", label: "Position" },
        { field: "educationLevel", label: "Education Level" },
        { field: "professionalContext", label: "Professional Context" },
        { field: "expectedContribution", label: "Expected Contribution" },
        { field: "projectType", label: "Project Type" },
        { field: "projectArea", label: "Project Area" },
        { field: "projectSummary", label: "Project Summary" },
        { field: "projectMotivation", label: "Project Motivation" },
        { field: "estimatedBudget", label: "Estimated Budget" },
        { field: "fundingSources", label: "Funding Sources" },
        { field: "fundingSecured", label: "Funding Secured" },
        { field: "sustainabilityPlan", label: "Sustainability Plan" },
      ];

      const missing: string[] = [];

      const hasAllRequiredFields = allStepRequiredFields.every(
        ({ field, label }) => {
          if (
            field === "otherEducation" &&
            formValues.educationLevel === "Other"
          ) {
            const isValid = !!formValues.otherEducation;
            if (!isValid) missing.push("Other Education Level");
            return isValid;
          }
          if (
            field === "otherContext" &&
            formValues.professionalContext === "Other"
          ) {
            const isValid = !!formValues.otherContext;
            if (!isValid) missing.push("Other Professional Context");
            return isValid;
          }
          if (
            field === "otherContribution" &&
            formValues.expectedContribution === "Other"
          ) {
            const isValid = !!formValues.otherContribution;
            if (!isValid) missing.push("Other Expected Contribution");
            return isValid;
          }
          if (
            field === "otherProjectArea" &&
            formValues.projectArea === "Other"
          ) {
            const isValid = !!formValues.otherProjectArea;
            if (!isValid) missing.push("Other Project Area");
            return isValid;
          }

          // Special validation for funding files
          if (field === "fundingSecured" && formValues.fundingSecured === "Yes") {
            const isValid = formValues.fundingProof && formValues.fundingProof.length > 0;
            if (!isValid) missing.push("Proof of Funding");
            return isValid;
          }
          if (field === "fundingSecured" && formValues.fundingSecured === "No") {
            const isValid = formValues.fundingPlan && formValues.fundingPlan.length > 0;
            if (!isValid) missing.push("Funding Plan");
            return isValid;
          }

          const isValid = !!formValues[field as keyof ApplicationFormData];
          if (!isValid) missing.push(label);
          return isValid;
        }
      );

      if (!hasAllRequiredFields) {
        setMissingFields(missing);
        const missingFieldsText = missing.join(", ");
        setSubmitError(
          `Please complete the following required fields before submitting: ${missingFieldsText}`
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Generate placeholder URLs for files
      let cvFileUrl = "";
      if (formValues.cvFile && formValues.cvFile.length > 0) {
        cvFileUrl = `https://example.com/uploads/cv-${Date.now()}.pdf`;
        console.log("CV file detected, using placeholder URL:", cvFileUrl);
      }

      let fundingProofUrl = "";
      if (formValues.fundingProof && formValues.fundingProof.length > 0) {
        fundingProofUrl = `https://example.com/uploads/funding-proof-${Date.now()}.pdf`;
        console.log("Funding proof file detected, using placeholder URL:", fundingProofUrl);
      }

      let fundingPlanUrl = "";
      if (formValues.fundingPlan && formValues.fundingPlan.length > 0) {
        fundingPlanUrl = `https://example.com/uploads/funding-plan-${Date.now()}.pdf`;
        console.log("Funding plan file detected, using placeholder URL:", fundingPlanUrl);
      }

      // Create a clean data object without the file object that can't be serialized
      // Explicitly include only the fields that exist in the Prisma schema
      const submissionData = {
        title: formValues.title,
        firstName: formValues.firstName,
        middleName: formValues.middleName || "",
        lastName: formValues.lastName,
        gender: formValues.gender,
        email: formValues.email,
        nationality: formValues.nationality,
        countryOfResidence: formValues.countryOfResidence,
        phone: formValues.phone,
        address: formValues.address,
        workplace: formValues.workplace,
        position: formValues.position,
        educationLevel: formValues.educationLevel,
        otherEducation: formValues.otherEducation || null,
        professionalContext: formValues.professionalContext,
        otherContext: formValues.otherContext || null,
        expectedContribution: formValues.expectedContribution,
        otherContribution: formValues.otherContribution || null,
        projectType: formValues.projectType,
        projectArea: formValues.projectArea,
        otherProjectArea: formValues.otherProjectArea || null,
        projectSummary: formValues.projectSummary,
        projectMotivation: formValues.projectMotivation,
        estimatedBudget: formValues.estimatedBudget,
        fundingSources: formValues.fundingSources,
        fundingSecured: formValues.fundingSecured,
        fundingProofUrl: fundingProofUrl || null,
        fundingPlanUrl: fundingPlanUrl || null,
        sustainabilityPlan: formValues.sustainabilityPlan,
        cvFileUrl,
        status: "pending",
      };

      console.log("Submitting application data:", submissionData);

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server error:", errorData);
        throw new Error(errorData.details || "Failed to submit application");
      }

      const result = await response.json();
      console.log("Application submitted successfully:", result);

      setSubmitSuccess(true);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to submit your application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit: SubmitHandler<ApplicationFormData> = async (data) => {
    // If we're on step 4 (before review), move to the review step
    if (currentStep === 4) {
      const { isValid, missing } = isCurrentStepValid();

      if (!isValid) {
        setMissingFields(missing);
        const missingFieldsText = missing.join(", ");
        setSubmitError(
          `Please complete the following required fields: ${missingFieldsText}`
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setSubmitError("");
      setShowSummary(true);
      setCurrentStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // If we're on step 5 (review), proceed with submission
    if (currentStep === 5) {
      setIsSubmitting(true);
      setSubmitError("");

      try {
        // Check that all required fields are filled
        const allStepRequiredFields: Array<{ field: string; label: string }> = [
          { field: "title", label: "Title" },
          { field: "firstName", label: "First Name" },
          { field: "lastName", label: "Last Name" },
          { field: "gender", label: "Gender" },
          { field: "email", label: "Email Address" },
          { field: "nationality", label: "Nationality" },
          { field: "countryOfResidence", label: "Country of Residence" },
          { field: "phone", label: "Phone Number" },
          { field: "address", label: "Address" },
          { field: "workplace", label: "Workplace" },
          { field: "position", label: "Position" },
          { field: "educationLevel", label: "Education Level" },
          { field: "professionalContext", label: "Professional Context" },
          { field: "expectedContribution", label: "Expected Contribution" },
          { field: "projectType", label: "Project Type" },
          { field: "projectArea", label: "Project Area" },
          { field: "projectSummary", label: "Project Summary" },
          { field: "projectMotivation", label: "Project Motivation" },
        ];

        const formValues = watch();
        const missing: string[] = [];

        const hasAllRequiredFields = allStepRequiredFields.every(
          ({ field, label }) => {
            if (
              field === "otherEducation" &&
              formValues.educationLevel === "Other"
            ) {
              const isValid = !!formValues.otherEducation;
              if (!isValid) missing.push("Other Education Level");
              return isValid;
            }
            if (
              field === "otherContext" &&
              formValues.professionalContext === "Other"
            ) {
              const isValid = !!formValues.otherContext;
              if (!isValid) missing.push("Other Professional Context");
              return isValid;
            }
            if (
              field === "otherContribution" &&
              formValues.expectedContribution === "Other"
            ) {
              const isValid = !!formValues.otherContribution;
              if (!isValid) missing.push("Other Expected Contribution");
              return isValid;
            }
            if (
              field === "otherProjectArea" &&
              formValues.projectArea === "Other"
            ) {
              const isValid = !!formValues.otherProjectArea;
              if (!isValid) missing.push("Other Project Area");
              return isValid;
            }

            const isValid = !!formValues[field as keyof ApplicationFormData];
            if (!isValid) missing.push(label);
            return isValid;
          }
        );

        if (!hasAllRequiredFields) {
          setMissingFields(missing);
          const missingFieldsText = missing.join(", ");
          setSubmitError(
            `Please complete the following required fields before submitting: ${missingFieldsText}`
          );
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        // Create a clean data object without the file object that can't be serialized
        // Explicitly include only the fields that exist in the Prisma schema
        const submissionData = {
          title: data.title,
          firstName: data.firstName,
          middleName: data.middleName || "",
          lastName: data.lastName,
          gender: data.gender,
          email: data.email,
          nationality: data.nationality,
          countryOfResidence: data.countryOfResidence,
          phone: data.phone,
          address: data.address,
          workplace: data.workplace,
          position: data.position,
          educationLevel: data.educationLevel,
          otherEducation: data.otherEducation || null,
          professionalContext: data.professionalContext,
          otherContext: data.otherContext || null,
          expectedContribution: data.expectedContribution,
          otherContribution: data.otherContribution || null,
          projectType: data.projectType,
          projectArea: data.projectArea,
          otherProjectArea: data.otherProjectArea || null,
          projectSummary: data.projectSummary,
          projectMotivation: data.projectMotivation,
          estimatedBudget: data.estimatedBudget,
          fundingSources: data.fundingSources,
          fundingSecured: data.fundingSecured,
          sustainabilityPlan: data.sustainabilityPlan,
          status: "pending",
        };

        console.log("Submitting application data:", submissionData);

        // Step 1: Submit the application data
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Server error:", errorData);
          throw new Error(errorData.details || "Failed to submit application");
        }

        const result = await response.json();
        console.log("Application submitted successfully:", result);

        // Step 2: Upload the CV file if provided
        if (data.cvFile && data.cvFile.length > 0) {
          const applicationId = result.data.id;
          const formData = new FormData();
          formData.append("applicationId", applicationId);
          formData.append("cvFile", data.cvFile[0]);

          const fileResponse = await fetch("/api/applications/cv-upload", {
            method: "POST",
            body: formData,
          });

          if (!fileResponse.ok) {
            console.error(
              "Failed to upload CV file, but application was submitted"
            );
          } else {
            const fileResult = await fileResponse.json();
            console.log("CV file uploaded successfully:", fileResult);
          }
        }

        setSubmitSuccess(true);
        window.scrollTo(0, 0);
      } catch (error) {
        console.error("Error submitting form:", error);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to submit your application. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      const { isValid, missing } = isCurrentStepValid();

      if (!isValid) {
        setMissingFields(missing);
        const missingFieldsText = missing.join(", ");
        setSubmitError(
          `Please complete the following required fields: ${missingFieldsText}`
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (currentStep === 4) {
        setSubmitError("");
        setShowSummary(true);
      }

      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const formValues = watch();

  const watchEducationLevel = watch("educationLevel");
  const watchProfessionalContext = watch("professionalContext");
  const watchExpectedContribution = watch("expectedContribution");
  const watchProjectArea = watch("projectArea");

  const ApplicationSummary = () => {
    const sectionClassName = `mb-8 p-6 rounded-lg ${
      darkMode
        ? "bg-gray-800/50 border border-gray-700"
        : "bg-white border border-gray-100 shadow-sm"
    } transition-all hover:shadow-md`;

    const labelClassName = `text-sm ${
      darkMode ? "text-gray-400" : "text-gray-500"
    }`;

    const valueClassName = `font-medium ${
      darkMode ? "text-white" : "text-gray-800"
    }`;

    const sectionTitleClassName = `text-lg font-semibold mb-5 pb-3 border-b ${
      darkMode
        ? "text-blue-300 border-gray-700"
        : "text-blue-600 border-gray-200"
    } flex items-center`;

    return (
      <div>
        <div
          className={`p-5 rounded-lg mb-8 ${
            darkMode
              ? "bg-blue-900/30 border-blue-800"
              : "bg-blue-50 border-blue-100"
          } border`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
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
            </div>
            <div>
              <h3
                className={`font-medium text-lg ${
                  darkMode ? "text-blue-300" : "text-blue-700"
                }`}
              >
                Application Summary
              </h3>
              <p
                className={`mt-1 text-sm ${
                  darkMode ? "text-blue-200" : "text-blue-600"
                }`}
              >
                Please review all information carefully before final submission.
                You can go back to make changes if needed.
              </p>
            </div>
          </div>
        </div>

        <div className={sectionClassName}>
          <h3 className={sectionTitleClassName}>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm mr-3">
              1
            </span>
            Personal and Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <p className={labelClassName}>Full Name</p>
              <p className={`${valueClassName} mt-1`}>
                {formValues.title} {formValues.firstName}{" "}
                {formValues.middleName || ""} {formValues.lastName}
              </p>
            </div>

            <div>
              <p className={labelClassName}>Gender</p>
              <p className={`${valueClassName} mt-1`}>{formValues.gender}</p>
            </div>

            <div>
              <p className={labelClassName}>Email Address</p>
              <p className={`${valueClassName} mt-1 break-all`}>
                {formValues.email}
              </p>
            </div>

            <div>
              <p className={labelClassName}>Phone Number</p>
              <p className={`${valueClassName} mt-1`}>
                {formattedPhone || formValues.phone}
              </p>
            </div>

            <div>
              <p className={labelClassName}>Nationality</p>
              <p className={`${valueClassName} mt-1`}>
                {formValues.nationality}
              </p>
            </div>

            <div>
              <p className={labelClassName}>Country of Residence</p>
              <p className={`${valueClassName} mt-1`}>
                {formValues.countryOfResidence}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className={labelClassName}>Address</p>
              <p className={`${valueClassName} mt-1`}>{formValues.address}</p>
            </div>
          </div>
        </div>

        <div className={sectionClassName}>
          <h3 className={sectionTitleClassName}>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm mr-3">
              2
            </span>
            Career and Educational Background
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <p className={labelClassName}>Workplace</p>
              <p className={`${valueClassName} mt-1`}>{formValues.workplace}</p>
            </div>

            <div>
              <p className={labelClassName}>Position</p>
              <p className={`${valueClassName} mt-1`}>{formValues.position}</p>
            </div>

            <div className="md:col-span-2">
              <p className={labelClassName}>Education Level</p>
              <p className={`${valueClassName} mt-1`}>
                {formValues.educationLevel}
                {formValues.educationLevel === "Other" &&
                formValues.otherEducation
                  ? ` - ${formValues.otherEducation}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        <div className={sectionClassName}>
          <h3 className={sectionTitleClassName}>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm mr-3">
              3
            </span>
            Fellowship Context and Contribution
          </h3>

          <div className="grid grid-cols-1 gap-y-6">
            <div>
              <p className={labelClassName}>Professional Context</p>
              <p className={`${valueClassName} mt-1`}>
                {formValues.professionalContext}
                {formValues.professionalContext === "Other" &&
                formValues.otherContext
                  ? ` - ${formValues.otherContext}`
                  : ""}
              </p>
            </div>

            <div>
              <p className={labelClassName}>Expected Contribution</p>
              <p className={`${valueClassName} mt-1`}>
                {formValues.expectedContribution}
                {formValues.expectedContribution === "Other" &&
                formValues.otherContribution
                  ? ` - ${formValues.otherContribution}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        <div className={sectionClassName}>
          <h3 className={sectionTitleClassName}>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm mr-3">
              4
            </span>
            Fellowship Project Proposal
          </h3>

          <div className="grid grid-cols-1 gap-y-6">
            <div>
              <p className={labelClassName}>Project Type</p>
              <p className={`${valueClassName} mt-1`}>
                {formValues.projectType}
              </p>
            </div>

            <div>
              <p className={labelClassName}>Project Area</p>
              <p className={`${valueClassName} mt-1`}>
                {formValues.projectArea}
                {formValues.projectArea === "Other" &&
                formValues.otherProjectArea
                  ? ` - ${formValues.otherProjectArea}`
                  : ""}
              </p>
            </div>

            <div>
              <p className={labelClassName}>Project Summary</p>
              <div
                className={`${valueClassName} mt-1 p-4 rounded-md ${
                  darkMode ? "bg-gray-700/50" : "bg-gray-50"
                }`}
              >
                {formValues.projectSummary}
              </div>
            </div>

            <div>
              <p className={labelClassName}>Project Motivation</p>
              <div
                className={`${valueClassName} mt-1 p-4 rounded-md ${
                  darkMode ? "bg-gray-700/50" : "bg-gray-50"
                }`}
              >
                {formValues.projectMotivation}
              </div>
            </div>

            <div>
              <p className={labelClassName}>Estimated Budget</p>
              <div
                className={`${valueClassName} mt-1 p-4 rounded-md ${
                  darkMode ? "bg-gray-700/50" : "bg-gray-50"
                }`}
              >
                {formValues.estimatedBudget}
              </div>
            </div>

            <div>
              <p className={labelClassName}>Funding Sources</p>
              <div
                className={`${valueClassName} mt-1 p-4 rounded-md ${
                  darkMode ? "bg-gray-700/50" : "bg-gray-50"
                }`}
              >
                {formValues.fundingSources}
              </div>
            </div>

            <div>
              <p className={labelClassName}>Funding Secured</p>
              <div
                className={`${valueClassName} mt-1 p-4 rounded-md ${
                  darkMode ? "bg-gray-700/50" : "bg-gray-50"
                }`}
              >
                {formValues.fundingSecured}
              </div>
            </div>

            <div>
              <p className={labelClassName}>Sustainability Plan</p>
              <div
                className={`${valueClassName} mt-1 p-4 rounded-md ${
                  darkMode ? "bg-gray-700/50" : "bg-gray-50"
                }`}
              >
                {formValues.sustainabilityPlan}
              </div>
            </div>

            {formValues.fundingSecured === "Yes" && formValues.fundingProof && formValues.fundingProof.length > 0 && (
              <div>
                <p className={labelClassName}>Proof of Funding</p>
                <div
                  className={`${valueClassName} mt-1 p-4 rounded-md ${
                    darkMode ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formValues.fundingProof[0].name}
                  </div>
                </div>
              </div>
            )}

            {formValues.fundingSecured === "No" && formValues.fundingPlan && formValues.fundingPlan.length > 0 && (
              <div>
                <p className={labelClassName}>Funding Plan</p>
                <div
                  className={`${valueClassName} mt-1 p-4 rounded-md ${
                    darkMode ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formValues.fundingPlan[0].name}
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className={labelClassName}>CV/Resume</p>
              <div
                className={`mt-1 flex items-center ${
                  darkMode ? "text-blue-300" : "text-blue-600"
                }`}
              >
                {formValues.cvFile && formValues.cvFile.length > 0 ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span className={valueClassName}>
                      {formValues.cvFile[0].name}
                    </span>
                  </>
                ) : (
                  <span className={`${valueClassName} italic`}>
                    No file uploaded
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`p-5 rounded-lg mt-8 ${
            darkMode
              ? "bg-gray-700/30 border-gray-600"
              : "bg-gray-50 border-gray-200"
          } border`}
        >
          <div className="flex items-center">
            <img
              src="/alert-sign.png"
              alt="Alert"
              className="h-5 w-5 mr-2"
              style={{ minWidth: 20, minHeight: 20 }}
            />
            <p
              className={`text-sm font-medium ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              By submitting this application, you confirm that all information
              provided is accurate and complete.
            </p>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    register("phone", {
      required: "Phone number is required",
      validate: (value) => {
        try {
          return (
            isValidPhoneNumber(value, selectedCountryCode) ||
            "Please enter a valid phone number for the selected country"
          );
        } catch (e) {
          return "Please enter a valid phone number";
        }
      },
    });
  }, [register, selectedCountryCode]);

  const countriesArray = Object.entries(countries)
    .map(([code, countryData]) => ({
      code,
      name: countryData.name,
      phone: countryData.phone,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // React Select options for countries
  const countryOptions: CountryOption[] = countriesArray.map((country) => ({
    value: country.name,
    label: country.name,
    code: country.code,
    phone: country.phone,
  }));

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setPhoneNumber(rawValue);

    const formatter = new AsYouType(selectedCountryCode);
    const formatted = formatter.input(rawValue);
    setFormattedPhone(formatted);

    setValue("phone", formatted);
  };

  // Custom country option component with flag
  const CountryOption = ({ innerProps, data, isSelected }: { innerProps: any; data: CountryOption; isSelected: boolean }) => (
    <div
      {...innerProps}
      className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isSelected ? "bg-blue-50 dark:bg-blue-900/30" : ""
      }`}
      style={{
        backgroundColor: isSelected 
          ? (darkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.1)")
          : "transparent",
        color: darkMode ? "#f9fafb" : "#111827"
      }}
    >
      <span className="text-2xl mr-3 flex-shrink-0">
        {String.fromCodePoint(0x1F1E6 + (data.code.charCodeAt(0) - 65))}
        {String.fromCodePoint(0x1F1E6 + (data.code.charCodeAt(1) - 65))}
      </span>
      <span className="text-sm font-medium truncate" style={{ color: darkMode ? "#f9fafb" : "#111827" }}>
        {data.label}
      </span>
    </div>
  );

  // Custom single value component
  const CountryValue = ({ data }: { data: CountryOption }) => (
    <div className="flex items-center">
      <span className="text-xl mr-2 flex-shrink-0">
        {String.fromCodePoint(0x1F1E6 + (data.code.charCodeAt(0) - 65))}
        {String.fromCodePoint(0x1F1E6 + (data.code.charCodeAt(1) - 65))}
      </span>
      <span className="text-sm font-medium truncate" style={{ color: darkMode ? "#f9fafb" : "#111827" }}>
        {data.label}
      </span>
    </div>
  );

  const renderCountrySelect = (
    fieldName: "nationality" | "countryOfResidence",
    label: string
  ) => {
    const selectedCountry = countryOptions.find(
      (option) => option.value === watch(fieldName)
    );

    return (
      <div>
        <label className={labelClassName} htmlFor={fieldName}>
          {label} <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedCountry || null}
          onChange={(option: SingleValue<CountryOption>) => {
            setValue(fieldName, option?.value || "");
          }}
          options={countryOptions}
          components={{
            Option: CountryOption,
            SingleValue: CountryValue,
          }}
          placeholder="Select a country"
          isSearchable
          className="react-select-container"
          classNamePrefix="react-select"
          menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
          menuPosition="fixed"
          styles={{
            control: (base: any, state: any) => ({
              ...base,
              borderColor: errors[fieldName]
                ? "#ef4444"
                : darkMode
                ? "#4b5563"
                : "#d1d5db",
              backgroundColor: errors[fieldName]
                ? darkMode
                  ? "rgba(239, 68, 68, 0.2)"
                  : "#fef2f2"
                : darkMode
                ? "#374151"
                : "#ffffff",
              minHeight: "48px",
              borderRadius: "8px",
              boxShadow: state.isFocused
                ? `0 0 0 2px ${darkMode ? "#3b82f6" : "#3b82f6"}`
                : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              "&:hover": {
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              },
            }),
            option: (base: any, state: any) => ({
              ...base,
              backgroundColor: state.isSelected
                ? darkMode
                  ? "rgba(59, 130, 246, 0.3)"
                  : "rgba(59, 130, 246, 0.1)"
                : state.isFocused
                ? darkMode
                  ? "#374151"
                  : "#f3f4f6"
                : "transparent",
              color: darkMode ? "#f9fafb" : "#111827",
            }),
            singleValue: (base: any) => ({
              ...base,
              color: darkMode ? "#f9fafb" : "#111827",
            }),
            placeholder: (base: any) => ({
              ...base,
              color: darkMode ? "#9ca3af" : "#6b7280",
            }),
            input: (base: any) => ({
              ...base,
              color: darkMode ? "#f9fafb" : "#111827",
            }),
            menu: (base: any) => ({
              ...base,
              zIndex: 9999,
              backgroundColor: darkMode ? "#374151" : "#ffffff",
              border: `1px solid ${darkMode ? "#4b5563" : "#e5e7eb"}`,
            }),
            menuList: (base: any) => ({
              ...base,
              maxHeight: "200px",
              backgroundColor: darkMode ? "#374151" : "#ffffff",
            }),
          }}
        />
        {errors[fieldName] && (
          <p className="text-red-500 text-xs mt-1">
            {errors[fieldName]?.message}
          </p>
        )}
      </div>
    );
  };

  // Phone country options
  const phoneCountryOptions: CountryOption[] = Object.entries(countries)
    .map(([code, country]) => ({
      value: code,
      label: `${code} (+${country.phone})`,
      code: code,
      phone: country.phone,
      name: country.name,
    }))
    .sort((a, b) => a.name!.localeCompare(b.name!));

  // Custom phone country option component
  const PhoneCountryOption = ({ innerProps, data, isSelected }: { innerProps: any; data: CountryOption; isSelected: boolean }) => (
    <div
      {...innerProps}
      className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isSelected ? "bg-blue-50 dark:bg-blue-900/30" : ""
      }`}
      style={{
        backgroundColor: isSelected 
          ? (darkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.1)")
          : "transparent",
        color: darkMode ? "#f9fafb" : "#111827"
      }}
    >
      <span className="text-xl mr-3">
        {String.fromCodePoint(0x1F1E6 + (data.code.charCodeAt(0) - 65))}
        {String.fromCodePoint(0x1F1E6 + (data.code.charCodeAt(1) - 65))}
      </span>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate" style={{ color: darkMode ? "#f9fafb" : "#111827" }}>
          {data.label}
        </span>
        <span className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {data.name}
        </span>
      </div>
    </div>
  );

  // Custom phone country value component
  const PhoneCountryValue = ({ data }: { data: CountryOption }) => (
    <div className="flex items-center">
      <span className="text-lg mr-2 flex-shrink-0">
        {String.fromCodePoint(0x1F1E6 + (data.code.charCodeAt(0) - 65))}
        {String.fromCodePoint(0x1F1E6 + (data.code.charCodeAt(1) - 65))}
      </span>
      <span className="text-sm font-medium truncate" style={{ color: darkMode ? "#f9fafb" : "#111827" }}>
        {data.label}
      </span>
    </div>
  );

  const renderPhoneInput = () => {
    const selectedPhoneCountry = phoneCountryOptions.find(
      (option) => option.value === selectedCountryCode
    );

    return (
      <div className="mb-4">
        <label className={labelClassName} htmlFor="phone">
          Preferred Phone Number <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="w-2/5">
            <Select
              value={selectedPhoneCountry || null}
              onChange={(option: SingleValue<CountryOption>) => {
                setSelectedCountryCode(option?.value as CountryCode);
              }}
              options={phoneCountryOptions}
              components={{
                Option: PhoneCountryOption,
                SingleValue: PhoneCountryValue,
              }}
              placeholder="Country"
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
              menuPosition="fixed"
              styles={{
                control: (base: any, state: any) => ({
                  ...base,
                  borderColor: errors.phone
                    ? "#ef4444"
                    : darkMode
                    ? "#4b5563"
                    : "#d1d5db",
                  backgroundColor: errors.phone
                    ? darkMode
                      ? "rgba(239, 68, 68, 0.2)"
                      : "#fef2f2"
                    : darkMode
                    ? "#374151"
                    : "#ffffff",
                  minHeight: "48px",
                  borderRadius: "8px",
                  boxShadow: state.isFocused
                    ? `0 0 0 2px ${darkMode ? "#3b82f6" : "#3b82f6"}`
                    : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  "&:hover": {
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  },
                }),
                option: (base: any, state: any) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? darkMode
                      ? "rgba(59, 130, 246, 0.3)"
                      : "rgba(59, 130, 246, 0.1)"
                    : state.isFocused
                    ? darkMode
                      ? "#374151"
                      : "#f3f4f6"
                    : "transparent",
                  color: darkMode ? "#f9fafb" : "#111827",
                }),
                singleValue: (base: any) => ({
                  ...base,
                  color: darkMode ? "#f9fafb" : "#111827",
                }),
                placeholder: (base: any) => ({
                  ...base,
                  color: darkMode ? "#9ca3af" : "#6b7280",
                }),
                input: (base: any) => ({
                  ...base,
                  color: darkMode ? "#f9fafb" : "#111827",
                }),
                menu: (base: any) => ({
                  ...base,
                  zIndex: 9999,
                  backgroundColor: darkMode ? "#374151" : "#ffffff",
                  border: `1px solid ${darkMode ? "#4b5563" : "#e5e7eb"}`,
                }),
                menuList: (base: any) => ({
                  ...base,
                  maxHeight: "200px",
                  backgroundColor: darkMode ? "#374151" : "#ffffff",
                }),
              }}
            />
          </div>
          <div className="w-3/5">
            <input
              type="tel"
              id="phone"
              className={inputClassName("phone")}
              placeholder="Phone number"
              value={phoneNumber}
              onChange={handlePhoneChange}
            />
          </div>
        </div>
        {formattedPhone && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-300 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Formatted: {formattedPhone}
            </p>
          </div>
        )}
        {errors.phone && (
          <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
        )}
      </div>
    );
  };

  if (submitSuccess) {
    return (
      <div
        className={`max-w-3xl mx-auto p-6 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
        } rounded-lg shadow-md border`}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <svg
              className="w-8 h-8 text-green-600"
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
          </div>
          <h2
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-800"
            } mb-3`}
          >
            Application Submitted Successfully!
          </h2>
          <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mb-6`}>
            Thank you for your submission. Your application has been received
            and will be reviewed by our team.
          </p>
          <div
            className={`${
              darkMode
                ? "bg-blue-900 border-blue-800"
                : "bg-blue-50 border-blue-100"
            } p-4 rounded-lg border mb-6`}
          >
            <h3
              className={`text-md font-medium ${
                darkMode ? "text-blue-300" : "text-blue-800"
              } mb-2`}
            >
              Next Steps
            </h3>
            <p
              className={`text-sm ${
                darkMode ? "text-blue-200" : "text-blue-700"
              } mb-3`}
            >
              Your application will be reviewed by our team. You will receive an
              email notification when there's an update to your application
              status.
            </p>
            <p
              className={`text-sm ${
                darkMode ? "text-blue-200" : "text-blue-700"
              }`}
            >
              If you are selected for the next round, you will need to submit
              additional documents including a detailed project proposal and
              recommendation letters.
            </p>
          </div>

          <div
            className={`${
              darkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-gray-50 border-gray-200"
            } p-4 rounded-lg border`}
          >
            <h3
              className={`text-md font-medium ${
                darkMode ? "text-gray-200" : "text-gray-700"
              } mb-2`}
            >
              Application Reference
            </h3>
            <p
              className={`text-sm ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              We recommend saving this page for your records. You will also
              receive a confirmation email shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const inputClassName = (fieldName: keyof ApplicationFormData) =>
    `w-full border ${
      errors[fieldName]
        ? darkMode
          ? "border-red-500 bg-red-900/20 text-red-100 placeholder-red-300"
          : "border-red-500 bg-red-50 text-red-900 placeholder-red-500"
        : darkMode
        ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400"
        : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
    } rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${
      darkMode
        ? "focus:ring-blue-500 focus:border-blue-500"
        : "focus:ring-blue-500 focus:border-blue-500"
    } transition-all duration-200 text-sm shadow-sm hover:shadow-md`;

  const selectClassName = (fieldName: keyof ApplicationFormData) =>
    `w-full border ${
      errors[fieldName]
        ? darkMode
          ? "border-red-500 bg-red-900/20 text-red-100"
          : "border-red-500 bg-red-50 text-red-900"
        : darkMode
        ? "border-gray-600 bg-gray-700 text-gray-100"
        : "border-gray-300 bg-white text-gray-900"
    } rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${
      darkMode
        ? "focus:ring-blue-500 focus:border-blue-500"
        : "focus:ring-blue-500 focus:border-blue-500"
    } transition-all duration-200 text-sm shadow-sm hover:shadow-md appearance-none`;

  const labelClassName = `block ${
    darkMode ? "text-white" : "text-gray-800"
  } text-sm font-semibold mb-2`;

  const radioClassName = `form-radio h-4 w-4 ${
    darkMode ? "text-blue-500" : "text-blue-600"
  } focus:ring-2 focus:ring-blue-500`;

  const radioLabelClassName = `flex items-center p-3 border ${
    darkMode
      ? "border-gray-600 hover:bg-gray-700/70 hover:border-gray-500"
      : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
  } transition-all duration-200 cursor-pointer rounded-lg shadow-sm hover:shadow-md`;

  const radioTextClassName = `ml-3 ${
    darkMode ? "text-gray-200" : "text-gray-800"
  } text-sm font-medium`;

  const isCurrentStepValid = () => {
    const values = watch();

    const stepRequiredFields: Record<
      number,
      Array<{ field: string; label: string }>
    > = {
      1: [
        { field: "title", label: "Title" },
        { field: "firstName", label: "First Name" },
        { field: "lastName", label: "Last Name" },
        { field: "gender", label: "Gender" },
        { field: "email", label: "Email Address" },
        { field: "nationality", label: "Nationality" },
        { field: "countryOfResidence", label: "Country of Residence" },
        { field: "phone", label: "Phone Number" },
        { field: "address", label: "Address" },
      ],
      2: [
        { field: "workplace", label: "Workplace" },
        { field: "position", label: "Position" },
        { field: "educationLevel", label: "Education Level" },
      ],
      3: [
        { field: "professionalContext", label: "Professional Context" },
        { field: "expectedContribution", label: "Expected Contribution" },
      ],
      4: [
        { field: "projectType", label: "Project Type" },
        { field: "projectArea", label: "Project Area" },
        { field: "projectSummary", label: "Project Summary" },
        { field: "projectMotivation", label: "Project Motivation" },
        { field: "estimatedBudget", label: "Estimated Budget" },
        { field: "fundingSources", label: "Funding Sources" },
        { field: "fundingSecured", label: "Funding Secured" },
        { field: "sustainabilityPlan", label: "Sustainability Plan" },
      ],
    };

    const currentRequiredFields = stepRequiredFields[currentStep] || [];

    const missing: string[] = [];

    const isValid = currentRequiredFields.every(({ field, label }) => {
      if (field === "otherEducation" && values.educationLevel === "Other") {
        const isValid = !!values.otherEducation;
        if (!isValid) missing.push("Other Education Level");
        return isValid;
      }
      if (field === "otherContext" && values.professionalContext === "Other") {
        const isValid = !!values.otherContext;
        if (!isValid) missing.push("Other Professional Context");
        return isValid;
      }
      if (
        field === "otherContribution" &&
        values.expectedContribution === "Other"
      ) {
        const isValid = !!values.otherContribution;
        if (!isValid) missing.push("Other Expected Contribution");
        return isValid;
      }
      if (field === "otherProjectArea" && values.projectArea === "Other") {
        const isValid = !!values.otherProjectArea;
        if (!isValid) missing.push("Other Project Area");
        return isValid;
      }

      const isValid = !!values[field as keyof ApplicationFormData];
      if (!isValid) missing.push(label);
      return isValid;
    });

    return { isValid, missing };
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
      <div className="mb-4">
        <div
          className={`w-full ${
            darkMode ? "bg-gray-700" : "bg-gray-200"
          } rounded-full h-2`}
        >
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div
          className={`flex justify-between mt-1 text-xs ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          <span className="font-medium">
            Step {currentStep} of {totalSteps}
          </span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% completed</span>
        </div>
      </div>

      {submitError && (
        <div
          className={`mb-4 p-3 ${
            darkMode
              ? "bg-red-900/30 border-red-800"
              : "bg-red-50 border-red-200"
          } border rounded-md shadow-sm`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className={`h-5 w-5 ${
                  darkMode ? "text-red-400" : "text-red-500"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3
                className={`text-sm font-medium ${
                  darkMode ? "text-red-300" : "text-red-800"
                }`}
              >
                Error
              </h3>
              <p
                className={`mt-1 text-sm ${
                  darkMode ? "text-red-200" : "text-red-700"
                }`}
              >
                {submitError}
              </p>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setSubmitError("")}
                  className={`text-xs font-medium ${
                    darkMode
                      ? "text-red-300 hover:text-red-200"
                      : "text-red-700 hover:text-red-800"
                  } focus:outline-none underline`}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <>
          <FormSection
            title="Section 1: Personal and Contact Information"
            darkMode={darkMode}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="md:col-span-1">
                <label className={labelClassName} htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </label>
                <select
                  id="title"
                  className={selectClassName("title")}
                  {...register("title", { required: "Title is required" })}
                >
                  <option value="">Select</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Prof.">Prof.</option>
                </select>
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-1">
                <label className={labelClassName} htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  className={inputClassName("firstName")}
                  placeholder="First name"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-1">
                <label className={labelClassName} htmlFor="middleName">
                  Middle Name
                </label>
                <input
                  type="text"
                  id="middleName"
                  className={inputClassName("middleName")}
                  placeholder="Middle name"
                  {...register("middleName")}
                />
              </div>

              <div className="md:col-span-1">
                <label className={labelClassName} htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  className={inputClassName("lastName")}
                  placeholder="Last name"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className={labelClassName}>
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4 mt-1">
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Female"
                    {...register("gender", { required: "Gender is required" })}
                  />
                  <span className={radioTextClassName}>Female</span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Male"
                    {...register("gender", { required: "Gender is required" })}
                  />
                  <span className={radioTextClassName}>Male</span>
                </label>
              </div>
              {errors.gender && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.gender.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className={labelClassName} htmlFor="email">
                Preferred Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                className={inputClassName("email")}
                placeholder="your.email@example.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Please enter a valid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {renderCountrySelect("nationality", "Nationality")}
              {renderCountrySelect(
                "countryOfResidence",
                "Country of Residence"
              )}
            </div>

            {renderPhoneInput()}

            <div className="mb-4">
              <label className={labelClassName} htmlFor="address">
                Current Residence Address{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                className={inputClassName("address")}
                placeholder="Your current address"
                {...register("address", { required: "Address is required" })}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>
          </FormSection>
        </>
      )}

      {currentStep === 2 && (
        <>
          <FormSection
            title="Section 2: Career and Educational Background"
            darkMode={darkMode}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className={labelClassName} htmlFor="workplace">
                  Workplace <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="workplace"
                  className={inputClassName("workplace")}
                  placeholder="Organization name"
                  {...register("workplace", {
                    required: "Workplace is required",
                  })}
                />
                {errors.workplace && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.workplace.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClassName} htmlFor="position">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="position"
                  className={inputClassName("position")}
                  placeholder="Your job title"
                  {...register("position", {
                    required: "Position is required",
                  })}
                />
                {errors.position && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.position.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className={labelClassName}>
                Highest Degree Earned <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Bachelor's Degree"
                    {...register("educationLevel", {
                      required: "Education level is required",
                    })}
                  />
                  <span className={radioTextClassName}>Bachelor's Degree</span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Master's Degree"
                    {...register("educationLevel", {
                      required: "Education level is required",
                    })}
                  />
                  <span className={radioTextClassName}>Master's Degree</span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="PhD/Doctorate"
                    {...register("educationLevel", {
                      required: "Education level is required",
                    })}
                  />
                  <span className={radioTextClassName}>PhD/Doctorate</span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Post-Doctoral Training"
                    {...register("educationLevel", {
                      required: "Education level is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Post-Doctoral Training
                  </span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Other"
                    {...register("educationLevel", {
                      required: "Education level is required",
                    })}
                  />
                  <span className={radioTextClassName}>Other</span>
                </label>
              </div>
              {errors.educationLevel && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.educationLevel.message}
                </p>
              )}
            </div>

            {watchEducationLevel === "Other" && (
              <div className="mb-4">
                <label className={labelClassName} htmlFor="otherEducation">
                  Please specify your education level{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="otherEducation"
                  className={inputClassName("otherEducation")}
                  placeholder="Your education level"
                  {...register("otherEducation", {
                    required:
                      watchEducationLevel === "Other"
                        ? "Please specify your education level"
                        : false,
                  })}
                />
                {errors.otherEducation && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.otherEducation.message}
                  </p>
                )}
              </div>
            )}
          </FormSection>
        </>
      )}

      {currentStep === 3 && (
        <>
          <FormSection
            title="Section 3: Fellowship Context and Contribution"
            darkMode={darkMode}
          >
            <div className="mb-4">
              <label className={labelClassName}>
                Current Professional Context{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Affiliated with a university, research institution"
                    {...register("professionalContext", {
                      required: "Professional context is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Affiliated with a university, research institution
                  </span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Funded by a research grant or innovation project"
                    {...register("professionalContext", {
                      required: "Professional context is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Funded by a research grant or innovation project
                  </span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Working in a healthcare facility"
                    {...register("professionalContext", {
                      required: "Professional context is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Working in a healthcare facility
                  </span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Working in a government institution"
                    {...register("professionalContext", {
                      required: "Professional context is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Working in a government institution
                  </span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Other"
                    {...register("professionalContext", {
                      required: "Professional context is required",
                    })}
                  />
                  <span className={radioTextClassName}>Other</span>
                </label>
              </div>
              {errors.professionalContext && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.professionalContext.message}
                </p>
              )}
            </div>

            {watchProfessionalContext === "Other" && (
              <div className="mb-4">
                <label className={labelClassName} htmlFor="otherContext">
                  Please specify your professional context{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="otherContext"
                  className={inputClassName("otherContext")}
                  placeholder="Your professional context"
                  {...register("otherContext", {
                    required:
                      watchProfessionalContext === "Other"
                        ? "Please specify your professional context"
                        : false,
                  })}
                />
                {errors.otherContext && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.otherContext.message}
                  </p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className={labelClassName}>
                Expected Contribution <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Technical Support"
                    {...register("expectedContribution", {
                      required: "Expected contribution is required",
                    })}
                  />
                  <span className={radioTextClassName}>Technical Support</span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Research & Analysis"
                    {...register("expectedContribution", {
                      required: "Expected contribution is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Research & Analysis
                  </span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Policy Development"
                    {...register("expectedContribution", {
                      required: "Expected contribution is required",
                    })}
                  />
                  <span className={radioTextClassName}>Policy Development</span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Capacity Building"
                    {...register("expectedContribution", {
                      required: "Expected contribution is required",
                    })}
                  />
                  <span className={radioTextClassName}>Capacity Building</span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Other"
                    {...register("expectedContribution", {
                      required: "Expected contribution is required",
                    })}
                  />
                  <span className={radioTextClassName}>Other</span>
                </label>
              </div>
              {errors.expectedContribution && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.expectedContribution.message}
                </p>
              )}
            </div>

            {watchExpectedContribution === "Other" && (
              <div className="mb-4">
                <label className={labelClassName} htmlFor="otherContribution">
                  Please specify your expected contribution{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="otherContribution"
                  className={inputClassName("otherContribution")}
                  placeholder="Your expected contribution"
                  {...register("otherContribution", {
                    required:
                      watchExpectedContribution === "Other"
                        ? "Please specify your expected contribution"
                        : false,
                  })}
                />
                {errors.otherContribution && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.otherContribution.message}
                  </p>
                )}
              </div>
            )}
          </FormSection>
        </>
      )}

      {currentStep === 4 && (
        <>
          <FormSection
            title="Section 4: Fellowship Project Proposal"
            darkMode={darkMode}
          >
            <div className="mb-4">
              <label className={labelClassName}>
                Project Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Independent Project"
                    {...register("projectType", {
                      required: "Project type is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Independent Project
                  </span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Contribution to an Ongoing Ministry of Health Project"
                    {...register("projectType", {
                      required: "Project type is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Contribution to an Ongoing Ministry of Health Project
                  </span>
                </label>
              </div>
              {errors.projectType && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.projectType.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className={labelClassName}>
                Project Area <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Biomedical Research and Innovation"
                    {...register("projectArea", {
                      required: "Project area is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Biomedical Research and Innovation
                  </span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Health Workforce Development"
                    {...register("projectArea", {
                      required: "Project area is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Health Workforce Development
                  </span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Public Health Surveillance"
                    {...register("projectArea", {
                      required: "Project area is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Public Health Surveillance
                  </span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Health Financing, Economics and Supply Chain"
                    {...register("projectArea", {
                      required: "Project area is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Health Financing, Economics and Supply Chain
                  </span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Digital Health and Artificial Intelligence"
                    {...register("projectArea", {
                      required: "Project area is required",
                    })}
                  />
                  <span className={radioTextClassName}>
                    Digital Health and Artificial Intelligence
                  </span>
                </label>
                <label className={radioLabelClassName}>
                  <input
                    type="radio"
                    className={radioClassName}
                    value="Other"
                    {...register("projectArea", {
                      required: "Project area is required",
                    })}
                  />
                  <span className={radioTextClassName}>Other</span>
                </label>
              </div>
              {errors.projectArea && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.projectArea.message}
                </p>
              )}
            </div>

            {watchProjectArea === "Other" && (
              <div className="mb-4">
                <label className={labelClassName} htmlFor="otherProjectArea">
                  Please specify your project area{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="otherProjectArea"
                  className={inputClassName("otherProjectArea")}
                  placeholder="Your project area"
                  {...register("otherProjectArea", {
                    required:
                      watchProjectArea === "Other"
                        ? "Please specify your project area"
                        : false,
                  })}
                />
                {errors.otherProjectArea && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.otherProjectArea.message}
                  </p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className={labelClassName} htmlFor="projectSummary">
                Brief Project Summary <span className="text-red-500">*</span>
                <span className="text-gray-500 text-xs ml-1">
                  (250 words max)
                </span>
              </label>
              <textarea
                id="projectSummary"
                rows={4}
                className={inputClassName("projectSummary")}
                placeholder="Provide a brief summary of your proposed project"
                {...register("projectSummary", {
                  required: "Project summary is required",
                  maxLength: {
                    value: 1500,
                    message: "Summary should not exceed 250 words",
                  },
                })}
              ></textarea>
              {errors.projectSummary && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.projectSummary.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className={labelClassName} htmlFor="projectMotivation">
                Motivation for conducting Project in Rwanda{" "}
                <span className="text-red-500">*</span>
                <span className="text-gray-500 text-xs ml-1">
                  (250 words max)
                </span>
              </label>
              <textarea
                id="projectMotivation"
                rows={4}
                className={inputClassName("projectMotivation")}
                placeholder="Explain why you want to conduct this project in Rwanda"
                {...register("projectMotivation", {
                  required: "Project motivation is required",
                  maxLength: {
                    value: 1500,
                    message: "Motivation should not exceed 250 words",
                  },
                })}
              ></textarea>
              {errors.projectMotivation && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.projectMotivation.message}
                </p>
              )}
            </div>

            {/* Project Funding and Sustainability Section */}
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-4 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>
                6. Project funding source and sustainability:
              </h3>
              
              <div className="mb-4">
                <label className={labelClassName} htmlFor="estimatedBudget">
                  What is the estimated budget for the project?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="estimatedBudget"
                  className={inputClassName("estimatedBudget")}
                  placeholder="e.g., $50,000 USD or 50,000,000 RWF"
                  {...register("estimatedBudget", {
                    required: "Estimated budget is required",
                  })}
                />
                {errors.estimatedBudget && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.estimatedBudget.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className={labelClassName} htmlFor="fundingSources">
                  What are the potential or secured sources of funding?{" "}
                  <span className="text-red-500">*</span>
                  <span className="text-gray-500 text-xs ml-1">
                    (e.g., grants, institutional support, personal contributions, partnerships)
                  </span>
                </label>
                <textarea
                  id="fundingSources"
                  rows={3}
                  className={inputClassName("fundingSources")}
                  placeholder="Describe your funding sources in detail"
                  {...register("fundingSources", {
                    required: "Funding sources are required",
                  })}
                ></textarea>
                {errors.fundingSources && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.fundingSources.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className={labelClassName}>
                  Is funding secured? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className={radioLabelClassName}>
                    <input
                      type="radio"
                      className={radioClassName}
                      value="Yes"
                      {...register("fundingSecured", {
                        required: "Please specify if funding is secured",
                      })}
                    />
                    <span className={radioTextClassName}>Yes</span>
                  </label>
                  <label className={radioLabelClassName}>
                    <input
                      type="radio"
                      className={radioClassName}
                      value="No"
                      {...register("fundingSecured", {
                        required: "Please specify if funding is secured",
                      })}
                    />
                    <span className={radioTextClassName}>No</span>
                  </label>
                </div>
                {errors.fundingSecured && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.fundingSecured.message}
                  </p>
                )}
              </div>

              {/* Conditional file upload based on funding status */}
              {watch("fundingSecured") === "Yes" && (
                <div className="mb-4">
                  <label className={labelClassName} htmlFor="fundingProof">
                    Proof of Funding <span className="text-red-500">*</span>
                    <span className="text-gray-500 text-xs ml-1">
                      (PDF, DOC, or DOCX format, max 10MB)
                    </span>
                  </label>
                  <div className="mt-1 flex items-center">
                    <label
                      htmlFor="fundingProof"
                      className={`flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer`}
                    >
                      <svg
                        className="h-5 w-5 text-gray-400 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        ></path>
                      </svg>
                      Choose funding proof file
                    </label>
                    <input
                      id="fundingProof"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx"
                      {...register("fundingProof", {
                        required: watch("fundingSecured") === "Yes" ? "Proof of funding is required when funding is secured" : false,
                      })}
                    />
                  </div>
                  {errors.fundingProof && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.fundingProof.message}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Upload documents such as grant letters, funding agreements, or other proof of secured funding.
                  </p>
                </div>
              )}

              {watch("fundingSecured") === "No" && (
                <div className="mb-4">
                  <label className={labelClassName} htmlFor="fundingPlan">
                    Plan to Obtain Financial Support <span className="text-red-500">*</span>
                    <span className="text-gray-500 text-xs ml-1">
                      (PDF, DOC, or DOCX format, max 10MB)
                    </span>
                  </label>
                  <div className="mt-1 flex items-center">
                    <label
                      htmlFor="fundingPlan"
                      className={`flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer`}
                    >
                      <svg
                        className="h-5 w-5 text-gray-400 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        ></path>
                      </svg>
                      Choose funding plan file
                    </label>
                    <input
                      id="fundingPlan"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx"
                      {...register("fundingPlan", {
                        required: watch("fundingSecured") === "No" ? "Funding plan is required when funding is not secured" : false,
                      })}
                    />
                  </div>
                  {errors.fundingPlan && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.fundingPlan.message}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Upload your detailed plan for obtaining financial support, including potential funding sources and strategies.
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className={labelClassName} htmlFor="sustainabilityPlan">
                  How will the project be sustained beyond the fellowship period?{" "}
                  <span className="text-red-500">*</span>
                  <span className="text-gray-500 text-xs ml-1">
                    (e.g., additional funding strategies, partnerships, integration into existing programs)
                  </span>
                </label>
                <textarea
                  id="sustainabilityPlan"
                  rows={4}
                  className={inputClassName("sustainabilityPlan")}
                  placeholder="Describe your sustainability plan in detail"
                  {...register("sustainabilityPlan", {
                    required: "Sustainability plan is required",
                  })}
                ></textarea>
                {errors.sustainabilityPlan && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.sustainabilityPlan.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className={labelClassName} htmlFor="cvFile">
                CV/Resume <span className="text-red-500">*</span>
                <span className="text-gray-500 text-xs ml-1">
                  (PDF format, max 2MB)
                </span>
              </label>
              <div className="mt-1 flex items-center">
                <label
                  htmlFor="cvFile"
                  className={`flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer`}
                >
                  <svg
                    className="h-5 w-5 text-gray-400 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    ></path>
                  </svg>
                  Choose file
                </label>
                <input
                  id="cvFile"
                  type="file"
                  className="sr-only"
                  accept=".pdf"
                  {...register("cvFile", {
                    required: "CV/Resume is required",
                  })}
                />
              </div>
              {errors.cvFile && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.cvFile.message}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Your CV/Resume should include your education, work experience,
                publications, and any relevant achievements.
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Next steps if selected:
              </h3>
              <p className="text-xs text-blue-700 mb-2">
                If your application is selected for the second round, you will
                be required to submit:
              </p>
              <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
                <li>A detailed project proposal (5-10 pages)</li>
                <li>Two letters of recommendation</li>
                <li>Proof of institutional affiliation (if applicable)</li>
                <li>Additional supporting documents as requested</li>
              </ul>
            </div>
          </FormSection>
        </>
      )}

      {currentStep === 5 && (
        <FormSection title="Application Summary" darkMode={darkMode}>
          <ApplicationSummary />
        </FormSection>
      )}

      <div className="flex justify-between mt-6">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className={`px-4 py-2 rounded-md border ${
              darkMode
                ? "border-gray-600 text-gray-300 hover:bg-gray-700/70"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            } transition-all duration-200 font-medium flex items-center shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              darkMode ? "focus:ring-gray-500" : "focus:ring-gray-400"
            }`}
            disabled={isSubmitting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous
          </button>
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={nextStep}
            className={`ml-auto px-4 py-2 rounded-md ${
              !isCurrentStepValid().isValid
                ? "bg-gray-400 cursor-not-allowed text-white"
                : darkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            } transition-all duration-200 font-medium flex items-center shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            disabled={!isCurrentStepValid().isValid}
          >
            {currentStep === 4 ? (
              <>
                Review Application
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-1.5"
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
              </>
            ) : (
              <>
                Next
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowSubmissionModal(true)}
            className={`ml-auto px-4 py-2 rounded-md ${
                isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : darkMode
                ? "bg-green-600 hover:bg-green-700"
                : "bg-green-600 hover:bg-green-700"
            } text-white transition-all duration-200 font-medium flex items-center shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
              disabled={isSubmitting}
          >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                  Submitting...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Submit Application
                </>
              )}
            </button>
        )}
      </div>

      <div
        className={`mt-6 ${
          darkMode
            ? "bg-blue-900/30 border-blue-800"
            : "bg-blue-50 border-blue-100"
        } p-3 rounded-md border`}
      >
        <h3
          className={`text-sm font-medium ${
            darkMode ? "text-blue-300" : "text-blue-800"
          } mb-2 flex items-center`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
              clipRule="evenodd"
            />
          </svg>
          Tips for completing this section
        </h3>
        <ul
          className={`text-xs ${
            darkMode ? "text-blue-200" : "text-blue-700"
          } list-disc list-inside space-y-1`}
        >
          <li>All fields marked with an asterisk (*) are required</li>
          <li>
            You can save your progress and return later to complete the
            application
          </li>
          <li>
            Make sure your contact information is accurate as we'll use it to
            communicate with you
          </li>
        </ul>
      </div>

      {/* Submission Confirmation Modal */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Submit Application
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  Confirm your application submission
                </p>
              </div>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Ready to Submit
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Your application will be reviewed by our team
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-6`}>
                <h5 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  What happens next?
                </h5>
                <ul className={`text-xs space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>• Your application will be reviewed by our team</li>
                  <li>• You'll receive an email confirmation shortly</li>
                  <li>• We'll notify you of any status updates</li>
                  <li>• If selected, you'll need to submit additional documents</li>
                </ul>
              </div>

              <div className={`p-4 rounded-md border ${darkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-start">
                  <img
                    src="/alert-sign.png"
                    alt="Alert"
                    className="w-5 h-5 mr-2 mt-0.5"
                  />
                  <p className={`text-xs ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                    By submitting, you confirm that all information provided is accurate and complete.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowSubmissionModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md border ${
                  darkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmission}
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white transition-colors flex items-center`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default ApplicationForm;
