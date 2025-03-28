export interface LiveAggrRes {
  _id: string
  title: string
  streamKey: string
  location: string
  vid_class: string
  pg: string
  description: string
  active: boolean
  expired: boolean
  type: string
  start: string
  expiry: Date
  views: any[]
  sponsored: boolean
  popular: boolean
  featured: boolean
  coverPhoto: PreviewPhoto
  channelLogo: PreviewPhoto | null
  previewVideoUploadDoc?: PreviewVideoUpload
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
