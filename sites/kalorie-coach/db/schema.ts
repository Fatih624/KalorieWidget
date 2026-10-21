import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const journals = sqliteTable('journals', { owner: text('owner').primaryKey(), body: text('body').notNull(), revision: integer('revision').notNull().default(0), updatedAt: integer('updated_at').notNull() });
export const pairings = sqliteTable('pairings', { hash: text('hash').primaryKey(), owner: text('owner').notNull(), expiresAt: integer('expires_at').notNull(), claimed: integer('claimed').notNull().default(0) });
export const devices = sqliteTable('devices', { hash: text('hash').primaryKey(), owner: text('owner').notNull(), name: text('name').notNull(), createdAt: integer('created_at').notNull() });
export const quotas = sqliteTable('quotas', { owner: text('owner').notNull(), day: text('day').notNull(), calls: integer('calls').notNull().default(0) }, t => [primaryKey({ columns: [t.owner, t.day] })]);
export const analyses = sqliteTable('analyses', { owner: text('owner').notNull(), hash: text('hash').notNull(), body: text('body').notNull(), expiresAt: integer('expires_at').notNull() }, t => [primaryKey({ columns: [t.owner, t.hash] })]);
