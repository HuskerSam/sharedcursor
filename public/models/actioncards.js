import U3D from '/models/utility3d.js';

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
    }

    this.updatePlayerCards();
  }
  async updatePlayerCards(actionCards) {
    actionCards = this.app.actionCards;

    for (let cardIndex = 0; cardIndex < 6; cardIndex++) {
      let cardMeta = actionCards[cardIndex];
      let meta = Object.assign({}, window.allStaticAssetMeta[cardMeta.gameCard]);
      meta.extended = U3D.processStaticAssetMeta(meta, {});
      let mesh = await U3D.loadStaticMesh(this.app.scene, meta.extended.glbPath);
      U3D._fitNodeToSize(mesh, 4.5);

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
        rotationAnimation: animDetails.runningAnimation,
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app.pauseAssetSpin(pointerInfo, mesh, meta);
        }
      };
    }
  }
}
