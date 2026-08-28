import { relations } from 'drizzle-orm'
import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

/**
 * Application tables. Better Auth tables (`user`, `session`, …) land in Phase 3.
 * `userId` is plain text for now; Phase 3 wires the FK to `user.id`.
 */
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
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
    userId: text('user_id').notNull(),
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

export const categoriesRelations = relations(categories, ({ many }) => ({
  cards: many(cards),
}))

export const cardsRelations = relations(cards, ({ one }) => ({
  category: one(categories, {
    fields: [cards.categoryId],
    references: [categories.id],
  }),
}))
