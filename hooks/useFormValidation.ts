"use client";

import { useState } from "react";

export function useFormValidation() {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateField = (
    name: string,
    value: string,
    rules: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      custom?: (value: string) => boolean;
      message?: string;
    }
  ) => {
    if (rules.required && !value) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: rules.message || "This field is required",
      }));
      return false;
    }

    if (rules.minLength && value.length < rules.minLength) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: rules.message || `Minimum length is ${rules.minLength} characters`,
      }));
      return false;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: rules.message || `Maximum length is ${rules.maxLength} characters`,
      }));
      return false;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: rules.message || "Invalid format",
      }));
      return false;
    }

    if (rules.custom && !rules.custom(value)) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: rules.message || "Invalid value",
      }));
      return false;
    }

    // Clear error if validation passes
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
    
    return true;
  };

  const validateForm = (
    formData: Record<string, string>,
    validationRules: Record<string, any>
  ) => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    Object.keys(validationRules).forEach((fieldName) => {
      const value = formData[fieldName] || "";
      const rules = validationRules[fieldName];

      if (rules.required && !value) {
        newErrors[fieldName] = rules.message || "This field is required";
        isValid = false;
      } else if (rules.minLength && value.length < rules.minLength) {
        newErrors[fieldName] = rules.message || `Minimum length is ${rules.minLength} characters`;
        isValid = false;
      } else if (rules.maxLength && value.length > rules.maxLength) {
        newErrors[fieldName] = rules.message || `Maximum length is ${rules.maxLength} characters`;
        isValid = false;
      } else if (rules.pattern && !rules.pattern.test(value)) {
        newErrors[fieldName] = rules.message || "Invalid format";
        isValid = false;
      } else if (rules.custom && !rules.custom(value)) {
        newErrors[fieldName] = rules.message || "Invalid value";
        isValid = false;
      }
    });

    setValidationErrors(newErrors);
    return isValid;
  };

  return {
    validationErrors,
    validateField,
    validateForm,
    setValidationErrors,
  };
} 