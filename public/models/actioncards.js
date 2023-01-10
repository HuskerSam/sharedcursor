import U3D from '/models/utility3d.js';

export default class ActionCards {
  constructor(app, panel) {
    this.app = app;
    this.cardPanel = panel;
    this.cardPositions = [];
    this.cardWidth = 10;
    this.cardHeight = 7;

    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      let cardHolder = new BABYLON.TransformNode('playercardholder' + cardIndex, this.app.scene);
      cardHolder.parent = this.cardPanel;
      let x = -16;
      let y = 5.25;
      let z = 0;
      if (cardIndex % 2 === 1)
        x += this.cardWidth + 0.5;
      if (cardIndex > 1)
        y += this.cardHeight + 0.5;
      cardHolder.position = U3D.v(x, y, z);

      this.cardPositions.push(cardHolder);

      let localIndex = cardIndex;
      cardHolder.playButton = this.app.menuTab3D.addActionPanelButton('/fontcons/action.png', "Select Card",
        () => this.app.playCard(localIndex));
      cardHolder.playButton.scaling = U3D.v(0.5);
      cardHolder.playButton.position = U3D.v(this.cardWidth / 2 - 1.25, 0.8, 0);
      cardHolder.playButton.parent = cardHolder;
      cardHolder.playButton.setEnabled(false);

      cardHolder.discardButton = this.app.menuTab3D.addActionPanelButton('/fontcons/discard.png', "Recycle Card",
        () => this.app.discardCard(localIndex));
      cardHolder.discardButton.scaling = U3D.v(0.5);
      cardHolder.discardButton.position = U3D.v(this.cardWidth / 2 - 1.25, -0.8, 0);
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
      U3D.sizeNodeToFit(mesh, 4);
      mesh.parent = cardHolder.cardAssetHolder;
      mesh.isPickable = false;
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
