import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const moodHistoryTable = pgTable("mood_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  mood: text("mood").notNull(),
  note: text("note"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMoodHistorySchema = createInsertSchema(moodHistoryTable).omit({ id: true, recordedAt: true });
export type InsertMoodHistory = z.infer<typeof insertMoodHistorySchema>;
export type MoodHistory = typeof moodHistoryTable.$inferSelect;
