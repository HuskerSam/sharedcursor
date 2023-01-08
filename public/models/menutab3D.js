import U3D from '/models/utility3d.js';

export default class MenuTab3D {
  constructor(app) {
    this.app = app;
    this.scene = app.scene;
    this.seatIndexColoredButtons = [];

    this.playerCardHollowMaterial = new BABYLON.StandardMaterial("menuCardBackPanel", this.app.scene);
    let t = new BABYLON.Texture('/images/cardhollow.png', this.app.scene);
    this.playerCardHollowMaterial.opacityTexture = t;

    let t2 = new BABYLON.Texture('/images/cardback.png', this.app.scene);
    this.playerCardbackMaterial = new BABYLON.StandardMaterial("cardbackmaterial", this.app.scene);
    this.playerCardbackMaterial.opacityTexture = t2;
  }
  _refreshSeatIndexStatus(forceRefresh = false) {
    if (this.seatIndexButtonColorCache === this.app.activeSeatIndex && !forceRefresh)
      return;

    let colors = U3D.get3DColors(this.app.activeSeatIndex);
    this.seatIndexButtonColorCache = this.app.activeSeatIndex;
    this.seatIndexColoredButtons.forEach(mesh => {
      let mat = mesh.material;

      if (mesh.button3DType) {
        mesh.mesh.material.albedoColor = colors;
      } else {
        mat.emissiveColor = colors;
        mat.diffuseColor = colors;
        mat.ambientColor = colors;
      }
    });

    this.playerCardHollowMaterial.diffuseColor = colors;
    this.playerCardHollowMaterial.ambientColor = colors;
    this.playerCardHollowMaterial.emissiveColor = colors;
    this.playerCardbackMaterial.diffuseColor = colors;
    this.playerCardbackMaterial.ambientColor = colors;
    this.playerCardbackMaterial.emissiveColor = colors;
  }
  obj(name) {
    return this.app.staticBoardObjects[name];
  }
  initOptionsBar() {
    let scoreMenuBtn = this.addActionPanelButton('score', "History", () => this.selectedMenuBarTab(this.scoreMenuTab));
    scoreMenuBtn.parent = this.app.menuBarTabButtonsTN;
    scoreMenuBtn.position = U3D.v(-14, 0, 0);

    let optionsMenuBtn = this.addActionPanelButton('gear', "Options", () => this.selectedMenuBarTab(this.optionsMenuTab));
    optionsMenuBtn.parent = this.app.menuBarTabButtonsTN;
    optionsMenuBtn.position = U3D.v(-10, 0, 0);

    let playersMoonsMenuBtn = this.addActionPanelButton('diversity', "Players", () => this.selectedMenuBarTab(this.playerMoonPanelTab));
    playersMoonsMenuBtn.parent = this.app.menuBarTabButtonsTN;
    playersMoonsMenuBtn.position = U3D.v(-6, 0, 0);

    let selectedObjectMenuBtn = this.addActionPanelButton('inspectobject', "Selection", () => this.selectedMenuBarTab(this.focusPanelTab));
    selectedObjectMenuBtn.parent = this.app.menuBarTabButtonsTN;
    selectedObjectMenuBtn.position = U3D.v(-2, 0, 0);

    let seatBackPanel = BABYLON.MeshBuilder.CreatePlane("menuTabButtonsPanel", {
      height: 4,
      width: 18
    }, this.app.scene);
    seatBackPanel.material = this.playerCardHollowMaterial;
    seatBackPanel.parent = this.app.menuBarTabButtonsTN;
    seatBackPanel.position = U3D.v(-8, 0, 0.05);

    this.scoreMenuTab = new BABYLON.TransformNode('scoreMenuTab', this.app.scene);
    this.scoreMenuTab.parent = this.app.menuBarLeftTN;
    this.scoreMenuTab.position = U3D.v(0, 6, this.app.menuBarTabButtonsTN.position.z);
    this.scoreMenuTab.setEnabled(false);
    this.initScoreTab();

    this.optionsMenuTab = new BABYLON.TransformNode('optionsMenuTab', this.app.scene);
    this.optionsMenuTab.parent = this.app.menuBarLeftTN;
    this.optionsMenuTab.position = U3D.v(0, 6, this.app.menuBarTabButtonsTN.position.z);
    this.optionsMenuTab.setEnabled(false);

    this.focusPanelTab = new BABYLON.TransformNode('focusPanelTab', this.app.scene);
    this.focusPanelTab.parent = this.app.menuBarLeftTN;
    this.focusPanelTab.position = U3D.v(0, 6, this.app.menuBarTabButtonsTN.position.z);
    this.focusPanelTab.setEnabled(false);
    this.initFocusedAssetPanel();

    this.playerMoonPanelTab = new BABYLON.TransformNode('playerMoonPanelTab', this.app.scene);
    this.playerMoonPanelTab.parent = this.app.menuBarLeftTN;
    this.playerMoonPanelTab.position = U3D.v(0, 6, this.app.menuBarTabButtonsTN.position.z);
    this.playerMoonPanelTab.setEnabled(false);
    this.initPlayerPanel();
  }
  addActionPanelLabel(text, font_family = "Arial", handlePointerDown, dontAddToUpdateArray = false) {
    let id = text;
    let font_size = 192;
    let paddingSides = 10;
    let bold = '';
    let font = bold + " " + font_size + "px " + font_family;
    let planeHeight = 4;
    let DTHeight = 1.5 * font_size;
    let ratio = planeHeight / DTHeight;
    let temp = new BABYLON.DynamicTexture(id + "dt2", {}, this.app.scene);
    let tmpctx = temp.getContext();
    tmpctx.font = font;
    let DTWidth = tmpctx.measureText(text).width + paddingSides;
    temp.dispose();
    let planeWidth = DTWidth * ratio;
    let dynamicTexture = new BABYLON.DynamicTexture(id + "dt", {
      width: DTWidth,
      height: DTHeight
    }, this.app.scene, false);
    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(text, null, 205, font, 'rgb(255, 255, 255)', 'transparent', true);

    let mat = new BABYLON.StandardMaterial(id + "mat", this.app.scene);
    mat.opacityTexture = dynamicTexture;
    mat.emissiveColor = new BABYLON.Color3(0, 0.5, 1);
    mat.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
    mat.ambientColor = new BABYLON.Color3(0.25, 0, 1);

    let mesh = BABYLON.MeshBuilder.CreatePlane(id + "textplane", {
      width: planeWidth,
      height: planeHeight,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.app.scene);
    mesh.material = mat;

    if (handlePointerDown) {
      mesh.assetMeta = {
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown
      };
    } else {
      mesh.isPickable = false;
    }

    if (!dontAddToUpdateArray)
      this.seatIndexColoredButtons.push(mesh);
    return mesh;
  }
  addActionPanelButton(iconName, text, handlePointerDown) {
    let texturePath = '/fontcons/' + iconName + '.svg';
    let button = new BABYLON.GUI.HolographicButton(iconName);
    let mesh = new BABYLON.TransformNode(iconName + 'TN', this.app.scene);
    this.app.gui3DManager.addControl(button);
    button.linkToTransformNode(mesh);
    button.scaling = U3D.v(3);
    button.text = text;
    button.imageUrl = texturePath;

    if (handlePointerDown) {
      button.onPointerDownObservable.add(() => {
        handlePointerDown();
      });
    }

    return mesh;
  }
  selectedMenuBarTab(menuTabToShow) {
    if (this.currentSelectedTab)
      this.currentSelectedTab.setEnabled(false);

    if (this.currentSelectedTab === menuTabToShow) {
      this.currentSelectedTab = null;
    } else {
      if (menuTabToShow)
        menuTabToShow.setEnabled(true);
      this.currentSelectedTab = menuTabToShow;
    }
  }
  removeDisposeActionMesh(mesh) {
    if (!mesh)
      return;
    this.seatIndexColoredButtons = this.seatIndexColoredButtons.filter(colorMesh => colorMesh != mesh)
    mesh.dispose(false, true);
  }

  initOptionsTab() {}
  initScoreTab() {
    let nextTurnButton = this.addActionPanelLabel('Finish Turn', "Arial", () => this.app.clickEndTurn());
    nextTurnButton.parent = this.scoreMenuTab;
    nextTurnButton.position = U3D.v(-5, 6, 0);

    let nextSelectedMetaBtn = this.addActionPanelButton('next', "Next Round", () => this.app.paintedBoardTurn = this.app.paintedBoardTurn + 1);
    nextSelectedMetaBtn.parent = this.scoreMenuTab;
    nextSelectedMetaBtn.position = U3D.v(-14, 6, 0);

    let previousSelectedMetaBtn = this.addActionPanelButton('previous', "Previous Round", () => this.app.paintedBoardTurn = this.app.paintedBoardTurn - 1);
    previousSelectedMetaBtn.position = U3D.v(-28, 6, 0);
    previousSelectedMetaBtn.parent = this.scoreMenuTab;
  }
  updateRoundAndScoreStatus() {
    if (this.app.boardTurnLabel !== this.paintedLabel) {
      this.paintedLabel = this.app.boardTurnLabel;
      this.removeDisposeActionMesh(this.selectedRoundIndexPanel);
      this.selectedRoundIndexPanel = this.addActionPanelLabel(this.app.boardTurnLabel);
      this.selectedRoundIndexPanel.parent = this.scoreMenuTab;
      this.selectedRoundIndexPanel.position = U3D.v(-21, 6, 0);
    }

    this._refreshSeatIndexStatus(true);
  }

  async initFocusedAssetPanel() {
    let scene = this.app.scene;

    let nextSelectedMetaBtn = this.addActionPanelButton('next', "Next Asset", () => this.nextSelectedObject());
    nextSelectedMetaBtn.position = U3D.v(-6, 0, 0);
    nextSelectedMetaBtn.parent = this.focusPanelTab;

    let previousSelectedMetaBtn = this.addActionPanelButton('previous', "Previous Asset", () => this.nextSelectedObject(true));
    previousSelectedMetaBtn.position = U3D.v(-10, 0, 0);
    previousSelectedMetaBtn.parent = this.focusPanelTab;

    let followSelectedMetaBtn = this.addActionPanelButton("eye", "Follow [B]", () => this.app.bButtonPress());
    followSelectedMetaBtn.position = U3D.v(-14, 0, 0);
    followSelectedMetaBtn.parent = this.focusPanelTab;

    let followStopBtn = this.addActionPanelButton("xmark", 'Stop [A]', () => this.app.aButtonPress());
    followStopBtn.position = U3D.v(-18, 0, 0);
    followStopBtn.parent = this.focusPanelTab;

    this.normalAssetSizeBtn = this.addActionPanelButton("military", 'Better', () => {
      this.normalAssetSizeBtn.setEnabled(false);
      this.updateAssetSize('normal');
    });
    this.normalAssetSizeBtn.position = U3D.v(-18, 4, 0);
    this.normalAssetSizeBtn.parent = this.focusPanelTab;

    this.assetPanelHugeButton = this.addActionPanelButton("moon", 'Best', () => {
      this.assetPanelHugeButton.setEnabled(false);
      this.updateAssetSize('huge');
    });
    this.assetPanelHugeButton.position = U3D.v(-14, 4, 0);
    this.assetPanelHugeButton.parent = this.focusPanelTab;

    this.assetSmallSizeButton = this.addActionPanelButton("robot", 'Normal', () => {
      this.assetSmallSizeButton.setEnabled(false);
      this.updateAssetSize('small');
    });
    this.assetSmallSizeButton.position = U3D.v(-10, 4, 0);
    this.assetSmallSizeButton.parent = this.focusPanelTab;

    this.setSelectedAsset(this.obj('e1_luna').assetMeta);

    this.playerCardsTN = new BABYLON.TransformNode('playerCardsTN', scene);
    this.playerCardsTN.parent = this.focusPanelTab;
    this.playerCardsTN.position.y = 6;
    this.playerCardsTN.position.z = 4;
  }
  updateAssetSizeButtons() {
    let meta = this.selectedObjectMeta;
    if (meta.asteroidType || meta.avatarType) {
      this.normalAssetSizeBtn.setEnabled(false);
      this.assetSmallSizeButton.setEnabled(false);
      this.assetPanelHugeButton.setEnabled(false);

      return;
    }

    let smallSize = meta.smallglbpath ? true : false;
    let hugeSize = meta.largeglbpath ? true : false;

    let isSmallSize = meta.extended.smallGlbPath === meta.extended.glbPath;
    let isHugeSize = meta.extended.largeGlbPath === meta.extended.glbPath;
    let isNormalSize = meta.extended.normalGlbPath === meta.extended.glbPath;

    this.normalAssetSizeBtn.setEnabled(!isNormalSize);
    this.assetSmallSizeButton.setEnabled(smallSize && !isSmallSize);
    this.assetPanelHugeButton.setEnabled(hugeSize && !isHugeSize);
  }
  async updateAssetSize(size) {
    let meta = this.selectedObjectMeta;
    let id = meta.id;
    if (this.obj(id)) {
      if (size === 'huge')
        meta.containerPath = meta.extended.largeGlbPath;
      if (size === 'normal')
        meta.containerPath = meta.extended.normalGlbPath;
      if (size === 'small')
        meta.containerPath = meta.extended.smallGlbPath;

      let freshMesh = await U3D.loadStaticMesh(this.app.scene, meta.containerPath, meta);
      freshMesh.parent = this.obj(id).baseMesh.parent;
      U3D.sizeNodeToFit(freshMesh, meta.sizeBoxFit);
      freshMesh.setEnabled(true);
      this.obj(id).baseMesh.dispose();
      this.obj(id).baseMesh = freshMesh;
    }

    await this.app.updateProfileMeshOverride(id, size);
    this.obj(id).assetMeta.extended = U3D.processStaticAssetMeta(this.obj(id).assetMeta, this.app.profile);
    this.setSelectedAsset(this.obj(id).assetMeta);
  }
  async setSelectedAsset(assetMeta) {
    this.spinPauseMeta = assetMeta;
    this.selectedObjectMeta = this.spinPauseMeta;

    let desc = assetMeta.name;
    if (desc.indexOf('.obj') !== -1) {
      desc = desc.replace('.obj', '');
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    }

    if (this.selectedContainerTransform)
      this.selectedContainerTransform.dispose();

    this.selectedContainerTransform = new BABYLON.TransformNode('selectedContainerTransform', this.scene);
    this.selectedContainerTransform.parent = this.focusPanelTab;
    this.selectedContainerTransform.position.x = 4;
    this.selectedContainerTransform.position.z = 8;
    this.selectedContainerTransform.position.y = 9;
    this.selectedContainerTransform.rotation.y = Math.PI;

    let result, mesh;
    if (assetMeta.avatarType) {
      result = this.app.avatarHelper.avatarContainers[assetMeta.name].instantiateModelsToScene();
      mesh = result.rootNodes[0];
      result.animationGroups[0].stop();
      result.skeletons[0].returnToRest();
    } else {
      mesh = await U3D.loadStaticMesh(this.app.scene, assetMeta.containerPath, assetMeta);
    }

    let animDetails = U3D.selectedRotationAnimation(mesh, this.app.scene, assetMeta.avatarType);
    mesh.parent = animDetails.rotationPivot;
    animDetails.rotationPivot.parent = this.selectedContainerTransform;

    mesh.assetMeta = {
      activeSelectedObject: true,
      appClickable: true,
      baseMesh: mesh,
      basePivot: animDetails.rotationPivot,
      clickCommand: 'customClick',
      rotationAnimation: animDetails.runningAnimation,
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.pauseAssetSpin(pointerInfo, mesh, meta);
      }
    };
    let factor = 3;
    if (this.app.inXR) {
      factor = 0.35;
    }
    U3D.sizeNodeToFit(mesh, factor);
    mesh.setEnabled(true);

    if (assetMeta.asteroidType || assetMeta.wireframe)
      mesh.material = this.app.asteroidHelper.selectedAsteroidMaterial;

    if (this.selectedAssetLabel)
      this.selectedAssetLabel.dispose(false, true);

    this.selectedAssetLabel = U3D.addTextPlane(this.app.scene, desc, U3D.color("0,0,1"));
    this.selectedAssetLabel.position.x = 2;
    this.selectedAssetLabel.position.y = 0;
    this.selectedAssetLabel.position.z = -4;
    this.selectedAssetLabel.scaling = U3D.v(1.5);
    this.selectedAssetLabel.parent = this.focusPanelTab;

    this.updateAssetSizeButtons();
    if (this.app.actionCardHelper)
      this.app.actionCardHelper.updateCardsForPlayer();
  }
  nextSelectedObject(previous = false) {
    let meta = this.selectedObjectMeta;
    let id = meta.id;
    let factor = previous ? -1 : 1;
    if (meta.asteroidType) {
      let keys = Object.keys(this.app.asteroidHelper.loadedAsteroids).sort();

      let index = keys.indexOf(meta.name);
      let nextIndex = index + factor;
      if (nextIndex < 0)
        nextIndex = keys.length - 1;
      if (nextIndex > keys.length - 1)
        nextIndex = 0;

      let key = keys[nextIndex];
      this.setSelectedAsset(this.app.asteroidHelper.loadedAsteroids[key].orbitWrapper.assetMeta);
    } else if (meta.avatarType) {
      let index = meta.seatIndex++;
      if (index > 3)
        index = 0;

      this.setSelectedAsset(this.app.avatarHelper.initedAvatars[index].TN2.assetMeta);
    } else if (meta.actionCardType) {
      let index = meta.cardIndex + 1;
      if (index > 5) index = 0;
      this.setSelectedAsset(this.app.actionCardHelper.cardItemMeta[index]);
    } else {
      let keys = Object.keys(this.app.staticBoardObjects).sort((a, b) => {
        if (this.obj(a).assetMeta.name > this.obj(b).assetMeta.name)
          return 1;
        if (this.obj(a).assetMeta.name < this.obj(b).assetMeta.name)
          return -1;
        return 0;
      });
      let index = keys.indexOf(id);
      let nextIndex = index + factor;
      if (nextIndex < 0)
        nextIndex = keys.length - 1;
      if (nextIndex > keys.length - 1)
        nextIndex = 0;

      let key = keys[nextIndex];
      this.setSelectedAsset(this.obj(key).assetMeta);
    }
  }

