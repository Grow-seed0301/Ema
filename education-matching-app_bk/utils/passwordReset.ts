import { apiService } from '@/services/api';

/**
 * Try both student and teacher roles for password reset operations
 * Returns the successful response or the last error response
 */
export async function tryBothRoles<T>(
  operation: (role: 'student' | 'teacher') => Promise<{ success: boolean; data?: T; error?: { code: string; message: string }; message?: string }>,
  checkErrorCode: string = 'NOT_FOUND'
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string }; message?: string }> {
  // Try student first
  const studentResponse = await operation('student');
  
  if (studentResponse.success) {
    return studentResponse;
  }
  
  // If student fails with the check error code, try teacher
  if (studentResponse.error?.code === checkErrorCode) {
    return await operation('teacher');
  }
  
  // Return the original error if it's not the check error code
  return studentResponse;
}

/**
 * Send password reset code for both student and teacher
 */
export async function sendPasswordResetCode(email: string) {
  return tryBothRoles(
    (role) => apiService.forgotPassword(email, role),
    'NOT_FOUND'
  );
}

/**
 * Verify password reset code for both student and teacher
 */
export async function verifyPasswordResetCode(email: string, code: string) {
  return tryBothRoles(
    (role) => apiService.verifyResetCode(email, code, role),
    'INVALID_CODE'
  );
}

/**
 * Reset password for both student and teacher
 */
export async function resetPassword(email: string, code: string, newPassword: string) {
  return tryBothRoles(
    (role) => apiService.resetPassword(email, code, newPassword, role),
    'INVALID_CODE'
  );
}
