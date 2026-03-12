# SNS Login Implementation Guide

This document provides a comprehensive guide for implementing and testing the SNS (Social Network Service) login functionality.

## Overview

The SNS login feature allows users to authenticate using their existing accounts from:
- Google
- Facebook
- Twitter
- Instagram (placeholder - requires additional setup)

## Implementation Summary

### Backend Changes

1. **Database Schema** (`backend/shared/schema.ts`)
   - Added `oauthProvider` field to store the OAuth provider name
   - Added `oauthId` field to store the unique ID from the OAuth provider
   - Applied to both `users` and `teachers` tables

2. **OAuth Configuration** (`backend/server/oauthConfig.ts`)
   - Configured Passport strategies for Google, Facebook, and Twitter
   - Implemented OAuth callback routes for both student and teacher roles
   - Created `findOrCreateUser` function to handle OAuth user registration/login

3. **Routes Integration** (`backend/server/routes.ts`)
   - Added `setupOAuth()` call to initialize OAuth routes

4. **Database Migration** (`backend/migrations/0004_add_oauth_fields.sql`)
   - Migration script to add OAuth fields to existing database

### Frontend Changes

1. **OAuth Hook** (`hooks/useOAuth.ts`)
   - Created reusable hook for initiating OAuth flows
   - Handles browser-based authentication with `expo-web-browser`
   - Returns tokens on successful authentication

2. **Auth Context** (`contexts/AuthContext.tsx`)
   - Added OAuth login methods for all providers
   - Methods: `loginWithGoogle`, `loginWithFacebook`, `loginWithTwitter`, `loginWithInstagram`
   - Each method supports both student and teacher roles

3. **Login Screen** (`screens/LoginScreen.tsx`)
   - Updated SNS buttons to call actual OAuth methods
   - Added loading states for each OAuth provider
   - Maintains user role (student/teacher) context during OAuth flow

4. **Register Screen** (`screens/RegisterScreen.tsx`)
   - Added SNS registration section
   - Includes all four OAuth providers with buttons
   - Shows appropriate loading indicators

5. **App Configuration** (`app.json`)
   - Added intent filters for OAuth callback handling
   - Configured `educationapp://auth/callback` deep link scheme

## Setup Instructions

### Step 1: Configure OAuth Providers

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   ```
   https://your-domain.replit.app/api/auth/google/callback/student
   https://your-domain.replit.app/api/auth/google/callback/teacher
   ```
6. Copy Client ID and Client Secret

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing one
3. Add Facebook Login product
4. Configure OAuth Redirect URIs:
   ```
   https://your-domain.replit.app/api/auth/facebook/callback/student
   https://your-domain.replit.app/api/auth/facebook/callback/teacher
   ```
5. Copy App ID and App Secret

#### Twitter OAuth
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app or select existing one
3. Navigate to Keys and Tokens
4. Enable OAuth 1.0a
5. Add callback URLs:
   ```
   https://your-domain.replit.app/api/auth/twitter/callback/student
   https://your-domain.replit.app/api/auth/twitter/callback/teacher
   ```
6. Copy Consumer Key and Consumer Secret

### Step 2: Set Environment Variables

Add the following to your backend environment (Replit Secrets or .env file):

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
TWITTER_CONSUMER_KEY=your_twitter_consumer_key
TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret
OAUTH_CALLBACK_URL=https://your-domain.replit.app
```

### Step 3: Run Database Migration

Execute the migration to add OAuth fields:

```bash
cd backend
# Option 1: Using your database tool
psql -d your_database < migrations/0004_add_oauth_fields.sql

# Option 2: Using Drizzle (if configured)
npm run db:push
```

### Step 4: Restart Backend Server

After configuring environment variables and running migrations, restart your backend server:

```bash
cd backend
npm run dev
```

### Step 5: Test the Implementation

1. **Test Login Flow:**
   - Open the app
   - Navigate to Login screen
   - Tap on a provider button (Google, Facebook, Twitter)
   - Complete OAuth flow in browser
   - Verify redirect back to app
   - Confirm user is logged in

2. **Test Register Flow:**
   - Open the app
   - Navigate to Register screen
   - Tap on a provider button
   - Complete OAuth flow
   - Verify new user is created in database
   - Confirm user is logged in

3. **Test Role Selection:**
   - Test OAuth login as Student
   - Test OAuth login as Teacher
   - Verify correct user type is created

## OAuth Flow Diagram

```
User clicks SNS button
        ↓
useOAuth hook called
        ↓
Opens browser with OAuth URL
        ↓
User authenticates with provider
        ↓
Provider redirects to backend callback
        ↓
Backend validates and creates/finds user
        ↓
Backend redirects to app deep link with tokens
        ↓
App receives tokens and logs in user
```

## Troubleshooting

### Issue: OAuth button does nothing
- Check if environment variables are set correctly
- Verify OAuth provider is configured in oauthConfig.ts
- Check browser console for errors

### Issue: "Cannot find module" errors
- Run `npm install` in both root and backend directories
- Verify all dependencies are installed

### Issue: Redirect doesn't work
- Verify deep link scheme matches in app.json and useOAuth.ts
- Check that OAuth provider callback URLs are correct
- Ensure backend OAUTH_CALLBACK_URL is correct

### Issue: Instagram not working
- Instagram Basic Display API requires more complex setup
- Current implementation shows "not implemented" message
- Refer to Instagram documentation for full implementation

## Security Considerations

1. **Never commit OAuth credentials**
   - Use environment variables
   - Add .env to .gitignore

2. **Validate redirect URIs**
   - Only allow registered callback URLs
   - Prevent authorization code interception

3. **Use HTTPS in production**
   - OAuth requires secure connections
   - Configure SSL certificates

4. **Token Security**
   - Store tokens securely in AsyncStorage
   - Implement token refresh mechanism
   - Clear tokens on logout

## Next Steps

1. Configure OAuth credentials for each provider
2. Test authentication flows thoroughly
3. Monitor OAuth logs for errors
4. Consider adding more providers (Apple, LINE, etc.)
5. Implement account linking (allow users to link multiple providers)
6. Add OAuth profile picture synchronization
7. Implement Instagram Basic Display API for full Instagram support

## Support

For issues or questions:
1. Check the OAUTH_SETUP.md file
2. Review backend logs for OAuth errors
3. Test with OAuth provider's debugging tools
4. Verify all callback URLs match exactly

## References

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Twitter OAuth Documentation](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)
- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Passport.js Documentation](http://www.passportjs.org/)
