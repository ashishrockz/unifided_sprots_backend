/**
 * @swagger
 * /matches/{matchId}/score:
 *   post:
 *     tags: [Scoring]
 *     summary: Record a ball
 *     description: |
 *       Records a single ball delivery with runs, extras, and/or wicket information.
 *       This is the core scoring endpoint — it updates:
 *
 *       - **Batsman card**: runs, balls faced, fours, sixes, strike rate, milestones
 *       - **Bowler card**: overs, runs conceded, wickets, economy
 *       - **Innings totals**: runs, wickets, extras, run rate
 *       - **Over data**: ball-by-ball breakdown
 *       - **Strike rotation**: auto-swaps on odd runs or end of over
 *       - **Fall of wickets**: recorded on dismissal
 *       - **Auto innings transition**: detects all-out, overs complete, or target chased
 *       - **Player stats**: updated asynchronously in the background
 *
 *       **Socket events emitted:**
 *       - `score:updated` — after every ball
 *       - `wicket` — on dismissal
 *       - `over:completed` — at end of over
 *       - `innings:completed` — when innings ends
 *       - `match:completed` — when match is decided
 *
 *       A `lastBallSnapshot` is saved for undo functionality.
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
 *             required: [batsmanId, bowlerId, runs]
 *             properties:
 *               batsmanId:
 *                 type: string
 *                 description: ID of the batsman facing the delivery
 *               bowlerId:
 *                 type: string
 *                 description: ID of the bowler delivering
 *               runs:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 7
 *                 description: Runs scored off the bat
 *                 example: 4
 *               extras:
 *                 type: object
 *                 description: Extra runs (optional)
 *                 properties:
 *                   type:
 *                     $ref: '#/components/schemas/ExtraType'
 *                   runs:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 5
 *                     example: 1
 *               isWicket:
 *                 type: boolean
 *                 description: Whether a wicket fell on this ball
 *                 default: false
 *               wicket:
 *                 type: object
 *                 description: Wicket details (required if isWicket is true)
 *                 properties:
 *                   type:
 *                     $ref: '#/components/schemas/WicketType'
 *                   dismissedBatsman:
 *                     type: string
 *                     description: ID of the dismissed batsman (can differ from striker on run-outs)
 *                   fielder:
 *                     type: string
 *                     description: ID of the fielder involved (optional)
 *                   isKeeperCatch:
 *                     type: boolean
 *                     description: Whether it was a keeper catch
 *               shotType:
 *                 type: string
 *                 maxLength: 30
 *                 description: Type of shot played (e.g., "cover drive")
 *           examples:
 *             normalRun:
 *               summary: Normal 4 runs
 *               value:
 *                 batsmanId: "665a1b2c3d4e5f6a7b8c9d0e"
 *                 bowlerId: "665a1b2c3d4e5f6a7b8c9d0f"
 *                 runs: 4
 *             wideWithRun:
 *               summary: Wide ball with 1 extra run
 *               value:
 *                 batsmanId: "665a1b2c3d4e5f6a7b8c9d0e"
 *                 bowlerId: "665a1b2c3d4e5f6a7b8c9d0f"
 *                 runs: 0
 *                 extras:
 *                   type: "wide"
 *                   runs: 1
 *             wicketBowled:
 *               summary: Bowled dismissal
 *               value:
 *                 batsmanId: "665a1b2c3d4e5f6a7b8c9d0e"
 *                 bowlerId: "665a1b2c3d4e5f6a7b8c9d0f"
 *                 runs: 0
 *                 isWicket: true
 *                 wicket:
 *                   type: "bowled"
 *                   dismissedBatsman: "665a1b2c3d4e5f6a7b8c9d0e"
 *     responses:
 *       200:
 *         description: Ball recorded, match updated
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
 *         description: |
 *           Possible errors:
 *           - Match is not live
 *           - Invalid batsman/bowler ID
 *           - Wicket details missing when isWicket is true
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Match not found
 *
 * /matches/{matchId}/score/undo:
 *   post:
 *     tags: [Scoring]
 *     summary: Undo last ball
 *     description: |
 *       Reverses the last recorded ball using the stored `lastBallSnapshot`.
 *       Only one level of undo is supported — you cannot undo twice in a row.
 *
 *       **Emits:** `ball:undone` socket event.
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
 *         description: Last ball undone
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
 *         description: No ball to undo (lastBallSnapshot is null)
 *       401:
 *         description: Not authenticated
 *
 * /matches/{matchId}/scorecard:
 *   get:
 *     tags: [Scoring]
 *     summary: Get full scorecard
 *     description: Returns the complete match scorecard with all innings, batting cards, bowling cards, and over details.
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full match scorecard
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
 * /matches/{matchId}/live/stats:
 *   get:
 *     tags: [Scoring]
 *     summary: Get live match stats
 *     description: Returns real-time stats for the current innings — score, overs, run rates, projected score, and target info.
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Live stats
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
 *                     score:
 *                       type: string
 *                       example: "145/3"
 *                     overs:
 *                       type: number
 *                       example: 15.3
 *                     crr:
 *                       type: number
 *                       description: Current run rate
 *                       example: 9.35
 *                     rrr:
 *                       type: number
 *                       description: Required run rate (2nd innings only)
 *                       example: 10.5
 *                       nullable: true
 *                     projected:
 *                       type: integer
 *                       description: Projected total (1st innings)
 *                       example: 187
 *                       nullable: true
 *                     target:
 *                       type: integer
 *                       description: Target score (2nd innings only)
 *                       example: 180
 *                       nullable: true
 *                     runsRequired:
 *                       type: integer
 *                       description: Runs still needed (2nd innings)
 *                       example: 35
 *                       nullable: true
 *                     ballsRemaining:
 *                       type: integer
 *                       description: Balls remaining in innings
 *                       example: 27
 *                       nullable: true
 *       404:
 *         description: Match not found or not live
 *
 * /matches/{matchId}/worm-data:
 *   get:
 *     tags: [Scoring]
 *     summary: Get worm chart data
 *     description: Returns over-by-over cumulative data for generating worm/Manhattan charts.
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Worm data per innings
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
 *                       inningsNumber:
 *                         type: integer
 *                       overs:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             overNumber:
 *                               type: integer
 *                             runs:
 *                               type: integer
 *                               description: Cumulative runs after this over
 *                             wickets:
 *                               type: integer
 *                               description: Cumulative wickets after this over
 *       404:
 *         description: Match not found
 */

export {};
