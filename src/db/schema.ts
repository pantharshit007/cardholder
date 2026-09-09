import { relations } from 'drizzle-orm'
import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

import { user } from './auth-schema'

export * from './auth-schema'

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('categories_user_id_name_unique').on(table.userId, table.name),
    index('categories_user_id_idx').on(table.userId),
  ],
)

export const cards = pgTable(
  'cards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    company: text('company'),
    notes: text('notes'),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    imageUrl: text('image_url'),
    imagePublicId: text('image_public_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('cards_user_id_idx').on(table.userId),
    index('cards_user_id_category_id_idx').on(table.userId, table.categoryId),
    index('cards_user_id_name_idx').on(table.userId, table.name),
  ],
)

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  cards: many(cards),
  user: one(user, {
    fields: [categories.userId],
    references: [user.id],
  }),
}))

export const cardsRelations = relations(cards, ({ one }) => ({
  category: one(categories, {
    fields: [cards.categoryId],
    references: [categories.id],
  }),
  user: one(user, {
    fields: [cards.userId],
    references: [user.id],
  }),
}))
