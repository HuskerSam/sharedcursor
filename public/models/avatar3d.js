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
  _configureAvatar(seatIndex, overrideContainer) {
    if (this.initedAvatars[seatIndex]) {
      this.initedAvatars[seatIndex].avatarPositionTN.dispose();
    }

    let avatarMeta = this.app.avatarMetas[seatIndex];
    let newModel = this.avatarContainers[avatarMeta.name].instantiateModelsToScene();

    this.initedAvatars[seatIndex] = newModel;
    this.initedAvatars[seatIndex].animationGroups[0].stop();

    let mesh = this.initedAvatars[seatIndex].rootNodes[0];
    //if (newModel.animModel)
    //    mesh = this.initedAvatars[seatIndex].animModel.rootNodes[0];

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
    newModel.animationGroups.find(n => n.name.indexOf(avatarMeta.idlePose) !== -1)
      .start(false, 1, 0.03333333507180214 * 60, 0.03333333507180214 * 60);

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

  async _loadCustomAvatar(seatIndex) {
    let seatData = this.app.menuTab3D.getSeatData(seatIndex);
    if (this.app.uid !== seatData.uid)
      return;

    if (!this.app.profile || !this.app.profile.displayAvatar)
      return;

    if (this.avatarContainers[this.app.profile.displayAvatar])
      return;

    let container;
    try {
      container = await BABYLON.SceneLoader.LoadAssetContainerAsync(this.app.profile.displayAvatar, "", this.app.scene);
    } catch (containerLoadError) {
      console.log('containerLoadError', containerLoadError);
      return;
    }

    this.avatarContainers[this.app.profile.displayAvatar] = container;
    this._skinAvatar(seatIndex, container);
  }
  _skinAvatar(seatIndex, container) {
    //let skinModel = container.instantiateModelsToScene();
    let avatarMeta = this.app.avatarMetas[seatIndex];
    let playerRMEContainer = this.avatarContainers['playercomposite'];
    console.log(container, playerRMEContainer);

    //seatContainer.meshes = container.meshes;
    //container.animationGroups = seatContainer.animationGroups;
    let skinModel = container.instantiateModelsToScene();

    this.cloneAnimationGroups(skinModel, playerRMEContainer.animationGroups);

    skinModel.rootNodes[0].parent = this.initedAvatars[seatIndex].rootNodes[0].parent;
    this.initedAvatars[seatIndex].rootNodes[0].setEnabled(false);
    this.initedAvatars[seatIndex].rootNodes = skinModel.rootNodes;
    this.initedAvatars[seatIndex].animationGroups = skinModel.animationGroups;
    this.initedAvatars[seatIndex].skeletons = skinModel.skeletons;
    this.initedAvatars[seatIndex].playerRMEType = true;

    //    let group = seatContainer.animationGroups[0];
    //console.log(skinNodes);
    /*
    window.myAnim = group.clone(group.name, (oldTarget) => {
      const name = oldTarget.name.toLowerCase().replace("mixamo:", "").replace('clone of ', '')
      .replace("mixamorig:", "").replace("left_", "left").replace("right_", "right")
      .replace("orig10", "orig").replaceAll("_end", "");

      if (skinNodes[name])
        return skinNodes[name]

      console.log('MISS', name);

      return null;
    });
    */

    //skinModel.animationGroups = this.initedAvatars[seatIndex].animationGroups;
    //  this.cloneAnimationGroups(skinModel, this.initedAvatars[seatIndex].animationGroups);
    //  skinModel.origAnimationModel = this.initedAvatars[seatIndex];
    //  this.initedAvatars[seatIndex] = skinModel;

    //      this.initedAvatars[seatIndex].rootNodes;
    //this.linkSkeletonMeshes(skinModel.rootNodes[0], this.initedAvatars[seatIndex].rootNodes[0]);
    //skinModel.rootNodes[0].parent = this.initedAvatars[seatIndex].rootNodes[0].parent;
    //      let mesh

    //this.initedAvatars[seatIndex].avatarPositionTN.dispose();


    //this.avatarContainers[this.app.profile.displayAvatar]
    //  newModel.rootNodes = skinModel.rootNodes;
    //this.cloneAnimationGroups(newModel, animModel.animationGroups);
    //this.linkSkeletonMeshes(animModel, newModel);
    //animModel.rootNodes[0].setEnabled(false);
    //newModel.animationGroups = animModel.animationGroups;
    //newModel.animModel = animModel;
    //  let mesh = this.initedAvatars[seatIndex].rootNodes[0];
    //  U3D.sizeNodeToFit(mesh, 1);

  }
  linkSkeletonMeshes(master, slave) {
    if (master != null && master.bones != null && master.bones.length > 0) {
      if (slave != null && slave.bones != null && slave.bones.length > 0) {
        const boneCount = slave.bones.length;
        for (let index = 0; index < boneCount; index++) {
          const sbone = slave.bones[index];
          if (sbone != null) {
            const mbone = this.findBoneByName(master, sbone.name);
            if (mbone != null) {
              sbone._linkedTransformNode = mbone._linkedTransformNode;
            } else {
              console.warn("Failed to locate bone on master rig: " + sbone.name);
            }
          }
        }
      }
    }
  }
  findBoneByName(skeleton, name) {
    let result = null;
    if (skeleton != null && skeleton.bones != null) {
      for (let index = 0; index < skeleton.bones.length; index++) {
        const bone = skeleton.bones[index];
        const bname = bone.name.toLowerCase().replace("mixamo:", "").replace("mixamorig:", "").replace("left_", "left").replace("orig10", "orig").replace("right_", "right");
        const xname = name.toLowerCase().replace("mixamo:", "").replace("mixamorig:", "").replace("left_", "left").replace("right_", "right").replace("orig10", "orig");
        if (bname === xname) {
          result = bone;
          break;
        }
      }
    }
    return result;
  }
  /*
  async cloneAnimationGroups(newModel, oldGroups) {
    newModel.animationGroups = [];
    let modelTransformNodes = newModel.rootNodes[0].getChildTransformNodes();
    oldGroups.forEach(group => {
      newModel.animationGroups.push(group.clone(group.name, (oldTarget) => {
        return modelTransformNodes.find((node) => {
          const nName = node.name.toLowerCase().replace("mixamo:", "").replace('clone of ', '').replace("mixamorig:", "").replace("left_", "left").replace("orig10", "orig").replace("right_", "right");
          const oName = oldTarget.name.toLowerCase().replace("mixamo:", "").replace('clone of ', '').replace("mixamorig:", "").replace("left_", "left").replace("right_", "right").replace("orig10", "orig");

          if (nName === oName) {
            console.log(node.name, oldTarget.name);
            node.name === oldTarget.name;
            return node;
          }
        });
      }));

    });
  }
  */
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
