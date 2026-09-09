/**
 * Connectivity smoke check.
 * Runs `select 1` and counts application + auth tables via the shared `db` client.
 */
import { sql } from 'drizzle-orm'

import { db } from '../src/db'
import { cards, categories, session, user } from '../src/db/schema'

async function main() {
  const ping = await db.execute(sql`select 1 as ok`)
  const [categoryCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(categories)
  const [cardCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cards)
  const [userCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
  const [sessionCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(session)

  console.log('db smoke ok:', {
    ping: ping.rows[0],
    categories: categoryCount?.count ?? 0,
    cards: cardCount?.count ?? 0,
    users: userCount?.count ?? 0,
    sessions: sessionCount?.count ?? 0,
  })
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('db smoke failed:', error)
    process.exit(1)
  })
