const firebaseAdmin = require('firebase-admin');
const fetch = require('cross-fetch');
const baseClass = require('./baseclass.js');
const textToSpeech = require('@google-cloud/text-to-speech');

module.exports = class GameAPI {
  static _defaultGame(uid) {
    return {
      createUser: uid,
      created: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      mode: 'ready', //running, end
      icon: '',
      image: '',
      background: '',
      color: '',
      turnNumber: 0,
      currentSeat: 0,
      playerTurn: 0,
      turnPhase: 'init',
      previousCard0: -1,
      previousCard1: -1,
      numberOfSeats: 2,
      runningNumberOfSeats: 2,
      cardDeck: 'solarsystem',
      visibility: 'private',
      messageLevel: 'seated',
      publicStatus: 'privateClosed',
      gameFinished: false,
      seat0: null,
      seat1: null,
      seat2: null,
      seat3: null,
      seat0Totals: {},
      seat1Totals: {},
      seat2Totals: {},
      seat3Totals: {},
      seatPoints0: 0,
      seatPoints1: 0,
      seatPoints2: 0,
      seatPoints3: 0,
      pairsInARowMatched: 0,
      scoringSystem: 'regular',
      seatsPerUser: 'one',
      cardsShown: {},
      members: {},
      memberNames: {},
      memberImages: {},
      memberAvatars: {},
      cardIndexOrder: [],
      sectors: [],
      solutionText: ''
    };
  }
  static async _getUniqueGameSlug(collection) {
    function getDigit() {
      let char = 'a';
      let charNum = Math.floor(Math.random() * 35);
      if (charNum < 10)
        char = charNum.toString();
      else
        char = String.fromCharCode(charNum - 10 + 'a'.charCodeAt(0));

      return char;
    }

    let slug = '';
    let numDigits = 5;
    for (let c = 0; c < numDigits; c++)
      slug += getDigit();

    let gameTest = await firebaseAdmin.firestore().doc(`${collection}/${slug}`).get();
    if (gameTest.data()) {
      console.log(slug, ' exists - recursion hit');
      return GameAPI._getUniqueGameSlug(collection);
    }

    return slug;
  }
  static async deleteCollection(db, collectionPath, batchSize) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
      GameAPI.deleteQueryBatch(db, query, resolve).catch(reject);
    });
  }
  static async deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
      // When there are no documents left, we are done
      resolve();
      return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
      GameAPI.deleteQueryBatch(db, query, resolve);
    });
  }
  static _shuffleNumberArray(length) {
    function _shuffleArray(array) {
      let currentIndex = array.length,
        randomIndex;
      while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex], array[currentIndex]
        ];
      }
      return array;
    }

    let cardIndexOrder = [];
    for (let c = 0; c < length; c++)
      cardIndexOrder.push(c);

    cardIndexOrder = _shuffleArray(cardIndexOrder);
    return cardIndexOrder;
  }

  static async create(req, res) {
    let authResults = await baseClass.validateCredentials(req.headers.token);
    if (!authResults.success)
      return baseClass.respondError(res, authResults.errorMessage);

    let uid = authResults.uid;

    let localInstance = baseClass.newLocalInstance();
    await localInstance.init();

    let userQ = await firebaseAdmin.firestore().doc(`Users/${uid}`).get();
    let profile = userQ.data();
    if (!profile) {
      return baseClass.respondError(res, 'User not found');
    }

    let game = GameAPI._defaultGame(uid);

    game.letters = '';
    game.numberOfSeats = 2;
    if (req.body.numberOfSeats)
      game.numberOfSeats = Number(req.body.numberOfSeats);
    game.gameType = 'guess';
    if (req.body.gameType)
      game.gameType = req.body.gameType;
    game.visibility = 'private';
    game.messageLevel = 'seated';
    if (req.body.messageLevel)
      game.messageLevel = req.body.messageLevel;
    if (req.body.visibility)
      game.visibility = req.body.visibility;
    if (req.body.scoringSystem)
      game.scoringSystem = req.body.scoringSystem;
    if (req.body.seatsPerUser)
      game.seatsPerUser = req.body.seatsPerUser;
    if (req.body.cardDeck)
      game.cardDeck = req.body.cardDeck;
    if (req.body.performanceFlags)
      game.performanceFlags = req.body.performanceFlags;

    let randomAve = Math.floor(Math.random() * 52);
    let randomSt = Math.floor(Math.random() * 52);
    let avePrefix = 'N ';
    let stPrefix = 'W ';
    if (randomAve > 25)
      avePrefix = 'S ';
    randomAve = randomAve % 26;
    randomSt = randomSt % 26;

    function ordinal_suffix_of(i) {
      let j = i % 10,
        k = i % 100;
      if (j === 1 && k !== 11) {
        return i + "st";
      }
      if (j === 2 && k !== 12) {
        return i + "nd";
      }
      if (j === 3 && k !== 13) {
        return i + "rd";
      }
      return i + "th";
    }

    randomAve++;

    randomAve = ordinal_suffix_of(randomAve) + ' Avenue'
    randomSt = String.fromCharCode("A".charCodeAt(0) + randomSt) + ' Street';

    let gameName = randomAve + ' and ' + randomSt;
    game.name = gameName;

    game.publicStatus = GameAPI._publicStatus(game);

    let gameNumber = await GameAPI._getUniqueGameSlug('Games');
    game.gameNumber = gameNumber;

    let displayName = baseClass.escapeHTML(profile.displayName);
    let displayImage = profile.displayImage;
    let displayAvatar = profile.displayAvatar;

    if (!displayName)
      displayName = 'Anonymous';
    if (!displayImage)
      displayImage = '';
    if (!displayAvatar)
      displayAvatar = '';

    game.members = {
      [uid]: new Date().toISOString()
    };
    game.memberNames = {
      [uid]: displayName
    };
    game.memberImages = {
      [uid]: displayImage
    };
    game.memberAvatars = {
      [uid]: displayAvatar
    };

    await firebaseAdmin.firestore().doc(`Games/${gameNumber}`).set(game);

    return res.status(200).send({
      success: true,
      game,
      gameNumber
    });
  }
  static async delete(req, res) {
    let authResults = await baseClass.validateCredentials(req.headers.token);
    if (!authResults.success)
      return baseClass.respondError(res, authResults.errorMessage);

    let uid = authResults.uid;

    let localInstance = baseClass.newLocalInstance();
    await localInstance.init();

    let gameNumber = req.body.gameNumber;

    let gameDataRef = firebaseAdmin.firestore().doc(`Games/${gameNumber}`);
    let gameDataQuery = await gameDataRef.get();
    let gameData = gameDataQuery.data();
    let success = false;
    if (gameData && gameData.createUser === uid) {
      await gameDataRef.delete();
      await GameAPI.deleteCollection(firebaseAdmin.firestore(), `Games/${gameNumber}/messages`, 50);
      await GameAPI.deleteCollection(firebaseAdmin.firestore(), `Games/${gameNumber}/rounds`, 50);
      success = true;
    }

    return res.status(200).send({
      success
    })
  }
  static async options(req, res) {
    let authResults = await baseClass.validateCredentials(req.headers.token);
    if (!authResults.success)
      return baseClass.respondError(res, authResults.errorMessage);

    let uid = authResults.uid;
    let gameNumber = req.body.gameNumber;

    let localInstance = baseClass.newLocalInstance();
    await localInstance.init();

    let gameQuery = await firebaseAdmin.firestore().doc(`Games/${gameNumber}`).get();
    let gameData = gameQuery.data();
    if (!gameData) {
      return baseClass.respondError(res, 'Game not found');
    }

    let userQ = await firebaseAdmin.firestore().doc(`Users/${uid}`).get();
    let profile = userQ.data();
    if (!profile) {
      return baseClass.respondError(res, 'User not found');
    }

    if (uid !== gameData.createUser) {
      return baseClass.respondError(res, 'User must be owner to set options');
    }

    let updatePacket = {};
    if (req.body.visibility) {
      let visibility = req.body.visibility;
      if (gameData.visbility !== visibility) {
        updatePacket.visibility = visibility;
        gameData.visbility = visibility;
      }
    }

    if (req.body.numberOfSeats) {
      let numberOfSeats = req.body.numberOfSeats;
      if (gameData.numberOfSeats !== numberOfSeats) {
        //clear out new seats
        for (let c = gameData.numberOfSeats; c < numberOfSeats; c++) {
          updatePacket['seat' + c.toString()] = null;
          gameData['seat' + c.toString()] = null;
        }
        updatePacket.numberOfSeats = numberOfSeats;
        gameData.numberOfSeats = numberOfSeats;
        if (gameData.mode !== 'running')
          gameData.runningNumberOfSeats = numberOfSeats;
      }
    }

    if (req.body.messageLevel) {
      let messageLevel = req.body.messageLevel;
      if (gameData.messageLevel !== messageLevel) {
        updatePacket.messageLevel = messageLevel;
        gameData.messageLevel = messageLevel;
      }
    }

    if (req.body.cardDeck) {
      let cardDeck = req.body.cardDeck;
      if (gameData.cardDeck !== cardDeck) {
        updatePacket.cardDeck = cardDeck;
        gameData.cardDeck = cardDeck;
      }
    }

    if (req.body.scoringSystem) {
      let scoringSystem = req.body.scoringSystem;
      if (gameData.scoringSystem !== scoringSystem) {
        updatePacket.scoringSystem = scoringSystem;
        gameData.scoringSystem = scoringSystem;
      }
    }

    if (req.body.seatsPerUser) {
      let seatsPerUser = req.body.seatsPerUser;
      if (gameData.seatsPerUser !== seatsPerUser) {
        updatePacket.seatsPerUser = seatsPerUser;
        gameData.seatsPerUser = seatsPerUser;
      }
    }

    updatePacket.publicStatus = GameAPI._publicStatus(gameData);

    await firebaseAdmin.firestore().doc(`Games/${gameNumber}`).set(updatePacket, {
      merge: true
    });

    return res.status(200).send({
      success: true
    });
  }
  //refreshes user display name, image and member: date
  static async join(req, res) {
    let authResults = await baseClass.validateCredentials(req.headers.token);
    if (!authResults.success)
      return baseClass.respondError(res, authResults.errorMessage);

    let uid = authResults.uid;
    let gameNumber = req.body.gameNumber;

    let localInstance = baseClass.newLocalInstance();
    await localInstance.init();

    let gameData = await firebaseAdmin.firestore().doc(`Games/${gameNumber}`).get();
    if (!gameData.data()) {
      return baseClass.respondError(res, 'Game not found');
    }

    let userQ = await firebaseAdmin.firestore().doc(`Users/${uid}`).get();
    let profile = userQ.data();
    if (!profile) {
      return baseClass.respondError(res, 'User not found');
    }

    let displayName = baseClass.escapeHTML(profile.displayName);
    let displayImage = profile.displayImage;
    let displayAvatar = profile.displayAvatar;

    if (!displayName)
      displayName = 'Anonymous';
    if (!displayImage)
      displayImage = '';
    if (!displayAvatar)
      displayAvatar = '';

    let updatePacket = {
      members: {
        [uid]: new Date().toISOString()
      },
      memberNames: {
        [uid]: displayName
      },
      memberImages: {
        [uid]: displayImage
      },
      memberAvatars: {
        [uid]: displayAvatar
      },
      lastActivity: new Date().toISOString()
    };

    await firebaseAdmin.firestore().doc(`Games/${gameNumber}`).set(updatePacket, {
      merge: true
    });

    return res.status(200).send({
      success: true
    });
  }
  static async leave(req, res) {
    let authResults = await baseClass.validateCredentials(req.headers.token);
    if (!authResults.success)
      return baseClass.respondError(res, authResults.errorMessage);

    let uid = authResults.uid;
    let gameNumber = req.body.gameNumber;

    let localInstance = baseClass.newLocalInstance();
    await localInstance.init();

    let gameData = await firebaseAdmin.firestore().doc(`Games/${gameNumber}`).get();
    if (!gameData.data()) {
      return baseClass.respondError(res, 'Game not found');
    }

    let game = gameData.data();
    if (uid === game.createUser)
      return baseClass.respondError(res, 'Owner has to stay in game');

    let updatePacket = {
      members: {
        [uid]: firebaseAdmin.firestore.FieldValue.delete()
      }
    };
    for (let c = 0, l = game.numberOfSeats; c < l; c++) {
      if (game['seat' + c.toString()] === uid)
        updatePacket['seat' + c.toString()] = null;
    }

    await firebaseAdmin.firestore().doc(`Games/${gameNumber}`).set(updatePacket, {
      merge: true
    });

    return res.status(200).send({
      success: true
    });
  }
  //transaction returns error if someone is sitting there already
  static async sit(req, res) {
    let authResults = await baseClass.validateCredentials(req.headers.token);
    if (!authResults.success)
      return baseClass.respondError(res, authResults.errorMessage);

    let uid = authResults.uid;

    let localInstance = baseClass.newLocalInstance();
    await localInstance.init();
    let gameNumber = req.body.gameNumber;
    let db = firebaseAdmin.firestore();

    try {
      let gQuery = await firebaseAdmin.firestore().doc(`Games/${gameNumber}`);
      await db.runTransaction(async (transaction) => {
        const sfDoc = await transaction.get(gQuery);
        if (!sfDoc.exists) {
          throw new Error("Game does not exist");
        }
        let gameData = sfDoc.data();

        let seatIndex = Number(req.body.seatIndex);
        if (isNaN(seatIndex) || seatIndex < 0 && seatIndex >= gameData.numberOfSeats)
          throw new Error('Seat index invalid');

        let seatKey = 'seat' + seatIndex.toString();
        if (gameData[seatKey]) {
          if (gameData[seatKey] === uid)
            throw new Error('already seated');

          throw new Error('someone else seated');
        } else {
          if (gameData.seatsPerUser === 'one') {
            for (let seatIndex = 0; seatIndex < gameData.numberOfSeats; seatIndex++)
              if (gameData['seat' + seatIndex.toString()] === uid)
                throw new Error('already seated in a different seat');
          }

          gameData[seatKey] = uid;
          let publicStatus = GameAPI._publicStatus(gameData);

          transaction.set(gQuery, {
            [seatKey]: uid,
            publicStatus,
            lastActivity: new Date().toISOString()
          }, {
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
    });
  }
  static async stand(req, res) {
    let authResults = await baseClass.validateCredentials(req.headers.token);
    if (!authResults.success)
      return baseClass.respondError(res, authResults.errorMessage);

    let uid = authResults.uid;

    let localInstance = baseClass.newLocalInstance();
    await localInstance.init();
    let gameNumber = req.body.gameNumber;
    let db = firebaseAdmin.firestore();

    try {
      let gQuery = await firebaseAdmin.firestore().doc(`Games/${gameNumber}`);
      await db.runTransaction(async (transaction) => {
        const sfDoc = await transaction.get(gQuery);
        if (!sfDoc.exists) {
          throw new Error("Game does not exist");
        }
        let gameData = sfDoc.data();

        let seatIndex = Number(req.body.seatIndex);
        if (isNaN(seatIndex) || seatIndex < 0 && seatIndex >= gameData.numberOfSeats)
          throw new Error('Seat index invalid');

        let seatKey = 'seat' + seatIndex.toString();
        if (gameData[seatKey]) {
          if (gameData[seatKey] !== uid && gameData.createUser !== uid)
            throw new Error('user not seated');

          gameData[seatKey] = null;
          let publicStatus = GameAPI._publicStatus(gameData);

          transaction.set(gQuery, {
            [seatKey]: null,
            publicStatus,
            lastActivity: new Date().toISOString()
          }, {
            merge: true
          });

        } else {
          throw new Error('no user seated');
        }
      });
    } catch (e) {
      console.log("Transaction failed: ", e);
      return baseClass.respondError(res, e.message);
    }

    return res.status(200).send({
      success: true
    });
  }

  static async positionSeat(req, res) {
    let authResults = await baseClass.validateCredentials(req.headers.token);
    if (!authResults.success)
      return baseClass.respondError(res, authResults.errorMessage);

    let uid = authResults.uid;

    let localInstance = baseClass.newLocalInstance();
    await localInstance.init();
    let gameNumber = req.body.gameNumber;
    let db = firebaseAdmin.firestore();

    let gQuery = await firebaseAdmin.firestore().doc(`Games/${gameNumber}`).get();
    let gameData = gQuery.data();

    let seatIndex = Number(req.body.seatIndex);
    if (isNaN(seatIndex) || seatIndex < 0 && seatIndex >= gameData.numberOfSeats)
      throw new Error('Seat index invalid');

    let seatKey = 'seat' + seatIndex.toString();
    if (gameData[seatKey] === uid || gameData.createUser === uid) {
      let updatePacket = {};
      updatePacket[seatKey + '_pos_x'] = req.body.x;
      updatePacket[seatKey + '_pos_y'] = req.body.y;
      updatePacket[seatKey + '_pos_z'] = req.body.z;
      updatePacket[seatKey + '_pos_d'] = new Date().toISOString();
      await firebaseAdmin.firestore().doc(`Games/${gameNumber}`).set(updatePacket, {
        merge: true
      });
    }

    return res.status(200).send({
      success: true
    });
  }

  static async message(req, res) {
    let authResults = await baseClass.validateCredentials(req.headers.token);
    if (!authResults.success)
      return baseClass.respondError(res, authResults.errorMessage);

    let uid = authResults.uid;
    let gameNumber = req.body.gameNumber;
    let message = baseClass.escapeHTML(req.body.message);
    if (message.length > 1000)
      message = message.substr(0, 1000);

    let localInstance = baseClass.newLocalInstance();
    await localInstance.init();

    let gameQuery = await firebaseAdmin.firestore().doc(`Games/${gameNumber}`).get();
    let gameData = gameQuery.data();
    if (!gameData) {
      return baseClass.respondError(res, 'Game not found');
    }

    let userQ = await firebaseAdmin.firestore().doc(`Users/${uid}`).get();
    let profile = userQ.data();
    if (!profile) {
      return baseClass.respondError(res, 'User not found');
    }

    let isOwner = uid === gameData.createUser;
    let isSeated = false;
    for (let c = 0; c < gameData.numberOfSeats; c++)
      if (gameData['seat' + c.toString()] === uid) {
        isSeated = true;
        break;
      }

    if (!isOwner) {
      if (gameData.messageLevel === 'seated') {
        if (!isSeated) {
          return baseClass.respondError(res, 'User needs to be seated to chat');
        }
      }

      if (!gameData.members[uid]) {
        return baseClass.respondError(res, 'User needs to be a game member to chat');
      }
    }
    let memberImage = gameData.memberImages[uid] ? gameData.memberImages[uid] : '';
    let memberName = gameData.memberNames[uid] ? gameData.memberNames[uid] : '';

    let messagePacket = {
      uid,
      message,
      created: new Date().toISOString(),
      messageType: 'user',
      gameNumber,
      isSeated,
      isOwner,
      memberName,
      memberImage
    };

    await firebaseAdmin.firestore().collection(`Games/${gameNumber}/messages`).add(messagePacket);

    return res.status(200).send({
      success: true
    });
  }
  static async messageDelete(req, res) {
    let authResults = await baseClass.validateCredentials(req.headers.token);
    if (!authResults.success)
      return baseClass.respondError(res, authResults.errorMessage);

    let uid = authResults.uid;

    let localInstance = baseClass.newLocalInstance();
    await localInstance.init();

    let gameNumber = req.body.gameNumber;
    let messageId = req.body.messageId;

    let gameDataRef = firebaseAdmin.firestore().doc(`Games/${gameNumber}`);
    let gameDataQuery = await gameDataRef.get();
    let gameData = gameDataQuery.data();

    if (!gameData)
      return baseClass.respondError(res, 'Game not found');

    let isGameOwner = (gameData.createUser === uid);

    let messageQuery = await firebaseAdmin.firestore().doc(`Games/${gameNumber}/messages/${messageId}`).get();
    let message = messageQuery.data();

    let isOwner = (message.uid === uid);
    if (!isOwner && !isGameOwner)
      return baseClass.respondError(res, "Must own game or message to delete");

    await firebaseAdmin.firestore().doc(`Games/${gameNumber}/messages/${messageId}`).delete();

    return res.status(200).send({
      success: true
    });
  }

  static _publicStatus(game) {
    let emptySeat = GameAPI._emptySeat(game) ? 'Open' : 'Full';
    return game.visibility + emptySeat;
  }
  static _emptySeat(game) {
    for (let c = 0; c < game.numberOfSeats; c++)
      if (game['seat' + c.toString()] === null)
        return true;
    return false;
  }

  static async updateUserMetaData(change, context) {
    let before = change.before.data();
    let after = change.after.data();
    if (!before)
      before = {};
    if (!after)
      return;

    let nameChange = (before.displayName !== after.displayName);
    let imageChange = (before.displayImage !== after.displayImage);
    let avatarChange = (before.displayAvatar !== after.displayAvatar);

    if (nameChange) {
      await GameAPI._updateMetaNameForUser(context.params.uid);
    }
    if (imageChange) {
      await GameAPI._updateMetaImageForUser(context.params.uid);
    }
    if (avatarChange) {
      await GameAPI._updateMetaAvatarForUser(context.params.uid);
    }
  }
  static async _updateMetaNameForUser(uid) {
    let freshUser = await firebaseAdmin.firestore().doc(`Users/${uid}`).get();

    let name = freshUser.data().displayName;
    if (!name)
      name = 'Anonymous';

    let gamesQuery = await firebaseAdmin.firestore().collection(`Games`)
      .where('members.' + uid, '>', '').get();

    let promises = [];
    gamesQuery.docs.forEach(doc => {
      promises.push(doc.ref.set({
        memberNames: {
          [uid]: name
        }
      }, {
        merge: true
      }));
    });

    await Promise.all(promises);

    let messagesQuery = await firebaseAdmin.firestore().collectionGroup(`messages`)
      .where('uid', '==', uid).get();
    let msgPromises = [];
    messagesQuery.docs.forEach(doc => {
      msgPromises.push(doc.ref.set({
        memberName: name
      }, {
        merge: true
      }));
    });

    await Promise.all(msgPromises);

    return;
  }
  static async _updateMetaImageForUser(uid) {
    let freshUser = await firebaseAdmin.firestore().doc(`Users/${uid}`).get();

    let image = freshUser.data().displayImage;
    if (!image)
      image = '/images/defaultprofile.png';

    let gamesQuery = await firebaseAdmin.firestore().collection(`Games`)
      .where('members.' + uid, '>', '').get();

    let promises = [];
    gamesQuery.docs.forEach(doc => {
      promises.push(doc.ref.set({
        memberImages: {
          [uid]: image
        }
      }, {
        merge: true
      }));
    });

    await Promise.all(promises);

    let messagesQuery = await firebaseAdmin.firestore().collectionGroup(`messages`)
      .where('uid', '==', uid).get();
    let msgPromises = [];
    messagesQuery.docs.forEach(doc => {
      msgPromises.push(doc.ref.set({
        memberImage: image
      }, {
        merge: true
      }));
    });

    await Promise.all(msgPromises);

    return;
  }
  static async _updateMetaAvatarForUser(uid) {
    let freshUser = await firebaseAdmin.firestore().doc(`Users/${uid}`).get();

    let avatar = freshUser.data().displayAvatar;
    if (!avatar)
      avatar = '';

    let gamesQuery = await firebaseAdmin.firestore().collection(`Games`)
      .where('members.' + uid, '>', '').get();

    let promises = [];
    gamesQuery.docs.forEach(doc => {
      promises.push(doc.ref.set({
        memberAvatars: {
          [uid]: avatar
        }
      }, {
        merge: true
      }));
    });

    await Promise.all(promises);

    return;
  }

  static async customAuthCode(req, res) {
    let authResults = await baseClass.validateCredentials(req.headers.token);
    if (!authResults.success)
      return baseClass.respondError(res, authResults.errorMessage);

    let uid = authResults.uid;

    let customToken = await firebaseAdmin.auth().createCustomToken(uid);

    let accessCode = await GameAPI._getUniqueGameSlug('AccessCodes');
    let data = {
      customToken,
      accessCode,
      created: new Date().toISOString()
    };
    await firebaseAdmin.firestore().doc(`AccessCodes/${accessCode}`).set(data);

    return res.status(200).send({
      success: true,
      data
    })
  }
  static async queryAuthCode(req, res) {
    let accessCode = req.body.accessCode;
    if (!accessCode)
      accessCode = 'invalidjunk';
    let query = await firebaseAdmin.firestore().doc(`AccessCodes/${accessCode}`).get();
    let data = query.data();
    let customToken = null;
    if (data)
      customToken = data.customToken;

    return res.status(200).send({
      customToken,
      success: true
    })
  }

  static async getTextWavPath(req, res) {
    const client = new textToSpeech.TextToSpeechClient();
    const text = req.body.text;
    let uniqueText = text.replace(/[^a-zA-Z0-9]/g, '');

    const bucket = firebaseAdmin.storage().bucket();
    let path = `speech/voice/${uniqueText}.mp3`;
    let file = bucket.file(path);

    let exists = await file.exists();
    if (!exists[0]) {
      const request = {
        input: {
          text: text
        },
        voice: {
          languageCode: 'en-US',
          ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
          audioEncoding: 'MP3'
        },
      };
      const [response] = await client.synthesizeSpeech(request);
      await file.save(response.audioContent);
    }

    return res.status(200).send({
      success: true,
      path
    });
  }
};
