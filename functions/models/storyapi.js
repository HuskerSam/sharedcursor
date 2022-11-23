const firebaseAdmin = require('firebase-admin');
const fetch = require('cross-fetch');
const baseClass = require('./baseclass.js');
const gameAPI = require('./gameapi.js');

module.exports = class StoryAPI {
  static async _processUserAction(gameData, uid, localInstance, action, card0, card1) {
    let isOwner = (uid === gameData.createUser);
    let currentUser = gameData['seat' + gameData.currentSeat];
    let currentPlayer = (uid === currentUser);

    let updatePacket = {};
    if (action === 'startGame') {
      if (!isOwner)
        throw new Error("Must own game to start");

      if (gameAPI._emptySeat(gameData))
        throw new Error("Can't start with empty seats");

      let cardCount = gameData.numberOfSeats < 3 ? 16 : 24;
      let cardIndexOrder = gameAPI._shuffleNumberArray(cardCount);
      updatePacket.cardRandomIndex = gameAPI._shuffleNumberArray(12).splice(0, cardCount / 2);
      updatePacket.cardIndexOrder = cardIndexOrder;

      updatePacket.mode = 'running';
      updatePacket.cardIndexesShown = {};
      updatePacket.seat0Totals = {};
      updatePacket.seat1Totals = {};
      updatePacket.seat2Totals = {};
      updatePacket.seat3Totals = {};
      updatePacket.seatPoints0 = 0;
      updatePacket.seatPoints1 = 0;
      updatePacket.seatPoints2 = 0;
      updatePacket.seatPoints3 = 0;
      updatePacket.pairsInARowMatched = 0;
      updatePacket.cardIndexesRemoved = {};
      updatePacket.gameFinished = false;
      updatePacket.previousCard0 = -1;
      updatePacket.previousCard1 = -1;
      updatePacket.previousMatch = false;
      updatePacket.cardCount = cardCount;
      updatePacket.turnNumber = 0;
      updatePacket.currentSeat = 0;
      updatePacket.turnPhase = 'select'; // result, clearprevious
      updatePacket.runningNumberOfSeats = gameData.numberOfSeats;
      updatePacket.selectionMatched = false;

      for (let c = 0; c < cardCount; c++) {
        updatePacket.cardIndexesShown[c.toString()] = false;
        updatePacket.cardIndexesRemoved[c.toString()] = false;
      }
    }
    if (action === 'endGame') {
      if (!isOwner)
        throw new Error("Must own game to end");

      updatePacket.mode = 'end';
    }
    if (action === 'resetGame') {
      if (!isOwner)
        throw new Error("Must own game to reset");

      updatePacket.mode = 'ready';
    }
    if (action === 'endTurn') {
      if (!currentPlayer && !isOwner)
        throw new Error("Must be current player or game owner");

      updatePacket.turnNumber = gameData.turnNumber + 1;
      updatePacket.turnPhase = 'select';
      updatePacket.currentSeat = updatePacket.turnNumber % gameData.runningNumberOfSeats;

      let nextUser = gameData['seat' + updatePacket.currentSeat];
      if (nextUser) {
        if (!updatePacket.members)
          updatePacket.members = {};
        updatePacket.members[nextUser] = new Date().toISOString();
      }
    }

    return updatePacket;
  }
  static async userAction(req, res) {
    let authResults = await baseClass.validateCredentials(req.headers.token);
    if (!authResults.success)
      return baseClass.respondError(res, authResults.errorMessage);

    let uid = authResults.uid;

    let localInstance = baseClass.newLocalInstance();
    await localInstance.init();

    let gameId = req.body.gameId;
    let action = req.body.action;
    let card0 = req.body.previousCard0;
    let card1 = req.body.previousCard1;

    try {
      let gQuery = await firebaseAdmin.firestore().doc(`Games/${gameId}`);
      let uidPacket = null;
      let uidWinner = null;

      await firebaseAdmin.firestore().runTransaction(async (transaction) => {
        const sfDoc = await transaction.get(gQuery);
        if (!sfDoc.exists) {
          throw new Error("Game does not exist");
        }
        let gameData = sfDoc.data();

        let updatePacket = await StoryAPI._processUserAction(gameData, uid, localInstance, action, card0, card1);

        if (Object.keys(updatePacket).length > 0) {
          updatePacket.lastActivity = new Date().toISOString();
          if (!updatePacket.members)
            updatePacket.members = {};
          updatePacket.members[uid] = new Date().toISOString();

          transaction.set(gQuery, updatePacket, {
            merge: true
          });
        }

        if (updatePacket.gameFinished && gameData.winningSeatIndex >= 0) {
          let cardIndex = gameData.lastMatchIndex % (gameData.cardCount / 2);
          cardIndex = gameData.cardRandomIndex[cardIndex];
          let cardDeck = gameData.cardDeck;
          if (!cardDeck)
            cardDeck = 'solarsystem';
          uidPacket = {
            matchedCards: {
              [cardDeck]: {
                [cardIndex]: new Date().toISOString()
              }
            }
          };
          uidWinner = gameData['seat' + gameData.winningSeatIndex];
        }
      });

      if (uidWinner && uidPacket) {
        await firebaseAdmin.firestore().doc(`Users/${uidWinner}`).set(uidPacket, {
          merge: true
        });
      }
    } catch (e) {
      console.log("Transaction failed: ", e);
      return baseClass.respondError(res, e.message);
    }

    return res.status(200).send({
      success: true
    })
  }
};
