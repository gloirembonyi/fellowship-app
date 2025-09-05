"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Types
interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  projectArea: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  starred?: boolean;
  priority?: "high" | "medium" | "low";
  progress?: number;
}

// Icons
const FolderIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const BuildingIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ClockIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MoreIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const XMarkIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronLeftIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ListIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

// Stats Card Component
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = "blue" 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color?: string; 
}) => {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600", 
    purple: "text-purple-600",
    orange: "text-orange-600"
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gray-50 ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <MoreIcon />
        </button>
      </div>
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

// Priority Badge Component
const PriorityBadge = ({ priority }: { priority: "high" | "medium" | "low" }) => {
  const styles = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800", 
    low: "bg-green-100 text-green-800"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`}>
      <div className={`w-2 h-2 rounded-full mr-1.5 ${
        priority === "high" ? "bg-red-500" : 
        priority === "medium" ? "bg-yellow-500" : "bg-green-500"
      }`}></div>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

// User Avatar Component
const UserAvatar = ({ name, className = "" }: { name: string; className?: string }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-red-500", "bg-indigo-500"];
  const colorIndex = name.length % colors.length;

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${colors[colorIndex]} ${className}`}>
      {initials}
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [starredApplications, setStarredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState({
    currentYear: [] as number[],
    previousYear: [] as number[],
    months: [] as string[]
  });
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    applicationId: '',
    applicationName: '',
    rejectionReason: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 8,
    totalItems: 0
  });

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (page = 1, limit = 8) => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await fetch("/api/admin/applications/stats");
      const statsData = await statsResponse.json();
      
      if (statsResponse.ok) {
        setStats({
          totalApplications: statsData.total || 0,
          pendingApplications: statsData.pending || 0,
          approvedApplications: statsData.approved || 0,
          rejectedApplications: statsData.rejected || 0
        });
      }

      // Fetch recent applications with pagination
      const applicationsResponse = await fetch(`/api/admin/applications?page=${page}&limit=${limit}`);
      const applicationsData = await applicationsResponse.json();
      
      if (applicationsResponse.ok && applicationsData.applications) {
        const formattedApplications = applicationsData.applications.map((app: any) => ({
          id: app.id,
          firstName: app.firstName,
          lastName: app.lastName,
          email: app.email,
          projectArea: app.projectArea,
          status: app.status,
          submittedAt: app.submittedAt,
          starred: app.starred || false
        }));
        setApplications(formattedApplications);
        
        // Update pagination state
        setPagination({
          currentPage: page,
          totalPages: applicationsData.pagination?.totalPages || 1,
          itemsPerPage: limit,
          totalItems: applicationsData.pagination?.totalCount || 0
        });
      }

      // Fetch starred applications
      const starredResponse = await fetch(`/api/admin/applications?starred=true&limit=5`);
      const starredData = await starredResponse.json();
      
      if (starredResponse.ok && starredData.applications) {
        const formattedStarred = starredData.applications.map((app: any) => ({
          id: app.id,
          firstName: app.firstName,
          lastName: app.lastName,
          email: app.email,
          projectArea: app.projectArea,
          status: app.status,
          submittedAt: app.submittedAt,
          starred: true
        }));
        setStarredApplications(formattedStarred);
      }

      // Fetch monthly data
      const monthlyResponse = await fetch("/api/admin/applications/monthly");
      const monthlyData = await monthlyResponse.json();
      
      if (monthlyResponse.ok) {
        console.log("Monthly data received:", monthlyData);
        setMonthlyData(monthlyData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
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
      const statsResponse = await fetch("/api/admin/applications/stats");
      const statsData = await statsResponse.json();
      
      if (statsResponse.ok) {
        setStats({
          totalApplications: statsData.total || 0,
          pendingApplications: statsData.pending || 0,
          approvedApplications: statsData.approved || 0,
          rejectedApplications: statsData.rejected || 0
        });
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

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchDashboardData(newPage, pagination.itemsPerPage);
    }
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, itemsPerPage: newLimit }));
    fetchDashboardData(1, newLimit);
  };

  // Generate pagination buttons
  const generatePaginationButtons = () => {
    const buttons = [];
    const { currentPage, totalPages } = pagination;
    
    // Always show first page
    if (currentPage > 3) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-1.5 py-0.5 text-xs text-gray-600 hover:text-gray-900"
        >
          1
        </button>
      );
      if (currentPage > 4) {
        buttons.push(
          <span key="ellipsis1" className="px-1.5 py-0.5 text-xs text-gray-400">...</span>
        );
      }
    }
    
    // Show pages around current page
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-1.5 py-0.5 text-xs rounded ${
            i === currentPage
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        buttons.push(
          <span key="ellipsis2" className="px-1.5 py-0.5 text-xs text-gray-400">...</span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-1.5 py-0.5 text-xs text-gray-600 hover:text-gray-900"
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Welcome Section - Compact */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Welcome Back, {user?.name?.split(' ')[0] || 'Admin'} 👋
        </h1>
        <p className="text-sm text-gray-600">
          Let's Rock today. We have {stats.pendingApplications} Pending Applications and {stats.totalApplications} New Applications.
        </p>
      </div>

      {/* Stats Cards - Compact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Total Users"
          value={stats.totalApplications}
          icon={FolderIcon}
          color="blue"
        />
        <StatsCard
          title="Pending"
          value={stats.pendingApplications}
          icon={UsersIcon}
          color="green"
        />
        <StatsCard
          title="Approved"
          value={stats.approvedApplications}
          icon={CheckIcon}
          color="purple"
        />
        <StatsCard
          title="rejected"
          value={stats.rejectedApplications}
          icon={XMarkIcon}
          color="orange"
        />
      </div>

      {/* Charts Section - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Status Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <ChartIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Status</h3>
            </div>
          </div>
          
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalApplications}</div>
            <div className="text-sm text-gray-600">+{Math.floor(stats.totalApplications * 0.1)} Increased this months</div>
          </div>

          {/* Simple donut chart representation */}
          <div className="flex justify-center mb-3">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-green-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={`${(stats.approvedApplications / stats.totalApplications) * 100}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-orange-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={`${(stats.pendingApplications / stats.totalApplications) * 100}, 100`}
                  strokeDashoffset={`-${(stats.approvedApplications / stats.totalApplications) * 100}`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-red-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={`${(stats.rejectedApplications / stats.totalApplications) * 100}, 100`}
                  strokeDashoffset={`-${((stats.approvedApplications + stats.pendingApplications) / stats.totalApplications) * 100}`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Approved</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.approvedApplications}</span>
        </div>
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.pendingApplications}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Rejected</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.rejectedApplications}</span>
            </div>
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <ChartIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Monthly Applications</h3>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">This Year</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Last Year</span>
              </div>
            </div>
          </div>

          {/* Simple bar chart */}
          <div className="space-y-2">
            {monthlyData.months && monthlyData.months.slice(0, 6).map((month, index) => {
              const currentValue = monthlyData.currentYear[index] || 0;
              const previousValue = monthlyData.previousYear[index] || 0;
              const maxValue = Math.max(...monthlyData.currentYear, ...monthlyData.previousYear, 1);
              
              return (
                <div key={month} className="flex items-center space-x-2">
                  <div className="w-6 text-xs text-gray-600">{month}</div>
                  <div className="flex-1 flex items-center space-x-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(currentValue / maxValue) * 100}%` }}
                        title={`This Year: ${currentValue}`}
                      ></div>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(previousValue / maxValue) * 100}%` }}
                        title={`Last Year: ${previousValue}`}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-xs text-gray-500 text-right">
                    {currentValue}/{previousValue}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Starred Applications - Compact */}
      {starredApplications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Starred Applications</h3>
                <span className="text-sm text-gray-500">({starredApplications.length})</span>
              </div>
              <Link
                href="/admin/applications?starred=true"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">
                    APPLICANT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">
                    PROJECT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-amber-800 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {starredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-amber-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {application.firstName.charAt(0)}{application.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {application.firstName} {application.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{application.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={application.projectArea}>
                          {application.projectArea}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        application.status === "approved" 
                          ? "bg-green-100 text-green-800"
                          : application.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link
                        href={`/admin/applications/${application.id}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Applications Table - Compact */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <ListIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
          </div>
          </div>

            <div className="overflow-x-auto">
              <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  APPLICANT
                    </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PROJECT
                    </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SUBMITTED
                    </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                    </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                    </th>
                  </tr>
                </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {application.firstName.charAt(0)}{application.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                              {application.firstName} {application.lastName}
                            </div>
                        <div className="text-xs text-gray-500">{application.email}</div>
                          </div>
                        </div>
                      </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={application.projectArea}>
                        {application.projectArea}
                      </div>
                    </div>
                      </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {new Date(application.submittedAt).toLocaleDateString()}
                      </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      application.status === "approved" 
                        ? "bg-green-100 text-green-800"
                        : application.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateApplicationStatus(application.id, "approved")}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                      >
                                  Approve
                                </button>
                                <button
                        onClick={() => handleRejectClick(application)}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                      >
                                  Reject
                                </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

        {/* Pagination - Compact */}
        <div className="px-3 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} entries
            </div>
            <div className="flex items-center space-x-1">
              <select 
                value={pagination.itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="text-xs border border-gray-300 rounded px-1 py-0.5"
              >
                <option value={8}>Show 8</option>
                <option value={25}>Show 25</option>
                <option value={50}>Show 50</option>
              </select>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className={`p-1 ${pagination.currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <ChevronLeftIcon />
                </button>
                {generatePaginationButtons()}
                <button 
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className={`p-1 ${pagination.currentPage === pagination.totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <ChevronRightIcon />
                </button>
              </div>
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
    </div>
  );
}