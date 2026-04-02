/**
 * @swagger
 * /admin/config:
 *   get:
 *     tags: [Admin Config]
 *     summary: List all system configs
 *     description: Returns all system configuration entries. Requires admin authentication.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All system configs
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
 *                     $ref: '#/components/schemas/SystemConfig'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient role
 *   put:
 *     tags: [Admin Config]
 *     summary: Update system configs
 *     description: Updates one or more system configuration entries. Creates entries that don't exist.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [configs]
 *             properties:
 *               configs:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [key, value]
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: "match.maxOvers"
 *                     value:
 *                       description: Any JSON value
 *                       example: 50
 *                     category:
 *                       $ref: '#/components/schemas/ConfigCategory'
 *                     description:
 *                       type: string
 *                       maxLength: 200
 *     responses:
 *       200:
 *         description: Configs updated
 *       400:
 *         description: Validation error
 *
 * /admin/config/maintenance:
 *   post:
 *     tags: [Admin Config]
 *     summary: Toggle maintenance mode
 *     description: |
 *       Enables or disables maintenance mode. When active, all non-admin API
 *       endpoints return a maintenance response. Updates Redis cache immediately.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [active]
 *             properties:
 *               active:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Scheduled maintenance — back in 30 minutes"
 *     responses:
 *       200:
 *         description: Maintenance mode updated
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
 *                     active:
 *                       type: boolean
 *
 * /admin/config/features:
 *   get:
 *     tags: [Admin Config]
 *     summary: List feature toggles
 *     description: Returns all feature flag configurations.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Feature configs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SystemConfig'
 *
 * /admin/config/features/{key}:
 *   put:
 *     tags: [Admin Config]
 *     summary: Toggle a feature flag
 *     description: Updates the value of a specific feature flag.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         example: "commentary"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Feature updated
 *
 * /admin/users:
 *   get:
 *     tags: [Admin Users]
 *     summary: List users
 *     description: Returns paginated list of all users. Supports search by username or email.
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username or email
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *
 * /admin/users/{id}:
 *   get:
 *     tags: [Admin Users]
 *     summary: Get user details
 *     description: Returns full details for a specific user.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *
 * /admin/users/{id}/ban:
 *   put:
 *     tags: [Admin Users]
 *     summary: Ban user
 *     description: Sets user's `isActive` to false, effectively banning them from the platform.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User banned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *
 * /admin/users/{id}/unban:
 *   put:
 *     tags: [Admin Users]
 *     summary: Unban user
 *     description: Sets user's `isActive` to true.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unbanned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *
 * /admin/users/{id}/activate:
 *   put:
 *     tags: [Admin Users]
 *     summary: Activate user
 *     description: Alias for unban — sets user's `isActive` to true.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User activated
 *
 * /admin/users/{id}/deactivate:
 *   put:
 *     tags: [Admin Users]
 *     summary: Deactivate user
 *     description: Alias for ban — sets user's `isActive` to false.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated
 *
 * /admin/users/bulk-action:
 *   put:
 *     tags: [Admin Users]
 *     summary: Bulk user action
 *     description: Perform bulk ban/unban/activate/deactivate on multiple users at once.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userIds, action]
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: Array of user IDs
 *               action:
 *                 type: string
 *                 enum: [ban, unban, activate, deactivate]
 *     responses:
 *       200:
 *         description: Bulk action completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *
 * /admin/users/export:
 *   get:
 *     tags: [Admin Users]
 *     summary: Export users
 *     description: |
 *       Exports users as CSV or JSON. Fields: username, email, mobile, displayName, isActive, plan, createdAt.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by user status
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Exported user data
 *
 * /admin/users/{id}/subscription:
 *   put:
 *     tags: [Admin Users]
 *     summary: Update user subscription
 *     description: Manually update a user's subscription plan and expiry date.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan]
 *             properties:
 *               plan:
 *                 $ref: '#/components/schemas/SubPlan'
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Subscription expiry date (null = never expires)
 *     responses:
 *       200:
 *         description: Subscription updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *
 * /admin/matches:
 *   get:
 *     tags: [Admin Matches]
 *     summary: List all matches (admin)
 *     description: Returns paginated list of all matches across all sports. Supports status filter.
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
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/MatchStatus'
 *     responses:
 *       200:
 *         description: Paginated matches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MatchSummary'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *
 * /admin/matches/{id}:
 *   get:
 *     tags: [Admin Matches]
 *     summary: Get match details (admin)
 *     description: Returns full match details with populated creator and team players.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Match'
 *       404:
 *         description: Match not found
 *
 * /admin/matches/{id}/abandon:
 *   put:
 *     tags: [Admin Matches]
 *     summary: Admin abandon match
 *     description: |
 *       Forcefully abandons a match. Sets `abandonedBy` to "admin".
 *       Requires `matches:abandon` permission.
 *
 *       **Emits:** `match:abandoned` socket event.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *                 default: "Admin action"
 *     responses:
 *       200:
 *         description: Match abandoned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Match'
 *
 * /admin/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics
 *     description: |
 *       Returns a comprehensive dashboard overview in a single optimized query:
 *       - Total counts (users, matches, live, completed, abandoned, sports, admins)
 *       - Recent matches (last 5)
 *       - Recent users (last 5)
 *       - Subscription distribution and expiring-soon count
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
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
 *                     counts:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         totalMatches:
 *                           type: integer
 *                         liveMatches:
 *                           type: integer
 *                         completedMatches:
 *                           type: integer
 *                         abandonedMatches:
 *                           type: integer
 *                         activeSports:
 *                           type: integer
 *                         totalAdmins:
 *                           type: integer
 *                     recentMatches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           sportSlug:
 *                             type: string
 *                           status:
 *                             $ref: '#/components/schemas/MatchStatus'
 *                           creator:
 *                             $ref: '#/components/schemas/UserSummary'
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           startedAt:
 *                             type: string
 *                             format: date-time
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                           result:
 *                             type: object
 *                     recentUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           avatar:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           isActive:
 *                             type: boolean
 *                           subscription:
 *                             type: object
 *                     subscriptionStats:
 *                       type: object
 *                       properties:
 *                         distribution:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: Plan name
 *                               count:
 *                                 type: integer
 *                         expiringSoon:
 *                           type: integer
 *                           description: Subscriptions expiring within 7 days
 */

export {};
