# OAuth Configuration for SNS Login

This document describes the environment variables needed for OAuth configuration.

## Required Environment Variables

Add these environment variables to your `.env` file or Replit secrets:

### Google OAuth
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

To get these credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://your-domain.replit.app/api/auth/google/callback/student`
   - `https://your-domain.replit.app/api/auth/google/callback/teacher`

### Facebook OAuth
```bash
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
```

To get these credentials:
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add Facebook Login product
4. Configure OAuth Redirect URIs:
   - `https://your-domain.replit.app/api/auth/facebook/callback/student`
   - `https://your-domain.replit.app/api/auth/facebook/callback/teacher`

### Twitter OAuth
```bash
TWITTER_CONSUMER_KEY=your_twitter_consumer_key_here
TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret_here
```

To get these credentials:
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app or select an existing one
3. Navigate to Keys and tokens
4. Add callback URLs:
   - `https://your-domain.replit.app/api/auth/twitter/callback/student`
   - `https://your-domain.replit.app/api/auth/twitter/callback/teacher`

### Instagram OAuth
Instagram Basic Display API is more complex and requires:
1. A Facebook App
2. Instagram Basic Display product added
3. Additional configuration for Instagram accounts

**Note:** Instagram OAuth is currently marked as "not implemented" in the code. To implement it, you'll need to use the Instagram Basic Display API which has more restrictions than other providers.

### OAuth Callback Base URL
```bash
OAUTH_CALLBACK_URL=https://your-domain.replit.app
```

This is the base URL for your backend server. Update this to match your deployment URL.

## Mobile App Configuration

For the React Native app, update the `app.json` or `app.config.js` to include the OAuth scheme:

```json
{
  "expo": {
    "scheme": "education-matching-app",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "education-matching-app",
              "host": "auth",
              "pathPrefix": "/callback"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.educationmatchingapp"
    }
  }
}
```

## Testing

1. Make sure all environment variables are set
2. Restart your backend server
3. Test each OAuth provider from the login/register screens
4. Verify that users are created correctly in the database

## Security Notes

- Never commit your `.env` file or OAuth credentials to version control
- Use environment variables or secure secret management
- Regularly rotate your OAuth secrets
- Use HTTPS in production
- Validate OAuth redirect URIs to prevent authorization code interception attacks
