/**
 * @swagger
 * /sports/{slug}/leaderboard:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Get sport leaderboard
 *     description: |
 *       Returns a paginated leaderboard for a specific sport.
 *       Players are ranked by the selected category.
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
 *         name: category
 *         schema:
 *           type: string
 *           enum:
 *             - overall
 *             - most_runs
 *             - highest_average
 *             - best_strike_rate
 *             - most_fifties
 *             - most_hundreds
 *             - most_wickets
 *             - best_economy
 *             - most_catches
 *             - most_mvps
 *             - most_pom
 *             - most_wins
 *           default: overall
 *         description: Leaderboard ranking category
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
 *         description: Paginated leaderboard
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
 *                     $ref: '#/components/schemas/CricketPlayerStats'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       404:
 *         description: Sport not found
 *
 * /sports/{slug}/players/{userId}/stats:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Get player stats for sport
 *     description: Returns a single player's detailed statistics for a specific sport.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: cricket
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Target user's ID
 *     responses:
 *       200:
 *         description: Player stats
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
 *         description: Player or stats not found
 */

export {};
