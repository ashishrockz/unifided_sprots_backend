/**
 * @file    swagger/config.ts
 * @desc    Swagger / OpenAPI 3.0 configuration — serves interactive docs at /api-docs.
 */
import swaggerJsdoc from "swagger-jsdoc";
import { env } from "../config/env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Unified Sports API",
      version: "1.0.0",
      description:
        "Multi-sport match management platform API — Cricket, Tennis, Badminton, Pickleball.\n\n" +
        "## Authentication\n" +
        "Most endpoints require a **Bearer JWT** token in the `Authorization` header.\n" +
        "Obtain tokens via OTP verification (`/auth/otp/verify`) or admin login (`/admin/auth/login`).\n\n" +
        "## Real-time\n" +
        "Live match updates are pushed via **Socket.IO** on the same host (`ws://`).\n\n" +
        "## Response Envelope\n" +
        "All responses follow: `{ success, data?, message?, pagination? }`",
      contact: { name: "Unified Sports Team" },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: "Local development",
      },
    ],
    tags: [
      { name: "Auth", description: "OTP-based user authentication" },
      { name: "Admin Auth", description: "Admin email + password authentication" },
      { name: "Profile", description: "User profile & sport stats" },
      { name: "Friends", description: "Friend requests & friend list" },
      { name: "Sports", description: "Sport types (public)" },
      { name: "Sports Admin", description: "Sport type management (admin)" },
      { name: "Matches", description: "Match lifecycle — create, setup teams, start, abandon" },
      { name: "Toss", description: "Toss management" },
      { name: "Scoring", description: "Ball-by-ball scoring & scorecard" },
      { name: "Leaderboard", description: "Sport leaderboards & player stats" },
      { name: "Notifications", description: "User notifications" },
      { name: "Ads", description: "User ad interactions" },
      { name: "Ads Admin", description: "Advertisement management (admin)" },
      { name: "App Config", description: "Public app configuration & health" },
      { name: "Admin Config", description: "System configuration management" },
      { name: "Admin Users", description: "User management (admin)" },
      { name: "Admin Matches", description: "Match management (admin)" },
      { name: "Dashboard", description: "Admin dashboard stats" },
      { name: "Admin Management", description: "Create & manage admin accounts (super_admin)" },
      { name: "Admin Profile", description: "Admin self-service profile" },
      { name: "Admin Rooms", description: "Room/lobby management (admin)" },
      { name: "Analytics", description: "Platform analytics" },
      { name: "Admin Notifications", description: "Notification management (admin)" },
      { name: "Admin App Config", description: "App config management (admin)" },
      { name: "SuperAdmin", description: "Super admin dashboard" },
      { name: "Plans", description: "Subscription plans & match packs" },
      { name: "Subscriptions", description: "Subscription management (admin)" },
      { name: "Orders", description: "Order management (admin)" },
      { name: "Revenue", description: "Revenue analytics (super_admin)" },
      { name: "Audit Logs", description: "System audit trail (super_admin)" },
      { name: "Upload", description: "Media uploads (admin)" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token obtained from `/auth/otp/verify` or `/admin/auth/login`",
        },
      },
    },
  },
  apis: ["./src/swagger/paths/*.ts", "./src/swagger/schemas.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
