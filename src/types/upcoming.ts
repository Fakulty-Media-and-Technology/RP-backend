export interface UpcomingAggrRes {
  _id: string
  title: string
  type: string
  details: string
  reminder: any[]
  releaseDate: string
  active: boolean
  createdAt: string
  updatedAt: string
  trailerVideoUpload: TrailerVideoUpload
  landscapePhoto: LandscapePhoto
  portraitPhoto: LandscapePhoto
}

interface LandscapePhoto {
  _id: string
  bucket: string
  key: string
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
