import crypto from 'crypto';

export interface OTPData {
  code: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

export class OTPManager {
  private static otpStore = new Map<string, OTPData>();

  /**
   * Generate a 6-digit OTP code
   */
  static generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Create and store OTP for a user
   */
  static createOTP(email: string, expiresInMinutes: number = 5): string {
    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    this.otpStore.set(email, {
      code,
      expiresAt,
      attempts: 0,
      maxAttempts: 3
    });

    // Clean up expired OTPs
    this.cleanupExpiredOTPs();

    return code;
  }

  /**
   * Verify OTP code
   */
  static verifyOTP(email: string, code: string): { valid: boolean; message: string } {
    const otpData = this.otpStore.get(email);
    
    if (!otpData) {
      return { valid: false, message: 'OTP not found or expired' };
    }

    if (otpData.attempts >= otpData.maxAttempts) {
      this.otpStore.delete(email);
      return { valid: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
    }

    if (new Date() > otpData.expiresAt) {
      this.otpStore.delete(email);
      return { valid: false, message: 'OTP has expired' };
    }

    if (otpData.code !== code) {
      otpData.attempts++;
      return { valid: false, message: `Invalid OTP. ${otpData.maxAttempts - otpData.attempts} attempts remaining.` };
    }

    // OTP is valid, remove it from store
    this.otpStore.delete(email);
    return { valid: true, message: 'OTP verified successfully' };
  }

  /**
   * Check if user has pending OTP
   */
  static hasPendingOTP(email: string): boolean {
    const otpData = this.otpStore.get(email);
    if (!otpData) return false;
    
    if (new Date() > otpData.expiresAt) {
      this.otpStore.delete(email);
      return false;
    }
    
    return true;
  }

  /**
   * Get remaining time for OTP
   */
  static getRemainingTime(email: string): number {
    const otpData = this.otpStore.get(email);
    if (!otpData) return 0;
    
    const remaining = otpData.expiresAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  /**
   * Clean up expired OTPs
   */
  private static cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [email, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStore.delete(email);
      }
    }
  }

  /**
   * Resend OTP (reset attempts and extend expiry)
   */
  static resendOTP(email: string, expiresInMinutes: number = 5): string {
    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    this.otpStore.set(email, {
      code,
      expiresAt,
      attempts: 0,
      maxAttempts: 3
    });

    return code;
  }
}
