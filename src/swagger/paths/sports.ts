/**
 * @swagger
 * /sports:
 *   get:
 *     tags: [Sports]
 *     summary: List active sports
 *     description: |
 *       Returns all active sport types. Cached for 5 minutes (300s TTL).
 *       No authentication required.
 *     responses:
 *       200:
 *         description: List of active sports
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
 *                     $ref: '#/components/schemas/SportType'
 *
 * /sports/{slug}:
 *   get:
 *     tags: [Sports]
 *     summary: Get sport by slug
 *     description: Returns a single sport type by its slug. No authentication required.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Sport slug
 *         example: cricket
 *     responses:
 *       200:
 *         description: Sport details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SportType'
 *       404:
 *         description: Sport not found
 *
 * /admin/sports:
 *   post:
 *     tags: [Sports Admin]
 *     summary: Create sport type
 *     description: Creates a new sport type. Requires `super_admin` or `sport_admin` role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, scoringType, minPlayersPerTeam, maxPlayersPerTeam]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Cricket"
 *               slug:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 30
 *                 pattern: "^[a-z0-9-]+$"
 *                 example: "cricket"
 *               scoringType:
 *                 $ref: '#/components/schemas/ScoringType'
 *               minPlayersPerTeam:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 15
 *                 example: 2
 *               maxPlayersPerTeam:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 15
 *                 example: 11
 *               rules:
 *                 type: object
 *                 description: Sport-specific rules configuration
 *               uiConfig:
 *                 type: object
 *                 description: UI display configuration
 *               icon:
 *                 type: string
 *                 format: uri
 *               logo:
 *                 type: string
 *                 format: uri
 *               splashVideo:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Sport created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SportType'
 *       400:
 *         description: Validation error or slug already exists
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *   get:
 *     tags: [Sports Admin]
 *     summary: List all sports (admin)
 *     description: Returns all sports including inactive ones. Requires admin auth.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All sports
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
 *                     $ref: '#/components/schemas/SportType'
 *
 * /admin/sports/{id}:
 *   get:
 *     tags: [Sports Admin]
 *     summary: Get sport by ID (admin)
 *     description: Returns a single sport by its MongoDB ID.
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
 *         description: Sport details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SportType'
 *       404:
 *         description: Sport not found
 *   put:
 *     tags: [Sports Admin]
 *     summary: Update sport type
 *     description: Updates an existing sport type. Invalidates the Redis cache.
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
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               scoringType:
 *                 $ref: '#/components/schemas/ScoringType'
 *               minPlayersPerTeam:
 *                 type: integer
 *               maxPlayersPerTeam:
 *                 type: integer
 *               rules:
 *                 type: object
 *               uiConfig:
 *                 type: object
 *               icon:
 *                 type: string
 *               logo:
 *                 type: string
 *               splashVideo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sport updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SportType'
 *       404:
 *         description: Sport not found
 *   delete:
 *     tags: [Sports Admin]
 *     summary: Soft-delete sport
 *     description: Sets the sport's `isActive` to false (soft delete). Invalidates cache.
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
 *         description: Sport deactivated
 *       404:
 *         description: Sport not found
 *
 * /admin/sports/{id}/toggle:
 *   patch:
 *     tags: [Sports Admin]
 *     summary: Toggle sport active status
 *     description: Toggles the `isActive` flag on a sport type. Invalidates cache.
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
 *         description: Sport toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SportType'
 */

export {};
