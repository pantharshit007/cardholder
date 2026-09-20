import { GITHUB_REPO_URL } from '@/constants'

export function FooterCredit({ className }: { className?: string }) {
  return (
    <p className={`text-xs text-muted-foreground ${className ?? ''}`}>
      Build with Tokens 🤖{' '}
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-foreground transition-colors hover:underline"
      >
        @pantharshit007
      </a>
    </p>
  )
}
