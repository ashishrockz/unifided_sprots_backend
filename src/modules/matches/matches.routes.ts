import { Router } from "express";
import { Match } from "./match.model";
import { SportType } from "../sports/sportType.model";
import { authenticate, optionalAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  ok,
  created,
  paginated,
  buildPage,
  parseQuery,
} from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { ERRORS, MSG } from "../../constants";
import {
  createMatchSchema,
  addPlayersSchema,
  addGuestSchema,
  setCaptainSchema,
  setKeeperSchema,
  setRoleSchema,
  battingOrderSchema,
  abandonSchema,
} from "./matches.validation";
import { emitToMatch } from "../../socket";
import { SOCKET_EVENTS } from "../../constants";
import mongoose from "mongoose";

export const sportMatchRoutes = Router();
sportMatchRoutes.post(
  "/:slug/matches",
  authenticate,
  validate(createMatchSchema),
  asyncHandler(async (req: any, res) => {
    const uid = req.user!.userId,
      slug = req.params.slug;
    if (
      await Match.findOne({
        "teams.players.user": uid,
        status: { $in: ["live", "toss"] },
      })
    )
      throw new AppError(ERRORS.CONFLICT.PLAYER_IN_MATCH);
    const sport = await SportType.findOne({ slug, isActive: true });
    if (!sport) throw new AppError(ERRORS.RESOURCE.SPORT_NOT_FOUND);
    const matchData: any = {
      title: req.body.title,
      sportType: sport._id,
      sportSlug: slug,
      creator: uid,
      matchConfig: req.body.matchConfig,
      teams: [
        { name: req.body.team1Name || "Team 1", players: [{ user: uid, role: "batsman", isGuest: false }], battingOrder: [], bowlingOrder: [] },
        { name: req.body.team2Name || "Team 2", players: [], battingOrder: [], bowlingOrder: [] },
      ],
    };
    // Store location if provided (lat/lng from mobile)
    if (req.body.latitude && req.body.longitude) {
      matchData.location = {
        type: "Point",
        coordinates: [+req.body.longitude, +req.body.latitude],
      };
    }
    const m = await Match.create(matchData);
    created(res, m, MSG.CREATED("Match"));
  }),
);
sportMatchRoutes.get(
  "/:slug/matches",
  optionalAuth,
  asyncHandler(async (req: any, res) => {
    const { page, limit, skip } = parseQuery(req.query);
    const q: any = { sportSlug: req.params.slug };
    if (req.query.status) q.status = req.query.status;
    if (req.query.mine === "true" && req.user?.userId) {
      q.$or = [
        { creator: req.user.userId },
        { "teams.players.user": req.user.userId },
      ];
    }
    // Nearby matches: ?lat=X&lng=Y&radius=Z (km, default 50)
    if (req.query.lat && req.query.lng) {
      const radiusKm = +(req.query.radius || 50);
      q.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [+req.query.lng, +req.query.lat] },
          $maxDistance: radiusKm * 1000,
        },
      };
    }
    const [d, t] = await Promise.all([
      Match.find(q)
        .populate("creator", "username displayName avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Match.countDocuments(q),
    ]);
    paginated(res, d, buildPage(page, limit, t), MSG.LIST("Matches"));
  }),
);
sportMatchRoutes.get(
  "/:slug/matches/:matchId",
  asyncHandler(async (req, res) => {
    // First get the raw doc to preserve guest user ObjectIds
    const raw = await Match.findById(req.params.matchId).lean();
    if (!raw) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    // Then populate
    const m = await Match.findById(req.params.matchId)
      .populate("creator", "username displayName avatar")
      .populate("teams.players.user", "username displayName avatar")
      .lean();
    // Restore guest player user IDs (populate sets them to null)
    if (m) {
      for (let ti = 0; ti < m.teams.length; ti++) {
        for (let pi = 0; pi < m.teams[ti].players.length; pi++) {
          if (m.teams[ti].players[pi].user === null && raw.teams[ti]?.players[pi]?.user) {
            m.teams[ti].players[pi].user = raw.teams[ti].players[pi].user;
          }
        }
      }
    }
    ok(res, m, MSG.FETCHED("Match"));
  }),
);

