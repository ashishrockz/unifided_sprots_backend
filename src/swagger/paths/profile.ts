/**
 * @swagger
 * /profile/me:
 *   get:
 *     tags: [Profile]
 *     summary: Get own profile
 *     description: Returns the authenticated user's full profile including friend count and aggregate sport stats.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         friendsCount:
 *                           type: integer
 *                           example: 12
 *       401:
 *         description: Not authenticated
 *   put:
 *     tags: [Profile]
 *     summary: Update own profile
 *     description: |
 *       Update the authenticated user's profile fields.
 *       Only whitelisted fields are accepted — you cannot change username, email, or role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: "John Doe"
 *               bio:
 *                 type: string
 *                 maxLength: 250
 *                 example: "Love cricket and badminton"
 *               avatar:
 *                 type: string
 *                 format: uri
 *                 example: "https://cdn.example.com/avatar.jpg"
 *               country:
 *                 type: string
 *                 maxLength: 2
 *                 example: "IN"
 *               profileVisibility:
 *                 $ref: '#/components/schemas/Visibility'
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
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *
 * /profile/{userId}:
 *   get:
 *     tags: [Profile]
 *     summary: View user's public profile
 *     description: |
 *       Returns another user's profile. Respects `profileVisibility`:
 *       - **public**: full profile returned
 *       - **friends_only**: full profile only if friends, otherwise limited
 *       - **private**: only username, displayName, avatar, and profileVisibility
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Target user's ID
 *     responses:
 *       200:
 *         description: User profile (may be limited based on visibility)
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
 *       404:
 *         description: User not found
 *
 * /profile/me/{slug}/stats:
 *   get:
 *     tags: [Profile]
 *     summary: Get own sport-specific stats
 *     description: Returns the authenticated user's detailed statistics for a specific sport (e.g., cricket batting, bowling, fielding stats).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Sport slug (e.g., "cricket")
 *         example: cricket
 *     responses:
 *       200:
 *         description: Sport-specific player stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CricketPlayerStats'
 *       404:
 *         description: No stats found for this sport
 *
 * /profile/{userId}/{slug}/stats:
 *   get:
 *     tags: [Profile]
 *     summary: Get another user's sport stats
 *     description: Returns another user's detailed statistics for a specific sport.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Target user's ID
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Sport slug
 *         example: cricket
 *     responses:
 *       200:
 *         description: Sport-specific player stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CricketPlayerStats'
 *       404:
 *         description: User or stats not found
 *
 * /profile/me/{slug}/match-history:
 *   get:
 *     tags: [Profile]
 *     summary: Get own match history
 *     description: Returns paginated list of completed/abandoned matches the authenticated user participated in for a specific sport.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: cricket
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated match history
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       status:
 *                         $ref: '#/components/schemas/MatchStatus'
 *                       teams:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                       winner:
 *                         type: integer
 *                         nullable: true
 *                       result:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           margin:
 *                             type: integer
 *                           description:
 *                             type: string
 *                       startedAt:
 *                         type: string
 *                         format: date-time
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *
 * /profile/{userId}/{slug}/match-history:
 *   get:
 *     tags: [Profile]
 *     summary: Get another user's match history
 *     description: Returns paginated match history for another user in a specific sport.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: cricket
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
 *     responses:
 *       200:
 *         description: Paginated match history
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
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       404:
 *         description: User not found
 */

export {};
