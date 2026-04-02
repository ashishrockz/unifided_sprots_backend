import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
import { User } from "../src/modules/users/user.model";
import { SportType } from "../src/modules/sports/sportType.model";
import { SystemConfig } from "../src/modules/admin/systemConfig.model";

async function seed() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/unified_sports",
  );
  if (!(await User.findOne({ email: "admin@unifiedsports.com" })))
    await User.create({
      username: "superadmin",
      email: "admin@unifiedsports.com",
      password: await bcrypt.hash("Admin@123", 12),
      displayName: "Super Admin",
      role: "admin",
      adminRole: "super_admin",
      subscription: { plan: "max" },
    });
  for (const s of [
    {
      name: "Cricket",
      slug: "cricket",
      scoringType: "ball_by_ball",
      minPlayersPerTeam: 2,
      maxPlayersPerTeam: 11,
      rules: {
        maxOvers: 20,
        wideReBall: true,
        noBallReBall: true,
        noBallRuns: 1,
        wideRuns: 1,
        ballsPerOver: 6,
        freeHitOnNoBall: true,
      },
    },
    {
      name: "Badminton",
      slug: "badminton",
      scoringType: "set_based",
      minPlayersPerTeam: 1,
      maxPlayersPerTeam: 2,
      rules: { sets: 3, pointsPerSet: 21, deuceRule: true },
    },
    {
      name: "Tennis",
      slug: "tennis",
      scoringType: "game_based",
      minPlayersPerTeam: 1,
      maxPlayersPerTeam: 2,
      rules: { sets: 3, gamesPerSet: 6, tiebreakAt: 6 },
    },
    {
      name: "Pickleball",
      slug: "pickleball",
      scoringType: "point_based",
      minPlayersPerTeam: 1,
      maxPlayersPerTeam: 2,
      rules: { sets: 3, pointsPerSet: 11, winBy: 2 },
    },
  ])
    await SportType.findOneAndUpdate({ slug: s.slug }, s, { upsert: true });
  for (const c of [
    { key: "maintenance_mode", value: false, category: "maintenance" },
    {
      key: "maintenance_message",
      value: "System under maintenance",
      category: "maintenance",
    },
    { key: "default_inactivity_limit", value: 30, category: "match" },
    { key: "otp_expiry_seconds", value: 300, category: "general" },
    {
      key: "default_toss_assets",
      value: {
        headsImage: "/defaults/heads.png",
        tailsImage: "/defaults/tails.png",
      },
      category: "general",
    },
  ])
    await SystemConfig.findOneAndUpdate({ key: c.key }, c, { upsert: true });
  console.log("🎉 Seed complete!");
  await mongoose.connection.close();
}
seed().catch(console.error);
