export type Plan = 'free' | 'pro'

export type Profile = {
  id: string
  name: string | null
  height: number | null
  weight: number | null
  style: string | null
  avatar_url: string | null
  plan: Plan
  closet_tour_completed: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan_expires_at: string | null
  usage_mia_generations: number | null
  usage_outfit_generations: number | null
  usage_pieces_analyzed: number | null
  usage_wishlist_generations: number | null
  usage_reset_at: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export type Piece = {
  id: string
  user_id: string
  code: string
  name: string
  category: string
  color: string | null
  color_secondary: string | null
  brand: string | null
  photo_url: string | null
  fit: string | null
  style_type: string | null
  season: string | null
  description: string | null
  notes: string | null
  created_at: string
}

export type Outfit = {
  id: string
  user_id: string
  name: string
  subtitle: string | null
  style_tags: string[]
  occasion_tags: string[]
  period: string
  occasion: string | null
  why: string | null
  pieces: string[]
  notes: string | null
  created_at: string
}

export type OutfitHistory = {
  id: string
  user_id: string
  outfit_id: string | null
  worn_at: string
  occasion: string | null
  created_at: string
}

export type WishlistItem = {
  id: string
  user_id: string
  category: string
  name: string
  color: string | null
  reason: string | null
  priority: 'high' | 'medium' | 'low'
  purchased: boolean
  created_at: string
}