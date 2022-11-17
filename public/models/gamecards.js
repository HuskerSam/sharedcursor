export default class GameCards {
  static getCardDeck(cardDeck) {
    if (cardDeck === 'solarsystem')
      return window.solarsystemCardDeck;

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
    await GameCards.readJSONFile(`/match/solarsystemdeck.json`, 'solarsystemCardDeck');
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
    let guts = `<div style="flex:1"></div><div class="header${invert}">
      <img class="symbol" src="${meta.symbol}">
      <div class="name">${meta.name}</div>
    </div>
    <div style="flex:1"></div>
    <div class="image" style="background-image:url(${meta.image});"></div>
    <div style="flex:1"></div>
    `;

    if (includeWrapper)
      return `<span class="card_inner">${guts}</span>`;
    return guts;
  }
  static getCardInfo(cardIndex, gameData) {
    let orderIndex = gameData.cardIndexOrder[cardIndex];
    let meta = GameCards.getCardMeta(orderIndex, gameData);
    return {
      boardPositionIndex: cardIndex,
      orderIndex,
      meta,
      image: meta.image
    };
  }
}
