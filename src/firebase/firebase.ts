import path from 'node:path'
import admin from 'firebase-admin'

const credential = admin.credential.cert(path.resolve('fb-secret.json'))
admin.initializeApp({ credential })

export default admin
