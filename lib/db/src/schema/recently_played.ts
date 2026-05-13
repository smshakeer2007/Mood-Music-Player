import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { songsTable } from "./songs";

export const recentlyPlayedTable = pgTable("recently_played", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  songId: integer("song_id")
    .notNull()
    .references(() => songsTable.id, { onDelete: "cascade" }),
  playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RecentlyPlayed = typeof recentlyPlayedTable.$inferSelect;
