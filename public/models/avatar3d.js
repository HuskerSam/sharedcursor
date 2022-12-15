import U3D from '/models/utility3d.js';

export default class Avatar3D {
  constructor(app) {
    this.app = app;
    this.gameData = this.app.gameData;

    this.dockDiscRadius = .6;
    this.seatMeshes = {};

    for (let key in this.app.staticAssetMeshes) {
      let assetMesh = this.app.staticAssetMeshes[key];
      if (assetMesh.assetMeta.seatIndex !== undefined)
        this.seatMeshes[assetMesh.assetMeta.seatIndex] = assetMesh;
    }
  }
  updateSelectedSeatMesh() {
    let seatIndex = this.gameData.currentSeat;
    if (this.app.currentSeatMeshIndex === seatIndex)
      return;

    if (!this.app.runRender)
      return;

    let seatWrapperMesh = this['dockSeatMesh' + seatIndex];

    if (!seatWrapperMesh)
      return;

    let seatMesh = this.seatMeshes[seatIndex];
    this.currentSeatMesh = seatMesh;

    this.selectedPlayerPanel.parent = seatWrapperMesh;
    this.selectedMoonPanel.parent = this.seatMeshes[seatIndex].assetMeta.basePivot;
    this.selectedPlayerPanel.position.y = 4;
    this.selectedMoonPanel.position.y = 3;

    let colors = this.get3DColors(seatIndex);
    this.selectedPlayerPanel.material.diffuseColor = new BABYLON.Color3(colors.r, colors.g, colors.b);
    this.selectedPlayerPanel.material.ambientColor = new BABYLON.Color3(colors.r, colors.g, colors.b);
    this.selectedPlayerPanel.material.emissiveColor = new BABYLON.Color3(colors.r, colors.g, colors.b);

    this.currentSeatMeshIndex = seatIndex;
  }
  async renderSeatAvatar(wrapper, avatarWrapper, index) {
    let seatData = this.getSeatData(index);
    let colors = this.get3DColors(index);
    let uid = seatData.uid;

    let mesh = new BABYLON.TransformNode("seatmeshtn" + index, this.scene);
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
      this.scene);
    plane.parent = mesh;
    plane.position.y = 1;

    let m = new BABYLON.StandardMaterial('avatarshowmat' + name, this.scene);
    let t = new BABYLON.Texture(seatData.image, this.scene);
    t.vScale = 1;
    t.uScale = 1;
    t.hasAlpha = true;

    m.diffuseTexture = t;
    m.emissiveTexture = t;
    m.ambientTexture = t;

    plane.material = m;

    let isOwner = this.uid === this.gameData.createUser;
    if (this.uid === uid || isOwner) {
      let color = (this.uid !== uid && isOwner) ? "#ffffff" : '#000000';
      let standBtn = U3D.addTextPlane(this.scene, "X", 'seattextX' + index, "Impact", "", color);
      standBtn.scaling = U3D.v(2, 2, 2);
      standBtn.position.x = 0.4;
      standBtn.position.y = 1.9;
      standBtn.parent = mesh;
      standBtn.assetMeta = {
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this._gameAPIStand(index);
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

      let standBtn = U3D.addTextPlane(this.scene, "Sit", 'seatsitbtn' + index, "Arial", "", rgb);
      standBtn.position.y = 1;
      standBtn.assetMeta = {
        seatIndex: index,
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.dockSit(index);
        }
      };

      standBtn.parent = seat;
      seat.standButton = standBtn;
    }
  }
  async renderSeat(index) {
    let wrapper = new BABYLON.TransformNode('seatwrapper' + index, this.scene);

    let avatarWrapper = new BABYLON.TransformNode('seatavatarwrapper' + index, this.scene);
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
    if (this.gameData[key]) {
      name = this.gameData.memberNames[this.gameData[key]];
      if (!name) name = "Anonymous";
      avatar = this.gameData.memberAvatars[this.gameData[key]];
      if (!avatar) avatar = "male1";
      image = this.gameData.memberImages[this.gameData[key]];
      if (!image) image = "";

      uid = this.gameData[key];
      seated = true;
    }

    return {
      seated,
      name,
      key,
      avatar,
      image,
      uid: this.gameData[key]
    };
  }
  async updateAvatarStatus() {
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      if (seatIndex < this.runningSeatCount) {
        let data = this.getSeatData(seatIndex);
        let cacheValue = data.name + data.image + data.seated.toString();
        if (!this['dockSeatMesh' + seatIndex]) {
          let mesh = await this.renderSeat(seatIndex);

          mesh.parent = this.menuTab3D.playerMoonPanelTab;

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
    if (this.initedAvatars === 'loading')
      return;

    if (!this.initedAvatars) {
      this.initedAvatars = true;
      let result = await U3D._initAvatars(this.app.scene);
      this.initedAvatars = result.initedAvatars;
      this.avatarContainers = result.avatarContainers;
    }

    this.initedAvatars.forEach(container => {
      let arr = container.animContainer.animationGroups;
      let index = Math.floor(Math.random() * arr.length);

      U3D.avatarSequence(container, index, this.scene);
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
          let online = this.userPresenceStatus[seatData.uid] === true;
          let mat1 = new BABYLON.StandardMaterial('onlinespheremat' + c, this.scene);
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
          }, this.scene);
          sphere.position.y = 1.85;
          sphere.position.x = .25;
          sphere.material = mat1;
          sphere.parent = seat;
          seat.onlineSphere = sphere;
        }
      }
    }
  }
}
