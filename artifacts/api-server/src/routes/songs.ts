import { Router, type IRouter } from "express";
import { eq, ilike, and, sql, desc } from "drizzle-orm";
import { db, songsTable, favoritesTable } from "@workspace/db";
import {
  GetSongsQueryParams,
  GetSongParams,
  GetRelatedSongsParams,
  GetSongsResponse,
  GetSongResponse,
  GetRelatedSongsResponse,
  GetTrendingSongsResponse,
} from "@workspace/api-zod";
import { GUEST_USER_ID } from "./users";

const router: IRouter = Router();

router.get("/songs/trending", async (req, res): Promise<void> => {
  const userId = (req.headers["x-user-id"] as string) || GUEST_USER_ID;
  const songs = await db
    .select()
    .from(songsTable)
    .orderBy(desc(songsTable.playCount))
    .limit(20);

  const favorites = await db
    .select({ songId: favoritesTable.songId })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId));
  const favSet = new Set(favorites.map((f) => f.songId));

  res.json(GetTrendingSongsResponse.parse(songs.map((s) => ({ ...s, liked: favSet.has(s.id) }))));
});

router.get("/songs", async (req, res): Promise<void> => {
  const parsed = GetSongsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { mood, genre, search, limit = 50, offset = 0 } = parsed.data;
  const userId = (req.headers["x-user-id"] as string) || GUEST_USER_ID;

  const conditions = [];
  if (mood) conditions.push(eq(songsTable.mood, mood));
  if (genre) conditions.push(eq(songsTable.genre, genre));
  if (search) {
    conditions.push(
      sql`(${ilike(songsTable.title, `%${search}%`)} OR ${ilike(songsTable.artist, `%${search}%`)})`,
    );
  }

  const songs = await db
    .select()
    .from(songsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset);

  const favorites = await db
    .select({ songId: favoritesTable.songId })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId));
  const favSet = new Set(favorites.map((f) => f.songId));

  res.json(GetSongsResponse.parse(songs.map((s) => ({ ...s, liked: favSet.has(s.id) }))));
});

router.get("/songs/:id/related", async (req, res): Promise<void> => {
  const params = GetRelatedSongsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = (req.headers["x-user-id"] as string) || GUEST_USER_ID;

  const [song] = await db.select().from(songsTable).where(eq(songsTable.id, params.data.id));
  if (!song) {
    res.status(404).json({ error: "Song not found" });
    return;
  }

  const related = await db
    .select()
    .from(songsTable)
    .where(and(eq(songsTable.mood, song.mood), sql`${songsTable.id} != ${song.id}`))
    .limit(10);

  const favorites = await db
    .select({ songId: favoritesTable.songId })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId));
  const favSet = new Set(favorites.map((f) => f.songId));

  res.json(GetRelatedSongsResponse.parse(related.map((s) => ({ ...s, liked: favSet.has(s.id) }))));
});

router.get("/songs/:id", async (req, res): Promise<void> => {
  const params = GetSongParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = (req.headers["x-user-id"] as string) || GUEST_USER_ID;

  const [song] = await db.select().from(songsTable).where(eq(songsTable.id, params.data.id));
  if (!song) {
    res.status(404).json({ error: "Song not found" });
    return;
  }

  const [fav] = await db
    .select()
    .from(favoritesTable)
    .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.songId, song.id)));

  res.json(GetSongResponse.parse({ ...song, liked: !!fav }));
});

export default router;
