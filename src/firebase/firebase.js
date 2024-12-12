var admin = require('firebase-admin')

var serviceAccount = require('../reeplay-4a7cd-05669a07cbd9.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

module.exports = admin
