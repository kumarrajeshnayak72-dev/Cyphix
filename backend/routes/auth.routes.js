const express = require("express");
const { google } = require("googleapis");

const GmailAccount = require("../models/GmailAccount");
const User = require("../models/User");

const router = express.Router();


// =====================================
// GOOGLE OAUTH SCOPES
// =====================================

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://mail.google.com/"
];


// =====================================
// CREATE OAUTH CLIENT
// =====================================

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}


// =====================================
// START GOOGLE LOGIN
// =====================================

router.get(
  "/google",
  (req, res) => {
    const oauth2Client =
      createOAuthClient();

    const authUrl =
      oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent"
      });

    res.redirect(authUrl);
  }
);


// =====================================
// GOOGLE OAUTH CALLBACK
// =====================================

router.get(
  "/google/callback",
  async (req, res) => {
    try {

      const {
        code,
        error
      } = req.query;


      // Google authorization failed
      if (error) {
        return res
          .status(400)
          .send(
            `Google authorization failed: ${error}`
          );
      }


      // Authorization code missing
      if (!code) {
        return res
          .status(400)
          .send(
            "Authorization code missing"
          );
      }


      // Create OAuth client
      const oauth2Client =
        createOAuthClient();


      // Exchange code for tokens
      const {
        tokens
      } =
        await oauth2Client.getToken(
          code
        );


      // Access token required
      if (!tokens.access_token) {
        return res
          .status(400)
          .send(
            "Access token was not received"
          );
      }


      // Refresh token required
      if (!tokens.refresh_token) {
        return res
          .status(400)
          .send(
            "Refresh token was not received"
          );
      }


      // Set OAuth credentials
      oauth2Client.setCredentials(
        tokens
      );


      // =================================
      // GET GOOGLE USER INFORMATION
      // =================================

      const oauth2 =
        google.oauth2({
          version: "v2",
          auth: oauth2Client
        });


      const {
        data: googleUser
      } =
        await oauth2.userinfo.get();


      const googleId =
        googleUser.id;

      const email =
        googleUser.email;

      const name =
        googleUser.name || "";

      const picture =
        googleUser.picture || "";


      if (!googleId || !email) {
        return res
          .status(400)
          .send(
            "Google account information could not be retrieved."
          );
      }


      // =================================
      // CREATE / UPDATE CYBERGUARD USER
      // =================================

      const user =
        await User.findOneAndUpdate(
          {
            googleId
          },
          {
            googleId,
            email,
            name,
            picture
          },
          {
            upsert: true,
            new: true
          }
        );


      console.log(
        `CyberGuard user authenticated: ${email}`
      );


      // =================================
      // VERIFY GMAIL ACCOUNT
      // =================================

      const gmail =
        google.gmail({
          version: "v1",
          auth: oauth2Client
        });


      const profile =
        await gmail.users.getProfile({
          userId: "me"
        });


      const gmailEmail =
        profile.data.emailAddress;


      // =================================
      // SAVE GMAIL ACCOUNT
      // =================================

      await GmailAccount.findOneAndUpdate(
        {
          email: gmailEmail
        },
        {
          email: gmailEmail,
          refreshToken:
            tokens.refresh_token,
          connectedAt: new Date()
        },
        {
          upsert: true,
          new: true
        }
      );


      console.log(
        `Gmail account connected: ${gmailEmail}`
      );


      console.log(
        "Refresh token saved successfully"
      );


      // =================================
      // CREATE CYBERGUARD SESSION
      // =================================

      req.session.userId =
        user._id.toString();

      req.session.email =
        email;


      // =================================
      // REDIRECT TO FRONTEND
      // =================================

      const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";


      res.redirect(
        frontendUrl
      );

    } catch (error) {

      console.error(
        "Google OAuth error:",
        error.response?.data ||
          error.message
      );

      res
        .status(500)
        .send(
          "Google authorization failed."
        );
    }
  }
);


// =====================================
// GET CURRENT USER
// =====================================

router.get(
  "/me",
  async (req, res) => {

    try {

      // No active CyberGuard session
      if (!req.session.userId) {
        return res
          .status(401)
          .json({
            success: false,
            authenticated: false
          });
      }


      // Find user
      const user =
        await User.findById(
          req.session.userId
        ).select("-__v");


      if (!user) {

        return res
          .status(401)
          .json({
            success: false,
            authenticated: false
          });
      }


      return res.json({
        success: true,
        authenticated: true,
        user
      });

    } catch (error) {

      console.error(
        "Failed to get current user:",
        error.message
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to get current user"
        });
    }
  }
);


// =====================================
// LOGOUT
// =====================================

router.post(
  "/logout",
  async (req, res) => {

    try {

      const userId =
        req.session.userId;


      // =================================
      // NO ACTIVE SESSION
      // =================================

      if (!userId) {

        return res.json({
          success: true,
          message:
            "Already logged out"
        });
      }


      // =================================
      // FIND CYBERGUARD USER
      // =================================

      const user =
        await User.findById(
          userId
        );


      if (!user) {

        req.session.destroy(
          () => {}
        );

        return res.json({
          success: true,
          message:
            "Logged out successfully"
        });
      }


      // =================================
      // FIND CONNECTED GMAIL ACCOUNT
      // =================================

      const gmailAccount =
        await GmailAccount.findOne({
          email: user.email
        });


      // =================================
      // REVOKE GOOGLE OAUTH ACCESS
      // =================================

      if (
        gmailAccount &&
        gmailAccount.refreshToken
      ) {

        try {

          const oauth2Client =
            createOAuthClient();


          await oauth2Client.revokeToken(
            gmailAccount.refreshToken
          );


          console.log(
            `Google OAuth access revoked: ${user.email}`
          );

        } catch (error) {

          console.error(
            "Google token revocation failed:",
            error.response?.data ||
              error.message
          );

          // Continue logout even if
          // Google token was already revoked
        }
      }


      // =================================
      // REMOVE GMAIL CONNECTION
      // =================================

      await GmailAccount.deleteOne({
        email: user.email
      });


      console.log(
        `Gmail connection removed: ${user.email}`
      );


      // =================================
      // DESTROY CYBERGUARD SESSION
      // =================================

      req.session.destroy(
        (sessionError) => {

          if (sessionError) {

            console.error(
              "Session destroy error:",
              sessionError.message
            );

            return res
              .status(500)
              .json({
                success: false,
                message:
                  "Failed to logout"
              });
          }


          // =================================
          // CLEAR SESSION COOKIE
          // =================================

          res.clearCookie(
            "connect.sid"
          );


          console.log(
            `CyberGuard logout successful: ${user.email}`
          );


          return res.json({
            success: true,
            message:
              "Logged out successfully"
          });
        }
      );

    } catch (error) {

      console.error(
        "Logout error:",
        error.message
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Logout failed"
        });
    }
  }
);


module.exports = router;
