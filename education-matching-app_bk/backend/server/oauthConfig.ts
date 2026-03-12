import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as TwitterStrategy } from "passport-twitter";
import passport from "passport";
import type { Express } from "express";
import { storage } from "./storage";
import { generateAccessToken, generateRefreshToken } from "./utils/jwt";
import { sendSuccess, sendError } from "./utils/apiResponse";

/**
 * OAuth configuration for SNS login
 * Set environment variables for each provider:
 * - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 * - FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
 * - TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET
 * - OAUTH_CALLBACK_URL (base URL for callbacks)
 */

const CALLBACK_URL_BASE =
  process.env.OAUTH_CALLBACK_URL ||
  "https://education-matching-api-idea-dev.replit.app";

interface OAuthProfile {
  id: string;
  displayName?: string;
  name?: { givenName?: string; familyName?: string };
  emails?: Array<{ value: string; verified?: boolean }>;
  photos?: Array<{ value: string }>;
  provider: string;
}

/**
 * Find or create user from OAuth profile
 */
async function findOrCreateUser(
  profile: OAuthProfile,
  userType: "student" | "teacher"
) {
  const email =
    profile.emails && profile.emails.length > 0
      ? profile.emails[0].value
      : null;

  if (!email) {
    throw new Error("Email not provided by OAuth provider");
  }

  const name =
    profile.displayName ||
    `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() ||
    "User";
  const avatarUrl =
    profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

  // Check if user exists with this OAuth provider
  let user: any;
  if (userType === "student") {
    // Find by OAuth provider and ID
    const allUsers = await storage.getAllUsers({ page: 1, limit: 1000 });
    user = allUsers.users.find(
      (u: any) => u.oauthProvider === profile.provider && u.oauthId === profile.id
    );

    if (user) {
      return user;
    }

    // Check if user exists with this email
    user = await storage.getUserByEmail(email);

    if (user) {
      // Link OAuth account to existing user
      await storage.updateUser(user.id, {
        oauthProvider: profile.provider,
        oauthId: profile.id,
        avatarUrl: avatarUrl || user.avatarUrl,
      });
      return await storage.getUser(user.id);
    }

    // Create new user
    const newUser = await storage.createUser({
      email,
      name,
      avatarUrl,
      oauthProvider: profile.provider,
      oauthId: profile.id,
      password: null, // OAuth users don't have passwords
    });

    return newUser;
  } else {
    // Teacher
    const allTeachers = await storage.getAllTeachers({ page: 1, limit: 1000 });
    user = allTeachers.teachers.find(
      (t: any) => t.oauthProvider === profile.provider && t.oauthId === profile.id
    );

    if (user) {
      return user;
    }

    // Check if teacher exists with this email
    user = await storage.getTeacherByEmail(email);

    if (user) {
      // Link OAuth account to existing teacher
      await storage.updateTeacher(user.id, {
        oauthProvider: profile.provider,
        oauthId: profile.id,
        avatarUrl: avatarUrl || user.avatarUrl,
      });
      return await storage.getTeacher(user.id);
    }

    // Create new teacher
    const newTeacher = await storage.createTeacher({
      email,
      name,
      avatarUrl,
      oauthProvider: profile.provider,
      oauthId: profile.id,
      password: null, // OAuth users don't have passwords
    });

    return newTeacher;
  }
}

/**
 * Configure OAuth strategies
 */
export function setupOAuth(app: Express) {
  app.use(passport.initialize());

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      "google-student",
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${CALLBACK_URL_BASE}/api/auth/google/callback/student`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateUser(profile as OAuthProfile, "student");
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );

    passport.use(
      "google-teacher",
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${CALLBACK_URL_BASE}/api/auth/google/callback/teacher`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateUser(profile as OAuthProfile, "teacher");
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      "facebook-student",
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: `${CALLBACK_URL_BASE}/api/auth/facebook/callback/student`,
          profileFields: ["id", "displayName", "email", "picture.type(large)"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateUser(profile as OAuthProfile, "student");
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );

    passport.use(
      "facebook-teacher",
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: `${CALLBACK_URL_BASE}/api/auth/facebook/callback/teacher`,
          profileFields: ["id", "displayName", "email", "picture.type(large)"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateUser(profile as OAuthProfile, "teacher");
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  // Twitter OAuth Strategy
  if (
    process.env.TWITTER_CONSUMER_KEY &&
    process.env.TWITTER_CONSUMER_SECRET
  ) {
    passport.use(
      "twitter-student",
      new TwitterStrategy(
        {
          consumerKey: process.env.TWITTER_CONSUMER_KEY,
          consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
          callbackURL: `${CALLBACK_URL_BASE}/api/auth/twitter/callback/student`,
          includeEmail: true,
        },
        async (token, tokenSecret, profile, done) => {
          try {
            const user = await findOrCreateUser(profile as OAuthProfile, "student");
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );

    passport.use(
      "twitter-teacher",
      new TwitterStrategy(
        {
          consumerKey: process.env.TWITTER_CONSUMER_KEY,
          consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
          callbackURL: `${CALLBACK_URL_BASE}/api/auth/twitter/callback/teacher`,
          includeEmail: true,
        },
        async (token, tokenSecret, profile, done) => {
          try {
            const user = await findOrCreateUser(profile as OAuthProfile, "teacher");
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  // OAuth routes
  setupOAuthRoutes(app);
}

/**
 * Setup OAuth routes
 */
function setupOAuthRoutes(app: Express) {
  // Google OAuth routes
  app.get("/api/auth/google/student", (req, res, next) => {
    passport.authenticate("google-student", {
      scope: ["profile", "email"],
      session: false,
    })(req, res, next);
  });

  app.get(
    "/api/auth/google/callback/student",
    passport.authenticate("google-student", {
      session: false,
      failureRedirect: "/login?error=google_auth_failed",
    }),
    (req, res) => {
      try {
        const user = req.user as any;
        const accessToken = generateAccessToken(user.id, "student");
        const refreshToken = generateRefreshToken(user.id, "student");

        // Redirect to app with tokens
        const redirectUrl = `educationapp://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userType=student`;
        res.redirect(redirectUrl);
      } catch (error) {
        res.redirect("/login?error=token_generation_failed");
      }
    }
  );

  app.get("/api/auth/google/teacher", (req, res, next) => {
    passport.authenticate("google-teacher", {
      scope: ["profile", "email"],
      session: false,
    })(req, res, next);
  });

  app.get(
    "/api/auth/google/callback/teacher",
    passport.authenticate("google-teacher", {
      session: false,
      failureRedirect: "/login?error=google_auth_failed",
    }),
    (req, res) => {
      try {
        const user = req.user as any;
        const accessToken = generateAccessToken(user.id, "teacher");
        const refreshToken = generateRefreshToken(user.id, "teacher");

        const redirectUrl = `educationapp://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userType=teacher`;
        res.redirect(redirectUrl);
      } catch (error) {
        res.redirect("/login?error=token_generation_failed");
      }
    }
  );

  // Facebook OAuth routes
  app.get("/api/auth/facebook/student", (req, res, next) => {
    passport.authenticate("facebook-student", {
      scope: ["email", "public_profile"],
      session: false,
    })(req, res, next);
  });

  app.get(
    "/api/auth/facebook/callback/student",
    passport.authenticate("facebook-student", {
      session: false,
      failureRedirect: "/login?error=facebook_auth_failed",
    }),
    (req, res) => {
      try {
        const user = req.user as any;
        const accessToken = generateAccessToken(user.id, "student");
        const refreshToken = generateRefreshToken(user.id, "student");

        const redirectUrl = `educationapp://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userType=student`;
        res.redirect(redirectUrl);
      } catch (error) {
        res.redirect("/login?error=token_generation_failed");
      }
    }
  );

  app.get("/api/auth/facebook/teacher", (req, res, next) => {
    passport.authenticate("facebook-teacher", {
      scope: ["email", "public_profile"],
      session: false,
    })(req, res, next);
  });

  app.get(
    "/api/auth/facebook/callback/teacher",
    passport.authenticate("facebook-teacher", {
      session: false,
      failureRedirect: "/login?error=facebook_auth_failed",
    }),
    (req, res) => {
      try {
        const user = req.user as any;
        const accessToken = generateAccessToken(user.id, "teacher");
        const refreshToken = generateRefreshToken(user.id, "teacher");

        const redirectUrl = `educationapp://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userType=teacher`;
        res.redirect(redirectUrl);
      } catch (error) {
        res.redirect("/login?error=token_generation_failed");
      }
    }
  );

  // Twitter OAuth routes
  app.get("/api/auth/twitter/student", (req, res, next) => {
    passport.authenticate("twitter-student", { session: false })(req, res, next);
  });

  app.get(
    "/api/auth/twitter/callback/student",
    passport.authenticate("twitter-student", {
      session: false,
      failureRedirect: "/login?error=twitter_auth_failed",
    }),
    (req, res) => {
      try {
        const user = req.user as any;
        const accessToken = generateAccessToken(user.id, "student");
        const refreshToken = generateRefreshToken(user.id, "student");

        const redirectUrl = `educationapp://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userType=student`;
        res.redirect(redirectUrl);
      } catch (error) {
        res.redirect("/login?error=token_generation_failed");
      }
    }
  );

  app.get("/api/auth/twitter/teacher", (req, res, next) => {
    passport.authenticate("twitter-teacher", { session: false })(req, res, next);
  });

  app.get(
    "/api/auth/twitter/callback/teacher",
    passport.authenticate("twitter-teacher", {
      session: false,
      failureRedirect: "/login?error=twitter_auth_failed",
    }),
    (req, res) => {
      try {
        const user = req.user as any;
        const accessToken = generateAccessToken(user.id, "teacher");
        const refreshToken = generateRefreshToken(user.id, "teacher");

        const redirectUrl = `educationapp://auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userType=teacher`;
        res.redirect(redirectUrl);
      } catch (error) {
        res.redirect("/login?error=token_generation_failed");
      }
    }
  );

  // Instagram OAuth (note: Instagram Basic Display API)
  // Instagram is more complex and requires Instagram Basic Display API
  // For now, we'll add a placeholder that returns not implemented
  app.get("/api/auth/instagram/:userType", (req, res) => {
    sendError(
      res,
      "Instagram OAuth is not yet implemented. Please use other login methods.",
      "NOT_IMPLEMENTED",
      501
    );
  });
}
