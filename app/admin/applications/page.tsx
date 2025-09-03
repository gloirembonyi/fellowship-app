"use client";

import { useState, useEffect } from "react";
import { useDarkMode } from "../layout";
import Link from "next/link";

type Application = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  nationality: string;
  countryOfResidence: string;
  projectArea: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
};

// Avatar component for user initials
const Avatar = ({ name, className = "" }: { name: string; className?: string }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-red-500", 
    "bg-yellow-500", "bg-indigo-500", "bg-pink-500", "bg-teal-500"
  ];
  
  const colorIndex = name.length % colors.length;
  
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${colors[colorIndex]} ${className}`}>
      {initials}
    </div>
  );
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { darkMode } = useDarkMode();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    applicationId: '',
    applicationName: '',
    rejectionReason: ''
  });
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [fundingModal, setFundingModal] = useState({
    isOpen: false,
    customMessage: '',
    selectedIds: [] as string[],
    showApplicantSelector: false,
    filterName: '',
    filterDate: '',
    filterStatus: 'all',
    filterProjectArea: 'all',
    includeLink: true,
    customLink: '',
    aiPrompt: '',
    generatingAI: false,
    showPromptSuggestions: false,
    hasDefaultMessage: false
  });
  const [processingFunding, setProcessingFunding] = useState(false);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [deletingApplicationId, setDeletingApplicationId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch applications with pagination
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: (currentPage ?? 1).toString(),
          limit: (itemsPerPage ?? 10).toString(),
          status: statusFilter !== "all" ? statusFilter : "",
          search: searchTerm,
        });

        const response = await fetch(`/api/admin/applications?${queryParams}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }

        const data = await response.json();
        setApplications(data.applications);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
        setError("");
      } catch (err) {
        console.error("Error fetching applications:", err);
        setError("Failed to load applications. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [currentPage, itemsPerPage, statusFilter, searchTerm]);

  // Fetch stats for filter counts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/applications/stats', {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  // Check current user role
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch("/api/auth/user");
        const data = await response.json();
        
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    };
    
    checkUserRole();
  }, []);

  // Delete application function
  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    setDeletingApplicationId(applicationId);
    setError('');

    try {
      const response = await fetch(`/api/admin/applications/delete?id=${applicationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove the deleted application from the list
        setApplications(applications.filter(app => app.id !== applicationId));
        setTotalCount(totalCount - 1);
        
        // Refresh stats
        const statsResponse = await fetch('/api/admin/applications/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } else {
        setError(data.message || 'Failed to delete application');
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      setError('Failed to delete application. Please try again.');
    } finally {
      setDeletingApplicationId(null);
    }
  };

  // Update application status
  const updateApplicationStatus = async (
    id: string,
    status: "pending" | "approved" | "rejected",
    rejectionReason?: string
  ) => {
    try {
      const response = await fetch(`/api/admin/applications/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status,
          ...(status === "rejected" && rejectionReason && { rejectionReason })
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update application status");
      }

      // Update the application in the current list
      setApplications(
        applications.map((app) => (app.id === id ? { ...app, status } : app))
      );

      // Refresh stats
      const statsResponse = await fetch('/api/admin/applications/stats');
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }

      // Close rejection modal if it was open
      if (status === "rejected") {
        setRejectionModal({
          isOpen: false,
          applicationId: '',
          applicationName: '',
          rejectionReason: ''
        });
      }
    } catch (err) {
      console.error("Error updating application status:", err);
      alert("Failed to update status. Please try again.");
    }
  };

  // Handle reject button click
  const handleRejectClick = (application: Application) => {
    setRejectionModal({
      isOpen: true,
      applicationId: application.id,
      applicationName: `${application.firstName} ${application.lastName}`,
      rejectionReason: ''
    });
  };

  // Handle rejection modal submit
  const handleRejectionSubmit = () => {
    if (!rejectionModal.rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    updateApplicationStatus(rejectionModal.applicationId, "rejected", rejectionModal.rejectionReason);
  };

  // Request funding information
  const requestFundingInfo = async (applicationId: string) => {
    if (!confirm("Are you sure you want to send a funding information request to this applicant?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(`/api/admin/applications/${applicationId}/request-funding-info`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert("Funding information request sent successfully!");
      } else {
        alert(data.message || "Failed to send funding information request. Please try again.");
      }
    } catch (err) {
      console.error("Error requesting funding info:", err);
      alert("An error occurred while sending the request. Please try again.");
    }
  };

  // Handle application selection
  const handleSelectApplication = (applicationId: string) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedApplications.size === applications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(applications.map(app => app.id)));
    }
  };

  // Fetch all applications for modal selector
  const fetchAllApplications = async () => {
    try {
      const response = await fetch('/api/admin/applications?limit=1000', {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setAllApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching all applications:', error);
    }
  };

  // Open funding modal
  const openFundingModal = () => {
    if (selectedApplications.size === 0) {
      alert("Please select at least one application to send funding requests.");
      return;
    }
    fetchAllApplications(); // Fetch all applications for the modal
    setFundingModal({
      isOpen: true,
      customMessage: getDefaultMessage(),
      selectedIds: Array.from(selectedApplications),
      showApplicantSelector: false,
      filterName: '',
      filterDate: '',
      filterStatus: 'all',
      filterProjectArea: 'all',
      includeLink: true,
      customLink: '',
      aiPrompt: '',
      generatingAI: false,
      showPromptSuggestions: false,
      hasDefaultMessage: true
    });
  };

  // Filter applications based on modal filters
  const getFilteredApplications = () => {
    return allApplications.filter(app => {
      const matchesName = !fundingModal.filterName || 
        `${app.firstName} ${app.lastName}`.toLowerCase().includes(fundingModal.filterName.toLowerCase()) ||
        app.email.toLowerCase().includes(fundingModal.filterName.toLowerCase());
      
      const matchesDate = !fundingModal.filterDate || 
        new Date(app.submittedAt).toDateString() === new Date(fundingModal.filterDate).toDateString();
      
      const matchesStatus = fundingModal.filterStatus === 'all' || app.status === fundingModal.filterStatus;
      
      const matchesProjectArea = fundingModal.filterProjectArea === 'all' || app.projectArea === fundingModal.filterProjectArea;
      
      return matchesName && matchesDate && matchesStatus && matchesProjectArea;
    });
  };

  // Add/remove application from modal selection
  const toggleModalApplicationSelection = (applicationId: string) => {
    const newSelectedIds = fundingModal.selectedIds.includes(applicationId)
      ? fundingModal.selectedIds.filter(id => id !== applicationId)
      : [...fundingModal.selectedIds, applicationId];
    
    setFundingModal({
      ...fundingModal,
      selectedIds: newSelectedIds
    });
  };

  // Select all filtered applications in modal
  const selectAllFilteredApplications = () => {
    const filteredApps = getFilteredApplications();
    const allFilteredIds = filteredApps.map(app => app.id);
    const newSelectedIds = [...new Set([...fundingModal.selectedIds, ...allFilteredIds])];
    
    setFundingModal({
      ...fundingModal,
      selectedIds: newSelectedIds
    });
  };

  // Default message template
  const getDefaultMessage = () => {
    return `Thank you for your application to the MoH Affiliate Fellowship Program. We have reviewed your application and need some additional information regarding your project funding and sustainability.

Please provide the following information:

• Estimated Budget: What is the estimated budget for your project?
• Funding Sources: What are the potential or secured sources of funding? (e.g., grants, institutional support, personal contributions, partnerships)
• Funding Status: Is funding secured or not yet secured?
• Proof of Funding: If funding is secured, please attach proof
• Funding Plan: If funding is not yet secured, please attach your plan to obtain financial support
• Sustainability Plan: How will the project be sustained beyond the fellowship period?

We appreciate your cooperation and look forward to reviewing your additional information.`;
  };

  // AI prompt suggestions
  const promptSuggestions = [
    "Request funding details urgently",
    "Ask for comprehensive funding information",
    "Request budget and sustainability details",
    "Ask for funding sources and proof",
    "Request detailed financial planning information",
    "Ask for funding status and future plans",
    "Request complete funding documentation",
    "Ask for budget breakdown and sustainability strategy"
  ];

  // Generate AI message
  const generateAIMessage = async () => {
    if (!fundingModal.aiPrompt.trim()) {
      alert('Please enter a prompt for AI generation');
      return;
    }

    setFundingModal({ ...fundingModal, generatingAI: true });
    
    try {
      const response = await fetch('/api/admin/ai/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt: fundingModal.aiPrompt,
          messageType: 'funding_request',
          applicantName: fundingModal.selectedIds.length === 1 ? 
            allApplications.find(app => app.id === fundingModal.selectedIds[0])?.firstName + ' ' + 
            allApplications.find(app => app.id === fundingModal.selectedIds[0])?.lastName : 
            'selected applicants'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFundingModal({
          ...fundingModal,
          customMessage: data.message,
          generatingAI: false,
          aiPrompt: '',
          hasDefaultMessage: false
        });
      } else {
        const errorData = await response.json();
        alert(`Failed to generate AI message: ${errorData.message}`);
        setFundingModal({ ...fundingModal, generatingAI: false });
      }
    } catch (error) {
      console.error('Error generating AI message:', error);
      alert('An error occurred while generating the AI message');
      setFundingModal({ ...fundingModal, generatingAI: false });
    }
  };

  // Apply prompt suggestion
  const applyPromptSuggestion = (suggestion: string) => {
    setFundingModal({
      ...fundingModal,
      aiPrompt: suggestion,
      showPromptSuggestions: false
    });
  };

  // Send bulk funding requests
  const sendBulkFundingRequests = async () => {
    setProcessingFunding(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const applicationId of fundingModal.selectedIds) {
        try {
          const response = await fetch(`/api/admin/applications/${applicationId}/request-funding-info`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include', // Include cookies for authentication
            body: JSON.stringify({
              customMessage: fundingModal.customMessage || undefined,
              includeLink: fundingModal.includeLink,
              customLink: fundingModal.customLink || undefined
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            console.error(`Error sending funding request to ${applicationId}:`, errorData);
            errorCount++;
          }
        } catch (err) {
          console.error(`Error sending funding request to ${applicationId}:`, err);
          errorCount++;
        }
      }

      setFundingModal({ 
        isOpen: false, 
        customMessage: '', 
        selectedIds: [],
        showApplicantSelector: false,
        filterName: '',
        filterDate: '',
        filterStatus: 'all',
        filterProjectArea: 'all',
        includeLink: true,
        customLink: '',
        aiPrompt: '',
        generatingAI: false,
        showPromptSuggestions: false,
        hasDefaultMessage: false
      });
      setSelectedApplications(new Set());
      
      if (errorCount === 0) {
        alert(`Successfully sent ${successCount} funding information requests!`);
      } else {
        alert(`Sent ${successCount} requests successfully. ${errorCount} requests failed.`);
      }
    } catch (err) {
      console.error("Error sending bulk funding requests:", err);
      alert("An error occurred while sending the requests. Please try again.");
    } finally {
      setProcessingFunding(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor, textColor;

    switch (status) {
      case "approved":
        bgColor = darkMode ? "bg-green-900/30" : "bg-green-100";
        textColor = "text-green-600";
        break;
      case "rejected":
        bgColor = darkMode ? "bg-red-900/30" : "bg-red-100";
        textColor = "text-red-600";
        break;
      default:
        bgColor = darkMode ? "bg-yellow-900/30" : "bg-yellow-100";
        textColor = "text-yellow-600";
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Calculate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return (
    <div className="space-y-3">
      {/* Welcome Section - Compact */}
      <div className="mb-3">
        <h1 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"} mb-1`}>
          Welcome Back, Admin 👋
        </h1>
        <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Let's manage today. You have {stats.pending} Pending Applications and {stats.total} Total Records.
        </p>
      </div>

      {/* Header with Search - Compact */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
          Application List
        </h2>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex w-full md:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name or email..."
            className={`rounded-l-lg border-r-0 block w-full px-3 py-2 text-sm border ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded-r-lg text-sm ${
              darkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            } transition-colors duration-200`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>

      {/* Filters - Compact */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => handleStatusFilterChange("all")}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 ${
            statusFilter === "all"
              ? darkMode
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-blue-500 text-white shadow-lg"
              : darkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => handleStatusFilterChange("pending")}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 ${
            statusFilter === "pending"
              ? darkMode
                ? "bg-yellow-600 text-white shadow-lg"
                : "bg-yellow-500 text-white shadow-lg"
              : darkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Pending ({stats.pending})
        </button>
        <button
          onClick={() => handleStatusFilterChange("approved")}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 ${
            statusFilter === "approved"
              ? darkMode
                ? "bg-green-600 text-white shadow-lg"
                : "bg-green-500 text-white shadow-lg"
              : darkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Approved ({stats.approved})
        </button>
        <button
          onClick={() => handleStatusFilterChange("rejected")}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 ${
            statusFilter === "rejected"
              ? darkMode
                ? "bg-red-600 text-white shadow-lg"
                : "bg-red-500 text-white shadow-lg"
              : darkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Rejected ({stats.rejected})
        </button>
      </div>

      {/* Funding Management Section */}
      {selectedApplications.size > 0 && (
        <div className={`p-4 rounded-lg border ${
          darkMode 
            ? "bg-orange-900/20 border-orange-700" 
            : "bg-orange-50 border-orange-200"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className={`font-medium ${darkMode ? "text-orange-200" : "text-orange-800"}`}>
                {selectedApplications.size} application{selectedApplications.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={openFundingModal}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                darkMode
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              } shadow-sm`}
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Send Funding Requests
            </button>
          </div>
        </div>
      )}

      {/* Applications Table - Professional Design */}
      <div className={`rounded-lg shadow-sm overflow-hidden border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={`${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
              <tr>
                <th
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedApplications.size === applications.length && applications.length > 0}
                    onChange={handleSelectAll}
                    className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                      darkMode ? "bg-gray-700 border-gray-600" : "bg-white"
                    }`}
                  />
                </th>
                <th
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  APPLICANT
                </th>
                <th
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  CONTACT
                </th>
                <th
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  LOCATION
                </th>
                <th
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  PROJECT AREA
                </th>
                <th
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  STATUS
                </th>
                <th
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  SUBMITTED
                </th>
                <th
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={`${darkMode ? "bg-gray-800" : "bg-white"}`}>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className={`px-4 py-8 text-center ${
                      darkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-sm">Loading applications...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className={`px-4 py-8 text-center ${
                      darkMode ? "text-red-400" : "text-red-500"
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">{error}</span>
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className={`px-4 py-8 text-center ${
                      darkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium">No applications found</p>
                      <p className="text-xs">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((application, index) => (
                  <tr
                    key={application.id}
                    className={`transition-colors duration-200 ${
                      darkMode 
                        ? "hover:bg-gray-700 border-b border-gray-700" 
                        : "hover:bg-gray-50 border-b border-gray-200"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedApplications.has(application.id)}
                        onChange={() => handleSelectApplication(application.id)}
                        className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                          darkMode ? "bg-gray-700 border-gray-600" : "bg-white"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Avatar name={`${application.firstName} ${application.lastName}`} />
                        <div className="ml-3">
                          <div className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {application.firstName} {application.lastName}
                          </div>
                          <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {application.nationality}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {application.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {application.countryOfResidence}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} max-w-xs`}>
                        <div className="truncate" title={application.projectArea}>
                          {application.projectArea}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {formatDate(application.submittedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/applications/${application.id}`}
                          className={`inline-flex items-center px-3 py-1.5 rounded text-xs font-medium transition-colors duration-200 ${
                            darkMode
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-blue-500 hover:bg-blue-600 text-white"
                          }`}
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </Link>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateApplicationStatus(application.id, "approved")}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                              darkMode
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectClick(application)}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                              darkMode
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                          >
                            Reject
                          </button>
                          {currentUser?.role === 'super_admin' && (
                            <button
                              onClick={() => handleDeleteApplication(application.id)}
                              disabled={deletingApplicationId === application.id}
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                                darkMode
                                  ? "bg-red-800 hover:bg-red-900 text-white disabled:opacity-50"
                                  : "bg-red-200 text-red-900 hover:bg-red-300 disabled:opacity-50"
                              }`}
                              title="Delete application (Super Admin only)"
                            >
                              {deletingApplicationId === application.id ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - Compact */}
      <div className={`rounded-lg p-3 ${darkMode ? "bg-gray-800" : "bg-white"} border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Show entries:
            </span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className={`px-2 py-1 text-xs rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
            </span>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`p-1.5 rounded transition-colors duration-200 ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1.5 rounded transition-colors duration-200 ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-2 py-1.5 text-xs font-medium rounded transition-colors duration-200 ${
                    page === currentPage
                      ? darkMode
                        ? "bg-blue-600 text-white"
                        : "bg-blue-500 text-white"
                      : darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded transition-colors duration-200 ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded transition-colors duration-200 ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Application
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting application for: <strong>{rejectionModal.applicationName}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionModal.rejectionReason}
                onChange={(e) => setRejectionModal(prev => ({ ...prev, rejectionReason: e.target.value }))}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRejectionModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectionSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Professional Funding Request Modal */}
      {fundingModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-[#ffedd5]">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Send Funding Information Requests
                    </h3>
                    <p className="text-sm text-gray-500">
                      Request funding information from {fundingModal.selectedIds.length} selected applicant{fundingModal.selectedIds.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFundingModal({ 
                    isOpen: false, 
                    customMessage: '', 
                    selectedIds: [],
                    showApplicantSelector: false,
                    filterName: '',
                    filterDate: '',
                    filterStatus: 'all',
                    filterProjectArea: 'all',
                    includeLink: true,
                    customLink: '',
                    aiPrompt: '',
                    generatingAI: false,
                    showPromptSuggestions: false,
                    hasDefaultMessage: false
                  })}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto bg-[#F6F9FF]">
              {/* Action Buttons */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setFundingModal({
                      ...fundingModal,
                      showApplicantSelector: !fundingModal.showApplicantSelector
                    })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      fundingModal.showApplicantSelector
                        ? darkMode
                          ? "bg-blue-600 text-white"
                          : "bg-blue-500 text-white"
                        : darkMode
                        ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {fundingModal.showApplicantSelector ? 'Hide' : 'Add'} More Applicants
                  </button>
                  
                  {fundingModal.selectedIds.length > 0 && (
                    <button
                      onClick={() => setFundingModal({
                        ...fundingModal,
                        selectedIds: []
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        darkMode
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear All
                    </button>
                  )}
                </div>

                {/* Funding Form Link Preview */}
                <div className={`px-3 py-2 rounded-lg border ${
                  darkMode ? "bg-blue-900/20 border-blue-700" : "bg-blue-50 border-blue-200"
                }`}>
                  <p className={`text-xs font-medium ${
                    darkMode ? "text-blue-300" : "text-blue-700"
                  }`}>
                    Funding Form Link:
                  </p>
                  <p className={`text-xs ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}>
                    {process.env.NEXT_PUBLIC_APP_URL || 'http://197.243.28.38'}/funding-info/[APPLICATION_ID]
                  </p>
                </div>
              </div>

              {/* Applicant Selector Section */}
              {fundingModal.showApplicantSelector && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                }`}>
                  <h4 className={`text-sm font-semibold mb-4 ${
                    darkMode ? "text-gray-200" : "text-gray-800"
                  }`}>
                    Select Additional Applicants
                  </h4>
                  
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={fundingModal.filterName}
                      onChange={(e) => setFundingModal({
                        ...fundingModal,
                        filterName: e.target.value
                      })}
                      className={`px-3 py-2 text-sm border rounded-lg ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    />
                    
                    <input
                      type="date"
                      value={fundingModal.filterDate}
                      onChange={(e) => setFundingModal({
                        ...fundingModal,
                        filterDate: e.target.value
                      })}
                      className={`px-3 py-2 text-sm border rounded-lg ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-gray-100"
                          : "bg-white border-gray-300 text-gray-900"
                      } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    />
                    
                    <select
                      value={fundingModal.filterStatus}
                      onChange={(e) => setFundingModal({
                        ...fundingModal,
                        filterStatus: e.target.value
                      })}
                      className={`px-3 py-2 text-sm border rounded-lg ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-gray-100"
                          : "bg-white border-gray-300 text-gray-900"
                      } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    
                    <select
                      value={fundingModal.filterProjectArea}
                      onChange={(e) => setFundingModal({
                        ...fundingModal,
                        filterProjectArea: e.target.value
                      })}
                      className={`px-3 py-2 text-sm border rounded-lg ${
                        darkMode
                          ? "bg-gray-800 border-gray-600 text-gray-100"
                          : "bg-white border-gray-300 text-gray-900"
                      } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    >
                      <option value="all">All Project Areas</option>
                      <option value="Biomedical Research and Innovation">Biomedical Research</option>
                      <option value="Public Health Surveillance">Public Health</option>
                      <option value="Health Financing, Economics and Supply Chain">Health Financing</option>
                      <option value="Health Workforce Development">Workforce Development</option>
                      <option value="Digital Health and Artificial Intelligence">Digital Health</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Select All Button */}
                  <div className="flex justify-between items-center mb-3">
                    <button
                      onClick={selectAllFilteredApplications}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        darkMode
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      Select All Filtered ({getFilteredApplications().length})
                    </button>
                    <span className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                      Showing {getFilteredApplications().length} of {allApplications.length} applications
                    </span>
                  </div>

                  {/* Applications List */}
                  <div className={`max-h-48 overflow-y-auto rounded-lg border ${
                    darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
                  }`}>
                    {getFilteredApplications().map((app) => (
                      <div key={app.id} className={`px-3 py-2 border-b last:border-b-0 ${
                        darkMode ? "border-gray-600" : "border-gray-200"
                      }`}>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={fundingModal.selectedIds.includes(app.id)}
                            onChange={() => toggleModalApplicationSelection(app.id)}
                            className={`rounded border-gray-300 text-orange-600 focus:ring-orange-500 ${
                              darkMode ? "bg-gray-700 border-gray-600" : "bg-white"
                            }`}
                          />
                          <Avatar name={`${app.firstName} ${app.lastName}`} className="w-6 h-6 text-xs ml-3" />
                          <div className="ml-3 flex-1">
                            <p className={`text-sm font-medium ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}>
                              {app.firstName} {app.lastName}
                            </p>
                            <p className={`text-xs ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}>
                              {app.email} • {app.projectArea} • {app.status}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            app.status === 'pending' 
                              ? darkMode ? "bg-yellow-800 text-yellow-200" : "bg-yellow-100 text-yellow-800"
                              : app.status === 'approved'
                              ? darkMode ? "bg-green-800 text-green-200" : "bg-green-100 text-green-800"
                              : darkMode ? "bg-red-800 text-red-200" : "bg-red-100 text-red-800"
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Applications Summary */}
              <div className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 ${
                  darkMode ? "text-gray-200" : "text-gray-800"
                }`}>
                  Selected Applications ({fundingModal.selectedIds.length}):
                </h4>
                <div className={`max-h-32 overflow-y-auto rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                }`}>
                  {fundingModal.selectedIds.map((id) => {
                    const app = allApplications.find(a => a.id === id) || applications.find(a => a.id === id);
                    return app ? (
                      <div key={id} className={`px-3 py-2 border-b last:border-b-0 ${
                        darkMode ? "border-gray-600" : "border-gray-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar name={`${app.firstName} ${app.lastName}`} className="w-6 h-6 text-xs" />
                            <div className="ml-2">
                              <p className={`text-sm font-medium ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}>
                                {app.firstName} {app.lastName}
                              </p>
                              <p className={`text-xs ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}>
                                {app.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleModalApplicationSelection(id)}
                            className={`p-1 rounded transition-colors ${
                              darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                            }`}
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* AI Message Generation Section */}
              <div className="mb-4 p-4 rounded-xl bg-[#effdf4] border border-green-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-green-100">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        AI Message Generator
                      </h3>
                      <p className="text-xs text-gray-500">
                        Generate professional messages with AI assistance
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFundingModal({
                      ...fundingModal,
                      showPromptSuggestions: !fundingModal.showPromptSuggestions
                    })}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      fundingModal.showPromptSuggestions
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                    {fundingModal.showPromptSuggestions ? 'Hide' : 'Show'} Suggestions
                  </button>
                </div>

                {/* Prompt Suggestions */}
                {fundingModal.showPromptSuggestions && (
                  <div className="mb-3 p-3 rounded-lg bg-white border border-green-100">
                    <p className="text-xs font-medium mb-2 text-gray-700">
                      💡 Quick Prompt Suggestions:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {promptSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => applyPromptSuggestion(suggestion)}
                          className="text-left p-2 rounded text-xs transition-colors bg-white hover:bg-gray-50 text-gray-700 border border-gray-100"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Prompt Input */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={fundingModal.aiPrompt}
                        onChange={(e) => setFundingModal({
                          ...fundingModal,
                          aiPrompt: e.target.value
                        })}
                        placeholder="Describe what you want to say (e.g., 'Request funding details urgently')"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-colors"
                      />
                      {fundingModal.aiPrompt && (
                        <button
                          onClick={() => setFundingModal({
                            ...fundingModal,
                            aiPrompt: ''
                          })}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
                        >
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={generateAIMessage}
                      disabled={fundingModal.generatingAI || !fundingModal.aiPrompt.trim()}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        fundingModal.generatingAI || !fundingModal.aiPrompt.trim()
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {fundingModal.generatingAI ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      ✨ AI will generate a professional, personalized message
                    </p>
                    {/* {fundingModal.hasDefaultMessage && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Default loaded
                      </span>
                    )} */}
                  </div>
                </div>
              </div>

              {/* Custom Message Section */}
              <div className="mb-4 p-4 rounded-xl bg-[#ffedd5] border border-orange-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-orange-100">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Custom Message
                      </h3>
                      <p className="text-xs text-gray-500">
                        Edit the message that will be sent to applicants
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {fundingModal.hasDefaultMessage && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Default template
                      </span>
                    )}
                    <button
                      onClick={() => setFundingModal({
                        ...fundingModal,
                        customMessage: getDefaultMessage(),
                        hasDefaultMessage: true
                      })}
                      className="px-2 py-1 rounded text-xs font-medium transition-colors bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={fundingModal.customMessage}
                    onChange={(e) => setFundingModal({
                      ...fundingModal,
                      customMessage: e.target.value,
                      hasDefaultMessage: false
                    })}
                    placeholder="Add a custom message to include with the funding request email..."
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none bg-white text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-colors"
                    rows={6}
                    style={{ minHeight: '120px' }}
                  />
                  
                  {/* Character count and status */}
                  <div className="absolute bottom-2 right-2 flex items-center space-x-1">
                    <span className="text-xs text-gray-400">
                      {fundingModal.customMessage.length} chars
                    </span>
                    {fundingModal.customMessage.length > 1000 && (
                      <span className="text-xs px-1 py-0.5 rounded bg-yellow-100 text-yellow-700">
                        Long
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  {/* <p className="text-xs text-gray-500">
                    💡 This message will be included in the funding request email
                  </p> */}
                  <button
                    onClick={() => setFundingModal({
                      ...fundingModal,
                      customMessage: ''
                    })}
                    className="text-xs px-2 py-1 rounded transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Link Control Section */}
              <div className="mb-4 p-4 rounded-xl bg-[#D6E7F3] border border-blue-100">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-blue-100">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Link Settings
                    </h3>
                    <p className="text-xs text-gray-500">
                      Configure how links are included in the email
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center p-3 rounded-lg bg-white border border-gray-200">
                    <input
                      type="checkbox"
                      id="includeLink"
                      checked={fundingModal.includeLink}
                      onChange={(e) => setFundingModal({
                        ...fundingModal,
                        includeLink: e.target.checked
                      })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white"
                    />
                    <label htmlFor="includeLink" className="ml-2 text-sm font-medium text-gray-700">
                      Include funding form link in email
                    </label>
                    <div className="ml-auto">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        fundingModal.includeLink
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {fundingModal.includeLink ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {fundingModal.includeLink && (
                    <div className="p-3 rounded-lg bg-white border border-gray-200">
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Custom Link (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={fundingModal.customLink}
                          onChange={(e) => setFundingModal({
                            ...fundingModal,
                            customLink: e.target.value
                          })}
                          placeholder="https://example.com/custom-form"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                        />
                        {fundingModal.customLink && (
                          <button
                            onClick={() => setFundingModal({
                              ...fundingModal,
                              customLink: ''
                            })}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
                          >
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="mt-2 p-2 rounded bg-blue-50">
                        <p className="text-xs text-blue-700">
                          <strong>Default:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'http://197.243.28.38'}/funding-info/[APPLICATION_ID]
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <p>
                    {fundingModal.includeLink 
                      ? `Funding form link will be sent to each selected applicant${fundingModal.customLink ? ' (custom link)' : ''}`
                      : 'No link will be included in the email'
                    }
                  </p>
                  {fundingModal.includeLink && (
                    <p className="text-xs mt-1">
                      {fundingModal.customLink 
                        ? `Custom link: ${fundingModal.customLink}`
                        : `Default link format: ${process.env.NEXT_PUBLIC_APP_URL || 'http://197.243.28.38'}/funding-info/[APPLICATION_ID]`
                      }
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setFundingModal({ 
                      isOpen: false, 
                      customMessage: '', 
                      selectedIds: [],
                      showApplicantSelector: false,
                      filterName: '',
                      filterDate: '',
                      filterStatus: 'all',
                      filterProjectArea: 'all',
                      includeLink: true,
                      customLink: '',
                      aiPrompt: '',
                      generatingAI: false,
                      showPromptSuggestions: false,
                      hasDefaultMessage: false
                    })}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendBulkFundingRequests}
                    disabled={processingFunding || fundingModal.selectedIds.length === 0}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                      processingFunding || fundingModal.selectedIds.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                  >
                    {processingFunding ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send {fundingModal.selectedIds.length} Request{fundingModal.selectedIds.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}