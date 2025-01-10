export const ratingsParent = ['vod', 'episode'] as const
export const assets = [...ratingsParent, 'live'] as const
export const videoUploadParents = [...assets, 'trailer'] as const
