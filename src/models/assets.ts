export const ratingsParent = ['vod', 'episode'] as const
export const assets = [...ratingsParent, 'live'] as const
export const viewContents = [...assets, 'trailer'] as const
export const videoUploadParents = [...viewContents, 'subtitle'] as const



