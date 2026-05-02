/**
 * @file    modules/scoring/scoring.routes.ts
 * @desc    Ball-by-ball scoring, scorecard, live stats, worm data.
 *          Emits socket events to all match viewers on every update.
 */
import { Router } from "express";
import { Match } from "../matches/match.model";
import { CricketPlayerStats } from "../leaderboard/cricketStats.model";
import { User } from "../users/user.model";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { ERRORS, MSG, SOCKET_EVENTS } from "../../constants";
import { recordBallSchema, inningsSetupSchema } from "../matches/matches.validation";
import { emitToMatch } from "../../socket";
import { NotificationService } from "../notifications/notification.service";
import { withMatchLock, withIdempotency } from "../../utils/matchLock";

/** Returns true if the user is the creator OR a non-guest player in the match. */
function isCreatorOrPlayer(match: any, userId: string): boolean {
  if (match.creator?.toString() === userId) return true;
  return match.teams.some((t: any) =>
    t.players.some((p: any) => !p.isGuest && p.user?.toString() === userId),
  );
}

/** Collect unique non-guest player user IDs (plus creator) for notifications. */
export function collectMatchUserIds(match: any): string[] {
  const ids = new Set<string>();
  if (match.creator) ids.add(match.creator.toString());
  for (const t of match.teams) {
    for (const p of t.players) {
      if (!p.isGuest && p.user) ids.add(p.user.toString());
    }
  }
  return Array.from(ids);
}

/** Auto-generate ball-by-ball commentary text. */
function generateCommentary(batRuns: number, payload: any, isWicket: boolean): string {
  if (isWicket) {
    const wt = payload.wicket?.type || "out";
    const labels: Record<string, string> = {
      bowled: "Timber! The stumps are shattered!",
      caught: "Taken! A good catch in the field!",
      caught_behind: "Caught behind by the keeper!",
      caught_and_bowled: "Caught and bowled! Return catch!",
      lbw: "Trapped in front! Given LBW!",
      run_out: "Run out! Direct hit!",
      stumped: "Stumped! Quick work by the keeper!",
      hit_wicket: "Hit wicket! Unfortunate dismissal!",
    };
    return labels[wt] || "OUT!";
  }
  if (payload.extras) {
    const et = payload.extras.type;
    const er = payload.extras.runs ?? 1;
    if (et === "wide") return `Wide ball, ${er} run${er > 1 ? "s" : ""} added`;
    if (et === "no_ball") return `No ball! ${er} extra run${er > 1 ? "s" : ""}`;
    if (et === "bye") return `Bye, ${er} run${er > 1 ? "s" : ""} to the total`;
    if (et === "leg_bye") return `Leg bye, ${er} run${er > 1 ? "s" : ""} to the total`;
  }
  if (batRuns === 0) return "Dot ball, well bowled!";
  if (batRuns === 1) return "Single taken, rotates the strike";
  if (batRuns === 2) return "Good running, two runs";
  if (batRuns === 3) return "Three runs, great running!";
  if (batRuns === 4) return "FOUR! Racing away to the boundary!";
  if (batRuns === 5) return "Five runs! All run!";
  if (batRuns === 6) return "SIX! Massive hit over the boundary!";
  return `${batRuns} runs`;
}

export const scoringRoutes = Router();

/* ═══════════════════════════════════════════════════════════
   POST /:matchId/innings/setup — Select opening pair + bowler
   ═══════════════════════════════════════════════════════════ */
scoringRoutes.post(
  "/:matchId/innings/setup",
  authenticate,
  validate(inningsSetupSchema),
  asyncHandler(async (req: any, res) => {
    await withMatchLock(req.params.matchId, async () => {
    const m = await Match.findById(req.params.matchId);
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    if (m.status !== "live") throw new AppError({ message: "Match is not live", status: 400, code: "MATCH_NOT_LIVE" });
    if (!isCreatorOrPlayer(m, req.user!.userId)) throw new AppError(ERRORS.AUTH.FORBIDDEN);

    const inn = m.innings[m.innings.length - 1];
    if (!inn) throw new AppError({ message: "No active innings", status: 400, code: "NO_INNINGS" });
    if (inn.totalBalls > 0) throw new AppError({ message: "Cannot change openers after first ball", status: 400, code: "INNINGS_STARTED" });

    const { openerId1, openerId2, bowlerId } = req.body;

    if (openerId1 === openerId2) throw new AppError({ message: "Opener 1 and 2 must be different players", status: 400, code: "SAME_OPENER" });

    // Reset all batsmen to yet_to_bat
    for (const b of inn.batting) {
      b.status = "yet_to_bat";
    }

    // Set openers
    const opener1 = inn.batting.find((b: any) => b.playerId?.toString() === openerId1);
    const opener2 = inn.batting.find((b: any) => b.playerId?.toString() === openerId2);

    if (!opener1) throw new AppError({ message: "Opener 1 not found in batting lineup", status: 400, code: "PLAYER_NOT_FOUND" });
    if (!opener2) throw new AppError({ message: "Opener 2 not found in batting lineup", status: 400, code: "PLAYER_NOT_FOUND" });

    opener1.status = "batting";
    opener2.status = "batting";
    inn.currentBatsman = openerId1;
    inn.currentNonStriker = openerId2;

    // Set bowler if provided
    if (bowlerId) {
      (inn as any).currentBowler = bowlerId;
    }

    m.lastActivityAt = new Date();
    await m.save();

    ok(res, m, "Innings setup complete");
    });
  }),
);

