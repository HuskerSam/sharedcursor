import U3D from '/models/utility3d.js';

export default class ActionCards {
  constructor(app, panel) {
    this.app = app;
    this.cardPanel = panel;
    this.cardPositions = [];

    for (let cardIndex = 0; cardIndex < 6; cardIndex++) {
      let cardHolder = new BABYLON.TransformNode('playercardholder' + cardIndex, this.app.scene);
      cardHolder.parent = this.cardPanel;
      cardHolder.position.x = (cardIndex % 3) * -5 - 4;
      if (cardIndex > 2) {
        cardHolder.position.y = 8;
        cardHolder.position.z = 5;
      }

      this.cardPositions.push(cardHolder);

      let localIndex = cardIndex;
      let playActionCardBtn = U3D.addTextPlane(this.scene, 'Play', 'playActionCardBtn' + cardIndex);
      playActionCardBtn.position.x = -2;
      playActionCardBtn.position.y = 3;
      playActionCardBtn.position.z = -0.5;
      playActionCardBtn.parent = cardHolder;
      playActionCardBtn.assetMeta = {
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app.playCard(localIndex);
        }
      };
      cardHolder.playButton = playActionCardBtn;
      cardHolder.playButton.setEnabled(false);

      let discardActionCardBtn = U3D.addTextPlane(this.scene, 'Discard', 'discardActionCardBtn' + cardIndex, "Arial", "", "#000000", "transparent");
      discardActionCardBtn.position.x = 0;
      discardActionCardBtn.position.y = 3;
      discardActionCardBtn.position.z = -0.5;
      discardActionCardBtn.parent = cardHolder;
      discardActionCardBtn.assetMeta = {
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app.discardCard(localIndex);
        }
      };
      cardHolder.discardButton = discardActionCardBtn;
      cardHolder.discardButton.setEnabled(false);
    }

    this.updateCardsForPlayer();
  }
  async updateCardsForPlayer() {
    let actionCards = this.app.actionCards;

    let promises = [];
    for (let cardIndex = 0; cardIndex < 6; cardIndex++) {
      promises.push(this.renderPlayerCard(cardIndex));
    }

    await Promise.all(promises);
  }
  async renderPlayerCard(rawCardIndex) {
    let cardHolder = this.cardPositions[rawCardIndex];
    let cardIndex = rawCardIndex + 3;

    if (cardHolder.cachedIndex !== cardIndex) {
      cardHolder.cachedIndex = cardIndex;
      if (cardHolder.assetMesh)
        cardHolder.assetMesh.dispose();

      let cardMeta = this.app.actionCards[cardIndex];
      let meta = Object.assign({}, window.allStaticAssetMeta[cardMeta.gameCard]);
      meta.extended = U3D.processStaticAssetMeta(meta, {});
      let mesh = await U3D.loadStaticMesh(this.app.scene, meta.extended.glbPath);
      U3D.sizeNodeToFit(mesh, 4.5);

      let animDetails = U3D.selectedRotationAnimation(mesh, this.app.scene);
      mesh.parent = animDetails.rotationPivot;
      animDetails.rotationPivot.parent = cardHolder;

      mesh.assetMeta = {
        name: cardMeta.name,
        containerPath: meta.extended.glbPath,
        extended: {},
        appClickable: true,
        baseMesh: mesh,
        basePivot: animDetails.rotationPivot,
        clickCommand: 'customClick',
        actionCardType: true,
        cardIndex,
        rotationAnimation: animDetails.runningAnimation,
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app.pauseAssetSpin(pointerInfo, mesh, meta);
        }
      };
      cardHolder.assetMesh = mesh;
    }

    let types = ['planet', 'moon', 'dwarf']
    if (types.indexOf(this.app.selectedAsset.objectType) !== -1) {
      cardHolder.playButton.setEnabled(true);
    } else {
      cardHolder.playButton.setEnabled(false);
    }

    cardHolder.discardButton.setEnabled(true);
  }
}
