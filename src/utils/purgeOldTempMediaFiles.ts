import fs from 'node:fs'
import path from 'node:path'
import { Assets } from './Assets'

// npm install -S find-remove would be perfect but
// requires node 20.12... but current lts is 20.11...

export const deleteOldFile = async (absFilePath: string, timeAgoDiffMs = 900000) => {
  //15minutes
  const fileStat = await fs.promises.stat(absFilePath)

  if (Date.now() - fileStat.ctimeMs >= timeAgoDiffMs) {
    await fs.promises.unlink(absFilePath)
    console.log('func: deleteOldFile(..) deleted file:', absFilePath)
  }
}

export const purgeOldTempMediaFiles = async () => {
  const tempMediaDir = Assets.rootMediaDirs.multer
  try {
    const files = await fs.promises.readdir(tempMediaDir)

    const settled = await Promise.allSettled(
      files.map(file => deleteOldFile(path.join(tempMediaDir, file))),
    )

    settled.forEach(s => {
      if (s.status === 'rejected') {
        console.error('function: purgeOldTempMediaFiles', s.reason)
      }
    })
  } catch (e: any) {
    console.error('Error listing tempMedia files in function: purgeOldTempMediaFiles')
    console.error({
      errName: e.name,
      errMsg: e.message,
    })
  }
}
