import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import { ADMIN_CONFIG } from '@/constants'
import { listAdminUsers, approveUserById } from '@/services/admin-user.service'
import { db } from '@/db'
import { user } from '@/db/schema'
import { env } from '@/env'
import { auth } from '@/lib/auth'
import { getRequestSession } from '@/lib/session'
import {
  emailVerificationFailure,
  requireVerifiedEmail,
  requireAdminRole,
} from '@/lib/verified-user'
import { handleCardAutofill } from '@/server/ocr'

const pool = db.$client
assert.ok(pool instanceof Pool)
assert.ok(new URL(env.DATABASE_URL).pathname.startsWith('/cardholder_test_'))
before(async () => {
  await migrate(drizzle(pool), { migrationsFolder: 'drizzle' })
})
after(async () => {
  await pool.end()
})

test('unverified sign-ins are gated and maintainer changes override cached session flags', async () => {
  const signupBody = {
    name: 'Pending',
    email: 'pending@example.com',
    password: 'verification-test-password',
    isAdmin: true,
    emailVerified: true,
  }
  const response = await auth.api.signUpEmail({
    body: signupBody,
    asResponse: true,
  })
  assert.equal(response.status, 200)
  const headers = new Headers({
    cookie: response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(';')[0])
      .join('; '),
  })
  const pending = await getRequestSession(headers)
  assert.ok(pending?.user)
  assert.equal(pending.user.emailVerified, false)
  assert.equal(pending.user.isAdmin, false)
  const unverifiedLogin = await auth.api.signInEmail({
    body: {
      email: signupBody.email,
      password: signupBody.password,
    },
    asResponse: true,
  })
  assert.equal(unverifiedLogin.status, 200)
  const profileUpdate = {
    name: 'Still pending',
    isAdmin: true,
    emailVerified: true,
  }
  await assert.rejects(
    auth.api.updateUser({ headers, body: profileUpdate }),
    /isAdmin is not allowed to be set/,
  )
  const verificationUpdate = { name: 'Still pending', emailVerified: true }
  await auth.api.updateUser({ headers, body: verificationUpdate })
  const afterUpdate = await getRequestSession(headers)
  assert.equal(afterUpdate?.user.isAdmin, false)
  assert.equal(afterUpdate.user.emailVerified, false)
  assert.throws(() => requireAdminRole(pending.user))
  assert.throws(
    () => requireVerifiedEmail(pending.user),
    (error: unknown) => {
      return (
        typeof error === 'object' &&
        error !== null &&
        'options' in error &&
        (error as { options: { to: string } }).options.to ===
          '/verification-pending'
      )
    },
  )
  assert.equal(emailVerificationFailure(pending.user)?.status, 403)
  const deniedScan = await handleCardAutofill(
    new Request('http://localhost:3000/api/ocr', { method: 'POST', headers }),
  )
  assert.equal(deniedScan.status, 403)

  await db
    .update(user)
    .set({ emailVerified: true })
    .where(eq(user.id, pending.user.id))
  const approved = await getRequestSession(headers)
  assert.ok(approved?.user.emailVerified)
  assert.doesNotThrow(() => requireVerifiedEmail(approved.user))
  assert.equal(emailVerificationFailure(approved.user), null)

  await db
    .update(user)
    .set({ isAdmin: true })
    .where(eq(user.id, pending.user.id))
  const admin = await getRequestSession(headers)
  assert.ok(admin?.user.isAdmin)
  assert.doesNotThrow(() => requireAdminRole(admin.user))

  // Sign in while approved to obtain a cookie cache containing true.
  const signedIn = await auth.api.signInEmail({
    body: {
      email: 'pending@example.com',
      password: 'verification-test-password',
    },
    asResponse: true,
  })
  assert.equal(signedIn.status, 200)
  const approvedHeaders = new Headers({
    cookie: signedIn.headers
      .getSetCookie()
      .map((cookie) => cookie.split(';')[0])
      .join('; '),
  })
  await db
    .update(user)
    .set({ emailVerified: false, isAdmin: false })
    .where(eq(user.id, pending.user.id))
  const revoked = await getRequestSession(approvedHeaders)
  assert.ok(revoked?.user)
  assert.equal(revoked.user.emailVerified, false)
  assert.equal(revoked.user.isAdmin, false)
  assert.throws(() => requireAdminRole(revoked.user))
  assert.equal(emailVerificationFailure(revoked.user)?.status, 403)
  assert.equal(await getRequestSession(new Headers()), null)
})

test('admin directory uses bounded pages and approving a row does not skip subsequent pending users', async () => {
  // This database is disposable and belongs to this test file.
  await db.delete(user)
  const records = Array.from(
    { length: ADMIN_CONFIG.pageSize * 2 + 1 },
    (_, index) => ({
      id: `approval-${String(index).padStart(4, '0')}`,
      name: `User ${index}`,
      email: `user-${index}@example.com`,
    }),
  )
  await db.insert(user).values(records)
  const first = await listAdminUsers({})
  assert.equal(first.users.length, ADMIN_CONFIG.pageSize)
  assert.ok(first.nextCursor)
  const last = first.users.at(-1)!
  assert.equal(await approveUserById(last.id), true)
  assert.equal(await approveUserById(last.id), false)
  assert.equal(await approveUserById('missing'), false)
  const second = await listAdminUsers({ after: first.nextCursor })
  assert.equal(second.users.length, ADMIN_CONFIG.pageSize)
  assert.ok(second.nextCursor)
  const third = await listAdminUsers({ after: second.nextCursor })
  assert.equal(third.users.length, 1)
  assert.equal(third.nextCursor, null)
  const ids = [...first.users, ...second.users, ...third.users].map(
    (row) => row.id,
  )
  assert.equal(new Set(ids).size, records.length)
  const approved = await listAdminUsers({ status: 'approved' })
  assert.deepEqual(
    approved.users.map((row) => row.id),
    [last.id],
  )
  assert.equal(approved.users[0]?.isAdmin, false)
  assert.equal(
    (await listAdminUsers({ status: 'all' })).users.length,
    ADMIN_CONFIG.pageSize,
  )
})
