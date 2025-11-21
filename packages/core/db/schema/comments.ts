import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, varchar, integer, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { posts } from "./posts";
import { upvotes } from "./upvotes";

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  parentId: integer("parent_id").references(() => comments.id),
  signature: text("signature"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    postIdx: index("comments_post_idx").on(table.postId),
    authorIdx: index("comments_author_idx").on(table.authorId),
    parentIdx: index("comments_parent_idx").on(table.parentId),
  };
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "child_comments"
  }),
  children: many(comments, {
    relationName: "child_comments"
  }),
  upvotes: many(upvotes)
}));
