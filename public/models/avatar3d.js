import U3D from '/models/utility3d.js';

export default class Avatar3D {
  constructor(app) {
    this.app = app;
    this.app.gameData = this.app.gameData;

    this.currentMenuAvatarTrackIndex = 0;
    this.animationTracks = [
      "idle",
      "angry",
      "agree",
      "action", //dance
      "walking",

      "strut",
      "defeated",
      "jumpingjack",
      "groinkicked",
      "mutantjump",
      "jump",

      "walking",
      "joyfuljump",
      "groinkicked",

      "twerk",
      "onehandwave",
      "jump",
      "joyfuljump",
      "groinkicked",
      "shoppingbagwalk"

    ]

    this.playerShieldTexture = new BABYLON.Texture('/images/shieldopen.png', this.app.scene);
  }

  async loadAndInitAvatars() {
    let scene = this.app.scene;
    let initedAvatars = [];
    let avatarContainers = {};

    let avatarMetas = this.app.avatarMetas;
    for (let c = 0; c < 4; c++) {
      let avatarMeta = avatarMetas[c];
      let path = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' +
        encodeURIComponent('/avatars/' + avatarMeta.path) + '?alt=media';

      let container = await U3D.loadContainer(scene, path);
      avatarContainers[avatarMeta.name] = container;
    }

    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      let avatarMeta = avatarMetas[seatIndex];
      let newModel = avatarContainers[avatarMeta.name].instantiateModelsToScene();
      initedAvatars.push(newModel);
      initedAvatars[seatIndex].animationGroups[0].stop();

      let mesh = initedAvatars[seatIndex].rootNodes[0];
      let meshPicker = BABYLON.BoundingBoxGizmo.MakeNotPickableAndWrapInBoundingBox(mesh);
      meshPicker.material = this.app.invisibleMaterial;
      meshPicker.visibility = 1;

      let avatarPositionTN = new BABYLON.TransformNode("avatarpositionoffset" + seatIndex);
      avatarPositionTN.position.x = avatarMeta.x;
      avatarPositionTN.position.z = avatarMeta.z;
      meshPicker.parent = avatarPositionTN;
      newModel.avatarPositionTN = avatarPositionTN;
      newModel.particleTN = new BABYLON.TransformNode("particleTNavatar" + seatIndex, this.app.scene);
      newModel.particleTN.parent = avatarPositionTN;
      newModel.particleTN.position.y = 0.8;
      newModel.particleTN.position.z = -0.25;
      newModel.particleTN.rotation.x = -Math.PI / 2;

      avatarPositionTN.assetMeta = {
        name: avatarMeta.name,
        extended: {},
        appClickable: true,
        avatarType: true,
        seatIndex,
        basePivot: avatarPositionTN,
        baseMesh: mesh,
        boundingMesh: meshPicker,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app.pauseAssetSpin(pointerInfo, mesh, avatarPositionTN.assetMeta);
        }
      };
      avatarPositionTN.parent = this.app.sceneTransformNode;

      let color = U3D.get3DColors(seatIndex);
      let plane = BABYLON.MeshBuilder.CreatePlane("random", {
        height: 1.5,
        width: 1.5,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
      }, this.app.scene);
      plane.position = U3D.v(0, 0, 0);
      plane.rotation = U3D.v(Math.PI / 2, -Math.PI / 2, Math.PI / 2);
      plane.material = new BABYLON.StandardMaterial("shieldMat" + seatIndex, this.app.scene);
      plane.material.opacityTexture = this.playerShieldTexture;
      plane.material.diffuseColor = color;
      plane.material.diffuseColor = color;
      plane.material.emissiveColor = color;
      plane.parent = avatarPositionTN;
    }

    this.initedAvatars = initedAvatars;
    this.avatarContainers = avatarContainers;

    this.avatarsLoaded = true;
    this.app.paintGameData();
  }
}
