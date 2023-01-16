import U3D from '/models/utility3d.js';

export default class ActionCards {
  constructor(app) {
    this.app = app;
    this.cardPanel = this.app.menuTab3D.cardsPanelTab;
    this.cardPositions = [];
    this.cardWidth = 14;
    this.cardHeight = 8;

    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      let cardHolder = new BABYLON.TransformNode('playercardholder' + cardIndex, this.app.scene);
      cardHolder.parent = this.cardPanel;
      let x = -this.cardWidth / 2 - 0.25;
      let y = this.cardHeight / 2 + 0.25;
      let z = 0;
      if (cardIndex % 2 === 1)
        x = this.cardWidth / 2 + 0.125;
      if (cardIndex > 1)
        y = this.cardHeight * 1.5 + 0.5;
      cardHolder.position = U3D.v(x, y - 2, z);

      this.cardPositions.push(cardHolder);

      cardHolder.playButton = this.app.menuTab3D.addActionPanelButton('/fontcons/action.png?cardindex=' + cardIndex, "Select Card",
        () => this.app.playCard(cardIndex), 2.25);
      cardHolder.playButton.position = U3D.v(this.cardWidth / 2 - 2, 1.4, 0);
      cardHolder.playButton.parent = cardHolder;
      cardHolder.playButton.setEnabled(false);

      cardHolder.discardButton = this.app.menuTab3D.addActionPanelButton('/fontcons/discard.png?cardindex=' + cardIndex, "Recycle Card",
        () => this.app.discardCard(cardIndex), 2.25);
      cardHolder.discardButton.position = U3D.v(this.cardWidth / 2 - 2, -1.4, 0);
      cardHolder.discardButton.parent = cardHolder;
      cardHolder.discardButton.setEnabled(false);

      let plane = BABYLON.MeshBuilder.CreatePlane("random", {
        height: this.cardHeight,
        width: this.cardWidth
      }, this.app.scene);
      plane.material = this.app.menuTab3D.playerCardHollowMaterial;
      plane.isPickable = false;
      plane.parent = cardHolder;

      cardHolder.cardAssetHolder = new BABYLON.TransformNode('cardAssetHolder' + cardIndex, this.app.scene);
      cardHolder.cardAssetHolder.parent = cardHolder;
      cardHolder.cardAssetHolder.position = U3D.v(-0.25, 0, 0);
      cardHolder.cardAssetHolder.rotation.z = Math.PI / 2;
    }
  }

  updateCardsForPlayer() {
    if (!this.app.boardRoundData)
      return;

    let actionCards = this.app.actionCards;
    let cardIndexes = this.getRoundCardsForPlayer();
    console.log(cardIndexes);
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      this.renderPlayerCard(cardIndex, cardIndexes[cardIndex]);
    }
  }
  getRoundCardsForPlayer() {
    let cardIndexes = Array(4).fill(-1);
    let seatIndex = this.app.activeSeatIndex;

    this.app.boardRoundData.actions.forEach(action => {
      if (action.action === 'cardUpdate' && action.seatIndex === seatIndex)
        cardIndexes[action.cardIndex] = action.cardId;
    });

    return cardIndexes;
  }

  renderPlayerCard(cardPositionIndex, cardId) {
    let cardHolder = this.cardPositions[cardPositionIndex];

    if (cardHolder.cachedIndex === cardId) return;

    cardHolder.cachedIndex = cardId;
    if (cardHolder.assetMesh) {
      cardHolder.assetMesh.dispose();
      cardHolder.assetMesh = null;
    }

    if (cardId === -1) return;

    let cardMeta = this.app.actionCards[cardId];
    let meta = this.app.allStaticAssetMeta[cardMeta.gameCard];
    let mesh = this.app.staticBoardObjects[cardMeta.gameCard].baseMesh.clone();
    mesh.setEnabled(true);
    U3D.sizeNodeToFit(mesh, 6);
    mesh.parent = cardHolder.cardAssetHolder;
    mesh.assetMeta = {
      activeSelectedObject: true,
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: () => this.app.menuTab3D.setSelectedAsset(meta)
    };
    cardHolder.assetMesh = mesh;

    if (cardHolder.assetName)
      cardHolder.assetName.dispose(false, true);
    cardHolder.assetName = U3D.addTextPlane(this.app.scene, meta.name, U3D.color("1,1,1"));
    cardHolder.assetName.position = U3D.v(0, -this.cardHeight / 2 + 0.75, 0);
    cardHolder.assetName.scaling = U3D.v(1);
    cardHolder.assetName.parent = cardHolder;

    if (cardHolder.assetDescription)
      cardHolder.assetDescription.dispose(false, true);
    cardHolder.assetDescription = U3D.addTextPlane(this.app.scene, meta.shortDescription, U3D.color("0.5,0.5,1"));
    cardHolder.assetDescription.position = U3D.v(0, this.cardHeight / 2 - 0.75, 0);
    cardHolder.assetDescription.scaling = U3D.v(1);
    cardHolder.assetDescription.parent = cardHolder;


    //let types = ['planet', 'moon', 'dwarf', 'nearearth']
    //if (types.indexOf(this.app.selectedAsset.objectType) !== -1) {
    cardHolder.playButton.setEnabled(true);
    //  } else {
    //    cardHolder.playButton.setEnabled(false);
    //    }

    cardHolder.discardButton.setEnabled(true);
  }
}
