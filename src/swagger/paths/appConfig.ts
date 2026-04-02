/**
 * @swagger
 * /app/config:
 *   get:
 *     tags: [App Config]
 *     summary: Get app configuration
 *     description: |
 *       Returns the public app configuration including maintenance status, active sports,
 *       advertisements (grouped by slot), feature flags, and defaults.
 *
 *       Optionally pass a sport `slug` to get sport-specific configuration.
 *       Authentication is optional — unauthenticated users get limited ad targeting.
 *     parameters:
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: Sport slug to get sport-specific config
 *         example: cricket
 *     responses:
 *       200:
 *         description: App configuration
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
 *                     maintenance:
 *                       type: object
 *                       properties:
 *                         isActive:
 *                           type: boolean
 *                         message:
 *                           type: string
 *                         ads:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Advertisement'
 *                     sports:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           icon:
 *                             type: string
 *                           logo:
 *                             type: string
 *                           splashVideo:
 *                             type: string
 *                     currentSport:
 *                       nullable: true
 *                       allOf:
 *                         - $ref: '#/components/schemas/SportType'
 *                     ads:
 *                       type: object
 *                       description: Ads grouped by slot name
 *                       additionalProperties:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Advertisement'
 *                     features:
 *                       type: object
 *                       description: Feature flag key-value pairs
 *                       additionalProperties: true
 *                     defaults:
 *                       type: object
 *                       description: Default configuration values
 *                       additionalProperties: true
 *
 * /app/health:
 *   get:
 *     tags: [App Config]
 *     summary: Health check
 *     description: Simple health check endpoint. Returns OK if the server is running. No authentication required. Bypasses maintenance mode.
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 ts:
 *                   type: string
 *                   format: date-time
 *                   description: Current server timestamp
 */

export {};
