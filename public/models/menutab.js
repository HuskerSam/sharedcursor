import U3D from '/models/utility3d.js';

export default class MenuTab3D {
  constructor(app) {
    this.app = app;
    this.scene = app.scene;
    this.seatIndexColoredButtons = [];

    this.playerCardHollowMaterial = new BABYLON.StandardMaterial("menuCardBackPanel", this.app.scene);
    this.playerCardHollowMaterial.opacityTexture = new BABYLON.Texture('/images/cardhollow.png', this.app.scene);
    this.playerCardCrestedMaterial = new BABYLON.StandardMaterial("menuCardBackPanel", this.app.scene);
    this.playerCardCrestedMaterial.opacityTexture = new BABYLON.Texture('/images/cardcrested.png', this.app.scene);
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

    this.playerCardCrestedMaterial.diffuseColor = colors;
    this.playerCardCrestedMaterial.ambientColor = colors;
    this.playerCardCrestedMaterial.emissiveColor = colors;

    this._updateCurrentSelectedPlayerDescription();
  }
  obj(name) {
    return this.app.staticBoardObjects[name].assetMeta;
  }
  initOptionsBar() {
    let leftEdge = -20.75;
    let buttonSpace = 3.1;
    this.previousTurnButton = this.addActionPanelButton('/fontcons/previousround.png', "Previous Round", () => this.app.paintedBoardTurn = this.app.paintedBoardTurn - 1);
    this.previousTurnButton.parent = this.app.menuBarTabButtonsTN;
    this.previousTurnButton.position = U3D.v(leftEdge, 0, 0);
    this.previousTurnButton.setEnabled(false);

    this.nextTurnButton = this.addActionPanelButton('/fontcons/completecheck.png', 'Complete Round', () => this.app.clickEndTurn());
    this.nextTurnButton.parent = this.app.menuBarTabButtonsTN;
    this.nextTurnButton.position = U3D.v(leftEdge + 1 * buttonSpace, 0, 0);
    this.nextTurnButton.setEnabled(false);

    this.nextSelectedRoundButton = this.addActionPanelButton('/fontcons/nextround.png', "Next Round", () => this.app.paintedBoardTurn = this.app.paintedBoardTurn + 1);
    this.nextSelectedRoundButton.parent = this.app.menuBarTabButtonsTN;
    this.nextSelectedRoundButton.position = U3D.v(leftEdge + 1 * buttonSpace, 0, 0);
    this.nextSelectedRoundButton.setEnabled(false);

    let homeBtn = this.addActionPanelButton('/fontcons/home.png', "Teleport Home [Y]", () => this.app.yButtonPress());
    homeBtn.parent = this.app.menuBarTabButtonsTN;
    homeBtn.position = U3D.v(leftEdge + 2 * buttonSpace, 0, 0);

    let cardsBtn = this.addActionPanelButton('/fontcons/cards.png', "Action Cards", () => this.selectedMenuBarTab(this.cardsPanelTab));
    cardsBtn.parent = this.app.menuBarTabButtonsTN;
    cardsBtn.position = U3D.v(leftEdge + 3 * buttonSpace, 0, 0);

    let playersMoonsMenuBtn = this.addActionPanelButton('/fontcons/group.png', "Player Avatars", () => this.selectedMenuBarTab(this.playerMoonPanelTab));
    playersMoonsMenuBtn.parent = this.app.menuBarTabButtonsTN;
    playersMoonsMenuBtn.position = U3D.v(leftEdge + 4 * buttonSpace, 0, 0);

    let selectedObjectMenuBtn = this.addActionPanelButton('/fontcons/redtarget.png', "Selected Target", () => this.selectedMenuBarTab(this.focusPanelTab));
    selectedObjectMenuBtn.parent = this.app.menuBarTabButtonsTN;
    selectedObjectMenuBtn.position = U3D.v(leftEdge + 5 * buttonSpace, 0, 0);

    let menuWrapperPlane = BABYLON.MeshBuilder.CreatePlane("menuTabButtonsPanel", {
      height: 5.5,
      width: 25
    }, this.app.scene);
    menuWrapperPlane.material = this.playerCardHollowMaterial;
    menuWrapperPlane.parent = this.app.menuBarTabButtonsTN;
    menuWrapperPlane.isPickable = false;
    menuWrapperPlane.position = U3D.v(-10.95, 0.5, 0.05);

    let scalingSliderTN = BABYLON.MeshBuilder.CreatePlane('scalingSliderTN', {
      height: 15,
      width: 15
    }, this.app.scene);
    scalingSliderTN.parent = this.app.menuBarTabButtonsTN;
    scalingSliderTN.position = U3D.v(leftEdge - 4.25, 0.5, 0);
    scalingSliderTN.rotation = U3D.v(0, 0, Math.PI / 2);

    this.sliderPanelAdvTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
      scalingSliderTN, 1024, 1024, true);
    this.scalingSlider3D = new BABYLON.GUI.Slider();
    this.scalingSlider3D.minimum = 0.1;
    this.scalingSlider3D.maximum = 1;
    this.scalingSlider3D.value = 1;
    this.scalingSlider3D.height = "90px";
    this.scalingSlider3D.width = "320px";
    this.scalingSlider3D.color = "rgb(255,255,255)";
    this.scalingSlider3D.thumbColor = "rgb(255,127,0)";
    this.scalingSlider3D.thumbWidth = "75px";
    this.scalingSlider3D.onValueChangedObservable.add((value) => {
      this.app.sceneTransformNode.scaling = U3D.v(value);
    });
    this.sliderPanelAdvTexture.scaling = U3D.v(0.25);
    this.sliderPanelAdvTexture.addControl(this.scalingSlider3D);

