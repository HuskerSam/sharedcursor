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

    this.dockDiscRadius = 0.6;
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
      let avatarPositionTN = new BABYLON.TransformNode("avatarpositionoffset" + mesh.id);
      avatarPositionTN.position.x = avatarMeta.x;
      avatarPositionTN.position.z = avatarMeta.z;
      mesh.parent = avatarPositionTN;
      newModel.avatarPositionTN = avatarPositionTN;
      newModel.particleTN = new BABYLON.TransformNode("particleTNavatar" + seatIndex, this.app.scene);
      newModel.particleTN.parent = avatarPositionTN;
      newModel.particleTN.position.y = 0.8;
      newModel.particleTN.position.z = -0.25;
      newModel.particleTN.rotation.x = -Math.PI / 2;

      if (scene.baseShadowGenerator)
        scene.baseShadowGenerator.addShadowCaster(mesh);

      avatarPositionTN.assetMeta = {
        name: avatarMeta.name,
        extended: {},
        appClickable: true,
        avatarType: true,
        seatIndex,
        basePivot: avatarPositionTN,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app.pauseAssetSpin(pointerInfo, mesh, meta);
        }
      };
      avatarPositionTN.parent = this.app.sceneTransformNode;
    }

    this.initedAvatars = initedAvatars;
    this.avatarContainers = avatarContainers;

    this.avatarsLoaded = true;
    this.app.paintGameData();
  }
}
