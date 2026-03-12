import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

const API_BASE_URL = "https://education-matching-api-idea-dev.replit.app";

// Warm up the browser for better UX on iOS
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'facebook' | 'twitter' | 'instagram';
export type UserRole = 'student' | 'teacher';

/**
 * Hook for OAuth authentication
 * Handles OAuth flow with various providers
 */
export function useOAuth() {
  /**
   * Start OAuth flow for a given provider
   * @param provider The OAuth provider (google, facebook, twitter, instagram)
   * @param role User role (student or teacher)
   * @returns Object with accessToken, refreshToken, and userType on success
   */
  const startOAuthFlow = async (
    provider: OAuthProvider,
    role: UserRole
  ): Promise<{ 
    success: boolean; 
    accessToken?: string; 
    refreshToken?: string; 
    userType?: string;
    error?: string;
  }> => {
    try {
      // Construct the OAuth URL
      const authUrl = `${API_BASE_URL}/api/auth/${provider}/${role}`;
      
      // For Instagram, return not implemented error
      if (provider === 'instagram') {
        return {
          success: false,
          error: 'Instagram認証は現在実装されていません。他のログイン方法をご利用ください。',
        };
      }

      // Open the OAuth URL in a browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        AuthSession.makeRedirectUri({
          scheme: 'educationapp',
          path: 'auth/callback',
        })
      );

      // Check if the authentication was successful
      if (result.type === 'success') {
        const { url } = result;
        
        // Parse the URL parameters
        const params = new URLSearchParams(url.split('?')[1]);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const userType = params.get('userType');

        if (accessToken && refreshToken) {
          return {
            success: true,
            accessToken,
            refreshToken,
            userType: userType || role,
          };
        } else {
          return {
            success: false,
            error: '認証に失敗しました。もう一度お試しください。',
          };
        }
      } else if (result.type === 'cancel') {
        return {
          success: false,
          error: 'ログインがキャンセルされました',
        };
      } else {
        return {
          success: false,
          error: '認証に失敗しました',
        };
      }
    } catch (error) {
      console.error('OAuth error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '認証エラーが発生しました',
      };
    }
  };

  return {
    startOAuthFlow,
  };
}
