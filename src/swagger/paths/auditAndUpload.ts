/**
 * @swagger
 * /audit-logs:
 *   get:
 *     tags: [Audit Logs]
 *     summary: List audit logs
 *     description: |
 *       Returns paginated audit trail entries. Only accessible by `super_admin`.
 *       Supports filtering by action, actor, and target model.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type (e.g., "user.ban", "config.update")
 *       - in: query
 *         name: actorId
 *         schema:
 *           type: string
 *         description: Filter by actor user ID
 *       - in: query
 *         name: targetModel
 *         schema:
 *           type: string
 *         description: Filter by target model name (e.g., "User", "Match", "SystemConfig")
 *     responses:
 *       200:
 *         description: Paginated audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       403:
 *         description: Not a super_admin
 *
 * /upload/ad-media:
 *   post:
 *     tags: [Upload]
 *     summary: Upload ad media
 *     description: |
 *       Uploads media for advertisements. Accepts a URL or base64-encoded media.
 *       Requires `super_admin` or `content_manager` role.
 *
 *       > **Note:** This is currently a placeholder — cloud storage (S3/Cloudinary) is not yet integrated.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Media URL to store
 *               media:
 *                 type: string
 *                 description: Base64-encoded media content
 *     responses:
 *       200:
 *         description: Media uploaded
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
 *                     url:
 *                       type: string
 *                       description: Stored media URL
 *                     publicId:
 *                       type: string
 *                     resourceType:
 *                       type: string
 *                     format:
 *                       type: string
 *       403:
 *         description: Insufficient permissions
 *
 * /app-config/admin:
 *   get:
 *     tags: [Admin App Config]
 *     summary: Get full admin config
 *     description: Returns full configuration for the admin panel — all system configs, sports, and ads grouped.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin panel config
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     configs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SystemConfig'
 *                     sports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SportType'
 *                     ads:
 *                       type: object
 *                       description: Ads grouped by slot
 *
 * /app-config:
 *   put:
 *     tags: [Admin App Config]
 *     summary: Update app configs
 *     description: Updates system configuration key-value pairs.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Key-value pairs to update
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Configs updated
 *
 * /app-config/test-sms:
 *   post:
 *     tags: [Admin App Config]
 *     summary: Test SMS delivery
 *     description: Sends a test SMS to verify SMS configuration. Placeholder — not yet functional.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+919876543210"
 *     responses:
 *       200:
 *         description: Test SMS sent
 *
 * /app-config/test-smtp:
 *   post:
 *     tags: [Admin App Config]
 *     summary: Test SMTP delivery
 *     description: Sends a test email to verify SMTP configuration. Placeholder — not yet functional.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Test email sent
 */

export {};
