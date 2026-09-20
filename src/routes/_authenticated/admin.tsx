import { createFileRoute } from '@tanstack/react-router'

import { AdminUsersPage } from '@/components/admin-users-page'
import { requireAdminRole } from '@/lib/verified-user'
import { adminUserFilterSchema } from '@/lib/validators/admin'
import { fetchAdminUsers } from '@/server/admin'

export const Route = createFileRoute('/_authenticated/admin')({
  validateSearch: (search) => adminUserFilterSchema.parse(search),
  beforeLoad: ({ context }) => {
    requireAdminRole(context.user)
  },
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => fetchAdminUsers({ data: deps }),
  component: AdminRoute,
})

function AdminRoute() {
  const page = Route.useLoaderData()
  const filters = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <AdminUsersPage
      page={page}
      filters={filters}
      onFiltersChange={(next) => {
        void navigate({ search: next })
      }}
    />
  )
}
