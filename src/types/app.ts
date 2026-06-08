// Tipos manuais do projeto — NÃO sobrescrever com geração automática

import type { Database } from './database'

export type Plan = 'free' | 'pro'

export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  plan: Plan | null
}

export type PiecePhoto = Database['public']['Tables']['piece_photos']['Row']

export type Piece = Database['public']['Tables']['pieces']['Row'] & {
  piece_photos?: PiecePhoto[]
}

export type Outfit = Database['public']['Tables']['outfits']['Row']

export type OutfitHistory = Database['public']['Tables']['outfit_history']['Row']

export type WishlistItem = Database['public']['Tables']['wishlist_items']['Row'] & {
  priority: 'high' | 'medium' | 'low' | null
}
