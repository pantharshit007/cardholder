import { createFileRoute } from '@tanstack/react-router'

import { CategoriesPage } from '@/components/categories-page'
import { CategoriesPageSkeleton } from '@/components/categories-page-skeleton'
import { listCategories } from '@/server/categories'

export const Route = createFileRoute('/_authenticated/categories')({
  loader: () => listCategories(),
  component: CategoriesRoute,
  pendingComponent: CategoriesPageSkeleton,
})

function CategoriesRoute() {
  const categories = Route.useLoaderData()
  return <CategoriesPage categories={categories} />
}