/* ═══════════════════════════════════════════════════════════
   POST /:matchId/score — Record a ball
   ═══════════════════════════════════════════════════════════ */
scoringRoutes.post(
  "/:matchId/score",
  authenticate,
  validate(recordBallSchema),
  asyncHandler(async (req: any, res) => {
    const idempotencyKey =
      (req.headers["idempotency-key"] as string | undefined) ??
      (req.body?.idempotencyKey as string | undefined);

    const payload = await withIdempotency(
      `score:${req.params.matchId}`,
      idempotencyKey,
      () =>
        withMatchLock(req.params.matchId, async () => {
    const m = await Match.findById(req.params.matchId);
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    if (m.status !== "live") throw new AppError(ERRORS.BUSINESS.MATCH_NOT_LIVE);
    if (!isCreatorOrPlayer(m, req.user!.userId)) throw new AppError(ERRORS.AUTH.FORBIDDEN);

    const inn = m.innings.find((i: any) => i.status === "in_progress");
    if (!inn) throw new AppError(ERRORS.RESOURCE.INNINGS_NOT_FOUND);

    // Capture current batsmen IDs for partnership tracking (before any mutations)
    const preStrikerId = inn.currentBatsman?.toString();
    const preNonStrikerId = inn.currentNonStriker?.toString();

    const p = req.body;
    const isExtra = !!p.extras;
    const isLegal = !isExtra || !["wide", "no_ball"].includes(p.extras?.type);
    const batR = p.runs ?? 0;
    const extR = p.extras?.runs ?? 0;
    const totR = batR + extR;

    /* ── Extras ─────────────────────────────────────────── */
    if (p.extras) {
      const et =
        p.extras.type === "no_ball"   ? "noBalls"  :
        p.extras.type === "wide"      ? "wides"    :
        p.extras.type === "bye"       ? "byes"     :
        p.extras.type === "leg_bye"   ? "legByes"  : null;
      if (et && inn.extras[et] !== undefined) inn.extras[et] += extR;
      inn.extras.total += extR;
    }

    /* ── Batsman card ───────────────────────────────────── */
    const bc = inn.batting.find((b: any) => b.playerId?.toString() === p.batsmanId);
    if (bc && isLegal) {
      bc.runs += batR;
      bc.ballsFaced += 1;
      if (batR === 0) bc.dotBalls += 1;
      if (batR === 1) bc.singles += 1;
      if (batR === 2) bc.doubles += 1;
      if (batR === 3) bc.triples += 1;
      if (batR === 4) bc.fours += 1;
      if (batR === 6) bc.sixes += 1;
      bc.strikeRate = bc.ballsFaced > 0 ? +((bc.runs / bc.ballsFaced) * 100).toFixed(2) : 0;
      if (bc.runs >= 30) bc.milestones.reached30 = true;
      if (bc.runs >= 50) bc.milestones.reached50 = true;
      if (bc.runs >= 100) bc.milestones.reached100 = true;
    }

    /* ── Bowler card ────────────────────────────────────── */
    let bw = inn.bowling.find((b: any) => b.playerId?.toString() === p.bowlerId);
    if (!bw) {
      inn.bowling.push({
        playerId: p.bowlerId, playerName: "", role: "bowler",
        isCaptain: false, overs: 0, ballsBowled: 0, maidens: 0,
        runsConceded: 0, wickets: 0, economy: 0, dotBalls: 0,
        wides: 0, noBalls: 0, foursConceded: 0, sixesConceded: 0,
        isCurrentBowler: true,
      });
      bw = inn.bowling[inn.bowling.length - 1];
    }
    if (isLegal) bw.ballsBowled += 1;
    bw.runsConceded += totR;
    if (totR === 0 && isLegal) bw.dotBalls += 1;
    if (p.extras?.type === "wide") bw.wides += 1;
    if (p.extras?.type === "no_ball") bw.noBalls += 1;
    if (batR === 4) bw.foursConceded += 1;
    if (batR === 6) bw.sixesConceded += 1;
    bw.overs = +(Math.floor(bw.ballsBowled / 6) + (bw.ballsBowled % 6) / 10).toFixed(1);
    bw.economy = bw.ballsBowled > 0 ? +(bw.runsConceded / (bw.ballsBowled / 6)).toFixed(2) : 0;

    /* ── Wicket ─────────────────────────────────────────── */
    let wicketFell = false;
    if (p.isWicket && p.wicket) {
      wicketFell = true;
      if (!["run_out", "obstructing"].includes(p.wicket.type)) bw.wickets += 1;
      inn.totalWickets += 1;
      const d = inn.batting.find((b: any) => b.playerId?.toString() === p.wicket.dismissedBatsman);
      if (d) {
        d.status = "out";
        d.dismissal = {
          type: p.wicket.type, bowler: p.bowlerId,
          fielder: p.wicket.fielder, description: p.wicket.type,
        };
      }
      inn.fallOfWickets.push({
        wicketNumber: inn.totalWickets, runs: inn.totalRuns + totR,
        overs: inn.totalOvers, batsman: p.wicket.dismissedBatsman,
        batsmanName: d?.playerName, batsmanRuns: d?.runs,
        bowler: p.bowlerId, dismissalType: p.wicket.type,
      });
      // Promote next batsman — user-selected or first yet_to_bat
      let nx: any = null;
      if (p.nextBatsmanId) {
        nx = inn.batting.find((b: any) => b.playerId?.toString() === p.nextBatsmanId && b.status === "yet_to_bat");
      }
      if (!nx) {
        nx = inn.batting.find((b: any) => b.status === "yet_to_bat");
      }
      if (nx) {
        nx.status = "batting";
        // Update currentBatsman or currentNonStriker based on who was dismissed
        const dismissedId = p.wicket.dismissedBatsman;
        if (inn.currentBatsman?.toString() === dismissedId) {
          inn.currentBatsman = nx.playerId;
        } else if (inn.currentNonStriker?.toString() === dismissedId) {
          inn.currentNonStriker = nx.playerId;
        }
      }

      /* Emit wicket event */
      emitToMatch(m._id.toString(), SOCKET_EVENTS.WICKET, {
        matchId: m._id, wicket: p.wicket,
        score: `${inn.totalRuns + totR}/${inn.totalWickets}`,
      });
    }

    /* ── Totals ─────────────────────────────────────────── */
    inn.totalRuns += totR;
    if (isLegal) {
      inn.totalBalls += 1;
      inn.totalOvers = +(Math.floor(inn.totalBalls / 6) + (inn.totalBalls % 6) / 10).toFixed(1);
    }
    const ov = inn.totalBalls / 6;
    inn.currentRunRate = ov > 0 ? +(inn.totalRuns / ov).toFixed(2) : 0;
    const mx = m.matchConfig?.totalOvers ?? 20;
    if (inn.target) {
      const rem = (mx * 6 - inn.totalBalls) / 6;
      inn.requiredRunRate = rem > 0 ? +((inn.target - inn.totalRuns) / rem).toFixed(2) : 0;
    } else {
      inn.projectedScore = Math.round(inn.currentRunRate * mx);
    }

    /* ── Over completed: end-of-over swap ───────────────── */
    let overCompleted = false;
    if (isLegal && inn.totalBalls % 6 === 0) {
      overCompleted = true;
      const t = inn.currentBatsman;
      inn.currentBatsman = inn.currentNonStriker;
      inn.currentNonStriker = t;
    }

    /* ── Over/ball tracking & auto-commentary ─────────── */
    {
      const overIdx = isLegal
        ? Math.floor((inn.totalBalls - 1) / 6)
        : Math.floor(inn.totalBalls / 6);
      const overNum = overIdx + 1;

      let currentOver = inn.overs?.find((o: any) => o.overNumber === overNum);
      if (!currentOver) {
        const bowlerTeam = m.teams[inn.bowlingTeamIndex];
        const bowlerPlayer = bowlerTeam?.players?.find(
          (pl: any) => pl.user?.toString() === p.bowlerId,
        );
        const bName = bowlerPlayer?.isGuest ? (bowlerPlayer.guestName || "") : "";
        inn.overs.push({
          overNumber: overNum, bowlerId: p.bowlerId, bowlerName: bName,
          runs: 0, wickets: 0, extras: 0, isMaiden: false, balls: [],
          runRateAfterOver: 0, cumulativeRuns: 0, cumulativeWickets: 0,
        });
        currentOver = inn.overs[inn.overs.length - 1];
      }

      const commentary = generateCommentary(batR, p, wicketFell);
      currentOver.balls.push({
        ballNumber: isLegal ? ((inn.totalBalls - 1) % 6) + 1 : null,
        deliveryNumber: currentOver.balls.length + 1,
        batsmanId: p.batsmanId, bowlerId: p.bowlerId,
        runs: batR,
        extras: p.extras ? { type: p.extras.type, runs: extR } : undefined,
        totalRuns: totR, isLegal, isWicket: wicketFell,
        isBoundary: batR === 4 || batR === 6,
        isDotBall: totR === 0 && isLegal,
        wicket: wicketFell ? p.wicket : undefined,
        commentary, timestamp: new Date(),
      });
      currentOver.runs += totR;
      if (wicketFell) currentOver.wickets += 1;
      if (p.extras) currentOver.extras += extR;

      if (overCompleted) {
        currentOver.isMaiden = currentOver.runs === 0;
        currentOver.runRateAfterOver = inn.currentRunRate;
        currentOver.cumulativeRuns = inn.totalRuns;
        currentOver.cumulativeWickets = inn.totalWickets;
        if (currentOver.isMaiden && bw) bw.maidens += 1;
      }
    }

    /* ── Partnership tracking ──────────────────────────── */
    {
      let activePship = inn.partnerships?.find((ps: any) => ps.isActive);

      if (!activePship && preStrikerId && preNonStrikerId) {
        inn.partnerships.push({
          partnershipNumber: (inn.partnerships?.length || 0) + 1,
          batsman1: { playerId: preStrikerId, runs: 0, balls: 0 },
          batsman2: { playerId: preNonStrikerId, runs: 0, balls: 0 },
          totalRuns: 0, totalBalls: 0, isActive: true,
        });
        activePship = inn.partnerships[inn.partnerships.length - 1];
      }

      if (activePship) {
        activePship.totalRuns += totR;
        if (isLegal) activePship.totalBalls += 1;

        const b1Id = activePship.batsman1?.playerId?.toString();
        if (b1Id === p.batsmanId) {
          activePship.batsman1.runs += batR;
          if (isLegal) activePship.batsman1.balls += 1;
        } else {
          activePship.batsman2.runs += batR;
          if (isLegal) activePship.batsman2.balls += 1;
        }

        if (wicketFell) {
          activePship.isActive = false;
        }
      }
    }

    /* ── Innings end check ──────────────────────────────── */
    const maxW = m.teams[inn.battingTeamIndex]?.players?.length
      ? m.teams[inn.battingTeamIndex].players.length - 1
      : 10;
    const chaseWon = inn.target && inn.totalRuns >= inn.target;
    const allOut = inn.totalWickets >= maxW;
    const oversUp = inn.totalBalls >= mx * 6;

    let inningsEnded = false;
    let matchEnded = false;

    if (chaseWon || allOut || oversUp) {
      inningsEnded = true;
      inn.status = "completed";
      inn.completedAt = new Date();
      inn.completionReason = chaseWon ? "target_chased" : allOut ? "all_out" : "overs_completed";
      inn.batting
        .filter((b: any) => b.status === "batting")
        .forEach((b: any) => { b.status = "not_out"; });

      /* ── Check if match ends or start second innings ── */
      if (inn.inningsNumber >= 2 || chaseWon) {
        matchEnded = true;
        m.status = "completed";
        m.completedAt = new Date();

        /* Determine winner */
        const inn1 = m.innings[0];
        const inn2 = inn.inningsNumber === 2 ? inn : null;
        if (inn2) {
          if (inn2.totalRuns > inn1.totalRuns) {
            m.winner = inn2.battingTeamIndex;
            const wicketsLeft = maxW - inn2.totalWickets;
            m.result = {
              type: "wickets",
              margin: wicketsLeft,
              description: `${m.teams[inn2.battingTeamIndex].name} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? "s" : ""}`,
            };
          } else if (inn1.totalRuns > inn2.totalRuns) {
            m.winner = inn1.battingTeamIndex;
            const runMargin = inn1.totalRuns - inn2.totalRuns;
            m.result = {
              type: "runs",
              margin: runMargin,
              description: `${m.teams[inn1.battingTeamIndex].name} won by ${runMargin} run${runMargin !== 1 ? "s" : ""}`,
            };
          } else {
            m.result = { type: "tie", margin: 0, description: "Match tied" };
          }
        }
      } else {
        /* ── Start second innings ───────────────────────── */
        const bi2 = inn.bowlingTeamIndex;
        const boi2 = inn.battingTeamIndex;
        const bt2 = m.teams[bi2];
        const cards2 = bt2.players.map((pl: any, i: number) => ({
          playerId: pl.user, playerName: pl.guestName || "",
          role: pl.role,
          isCaptain: bt2.captain?.toString() === pl.user?.toString(),
          isKeeper: bt2.wicketkeeper?.toString() === pl.user?.toString(),
          battingPosition: pl.battingPosition || i + 1,
          status: i < 2 ? "batting" : "yet_to_bat",
          runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
          strikeRate: 0, dotBalls: 0, singles: 0, doubles: 0, triples: 0,
          isOnStrike: i === 0,
          milestones: { reached30: false, reached50: false, reached100: false },
        }));
        m.innings.push({
          inningsNumber: 2, battingTeamIndex: bi2, bowlingTeamIndex: boi2,
          status: "in_progress",
          totalRuns: 0, totalWickets: 0, totalOvers: 0, totalBalls: 0,
          target: inn.totalRuns + 1,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
          currentRunRate: 0, requiredRunRate: 0,
          batting: cards2, bowling: [], overs: [],
          fallOfWickets: [], partnerships: [],
          currentBatsman: cards2[0]?.playerId,
          currentNonStriker: cards2[1]?.playerId,
        } as any);
      }
    }

    /* ── Save snapshot for undo (before swap) ─────────────── */
    const preSwapStriker = inn.currentBatsman;
    const preSwapNonStriker = inn.currentNonStriker;
    const nextBat = wicketFell
      ? (p.nextBatsmanId || inn.batting.find((b: any) => b.status === "batting" && b.playerId?.toString() !== p.batsmanId)?.playerId?.toString())
      : undefined;

    /* ── Odd runs swap (within same over) ───────────────── */
    if (isLegal && batR % 2 !== 0 && inn.totalBalls % 6 !== 0) {
      const t = inn.currentBatsman;
      inn.currentBatsman = inn.currentNonStriker;
      inn.currentNonStriker = t;
    }

    /* ── Store undo snapshot ───────────────────────────────── */
    (m as any).lastBallSnapshot = {
      batsmanId: p.batsmanId,
      bowlerId: p.bowlerId,
      batRuns: batR,
      totalRuns: totR,
      extras: p.extras || null,
      isLegal,
      isWicket: wicketFell,
      wicket: p.wicket || null,
      nextBatsmanId: (typeof nextBat === 'string' ? nextBat : nextBat?.playerId?.toString()) || null,
      prevStriker: preSwapStriker,
      prevNonStriker: preSwapNonStriker,
    };

    m.lastActivityAt = new Date();
    await m.save();

    /* ══════════════════════════════════════════════════════
       SOCKET EMISSIONS — broadcast to all match viewers
       ══════════════════════════════════════════════════════ */
    const matchId = m._id.toString();

    /* Always emit score update on every ball */
    emitToMatch(matchId, SOCKET_EVENTS.SCORE_UPDATED, {
      matchId: m._id,
      innings: inn.inningsNumber,
      score: `${inn.totalRuns}/${inn.totalWickets}`,
      overs: inn.totalOvers,
      crr: inn.currentRunRate,
      rrr: inn.requiredRunRate ?? null,
      target: inn.target ?? null,
      lastBall: { runs: batR, extras: p.extras, isWicket: wicketFell, batsmanId: p.batsmanId, bowlerId: p.bowlerId },
    });

    if (overCompleted) {
      emitToMatch(matchId, SOCKET_EVENTS.OVER_COMPLETED, {
        matchId: m._id, overNumber: Math.floor(inn.totalBalls / 6),
        score: `${inn.totalRuns}/${inn.totalWickets}`,
      });
    }

    if (inningsEnded && !matchEnded) {
      emitToMatch(matchId, SOCKET_EVENTS.INNINGS_COMPLETED, {
        matchId: m._id, inningsNumber: inn.inningsNumber,
        totalRuns: inn.totalRuns, totalWickets: inn.totalWickets,
        target: inn.totalRuns + 1,
      });
    }

    if (matchEnded) {
      emitToMatch(matchId, SOCKET_EVENTS.MATCH_COMPLETED, {
        matchId: m._id, winner: m.winner, result: m.result,
      });

      /* ── Notify all participating players ────────────── */
      const userIds = collectMatchUserIds(m);
      if (userIds.length > 0) {
        NotificationService.sendToMany(userIds, {
          type: "match_completed",
          title: "Match completed",
          body: `${m.title} — ${m.result?.description ?? "Match has ended"}`,
          data: { matchId: m._id.toString() },
        }).catch((err) => {
          // eslint-disable-next-line no-console
          console.error("[scoring] notification send failed:", err);
        });
      }

      /* ── Update player stats asynchronously ──────────── */
      updatePlayerStats(m).catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[scoring] updatePlayerStats failed:", err);
      });
    }

          return m.toObject();
        }),
    );

    ok(res, payload, MSG.BALL_RECORDED);
  }),
);

