import { createFileRoute } from '@tanstack/react-router'
import { APP_NAME } from '#/constants'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>
        A personal place to store visiting cards — name, phone, category, and
        image.
      </p>
      <p>
        Phase 0 scaffold is running. Styling and features land in later phases.
      </p>
    </main>
  )
}
