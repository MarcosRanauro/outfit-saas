import type { Piece, PiecePhoto } from '@/types/app'

export type DisplayPhoto = Pick<PiecePhoto, 'id' | 'url' | 'is_cover' | 'is_studio' | 'sort_order'>

export function sortPiecePhotos(piece: Piece): DisplayPhoto[] {
  const photos = piece.piece_photos ?? []
  if (photos.length > 0) {
    return [...photos].sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1
      if (!a.is_cover && b.is_cover) return 1
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })
  }
  if (piece.photo_url) {
    return [{
      id: 'cover',
      url: piece.photo_url,
      is_cover: true,
      is_studio: false,
      sort_order: 0,
    }]
  }
  return []
}
