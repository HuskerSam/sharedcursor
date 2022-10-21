const firebaseAdmin = require('firebase-admin');
const fetch = require('cross-fetch');
const baseClass = require('./baseclass.js');
const gameAPI = require('./gameapi.js');

module.exports = class MatchAPI {
  static _matchedPairCount(gameData) {
    let cnt = 0;
    for (let index = 0; index < gameData.cardCount; index++)
      if (gameData.cardIndexesRemoved[index])
        cnt++;

    return cnt / 2;
  }
  static _updatePoints(gameData, updatePacket, newMatch) {
    let seatIndex = gameData.currentSeat.toString();
    let currentPts = gameData['seatPoints' + seatIndex];

    let pts = 0;
    if (newMatch) {
      updatePacket.pairsInARowMatched = gameData.pairsInARowMatched + 1;

      if (gameData.scoringSystem === 'simple')
        pts = 1;
      else if (gameData.scoringSystem === 'stable')
        pts = 2;
      else if (gameData.scoringSystem === 'regular') {
        pts = 2;
        let matchedPairs = MatchAPI._matchedPairCount(gameData);

        if (matchedPairs === 0)
          pts = 5;
        if (updatePacket.pairsInARowMatched * 2 > pts)
          pts = updatePacket.pairsInARowMatched * 2;
      }
      updatePacket.previousMatch = true;
    }

    let newShows = 0;
    if (updatePacket.previousCard0 !== undefined && updatePacket.previousCard0 !== null)
      if (!gameData.cardIndexesShown[updatePacket.previousCard0])
        newShows++;

    if (updatePacket.previousCard1 !== undefined && updatePacket.previousCard1 !== null)
      if (!gameData.cardIndexesShown[updatePacket.previousCard1])
        newShows++;

    if (gameData.scoringSystem === 'simple')
      newShows = 0;

    updatePacket['seatPoints' + seatIndex] = currentPts + pts + newShows;

    let winningSeatIndex = 0;
    let winningPointsTotal = 0;
    for (let c = 0; c < gameData.runningNumberOfSeats; c++) {
      let pts = gameData['seatPoints' + c];
      if (c.toString() === seatIndex)
        pts = updatePacket['seatPoints' + c];

      if (winningPointsTotal <= pts) {
        winningPointsTotal = pts;
        winningSeatIndex = c;
      }
    }

    updatePacket['winningSeatIndex'] = winningSeatIndex;
    updatePacket['winningPointsTotal'] = winningPointsTotal;
  }

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
    if (action === 'sendSelection') {
      if (!currentPlayer)
        throw new Error("Must be current player");

      if (gameData.turnPhase === 'select') {
        if (gameData.previousCard0 === card1)
          throw new Error("Can't select same card twice");

        if (gameData.previousCard0 < 0)
          throw new Error("no first card selected");


        let card0Value = gameData.cardIndexOrder[gameData.previousCard0];
        let card1Value = gameData.cardIndexOrder[card1];

        let deckIndex0 = card0Value % (gameData.cardCount / 2);
        let deckIndex1 = card1Value % (gameData.cardCount / 2);

        updatePacket.selectionMatched = (deckIndex0 === deckIndex1);
        updatePacket.previousCard1 = card1;
        if (updatePacket.selectionMatched) {
          updatePacket.lastMatchIndex = deckIndex0;
        }

        MatchAPI._updatePoints(gameData, updatePacket, updatePacket.selectionMatched);

        updatePacket.cardIndexesShown = {};
        updatePacket.cardIndexesShown = {
          [updatePacket.previousCard1]: true
        };

        updatePacket.turnPhase = 'result';
      } else
        throw new Error('Turn Phase is not in select');
    }
    if (action === 'endTurn') {
      if (!currentPlayer)
        throw new Error("Must be current player");

      if (gameData.turnPhase === 'result') {
        updatePacket.turnPhase = 'clearprevious';
        if (!gameData.turnNumber)
          gameData.turnNumber = 0;
        if (!gameData.previousMatch) {
          updatePacket.turnNumber = gameData.turnNumber + 1;
          updatePacket.pairsInARowMatched = 0;
        } else {
          updatePacket.cardIndexesRemoved = {
            [gameData.previousCard0]: true,
            [gameData.previousCard1]: true
          };

          let matchedPairs = MatchAPI._matchedPairCount(gameData) + 1;
          updatePacket.turnNumber = gameData.turnNumber;
          updatePacket.previousMatch = false;
          if (matchedPairs === gameData.cardCount / 2) {
            updatePacket.mode = 'end';
            updatePacket.gameFinished = true;
          }
        }

        updatePacket.currentSeat = updatePacket.turnNumber % gameData.runningNumberOfSeats;

        let nextUser = gameData['seat' + updatePacket.currentSeat];
        if (nextUser) {
          if (!updatePacket.members)
            updatePacket.members = {};
          updatePacket.members[nextUser] = new Date().toISOString();
        }
      } else
        throw new Error('Turn Phase is not in result');
    }
    if (action === 'updateSelection') {
      if (!currentPlayer)
        throw new Error("Must be current player");

      if (gameData.turnPhase === 'select') {
        updatePacket.previousCard0 = card0;
        MatchAPI._updatePoints(gameData, updatePacket, false);

        updatePacket.cardIndexesShown = {};
        updatePacket.cardIndexesShown = {
          [updatePacket.previousCard0]: true
        };

      } else
        throw new Error('Turn Phase is not in select');
    }
    if (action === 'clearSelection') {
      if (!currentPlayer)
        throw new Error("Must be current player");

      if (gameData.turnPhase === 'clearprevious') {
        updatePacket.turnPhase = 'select';
        updatePacket.previousCard0 = -1;
        updatePacket.previousCard1 = -1;
        updatePacket.selectionMatched = false;
      } else
        throw new Error('Turn Phase is not in clear previous');
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
      await firebaseAdmin.firestore().runTransaction(async (transaction) => {
        const sfDoc = await transaction.get(gQuery);
        if (!sfDoc.exists) {
          throw new Error("Game does not exist");
        }
        let gameData = sfDoc.data();

        let updatePacket = await MatchAPI._processUserAction(gameData, uid, localInstance, action, card0, card1);

        if (Object.keys(updatePacket).length > 0) {
          updatePacket.lastActivity = new Date().toISOString();
          if (!updatePacket.members)
            updatePacket.members = {};
          updatePacket.members[uid] = new Date().toISOString();

          transaction.set(gQuery, updatePacket, {
            merge: true
          });
        }
      });
    } catch (e) {
      console.log("Transaction failed: ", e);
      return baseClass.respondError(res, e.message);
    }

    return res.status(200).send({
      success: true
    })
  }
};
