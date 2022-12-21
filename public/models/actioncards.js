import U3D from '/models/utility3d.js';
import R3D from '/models/rocket3d.js';

export default class ActionCards {
  constructor(app) {
    this.app = app;
  }
  async init() {
    this.cardPanel = this.app.menuTab3D.cardsStatusPanelTab;

    this.cardHolders = [];
    for (let cardIndex = 0; cardIndex < 6; cardIndex++) {
      let cardHolder = new BABYLON.TransformNode('playercardholder' + cardIndex, this.app.scene);
      cardHolder.parent = this.cardPanel;
      cardHolder.position.x = (cardIndex % 3) * -5 - 4;
      if (cardIndex > 2) {
        cardHolder.position.y = 8;
        cardHolder.position.z = 5;
      }

      this.cardHolders.push(cardHolder);

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
          this.playCard(localIndex);
        }
      };

      let discardActionCardBtn = U3D.addTextPlane(this.scene, 'Discard', 'discardActionCardBtn' + cardIndex, "Arial", "", "#000000", "transparent");
      discardActionCardBtn.position.x = 0;
      discardActionCardBtn.position.y = 3;
      discardActionCardBtn.position.z = -0.5;
      discardActionCardBtn.parent = cardHolder;
      discardActionCardBtn.assetMeta = {
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.discardCard(localIndex);
        }
      };
    }

    this.updatePlayerCards();
  }
  async discardCard(cardIndex) {

  }
  async playCard(cardIndex) {
    if (this.rocketRunning)
      return;
    this.rocketRunning = true;
    setTimeout(() => this.rocketRunning = false, 1000);

    let rotation = new BABYLON.Vector3(0, 0, 0);
    let endPosition = U3D.vector(this.obj('mars').position);
    let startPosition = U3D.vector(this.obj('neptune').position);
    await R3D.shootRocket(this.app.scene, startPosition, rotation, endPosition);
  }
  obj(name) {
    return this.app.staticAssets[name];
  }
  async updatePlayerCards(actionCards) {
    actionCards = this.app.actionCards;

    this.cardItemMeta = [];
    for (let cardIndex = 0; cardIndex < 6; cardIndex++) {
      let cardMeta = actionCards[cardIndex + 3];
      let meta = Object.assign({}, window.allStaticAssetMeta[cardMeta.gameCard]);
      meta.extended = U3D.processStaticAssetMeta(meta, {});
      let mesh = await U3D.loadStaticMesh(this.app.scene, meta.extended.glbPath);
      U3D.sizeNodeToFit(mesh, 4.5);

      let animDetails = U3D.selectedRotationAnimation(mesh, this.app.scene);
      mesh.parent = animDetails.rotationPivot;
      animDetails.rotationPivot.parent = this.cardHolders[cardIndex];

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
      this.cardItemMeta.push(mesh.assetMeta);
    }
  }
}
