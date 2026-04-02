/**
 * @swagger
 * /superadmin/dashboard:
 *   get:
 *     tags: [SuperAdmin]
 *     summary: Super admin dashboard
 *     description: |
 *       Extended dashboard for super admins. Includes all standard dashboard counts
 *       plus admin breakdown by role and config count.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Super admin dashboard data
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
 *                         totalAdmins:
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
 *                         configCount:
 *                           type: integer
 *                     recentUsers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserSummary'
 *                     recentMatches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MatchSummary'
 *                     adminsByRole:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Admin role name
 *                           count:
 *                             type: integer
 *       403:
 *         description: Not a super_admin
 *
 * /admin/plans:
 *   get:
 *     tags: [Plans]
 *     summary: List subscription plans
 *     description: Returns all subscription plans sorted by `sortOrder`.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Plans list
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
 *                     $ref: '#/components/schemas/Plan'
 *
 * /admin/plans/{id}:
 *   put:
 *     tags: [Plans]
 *     summary: Update plan
 *     description: Updates an existing subscription plan's fields.
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
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               interval:
 *                 $ref: '#/components/schemas/PlanInterval'
 *               isDefault:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *               limits:
 *                 type: object
 *                 properties:
 *                   matchesPerDay:
 *                     type: integer
 *                   matchesPerWeek:
 *                     type: integer
 *                   matchHistoryCount:
 *                     type: integer
 *               features:
 *                 type: object
 *                 properties:
 *                   adFree:
 *                     type: boolean
 *                   commentary:
 *                     type: boolean
 *                   analytics:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Plan updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Plan'
 *       404:
 *         description: Plan not found
 *
 * /superadmin/plans:
 *   post:
 *     tags: [Plans]
 *     summary: Create plan (super_admin)
 *     description: Creates a new subscription plan. Only `super_admin`.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Pro Plan"
 *               slug:
 *                 type: string
 *                 example: "pro"
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 default: 0
 *               currency:
 *                 type: string
 *                 default: "INR"
 *               interval:
 *                 $ref: '#/components/schemas/PlanInterval'
 *               isDefault:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *               limits:
 *                 type: object
 *                 properties:
 *                   matchesPerDay:
 *                     type: integer
 *                   matchesPerWeek:
 *                     type: integer
 *                   matchHistoryCount:
 *                     type: integer
 *               features:
 *                 type: object
 *                 properties:
 *                   adFree:
 *                     type: boolean
 *                   commentary:
 *                     type: boolean
 *                   analytics:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Plan created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Plan'
 *       400:
 *         description: Duplicate slug
 *
 * /superadmin/plans/{id}:
 *   delete:
 *     tags: [Plans]
 *     summary: Delete plan (soft)
 *     description: Soft-deletes a plan by setting `isActive` to false.
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
 *         description: Plan deactivated (no content)
 *
 * /admin/match-packs:
 *   get:
 *     tags: [Plans]
 *     summary: List match packs
 *     description: Returns all match packs sorted by `sortOrder`.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Match packs list
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
 *                     $ref: '#/components/schemas/MatchPack'
 *
 * /admin/match-packs/{id}:
 *   put:
 *     tags: [Plans]
 *     summary: Update match pack
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
 *               matchCount:
 *                 type: integer
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Match pack updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MatchPack'
 *
 * /superadmin/match-packs:
 *   post:
 *     tags: [Plans]
 *     summary: Create match pack (super_admin)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, matchCount, price]
 *             properties:
 *               name:
 *                 type: string
 *               matchCount:
 *                 type: integer
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: "INR"
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Match pack created
 *
 * /superadmin/match-packs/{id}:
 *   delete:
 *     tags: [Plans]
 *     summary: Delete match pack (soft)
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
 *         description: Match pack deactivated
 *
 * /admin/subscriptions:
 *   get:
 *     tags: [Subscriptions]
 *     summary: List subscriptions
 *     description: Returns paginated list of all subscriptions with populated user and plan.
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
 *         name: planId
 *         schema:
 *           type: string
 *         description: Filter by plan ID
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/SubscriptionStatus'
 *         description: Filter by subscription status
 *     responses:
 *       200:
 *         description: Paginated subscriptions
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
 *                     $ref: '#/components/schemas/Subscription'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *
 * /admin/orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders
 *     description: Returns paginated list of all orders with populated user, plan, and match pack.
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
 *           $ref: '#/components/schemas/OrderType'
 *         description: Filter by order type
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/OrderStatus'
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: Paginated orders
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
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *
 * /admin/revenue/stats:
 *   get:
 *     tags: [Revenue]
 *     summary: Revenue statistics
 *     description: Returns total revenue, order count, monthly breakdown, and active plan distribution. Super admin only.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue stats
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
 *                           total:
 *                             type: number
 *                           count:
 *                             type: integer
 *                     activePlanBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 */

export {};
