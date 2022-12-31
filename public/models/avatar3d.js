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
      "walking"
    ]

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
          sphere.position.y = 7;
          sphere.position.x = -1;
          sphere.position.z = 4;
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
      let moonCloneMesh = await U3D.loadStaticMesh(this.app.scene, moonCloneMeta.containerPath, moonCloneMeta);
      moonCloneMesh.setEnabled(true);
      let moonCloneTN = new BABYLON.TransformNode('moonCloneTN' + seatIndex, this.app.scene);
      this.app.playerMoonAssets[seatIndex].moonCloneMesh = moonCloneMesh;
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

      let moonFlagBack2 = moonFlagBack.clone();
      let moonFlagPole2 = moonFlagPole.clone();
      let flagPoleHolder = new BABYLON.TransformNode('flagpoleholder' + seatIndex, this.app.scene);
      flagPoleHolder.parent = this.app.parentPivot(moonCloneMeta.id);
      flagPoleHolder.scaling = U3D.v(0.2);
      flagPoleHolder.position.y = 0.45;
      moonFlagBack2.parent = flagPoleHolder;
      moonFlagPole2.parent = flagPoleHolder;

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
      let playerImagePlane1 = playerImagePlane.clone();
      let playerImagePlane2 = playerImagePlane.clone();
      playerImagePlane1.setEnabled(false);
      playerImagePlane2.setEnabled(false);
      playerImagePlane1.parent = flagPoleHolder;
      playerImagePlane2.parent = flagPoleHolder;
      dockSeatContainer.playerImagePlane = playerImagePlane;
      dockSeatContainer.playerImagePlane1 = playerImagePlane1;
      dockSeatContainer.playerImagePlane2 = playerImagePlane2;
      playerImagePlane2.position.z = 0.05;

      let avatarMeta = this.app.avatarMetas[seatIndex];
      let animationsBaseName = avatarMeta.cloneAnimations ? avatarMeta.cloneAnimations : avatarMeta.name;
      let newModel = this.avatarContainers[animationsBaseName].instantiateModelsToScene();
      this.menuBarAvatars.push(newModel);
      this.menuBarAvatars[seatIndex].animationGroups[0].stop();

      let avatarPositionTN = new BABYLON.TransformNode("menu3davatarpositionoffset" + seatIndex, this.app.scene);
      avatarPositionTN.position.y = -1;
      avatarPositionTN.position.z = 3;
      avatarPositionTN.rotation.y = Math.PI;
      avatarPositionTN.scaling = U3D.v(3);
      avatarPositionTN.parent = this.dockSeatContainers[seatIndex];
      this.menuBarAvatars[seatIndex].rootNodes[0].parent = avatarPositionTN;
      newModel.avatarPositionTN = avatarPositionTN;

      avatarPositionTN.assetMeta = {
        name: avatarMeta.name,
        extended: {},
        appClickable: true,
        avatarType: true,
        seatIndex: seatIndex,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.currentMenuAvatarTrackIndex++;
          if (this.currentMenuAvatarTrackIndex >= this.animationTracks.length)
            this.currentMenuAvatarTrackIndex = 0;
          this.avatarSequence(this.menuBarAvatars[seatIndex], this.animationTracks[this.currentMenuAvatarTrackIndex]);

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
    seatContainer.playerImagePlane1.setEnabled(false);
    seatContainer.playerImagePlane2.setEnabled(false);

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
          let color = gameOwnerNotPlayer ? "#ff2222" : '#00dd00';
          let standBtn = U3D.addDefaultText(this.app.scene, "X", color);
          standBtn.scaling = U3D.v(1.25, 1.25, 1.25);
          standBtn.position.x = 1;
          standBtn.position.y = 7;
          standBtn.position.z = 4;
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
        seatContainer.playerImagePlane1.setEnabled(true);
        seatContainer.playerImagePlane2.setEnabled(true);
      } else {
        let sitBtn = U3D.addDefaultText(this.app.scene, "Sit", rgb);
        sitBtn.position.y = 7;
        sitBtn.position.z = 4;
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
      seatContainer.playerImagePlane1.setEnabled(true);
      seatContainer.playerImagePlane2.setEnabled(true);
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

    let colors = this.get3DColors(seatIndex);
    let playerColor = new BABYLON.Color3(colors.r, colors.g, colors.b);

    this.menuBarAvatars.forEach((container, i) => {
      if (i === seatIndex) {
        this.avatarSequence(container, this.animationTracks[this.currentMenuAvatarTrackIndex]);
        this.runningAnimation = 0;
        container.rootNodes[0].setEnabled(true);
      } else {
        container.animationGroups.forEach(anim => anim.stop());
        container.rootNodes[0].setEnabled(false);
      }
    });
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

      scene.baseShadowGenerator.addShadowCaster(mesh);

      avatarPositionTN.assetMeta = {
        name: avatarMeta.name,
        extended: {},
        appClickable: true,
        avatarType: true,
        seatIndex,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app.menuTab3D.setSelectedAsset(meta);
        }
      };
    }

    this.initedAvatars = initedAvatars;
    this.avatarContainers = avatarContainers;
  }
  async avatarSequence(avatarContainer, animationName) {
    let animationIndex = this.getAnimIndex(avatarContainer, animationName);
    let arr = avatarContainer.animationGroups;
    arr.forEach(anim => anim.stop());

    let animName = arr[animationIndex].name;

    arr[animationIndex].start(true);
  }
  updateAvatarRender() {
    if (!this.initedAvatars)
      return;

    if (this.currentSeatMeshIndex === undefined)
      return;
  }
  getAnimIndex(avatar, animName) {
    let animIndex = -1;
     avatar.animationGroups.forEach((anim, i2) => {
       let shortName = anim.name.replace('Clone of ', '');
      if (anim.name === animName || shortName === animName)
        animIndex = i2;
    });

    return animIndex;
  }
}
