import { Badge } from 'design-react-kit'

interface RepoUrlLabelProps {
  url: string | null | undefined
  /** Quando true (default) wrappa in {@code <a target="_blank">}. */
  asLink?: boolean
}

interface ParsedGithub {
  owner: string
  repo: string
}

/**
 * Rendering uniforme di una URL repo: per gli URL github.com mostra
 * {@code [owner] / [repo]} con due badge neutri separati da " / ".
 * Per URL non github o non parsabili, fallback alla URL nuda.
 *
 * Quando {@link RepoUrlLabelProps.asLink} e' true (default) tutto il render
 * e' cliccabile e apre la URL completa in nuova tab.
 */
export default function RepoUrlLabel({ url, asLink = true }: RepoUrlLabelProps) {
  if (!url) {
    return <span className="text-secondary">—</span>
  }
  const parsed = parseGithubUrl(url)
  if (!parsed) {
    return asLink ? (
      <a href={url} target="_blank" rel="noreferrer">
        {url}
      </a>
    ) : (
      <span>{url}</span>
    )
  }
  const content = (
    <span className="d-inline-flex align-items-center gap-1">
      <Badge color="secondary" pill className="fw-normal">
        {parsed.owner}
      </Badge>
      <span className="text-secondary">/</span>
      <Badge color="secondary" pill className="fw-normal">
        {parsed.repo}
      </Badge>
    </span>
  )
  if (asLink) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-decoration-none"
        aria-label={`${parsed.owner}/${parsed.repo}`}
      >
        {content}
      </a>
    )
  }
  return content
}

function parseGithubUrl(url: string): ParsedGithub | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.hostname !== 'github.com') return null
  const parts = parsed.pathname.split('/').filter(Boolean)
  if (parts.length < 2) return null
  return {
    owner: parts[0],
    repo: parts[1].replace(/\.git$/, ''),
  }
}
