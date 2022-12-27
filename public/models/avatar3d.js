import U3D from '/models/utility3d.js';

export default class Avatar3D {
  constructor(app) {
    this.app = app;
    this.app.gameData = this.app.gameData;

    this.dockDiscRadius = 0.6;
  }
  async updateUserPresence() {
    if (!this.dockSeatContainers)
      return;

    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      let seat = this.dockSeatContainers[seatIndex];
      if (seat) {
        if (seat.onlineSphere) {
          seat.onlineSphere.dispose(false, true);
          seat.onlineSphere = null;
        }

        let seatData = this.getSeatData(seatIndex);
        if (seatData.seated && seatIndex < this.app.seatCount) {
          let online = this.app.userPresenceStatus[seatData.uid] === true;
          let mat1 = new BABYLON.StandardMaterial('onlinespheremat' + seatIndex, this.app.scene);
          let color = new BABYLON.Color3(1, 1, 1);
          if (online) {
            color = new BABYLON.Color3(0, 2, 0)
            mat1.ambientColor = color;
          }
          mat1.diffuseColor = color;

          let sphere = BABYLON.MeshBuilder.CreateSphere("onlinesphere" + seatIndex, {
            diameter: 0.5,
            segments: 16
          }, this.app.scene);
          sphere.position.y = 2.5;
          sphere.position.x = -1;
          sphere.material = mat1;
          sphere.parent = seat;
          seat.onlineSphere = sphere;
        }
      }
    }
  }
  async initPlayerPanel() {
    for (let key in this.app.staticBoardObjects) {
      let assetMesh = this.app.staticBoardObjects[key];
      if (assetMesh.assetMeta.seatIndex !== undefined)
        this.app.playerMoonAssets[assetMesh.assetMeta.seatIndex] = assetMesh;
    }

    this.dockSeatContainers = [];
    this.menuBarAvatars = [];
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      let colors = this.get3DColors(seatIndex);
      let playerColor = new BABYLON.Color3(colors.r, colors.g, colors.b);

      let dockSeatContainer = new BABYLON.TransformNode('dockSeatContainer' + seatIndex, this.app.scene);
      this.dockSeatContainers.push(dockSeatContainer);
      dockSeatContainer.position.x = -26 + (seatIndex * 6);
      dockSeatContainer.parent = this.app.menuTab3D.playerMoonPanelTab;

      let moonCloneMeta = this.app.playerMoonAssets[seatIndex].assetMeta;
      let moonCloneInstance = window.staticMeshContainer[moonCloneMeta.containerPath].instantiateModelsToScene();
      let moonCloneMesh = moonCloneInstance.rootNodes[0];
      let moonCloneTN = new BABYLON.TransformNode('moonCloneTN' + seatIndex, this.app.scene);
      moonCloneMesh.parent = moonCloneTN;
      moonCloneTN.position.y = 6;
      moonCloneTN.position.z = 10;
      moonCloneTN.assetMeta = {
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app.menuTab3D.setSelectedAsset(moonCloneMeta);
        }
      };
      moonCloneTN.parent = this.dockSeatContainers[seatIndex];
      U3D.sizeNodeToFit(moonCloneMesh, 2.5);

      let moonFlagBack = BABYLON.MeshBuilder.CreatePlane("flagback" + seatIndex, {
        height: 1.75,
        width: 2.5,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
      }, this.app.scene);
      moonFlagBack.material = new BABYLON.StandardMaterial('flagmaterial' + seatIndex, this.app.scene);
      moonFlagBack.material.diffuseColor = playerColor;
      moonFlagBack.material.ambientColor = playerColor;
      moonFlagBack.material.emissiveColor = playerColor;
      moonFlagBack.parent = moonCloneTN;
      moonFlagBack.position.y = 4.5;
      moonFlagBack.position.x = 1.25;
      let moonFlagPole = BABYLON.MeshBuilder.CreateCylinder("flagpole" + seatIndex, {
        height: 3,
        diameter: 0.25,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
      }, this.app.scene);
      moonFlagPole.material = moonFlagBack.material;
      moonFlagPole.parent = moonCloneTN;
      moonFlagPole.position.y = 3.5;
      moonFlagPole.position.x = 0;
      dockSeatContainer.moonCloneTN = moonCloneTN;
      let playerImagePlane = BABYLON.MeshBuilder.CreatePlane("avatarimageplane" + seatIndex, {
          height: 1.5,
          width: 1.5,
          sideOrientation: BABYLON.Mesh.DOUBLESIDE
        },
        this.app.scene);
      playerImagePlane.position.y = 4.5;
      playerImagePlane.position.x = 1.25;
      playerImagePlane.position.z = -0.05;
      dockSeatContainer.playerImageMaterial = new BABYLON.StandardMaterial('avatarshowmat' + seatIndex, this.app.scene);
      playerImagePlane.material = dockSeatContainer.playerImageMaterial;
      playerImagePlane.parent = dockSeatContainer.moonCloneTN;
      playerImagePlane.setEnabled(false);
      dockSeatContainer.playerImagePlane = playerImagePlane;

      let avatarMeta = this.getAvatarData()[seatIndex];
      let animationsBaseName = avatarMeta.cloneAnimations ? avatarMeta.cloneAnimations : avatarMeta.name;
      let newModel = this.avatarContainers[animationsBaseName].instantiateModelsToScene();
      let newSkin = this.avatarContainers[avatarMeta.name].instantiateModelsToScene();
      this.linkSkeletonMeshes(newModel.skeletons[0], newSkin.skeletons[0]);
      newModel.rootNodes[0].setEnabled(false);
      newSkin.animContainer = newModel;
      newModel = newSkin;
      this.menuBarAvatars.push(newModel);
      this.menuBarAvatars[seatIndex].animContainer.animationGroups[0].stop();

      let bonesOffsetTN = new BABYLON.TransformNode("menu3davatarbonesoffset" + seatIndex);
      let avatarPositionTN = new BABYLON.TransformNode("menu3davatarpositionoffset" + seatIndex);
      let avatarExtrasTN = new BABYLON.TransformNode("menu3davatarpanel" + seatIndex);
      avatarPositionTN.position.y = -1;
      avatarPositionTN.position.z = 3;
      avatarPositionTN.rotation.y = Math.PI;
      avatarPositionTN.scaling = U3D.v(3);
      bonesOffsetTN.parent = avatarPositionTN;
      avatarExtrasTN.parent = avatarPositionTN;
      avatarPositionTN.parent = this.dockSeatContainers[seatIndex];
      this.menuBarAvatars[seatIndex].rootNodes[0].parent = bonesOffsetTN;
      newModel.bonesOffsetTN = bonesOffsetTN;
      newModel.avatarPositionTN = avatarPositionTN;
      newModel.avatarExtrasTN = avatarExtrasTN;

      avatarPositionTN.assetMeta = {
        name: avatarMeta.name,
        extended: {},
        appClickable: true,
        avatarType: true,
        seatIndex: seatIndex,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app.menuTab3D.setSelectedAsset(meta);
        }
      };
    }
  }
  _renderPlayerSeat(seatIndex, seatData, active) {
    let seatContainer = this.dockSeatContainers[seatIndex];
    if (seatContainer.playerDetailsTN) {
      seatContainer.playerDetailsTN.dispose(false, true);
      seatContainer.playerDetailsTN = null;
    }
    seatContainer.playerDetailsTN = new BABYLON.TransformNode("playerDetailsTN" + seatIndex, this.app.scene);
    seatContainer.playerDetailsTN.parent = seatContainer;

    seatContainer.playerImagePlane.setEnabled(false);

    let colors = this.get3DColors(seatIndex);
    let rgb = U3D.colorRGB255(colors.r + ',' + colors.g + ',' + colors.b);
    if (active) {
      let meta = seatContainer.assetMeta;

      if (seatData.seated) {
        let names = seatData.name.split(' ');
        seatContainer.namePlate1 = U3D.addDefaultText(this.app.scene, names[0], rgb, 'transparent');
        seatContainer.namePlate1.position.z = 3;
        seatContainer.namePlate1.position.y = 6.25;
        seatContainer.namePlate1.parent = seatContainer.playerDetailsTN;

        if (names[1]) {
          seatContainer.namePlate2 = U3D.addDefaultText(this.app.scene, names[1], rgb, 'transparent');
          seatContainer.namePlate2.position.z = 3;
          seatContainer.namePlate2.position.y = 5.25;
          seatContainer.namePlate2.parent = seatContainer.playerDetailsTN;
        }

        if (this.app.uid === seatData.uid || this.app.isOwner) {
          let gameOwnerNotPlayer = (this.app.uid !== seatData.uid && this.app.isOwner);
          let color = gameOwnerNotPlayer ? "#000000" : '#ffffff';
          let standBtn = U3D.addDefaultText(this.app.scene, "X", color);
          standBtn.scaling = U3D.v(1.25, 1.25, 1.25);
          standBtn.position.x = 1;
          standBtn.position.y = 0.25;
          standBtn.position.z = 2.5;
          standBtn.parent = seatContainer.playerDetailsTN;
          standBtn.assetMeta = {
            appClickable: true,
            clickCommand: 'customClick',
            handlePointerDown: async (pointerInfo, mesh, meta) => {
              this.app._gameAPIStand(seatIndex);
              seatContainer.sitStandButton.dispose(false, true);
              seatContainer.sitStandButton = null;
            }
          };
          seatContainer.sitStandButton = standBtn;
        }

        if (seatContainer.playerImageMaterial.diffuseTexture)
          seatContainer.playerImageMaterial.diffuseTexture.dispose();

        let t = new BABYLON.Texture(seatData.image, this.app.scene);
        t.vScale = 1;
        t.uScale = 1;
        t.hasAlpha = true;
        seatContainer.playerImageMaterial.diffuseTexture = t;
        seatContainer.playerImageMaterial.emissiveTexture = t;
        seatContainer.playerImageMaterial.ambientTexture = t;
        seatContainer.playerImagePlane.setEnabled(true);
      } else {
        let sitBtn = U3D.addDefaultText(this.app.scene, "Sit", rgb);
        sitBtn.position.y = 0.25;
        sitBtn.position.z = 2.5;
        sitBtn.scaling = U3D.v(2, 2, 2);
        sitBtn.assetMeta = {
          seatIndex,
          appClickable: true,
          clickCommand: 'customClick',
          handlePointerDown: async (pointerInfo, mesh, meta) => {
            this.app.dockSit(seatIndex);
            seatContainer.sitStandButton.dispose(false, true);
            seatContainer.sitStandButton = null;
          }
        };
        sitBtn.parent = seatContainer.playerDetailsTN;
        seatContainer.sitStandButton = sitBtn;
      }
    } else {
      seatContainer.namePlate1 = U3D.addDefaultText(this.app.scene, 'Husker AI', rgb, 'transparent');
      seatContainer.namePlate1.position.z = 3;
      seatContainer.namePlate1.position.y = 5.5;
      seatContainer.namePlate1.parent = seatContainer.playerDetailsTN;

      if (seatContainer.playerImageMaterial.diffuseTexture)
        seatContainer.playerImageMaterial.diffuseTexture.dispose();

      let path = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent('/symbol/herbie.png') + '?alt=media';
      let t = new BABYLON.Texture(path, this.app.scene);
      t.vScale = 1;
      t.uScale = 1;
      t.hasAlpha = true;
      seatContainer.playerImageMaterial.diffuseTexture = t;
      seatContainer.playerImageMaterial.emissiveTexture = t;
      seatContainer.playerImageMaterial.ambientTexture = t;
      seatContainer.playerImagePlane.setEnabled(true);
    }
  }
  async updatePlayerDock() {
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      let active = (seatIndex < this.app.seatCount)
      let seatData = this.getSeatData(seatIndex);
      let cacheValue = 'empty';
      if (active)
        cacheValue = seatData.name + seatData.image + seatData.seated.toString();

      if (this['dockSeatCache' + seatIndex] !== cacheValue) {
        this['dockSeatCache' + seatIndex] = cacheValue;
        this._renderPlayerSeat(seatIndex, seatData, active);
      }
    }

    this.updateUserPresence();
    this.updateCurrentPlayer();

    this.avatarsLoaded = true;
  }
  updateCurrentPlayer() {
    let seatIndex = this.app.activeSeatIndex;
    if (this.currentSeatMeshIndex === seatIndex)
      return;
    this.currentSeatMeshIndex = seatIndex;

    if (!this.selectedPlayerPanel) {
      this.selectedPlayerPanel = BABYLON.MeshBuilder.CreateDisc("selectedplayerpanel", {
        radius: 1,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
      }, this.app.scene);
      this.selectedPlayerPanel.material = new BABYLON.StandardMaterial('selectedPlayerPanelMat', this.app.scene);
      this.selectedPlayerPanel.position.y = -1;
      this.selectedPlayerPanel.position.z = 3;
      this.selectedPlayerPanel.rotation.x = Math.PI / 2;
    }
    this.selectedPlayerPanel.parent = this.dockSeatContainers[seatIndex];
    this.selectedPlayerPanel.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    this.selectedPlayerPanel.material.ambientColor = new BABYLON.Color3(1, 0, 0);
    this.selectedPlayerPanel.material.emissiveColor = new BABYLON.Color3(1, 0, 0);

    if (!this.selectedMoonPanel) {
      this.selectedMoonPanel = BABYLON.MeshBuilder.CreateSphere("selectedmoonpanel", {
        width: 1,
        height: 1,
        depth: 1
      }, this.app.scene);
      this.selectedMoonPanel.material = new BABYLON.StandardMaterial('selectedMoonPanelMat', this.app.scene);
      this.selectedMoonPanel.position.y = 3;
    }
    this.selectedMoonPanel.parent = this.app.playerMoonAssets[seatIndex].assetMeta.basePivot;

    let colors = this.get3DColors(seatIndex);
    let playerColor = new BABYLON.Color3(colors.r, colors.g, colors.b);
    this.selectedMoonPanel.material.diffuseColor = playerColor;
    this.selectedMoonPanel.material.ambientColor = playerColor;
    this.selectedMoonPanel.material.emissiveColor = playerColor;

    this.menuBarAvatars.forEach((container, i) => {
      let arr = container.animContainer.animationGroups;
      if (i === seatIndex) {
        let animName = 'Clone of surprised';

        let animIndex = 0;
        arr.forEach((anim, i2) => {
          if (anim.name === animName)
            animIndex = i2;
        })
        this.avatarSequence(container, animIndex, i);
      } else {
        arr.forEach(anim => anim.stop());
        container.skeletons[0].returnToRest();
      }
    });

    this.initedAvatars.forEach((avatar, i) => {
      avatar.rootNodes[0].setEnabled(i === seatIndex);
    })
  }
  getSeatData(seatIndex) {
    let key = 'seat' + seatIndex.toString();
    let name = '';
    let avatar = '';
    let uid = '';
    let image = '';
    let seated = false;
    if (this.app.gameData[key]) {
      name = this.app.gameData.memberNames[this.app.gameData[key]];
      if (!name) name = "Anonymous";
      avatar = this.app.gameData.memberAvatars[this.app.gameData[key]];
      if (!avatar) avatar = "male1";
      image = this.app.gameData.memberImages[this.app.gameData[key]];
      if (!image) image = "";

      uid = this.app.gameData[key];
      seated = true;
    }

    return {
      seated,
      name,
      key,
      avatar,
      image,
      uid: this.app.gameData[key]
    };
  }
  async randomizeAnimations() {
    if (!this.initedAvatars)
      return;

    this.initedAvatars.forEach((container, avatarIndex) => {
      let arr = container.animContainer.animationGroups;
      let index = Math.floor(Math.random() * arr.length);
      /*
      arr.forEach((anim, i) => {
        if (anim.name === 'Clone of jogging')
          index = i;
      })
      */
      this.avatarSequence(container, index, avatarIndex);
    });
  }
  get3DColors(seatIndex) {
    let r = 220 / 255,
      g = 220 / 255,
      b = 0;
    if (seatIndex === 1) {
      r = 0;
      g = 220 / 255;
      b = 210 / 255;
    }
    if (seatIndex === 2) {
      r = 230 / 255;
      g = 0;
      b = 230 / 255;
    }
    if (seatIndex === 3) {
      r = 150 / 255;
      g = 130 / 255;
      b = 255 / 255;
    }

    return new BABYLON.Color3(r, g, b);
  }

  async loadAndInitAvatars() {
    let scene = this.app.scene;
    let initedAvatars = [];
    let avatarContainers = {};

    let avatarMetas = this.getAvatarData();
    for (let c = 0; c < 4; c++) {
      let avatarMeta = avatarMetas[c];
      let path = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' +
        encodeURIComponent('/avatars/' + avatarMeta.path) + '?alt=media';

      let container = await U3D.loadContainer(scene, path);
      avatarContainers[avatarMeta.name] = container;
    }

    for (let c = 0; c < 4; c++) {
      let avatarMeta = avatarMetas[c];
      let animationsBaseName = avatarMeta.cloneAnimations ? avatarMeta.cloneAnimations : avatarMeta.name;
      let newModel = avatarContainers[animationsBaseName].instantiateModelsToScene();
      let newSkin = avatarContainers[avatarMeta.name].instantiateModelsToScene();

      this.linkSkeletonMeshes(newModel.skeletons[0], newSkin.skeletons[0]);
      newModel.rootNodes[0].setEnabled(false);

      newSkin.animContainer = newModel;
      newModel = newSkin;

      initedAvatars.push(newModel);
      initedAvatars[c].animContainer.animationGroups[0].stop();

      let mesh = initedAvatars[c].rootNodes[0];
      let bonesOffsetTN = new BABYLON.TransformNode("avatarbonesoffset" + mesh.id);
      let avatarPositionTN = new BABYLON.TransformNode("avatarpositionoffset" + mesh.id);
      let avatarExtrasTN = new BABYLON.TransformNode("avatarpanel" + mesh.id);
      avatarPositionTN.position.x = avatarMeta.x;
      avatarPositionTN.position.z = avatarMeta.z;
      bonesOffsetTN.parent = avatarPositionTN;
      avatarExtrasTN.parent = avatarPositionTN;
      avatarExtrasTN.rotation.y = Math.PI;
      mesh.parent = bonesOffsetTN;
      newModel.bonesOffsetTN = bonesOffsetTN;
      newModel.avatarPositionTN = avatarPositionTN;
      newModel.avatarExtrasTN = avatarExtrasTN;
      avatarExtrasTN.position.z = 8;

      scene.baseShadowGenerator.addShadowCaster(mesh);

      avatarPositionTN.assetMeta = {
        name: avatarMeta.name,
        extended: {},
        appClickable: true,
        avatarType: true,
        seatIndex: c,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app.menuTab3D.setSelectedAsset(meta);
        }
      };
    }

    this.initedAvatars = initedAvatars;
    this.avatarContainers = avatarContainers;

    this.randomizeAnimations();
    setInterval(() => {
      this.randomizeAnimations();
    }, 20000)
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
        const bname = bone.name.toLowerCase().replace("mixamo:", "").replace("left_", "left").replace("orig10", "orig").replace("right_", "right");
        const xname = name.toLowerCase().replace("mixamo:", "").replace("left_", "left").replace("right_", "right").replace("orig10", "orig");
        if (bname === xname) {
          result = bone;
          break;
        }
      }
    }
    return result;
  }
  async avatarSequence(avatarContainer, animationIndex, avatarIndex) {
    let scene = this.app.scene;
    let arr = avatarContainer.animContainer.animationGroups;
    arr.forEach(anim => anim.stop());

    let animName = arr[animationIndex].name;

    //arr[animationIndex].reset();
    arr[animationIndex].start(true);

    let mesh = avatarContainer.bonesOffsetTN;
    mesh.position.x = 0;
    mesh.position.z = 0;

    arr[animationIndex].onAnimationGroupLoopObservable.add(() => {
      mesh.position.x = 0;
      mesh.position.z = 0;
    });
  }
  getAvatarData() {
    return [{
        "name": "Terra",
        "path": "maria.glb",
        "cloneAnimations": "Daya",
        "x": 12,
        "z": 21,
        "race": "Human",
        "seatIndex": 0
      },
      {
        "name": "Jade",
        "path": "jolleen.glb",
        "cloneAnimations": "Daya",
        "x": -10,
        "z": 22,
        "race": "Botan",
        "seatIndex": 1
      },
      {
        "name": "Daya",
        "path": "jonesbase.glb",
        "x": -30,
        "z": 35,
        "race": "Avian",
        "seatIndex": 2
      },
      {
        "name": "Geronimo",
        "path": "maynard.glb",
        "cloneAnimations": "Daya",
        "x": 7,
        "z": -32,
        "race": "Titan",
        "seatIndex": 3
      }
    ];
  }
  _offsetBonesMovement(model) {
    let mesh = model.rootNodes[0].getChildMeshes()[0];
    mesh.refreshBoundingInfo(true);
    mesh.computeWorldMatrix(true);
    let bIndex = model.skeletons[0].getBoneIndexByName("mixamorig:Hips");
    if (bIndex < 0)
      bIndex = model.skeletons[0].getBoneIndexByName("mixamorig10:Hips");

    let position = model.skeletons[0].bones[bIndex].getTransformNode().getAbsolutePosition();

    model.bonesOffsetTN.position.x = -1 * position.x;
    model.bonesOffsetTN.position.z = -1 * position.z;
  }
  updateAvatarRender() {
    if (!this.initedAvatars)
      return;

    if (this.currentSeatMeshIndex === undefined)
      return;

    this._offsetBonesMovement(this.initedAvatars[this.currentSeatMeshIndex]);
  }
}
