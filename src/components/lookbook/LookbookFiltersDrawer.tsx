'use client'

const PERIOD_OPTIONS = [
  { value: 'dia', label: 'Dia' },
  { value: 'noite', label: 'Noite' },
]

const OCCASION_OPTIONS = [
  'Dia a Dia', 'Shopping', 'Amigos', 'Viagem', 'Faculdade', 'Trabalho', 'Reunião',
  'Academia', 'Café', 'Praia', 'Lazer', 'Ensaio', 'Evento Cultural', 'Ao Ar Livre',
]

const STYLE_OPTIONS = [
  'Streetwear', 'Casual', 'Minimalista', 'Elegante', 'Esportivo', 'Statement', 'Boho', 'Clássico',
]

const SEASON_OPTIONS = ['Verão', 'Inverno', 'Meia Estação', 'Todas']

export interface LookbookFilters {
  periodo: string[]
  ocasiao: string[]
  estilo: string[]
  estacao: string[]
}

interface LookbookFiltersDrawerProps {
  open: boolean
  onClose: () => void
  onReset: () => void
  filters: LookbookFilters
  setFilters: (filters: LookbookFilters) => void
  filteredCount: number
}

export default function LookbookFiltersDrawer({
  open,
  onClose,
  onReset,
  filters,
  setFilters,
  filteredCount,
}: LookbookFiltersDrawerProps) {
  if (!open) return null

  function toggleFilter(
    key: keyof LookbookFilters,
    value: string,
  ) {
    const current = filters[key]
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    setFilters({ ...filters, [key]: next })
  }

  return (
    <>
      <div className="closet-filter-backdrop" onClick={onClose} />
      <div className="closet-filter-drawer lookbook-filter-drawer">
        <div className="closet-filter-drawer-header">
          <span className="closet-filter-drawer-title">Filtros</span>
          <button className="closet-filter-drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="closet-filter-section">
          <div className="closet-filter-section-title">Período</div>
          <div className="closet-filter-checks">
            {PERIOD_OPTIONS.map(({ value, label }) => (
              <label key={value} className="closet-filter-check">
                <input
                  type="checkbox"
                  checked={filters.periodo.includes(value)}
                  onChange={() => toggleFilter('periodo', value)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="closet-filter-section">
          <div className="closet-filter-section-title">Ocasião</div>
          <div className="closet-filter-checks">
            {OCCASION_OPTIONS.map(occ => (
              <label key={occ} className="closet-filter-check">
                <input
                  type="checkbox"
                  checked={filters.ocasiao.includes(occ)}
                  onChange={() => toggleFilter('ocasiao', occ)}
                />
                {occ}
              </label>
            ))}
          </div>
        </div>

        <div className="closet-filter-section">
          <div className="closet-filter-section-title">Estilo</div>
          <div className="closet-filter-checks">
            {STYLE_OPTIONS.map(style => (
              <label key={style} className="closet-filter-check">
                <input
                  type="checkbox"
                  checked={filters.estilo.includes(style)}
                  onChange={() => toggleFilter('estilo', style)}
                />
                {style}
              </label>
            ))}
          </div>
        </div>

        <div className="closet-filter-section">
          <div className="closet-filter-section-title">Estação</div>
          <div className="closet-filter-checks">
            {SEASON_OPTIONS.map(season => (
              <label key={season} className="closet-filter-check">
                <input
                  type="checkbox"
                  checked={filters.estacao.includes(season)}
                  onChange={() => toggleFilter('estacao', season)}
                />
                {season}
              </label>
            ))}
          </div>
        </div>

        <div className="closet-filter-actions">
          <button className="closet-filter-reset" onClick={onReset}>Limpar</button>
          <button className="closet-filter-apply" onClick={onClose}>
            Aplicar ({filteredCount})
          </button>
        </div>
      </div>
    </>
  )
}
