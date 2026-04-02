/**
 * @swagger
 * /admin/admins:
 *   post:
 *     tags: [Admin Management]
 *     summary: Create admin account
 *     description: Creates a new admin user. Only `super_admin` can create admins.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, username, adminRole]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newadmin@unified.sports"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: "admin_user"
 *               displayName:
 *                 type: string
 *                 maxLength: 50
 *               adminRole:
 *                 $ref: '#/components/schemas/AdminRole'
 *     responses:
 *       201:
 *         description: Admin created
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
 *       400:
 *         description: Validation error or duplicate email/username
 *       403:
 *         description: Not a super_admin
 *   get:
 *     tags: [Admin Management]
 *     summary: List admin accounts
 *     description: Returns paginated list of all admin users. Supports search.
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
 *         description: Paginated admin list
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
 * /admin/admins/{id}:
 *   get:
 *     tags: [Admin Management]
 *     summary: Get admin details
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
 *         description: Admin details
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
 *         description: Admin not found
 *   put:
 *     tags: [Admin Management]
 *     summary: Update admin role
 *     description: Changes an admin's role. Cannot modify your own role.
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
 *             required: [adminRole]
 *             properties:
 *               adminRole:
 *                 $ref: '#/components/schemas/AdminRole'
 *     responses:
 *       200:
 *         description: Admin updated
 *       400:
 *         description: Cannot modify self
 *   delete:
 *     tags: [Admin Management]
 *     summary: Delete admin (demote to user)
 *     description: Removes admin privileges — reverts the user's role to "user". Cannot delete yourself.
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
 *         description: Admin demoted to user
 *       400:
 *         description: Cannot delete self
 *       404:
 *         description: Admin not found
 *
 * /admin/admins/{id}/activate:
 *   put:
 *     tags: [Admin Management]
 *     summary: Activate admin
 *     description: Sets admin's `isActive` to true.
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
 *         description: Admin activated
 *
 * /admin/admins/{id}/deactivate:
 *   put:
 *     tags: [Admin Management]
 *     summary: Deactivate admin
 *     description: Sets admin's `isActive` to false. Cannot deactivate yourself.
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
 *         description: Admin deactivated
 *       400:
 *         description: Cannot deactivate self
 *
 * /admin/me:
 *   put:
 *     tags: [Admin Profile]
 *     summary: Update admin profile
 *     description: Update the authenticated admin's profile (displayName).
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               displayName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *
 * /admin/me/password:
 *   put:
 *     tags: [Admin Profile]
 *     summary: Change admin password
 *     description: Changes the authenticated admin's password. Current password must match.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Current password incorrect
 *
 * /admin/me/avatar:
 *   post:
 *     tags: [Admin Profile]
 *     summary: Upload admin avatar
 *     description: Sets the admin's avatar using a base64 string or URL.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 description: Base64 encoded image
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Image URL
 *     responses:
 *       200:
 *         description: Avatar updated
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *
 * /admin/forgot-password:
 *   post:
 *     tags: [Admin Profile]
 *     summary: Request password reset
 *     description: Sends a password reset link to the admin's email. Returns generic success to prevent email enumeration.
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
 *         description: Reset email sent (if account exists)
 *
 * /admin/reset-password:
 *   post:
 *     tags: [Admin Profile]
 *     summary: Reset password with token
 *     description: Resets admin password using a token from the reset email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *
 * /admin/rooms:
 *   get:
 *     tags: [Admin Rooms]
 *     summary: List rooms (pre-match lobbies)
 *     description: |
 *       Returns paginated list of matches in setup phase (draft, team_setup, toss).
 *       Supports search and status filter.
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
 *           type: string
 *           enum: [draft, team_setup, toss]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by match title
 *     responses:
 *       200:
 *         description: Paginated rooms
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
 * /admin/rooms/{id}:
 *   get:
 *     tags: [Admin Rooms]
 *     summary: Get room details
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
 *         description: Room/match details
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
 * /admin/rooms/{id}/abandon:
 *   put:
 *     tags: [Admin Rooms]
 *     summary: Abandon room
 *     description: Forcefully abandons a match in the setup phase.
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
 *     responses:
 *       200:
 *         description: Room abandoned
 *
 * /analytics/trends:
 *   get:
 *     tags: [Analytics]
 *     summary: User & match growth trends
 *     description: Returns daily user registration and match creation counts over the specified period.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: Trend data
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
 *                     usersByDay:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "2026-03-15"
 *                           count:
 *                             type: integer
 *                     matchesByDay:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *
 * /analytics/engagement:
 *   get:
 *     tags: [Analytics]
 *     summary: Engagement metrics
 *     description: Returns active users, matches played, and average matches per user.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Engagement stats
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
 *                     activeUsers:
 *                       type: integer
 *                     matchesPlayed:
 *                       type: integer
 *                     avgMatchesPerUser:
 *                       type: number
 *
 * /analytics/platform-summary:
 *   get:
 *     tags: [Analytics]
 *     summary: Platform summary
 *     description: Returns total users, matches, completion rate, and average match duration.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Platform summary
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
 *                     totalUsers:
 *                       type: integer
 *                     totalMatches:
 *                       type: integer
 *                     completedMatches:
 *                       type: integer
 *                     liveMatches:
 *                       type: integer
 *                     completionRate:
 *                       type: number
 *                       description: Percentage of matches completed
 *                     avgMatchDurationMs:
 *                       type: number
 *                       description: Average match duration in milliseconds
 *
 * /analytics/growth:
 *   get:
 *     tags: [Analytics]
 *     summary: Growth rate
 *     description: Compares current period vs previous period for user registrations.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Growth data
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
 *                     current:
 *                       type: integer
 *                       description: Users in current period
 *                     previous:
 *                       type: integer
 *                       description: Users in previous period
 *                     growthRate:
 *                       type: number
 *                       description: Growth percentage
 *
 * /analytics/revenue:
 *   get:
 *     tags: [Analytics]
 *     summary: Revenue overview
 *     description: Returns total revenue, order count, and monthly breakdown.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue data
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
 *                     totalRevenue:
 *                       type: number
 *                     totalOrders:
 *                       type: integer
 *                     monthlyRevenue:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: "YYYY-MM"
 *                           total:
 *                             type: number
 *                           count:
 *                             type: integer
 *
 * /analytics/match-analytics:
 *   get:
 *     tags: [Analytics]
 *     summary: Match analytics
 *     description: Returns match breakdown by sport and status.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Match analytics
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
 *                     bySport:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Sport slug
 *                           count:
 *                             type: integer
 *                     byStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             $ref: '#/components/schemas/MatchStatus'
 *                           count:
 *                             type: integer
 *
 * /admin/notifications:
 *   get:
 *     tags: [Admin Notifications]
 *     summary: List all notifications (admin)
 *     description: Returns paginated notifications across all users. Supports filtering by type and read status.
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
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *       - in: query
 *         name: read
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter by read status
 *     responses:
 *       200:
 *         description: Paginated notifications
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
 *                     $ref: '#/components/schemas/Notification'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *
 * /admin/notifications/stats:
 *   get:
 *     tags: [Admin Notifications]
 *     summary: Notification statistics
 *     description: Returns total, unread, and per-type notification counts.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notification stats
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
 *                     total:
 *                       type: integer
 *                     unread:
 *                       type: integer
 *                     byType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *
 * /admin/notifications/{id}:
 *   delete:
 *     tags: [Admin Notifications]
 *     summary: Delete notification (admin)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted (no content)
 */

export {};
