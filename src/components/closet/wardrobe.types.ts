import type { Piece, Outfit } from '@/types/app'

/**
 * Modo de visualização do closet
 */
export type ClosetViewMode = 'interactive' | 'grid'

/**
 * Identificadores das seções físicas do armário interativo:
 * - 'shelf': Prateleiras superiores (acessórios, bolsas, chapéus)
 * - 'hanger': Cabideiro / arara (camisas, jaquetas, vestidos, casacos)
 * - 'drawers': Gaveteiro (camisetas dobradas, shorts, bermudas)
 * - 'shoes': Sapateira (tênis, sapatos, botas, sandálias)
 */
export type WardrobeSectionType = 'shelf' | 'hanger' | 'drawers' | 'shoes'
export type WardrobeSectionId = WardrobeSectionType

/**
 * Configuração e dados de cada seção do armário
 */
export interface WardrobeSection {
  id: WardrobeSectionType
  title: string
  subtitle?: string
  allowedCategories: readonly string[]
  pieces: Piece[]
}

/**
 * Estado de interação com peças no armário
 */
export interface WardrobeInteractionState {
  selectedPiece: Piece | null
  activeSection: WardrobeSectionType | null
  highlightedOutfit?: Outfit | null
}
