import { CastEnumSchema } from '../models/castEnum.model'

export interface Movie {
  _id: string
  admin_id: string
  title: string
  type: string
  description: string
  pg: string
  genre: any[]
  category: any[]
  cast: CastEnumSchema[]
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

export interface Resolution {
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
  averageRating: number
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
