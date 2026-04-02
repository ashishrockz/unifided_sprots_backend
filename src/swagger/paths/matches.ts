/**
 * @swagger
 * /sports/{slug}/matches:
 *   get:
 *     tags: [Matches]
 *     summary: List matches by sport
 *     description: Returns paginated matches for a specific sport. No authentication required.
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
 *         description: Filter by match status
 *     responses:
 *       200:
 *         description: Paginated match list
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
 *                     $ref: '#/components/schemas/MatchSummary'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *   post:
 *     tags: [Matches]
 *     summary: Create a new match
 *     description: |
 *       Creates a new match in `draft` status with two empty teams.
 *       The authenticated user becomes the match creator.
 *
 *       **Validation:** Creator cannot already be in another live/toss match.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: cricket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, matchConfig]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Weekend T20"
 *               matchConfig:
 *                 $ref: '#/components/schemas/MatchConfig'
 *     responses:
 *       201:
 *         description: Match created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Match'
 *       400:
 *         description: Validation error or user already in active match
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Sport not found
 *
 * /sports/{slug}/matches/{matchId}:
 *   get:
 *     tags: [Matches]
 *     summary: Get match details
 *     description: Returns full match detail with populated creator and team players.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: cricket
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full match details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Match'
 *       404:
 *         description: Match not found
 *
 * /matches/{matchId}/players:
 *   post:
 *     tags: [Matches]
 *     summary: Add players to team
 *     description: |
 *       Adds registered players to a specific team in the match.
 *       Players are added with default role `batsman` and `isGuest=false`.
 *       Only the match creator can add players.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamIndex, playerIds]
 *             properties:
 *               teamIndex:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: "0 = Team 1, 1 = Team 2"
 *               playerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 15
 *                 description: Array of user IDs to add
 *     responses:
 *       200:
 *         description: Players added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Match'
 *       400:
 *         description: Players already in team or validation error
 *       403:
 *         description: Not the match creator
 *
 * /matches/{matchId}/players/guest:
 *   post:
 *     tags: [Matches]
 *     summary: Add guest player
 *     description: Adds a guest (non-registered) player to a team. The guest gets a generated guestId.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamIndex, name]
 *             properties:
 *               teamIndex:
 *                 type: integer
 *                 enum: [0, 1]
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: "Guest Player 1"
 *     responses:
 *       200:
 *         description: Guest player added
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
 * /matches/{matchId}/teams/{ti}/captain:
 *   put:
 *     tags: [Matches]
 *     summary: Set team captain
 *     description: Sets a player as captain for a specific team.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: ti
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: "Team index (0 or 1)"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [playerId]
 *             properties:
 *               playerId:
 *                 type: string
 *                 description: User ID of the player to set as captain
 *     responses:
 *       200:
 *         description: Captain set
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
 * /matches/{matchId}/teams/{ti}/wicketkeeper:
 *   put:
 *     tags: [Matches]
 *     summary: Set team wicketkeeper
 *     description: Sets a player as wicketkeeper for a specific team. Updates player role to "wicketkeeper".
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: ti
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [playerId]
 *             properties:
 *               playerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wicketkeeper set
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
 * /matches/{matchId}/players/{pid}/role:
 *   put:
 *     tags: [Matches]
 *     summary: Update player role
 *     description: Updates a player's role (batsman, bowler, all_rounder, wicketkeeper).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         description: Player's user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 $ref: '#/components/schemas/PlayerRole'
 *     responses:
 *       200:
 *         description: Player role updated
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
 * /matches/{matchId}/teams/{ti}/batting-order:
 *   put:
 *     tags: [Matches]
 *     summary: Set batting order
 *     description: Sets the batting order for a team. Each player's `battingPosition` is updated based on array index.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: ti
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order]
 *             properties:
 *               order:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: Array of player IDs in desired batting order
 *     responses:
 *       200:
 *         description: Batting order set
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
 * /matches/{matchId}/teams/validate:
 *   post:
 *     tags: [Matches]
 *     summary: Validate team setup
 *     description: |
 *       Validates that both teams are properly set up for the match to proceed:
 *       - Both teams have a captain
 *       - Both teams have a wicketkeeper
 *       - Both teams meet minimum player count
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Validation result
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
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Team 1 has no captain"]
 *
 * /matches/{matchId}/start:
 *   post:
 *     tags: [Matches]
 *     summary: Start match
 *     description: |
 *       Starts the match after toss decision is made.
 *
 *       **Requirements:**
 *       - Match status must be `toss`
 *       - Toss must have a `decision` (bat/bowl)
 *
 *       **Side effects:**
 *       - Creates innings[0] with batting/bowling cards initialized
 *       - Status changes to `live`
 *       - Emits `match:started` socket event
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Match'
 *       400:
 *         description: Match not in toss status or no toss decision
 *       403:
 *         description: Not the match creator
 *
 * /matches/{matchId}/abandon:
 *   post:
 *     tags: [Matches]
 *     summary: Abandon match (creator)
 *     description: |
 *       Abandons the match. Only the match creator can abandon.
 *       Sets `abandonedBy` to "creator".
 *       Emits `match:abandoned` socket event.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
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
 *                 example: "Rain stopped play"
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
 *       400:
 *         description: Match already completed/abandoned
 *       403:
 *         description: Not the match creator
 */

export {};
