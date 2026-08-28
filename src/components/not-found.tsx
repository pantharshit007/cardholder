import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>That URL does not match a route in this app.</p>
      <p>
        <Link to="/">Back to home</Link>
      </p>
    </main>
  )
}
