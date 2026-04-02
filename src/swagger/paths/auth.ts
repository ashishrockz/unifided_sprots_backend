/**
 * @swagger
 * /auth/otp/send:
 *   post:
 *     tags: [Auth]
 *     summary: Send OTP
 *     description: |
 *       Sends a one-time password to the user's email or mobile number.
 *       If the user doesn't exist, a new account is created automatically.
 *
 *       **Rate limit:** 3 requests per 10 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, type]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address or mobile number
 *                 example: "john@example.com"
 *               type:
 *                 type: string
 *                 enum: [email, mobile]
 *                 description: Channel to send OTP through
 *                 example: "email"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *       400:
 *         description: Validation error (invalid email/mobile format)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /auth/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP & get tokens
 *     description: |
 *       Verifies the OTP and returns JWT access + refresh tokens.
 *       The user is created on first verification if they don't exist.
 *
 *       **Rate limit:** 10 requests per 10 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, type, otp]
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: "john@example.com"
 *               type:
 *                 type: string
 *                 enum: [email, mobile]
 *                 example: "email"
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "123456"
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   platform:
 *                     type: string
 *                     example: "android"
 *                   deviceId:
 *                     type: string
 *                     example: "abc123"
 *                   appVersion:
 *                     type: string
 *                     example: "1.0.0"
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access + refresh token pair.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIs..."
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TokenPair'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     description: Invalidates the current session. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         description: Not authenticated
 *
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get authenticated user
 *     description: Returns the full profile of the currently authenticated user.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *
 * /admin/auth/login:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Admin login
 *     description: |
 *       Authenticate an admin user with email and password.
 *       Returns JWT access + refresh tokens.
 *
 *       Also available at `POST /admin/login` (alias).
 *
 *       **Rate limit:** 10 requests per 10 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@unified.sports"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "securePass123"
 *     responses:
 *       200:
 *         description: Admin authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Rate limit exceeded
 *
 * /admin/auth/refresh:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Refresh admin token
 *     description: Exchange a valid admin refresh token for new tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TokenPair'
 *       401:
 *         description: Invalid refresh token
 *
 * /admin/auth/logout:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Admin logout
 *     description: Invalidates the admin session.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 *       401:
 *         description: Not authenticated
 *
 * /admin/auth/me:
 *   get:
 *     tags: [Admin Auth]
 *     summary: Get authenticated admin
 *     description: Returns the profile of the currently authenticated admin.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current admin profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */

export {};
