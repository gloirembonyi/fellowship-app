"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [currentStep, setCurrentStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("admin123");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [isPasting, setIsPasting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/user");
        const data = await response.json();
        
        if (data.success && data.user && ['admin', 'super_admin'].includes(data.user.role)) {
          router.push("/admin");
        }
      } catch {
        // Not authenticated, stay on login page
      }
    };
    
    checkAuth();
  }, [router]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "request",
          email, 
          password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setSuccess(data.message);
      setCurrentStep('otp');
      setCountdown(300); // 5 minutes
      setCanResend(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setOtpLoading(true);

    try {
      const otpString = otpCode.join("");
      
      // Validate that all OTP digits are filled
      if (otpString.length !== 6) {
        setError("Please enter all 6 digits of the OTP code");
        setOtpLoading(false);
        return;
      }
      
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "verify",
          email, 
          otpCode: otpString 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      setSuccess("Login successful! Redirecting...");
      setIsRedirecting(true);
      // Store user info in localStorage for now
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Add a small delay to show the success message, then redirect
      setTimeout(() => {
        // Force a page reload to ensure cookies are properly set
        window.location.href = data.redirectUrl || "/admin";
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setOtpLoading(true);

    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "resend",
          email
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setSuccess(data.message);
      setCountdown(300); // 5 minutes
      setCanResend(false);
      setOtpCode(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, ''); // Remove non-digits
    
    if (pastedData.length === 6) {
      setIsPasting(true);
      const newOtp = pastedData.split('');
      setOtpCode(newOtp);
      
      // Auto-submit after a short delay
      setTimeout(async () => {
        setIsPasting(false);
        setOtpLoading(true);
        setError("");
        setSuccess("");

        try {
          const response = await fetch("/api/auth/otp", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              action: "verify",
              email, 
              otpCode: pastedData 
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "OTP verification failed");
          }

          setSuccess("Login successful! Redirecting...");
          setIsRedirecting(true);
          // Store user info in localStorage for now
          localStorage.setItem("user", JSON.stringify(data.user));
          
          // Add a small delay to show the success message, then redirect
          setTimeout(() => {
            // Force a page reload to ensure cookies are properly set
            window.location.href = data.redirectUrl || "/admin";
          }, 1500);
        } catch (err) {
          setError(err instanceof Error ? err.message : "OTP verification failed");
        } finally {
          setOtpLoading(false);
        }
      }, 500);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (currentStep === 'otp') {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 relative">
        {/* Redirecting Overlay */}
        {isRedirecting && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Successful!</h3>
              <p className="text-sm text-gray-600 mb-4">Redirecting to admin dashboard...</p>
              <div className="flex justify-center">
                <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          </div>
        )}
        {/* Left Column - OTP Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <Link href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-500 text-sm mb-4 transition-colors">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to login
                </Link>
                
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                <p className="text-sm text-gray-600 mb-1">
                  We sent a 6-digit code to
                </p>
                <p className="text-sm font-medium text-gray-900 mb-3">{email}</p>
                
              
              </div>

              <form onSubmit={handleOTPSubmit} className="space-y-6">
                <div>
                 
                  <div className="flex justify-center space-x-3" onPaste={handleOtpPaste}>
                    {otpCode.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400"
                        placeholder="0"
                      />
                    ))}
                  </div>
              
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-green-600 text-sm text-center bg-green-50 p-4 rounded-lg border border-green-200 flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{success}</span>
                  </div>
                )}

                {isPasting && (
                  <div className="text-blue-600 text-sm text-center bg-blue-50 p-3 rounded-lg border border-blue-200">
                    ✨ Auto-filling code...
                  </div>
                )}

                <div className="text-center space-y-3">
                  <p className="text-xs text-gray-500">
                    Can't find the email? Check your spam folder.
                  </p>
                  
                  <div className="flex items-center justify-center">
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={otpLoading}
                        className="text-blue-600 hover:text-blue-500 text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        Resend code
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">
                        Resend in {formatTime(countdown)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400">
                    Code expires in 5 minutes
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otpCode.some(digit => !digit) || isPasting}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {otpLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : isPasting ? (
                    <>
                      <svg className="animate-pulse -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Auto-submitting...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column - Welcome Message */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-700 items-center justify-center px-8">
          <div className="text-center text-white max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-3">Almost There!</h1>
              <p className="text-lg text-blue-100 leading-relaxed">
                Just one more step to access your admin dashboard and manage fellowship applications.
              </p>
            </div>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Left Column - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Image
                    src="/Rwanda-coat-of-arms.png"
                    alt="Rwanda Coat of Arms"
                    width={32}
                    height={32}
                    className="mx-auto"
                    priority
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h2>
              <p className="text-sm text-gray-600 mb-4">
                Fellowship Program Administration
              </p>
              
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-600 text-sm text-center bg-green-50 p-4 rounded-lg border border-green-200 flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link
                href="/"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Welcome Message */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-700 items-center justify-center px-8">
        <div className="text-center text-white max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-3">Welcome Back!</h1>
            <p className="text-lg text-blue-100 leading-relaxed">
              Access your admin dashboard to manage fellowship applications and continue your important work.
            </p>
          </div>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
