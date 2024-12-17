import fs from 'node:fs'
import path from 'node:path'
import admin from 'firebase-admin'

const serviceAccountJSON = fs.readFileSync(path.resolve('src', 'reeplay-4a7cd-05669a07cbd9.json'), {
  encoding: 'utf-8',
})

console.log('Loaded firebase service account successfully ✔✔✔✔')

const credential = admin.credential.cert(JSON.stringify(serviceAccountJSON))

admin.initializeApp({ credential })

console.log('Initialize firebase Admin successfully ✔✔✔✔')

export default admin
