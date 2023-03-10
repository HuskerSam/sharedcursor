import U3D from '/models/utility3d.js';

export default class Avatar3D {
  constructor(app) {
    this.app = app;
    this.app.gameData = this.app.gameData;

    this.currentMenuAvatarTrackIndex = 0;
    this.playerShieldTexture = new BABYLON.Texture('/images/shieldopen.png', this.app.scene);
  }

  async loadAndInitAvatars() {
    let scene = this.app.scene;
    this.initedAvatars = new Array(4).fill(null);
    let avatarContainers = {};

    let avatarMetas = this.app.avatarMetas;
    let promises = [];
    for (let c = 0; c < 5; c++) {
      let avatarMeta = avatarMetas[c];
      let path = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' +
        encodeURIComponent('/avatars/' + avatarMeta.path) + '?alt=media';

      promises.push(avatarContainers[avatarMeta.name] = await BABYLON.SceneLoader.LoadAssetContainerAsync(path, "", scene));
    }
    await Promise.all(promises);
    this.avatarContainers = avatarContainers;

    for (let seatIndex = 0; seatIndex < 4; seatIndex++)
      this._configureAvatar(seatIndex);

    this.avatarsLoaded = true;
    this.app.paintGameData();
  }
  _configureAvatar(seatIndex) {
    if (this.initedAvatars[seatIndex]) {
      this.initedAvatars[seatIndex].avatarPositionTN.dispose();
    }

    let avatarMeta = this.app.avatarMetas[seatIndex];
    let newModel = this.avatarContainers[avatarMeta.name].instantiateModelsToScene();

    this.initedAvatars[seatIndex] = newModel;
    this.initedAvatars[seatIndex].animationGroups[0].stop();

    let mesh = this.initedAvatars[seatIndex].rootNodes[0];
    let meshPicker = BABYLON.BoundingBoxGizmo.MakeNotPickableAndWrapInBoundingBox(mesh);
    meshPicker.material = this.app.invisibleMaterial;
    meshPicker.visibility = 1;

    let avatarPositionTN = new BABYLON.TransformNode("avatarpositionoffset" + seatIndex);
    meshPicker.parent = avatarPositionTN;
    newModel.avatarPositionTN = avatarPositionTN;
    this.setHome(newModel, avatarMeta);
    newModel.particleTN = new BABYLON.TransformNode("particleTNavatar" + seatIndex, this.app.scene);
    newModel.particleTN.parent = avatarPositionTN;
    newModel.particleTN.position.y = 0.8;
    newModel.particleTN.position.z = -0.25;
    newModel.particleTN.rotation.x = -Math.PI / 2;
    let skinMeta = this.app.getSkinMeta(seatIndex);
    let animGroup = newModel.animationGroups.find(n => n.name.indexOf(skinMeta.actions['idle']) !== -1);
    if (animGroup)
      animGroup.start(false, 1, 2, 2);
    else
      console.log('Idle action not found for ' + seatIndex);

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

    let color = U3D.color(avatarMeta.primaryColor);
    let plane = BABYLON.MeshBuilder.CreatePlane("random", {
      height: 1.5,
      width: 1.5,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.app.scene);
    plane.position = U3D.v(0, 0.05, 0);
    plane.rotation = U3D.v(Math.PI / 2, -Math.PI / 2, Math.PI / 2);
    plane.material = new BABYLON.StandardMaterial("shieldMat" + seatIndex, this.app.scene);
    plane.material.opacityTexture = this.playerShieldTexture;
    plane.material.diffuseColor = color;
    plane.material.diffuseColor = color;
    plane.material.emissiveColor = color;
    plane.parent = avatarPositionTN;
  }
  setHome(avatar, avatarMeta) {
    avatar.avatarPositionTN.position.x = avatarMeta.x;
    avatar.avatarPositionTN.position.z = avatarMeta.z;
    if (avatarMeta.z < 0 && avatarMeta.x < 0 || avatarMeta.z > 0 && avatarMeta.x > 0)
      avatar.avatarPositionTN.rotation.y = Math.atan2(avatarMeta.x, avatarMeta.z) + Math.PI;
    else
      avatar.avatarPositionTN.rotation.y = Math.atan2(avatarMeta.z, avatarMeta.x);
  }

  async updateUserAvatar(seatIndex, seatData) {
    console.log(seatData);
    let avatarPath = this.app.gameData.memberAvatars[seatData.uid];
    if (avatarPath && this.avatarContainers[avatarPath] === undefined) {
      this.avatarContainers[avatarPath] = null;
      try {
        this.avatarContainers[avatarPath] = await BABYLON.SceneLoader.LoadAssetContainerAsync(avatarPath, "", this.app.scene);
      } catch (containerLoadError) {
        console.log('containerLoadError', containerLoadError);
        return;
      }
    }

    let userContainer = avatarPath ? this.avatarContainers[avatarPath] : null;
    this._skinAvatar(seatIndex, userContainer);
  }
  _skinAvatar(seatIndex, userContainer) {
    if (userContainer) {
      let avatarMeta = this.app.avatarMetas[seatIndex];
      let playerRMEContainer = this.avatarContainers['playercomposite'];

      let skinModel = userContainer.instantiateModelsToScene();

      this.cloneAnimationGroups(skinModel, playerRMEContainer.animationGroups);
      skinModel.rootNodes[0].parent = this.initedAvatars[seatIndex].rootNodes[0].parent;
      skinModel.rootNodes[0].position = this.initedAvatars[seatIndex].rootNodes[0].position;
      skinModel.rootNodes[0].rotation = this.initedAvatars[seatIndex].rootNodes[0].rotation;
      skinModel.rootNodes[0].scaling = this.initedAvatars[seatIndex].rootNodes[0].scaling;
      skinModel.rootNodes[0].scaling.y *= -1;
      skinModel.rootNodes[0].scaling.z *= -1;

      this.initedAvatars[seatIndex].rootNodes[0].setEnabled(false);
      this.initedAvatars[seatIndex].rootNodes = skinModel.rootNodes;
      this.initedAvatars[seatIndex].animationGroups = skinModel.animationGroups;
      this.initedAvatars[seatIndex].skeletons = skinModel.skeletons;
      this.initedAvatars[seatIndex].playerRMEType = true;
      //this.app.menuTab3D._updatePlayerTabAvatar(seatIndex);
    } else if (this.initedAvatars[seatIndex].playerRMEType) {
      let avatarMeta = this.app.avatarMetas[seatIndex];
      let container = this.avatarContainers[avatarMeta.name];
      let model = container.instantiateModelsToScene();

      model.rootNodes[0].parent = this.initedAvatars[seatIndex].rootNodes[0].parent;
      //model.rootNodes[0].position = this.initedAvatars[seatIndex].rootNodes[0].position;
      //model.rootNodes[0].rotation = this.initedAvatars[seatIndex].rootNodes[0].rotation;
      //model.rootNodes[0].scaling = this.initedAvatars[seatIndex].rootNodes[0].scaling;
      //model.rootNodes[0].scaling.y *= -1;
      //model.rootNodes[0].scaling.z *= -1;

      this.initedAvatars[seatIndex].rootNodes[0].setEnabled(false);
      this.initedAvatars[seatIndex] = model;
    }
  }
  async cloneAnimationGroups(newModel, oldGroups) {
    let modelTransformNodes = newModel.rootNodes[0].getChildTransformNodes();
    let skinNodes = {};
    modelTransformNodes.forEach(n => {
      const name = n.name.toLowerCase().replace("mixamo:", "").replace('clone of ', '')
        .replace("mixamorig:", "").replace("left_", "left").replace("orig10", "orig")
        .replace("right_", "right").replaceAll("_end", "");
      skinNodes[name] = n;
    });

    newModel.animationGroups = [];
    oldGroups.forEach(group => {
      newModel.animationGroups.push(group.clone(group.name, (oldTarget) => {
        const name = oldTarget.name.toLowerCase().replace("mixamo:", "").replace('clone of ', '')
          .replace("mixamorig:", "").replace("left_", "left").replace("right_", "right")
          .replace("orig10", "orig").replaceAll("_end", "");

        if (skinNodes[name])
          return skinNodes[name]

        console.log('MISS', name);

        return null;
      }));
    });
  }
}
