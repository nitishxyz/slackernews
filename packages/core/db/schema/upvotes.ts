import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, varchar, integer, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { posts } from "./posts";
import { comments } from "./comments";

export const upvotes = pgTable("upvotes", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  postId: integer("post_id").references(() => posts.id),
  commentId: integer("comment_id").references(() => comments.id),
  signature: text("signature").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    authorIdx: index("upvotes_author_idx").on(table.authorId),
    postIdx: index("upvotes_post_idx").on(table.postId),
    commentIdx: index("upvotes_comment_idx").on(table.commentId),
  };
});

export const upvotesRelations = relations(upvotes, ({ one }) => ({
  author: one(users, {
    fields: [upvotes.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [upvotes.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [upvotes.commentId],
    references: [comments.id],
  }),
}));
