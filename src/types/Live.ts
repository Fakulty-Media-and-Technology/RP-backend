export interface LiveAggrRes {
  _id: string
  title: string
  stream_key: string
  location: string
  vid_class: string
  pg: string
  description: string
  active: boolean
  expired: boolean
  type: string
  start: string
  expiry: string
  views: any[]
  sponsored: boolean
  popular: boolean
  featured: boolean
  coverPhoto: PreviewPhoto
  previewVideoUpload?: PreviewVideoUpload
  createdAt: string
  updatedAt: string
  clientId: string
}

interface PreviewPhoto {
  _id: string
  bucket: string
  key: string
}

interface PreviewVideoUpload {
  _id: string
  key: string
  isTranscoded: boolean
  resolutions: Resolution[]
}

interface Resolution {
  resolution: string
  key: string
}
