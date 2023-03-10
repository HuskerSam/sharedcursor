import U3D from '/models/utility3d.js';

export default class MenuTab3D {
  constructor(app) {
    this.app = app;
    this.buttonSpace = 1.6;
    this.seatIndexColoredButtons = [];
    this.tabPanelButtons = [];

    this.playerCardHollowMaterial = new BABYLON.StandardMaterial("menuCardBackPanel", this.app.scene);
    this.playerCardHollowMaterial.opacityTexture = new BABYLON.Texture('/images/cardhollow.png', this.app.scene);
    this.optionBarWidth = 30;
    this.menuBarHeight = 8;
    this.menuLineBottom = -1.35;
    this.secondRowBottom = this.menuBarHeight - 7.4;
  }
  _refreshSeatIndexStatus(forceRefresh = false) {
    if (this.seatIndexButtonColorCache === this.app.activeSeatIndex && !forceRefresh)
      return;

    let avatarMeta = this.app.avatarMetas[this.app.activeSeatIndex];
    let colors = U3D.color(avatarMeta.primaryColor);

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

    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      let seatContainer = this.dockSeatContainers[seatIndex];
      if (seatIndex !== this.app.activeSeatIndex)
        seatContainer.moonAnimDetails.runningAnimation.pause();
      else
        seatContainer.moonAnimDetails.runningAnimation.restart();
    }
  }
  obj(name) {
    return this.app.staticBoardObjects[name].assetMeta;
  }
  initOptionsBar() {
    let menuWrapperPlane = BABYLON.MeshBuilder.CreatePlane("menuTabButtonsPanel", {
      height: this.menuBarHeight,
      width: this.optionBarWidth
    }, this.app.scene);
    menuWrapperPlane.material = this.playerCardHollowMaterial;
    menuWrapperPlane.parent = this.app.menuBarTabButtonsTN;
    menuWrapperPlane.isPickable = false;
    menuWrapperPlane.position = U3D.v(0, 1.75, 0.05);

    this._addMainButtonRow();
    this._addScalingSlider();
    this._addSelectedObjectOptions();
    this._addTabPanels();
  }
  _addMainButtonRow() {
    let top = this.menuBarHeight - 4.5;

    this.selectedButtonBorder = BABYLON.MeshBuilder.CreatePlane('selectedMenuButtonBorder', {
      height: this.buttonSpace * 2,
      width: this.buttonSpace * 2,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.app.scene);
    this.selectedButtonBorder.setEnabled(false);
    this.selectedButtonBorder.parent = this.app.menuBarTabButtonsTN;
    this.selectedButtonBorder.material = new BABYLON.StandardMaterial('selectedButtonBordermat', this.app.scene);

    this.seatIndexColoredButtons.push(this.selectedButtonBorder);

    let cardsBtn = this.addActionPanelButton('/fontcons/cards.png', "Action Cards",
      () => this.selectedTab = this.cardsPanelTab);
    cardsBtn.parent = this.app.menuBarTabButtonsTN;
    cardsBtn.position = U3D.v(-5.5 * this.buttonSpace, top, 0);
    this.tabPanelButtons.push(cardsBtn);

    let playersMoonsMenuBtn = this.addActionPanelButton('/fontcons/group.png', "Player Avatars",
      () => this.selectedTab = this.playerMoonPanelTab);
    playersMoonsMenuBtn.parent = this.app.menuBarTabButtonsTN;
    playersMoonsMenuBtn.position = U3D.v(-3.5 * this.buttonSpace, top, 0);
    this.tabPanelButtons.push(playersMoonsMenuBtn);

    let selectedObjectMenuBtn = this.addActionPanelButton('/fontcons/redtarget.png', "Selected Target",
      () => this.selectedTab = this.focusPanelTab);
    selectedObjectMenuBtn.parent = this.app.menuBarTabButtonsTN;
    selectedObjectMenuBtn.position = U3D.v(-1.5 * this.buttonSpace, top, 0);
    this.tabPanelButtons.push(selectedObjectMenuBtn);

    this.finishPlayerTurnButton = this.addActionPanelButton('/fontcons/completecheck.png', 'FINISH Round', () =>
      this.app.clickEndTurn());
    this.finishPlayerTurnButton.parent = this.app.menuBarTabButtonsTN;
    this.finishPlayerTurnButton.position = U3D.v(-12, top, 0);
    this.finishPlayerTurnButton.setEnabled(false);

    this.previousTurnButton = this.addActionPanelButton('/fontcons/previousround.png', "Previous Round", () =>
      this.app.paintedBoardTurn = this.app.paintedBoardTurn - 1, 2);
    this.previousTurnButton.parent = this.app.menuBarTabButtonsTN;
    this.previousTurnButton.position = U3D.v(-12.5, this.secondRowBottom, 0);
    this.previousTurnButton.setEnabled(false);

    this.nextSelectedRoundButton = this.addActionPanelButton('/fontcons/nextround.png', "Next Round", () =>
      this.app.paintedBoardTurn = this.app.paintedBoardTurn + 1, 2);
    this.nextSelectedRoundButton.parent = this.app.menuBarTabButtonsTN;
    this.nextSelectedRoundButton.position = U3D.v(-7.5, this.secondRowBottom, 0);
    this.nextSelectedRoundButton.setEnabled(false);

    let helpButton = this.addActionPanelButton('/fontcons/help.png', "Storyverse", () =>
      this.app.helpSlateHelper.showHelpSlate(), 2);
    helpButton.parent = this.app.menuBarTabButtonsTN;
    helpButton.position = U3D.v(-1.25 * this.buttonSpace, this.secondRowBottom, 0);

    let chatBtn = this.addActionPanelButton('/fontcons/chat.png', "Chat", () =>
      this.app.chatSlateHelper.showChatPanel(), 2);
    chatBtn.parent = this.app.menuBarTabButtonsTN;
    chatBtn.position = U3D.v(-2.75 * this.buttonSpace, this.secondRowBottom, 0);
  }
  _addTabPanels() {
    this.focusPanelTab = new BABYLON.TransformNode('focusPanelTab', this.app.scene);
    this.focusPanelTab.parent = this.app.menuBarTabButtonsTN;
    this.focusPanelTab.position = U3D.v(0, this.menuBarHeight, 0);
    this.focusPanelTab.buttonIndex = 2;
    this.focusPanelTab.setEnabled(false);
    this.initFocusedAssetPanel();

    this.playerMoonPanelTab = new BABYLON.TransformNode('playerMoonPanelTab', this.app.scene);
    this.playerMoonPanelTab.parent = this.app.menuBarTabButtonsTN;
    this.playerMoonPanelTab.position = U3D.v(0, this.menuBarHeight, 0);
    this.playerMoonPanelTab.buttonIndex = 1;
    this.playerMoonPanelTab.setEnabled(false);
    this.initPlayerPanel();

    this.cardsPanelTab = new BABYLON.TransformNode('cardsPanelTab', this.app.scene);
    this.cardsPanelTab.parent = this.app.menuBarTabButtonsTN;
    this.cardsPanelTab.position = U3D.v(0, this.menuBarHeight, 0);
    this.cardsPanelTab.buttonIndex = 0;
    this.cardsPanelTab.setEnabled(false);
    this.initCardPanel();
  }
  _addScalingSlider() {
    let scalingSliderTN = BABYLON.MeshBuilder.CreatePlane('scalingSliderTN', {
      height: 15,
      width: 15
    }, this.app.scene);
    scalingSliderTN.parent = this.app.menuBarTabButtonsTN;
    scalingSliderTN.position = U3D.v(12.6, 2, 0);
    scalingSliderTN.rotation = U3D.v(0, 0, Math.PI / 2);
    this.sliderPanelAdvTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
      scalingSliderTN, 1024, 1024, true);
    this.scalingSlider3D = new BABYLON.GUI.Slider();
    this.scalingSlider3D.minimum = 0.1;
    this.scalingSlider3D.maximum = 1;
    this.scalingSlider3D.value = 1;
    this.scalingSlider3D.height = "120px";
    this.scalingSlider3D.width = "400px";
    this.scalingSlider3D.color = "rgb(255,255,255)";
    this.scalingSlider3D.thumbColor = "rgb(255,127,0)";
    this.scalingSlider3D.thumbWidth = "75px";
    this.scalingSlider3D.onValueChangedObservable.add((value) => {
      this.app.sceneTransformNode.scaling = U3D.v(value);
    });
    this.sliderPanelAdvTexture.scaling = U3D.v(0.25);
    this.sliderPanelAdvTexture.addControl(this.scalingSlider3D);
  }
  _addSelectedObjectOptions() {
    let followSelectedMetaBtn = this.addActionPanelButton("/fontcons/follow.png", "Follow [B]", () =>
      this.app.bButtonPress(), 2);
    followSelectedMetaBtn.position = U3D.v(3.4, this.menuBarHeight - 4, 0);
    followSelectedMetaBtn.parent = this.app.menuBarTabButtonsTN;

    let followStopBtn = this.addActionPanelButton("/fontcons/stopsign.png", 'Stop [A]', () =>
      this.app.aButtonPress(), 2);
    followStopBtn.position = U3D.v(3.4, this.menuBarHeight - 6.25, 0);
    followStopBtn.parent = this.app.menuBarTabButtonsTN;

    let homeBtn = this.addActionPanelButton('/fontcons/home.png', "Home [Y]", () =>
      this.app.yButtonPress(), 2);
    homeBtn.parent = this.app.menuBarTabButtonsTN;
    homeBtn.position = U3D.v(1, this.menuBarHeight - 4, 0);

    this.toggleBtn = this.addActionPanelButton('/fontcons/teleport.png', "Toggle Controls [X]", () =>
      this.app.xButtonPress(), 2);
    this.toggleBtn.parent = this.app.menuBarTabButtonsTN;
    this.toggleBtn.position = U3D.v(1, this.menuBarHeight - 6.25, 0);
  }
  _updateActionChannelDisplay() {
    if (this.selectedRoundIndexPanel) {
      this.selectedRoundLabelPanel.dispose(false, true);
      this.selectedRoundIndexPanel.dispose(false, true);
    }

    let labelDetails = this.turnStatusLabel;
    this.selectedRoundLabelPanel = U3D.addTextPlane(this.app.scene, labelDetails.label,
      labelDetails.labelColor, 1.25);
    this.selectedRoundLabelPanel.parent = this.app.menuBarTabButtonsTN;
    this.selectedRoundLabelPanel.position = U3D.v(-10, this.menuLineBottom, 0);

    this.selectedRoundIndexPanel = U3D.addTextPlane(this.app.scene, labelDetails.displayNumber,
      labelDetails.labelColor, 2);
    this.selectedRoundIndexPanel.parent = this.app.menuBarTabButtonsTN;
    this.selectedRoundIndexPanel.position = U3D.v(-10, this.menuLineBottom + 1.75, 0);
  }
  _updateSpeechChannelDisplay() {
    if (this.speechChannelPanel) {
      this.speechChannelPanel.dispose(false, true);
      this.speechChannelPanel = null;
    }

    let speechChannel = this.app.channelSpeechHelper;
    if (!speechChannel.isPlaying)
      return;

    let seatIndex = speechChannel.activeSpeechEvent.seatIndex;
    let avatarMeta = this.app.avatarMetas[seatIndex];
    let color = U3D.color(avatarMeta.primaryColor);
    let label = avatarMeta.name + '';

    this.speechChannelPanel = U3D.addTextPlane(this.app.scene, label, color, 1.25);
    this.speechChannelPanel.parent = this.app.menuBarTabButtonsTN;
    this.speechChannelPanel.scaling = U3D.v(1);
    this.speechChannelPanel.position = U3D.v(-1, this.menuLineBottom, 0);
  }
  addActionPanelButton(texturePath, text, handlePointerDown, scale = 3) {
    let button = new BABYLON.GUI.HolographicButton(texturePath);
    let mesh = new BABYLON.TransformNode(texturePath + 'TN', this.app.scene);
    this.app.gui3DManager.addControl(button);
    button.linkToTransformNode(mesh);
    button.scaling = U3D.v(scale, scale, 3);
    button.text = text;
    button.imageUrl = texturePath;

    if (handlePointerDown) {
      button.onPointerDownObservable.add(() => {
        handlePointerDown();
      });
    }

    mesh.holographicButton = button;
    return mesh;
  }
  set selectedTab(menuTabToShow) {
    if (this._currentSelectedTab)
      this._currentSelectedTab.setEnabled(false);

    this.tabPanelButtons.forEach(btn => btn.scaling = U3D.v(1));
    this.selectedButtonBorder.setEnabled(false);
    if (this._currentSelectedTab === menuTabToShow) {
      this._currentSelectedTab = null;
    } else {
      if (menuTabToShow) {
        menuTabToShow.setEnabled(true);
        this.tabPanelButtons[menuTabToShow.buttonIndex].scaling = U3D.v(0.9);
        this.selectedButtonBorder.position = this.tabPanelButtons[menuTabToShow.buttonIndex].position;
        this.selectedButtonBorder.setEnabled(true);
      }
      this._currentSelectedTab = menuTabToShow;
    }
  }

  get turnStatusLabel() {
    let label = "";
    let displayNumber = 0;
    let labelColor;
    if (this.app._paintedBoardTurn === null)
      labelColor = U3D.color("0,1,0");
    else if (this.app.paintedBoardTurn >= 0)
      labelColor = U3D.color("1,1,1");
    else
      labelColor = U3D.color("1,0.5,0");

    if (this.app._paintedBoardTurn === null) {
      label = "Live";
      displayNumber = this.app.turnNumber + 1;
    } else if (this.app._paintedBoardTurn < 0) {
      displayNumber = this.app._paintedBoardTurn;
      label = "Prequel";
    } else {
      displayNumber = this.app._paintedBoardTurn + 1;
      label = "History";
    }

    let actionChannel = this.app.actionChannelHelper;
    let count = actionChannel.eventQueue.length;
    let actionInProgress = false;
    if (actionChannel.isPlaying) {
      let action = 'Action';
      if (actionChannel.lastAnimateAction.action === 'playCard')
        action = "Card";
      if (count > 0)
        label += `(${count})`;

      let targetLabel = '';
      if (actionChannel.lastAnimateAction.targetId) {
        let meta = this.app.staticBoardObjects[actionChannel.lastAnimateAction.targetId].assetMeta;
        targetLabel = meta.name;
      }
      label += ` ${action} ${targetLabel}`;
    }
    return {
      displayNumber,
      label,
      labelColor,
      actionInProgress
    }
  }
  _updatePlayerActionButtons() {
    let playerUp = this.app.uid === this.app.gameData['seat' + this.app.activeSeatIndex];
    if (this.app._paintedBoardTurn === null) {
      this.nextSelectedRoundButton.setEnabled(false);
      this.finishPlayerTurnButton.setEnabled(playerUp);
    } else {
      this.nextSelectedRoundButton.setEnabled(true);
      this.finishPlayerTurnButton.setEnabled(false);
    }

    let minPrequel = this.app.paintedBoardTurn === this.app.minimumPrequel;
    this.previousTurnButton.setEnabled(!minPrequel);

    this._refreshSeatIndexStatus(true);
  }
  set channelDisplayDirty(value) {
    if (!this.updateChannelDisplayTimer) {
      this.updateChannelDisplayTimer = setTimeout(() => {
        this._updateChannelStatusDisplay();
      }, 50);
    }
  }
  _updateChannelStatusDisplay() {
    clearTimeout(this.updateChannelDisplayTimer);
    this.updateChannelDisplayTimer = null;

    this._updateActionChannelDisplay();
    this._updateSpeechChannelDisplay();
    this._updatePlayerActionButtons();
  }

  async initFocusedAssetPanel() {
    let scene = this.app.scene;

    let nextSelectedMetaBtn = this.addActionPanelButton('/fontcons/nextgt.png', "Next Asset", () => this.nextSelectedObject());
    nextSelectedMetaBtn.position = U3D.v(this.optionBarWidth / 2, 0, 0);
    nextSelectedMetaBtn.parent = this.focusPanelTab;

    let previousSelectedMetaBtn = this.addActionPanelButton('/fontcons/previouslt.png', "Previous Asset", () => this.nextSelectedObject(true));
    previousSelectedMetaBtn.position = U3D.v(this.optionBarWidth / -2, 0, 0);
    previousSelectedMetaBtn.parent = this.focusPanelTab;

    let loadISSBtn = this.addActionPanelButton('/fontcons/rocket.svg', "Load ISS", () => this.loadISS());
    loadISSBtn.position = U3D.v(this.optionBarWidth / -2 + 2 * this.buttonSpace, 0, 0);
    loadISSBtn.parent = this.focusPanelTab;

    this.setSelectedAsset(this.obj('e1_luna'));
  }
  async setSelectedAsset(assetMeta) {
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
    this.selectedContainerTransform.position.x = 0;
    this.selectedContainerTransform.position.z = 4;
    this.selectedContainerTransform.position.y = 12;
    this.selectedContainerTransform.rotation.y = Math.PI;

    let result, mesh, menubarMesh;
    let meshHeight = 20;
    let boundsWrapperNeeded = false;
    if (assetMeta.avatarType) {
      let avatar = this.app.avatarHelper.initedAvatars[assetMeta.seatIndex];
      let cloneMesh = avatar.avatarPositionTN.assetMeta.boundingMesh;
      mesh = cloneMesh.clone();
      menubarMesh = cloneMesh.clone();
      meshHeight = 24;
      this.lastFocusedMesh = avatar.avatarPositionTN.assetMeta.boundingMesh;
    } else if (assetMeta.asteroidType) {
      let cloneMesh = assetMeta.basePivot;
      mesh = cloneMesh.clone();
      menubarMesh = cloneMesh.clone();
      this.lastFocusedMesh = assetMeta.basePivot;
    } else {
      if (assetMeta.lava) {
        mesh = await U3D.loadStaticMesh(this.app.scene, assetMeta.containerPath, assetMeta);
        menubarMesh = this.app.staticBoardObjects[assetMeta.id].baseMesh.clone();
      } else {
        let cloneMesh = this.app.staticBoardObjects[assetMeta.id].baseMesh;
        mesh = cloneMesh.clone();
        menubarMesh = cloneMesh.clone();
      }

      this.lastFocusedMesh = this.obj(assetMeta.id).boundingMesh;

      if (!assetMeta.texturePath)
        boundsWrapperNeeded = true;
    }

    mesh.parent = null;
    menubarMesh.parent = null;
    U3D.sizeNodeToFit(menubarMesh, 5.25);
    U3D.sizeNodeToFit(mesh, meshHeight);
    menubarMesh.showBoundingBox = false;

    if (boundsWrapperNeeded) {
      let boundingBox = new BABYLON.Mesh("boundingBoxselectedAsset", this.app.scene);
      boundingBox.setBoundingInfo(new BABYLON.BoundingInfo(U3D.v(meshHeight / -2), U3D.v(meshHeight / 2)));
      //boundingBox.showBoundingBox = true;
      boundingBox.isPickable = false;
      boundingBox.parent = this.selectedContainerTransform;
      boundingBox.position.y = 0.25;
      mesh.showBoundingBox = false;
    } else {
      //mesh.showBoundingBox = true;
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
    mesh.setEnabled(true);

    if (this.selectedAssetLabel)
      this.selectedAssetLabel.dispose(false, true);
    this.selectedAssetLabel = U3D.addTextPlane(this.app.scene, desc, U3D.color("1,1,1"), 1.25);
    this.selectedAssetLabel.position = U3D.v(8, this.menuLineBottom, 0);
    this.selectedAssetLabel.parent = this.app.menuBarTabButtonsTN;

    if (this.selectedAssetMiniClone)
      this.selectedAssetMiniClone.dispose();
    this.selectedAssetMiniClone = menubarMesh;
    this.selectedAssetMiniClone.parent = this.app.menuBarTabButtonsTN;
    this.selectedAssetMiniClone.position = U3D.v(8, 2.5, -0.5);
    this.selectedAssetMiniClone.rotation = U3D.v(0, 0, 0);

    if (this.app.chanactionChannelHelpernelAction)
      this.app.actionChannelHelper.updateCardsForPlayer();
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
      let index = meta.seatIndex + 1;
      if (index > 3)
        index = 0;

      this.setSelectedAsset(this.app.avatarHelper.initedAvatars[index].avatarPositionTN.assetMeta);
    } else if (meta.actionCardType) {
      let index = meta.cardIndex + 1;
      if (index > 5) index = 0;
      this.setSelectedAsset(this.app.actionChannelHelper.cardItemMeta[index]);
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
  _updatePlayerTabAvatar(seatIndex) {
    if (this.dockSeatContainers[seatIndex].avatarTN) {
      this.dockSeatContainers[seatIndex].avatarTN.dispose();
      this.dockSeatContainers[seatIndex].cloneMesh.dispose();
    }

    let avatar = this.app.avatarHelper.initedAvatars[seatIndex];
    let cloneMesh = avatar.avatarPositionTN.assetMeta.boundingMesh.clone();
    let avatarTN = new BABYLON.TransformNode('seatavatarTN' + seatIndex, this.app.scene);
    cloneMesh.parent = avatarTN;
    avatarTN.parent = this.dockSeatContainers[seatIndex];
    this.dockSeatContainers[seatIndex].avatarTN = avatarTN;
    this.dockSeatContainers[seatIndex].cloneMesh = cloneMesh;

    U3D.sizeNodeToFit(cloneMesh, this.dockSeatHeight / 2);
    cloneMesh.showBoundingBox = false;
    avatarTN.rotation.y = Math.PI;
    avatarTN.position = U3D.v(0, -1.75, 0);
    cloneMesh.isPickable = true;
    cloneMesh.assetMeta = {
      name: avatar.avatarPositionTN.assetMeta.name,
      extended: {},
      appClickable: true,
      avatarType: true,
      seatIndex,
      basePivot: avatarTN,
      baseMesh: cloneMesh,
      boundingMesh: cloneMesh,
      clickCommand: 'customClick',
      appClickable: true,
      handlePointerDown: () => {
        this.setSelectedAsset(avatar.avatarPositionTN.assetMeta);
      }
    };
  }
  initPlayerPanel() {
    this.dockSeatContainers = [];
    this.dockSeatHeight = 16;
    this.dockSeatWidth = 6.5;
    let left = this.dockSeatWidth * -1.5;
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      let avatarMeta = this.app.avatarMetas[seatIndex];
      let colors = U3D.color(avatarMeta.primaryColor);
      let playerColor = new BABYLON.Color3(colors.r, colors.g, colors.b);

      let dockSeatContainer = new BABYLON.TransformNode('dockSeatContainer' + seatIndex, this.app.scene);
      dockSeatContainer.position = U3D.v(left + (seatIndex * this.dockSeatWidth), this.dockSeatHeight / 2 - 1.75, 0);
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
        height: this.dockSeatHeight + 0.5,
        width: this.dockSeatWidth - 0.5
      }, this.app.scene);
      let panelMat = new BABYLON.StandardMaterial("menuCardBackPanel" + seatIndex, this.app.scene);
      let t = new BABYLON.Texture('/images/cardhollow.png', this.app.scene);
      panelMat.opacityTexture = t;
      panelMat.diffuseColor = playerColor;
      panelMat.ambientColor = playerColor;
      panelMat.emissiveColor = playerColor;

      seatBackPanel.material = panelMat;
      seatBackPanel.parent = dockSeatContainer;

      this._updatePlayerTabAvatar(seatIndex);

      let cloneMoon = this.app.playerMoonAssets[seatIndex].baseMesh.clone();
      cloneMoon.showBoundingBox = false;
      cloneMoon.isPickable = true;
      cloneMoon.parent = dockSeatContainer;
      U3D.sizeNodeToFit(cloneMoon, this.dockSeatHeight / 5);
      cloneMoon.assetMeta = {
        appClickable: true,
        clickCommand: "customClick",
        handlePointerDown: () => {
          this.setSelectedAsset(this.app.playerMoonAssets[seatIndex].assetMeta);
        }
      };
      dockSeatContainer.moonAnimDetails = U3D.selectedRotationAnimation(cloneMoon, this.app.scene);
      cloneMoon.parent = dockSeatContainer.moonAnimDetails.rotationPivot;
      dockSeatContainer.moonAnimDetails.rotationPivot.parent = dockSeatContainer;
      dockSeatContainer.moonAnimDetails.rotationPivot.position = U3D.v(0, this.dockSeatHeight / 2 - 2.5, 1.65);
      cloneMoon.position = U3D.v(0);
      dockSeatContainer.moonAnimDetails.runningAnimation.pause();

      dockSeatContainer.standButton = this.addActionPanelButton("/fontcons/remove.png?seatindex=" + seatIndex.toString(), 'Free Avatar', () => {
        this.app._gameAPIStand(seatIndex);
        dockSeatContainer.standButton.setEnabled(false);
      }, 1.5);
      dockSeatContainer.standButton.parent = dockSeatContainer;
      dockSeatContainer.standButton.position = U3D.v(1.5, this.dockSeatHeight / 2 - 1.25, -0.5);

      dockSeatContainer.sitButton = this.addActionPanelButton('/fontcons/greenchair.png?seatindex=' + seatIndex.toString(), "Play Avatar", () => {
        this.app.dockSit(seatIndex);
        dockSeatContainer.sitButton.setEnabled(false);
      }, 1.5);
      dockSeatContainer.sitButton.parent = dockSeatContainer;
      dockSeatContainer.sitButton.position = U3D.v(1.5, this.dockSeatHeight / 2 - 1.25, -0.5);

      let logoHolder = BABYLON.MeshBuilder.CreatePlane("avatarimageplanemenubar" + seatIndex, {
          height: 1.5,
          width: 1.5
        },
        this.app.scene);
      logoHolder.position = U3D.v(-1.5, this.dockSeatHeight / -2 + 1.35, 0);
      logoHolder.material = dockSeatContainer.playerImageMaterial;
      logoHolder.parent = dockSeatContainer;

      let ofNameX = 1.25;
      let moonNameX = 0.25;
      if (seatIndex === 1) {
        ofNameX = 1.4;
        moonNameX = 0.75;
      } else if (seatIndex === 2) {
        ofNameX = 2.25;
        moonNameX = 0.25;
      } else if (seatIndex === 3) {
        ofNameX = 1.85;
        moonNameX = 0.5;
      }

      let moonDesc = this.app.playerMoonAssets[seatIndex].assetMeta.name;
      let moonName = U3D.addTextPlane(this.app.scene, moonDesc, playerColor);
      moonName.scaling = U3D.v(2.25);
      moonName.position = U3D.v(moonNameX, this.dockSeatHeight / 2 + 1, 0);
      moonName.parent = dockSeatContainer;

      let ofName = U3D.addTextPlane(this.app.scene, 'of', U3D.color('1,1,1'));
      ofName.scaling = U3D.v(1.25);
      ofName.position = U3D.v(-this.dockSeatWidth / 2 + ofNameX, this.dockSeatHeight / 2 + 1, 0);
      ofName.parent = dockSeatContainer;

      let avatarName = U3D.addTextPlane(this.app.scene, avatarMeta.name, playerColor);
      avatarName.scaling = U3D.v(2.25);
      avatarName.position = U3D.v(0, this.dockSeatHeight / 2 + 2.5, 0);
      avatarName.parent = dockSeatContainer;

      let logoHolder2 = BABYLON.MeshBuilder.CreatePlane("avatarimageplaneworld" + seatIndex, {
          height: 0.67,
          width: 0.67,
          sideOrientation: BABYLON.Mesh.DOUBLESIDE
        },
        this.app.scene);
      logoHolder2.position = U3D.v(0, 0.05, -1.5);
      logoHolder2.rotation = U3D.v(Math.PI / 2, -Math.PI / 2, Math.PI / 2);
      logoHolder2.material = dockSeatContainer.playerImageMaterial;
      logoHolder2.parent = this.app.avatarHelper.initedAvatars[seatIndex].avatarPositionTN;
    }

  }
  _initMoonFlagPole(seatIndex) {
    let flagPoleHolder = new BABYLON.TransformNode('flagpoleholder' + seatIndex, this.app.scene);
    let moonAssetId = this.app.playerMoonAssets[seatIndex].assetMeta.id;
    flagPoleHolder.parent = this.app.parentMeshForId(moonAssetId);
    flagPoleHolder.scaling = U3D.v(0.2);
    flagPoleHolder.position.y = 0.45;
    flagPoleHolder.billboardMode = BABYLON.TransformNode.BILLBOARDMODE_Y;

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
          seatContainer.avatarNamePlate.dispose(false, true);
          seatContainer.namePlate1 = null;
          seatContainer.namePlate2 = null;
          seatContainer.avatarNamePlate = null;
        }

        seatContainer.standButton.setEnabled(false);
        seatContainer.sitButton.setEnabled(false);

        if (seatData.seated) {
          let names = seatData.name.split(' ');

          let avatarMeta = this.app.avatarMetas[seatIndex];
          let color = U3D.color(avatarMeta.primaryColor);

          seatContainer.namePlate1 = U3D.addTextPlane(this.app.scene, names[0], color);
          seatContainer.namePlate1.position = U3D.v(0.85, this.dockSeatHeight / -2 + 1.75, 0);
          seatContainer.namePlate1.scaling = U3D.v(0.8, 1, 1);
          seatContainer.namePlate1.parent = seatContainer.playerDetailsTN;

          let name2 = '';
          if (names[1]) name2 = names[1];
          seatContainer.namePlate2 = U3D.addTextPlane(this.app.scene, name2, color);
          seatContainer.namePlate2.position = U3D.v(0.85, this.dockSeatHeight / -2 + 0.8, 0);
          seatContainer.namePlate2.scaling = U3D.v(0.8, 1, 1);
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

          seatContainer.avatarNamePlate = U3D.addTextPlane(this.app.scene, seatData.name, color);
          seatContainer.avatarNamePlate.position = U3D.v(0, 0.05, -1);
          seatContainer.avatarNamePlate.rotation = U3D.v(Math.PI / 2, 0, Math.PI);
          seatContainer.avatarNamePlate.scaling = U3D.v(0.3);
          seatContainer.avatarNamePlate.parent = this.app.avatarHelper.initedAvatars[seatIndex].avatarPositionTN;

        } else {
          seatContainer.sitButton.setEnabled(true);
          seatContainer.playerImageMaterial.alpha = 0;
        }

        this.app.avatarHelper.updateUserAvatar(seatIndex, seatData);
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

  async loadISS() {
    if (this.ISSLoaded)
      return;
    this.ISSLoaded = true;
    let path = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fsolar%2F' +
      encodeURIComponent('iss.glb') + '?alt=media';

    if (!window.staticMeshContainer[path])
      window.staticMeshContainer[path] = await BABYLON.SceneLoader.LoadAssetContainerAsync(path, "", this.app.scene);

    let result = window.staticMeshContainer[path].instantiateModelsToScene();
    let mesh = result.rootNodes[0];

    U3D.sizeNodeToFit(mesh, 50);

    mesh.position = U3D.v(5, 30, 5);
  }
}
