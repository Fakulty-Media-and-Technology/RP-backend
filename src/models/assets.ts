export const ratingsParent = ['vod', 'episode'] as const
export const assets = [...ratingsParent, 'live'] as const
export const commentsParent = [...ratingsParent, 'live', 'season'] as const
export const viewContents = [...assets, 'trailer'] as const

export const videoUploadParents = [
  'vod',
  'vod-trailer',
  'episode',
  'episode-trailer',
  'live',
  // 'trailer', // schedule for deletion
  'subtitle',
  'ad',
] as const
