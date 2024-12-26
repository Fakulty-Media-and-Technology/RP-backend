import path from 'node:path'
import admin from 'firebase-admin'

const credential = admin.credential.cert(path.resolve('src', 'reeplay-4a7cd-05669a07cbd9.json'))
console.log('Loaded firebase service account successfully ✔✔✔✔')

admin.initializeApp({ credential })
console.log('Initialize firebase Admin successfully ✔✔✔✔')

export default admin
