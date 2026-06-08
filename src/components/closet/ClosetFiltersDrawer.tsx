'use client'

import { Piece } from '@/types/app'

const ALL_CATEGORIES = [
  'Camiseta / Blusa', 'Camisa', 'Moletom', 'Calça', 'Short / Bermuda', 'Saia', 'Vestido',
  'Macacão', 'Casaco / Jaqueta', 'Tênis', 'Sapato / Oxford', 'Bota', 'Sandália / Chinelo',
  'Acessório', 'Relógio', 'Bolsa', 'Chapéu / Boné',
]

interface ClosetFiltersDrawerProps {
  open: boolean
  onClose: () => void
  onReset: () => void
  pieces: Piece[]
  filteredCount: number
  filterCategory: string
  setFilterCategory: (v: string) => void
  filterSeason: string[]
  setFilterSeason: (v: string[]) => void
  filterStyle: string[]
  setFilterStyle: (v: string[]) => void
  filterColor: string[]
  setFilterColor: (v: string[]) => void
  filterBrand: string[]
  setFilterBrand: (v: string[]) => void
  filterFit: string[]
  setFilterFit: (v: string[]) => void
}

export default function ClosetFiltersDrawer({
  open, onClose, onReset, pieces, filteredCount,
  filterCategory, setFilterCategory,
  filterSeason, setFilterSeason,
  filterStyle, setFilterStyle,
  filterColor, setFilterColor,
  filterBrand, setFilterBrand,
  filterFit, setFilterFit,
}: ClosetFiltersDrawerProps) {
  if (!open) return null

  function uniqueValues(key: keyof Piece): string[] {
    return [...new Set(pieces.map(p => p[key] as string).filter(Boolean))].sort()
  }

  function toggleFilter(arr: string[], val: string, setter: (v: string[]) => void) {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  return (
    <>
      <div className="closet-filter-backdrop" onClick={onClose} />
      <div className="closet-filter-drawer">
        <div className="closet-filter-drawer-header">
          <span className="closet-filter-drawer-title">Filtros</span>
          <button className="closet-filter-drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="closet-filter-section">
          <div className="closet-filter-section-title">Categoria</div>
          <select
            className="closet-filter-select"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">Todas</option>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {uniqueValues('season').length > 0 && (
          <div className="closet-filter-section">
            <div className="closet-filter-section-title">Estação</div>
            <div className="closet-filter-checks">
              {uniqueValues('season').map(s => (
                <label key={s} className="closet-filter-check">
                  <input
                    type="checkbox"
                    checked={filterSeason.includes(s)}
                    onChange={() => toggleFilter(filterSeason, s, setFilterSeason)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        )}

        {uniqueValues('style_type').length > 0 && (
          <div className="closet-filter-section">
            <div className="closet-filter-section-title">Estilo</div>
            <div className="closet-filter-checks">
              {uniqueValues('style_type').map(s => (
                <label key={s} className="closet-filter-check">
                  <input
                    type="checkbox"
                    checked={filterStyle.includes(s)}
                    onChange={() => toggleFilter(filterStyle, s, setFilterStyle)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        )}

        {uniqueValues('color').length > 0 && (
          <div className="closet-filter-section">
            <div className="closet-filter-section-title">Cor</div>
            <div className="closet-filter-colors">
              {uniqueValues('color').map(c => (
                <button
                  key={c}
                  className={`closet-filter-color-chip ${filterColor.includes(c) ? 'active' : ''}`}
                  onClick={() => toggleFilter(filterColor, c, setFilterColor)}
                  title={c}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {uniqueValues('fit').length > 0 && (
          <div className="closet-filter-section">
            <div className="closet-filter-section-title">Fit</div>
            <div className="closet-filter-checks">
              {uniqueValues('fit').map(f => (
                <label key={f} className="closet-filter-check">
                  <input
                    type="checkbox"
                    checked={filterFit.includes(f)}
                    onChange={() => toggleFilter(filterFit, f, setFilterFit)}
                  />
                  {f}
                </label>
              ))}
            </div>
          </div>
        )}

        {uniqueValues('brand').length > 0 && (
          <div className="closet-filter-section">
            <div className="closet-filter-section-title">Marca</div>
            <div className="closet-filter-checks">
              {uniqueValues('brand').map(b => (
                <label key={b} className="closet-filter-check">
                  <input
                    type="checkbox"
                    checked={filterBrand.includes(b)}
                    onChange={() => toggleFilter(filterBrand, b, setFilterBrand)}
                  />
                  {b}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="closet-filter-actions">
          <button className="closet-filter-reset" onClick={onReset}>Limpar</button>
          <button className="closet-filter-apply" onClick={onClose}>Aplicar ({filteredCount})</button>
        </div>
      </div>
    </>
  )
}
