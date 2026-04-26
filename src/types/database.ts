export type Plan = 'free' | 'pro' | 'stylist'

export type Profile = {
  id: string
  name: string | null
  height: number | null
  weight: number | null
  style: string | null
  avatar_url: string | null
  plan: Plan
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
  brand: string | null
  photo_url: string | null
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