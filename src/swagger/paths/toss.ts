/**
 * @swagger
 * /matches/{matchId}/toss:
 *   post:
 *     tags: [Toss]
 *     summary: Perform toss
 *     description: |
 *       Performs the coin toss for a match. The result is randomly generated.
 *       Match status transitions to `toss`.
 *
 *       **Emits:** `toss:completed` socket event to the match room.
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
 *             required: [calledBy, call]
 *             properties:
 *               calledBy:
 *                 type: string
 *                 description: "Team index that calls the toss (0 or 1)"
 *                 example: "0"
 *               call:
 *                 $ref: '#/components/schemas/TossCall'
 *     responses:
 *       200:
 *         description: Toss performed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Toss'
 *       400:
 *         description: Match not ready for toss
 *       403:
 *         description: Not the match creator
 *   get:
 *     tags: [Toss]
 *     summary: Get toss result
 *     description: Returns the toss result for a match, or null if toss hasn't been performed.
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
 *         description: Toss result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   nullable: true
 *                   allOf:
 *                     - $ref: '#/components/schemas/Toss'
 *       404:
 *         description: Match not found
 *
 * /matches/{matchId}/toss/decision:
 *   post:
 *     tags: [Toss]
 *     summary: Set toss decision
 *     description: |
 *       The toss winner chooses to bat or bowl first.
 *
 *       **Emits:** `toss:decision` socket event to the match room.
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
 *             required: [decision]
 *             properties:
 *               decision:
 *                 $ref: '#/components/schemas/TossDecision'
 *     responses:
 *       200:
 *         description: Decision recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Toss'
 *       400:
 *         description: Toss not performed or decision already made
 */

export {};
