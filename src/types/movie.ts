export interface Movie {
  _id: string
  admin_id: string
  title: string
  type: string
  description: string
  pg: string
  genre: any[]
  category: any[]
  cast: any[]
  released_date: string
  expiry_date: string
  likes: any[]
  runtime: string
  featured: boolean
  videoLink: null | string
  trailerLink: null | string
  trailerVideoUpload: null | TrailerVideoUpload
  videoUpload: null | TrailerVideoUpload
  createdAt: string
  landscapePhoto: LandscapePhoto
  portraitPhoto: LandscapePhoto
  subtitle: null | LandscapePhoto
  vidClass: string
  defaultRating: number
  averageRating: number
  seasons: Season[]
}

interface TrailerVideoUpload {
  _id: string
  key: string
  isTranscoded: boolean
  resolutions: Resolution[]
}

interface Resolution {
  resolution: string
  key: string
}

interface LandscapePhoto {
  _id: string
  bucket: string
  key: string
  language?: string
}

export interface Season {
  _id: string
  admin: string
  video: string
  serial_number: number
  episodes: Episode[]
  landscapePhoto: LandscapePhoto
  portraitPhoto: LandscapePhoto
  trailerVideoUpload: TrailerVideoUpload
}

export interface Episode {
  _id: string
  admin: string
  season: string
  episodeNumber: number
  title: string
  description: string
  trailerLink: null | string
  videoLink: null | string
  videoUpload: null | TrailerVideoUpload
  trailerVideoUpload: null | TrailerVideoUpload
  createdAt: string
  updatedAt: string
  subtitle: null | Subtitle
  averageRating: number
}

interface Subtitle {
  _id: string
  key: string
  bucket: string
  language: string
}

interface LandscapePhoto {
  _id: string
  bucket: string
  key: string
}

export type GetVideoSourceParams = {
  trailerLink?: null | string
  videoLink?: null | string
  videoUpload?: null | TrailerVideoUpload
  trailerVideoUpload?: null | TrailerVideoUpload
}
