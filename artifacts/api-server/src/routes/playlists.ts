import { Router, type IRouter } from "express";
import { eq, and, count, desc } from "drizzle-orm";
import { db, playlistsTable, playlistSongsTable, songsTable, favoritesTable } from "@workspace/db";
import {
  GetPlaylistParams,
  DeletePlaylistParams,
  AddSongToPlaylistParams,
  CreatePlaylistBody,
  GetPlaylistsResponse,
  GetPlaylistResponse,
  DeletePlaylistResponse,
  AddSongToPlaylistResponse,
} from "@workspace/api-zod";
import { GUEST_USER_ID } from "./users";

const router: IRouter = Router();

function getUserId(req: Parameters<Parameters<typeof router.get>[1]>[0]): string {
  return (req.headers["x-user-id"] as string) || GUEST_USER_ID;
}

router.get("/playlists", async (req, res): Promise<void> => {
  const userId = getUserId(req);

  const playlists = await db
    .select()
    .from(playlistsTable)
    .where(eq(playlistsTable.userId, userId))
    .orderBy(desc(playlistsTable.createdAt));

  const counts = await db
    .select({ playlistId: playlistSongsTable.playlistId, count: count() })
    .from(playlistSongsTable)
    .groupBy(playlistSongsTable.playlistId);
  const countMap = new Map(counts.map((c) => [c.playlistId, c.count]));

  res.json(
    GetPlaylistsResponse.parse(
      playlists.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        songCount: countMap.get(p.id) ?? 0,
        coverUrl: p.coverUrl,
        mood: p.mood,
        createdAt: p.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/playlists", async (req, res): Promise<void> => {
  const parsed = CreatePlaylistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = getUserId(req);

  const [playlist] = await db
    .insert(playlistsTable)
    .values({ ...parsed.data, userId })
    .returning();

  res.status(201).json(
    GetPlaylistResponse.parse({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      mood: playlist.mood,
      songs: [],
      createdAt: playlist.createdAt.toISOString(),
    }),
  );
});

router.get("/playlists/:id", async (req, res): Promise<void> => {
  const params = GetPlaylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = getUserId(req);

  const [playlist] = await db
    .select()
    .from(playlistsTable)
    .where(and(eq(playlistsTable.id, params.data.id), eq(playlistsTable.userId, userId)));

  if (!playlist) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  const rows = await db
    .select({ song: songsTable })
    .from(playlistSongsTable)
    .innerJoin(songsTable, eq(playlistSongsTable.songId, songsTable.id))
    .where(eq(playlistSongsTable.playlistId, params.data.id))
    .orderBy(playlistSongsTable.addedAt);

  const favorites = await db
    .select({ songId: favoritesTable.songId })
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId));
  const favSet = new Set(favorites.map((f) => f.songId));

  res.json(
    GetPlaylistResponse.parse({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      mood: playlist.mood,
      songs: rows.map((r) => ({ ...r.song, liked: favSet.has(r.song.id) })),
      createdAt: playlist.createdAt.toISOString(),
    }),
  );
});

router.delete("/playlists/:id", async (req, res): Promise<void> => {
  const params = DeletePlaylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = getUserId(req);

  await db
    .delete(playlistsTable)
    .where(and(eq(playlistsTable.id, params.data.id), eq(playlistsTable.userId, userId)));

  res.json(DeletePlaylistResponse.parse({ success: true }));
});

router.post("/playlists/:id/songs/:songId", async (req, res): Promise<void> => {
  const params = AddSongToPlaylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(playlistSongsTable)
    .where(
      and(
        eq(playlistSongsTable.playlistId, params.data.id),
        eq(playlistSongsTable.songId, params.data.songId),
      ),
    );

  if (existing.length === 0) {
    await db.insert(playlistSongsTable).values({
      playlistId: params.data.id,
      songId: params.data.songId,
    });
  }

  res.json(AddSongToPlaylistResponse.parse({ success: true }));
});

export default router;
