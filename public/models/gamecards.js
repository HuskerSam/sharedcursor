export default class GameCards {
  static getCardDeck(cardDeck) {
    if (cardDeck === 'solarsystem')
      return window.solarsystemCardDeck;
    if (cardDeck === 'moons1')
      return window.moons1CardDeck;
    if (cardDeck === 'moons2')
      return window.moons2CardDeck;
    if (cardDeck === 'mascots')
      return window.mascotsCardDeck;

    return window.solarsystemCardDeck;
  }
  static getCardMeta(cardIndex, gameData) {
    cardIndex = cardIndex % (gameData.cardCount / 2);
    cardIndex = gameData.cardRandomIndex[cardIndex];

    let meta = GameCards.getCardDeck(gameData.cardDeck)[cardIndex];

    if (!meta)
      meta = {};

    return meta;
  }
  static async loadDecks() {
    await Promise.all([
      await GameCards.readJSONFile(`/match/solarsystemdeck.json`, 'solarsystemCardDeck'),
      await GameCards.readJSONFile(`/match/moons1deck.json`, 'moons1CardDeck'),
      await GameCards.readJSONFile(`/match/moons2deck.json`, 'moons2CardDeck'),
      await GameCards.readJSONFile(`/match/mascotsdeck.json`, 'mascotsCardDeck')
    ]);

    let allCards = {};
    let deck = GameCards.getCardDeck('soloarsystem');
    deck.forEach(card => allCards[card.id] = card);

    deck = GameCards.getCardDeck('moons1');
    deck.forEach(card => allCards[card.id] = card);

    deck = GameCards.getCardDeck('moons2');
    deck.forEach(card => allCards[card.id] = card);

    deck = GameCards.getCardDeck('mascots');
    deck.forEach(card => allCards[card.id] = card);

    return allCards;
  }
  static async readJSONFile(path, varName) {
    if (window[varName]) return;

    try {
      let response = await fetch(path);
      window[varName] = await response.json();
    } catch (e) {
      console.log('ERROR with download of ' + varName, e);
      window[varName] = {};
    }
  }
  static _cardFilling(meta, includeWrapper = false) {
    let invert = meta.invert ? ' invert' : '';

    let symbol = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.symbol) + '?alt=media';
    let image = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.image) + '?alt=media';

    let guts = `<div style="flex:1"></div><div class="header${invert}">
      <img class="symbol" src="${symbol}">
      <div class="name">${meta.name}</div>
    </div>
    <div style="flex:1"></div>
    <div class="image" style="background-image:url(${image});"></div>
    <div style="flex:1"></div>
    `;

    if (includeWrapper)
      return `<span class="card_inner">${guts}</span>`;
    return guts;
  }
  static getCardInfo(cardIndex, gameData) {
    let orderIndex = gameData.cardIndexOrder[cardIndex];
    let meta = GameCards.getCardMeta(orderIndex, gameData);

    let image = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.image) + '?alt=media';

    return {
      boardPositionIndex: cardIndex,
      orderIndex,
      meta,
      image
    };
  }
  static _addFreeOrbitWrapper(targetNode, meta, name, parent, scene) {
    let orbitTransformNode = new BABYLON.TransformNode('orbitassetwrapper' + name, scene);
    targetNode.parent = orbitTransformNode;

    targetNode.position.z = meta.orbitRadius;
    if (meta.orbitRadiusX)
      targetNode.position.x = meta.orbitRadiusX;

    if (meta.binaryOrbit) {
      let binaryOrbitTransformNode = new BABYLON.TransformNode('binaryassetwrapper' + name, scene);
      binaryOrbitTransformNode.parent = orbitTransformNode.parent;
      orbitTransformNode.parent = binaryOrbitTransformNode;

      let binaryAnimation = new BABYLON.Animation(
        "staticorbitmeshrotationbinary" + name,
        "position",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      let x = binaryOrbitTransformNode.position.x;
      let y = binaryOrbitTransformNode.position.y;
      let z = binaryOrbitTransformNode.position.z;
      let binarykeys = [];
      let endFrame = 5 * 30;
      binarykeys.push({
        frame: 0,
        value: new BABYLON.Vector3(x, y, z)
      });
      binarykeys.push({
        frame: 60,
        value: new BABYLON.Vector3(x - 0.5, y, z - 0.5)
      });
      binarykeys.push({
        frame: 120,
        value: new BABYLON.Vector3(x + 0.5, y, z + 0.5)
      });
      binarykeys.push({
        frame: 149,
        value: new BABYLON.Vector3(x, y, z)
      });

      binaryAnimation.setKeys(binarykeys);
      if (!binaryOrbitTransformNode.animations)
        binaryOrbitTransformNode.animations = [];
      binaryOrbitTransformNode.animations.push(binaryAnimation);
      targetNode.binaryAnimation = scene.beginAnimation(binaryOrbitTransformNode, 0, endFrame, true);
    }

    targetNode.position.x = 0;
    targetNode.position.y = 0;

    orbitTransformNode.position.x = meta.x;
    orbitTransformNode.position.y = meta.y;
    orbitTransformNode.position.z = meta.z;

    if (meta.rx !== undefined)
      parent.rotation.x = meta.rx;
    if (meta.ry !== undefined)
      parent.rotation.y = meta.ry;
    if (meta.rz !== undefined)
      parent.rotation.z = meta.rz;

    let orbitAnimation = new BABYLON.Animation(
      "staticorbitmeshrotation" + name,
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    //At the animation key 0, the value of scaling is "1"
    let x = targetNode.rotation.x;
    let y = targetNode.rotation.y;
    let z = targetNode.rotation.z;
    let orbitkeys = [];
    let endFrame = meta.spintime / 1000 * 30;

    orbitkeys.push({
      frame: 0,
      value: new BABYLON.Vector3(x, y, z)
    });

    let factor = -2;
    if (meta.spindirection === -1)
      factor = 2;

    orbitkeys.push({
      frame: endFrame,
      value: new BABYLON.Vector3(x, y + factor * Math.PI, z)
    });

    orbitAnimation.setKeys(orbitkeys);
    if (!orbitTransformNode.animations)
      orbitTransformNode.animations = [];
    orbitTransformNode.animations.push(orbitAnimation);

    targetNode.spinAnimation = scene.beginAnimation(orbitTransformNode, 0, endFrame, true);

    if (meta.startRatio !== undefined)
      targetNode.spinAnimation.goToFrame(Math.floor(endFrame * meta.startRatio));

    if (meta.noDaySpin) {
      orbitTransformNode.appClickable = true;
      orbitTransformNode.masterid = name;
      orbitTransformNode.clickToPause = true;
      orbitTransformNode.clickCommand = 'pauseSpin';
      orbitTransformNode.spinAnimation = targetNode.spinAnimation;
    }

    return orbitTransformNode;
  }
}
