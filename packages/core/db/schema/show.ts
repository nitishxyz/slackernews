import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, varchar, integer, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { posts } from "./posts";

export const show = pgTable("show", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  userName: varchar("user_name").notNull(),
  activity: varchar("activity").notNull(), // "posted", "commented", "upvoted"
  postId: integer("post_id").references(() => posts.id),
  content: text("content"), // post title if posted, comment if commented, comment if comment upvoted or post title if post upvoted
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const showRelations = relations(show, ({ one }) => ({
  user: one(users, {
    fields: [show.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [show.postId],
    references: [posts.id],
  }),
}));

