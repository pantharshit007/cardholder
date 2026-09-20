import assert from 'node:assert/strict'
import test from 'node:test'

import { NAVIGATION_CONFIG } from '../src/constants'
import { createNavigationSession } from '../src/lib/navigation-session'
import type { NavigationSessionValue } from '../src/types/router'

const session = {
  user: {
    id: 'user-a',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: true,
    isAdmin: false,
    image: null,
  },
}

test('reuses the layout session until its freshness window expires', async () => {
  let calls = 0
  let time = 0
  const cache = createNavigationSession(
    async () => {
      calls++
      return session
    },
    () => time,
  )

  assert.equal(await cache.get(), session)
  assert.equal(await cache.get(), session)
  assert.equal(calls, 1)
  time = NAVIGATION_CONFIG.sessionStaleTimeMs
  await cache.get()
  assert.equal(calls, 2)
})

test('deduplicates simultaneous hover and navigation session requests', async () => {
  let calls = 0
  const cache = createNavigationSession(async () => {
    calls++
    return session
  })
  const first = cache.get()
  assert.equal(cache.get(), first)
  await first
  assert.equal(calls, 1)
})

test('auth changes clear cached state and old in-flight results cannot restore it', async () => {
  let complete!: (value: NavigationSessionValue) => void
  let calls = 0
  const cache = createNavigationSession(() => {
    calls++
    return calls === 1
      ? new Promise((resolve) => {
          complete = resolve
        })
      : Promise.resolve(null)
  })
  const old = cache.get()
  cache.clear()
  complete(session)
  await old
  assert.equal(await cache.get(), null)
  assert.equal(calls, 2)
})

test('separate routers never share sessions', async () => {
  const first = createNavigationSession(async () => session)
  const second = createNavigationSession(async () => null)
  await first.get()
  assert.equal(await second.get(), null)
})

test('failed and unauthenticated lookups can be retried immediately', async () => {
  let calls = 0
  const cache = createNavigationSession(async () => {
    calls++
    if (calls === 1) throw new Error('Network unavailable')
    return calls === 2 ? null : session
  })
  await assert.rejects(cache.get(), /Network unavailable/)
  assert.equal(await cache.get(), null)
  assert.equal(await cache.get(), session)
  cache.clear()
  await cache.get()
  assert.equal(calls, 4)
})
