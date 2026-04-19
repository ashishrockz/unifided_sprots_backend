/**
 * @file    modules/legal/legal.routes.ts
 * @desc    Public endpoints for Terms of Service and Privacy Policy.
 *          Content is stored here and served as JSON arrays so the
 *          mobile app can fetch it without hardcoding.
 */
import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";

/* ══════════════════════════════════════════════════════
   Terms of Service
   ══════════════════════════════════════════════════════ */
const TERMS_OF_SERVICE = [
  {
    heading: "Acceptance of Terms",
    body: "By accessing or using CricCircle, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.",
  },
  {
    heading: "Eligibility",
    body: "You must be at least 13 years old to create an account. If you are under 18, you must have parental or guardian consent to use CricCircle.",
  },
  {
    heading: "Account & Authentication",
    body: "You are responsible for keeping your login credentials secure. CricCircle uses OTP-based authentication. You must provide a valid email or phone number. Do not share your OTP with anyone.",
  },
  {
    heading: "User Conduct",
    body: "You agree not to:\n\u2022 Submit false scores or manipulate match data\n\u2022 Impersonate other players or teams\n\u2022 Use the app for any unlawful or abusive purpose\n\u2022 Attempt to disrupt matches or rooms created by other users\n\u2022 Harass, abuse, or send unwanted friend requests to other users",
  },
  {
    heading: "Matches & Scoring",
    body: "CricCircle provides tools for creating rooms, managing teams, and recording live scores for cricket and other supported sports. All match data entered by users is their responsibility. CricCircle does not verify the accuracy of scores.",
  },
  {
    heading: "Rooms & Teams",
    body: "Room creators are responsible for managing participants and match settings. CricCircle may limit the number of active rooms per user. Abandoned rooms may be automatically cleaned up.",
  },
  {
    heading: "Intellectual Property",
    body: "All CricCircle branding, design, and software are owned by CricCircle. User-generated content (match data, profiles) remains yours, but you grant CricCircle a license to display it within the app and related services.",
  },
  {
    heading: "Subscriptions & Payments",
    body: "Certain features may require a paid subscription. Subscription terms, pricing, and cancellation policies will be presented before purchase. Refunds are subject to the app store policies.",
  },
  {
    heading: "Termination",
    body: "CricCircle reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or remain inactive for an extended period.",
  },
  {
    heading: "Limitation of Liability",
    body: 'CricCircle is provided "as is". We are not liable for any loss of data, match results, or interruptions in service. Use the app at your own discretion.',
  },
  {
    heading: "Changes to Terms",
    body: "We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the revised terms.",
  },
];

/* ══════════════════════════════════════════════════════
   Privacy Policy
   ══════════════════════════════════════════════════════ */
const PRIVACY_POLICY = [
  {
    heading: "Information We Collect",
    body: "We collect the following information when you use CricCircle:\n\n\u2022 Email address or phone number (for authentication)\n\u2022 Display name, username, and profile photo\n\u2022 Match data, scores, and statistics you create\n\u2022 Device information (platform, app version)\n\u2022 Location data (only when you opt in, for nearby matches)",
  },
  {
    heading: "How We Use Your Information",
    body: "\u2022 To authenticate and secure your account via OTP\n\u2022 To display your profile to friends and match participants\n\u2022 To show live scores and match history\n\u2022 To find nearby matches (if location is enabled)\n\u2022 To send match notifications and friend requests\n\u2022 To improve app performance and fix bugs",
  },
  {
    heading: "Data Sharing",
    body: "We do not sell your personal data. Your information may be shared with:\n\n\u2022 Other CricCircle users (profile, match stats \u2014 based on your privacy settings)\n\u2022 Service providers (hosting, email/SMS delivery) who process data on our behalf\n\u2022 Law enforcement, if required by law",
  },
  {
    heading: "Profile Visibility",
    body: "You control who can see your profile through privacy settings:\n\n\u2022 Public \u2014 visible to all CricCircle users\n\u2022 Friends Only \u2014 visible to your friends list\n\u2022 Private \u2014 only you can see your full profile",
  },
  {
    heading: "Data Storage & Security",
    body: "Your data is stored securely on encrypted servers. Passwords are hashed using bcrypt. Authentication tokens are stored securely on your device. We use HTTPS for all data transmission.",
  },
  {
    heading: "Real-Time Data",
    body: "CricCircle uses WebSocket connections for live score updates. These connections are authenticated and only transmit match data for rooms you are subscribed to.",
  },
  {
    heading: "Notifications",
    body: "We may send push notifications for match updates, friend requests, and important account alerts. You can manage notification preferences in your device settings.",
  },
  {
    heading: "Data Retention",
    body: "Your account data is retained as long as your account is active. Match history is retained for statistical purposes. You can request deletion of your account and associated data by contacting support.",
  },
  {
    heading: "Your Rights",
    body: "You have the right to:\n\n\u2022 Access your personal data\n\u2022 Correct inaccurate information\n\u2022 Delete your account and data\n\u2022 Export your match history\n\u2022 Opt out of location sharing at any time",
  },
  {
    heading: "Children\u2019s Privacy",
    body: "CricCircle does not knowingly collect data from children under 13. If we discover such data has been collected, it will be deleted promptly.",
  },
  {
    heading: "Changes to This Policy",
    body: "We may update this policy periodically. We will notify you of significant changes through the app. Continued use after changes constitutes acceptance.",
  },
  {
    heading: "Contact Us",
    body: "For any privacy-related questions or data requests, reach out to us through the app\u2019s support section or email us at support@criccircle.com.",
  },
];

/* ══════════════════════════════════════════════════════
   Routes
   ══════════════════════════════════════════════════════ */
export const legalRoutes = Router();

/** GET /legal/terms — Terms of Service */
legalRoutes.get(
  "/terms",
  asyncHandler(async (_req, res) => {
    ok(res, {
      title: "Terms of Service",
      lastUpdated: "2026-04-01",
      sections: TERMS_OF_SERVICE,
    }, "Fetched Terms of Service");
  }),
);

/** GET /legal/privacy — Privacy Policy */
legalRoutes.get(
  "/privacy",
  asyncHandler(async (_req, res) => {
    ok(res, {
      title: "Privacy Policy",
      lastUpdated: "2026-04-01",
      sections: PRIVACY_POLICY,
    }, "Fetched Privacy Policy");
  }),
);
