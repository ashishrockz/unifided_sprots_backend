/**
 * @swagger
 * /ads/watch/{adId}/complete:
 *   post:
 *     tags: [Ads]
 *     summary: Track ad view completion
 *     description: |
 *       Records that the user finished watching an ad.
 *       Increments the ad's `impressionCount` and returns a reward token.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ad view tracked
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
 *                     rewardToken:
 *                       type: string
 *       404:
 *         description: Ad not found
 *
 * /ads/{adId}/click:
 *   post:
 *     tags: [Ads]
 *     summary: Track ad click
 *     description: Records that the user clicked on an ad. Increments the ad's `clickCount`.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Click tracked
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
 *
 * /admin/ads:
 *   post:
 *     tags: [Ads Admin]
 *     summary: Create advertisement
 *     description: Creates a new advertisement. Requires `super_admin` or `content_manager` role.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slot, mediaType, media, targetPlans]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Match Sponsor Ad"
 *               slot:
 *                 $ref: '#/components/schemas/AdSlot'
 *               mediaType:
 *                 $ref: '#/components/schemas/MediaType'
 *               media:
 *                 type: object
 *                 required: [primary]
 *                 properties:
 *                   primary:
 *                     type: string
 *                     description: Primary media URL
 *                   headsImage:
 *                     type: string
 *                     description: Image shown on toss heads (for toss_coin slot)
 *                   tailsImage:
 *                     type: string
 *                     description: Image shown on toss tails (for toss_coin slot)
 *                   sponsorLogo:
 *                     type: string
 *               clickUrl:
 *                 type: string
 *                 format: uri
 *               duration:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 120
 *                 description: Duration in seconds
 *               targetPlans:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/SubPlan'
 *                 minItems: 1
 *                 description: Which subscription plans see this ad
 *               sportSlugs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Restrict to specific sports (empty = all sports)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               priority:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 1000
 *                 default: 0
 *                 description: Higher priority ads are shown first
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Ad created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Advertisement'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 *   get:
 *     tags: [Ads Admin]
 *     summary: List advertisements
 *     description: Returns paginated list of all advertisements sorted by priority (descending).
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
 *         description: Paginated ads
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
 *                     $ref: '#/components/schemas/Advertisement'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *
 * /admin/ads/{id}:
 *   get:
 *     tags: [Ads Admin]
 *     summary: Get advertisement
 *     description: Returns a single advertisement by ID.
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
 *         description: Advertisement details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Advertisement'
 *       404:
 *         description: Ad not found
 *   put:
 *     tags: [Ads Admin]
 *     summary: Update advertisement
 *     description: Updates an existing advertisement. All fields are optional.
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
 *               title:
 *                 type: string
 *               slot:
 *                 $ref: '#/components/schemas/AdSlot'
 *               mediaType:
 *                 $ref: '#/components/schemas/MediaType'
 *               media:
 *                 type: object
 *                 properties:
 *                   primary:
 *                     type: string
 *                   headsImage:
 *                     type: string
 *                   tailsImage:
 *                     type: string
 *                   sponsorLogo:
 *                     type: string
 *               clickUrl:
 *                 type: string
 *               duration:
 *                 type: integer
 *               targetPlans:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/SubPlan'
 *               sportSlugs:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Ad updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Advertisement'
 *       404:
 *         description: Ad not found
 *   delete:
 *     tags: [Ads Admin]
 *     summary: Delete advertisement
 *     description: Permanently deletes an advertisement.
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
 *         description: Ad deleted (no content)
 *       404:
 *         description: Ad not found
 *
 * /admin/ads/{id}/toggle:
 *   patch:
 *     tags: [Ads Admin]
 *     summary: Toggle ad active status
 *     description: Toggles the `isActive` flag on an advertisement.
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
 *         description: Ad toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Advertisement'
 */

export {};
