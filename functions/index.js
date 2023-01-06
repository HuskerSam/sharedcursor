const util = require('util');
const apiApp = require('express')();
const cors = require('cors');
const functions = require('firebase-functions');
const firebaseAdmin = require('firebase-admin');
const gameAPI = require('./models/gameapi.js');
const storyAPI = require('./models/storyapi.js');
const baseClass = require('./models/baseclass.js');

firebaseAdmin.initializeApp();

apiApp.use(cors({
  origin: true
}));

exports.api = functions.runWith({
  minInstances: 1
}).https.onRequest(apiApp);

exports.updateDisplayNames = functions.firestore
  .document('Users/{uid}').onWrite(async (change, context) => gameAPI.updateUserMetaData(change, context));

apiApp.post('/user/signallout', async (req, res) => {
  let authResults = await baseClass.validateCredentials(req.headers.token);
  if (!authResults.success)
    return baseClass.respondError(res, authResults.errorMessage);

  let uid = authResults.uid;
  let result = await firebaseAdmin.auth().revokeRefreshTokens(uid);
  console.log('result', result);

  let userRecord = await firebaseAdmin.auth().getUser(uid);
  let tokensRevoked = new Date(userRecord.tokensValidAfterTime).getTime() / 1000;

  return res.send({
    success: true,
    tokensRevoked
  });
});

apiApp.post('/games/create', async (req, res) => gameAPI.create(req, res));
apiApp.post('/games/join', async (req, res) => gameAPI.join(req, res));
apiApp.post('/games/leave', async (req, res) => gameAPI.leave(req, res));
apiApp.post('/games/sit', async (req, res) => gameAPI.sit(req, res));
apiApp.post('/games/stand', async (req, res) => gameAPI.stand(req, res));
apiApp.post('/games/delete', async (req, res) => gameAPI.delete(req, res));
apiApp.post('/games/options', async (req, res) => gameAPI.options(req, res));
apiApp.post('/games/message', async (req, res) => gameAPI.message(req, res));
apiApp.post('/games/message/delete', async (req, res) => gameAPI.messageDelete(req, res));
apiApp.post('/games/seat/position', async (req, res) => gameAPI.positionSeat(req, res));

apiApp.post('/games/texttospeech', async (req, res) => gameAPI.getTextWavPath(req, res));

apiApp.post('/user/auth/custom', async (req, res) => gameAPI.customAuthCode(req, res));
apiApp.post('/user/auth/query', async (req, res) => gameAPI.queryAuthCode(req, res));

apiApp.post('/story/action', async (req, res) => storyAPI.userAction(req, res));
