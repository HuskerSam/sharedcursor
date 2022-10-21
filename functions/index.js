const util = require('util');
const apiApp = require('express')();
const cors = require('cors');
const functions = require('firebase-functions');
const firebaseAdmin = require('firebase-admin');

firebaseAdmin.initializeApp();

apiApp.use(cors({
  origin: true
}));

exports.api = functions.runWith({
  minInstances: 1
}).https.onRequest(apiApp);

exports.updateDisplayNames = functions.firestore
  .document('Users/{uid}').onWrite(async (change, context) => gameAPI.updateUserMetaData(change, context));

apiApp.post('/games/create', async (req, res) => gameAPI.create(req, res));
apiApp.post('/games/join', async (req, res) => gameAPI.join(req, res));
apiApp.post('/games/leave', async (req, res) => gameAPI.leave(req, res));
apiApp.post('/games/sit', async (req, res) => gameAPI.sit(req, res));
apiApp.post('/games/stand', async (req, res) => gameAPI.stand(req, res));
apiApp.post('/games/delete', async (req, res) => gameAPI.delete(req, res));
apiApp.post('/games/options', async (req, res) => gameAPI.options(req, res));
apiApp.post('/games/message', async (req, res) => gameAPI.message(req, res));
apiApp.post('/games/message/delete', async (req, res) => gameAPI.messageDelete(req, res));

apiApp.post('/match/action', async (req, res) => matchAPI.userAction(req, res));
