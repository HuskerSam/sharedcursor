import U3D from '/models/utility3d.js';

export default class ActionCards {
  constructor(app, panel) {
    this.app = app;
    this.cardPanel = panel;
    this.cardPositions = [];
    this.cardWidth = 8;
    this.cardHeight = 6.25;

    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      let cardHolder = new BABYLON.TransformNode('playercardholder' + cardIndex, this.app.scene);
      cardHolder.parent = this.cardPanel;
      let x = -14;
      let y = 5.25;
      let z = 0;
      if (cardIndex % 2 === 1)
        x += this.cardWidth + 0.1;
      if (cardIndex > 1)
        y += this.cardHeight + 0.25;
      cardHolder.position = U3D.v(x, y, z);

      this.cardPositions.push(cardHolder);

      let localIndex = cardIndex;
      cardHolder.playButton = this.app.menuTab3D.addActionPanelButton('/fontcons/action.png', "Play Card",
        () => this.app.playCard(localIndex));
      cardHolder.playButton.scaling = U3D.v(0.5);
      cardHolder.playButton.position = U3D.v(-1.5, 1.5, 0);
      cardHolder.playButton.parent = cardHolder;
      cardHolder.playButton.setEnabled(false);

      cardHolder.discardButton = this.app.menuTab3D.addActionPanelButton('/fontcons/discard.png', "Discard",
        () => this.app.discardCard(localIndex));
      cardHolder.discardButton.scaling = U3D.v(0.5);
      cardHolder.discardButton.position = U3D.v(-1.5, -0.5, 0);
      cardHolder.discardButton.parent = cardHolder;
      cardHolder.discardButton.setEnabled(false);

      let plane = BABYLON.MeshBuilder.CreatePlane("random", {
        height: 5,
        width: 3
      }, this.app.scene);
      plane.position = U3D.v(this.cardWidth / 2 - 3, this.cardHeight / 2 - 3, 1.75);
      plane.material = this.app.menuTab3D.playerCardbackMaterial;
      plane.isPickable = false;
      plane.parent = cardHolder;
    }

    this.updateCardsForPlayer();
  }
  updateCardsForPlayer() {
    let actionCards = this.app.actionCards;
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      this.renderPlayerCard(cardIndex);
    }
  }
  renderPlayerCard(rawCardIndex) {
    let cardHolder = this.cardPositions[rawCardIndex];
    let cardIndex = rawCardIndex;

    if (cardHolder.cachedIndex !== cardIndex) {
      cardHolder.cachedIndex = cardIndex;
      if (cardHolder.assetMesh)
        cardHolder.assetMesh.dispose(false, true);

      let cardMeta = this.app.actionCards[cardIndex];
      let meta = window.allStaticAssetMeta[cardMeta.gameCard];
      let mesh = this.app.staticBoardObjects[cardMeta.gameCard].baseMesh.clone();
      mesh.setEnabled(true);
      U3D.sizeNodeToFit(mesh, 3);
      mesh.parent = cardHolder;
      mesh.position = U3D.v(this.cardWidth / 2 - 3, this.cardHeight / 2 - 2.75, -1.5);
      mesh.isPickable = false;
      cardHolder.assetMesh = mesh;

      if (cardHolder.assetName)
        cardHolder.assetName.dispose(false, true);
      cardHolder.assetName = U3D.addTextPlane(this.app.scene, meta.shortDescription, U3D.color("1,1,1"));
      cardHolder.assetName.position = U3D.v(0, -this.cardHeight / 2 + 0.25, 0);
      cardHolder.assetName.scaling = U3D.v(1.25);
      cardHolder.assetName.parent = cardHolder;
    }

    let types = ['planet', 'moon', 'dwarf', 'nearearth']
    if (types.indexOf(this.app.selectedAsset.objectType) !== -1) {
      cardHolder.playButton.setEnabled(true);
    } else {
      cardHolder.playButton.setEnabled(false);
    }

    cardHolder.discardButton.setEnabled(true);
  }
}
