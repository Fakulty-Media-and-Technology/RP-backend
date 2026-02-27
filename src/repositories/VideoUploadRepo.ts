import { VideoUpload, VideoUploadModel } from '../models/videoupload.model'
import { StringOrObjectId } from '../types'
import { OperationalError } from '../utils/OperationalError'
import { MaybeSession } from '../utils/mongoDbSessionRunner'

type UpdateWithParentInput = {
  id: string
  parentId: string
  parentType: VideoUpload['parentType']
  session: MaybeSession
}

export class VideoUploadRepo {
  static findByParentId = (parentId: StringOrObjectId) =>
    VideoUploadModel.findOne({
      parentId,
    })

  static updateWithParent = async (input: UpdateWithParentInput) => {
    const update = await VideoUploadModel.findOneAndUpdate(
      {
        _id: input.id,
        parentId: { $exists: false },
        parentType: { $exists: false },
      },
      {
        $set: {
          parentId: input.parentId,
          parentType: input.parentType,
        },
      },
      { session: input.session, new: true },
    )

    // E get y
    if (update == null) {
      throw new OperationalError(
        'invalid video_upload id or video upload is already assigned to a parent',
        400,
      )
    }

    return update
  }
}
