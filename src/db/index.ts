import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import type { DbDriver } from '@/constants'
import { DB_CONFIG } from '@/constants'
import { env } from '@/env'

import * as schema from './schema'

function resolveDbDriver(): DbDriver {
  return (
    env.DB_DRIVER ??
    (env.NODE_ENV === 'production' ? DB_CONFIG.prodDriver : DB_CONFIG.devDriver)
  )
}

function createDb() {
  if (resolveDbDriver() === 'neon') {
    const sql = neon(env.DATABASE_URL)
    return drizzleNeon({ client: sql, schema })
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL })
  return drizzlePg({ client: pool, schema })
}

/** Shared Drizzle client: `pg` in development, Neon HTTP in production. */
export const db = createDb()

export type Database = typeof db