  _initMoonFlagPole(seatIndex) {
    let flagPoleHolder = new BABYLON.TransformNode('flagpoleholder' + seatIndex, this.app.scene);
    let moonAssetId = this.app.playerMoonAssets[seatIndex].assetMeta.id;
    flagPoleHolder.parent = this.app.parentPivot(moonAssetId);
    flagPoleHolder.scaling = U3D.v(0.2);
    flagPoleHolder.position.y = 0.45;
    flagPoleHolder.billboardMode = 7;

    let moonFlagBack = BABYLON.MeshBuilder.CreatePlane("flagback" + seatIndex, {
      height: 1.75,
      width: 2.5,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.app.scene);
    moonFlagBack.material = this.dockSeatContainers[seatIndex].playerColorMaterial;
    moonFlagBack.parent = flagPoleHolder;
    moonFlagBack.position.y = 4.5;
    moonFlagBack.position.x = 1.25;
    let moonFlagPole = BABYLON.MeshBuilder.CreateCylinder("flagpole" + seatIndex, {
      height: 3,
      diameter: 0.25,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.app.scene);
    moonFlagPole.material = this.dockSeatContainers[seatIndex].playerColorMaterial;
    moonFlagPole.parent = flagPoleHolder;
    moonFlagPole.position.y = 3.5;
    moonFlagPole.position.x = 0;

    let imageFront = BABYLON.MeshBuilder.CreatePlane("avatarimageplane" + seatIndex, {
        height: 1.5,
        width: 1.5,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
      },
      this.app.scene);
    imageFront.position.y = 4.5;
    imageFront.position.x = 1.25;
    imageFront.position.z = -0.05;
    imageFront.material = this.dockSeatContainers[seatIndex].playerImageMaterial;
    imageFront.parent = flagPoleHolder;
  }
  initPlayerPanel() {
    this.dockSeatContainers = [];
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      let colors = U3D.get3DColors(seatIndex);
      let playerColor = new BABYLON.Color3(colors.r, colors.g, colors.b);

      let dockSeatContainer = new BABYLON.TransformNode('dockSeatContainer' + seatIndex, this.app.scene);
      this.dockSeatContainers.push(dockSeatContainer);
      dockSeatContainer.position.x = -18 + (seatIndex * 7);
      dockSeatContainer.parent = this.app.menuTab3D.playerMoonPanelTab;

      dockSeatContainer.playerImageMaterial = new BABYLON.StandardMaterial('playerlogomatertial' + seatIndex, this.app.scene);
      dockSeatContainer.playerImageMaterial.alpha = 0;

      dockSeatContainer.playerColorMaterial = new BABYLON.StandardMaterial('playercolormaterial' + seatIndex, this.app.scene);
      dockSeatContainer.playerColorMaterial.diffuseColor = playerColor;
      dockSeatContainer.playerColorMaterial.ambientColor = playerColor;
      dockSeatContainer.playerColorMaterial.emissiveColor = playerColor;

      this._initMoonFlagPole(seatIndex);

      let seatMenuContainerTN = new BABYLON.TransformNode('seatMenuContainerTN' + seatIndex, this.app.scene);
      seatMenuContainerTN.position.y = 6;
      seatMenuContainerTN.parent = this.dockSeatContainers[seatIndex];

      let seatBackPanel = BABYLON.MeshBuilder.CreatePlane("seatBackPanel" + seatIndex, {
        height: 8,
        width: 6
      }, this.app.scene);
      let panelMat = new BABYLON.StandardMaterial("menuCardBackPanel" + seatIndex, this.app.scene);
      let t = new BABYLON.Texture('/images/cardhollow.png', this.app.scene);
      panelMat.opacityTexture = t;
      panelMat.diffuseColor = playerColor;
      panelMat.ambientColor = playerColor;
      panelMat.emissiveColor = playerColor;

      seatBackPanel.material = panelMat;
      seatBackPanel.parent = seatMenuContainerTN;
    }
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
  async updatePlayerDock() {
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      let active = (seatIndex < this.app.seatCount)
      let seatData = this.getSeatData(seatIndex);
      let cacheValue = 'empty';
      if (active)
        cacheValue = seatData.name + seatData.image + seatData.seated.toString();

      if (this['dockSeatCache' + seatIndex] !== cacheValue) {
        this['dockSeatCache' + seatIndex] = cacheValue;
        let seatContainer = this.dockSeatContainers[seatIndex];
        if (seatContainer.playerDetailsTN) {
          seatContainer.playerDetailsTN.dispose(false, true);
          seatContainer.playerDetailsTN = null;
        }
        seatContainer.playerDetailsTN = new BABYLON.TransformNode("playerDetailsTN" + seatIndex, this.app.scene);
        seatContainer.playerDetailsTN.parent = seatContainer;

        let color = U3D.get3DColors(seatIndex);
        if (active) {
          let meta = seatContainer.assetMeta;

          if (seatData.seated) {
            let names = seatData.name.split(' ');
            seatContainer.namePlate1 = U3D.addTextPlane(this.app.scene, names[0], color);
            seatContainer.namePlate1.position = U3D.v(0, 4.5, 6.25);
            seatContainer.namePlate1.parent = seatContainer.playerDetailsTN;

            if (names[1]) {
              seatContainer.namePlate2 = U3D.addTextPlane(this.app.scene, names[1], color);
              seatContainer.namePlate2.position = U3D.v(0, 3, 3);
              seatContainer.namePlate2.parent = seatContainer.playerDetailsTN;
            }

            if (this.app.uid === seatData.uid || this.app.isOwner) {
              let gameOwnerNotPlayer = (this.app.uid !== seatData.uid && this.app.isOwner);
              let character = gameOwnerNotPlayer ? "Boot" : 'Stand';

              let standBtn = U3D.addTextPlane(this.app.scene, character, color);
              standBtn.position = U3D.v(1, 7, 0);
              standBtn.parent = seatContainer.playerDetailsTN;
              standBtn.assetMeta = {
                appClickable: true,
                clickCommand: 'customClick',
                handlePointerDown: async () => {
                  this.app._gameAPIStand(seatIndex);
                  standBtn.dispose(false, true);
                }
              };
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
            seatContainer.playerImageMaterial.alpha = 1;
          } else {
            let sitBtn = U3D.addTextPlane(this.app.scene, "Sit", color);
            sitBtn.position.y = 7;
            sitBtn.position.z = 0;
            sitBtn.assetMeta = {
              seatIndex,
              appClickable: true,
              clickCommand: 'customClick',
              handlePointerDown: async (pointerInfo, mesh, meta) => {
                this.app.dockSit(seatIndex);
                sitBtn.dispose(false, true);
              }
            };
            sitBtn.parent = seatContainer.playerDetailsTN;
            seatContainer.playerImageMaterial.alpha = 0;
          }
        } else {
          seatContainer.namePlate1 = U3D.addTextPlane(this.app.scene, 'Husker AI', color);
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
          seatContainer.playerImageMaterial.alpha = 1;
        }
      }
    }

    this.updateUserPresence();
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
}
