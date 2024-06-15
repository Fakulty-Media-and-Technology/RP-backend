var admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");

var serviceAccount = require("../utils/aady-push-firebase-adminsdk-gu1c3-3ca0f82cbc.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

async function getAccessToken() {
    const auth = new GoogleAuth({
        credentials: serviceAccount,
        scopes: SCOPES,
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
}

// Example usage
getAccessToken()
    .then((token) => {
        console.log("Access Token:", token);
    })
    .catch((err) => {
        console.error("Error getting access token:", err);
    });

//node src/firebase/firebase.js
