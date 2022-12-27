import U3D from '/models/utility3d.js';

export default class ActionCards {
  constructor(app, panel) {
    this.app = app;
    this.cardPanel = panel;
    this.cardPositions = [];
    this.cardWidth = 5;
    this.cardHeight = 9;

    for (let cardIndex = 0; cardIndex < 6; cardIndex++) {
      let cardHolder = new BABYLON.TransformNode('playercardholder' + cardIndex, this.app.scene);
      cardHolder.parent = this.cardPanel;
      cardHolder.position.x = -1 * (cardIndex % 3) * this.cardWidth * 1.25 - 14;
      if (cardIndex > 2) {
        cardHolder.position.y = 8;
        cardHolder.position.z = 5;
      }

      this.cardPositions.push(cardHolder);

      let localIndex = cardIndex;
      let playActionCardBtn = U3D.addDefaultText(this.scene, 'Play', "#ffffff", "#00aa00");
      playActionCardBtn.position.y = this.cardHeight / 2 - 0.75;
      playActionCardBtn.position.z = -0.05;
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

      let discardActionCardBtn = U3D.addDefaultText(this.scene, 'Recycle', "#ffffff", "#ff0000");
      discardActionCardBtn.position.y = -this.cardHeight / 2 + 0.75;
      discardActionCardBtn.position.z = -0.05;
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

      let mat = new BABYLON.StandardMaterial("random", this.app.scene);
      mat.diffuseColor = U3D.color("0.5,.5,.5");
      mat.ambientColor = U3D.color("0.5,.5,.5");

      let plane = BABYLON.MeshBuilder.CreatePlane("random", {
        width: this.cardWidth,
        height: this.cardHeight
      }, this.app.scene);
      plane.material = mat;
      plane.parent = cardHolder;
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
    let cardIndex = rawCardIndex;

    if (cardHolder.cachedIndex !== cardIndex) {
      cardHolder.cachedIndex = cardIndex;
      if (cardHolder.assetMesh)
        cardHolder.assetMesh.dispose(false, true);

      let cardMeta = this.app.actionCards[cardIndex];
      let meta = Object.assign({}, window.allStaticAssetMeta[cardMeta.gameCard]);
      meta.extended = U3D.processStaticAssetMeta(meta, {});
      let mesh = await U3D.loadStaticMesh(this.app.scene, meta.extended.glbPath);
      U3D.sizeNodeToFit(mesh, 3);
      mesh.parent = cardHolder;
      Object.assign(meta, {
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          let id = cardMeta.gameCard;
          this.app.menuTab3D.setSelectedAsset(this.app.staticBoardObjects[id].assetMeta);
        }
      });
      mesh.assetMeta = meta;

      cardHolder.assetMesh = mesh;


      if (cardHolder.assetName)
        cardHolder.assetName.dispose(false, true);
      cardHolder.assetName = U3D.addDefaultText(this.app.scene, meta.name, "#0000FF", "#ffffff");
      cardHolder.assetName.position.x = -this.cardWidth / 2 + 0.5;
      cardHolder.assetName.position.y = 0; //this.cardHeight / 2;
      cardHolder.assetName.position.z = -0.05;
      cardHolder.assetName.rotation.z = Math.PI / 2;
      cardHolder.assetName.scaling = U3D.v(0.75);
      cardHolder.assetName.parent = cardHolder;

      if (cardHolder.assetType)
        cardHolder.assetType.dispose(false, true);
      cardHolder.assetType = U3D.addDefaultText(this.app.scene, meta.objectType, "#0000FF", "#ffffff");
      cardHolder.assetType.position.x = this.cardWidth / 2 - 0.5;
      cardHolder.assetType.position.y = 0; //this.cardHeight / 2;
      cardHolder.assetType.position.z = -0.05;
      cardHolder.assetType.rotation.z = Math.PI / 2;
      cardHolder.assetType.scaling = U3D.v(0.75);
      cardHolder.assetType.parent = cardHolder;
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