export const matchRoutes = Router();
matchRoutes.use(authenticate);
matchRoutes.post(
  "/:matchId/players",
  asyncHandler(async (req: any, res) => {
    const m = await Match.findOne({
      _id: req.params.matchId,
      creator: req.user!.userId,
    });
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    if (!["draft", "team_setup"].includes(m.status))
      throw new AppError(ERRORS.BUSINESS.MATCH_NOT_READY);
    for (const pid of req.body.playerIds) {
      if (
        m.teams.some((t: any) =>
          t.players.some((p: any) => p.user?.toString() === pid),
        )
      )
        throw new AppError(ERRORS.CONFLICT.PLAYER_IN_TEAM);
      m.teams[req.body.teamIndex].players.push({
        user: pid,
        role: "batsman",
        isGuest: false,
      } as any);
    }
    m.status = "team_setup";
    await m.save();
    ok(res, m, MSG.PLAYERS_ADDED);
  }),
);
matchRoutes.post(
  "/:matchId/players/guest",
  asyncHandler(async (req: any, res) => {
    const m = await Match.findOne({
      _id: req.params.matchId,
      creator: req.user!.userId,
    });
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    const gId = new mongoose.Types.ObjectId();
    m.guestPlayers.push({
      _id: gId,
      name: req.body.name,
      addedBy: req.user!.userId,
    } as any);
    m.teams[req.body.teamIndex].players.push({
      user: gId,
      role: "batsman",
      isGuest: true,
      guestName: req.body.name,
    } as any);
    m.status = "team_setup";
    await m.save();
    ok(res, m, MSG.PLAYERS_ADDED);
  }),
);
/** DELETE /:matchId/players/:playerId — Remove a player from a team */
matchRoutes.delete(
  "/:matchId/players/:playerId",
  asyncHandler(async (req: any, res) => {
    const m = await Match.findOne({
      _id: req.params.matchId,
      creator: req.user!.userId,
    });
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    if (!["draft", "team_setup"].includes(m.status))
      throw new AppError(ERRORS.BUSINESS.MATCH_NOT_READY);
    const pid = req.params.playerId;
    let removed = false;
    for (const team of m.teams) {
      const idx = team.players.findIndex(
        (p: any) => p.user?.toString() === pid,
      );
      if (idx !== -1) {
        team.players.splice(idx, 1);
        // Clear captain/keeper if removed player held the role
        if (team.captain?.toString() === pid) team.captain = undefined;
        if (team.wicketkeeper?.toString() === pid) team.wicketkeeper = undefined;
        removed = true;
        break;
      }
    }
    // Also remove from guest list if applicable
    m.guestPlayers = m.guestPlayers.filter(
      (g: any) => g._id?.toString() !== pid,
    );
    if (!removed) throw new AppError(ERRORS.RESOURCE.USER_NOT_FOUND);
    await m.save();
    ok(res, m, MSG.UPDATED("Team"));
  }),
);

