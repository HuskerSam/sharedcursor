import U3D from '/models/utility3d.js';

export default class Avatar3D {
  constructor(app) {
    this.app = app;
    this.app.gameData = this.app.gameData;

    this.dockDiscRadius = .6;
    this.seatMeshes = {};

    for (let key in this.app.staticAssetMeshes) {
      let assetMesh = this.app.staticAssetMeshes[key];
      if (assetMesh.assetMeta.seatIndex !== undefined)
        this.seatMeshes[assetMesh.assetMeta.seatIndex] = assetMesh;
    }
  }
  updateSelectedSeatMesh() {
    let seatIndex = this.app.gameData.currentSeat;
    if (this.app.currentSeatMeshIndex === seatIndex)
      return;

    let seatWrapperMesh = this['dockSeatMesh' + seatIndex];

    if (!seatWrapperMesh)
      return;

    let seatMesh = this.seatMeshes[seatIndex];
    this.currentSeatMesh = seatMesh;

    this.app.selectedPlayerPanel.parent = seatWrapperMesh;
    this.app.selectedMoonPanel.parent = this.seatMeshes[seatIndex].assetMeta.basePivot;
    this.app.selectedPlayerPanel.position.y = 4;
    this.app.selectedMoonPanel.position.y = 3;

    let colors = this.get3DColors(seatIndex);
    this.app.selectedPlayerPanel.material.diffuseColor = new BABYLON.Color3(colors.r, colors.g, colors.b);
    this.app.selectedPlayerPanel.material.ambientColor = new BABYLON.Color3(colors.r, colors.g, colors.b);
    this.app.selectedPlayerPanel.material.emissiveColor = new BABYLON.Color3(colors.r, colors.g, colors.b);

    this.currentSeatMeshIndex = seatIndex;
  }
  async renderSeatAvatar(wrapper, avatarWrapper, index) {
    let seatData = this.getSeatData(index);
    let colors = this.get3DColors(index);
    let uid = seatData.uid;

    let mesh = new BABYLON.TransformNode("seatmeshtn" + index, this.app.scene);
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;
    mesh.parent = avatarWrapper;
    wrapper.avatarMesh = mesh;
    seatData.avatarMesh = mesh;

    const plane = BABYLON.MeshBuilder.CreatePlane("avatarimage" + index, {
        height: 2,
        width: 1,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
      },
      this.app.scene);
    plane.parent = mesh;
    plane.position.y = 1;

    let m = new BABYLON.StandardMaterial('avatarshowmat' + name, this.app.scene);
    let t = new BABYLON.Texture(seatData.image, this.app.scene);
    t.vScale = 1;
    t.uScale = 1;
    t.hasAlpha = true;

    m.diffuseTexture = t;
    m.emissiveTexture = t;
    m.ambientTexture = t;

    plane.material = m;

    let isOwner = this.app.uid === this.app.gameData.createUser;
    if (this.app.uid === uid || isOwner) {
      let color = (this.app.uid !== uid && isOwner) ? "#ffffff" : '#000000';
      let standBtn = U3D.addTextPlane(this.app.scene, "X", 'seattextX' + index, "Impact", "", color);
      standBtn.scaling = U3D.v(2, 2, 2);
      standBtn.position.x = 0.4;
      standBtn.position.y = 1.9;
      standBtn.parent = mesh;
      standBtn.assetMeta = {
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app._gameAPIStand(index);
        }
      };
    }
  }
  async updateSeat(index) {
    let seatData = this.getSeatData(index);
    let colors = this.get3DColors(index);

    let seat = this['dockSeatMesh' + index];
    let meta = seat.assetMeta;
    if (seat.avatarMesh) {
      seat.avatarMesh.dispose();
      seat.avatarMesh = null;
    }

    if (seat.name3d) {
      seat.name3d.dispose();
      seat.name3d = null;
    }

    if (seat.standButton) {
      seat.standButton.dispose();
      seat.standButton = null;
    }

    if (seatData.seated) {
      await this.renderSeatAvatar(seat, seat.avatarWrapper, index);
    } else {
      let colors = this.get3DColors(index);
      let rgb = U3D.colorRGB255(colors.r + ',' + colors.g + ',' + colors.b);

      let standBtn = U3D.addTextPlane(this.app.scene, "Sit", 'seatsitbtn' + index, "Arial", "", rgb);
      standBtn.position.y = 1;
      standBtn.assetMeta = {
        seatIndex: index,
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app.dockSit(index);
        }
      };

      standBtn.parent = seat;
      seat.standButton = standBtn;
    }
  }
  async renderSeat(index) {
    let wrapper = new BABYLON.TransformNode('seatwrapper' + index, this.app.scene);

    let avatarWrapper = new BABYLON.TransformNode('seatavatarwrapper' + index, this.app.scene);
    avatarWrapper.rotation.y = Math.PI;
    avatarWrapper.parent = wrapper;
    wrapper.avatarWrapper = avatarWrapper;


    wrapper.position.x = 2 - (index * 1.5);

    return wrapper;
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
  async updateAvatarStatus() {
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      if (seatIndex < this.app.runningSeatCount) {
        let data = this.getSeatData(seatIndex);
        let cacheValue = data.name + data.image + data.seated.toString();
        if (!this['dockSeatMesh' + seatIndex]) {
          let mesh = await this.renderSeat(seatIndex);

          mesh.parent = this.app.menuTab3D.playerMoonPanelTab;

          this['dockSeatMesh' + seatIndex] = mesh;
        } else if (this['dockSeatCache' + seatIndex] !== cacheValue) {
          await this.updateSeat(seatIndex);
          this['dockSeatCache' + seatIndex] = cacheValue;
        }
      } else {
        if (this['dockSeatMesh' + seatIndex]) {
          this['dockSeatMesh' + seatIndex].dispose();
          this['dockSeatMesh' + seatIndex] = null;
          this['dockSeatCache' + seatIndex] = '';
        }
      }
    }

    this.updateUserPresence();
    this.updateSelectedSeatMesh();

    this.avatarsLoaded = true;
  }
  async randomizeAnimations() {
    if (!this._initedAvatars) {
      await this._initAvatars();
      this._initedAvatars = true;
    }

    this.initedAvatars.forEach(container => {
      let arr = container.animContainer.animationGroups;
      let index = Math.floor(Math.random() * arr.length);

      this.avatarSequence(container, index);
    });
  }
  async updateUserPresence() {
    for (let c = 0; c < 4; c++) {
      let seat = this['dockSeatMesh' + c];
      if (seat) {
        if (seat.onlineSphere) {
          seat.onlineSphere.dispose();
          seat.onlineSphere = null;
        }

        let seatData = this.getSeatData(c);
        if (seatData.seated) {
          let online = this.app.userPresenceStatus[seatData.uid] === true;
          let mat1 = new BABYLON.StandardMaterial('onlinespheremat' + c, this.app.scene);
          let color = new BABYLON.Color3(1, 1, 1);
          if (online) {
            color = new BABYLON.Color3(0, 2, 0)
            //  mat1.emissiveColor = color;
            mat1.ambientColor = color;
          }
          mat1.diffuseColor = color;

          let sphere = BABYLON.MeshBuilder.CreateSphere("onlinesphere" + c, {
            diameter: .25,
            segments: 16
          }, this.app.scene);
          sphere.position.y = 1.85;
          sphere.position.x = .25;
          sphere.material = mat1;
          sphere.parent = seat;
          seat.onlineSphere = sphere;
        }
      }
    }
  }
  async _initAvatars() {
    let scene = this.app.scene;
    let initedAvatars = [];
    let avatarContainers = {};

    let avatarMetas = this.getAvatarData();
    for (let c = 0; c < 4; c++) {
      let avatarMeta = avatarMetas[c];
      let path = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' +
        encodeURIComponent('/avatars/' + avatarMeta.path) + '?alt=media';

      let container = await U3D.loadContainer(scene, path);
      container.avatarMeta = avatarMeta;
      avatarContainers[avatarMeta.name] = container;
    }

    for (let c = 0; c < 4; c++) {
      let newModel;
      let avatarMeta = avatarMetas[c];
      if (avatarMeta.cloneAnimations) {
        newModel = avatarContainers[avatarMeta.cloneAnimations].instantiateModelsToScene();
        let newSkin = avatarContainers[avatarMeta.name].instantiateModelsToScene();

        this.linkSkeletonMeshes(newModel.skeletons[0], newSkin.skeletons[0]);
        newModel.rootNodes[0].setEnabled(false);

        newSkin.animContainer = newModel;
        newModel = newSkin;
      } else {
        newModel = avatarContainers[avatarMeta.name].instantiateModelsToScene();
        newModel.animContainer = newModel;
      }

      initedAvatars.push(newModel);
      initedAvatars[c].animContainer.animationGroups[0].stop();

      let mesh = initedAvatars[c].rootNodes[0];
      let t = new BABYLON.TransformNode("tn" + mesh.id);
      t.position.x = avatarMeta.x;
      t.position.z = avatarMeta.z;
      //t.scaling = U3D.v(2, 2, 2);
      mesh.parent = t;
      newModel.TN = t;
      newModel.TN.avatarMeta = avatarMeta;


      scene.baseShadowGenerator.addShadowCaster(mesh);
    }


    this.initedAvatars = initedAvatars;
    this.avatarContainers = avatarContainers;
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
  async avatarSequence(avatarContainer, animationIndex) {
    let scene = this.app.scene;
    let arr = avatarContainer.animContainer.animationGroups;
    arr.forEach(anim => anim.stop());

    if (avatarContainer.offsetAnimation) {
      //stop previous
      avatarContainer.offsetAnimation.stop();
      avatarContainer.offsetAnimation = null;

      let mesh = avatarContainer.TN;
      let animIndex = mesh.animations.indexOf(avatarContainer.offsetPositionAnim);
      mesh.animations.splice(animIndex, 1);
      avatarContainer.offsetPositionAnim = null;
    }

    let animName = arr[animationIndex].name;
    const offsets = this.getAnimationOffsets();

    //start new offsets
    if (offsets[animName]) {
      let offsetInfo = offsets[animName];

      let offsetPositionAnim = new BABYLON.Animation(
        'offsetanimavatar' + animationIndex.toString(),
        "position",
        60,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      let mesh = avatarContainer.TN;
      let x = mesh.avatarMeta.x;
      let y = 0;
      let z = mesh.avatarMeta.z;
      let keys = [];
      let endFrame = offsetInfo.frames;

      let offsetX = 0;
      let offsetY = 0;
      let offsetZ = 0;
      if (offsetInfo.z)
        offsetZ = offsetInfo.z;
      if (offsetInfo.y)
        offsetY = offsetInfo.y;
      if (offsetInfo.x)
        offsetX = offsetInfo.x;

      keys.push({
        frame: 0,
        value: U3D.v(x, y, z)
      });

      keys.push({
        frame: endFrame,
        value: U3D.v(x - offsetX, y - offsetY, z - offsetZ)
      });

      offsetPositionAnim.setKeys(keys);

      if (!mesh.animations)
        mesh.animations = [];
      mesh.animations.push(offsetPositionAnim);
      avatarContainer.offsetAnimation = scene.beginAnimation(mesh, 0, endFrame, true);
      avatarContainer.offsetPositionAnim = offsetPositionAnim;

      arr[animationIndex].reset();
      arr[animationIndex].start(true);

      mesh.position.x = mesh.avatarMeta.x;
      mesh.position.z = mesh.avatarMeta.z;
    } else {
      arr[animationIndex].reset();
      arr[animationIndex].start(true);


      let mesh = avatarContainer.TN;
      mesh.position.x = mesh.avatarMeta.x;
      mesh.position.z = mesh.avatarMeta.z;
    }
  }
  getAvatarData() {
    return [{
        "name": "Terra",
        "path": "maria.glb",
        "cloneAnimations": "Daya",
        "x": -9,
        "z": -10,
        "race": "Human",
        "seatIndex": 0
      },
      {
        "name": "Jade",
        "path": "jolleen.glb",
        "cloneAnimations": "Daya",
        "x": -5,
        "z": -10,
        "race": "Botan",
        "seatIndex": 1
      },
      {
        "name": "Daya",
        "path": "jonesbase.glb",
        "x": -3,
        "z": -10,
        "race": "Avian",
        "seatIndex": 2
      },
      {
        "name": "Geronimo",
        "path": "maynard.glb",
        "cloneAnimations": "Daya",
        "x": -7,
        "z": -10,
        "race": "Titan",
        "seatIndex": 3
      }
    ]
  }
  getAnimationOffsets() {
    return {
      "Clone of jogging": {
        "z": 5.3,
        "frames": 156,
        "startRatio": 0.75
      },
      "Clone of strut": {
        "z": 1.5,
        "frames": 88
      },
      "Clone of walking": {
        "z": 1.78,
        "frames": 64
      },
      "Clone of femalewalk": {
        "z": 1.5,
        "frames": 72
      }
    };
  }

    get3DColors(index) {
      let r = 220 / 255,
        g = 220 / 255,
        b = 0;
      if (index === 1) {
        r = 0;
        g = 220 / 255;
        b = 210 / 255;
      }
      if (index === 2) {
        r = 230 / 255;
        g = 0;
        b = 230 / 255;
      }
      if (index === 3) {
        r = 150 / 255;
        g = 130 / 255;
        b = 255 / 255;
      }

      return new BABYLON.Color3(r, g, b);
    }
}
