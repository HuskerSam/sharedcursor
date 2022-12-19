import U3D from '/models/utility3d.js';

export default class ActionCards {
  constructor(app) {
    this.app = app;
  }
  async init() {
    this.cardPanel = this.app.menuTab3D.cardsStatusPanelTab;

    let iconName = 'spade';
    let playerCard1 = this.addCardHolder(this.app.scene, iconName, 'playerCard1');
    playerCard1.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {

      }
    };
    playerCard1.parent = this.cardPanel;
    playerCard1.position.x = -7;
    playerCard1.position.y = 1;
  }
  addCardHolder(scene, iconName, name) {
    //let texturePath = 'https://unpkg.com/@fortawesome/fontawesome-free@5.7.2/svgs/solid/' + iconName + '.svg';
    let texturePath = '/fontcons/' + iconName + '.svg';
    let mesh = BABYLON.MeshBuilder.CreateDisc(name, {
      radius: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);
    let mat = new BABYLON.StandardMaterial(name + 'disc-mat', scene);

    let tex = new BABYLON.Texture(texturePath, scene, false, false);
    tex.hasAlpha = true;
    mat.opacityTexture = tex;
    mat.emissiveColor = new BABYLON.Color3(0.25, 0, 1);
    mat.diffuseColor = new BABYLON.Color3(0.25, 0, 1);
    mat.ambientColor = new BABYLON.Color3(0.25, 0, 1);
    mesh.material = mat;

    return mesh;
  }
}