    let helpButton = this.addActionPanelButton('/fontcons/help.png', "Help", () => this.showHelpSlate());
    helpButton.parent = this.app.menuBarTabButtonsTN;
    helpButton.scaling = U3D.v(0.5);
    helpButton.position = U3D.v(leftEdge - 4.25, 4, 0);

    this.focusPanelTab = new BABYLON.TransformNode('focusPanelTab', this.app.scene);
    this.focusPanelTab.parent = this.app.menuBarLeftTN;
    this.focusPanelTab.position = U3D.v(0, 6.5, this.app.menuBarTabButtonsTN.position.z);
    this.focusPanelTab.setEnabled(false);
    this.initFocusedAssetPanel();

    this.playerMoonPanelTab = new BABYLON.TransformNode('playerMoonPanelTab', this.app.scene);
    this.playerMoonPanelTab.parent = this.app.menuBarLeftTN;
    this.playerMoonPanelTab.position = U3D.v(0, 6.5, this.app.menuBarTabButtonsTN.position.z);
    this.playerMoonPanelTab.setEnabled(false);
    this.initPlayerPanel();

    this.cardsPanelTab = new BABYLON.TransformNode('cardsPanelTab', this.app.scene);
    this.cardsPanelTab.parent = this.app.menuBarLeftTN;
    this.cardsPanelTab.position = U3D.v(0, 6.5, this.app.menuBarTabButtonsTN.position.z);
    this.cardsPanelTab.setEnabled(false);
    this.initCardPanel();

  }
  showHelpSlate() {
    if (this.helpSlate)
      this.helpSlate.dispose();

    this.helpSlate = new BABYLON.GUI.HolographicSlate("helpSlatePopup");
    this.helpSlate.minDimensions = new BABYLON.Vector2(1, 1);
    this.helpSlate.dimensions = new BABYLON.Vector2(2, 2);
    this.helpSlate.titleBarHeight = 0.5;
    this.helpSlate.title = "Storyverse Background";

    this.helpSlate.content = new BABYLON.GUI.Image("cat", "https://placekitten.com/300/300");
    this.app.gui3DManager.addControl(this.helpSlate);
    this.helpSlate.defaultBehavior.followBehavior.defaultDistance = 7;
    this.helpSlate.defaultBehavior.followBehavior.minimumDistance = 5;
    this.helpSlate.defaultBehavior.followBehavior.maximumDistance = 12;
    this.helpSlate.defaultBehavior.followBehavior.lerpTime = 250;

    this.helpSlate.defaultBehavior.followBehavior.recenter();
    if (!this.helpSlate.defaultBehavior.followBehaviorEnabled) {
      this.helpSlate.defaultBehavior.followBehaviorEnabled = true;
      setTimeout(() => this.helpSlate.defaultBehavior.followBehaviorEnabled = false, 1000);
    }
  }
  addActionPanelButton(texturePath, text, handlePointerDown) {
    let button = new BABYLON.GUI.HolographicButton(texturePath);
    let mesh = new BABYLON.TransformNode(texturePath + 'TN', this.app.scene);
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

  updateRoundAndScoreStatus() {
    if (this.app.boardTurnLabel !== this.paintedLabel) {
      this.paintedLabel = this.app.boardTurnLabel;

      if (this.selectedRoundIndexPanel)
        this.selectedRoundIndexPanel.dispose(false, true);

      let color;
      if (this.app._paintedBoardTurn === null)
        color = U3D.color("0,1,0");
      else if (this.app.paintedBoardTurn >= 0)
        color = U3D.color("1,1,1");
      else
        color = U3D.color("1, 0.5, 0");
      this.selectedRoundIndexPanel = U3D.addTextPlane(this.app.scene, this.app.boardTurnLabel, color);
      this.selectedRoundIndexPanel.parent = this.app.menuBarTabButtonsTN;
      this.selectedRoundIndexPanel.scaling = U3D.v(2);
      this.selectedRoundIndexPanel.position = U3D.v(-18, 2.35, 0);
    }

    let playerUp = this.app.uid === this.app.gameData['seat' + this.app.activeSeatIndex];
    if (this.app._paintedBoardTurn === null) {
      this.nextSelectedRoundButton.setEnabled(false);
      this.nextTurnButton.setEnabled(playerUp);
    } else {
      this.nextSelectedRoundButton.setEnabled(true);
      this.nextTurnButton.setEnabled(false);
    }

    let minPrequel = this.app.paintedBoardTurn === this.app.minimumPrequel;
    this.previousTurnButton.setEnabled(!minPrequel);

    this._refreshSeatIndexStatus(true);
  }

  async initFocusedAssetPanel() {
    let scene = this.app.scene;

    let nextSelectedMetaBtn = this.addActionPanelButton('/fontcons/nextgt.png', "Next Asset", () => this.nextSelectedObject());
    nextSelectedMetaBtn.position = U3D.v(-2, 0, 0);
    nextSelectedMetaBtn.parent = this.focusPanelTab;

    let previousSelectedMetaBtn = this.addActionPanelButton('/fontcons/previouslt.png', "Previous Asset", () => this.nextSelectedObject(true));
    previousSelectedMetaBtn.position = U3D.v(-6, 0, 0);
    previousSelectedMetaBtn.parent = this.focusPanelTab;

    let followSelectedMetaBtn = this.addActionPanelButton("/fontcons/follow.png", "Follow [B]", () => this.app.bButtonPress());
    followSelectedMetaBtn.position = U3D.v(-14, 0, 0);
    followSelectedMetaBtn.parent = this.focusPanelTab;

    let followStopBtn = this.addActionPanelButton("/fontcons/stopsign.png", 'Stop [A]', () => this.app.aButtonPress());
    followStopBtn.position = U3D.v(-10, 0, 0);
    followStopBtn.parent = this.focusPanelTab;

    this.setSelectedAsset(this.obj('e1_luna'));
  }
  setSelectedAsset(assetMeta) {
    this.spinPauseMeta = assetMeta;
    this.selectedObjectMeta = this.spinPauseMeta;

    let desc = assetMeta.name;
    if (desc.indexOf('.obj') !== -1) {
      desc = desc.replace('.obj', '');
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    }

    if (this.lastFocusedMesh)
      this.lastFocusedMesh.showBoundingBox = false;

    if (this.selectedContainerTransform)
      this.selectedContainerTransform.dispose();

    this.selectedContainerTransform = new BABYLON.TransformNode('selectedContainerTransform', this.app.scene);
    this.selectedContainerTransform.parent = this.focusPanelTab;
    this.selectedContainerTransform.position.x = -5;
    this.selectedContainerTransform.position.z = 4;
    this.selectedContainerTransform.position.y = 10;
    this.selectedContainerTransform.rotation.y = Math.PI;

    let result, mesh, menubarMesh;
    let meshHeight = 10;
    let cloneMesh;
    if (assetMeta.avatarType) {
      let avatar = this.app.avatarHelper.initedAvatars[assetMeta.seatIndex];
      cloneMesh = avatar.avatarPositionTN.assetMeta.boundingMesh;
      meshHeight = 12;

      //  this.selectedContainerTransform.position.y = 3;

      this.lastFocusedMesh = avatar.avatarPositionTN.assetMeta.boundingMesh;
    } else if (assetMeta.asteroidType) {
      cloneMesh = assetMeta.basePivot;
      this.lastFocusedMesh = assetMeta.basePivot;
    } else {
      cloneMesh = this.app.staticBoardObjects[assetMeta.id].baseMesh;
      this.lastFocusedMesh = this.obj(assetMeta.id).boundingMesh;
    }
    this.lastFocusedMesh.showBoundingBox = true;

    mesh = cloneMesh.clone();
    menubarMesh = cloneMesh.clone();
    U3D.sizeNodeToFit(menubarMesh, 2.5);
    U3D.sizeNodeToFit(mesh, meshHeight);
    menubarMesh.showBoundingBox = false;
    mesh.showBoundingBox = false;

    let boundingBox = new BABYLON.Mesh("boundingBoxselectedAsset", this.app.scene);
    //    if (assetMeta.avatarType)
    boundingBox.setBoundingInfo(new BABYLON.BoundingInfo(U3D.v(meshHeight / -2), U3D.v(meshHeight / 2)));
    //    else
    //      boundingBox.setBoundingInfo(new BABYLON.BoundingInfo(U3D.v(meshHeight / -2 - 0.25), U3D.v(meshHeight / 2 + 0.25)));
    boundingBox.showBoundingBox = true;
    boundingBox.isPickable = false;
    boundingBox.parent = this.selectedContainerTransform;
    boundingBox.position.y = 0.25;

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
    mesh.setEnabled(true);

    if (this.selectedAssetLabel)
      this.selectedAssetLabel.dispose(false, true);
    this.selectedAssetLabel = U3D.addTextPlane(this.app.scene, desc, U3D.color("1,1,1"));
    this.selectedAssetLabel.position = U3D.v(-4, 2, 0);
    this.selectedAssetLabel.parent = this.app.menuBarTabButtonsTN;

    if (this.selectedAssetMiniClone)
      this.selectedAssetMiniClone.dispose();
    this.selectedAssetMiniClone = menubarMesh;
    this.selectedAssetMiniClone.parent = this.app.menuBarTabButtonsTN;
    //  let y = assetMeta.avatarType ?  0 : 0.5;
    this.selectedAssetMiniClone.position = U3D.v(-2, 0.5, -1);
    this.selectedAssetMiniClone.rotation = U3D.v(0, 0, 0);

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

      this.setSelectedAsset(this.app.avatarMetas[index]);
    } else if (meta.actionCardType) {
      let index = meta.cardIndex + 1;
      if (index > 5) index = 0;
      this.setSelectedAsset(this.app.actionCardHelper.cardItemMeta[index]);
    } else {
      let keys = Object.keys(this.app.staticBoardObjects).sort((a, b) => {
        if (this.obj(a).name > this.obj(b).name)
          return 1;
        if (this.obj(a).name < this.obj(b).name)
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
      this.setSelectedAsset(this.obj(key));
    }
  }

  initPlayerPanel() {
    this.dockSeatContainers = [];
    this.dockSeatHeight = 14;
    this.dockSeatWidth = 6;
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      let colors = U3D.get3DColors(seatIndex);
      let playerColor = new BABYLON.Color3(colors.r, colors.g, colors.b);

      let dockSeatContainer = new BABYLON.TransformNode('dockSeatContainer' + seatIndex, this.app.scene);
      dockSeatContainer.position = U3D.v(-20 + (seatIndex * this.dockSeatWidth), 8.5, 0);
      dockSeatContainer.parent = this.playerMoonPanelTab;
      this.dockSeatContainers.push(dockSeatContainer);

      dockSeatContainer.playerImageMaterial = new BABYLON.StandardMaterial('playerlogomatertial' + seatIndex, this.app.scene);
      dockSeatContainer.playerImageMaterial.alpha = 0;

      dockSeatContainer.playerColorMaterial = new BABYLON.StandardMaterial('playercolormaterial' + seatIndex, this.app.scene);
      dockSeatContainer.playerColorMaterial.diffuseColor = playerColor;
      dockSeatContainer.playerColorMaterial.ambientColor = playerColor;
      dockSeatContainer.playerColorMaterial.emissiveColor = playerColor;

      this._initMoonFlagPole(seatIndex);

      let seatBackPanel = BABYLON.MeshBuilder.CreatePlane("seatBackPanel" + seatIndex, {
        height: this.dockSeatHeight + 0.25,
        width: this.dockSeatWidth - 0.25
      }, this.app.scene);
      let panelMat = new BABYLON.StandardMaterial("menuCardBackPanel" + seatIndex, this.app.scene);
      let t = new BABYLON.Texture('/images/cardcrested.png', this.app.scene);
      panelMat.opacityTexture = t;
      panelMat.diffuseColor = playerColor;
      panelMat.ambientColor = playerColor;
      panelMat.emissiveColor = playerColor;

      seatBackPanel.material = panelMat;
      seatBackPanel.parent = dockSeatContainer;

      let avatar = this.app.avatarHelper.initedAvatars[seatIndex];
      let avatarMeta = avatar.avatarPositionTN.assetMeta;
      let cloneMesh = avatarMeta.boundingMesh.clone();
      let avatarTN = new BABYLON.TransformNode('seatavatarTN' + seatIndex, this.app.scene);
      cloneMesh.parent = avatarTN;
      avatarTN.parent = dockSeatContainer;
      U3D.sizeNodeToFit(cloneMesh, 2);
      cloneMesh.showBoundingBox = false;
      avatarTN.rotation.y = Math.PI;
      avatarTN.position = U3D.v(0, -1.25, 0);
      let cloneMoon = this.app.playerMoonAssets[seatIndex].baseMesh.clone();
      cloneMoon.parent = avatarTN;
      cloneMoon.showBoundingBox = false;
      U3D.sizeNodeToFit(cloneMoon, 1.2);
      cloneMoon.position = U3D.v(0.75, this.dockSeatHeight / 2 - 1, -1.75);

      dockSeatContainer.standButton = this.addActionPanelButton("/fontcons/remove.png?seatindex=" + seatIndex.toString(), 'Free Avatar', () => {
        this.app._gameAPIStand(seatIndex);
        dockSeatContainer.standButton.setEnabled(false);
      });
      dockSeatContainer.standButton.parent = dockSeatContainer;
      dockSeatContainer.standButton.scaling = U3D.v(0.5);
      dockSeatContainer.standButton.position = U3D.v(1.5, this.dockSeatHeight / 2 - 1.25, 0);

      dockSeatContainer.sitButton = this.addActionPanelButton('/fontcons/greenchair.png?seatindex=' + seatIndex.toString(), "Play Avatar", () => {
        this.app.dockSit(seatIndex);
        dockSeatContainer.sitButton.setEnabled(false);
      });
      dockSeatContainer.sitButton.parent = dockSeatContainer;
      dockSeatContainer.sitButton.scaling = U3D.v(0.5);
      dockSeatContainer.sitButton.position = U3D.v(1.5, this.dockSeatHeight / 2 - 1.25, 0);

      let logoHolder = BABYLON.MeshBuilder.CreatePlane("avatarimageplanemenubar" + seatIndex, {
          height: 2,
          width: 2
        },
        this.app.scene);
      logoHolder.position = U3D.v(0, this.dockSeatHeight / -2 + 1.5, -0.05);
      logoHolder.material = dockSeatContainer.playerImageMaterial;
      logoHolder.parent = dockSeatContainer;

      let moonDesc = this.app.playerMoonAssets[seatIndex].assetMeta.name;
      let moonName = U3D.addTextPlane(this.app.scene, moonDesc, playerColor);
      moonName.scaling = U3D.v(2.25);
      moonName.position = U3D.v(0, this.dockSeatHeight / 2 + 1, -0.05);
      moonName.parent = dockSeatContainer;

      let ofName = U3D.addTextPlane(this.app.scene, 'of', U3D.color('1,1,1'));
      ofName.scaling = U3D.v(1.25);
      ofName.position = U3D.v(0, this.dockSeatHeight / 2 + 2.25, -0.05);
      ofName.parent = dockSeatContainer;

      let avatarName = U3D.addTextPlane(this.app.scene, avatarMeta.name, playerColor);
      avatarName.scaling = U3D.v(2.25);
      avatarName.position = U3D.v(0, this.dockSeatHeight / 2 + 3.5, -0.05);
      avatarName.parent = dockSeatContainer;
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
  _updateCurrentSelectedPlayerDescription() {
    let seatIndex = this.app.activeSeatIndex;
    let colors = U3D.get3DColors(seatIndex);
    let color = U3D.colorRGB255(colors.r + "," + colors.g + "," + colors.b);
    let avatarMeta = this.app.avatarMetas[seatIndex];
  //  this.selectedPlayerText3D.color = 'white';
  //  this.selectedPlayerText3D.text = avatarMeta.description;
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
            mat1.emissiveColor = color;
          }
          mat1.diffuseColor = color;
          //  mat1.diffuseColor = color;

          let sphere = BABYLON.MeshBuilder.CreateSphere("onlinesphere" + seatIndex, {
            diameter: 0.5,
            segments: 8
          }, this.app.scene);
          sphere.position.y = this.dockSeatHeight / 2 - 0.75;
          sphere.position.x = -2;
          sphere.material = mat1;
          sphere.parent = seat;
          seat.onlineSphere = sphere;
        }
      }
    }
  }
  async updatePlayerDock() {
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      let seatData = this.getSeatData(seatIndex);
      let cacheValue = seatData.name + seatData.image + seatData.seated.toString();

      if (this['dockSeatCache' + seatIndex] !== cacheValue) {
        this['dockSeatCache' + seatIndex] = cacheValue;
        let seatContainer = this.dockSeatContainers[seatIndex];
        if (!seatContainer.playerDetailsTN) {
          seatContainer.playerDetailsTN = new BABYLON.TransformNode("playerDetailsTN" + seatIndex, this.app.scene);
          seatContainer.playerDetailsTN.parent = seatContainer;
        }

        let meta = seatContainer.assetMeta;

        if (seatContainer.namePlate1) {
          seatContainer.namePlate1.dispose(false, true);
          seatContainer.namePlate2.dispose(false, true);
          seatContainer.namePlate1 = null;
          seatContainer.namePlate2 = null;
        }

        seatContainer.standButton.setEnabled(false);
        seatContainer.sitButton.setEnabled(false);

        if (seatData.seated) {
          let names = seatData.name.split(' ');

          let color = U3D.get3DColors(seatIndex);
          seatContainer.namePlate1 = U3D.addTextPlane(this.app.scene, names[0], color);
          seatContainer.namePlate1.position = U3D.v(0, this.dockSeatHeight / -2 - 1.15, -0.05);
          seatContainer.namePlate1.parent = seatContainer.playerDetailsTN;
          seatContainer.namePlate1.scaling = U3D.v(1.25);

          let name2 = '';
          if (names[1]) name2 = names[1];
          seatContainer.namePlate2 = U3D.addTextPlane(this.app.scene, name2, color);
          seatContainer.namePlate2.scaling = U3D.v(1.25);
          seatContainer.namePlate2.position = U3D.v(0, this.dockSeatHeight / -2 - 2, -0.05);
          seatContainer.namePlate2.parent = seatContainer.playerDetailsTN;

          if (this.app.uid === seatData.uid || this.app.isOwner) {
            let gameOwnerNotPlayer = (this.app.uid !== seatData.uid && this.app.isOwner);
            let character = gameOwnerNotPlayer ? "Boot Player" : 'Stand Up';

            seatContainer.standButton.text = character;
            seatContainer.standButton.setEnabled(true);
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
          seatContainer.sitButton.setEnabled(true);
          seatContainer.playerImageMaterial.alpha = 0;
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

  initCardPanel() {

  }
}
