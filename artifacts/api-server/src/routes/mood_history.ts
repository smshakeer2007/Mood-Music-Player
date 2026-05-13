import { Router, type IRouter } from "express";
import { eq, desc, count } from "drizzle-orm";
import { db, moodHistoryTable } from "@workspace/db";
import {
  RecordMoodBody,
  GetMoodHistoryResponse,
  GetMoodStatsResponse,
} from "@workspace/api-zod";
import { GUEST_USER_ID } from "./users";

const router: IRouter = Router();

function getUserId(req: Parameters<Parameters<typeof router.get>[1]>[0]): string {
  return (req.headers["x-user-id"] as string) || GUEST_USER_ID;
}

router.get("/mood-history", async (req, res): Promise<void> => {
  const userId = getUserId(req);

  const entries = await db
    .select()
    .from(moodHistoryTable)
    .where(eq(moodHistoryTable.userId, userId))
    .orderBy(desc(moodHistoryTable.recordedAt))
    .limit(90);

  res.json(
    GetMoodHistoryResponse.parse(
      entries.map((e) => ({
        id: e.id,
        mood: e.mood,
        note: e.note,
        recordedAt: e.recordedAt.toISOString(),
      })),
    ),
  );
});

router.post("/mood-history", async (req, res): Promise<void> => {
  const parsed = RecordMoodBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = getUserId(req);

  const [entry] = await db
    .insert(moodHistoryTable)
    .values({ ...parsed.data, userId })
    .returning();

  res.status(201).json({
    id: entry.id,
    mood: entry.mood,
    note: entry.note,
    recordedAt: entry.recordedAt.toISOString(),
  });
});

router.get("/mood-history/stats", async (req, res): Promise<void> => {
  const userId = getUserId(req);

  const stats = await db
    .select({ mood: moodHistoryTable.mood, count: count() })
    .from(moodHistoryTable)
    .where(eq(moodHistoryTable.userId, userId))
    .groupBy(moodHistoryTable.mood)
    .orderBy(desc(count()));

  res.json(GetMoodStatsResponse.parse(stats.map((s) => ({ mood: s.mood, count: s.count }))));
});

export default router;
