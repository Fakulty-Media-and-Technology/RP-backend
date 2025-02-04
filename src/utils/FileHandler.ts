import fs from 'node:fs'

export class FileHandler {
  static createDirIfNotExistSync = (path: string) => {
    if (fs.existsSync(path)) {
      console.log(`dir: ${path} already exists`)
      return
    }

    fs.mkdirSync(path)
    console.log(`dir: ${path} created successfully`)
  }
}
