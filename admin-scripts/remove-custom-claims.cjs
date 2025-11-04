#!/usr/bin/env node
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Uncomment the following to use with the emulator.
// process.env.FIREBASE_AUTH_EMULATOR_HOST = '192.168.1.168:9099';

/**
 * PARAMS */
if (process.argv.length < 3) {
	console.log('Usage: remove-custom-claims.cjs <uid>');
	process.exit(0);
}

const UID = process.argv[2];
const CUSTOM_CLAIMS_TO_REMOVE = [
	'isPremium', //
];

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

(async () => {
	try {
		const {customClaims} = await admin.auth().getUser(UID);

		CUSTOM_CLAIMS_TO_REMOVE.forEach((cc) => {
			delete customClaims[cc];
		});

		await admin.auth().setCustomUserClaims(UID, customClaims);
		console.log('Custom claims removed.');
	} catch (e) {
		console.log('User not found');
	}
})();
