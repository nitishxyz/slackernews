import { relations } from "drizzle-orm";
import { pgTable, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { posts } from "./posts";
import { comments } from "./comments";
import { upvotes } from "./upvotes";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  username: varchar("username").unique(),
  walletAddress: varchar("wallet_address"),
  stage: varchar("stage").notNull().default(""),
  karma: integer("karma").notNull().default(0),

  // Database timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  upvotes: many(upvotes),
}));
