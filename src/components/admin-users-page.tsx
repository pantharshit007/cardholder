import { useRouter, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { approveUser } from '@/server/admin'
import type { AdminUserFilter, AdminUserPage } from '@/types/admin'

export function AdminUsersPage({
  page,
  filters,
  onFiltersChange,
}: {
  page: AdminUserPage
  filters: AdminUserFilter
  onFiltersChange: (filters: AdminUserFilter) => void
}) {
  const router = useRouter()
  const loading = useRouterState({ select: (state) => state.isLoading })
  const [approving, setApproving] = useState<string | null>(null)

  async function approve(id: string) {
    setApproving(id)
    try {
      const result = await approveUser({ data: { id } })
      toast.success(
        result.approved
          ? 'User approved.'
          : 'User is already approved or no longer exists.',
      )
      await router.invalidate()
    } catch {
      toast.error('Could not approve this user. Please try again.')
    } finally {
      setApproving(null)
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="font-display text-3xl">User approvals</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Approve an email to give that user access to the app.
      </p>
      <div className="my-6 flex items-center gap-3">
        <Label htmlFor="approval-status">Show</Label>
        <select
          id="approval-status"
          className="rounded-md border bg-background p-2 text-sm"
          value={filters.status ?? 'pending'}
          disabled={loading || approving !== null}
          onChange={(event) =>
            onFiltersChange({
              status: event.target.value as AdminUserFilter['status'],
            })
          }
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="all">All users</option>
        </select>
      </div>
      <section aria-busy={loading}>
        {page.users.length === 0 ? (
          <p className="rounded-lg border p-6 text-muted-foreground">
            No users on this page.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {page.users.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium">{user.name}</p>
                  <p className="break-all text-sm text-muted-foreground">
                    {user.email}
                  </p>
                  {user.isAdmin ? (
                    <p className="text-xs text-muted-foreground">Admin</p>
                  ) : null}
                </div>
                {user.emailVerified ? (
                  <span className="text-sm text-muted-foreground">
                    Approved
                  </span>
                ) : (
                  <Button
                    size="sm"
                    disabled={approving !== null || loading}
                    onClick={() => void approve(user.id)}
                    aria-label={`Approve ${user.email}`}
                  >
                    {approving === user.id ? 'Approving…' : 'Approve'}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <nav aria-label="User pages" className="mt-4 flex gap-3">
        <Button
          variant="outline"
          disabled={!filters.after || loading || approving !== null}
          onClick={() => onFiltersChange({ status: filters.status })}
        >
          First page
        </Button>
        <Button
          variant="outline"
          disabled={!page.nextCursor || loading || approving !== null}
          onClick={() => {
            if (page.nextCursor)
              onFiltersChange({ ...filters, after: page.nextCursor })
          }}
        >
          Next page
        </Button>
      </nav>
      <p role="status" className="mt-3 text-sm text-muted-foreground">
        {loading ? 'Loading users…' : `${page.users.length} users on this page`}
      </p>
    </main>
  )
}
