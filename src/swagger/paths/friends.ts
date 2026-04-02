/**
 * @swagger
 * /friends/request:
 *   post:
 *     tags: [Friends]
 *     summary: Send friend request
 *     description: |
 *       Sends a friend request to another user.
 *       Fails if:
 *       - You send a request to yourself
 *       - A pending request already exists between the two users
 *       - You are already friends
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId]
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: Target user's ID
 *                 example: "665a1b2c3d4e5f6a7b8c9d0e"
 *     responses:
 *       201:
 *         description: Friend request sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FriendRequest'
 *       400:
 *         description: Cannot self-request / duplicate request / already friends
 *       404:
 *         description: Receiver not found
 *
 * /friends/request/{id}/accept:
 *   put:
 *     tags: [Friends]
 *     summary: Accept friend request
 *     description: |
 *       Accepts a pending friend request. Both users are added to each other's friends array.
 *       Only the receiver of the request can accept it.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Friend request ID
 *     responses:
 *       200:
 *         description: Request accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FriendRequest'
 *       404:
 *         description: Request not found or not pending
 *
 * /friends/request/{id}/reject:
 *   put:
 *     tags: [Friends]
 *     summary: Reject friend request
 *     description: Rejects a pending friend request. Only the receiver can reject.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Friend request ID
 *     responses:
 *       200:
 *         description: Request rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FriendRequest'
 *       404:
 *         description: Request not found
 *
 * /friends/request/{id}:
 *   delete:
 *     tags: [Friends]
 *     summary: Cancel sent friend request
 *     description: Deletes a pending friend request that the authenticated user sent.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Friend request ID
 *     responses:
 *       200:
 *         description: Request cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       404:
 *         description: Request not found
 *
 * /friends/requests/pending:
 *   get:
 *     tags: [Friends]
 *     summary: List pending received requests
 *     description: Returns paginated list of friend requests received by the authenticated user that are still pending.
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
 *     responses:
 *       200:
 *         description: Paginated pending requests
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
 *                     $ref: '#/components/schemas/FriendRequest'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *
 * /friends/requests/sent:
 *   get:
 *     tags: [Friends]
 *     summary: List sent friend requests
 *     description: Returns paginated list of friend requests sent by the authenticated user.
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
 *     responses:
 *       200:
 *         description: Paginated sent requests
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
 *                     $ref: '#/components/schemas/FriendRequest'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *
 * /friends:
 *   get:
 *     tags: [Friends]
 *     summary: List friends
 *     description: Returns paginated list of the authenticated user's friends. Supports search by username or displayName.
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
 *         description: Search friends by username or display name
 *     responses:
 *       200:
 *         description: Paginated friend list
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
 *                     $ref: '#/components/schemas/UserSummary'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *
 * /friends/{userId}:
 *   delete:
 *     tags: [Friends]
 *     summary: Remove friend
 *     description: Removes a friend relationship bidirectionally. Also deletes the accepted friend request record.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Friend's user ID to remove
 *     responses:
 *       200:
 *         description: Friend removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found or not friends
 */

export {};
