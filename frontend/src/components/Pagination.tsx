import { Button, Icon } from 'design-react-kit'

interface Props {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

/**
 * Paginatore compatto: Prev / "X-Y di N" / Next. Le pagine sono 0-indexed all'esterno;
 * il display mostra l'1-indexed canonico (es. "1-25 di 380").
 */
export default function Pagination({ page, pageSize, total, onPageChange }: Props) {
  if (total <= pageSize) return null

  const totalPages = Math.ceil(total / pageSize)
  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, total)

  return (
    <nav className="admin-pagination d-flex align-items-center gap-2 mt-2" aria-label="Paginazione">
      <Button
        size="xs"
        color="secondary"
        outline
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        aria-label="Pagina precedente"
      >
        <Icon icon="it-chevron-left" size="sm" />
      </Button>
      <small className="text-muted">
        {from}-{to} di {total} (pagina {page + 1}/{totalPages})
      </small>
      <Button
        size="xs"
        color="secondary"
        outline
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        aria-label="Pagina successiva"
      >
        <Icon icon="it-chevron-right" size="sm" />
      </Button>
    </nav>
  )
}