matchRoutes.put(
  "/:matchId/teams/:ti/captain",
  asyncHandler(async (req: any, res) => {
    const m = await Match.findOne({
      _id: req.params.matchId,
      creator: req.user!.userId,
    });
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    m.teams[+req.params.ti].captain = req.body.playerId;
    await m.save();
    ok(res, m, MSG.UPDATED("Captain"));
  }),
);
matchRoutes.put(
  "/:matchId/teams/:ti/wicketkeeper",
  asyncHandler(async (req: any, res) => {
    const m = await Match.findOne({
      _id: req.params.matchId,
      creator: req.user!.userId,
    });
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    m.teams[+req.params.ti].wicketkeeper = req.body.playerId;
    const p = m.teams[+req.params.ti].players.find(
      (p: any) => p.user?.toString() === req.body.playerId,
    );
    if (p) (p as any).role = "wicketkeeper";
    await m.save();
    ok(res, m, MSG.UPDATED("Wicketkeeper"));
  }),
);
matchRoutes.put(
  "/:matchId/players/:pid/role",
  asyncHandler(async (req: any, res) => {
    const m = await Match.findOne({
      _id: req.params.matchId,
      creator: req.user!.userId,
    });
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    for (const t of m.teams) {
      const p = t.players.find(
        (p: any) => p.user?.toString() === req.params.pid,
      );
      if (p) {
        (p as any).role = req.body.role;
        break;
      }
    }
    await m.save();
    ok(res, m, MSG.UPDATED("Role"));
  }),
);
matchRoutes.put(
  "/:matchId/teams/:ti/batting-order",
  asyncHandler(async (req: any, res) => {
    const m = await Match.findOne({
      _id: req.params.matchId,
      creator: req.user!.userId,
    });
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    m.teams[+req.params.ti].battingOrder = req.body.order;
    req.body.order.forEach((pid: string, i: number) => {
      const p = m.teams[+req.params.ti].players.find(
        (p: any) => p.user?.toString() === pid,
      );
      if (p) (p as any).battingPosition = i + 1;
    });
    await m.save();
    ok(res, m, MSG.UPDATED("Batting order"));
  }),
);
matchRoutes.post(
  "/:matchId/teams/validate",
  asyncHandler(async (req: any, res) => {
    const m = await Match.findById(req.params.matchId);
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    const e: string[] = [];
    m.teams.forEach((t: any, i: number) => {
      if (!t.captain) e.push("Team " + (i + 1) + ": no captain");
      if (!t.wicketkeeper) e.push("Team " + (i + 1) + ": no keeper");
      if (t.players.length < (m.matchConfig?.playersPerTeam || 2))
        e.push("Team " + (i + 1) + ": need more players");
    });
    ok(res, { valid: e.length === 0, errors: e }, MSG.TEAM_VALIDATED);
  }),
);
matchRoutes.post(
  "/:matchId/start",
  asyncHandler(async (req: any, res) => {
    const m = await Match.findOne({
      _id: req.params.matchId,
      creator: req.user!.userId,
      status: "toss",
    });
    if (!m) throw new AppError(ERRORS.BUSINESS.MATCH_NOT_READY);
    if (!m.toss?.decision) throw new AppError(ERRORS.BUSINESS.TOSS_NOT_DONE);
    const bi =
      m.toss.decision === "bat" ? m.toss.wonBy : m.toss.wonBy === 0 ? 1 : 0;
    const boi = bi === 0 ? 1 : 0;
    const bt = m.teams[bi];
    const cards = bt.players.map((p: any, i: number) => ({
      playerId: p.user,
      playerName: p.guestName || "",
      role: p.role,
      isCaptain: bt.captain?.toString() === p.user?.toString(),
      isKeeper: bt.wicketkeeper?.toString() === p.user?.toString(),
      battingPosition: p.battingPosition || i + 1,
      status: i < 2 ? "batting" : "yet_to_bat",
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      dotBalls: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      isOnStrike: i === 0,
      milestones: { reached30: false, reached50: false, reached100: false },
    }));
    m.innings = [
      {
        inningsNumber: 1,
        battingTeamIndex: bi,
        bowlingTeamIndex: boi,
        status: "in_progress",
        totalRuns: 0,
        totalWickets: 0,
        totalOvers: 0,
        totalBalls: 0,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
        currentRunRate: 0,
        batting: cards,
        bowling: [],
        overs: [],
        fallOfWickets: [],
        partnerships: [],
        currentBatsman: cards[0]?.playerId,
        currentNonStriker: cards[1]?.playerId,
      },
    ] as any;
    m.status = "live";
    m.startedAt = new Date();
    m.lastActivityAt = new Date();
    await m.save();
    emitToMatch(m._id.toString(), "match:started", { matchId: m._id, teams: m.teams, innings: m.innings[0] });
    ok(res, m, MSG.MATCH_STARTED);
  }),
);
matchRoutes.post(
  "/:matchId/abandon",
  asyncHandler(async (req: any, res) => {
    const m = await Match.findById(req.params.matchId);
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    if (["completed", "abandoned"].includes(m.status))
      throw new AppError(ERRORS.BUSINESS.MATCH_ALREADY_ENDED);
    m.status = "abandoned";
    m.abandonedBy = "creator";
    m.abandonReason = req.body.reason || "Manually abandoned";
    m.completedAt = new Date();
    await m.save();
    emitToMatch(m._id.toString(), SOCKET_EVENTS.MATCH_ABANDONED, { matchId: m._id, reason: m.abandonReason });
    ok(res, m, MSG.MATCH_ABANDONED);
  }),
);
