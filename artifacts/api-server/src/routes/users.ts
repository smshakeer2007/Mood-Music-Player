import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, usersTable, favoritesTable, songsTable, recentlyPlayedTable } from "@workspace/db";
import {
  AddFavoriteParams,
  RemoveFavoriteParams,
  RecordPlayBody,
  GetMeResponse,
  GetFavoritesResponse,
  AddFavoriteResponse,
  RemoveFavoriteResponse,
  GetRecentlyPlayedResponse,
  RecordPlayResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

export const GUEST_USER_ID = "guest-user";

async function ensureGuestUser() {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, GUEST_USER_ID));
  if (!existing) {
    await db.insert(usersTable).values({
      id: GUEST_USER_ID,
      username: "Guest",
      isGuest: true,
    });
  }
}

function getUserId(req: Parameters<Parameters<typeof router.get>[1]>[0]): string {
  return (req.headers["x-user-id"] as string) || GUEST_USER_ID;
}

router.get("/users/me", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  await ensureGuestUser();

  let [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({ id: userId, username: `User_${userId.slice(0, 6)}`, isGuest: false })
      .returning();
  }

  res.json(
    GetMeResponse.parse({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isGuest: user.isGuest,
      createdAt: user.createdAt.toISOString(),
    }),
  );
});

router.get("/users/me/favorites", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  await ensureGuestUser();

  const rows = await db
    .select({ song: songsTable })
    .from(favoritesTable)
    .innerJoin(songsTable, eq(favoritesTable.songId, songsTable.id))
    .where(eq(favoritesTable.userId, userId))
    .orderBy(desc(favoritesTable.createdAt));

  res.json(GetFavoritesResponse.parse(rows.map((r) => ({ ...r.song, liked: true }))));
});

router.post("/users/me/favorites/:songId", async (req, res): Promise<void> => {
  const params = AddFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = getUserId(req);
  await ensureGuestUser();

  const existing = await db
    .select()
    .from(favoritesTable)
    .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.songId, params.data.songId)));

  if (existing.length === 0) {
    await db.insert(favoritesTable).values({ userId, songId: params.data.songId });
  }

  res.json(AddFavoriteResponse.parse({ success: true, liked: true }));
});

router.delete("/users/me/favorites/:songId", async (req, res): Promise<void> => {
  const params = RemoveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = getUserId(req);
  await ensureGuestUser();

  await db
    .delete(favoritesTable)
    .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.songId, params.data.songId)));

  res.json(RemoveFavoriteResponse.parse({ success: true, liked: false }));
});

router.get("/users/me/recently-played", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  await ensureGuestUser();

  const rows = await db
    .select({ rp: recentlyPlayedTable, song: songsTable })
    .from(recentlyPlayedTable)
    .innerJoin(songsTable, eq(recentlyPlayedTable.songId, songsTable.id))
    .where(eq(recentlyPlayedTable.userId, userId))
    .orderBy(desc(recentlyPlayedTable.playedAt))
    .limit(30);

  const favorites = await db
    .select({ songId: favoritesTable.songId })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId));
  const favSet = new Set(favorites.map((f) => f.songId));

  res.json(
    GetRecentlyPlayedResponse.parse(
      rows.map((r) => ({
        id: r.rp.id,
        song: { ...r.song, liked: favSet.has(r.song.id) },
        playedAt: r.rp.playedAt.toISOString(),
      })),
    ),
  );
});

router.post("/users/me/recently-played", async (req, res): Promise<void> => {
  const parsed = RecordPlayBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = getUserId(req);
  await ensureGuestUser();

  await db
    .update(songsTable)
    .set({ playCount: db.$count(songsTable) })
    .where(eq(songsTable.id, parsed.data.songId));

  const [rp] = await db
    .insert(recentlyPlayedTable)
    .values({ userId, songId: parsed.data.songId })
    .returning();

  const [song] = await db.select().from(songsTable).where(eq(songsTable.id, parsed.data.songId));

  const [fav] = await db
    .select()
    .from(favoritesTable)
    .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.songId, parsed.data.songId)));

  res.json(
    RecordPlayResponse.parse({
      id: rp.id,
      song: { ...song, liked: !!fav },
      playedAt: rp.playedAt.toISOString(),
    }),
  );
});

export default router;