/* ═══════════════════════════════════════════════════════════
   Helper: Update CricketPlayerStats after match completion
   ═══════════════════════════════════════════════════════════ */
async function updatePlayerStats(match: any) {
  const slug = match.sportSlug;
  if (slug !== "cricket") return; // only cricket stats for now

  for (let ti = 0; ti < match.teams.length; ti++) {
    const team = match.teams[ti];
    const isWinner = match.winner === ti;
    const battingInnings = match.innings.find((i: any) => i.battingTeamIndex === ti);
    const bowlingInnings = match.innings.find((i: any) => i.bowlingTeamIndex === ti);

    for (const player of team.players) {
      if (player.isGuest) continue;
      const userId = player.user;

      const stats = await CricketPlayerStats.findOneAndUpdate(
        { user: userId, sportSlug: slug },
        { $setOnInsert: { user: userId, sportSlug: slug } },
        { upsert: true, new: true },
      );

      stats.matchesPlayed += 1;
      if (isWinner) stats.matchesWon += 1;
      else if (match.winner !== undefined && match.winner !== null) stats.matchesLost += 1;

      /* Batting stats */
      if (battingInnings) {
        const bc = battingInnings.batting.find(
          (b: any) => b.playerId?.toString() === userId?.toString(),
        );
        if (bc && bc.status !== "yet_to_bat") {
          stats.batting.innings += 1;
          stats.batting.totalRuns += bc.runs;
          stats.batting.ballsFaced += bc.ballsFaced;
          stats.batting.fours += bc.fours;
          stats.batting.sixes += bc.sixes;
          if (bc.status === "not_out") stats.batting.notOuts += 1;
          if (bc.runs === 0 && bc.status === "out") stats.batting.ducks += 1;
          if (bc.runs >= 30 && bc.runs < 50) stats.batting.thirties += 1;
          if (bc.runs >= 50 && bc.runs < 100) stats.batting.fifties += 1;
          if (bc.runs >= 100) stats.batting.hundreds += 1;
          if (bc.runs > stats.batting.highestScore) stats.batting.highestScore = bc.runs;
          /* Recalc averages */
          const dismissals = stats.batting.innings - stats.batting.notOuts;
          stats.batting.average = dismissals > 0 ? +(stats.batting.totalRuns / dismissals).toFixed(2) : stats.batting.totalRuns;
          stats.batting.strikeRate = stats.batting.ballsFaced > 0
            ? +((stats.batting.totalRuns / stats.batting.ballsFaced) * 100).toFixed(2) : 0;
        }
      }

      /* Bowling stats */
      if (bowlingInnings) {
        const bw = bowlingInnings.bowling.find(
          (b: any) => b.playerId?.toString() === userId?.toString(),
        );
        if (bw && bw.ballsBowled > 0) {
          stats.bowling.innings += 1;
          stats.bowling.ballsBowled += bw.ballsBowled;
          stats.bowling.oversBowled += bw.overs;
          stats.bowling.runsConceded += bw.runsConceded;
          stats.bowling.wickets += bw.wickets;
          stats.bowling.maidens += bw.maidens;
          stats.bowling.dotBalls += bw.dotBalls;
          stats.bowling.wides += bw.wides;
          stats.bowling.noBalls += bw.noBalls;
          if (bw.wickets > stats.bowling.bestBowlingWickets ||
            (bw.wickets === stats.bowling.bestBowlingWickets && bw.runsConceded < stats.bowling.bestBowlingRuns)) {
            stats.bowling.bestBowlingWickets = bw.wickets;
            stats.bowling.bestBowlingRuns = bw.runsConceded;
          }
          if (bw.wickets >= 3) stats.bowling.threeWicketHauls += 1;
          if (bw.wickets >= 5) stats.bowling.fiveWicketHauls += 1;
          /* Recalc averages */
          stats.bowling.average = stats.bowling.wickets > 0
            ? +(stats.bowling.runsConceded / stats.bowling.wickets).toFixed(2) : 0;
          const totalOvers = stats.bowling.ballsBowled / 6;
          stats.bowling.economyRate = totalOvers > 0
            ? +(stats.bowling.runsConceded / totalOvers).toFixed(2) : 0;
          stats.bowling.strikeRate = stats.bowling.wickets > 0
            ? +(stats.bowling.ballsBowled / stats.bowling.wickets).toFixed(2) : 0;
        }
      }

      /* Fielding — count catches from dismissals in bowling innings */
      if (bowlingInnings) {
        for (const fow of bowlingInnings.fallOfWickets) {
          if (["caught", "caught_behind", "caught_and_bowled"].includes(fow.dismissalType)) {
            /* fielder credited if the catch was theirs — simplified */
            // We don't have fielder ID in fallOfWickets, so skip for now
          }
        }
      }

      /* Ranking points: simple formula */
      stats.rankingPoints = Math.round(
        stats.batting.totalRuns * 1 +
        stats.bowling.wickets * 20 +
        stats.matchesWon * 10 +
        stats.batting.fifties * 25 +
        stats.batting.hundreds * 50 +
        stats.bowling.fiveWicketHauls * 40,
      );

      /* Update user aggregate stats */
      await User.findByIdAndUpdate(userId, {
        totalMatchesAllSports: stats.matchesPlayed,
        totalWinsAllSports: stats.matchesWon,
      });

      await stats.save();
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   POST /:matchId/score/undo — Undo the last ball
   ═══════════════════════════════════════════════════════════ */
scoringRoutes.post(
  "/:matchId/score/undo",
  authenticate,
  asyncHandler(async (req: any, res) => {
    await withMatchLock(req.params.matchId, async () => {
    const m = await Match.findById(req.params.matchId);
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    if (m.status !== "live") throw new AppError(ERRORS.BUSINESS.MATCH_NOT_LIVE);
    if (!isCreatorOrPlayer(m, req.user!.userId)) throw new AppError(ERRORS.AUTH.FORBIDDEN);

    const inn = m.innings.find((i: any) => i.status === "in_progress");
    if (!inn) throw new AppError(ERRORS.RESOURCE.INNINGS_NOT_FOUND);
    if (inn.totalBalls === 0 && inn.extras.total === 0) {
      throw new AppError(ERRORS.BUSINESS.NO_BALLS_TO_UNDO);
    }

    /* ── Find the last ball: last over, last entry ────────── */
    // We reconstruct the last ball from batting/bowling card deltas.
    // Since we don't store individual ball history, we reverse the
    // last card-level update. We track via a `lastBall` snapshot.
    if (!(m as any).lastBallSnapshot) {
      throw new AppError(ERRORS.BUSINESS.NO_UNDO_SNAPSHOT);
    }

    const snap = (m as any).lastBallSnapshot;

    /* ── Reverse batsman card ──────────────────────────────── */
    const bc = inn.batting.find((b: any) => b.playerId?.toString() === snap.batsmanId);
    if (bc && snap.isLegal) {
      bc.runs -= snap.batRuns;
      bc.ballsFaced -= 1;
      if (snap.batRuns === 0) bc.dotBalls -= 1;
      if (snap.batRuns === 1) bc.singles -= 1;
      if (snap.batRuns === 2) bc.doubles -= 1;
      if (snap.batRuns === 3) bc.triples -= 1;
      if (snap.batRuns === 4) bc.fours -= 1;
      if (snap.batRuns === 6) bc.sixes -= 1;
      bc.strikeRate = bc.ballsFaced > 0 ? +((bc.runs / bc.ballsFaced) * 100).toFixed(2) : 0;
      // Reset milestones if runs dropped below threshold
      bc.milestones.reached30 = bc.runs >= 30;
      bc.milestones.reached50 = bc.runs >= 50;
      bc.milestones.reached100 = bc.runs >= 100;
    }

    /* ── Reverse bowler card ───────────────────────────────── */
    const bw = inn.bowling.find((b: any) => b.playerId?.toString() === snap.bowlerId);
    if (bw) {
      if (snap.isLegal) bw.ballsBowled -= 1;
      bw.runsConceded -= snap.totalRuns;
      if (snap.totalRuns === 0 && snap.isLegal) bw.dotBalls -= 1;
      if (snap.extras?.type === "wide") bw.wides -= 1;
      if (snap.extras?.type === "no_ball") bw.noBalls -= 1;
      if (snap.batRuns === 4) bw.foursConceded -= 1;
      if (snap.batRuns === 6) bw.sixesConceded -= 1;
      bw.overs = +(Math.floor(bw.ballsBowled / 6) + (bw.ballsBowled % 6) / 10).toFixed(1);
      bw.economy = bw.ballsBowled > 0 ? +(bw.runsConceded / (bw.ballsBowled / 6)).toFixed(2) : 0;
    }

    /* ── Reverse wicket ────────────────────────────────────── */
    if (snap.isWicket && snap.wicket) {
      if (!["run_out", "obstructing"].includes(snap.wicket.type) && bw) bw.wickets -= 1;
      inn.totalWickets -= 1;
      // Restore dismissed batsman
      const d = inn.batting.find((b: any) => b.playerId?.toString() === snap.wicket.dismissedBatsman);
      if (d) {
        d.status = "batting";
        d.dismissal = undefined;
      }
      // Remove last fall of wicket
      if (inn.fallOfWickets.length > 0) inn.fallOfWickets.pop();
      // Revert next batsman back to yet_to_bat
      if (snap.nextBatsmanId) {
        const nx = inn.batting.find((b: any) => b.playerId?.toString() === snap.nextBatsmanId);
        if (nx && nx.ballsFaced === 0 && nx.runs === 0) nx.status = "yet_to_bat";
      }
    }

    /* ── Reverse extras ────────────────────────────────────── */
    if (snap.extras) {
      const et =
        snap.extras.type === "no_ball"  ? "noBalls" :
        snap.extras.type === "wide"     ? "wides"   :
        snap.extras.type === "bye"      ? "byes"    :
        snap.extras.type === "leg_bye"  ? "legByes" : null;
      if (et && inn.extras[et] !== undefined) inn.extras[et] -= snap.extras.runs;
      inn.extras.total -= snap.extras.runs;
    }

    /* ── Reverse totals ────────────────────────────────────── */
    inn.totalRuns -= snap.totalRuns;
    if (snap.isLegal) {
      inn.totalBalls -= 1;
      inn.totalOvers = +(Math.floor(inn.totalBalls / 6) + (inn.totalBalls % 6) / 10).toFixed(1);
    }
    const ov = inn.totalBalls / 6;
    inn.currentRunRate = ov > 0 ? +(inn.totalRuns / ov).toFixed(2) : 0;
    const mx = m.matchConfig?.totalOvers ?? 20;
    if (inn.target) {
      const rem = (mx * 6 - inn.totalBalls) / 6;
      inn.requiredRunRate = rem > 0 ? +((inn.target - inn.totalRuns) / rem).toFixed(2) : 0;
    } else {
      inn.projectedScore = Math.round(inn.currentRunRate * mx);
    }

    /* ── Restore strike ────────────────────────────────────── */
    inn.currentBatsman = snap.prevStriker;
    inn.currentNonStriker = snap.prevNonStriker;

    /* ── Reverse over/ball tracking ───────────────────────── */
    if (inn.overs && inn.overs.length > 0) {
      const lastOver = inn.overs[inn.overs.length - 1];
      if (lastOver.balls && lastOver.balls.length > 0) {
        const removed = lastOver.balls.pop();
        lastOver.runs -= (removed?.totalRuns ?? 0);
        if (removed?.isWicket) lastOver.wickets -= 1;
        if (removed?.extras) lastOver.extras -= (removed.extras.runs ?? 0);
        // Undo maiden bonus if an over was previously completed as maiden
        if (lastOver.isMaiden && lastOver.balls.length >= 6) {
          // Re-evaluate — but simpler to just reset; maidens recalc on next over end
          lastOver.isMaiden = false;
        }
      }
      if (lastOver.balls.length === 0) inn.overs.pop();
    }

    /* ── Reverse partnership tracking ──────────────────────── */
    if (inn.partnerships && inn.partnerships.length > 0) {
      if (snap.isWicket) {
        // Wicket was undone: remove the new (empty) partnership, reactivate previous
        const lastP = inn.partnerships[inn.partnerships.length - 1];
        if (lastP && lastP.totalBalls === 0 && lastP.totalRuns === 0) {
          inn.partnerships.pop();
        }
        if (inn.partnerships.length > 0) {
          inn.partnerships[inn.partnerships.length - 1].isActive = true;
        }
      }
      const activeP = inn.partnerships.find((ps: any) => ps.isActive);
      if (activeP) {
        activeP.totalRuns -= snap.totalRuns;
        if (snap.isLegal) activeP.totalBalls -= 1;
        const b1Id = activeP.batsman1?.playerId?.toString();
        if (b1Id === snap.batsmanId) {
          activeP.batsman1.runs -= snap.batRuns;
          if (snap.isLegal) activeP.batsman1.balls -= 1;
        } else {
          activeP.batsman2.runs -= snap.batRuns;
          if (snap.isLegal) activeP.batsman2.balls -= 1;
        }
      }
    }

    /* ── Clear snapshot ────────────────────────────────────── */
    (m as any).lastBallSnapshot = undefined;
    m.lastActivityAt = new Date();
    await m.save();

    /* ── Emit undo event ───────────────────────────────────── */
    emitToMatch(m._id.toString(), SOCKET_EVENTS.BALL_UNDONE, {
      matchId: m._id,
      innings: inn.inningsNumber,
      score: `${inn.totalRuns}/${inn.totalWickets}`,
      overs: inn.totalOvers,
    });

    ok(res, m, MSG.BALL_UNDONE);
    });
  }),
);

/* ═══════════════════════════════════════════════════════════
   GET /:matchId/scorecard
   ═══════════════════════════════════════════════════════════ */
scoringRoutes.get(
  "/:matchId/scorecard",
  asyncHandler(async (req, res) => {
    const raw = await Match.findById(req.params.matchId).lean();
    if (!raw) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    const m = await Match.findById(req.params.matchId)
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
    ok(res, m, MSG.FETCHED("Scorecard"));
  }),
);

/* ═══════════════════════════════════════════════════════════
   GET /:matchId/live/stats
   ═══════════════════════════════════════════════════════════ */
scoringRoutes.get(
  "/:matchId/live/stats",
  asyncHandler(async (req, res) => {
    const m = await Match.findById(req.params.matchId).lean();
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    const i = m.innings?.find((x: any) => x.status === "in_progress")
      ?? m.innings?.[m.innings.length - 1];
    const mx = m.matchConfig?.totalOvers ?? 20;
    ok(
      res,
      i
        ? {
            score: i.totalRuns + "/" + i.totalWickets,
            overs: i.totalOvers,
            crr: i.currentRunRate,
            rrr: i.requiredRunRate ?? null,
            projected: i.projectedScore ?? null,
            target: i.target ?? null,
            runsRequired: i.target ? i.target - i.totalRuns : null,
            ballsRemaining: mx * 6 - i.totalBalls,
          }
        : { score: "0/0" },
      MSG.FETCHED("Stats"),
    );
  }),
);

/* ═══════════════════════════════════════════════════════════
   GET /:matchId/worm-data
   ═══════════════════════════════════════════════════════════ */
scoringRoutes.get(
  "/:matchId/worm-data",
  asyncHandler(async (req, res) => {
    const m = await Match.findById(req.params.matchId).lean();
    if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
    ok(
      res,
      (m.innings ?? []).map((i: any) => ({
        innings: i.inningsNumber,
        target: i.target,
        overs: (i.overs ?? []).map((o: any) => ({
          over: o.overNumber, runs: o.cumulativeRuns, wickets: o.cumulativeWickets,
        })),
      })),
      MSG.FETCHED("Worm"),
    );
  }),
);
