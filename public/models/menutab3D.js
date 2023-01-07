import U3D from '/models/utility3d.js';

export default class MenuTab3D {
  constructor(app) {
    this.app = app;
    this.scene = app.scene;
    this.seatIndexColoredButtons = [];
  }
  _refreshSeatIndexStatus() {
    this.seatIndexColoredButtons.forEach(mesh => {
      let mat = mesh.material;
      let colors = U3D.get3DColors(this.app.activeSeatIndex);

      mat.emissiveColor = colors;
      mat.diffuseColor = colors;
      mat.ambientColor = colors;
    });
  }
  obj(name) {
    return this.app.staticBoardObjects[name];
  }
  initOptionsBar() {
    let scoreMenuBtn = this.addActionPanelButton('score', async (pointerInfo, mesh, meta) => {
      this.selectedMenuBarTab(this.scoreMenuTab);
    });
    scoreMenuBtn.parent = this.app.menuBarTabButtonsTN;
    scoreMenuBtn.position.x = -25;

    let optionsMenuBtn = this.addActionPanelButton('gear', async (pointerInfo, mesh, meta) => {
      this.selectedMenuBarTab(this.optionsMenuTab);
    });
    optionsMenuBtn.parent = this.app.menuBarTabButtonsTN;
    optionsMenuBtn.position.x = -20;

    let playersMoonsMenuBtn = this.addActionPanelButton('diversity', async (pointerInfo, mesh, meta) => {
      this.selectedMenuBarTab(this.playerMoonPanelTab);
    });
    playersMoonsMenuBtn.parent = this.app.menuBarTabButtonsTN;
    playersMoonsMenuBtn.position.x = -15;

    let selectedObjectMenuBtn = this.addActionPanelButton('inspectobject', async (pointerInfo, mesh, meta) => {
      this.selectedMenuBarTab(this.focusPanelTab);
    });
    selectedObjectMenuBtn.parent = this.app.menuBarTabButtonsTN;
    selectedObjectMenuBtn.position.x = -10;

    this.scoreMenuTab = new BABYLON.TransformNode('scoreMenuTab', this.app.scene);
    this.scoreMenuTab.parent = this.app.menuBarLeftTN;
    this.scoreMenuTab.position.y = 0;
    this.scoreMenuTab.setEnabled(false);
    this.initScoreTab();

    this.optionsMenuTab = new BABYLON.TransformNode('optionsMenuTab', this.app.scene);
    this.optionsMenuTab.parent = this.app.menuBarLeftTN;
    this.optionsMenuTab.position.y = 0;
    this.optionsMenuTab.setEnabled(false);
    this.initOptionsTab(this.optionsMenuTab);

    this.focusPanelTab = new BABYLON.TransformNode('focusPanelTab', this.app.scene);
    this.focusPanelTab.parent = this.app.menuBarLeftTN;
    this.focusPanelTab.position.y = 0;
    this.focusPanelTab.setEnabled(false);
    this.initFocusedAssetPanel(this.focusPanelTab);

    this.playerMoonPanelTab = new BABYLON.TransformNode('playerMoonPanelTab', this.app.scene);
    this.playerMoonPanelTab.parent = this.app.menuBarLeftTN;
    this.playerMoonPanelTab.position.y = 0;
    this.playerMoonPanelTab.setEnabled(false);
  }
  addActionPanelLabel(text, font_family = "Arial") {
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

    let plane = BABYLON.MeshBuilder.CreatePlane(id + "textplane", {
      width: planeWidth,
      height: planeHeight,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.app.scene);
    plane.isPickable = false;
    plane.material = mat;

    this.seatIndexColoredButtons.push(plane);

    return plane;
  }
  addActionPanelButton(iconName, handlePointerDown) {
    let texturePath = '/fontcons/' + iconName + '.svg';
    let mesh = BABYLON.MeshBuilder.CreatePlane(iconName, {
      width: 3,
      height: 3,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    let mat = new BABYLON.StandardMaterial(iconName + 'disc-mat', this.scene);

    let tex = new BABYLON.Texture(texturePath, this.scene, false, false);
    tex.hasAlpha = true;
    mat.opacityTexture = tex;
    mat.emissiveColor = new BABYLON.Color3(0, 0.5, 1);
    mat.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
    mat.ambientColor = new BABYLON.Color3(0.25, 0, 1);
    mesh.material = mat;
    mesh.rotation.x = Math.PI;

    if (handlePointerDown) {
      mesh.assetMeta = {
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown
      };
    }

    this.seatIndexColoredButtons.push(mesh);

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

  initOptionsTab(parent) {
    let asteroidCountLabel = this.addActionPanelLabel('Asteroid Count');
    asteroidCountLabel.position = U3D.v(-25, 7, 0);
    asteroidCountLabel.parent = parent;

    let asteroidDownCountBtn = this.addActionPanelButton('minus', () => this.app.asteroidCountChange(-20));
    asteroidDownCountBtn.position = U3D.v(-12, 7, 0);
    asteroidDownCountBtn.parent = parent;

    let asteroidUpCountBtn = this.addActionPanelButton('plus', () => this.app.asteroidCountChange(20));
    asteroidUpCountBtn.position = U3D.v(-6, 7, 0);
    asteroidUpCountBtn.parent = parent;
    this.updateAsteroidOptions();
  }
  updateAsteroidOptions() {
    if (this.asteroidCountLabel)
      this.asteroidCountLabel.dispose(false, true);
    let count = this.app.asteroidHelper.getAsteroidCount(this.app.profile.asteroidCount);
    this.asteroidCountLabel = this.addActionPanelLabel(count.toString(), "Impact");
    this.asteroidCountLabel.position = U3D.v(5, 7, 0);
    this.asteroidCountLabel.parent = this.optionsMenuTab;

    if (this.asteroidWireframeBtn)
      this.asteroidWireframeBtn.dispose(false, true);
    let wireframe = this.app.profile.asteroidWireframe === true;
    let wireframeDesc = wireframe ? 'Solid' : 'Wireframe';


    this.asteroidWireframeBtn = U3D.addDefaultText(this.app.scene, wireframeDesc);
    this.asteroidWireframeBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.asteroidChangeMaterial(!wireframe, null, null);
      }
    };
    this.asteroidWireframeBtn.position.x = -24;
    this.asteroidWireframeBtn.position.y = 11;
    this.asteroidWireframeBtn.position.z = 10;
    this.asteroidWireframeBtn.scaling = U3D.v(3);
    this.asteroidWireframeBtn.parent = this.optionsMenuTab;

    if (this.asteroidTextureBtn)
      this.asteroidTextureBtn.dispose(false, true);
    let profileTexture = this.app.profile.asteroidColorOnly === true;
    let profileDesc = profileTexture ? 'Color' : 'Rocky';
    this.asteroidTextureBtn = U3D.addDefaultText(this.app.scene, profileDesc);
    this.asteroidTextureBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.asteroidChangeMaterial(null, !profileTexture, null);
      }
    };
    this.asteroidTextureBtn.position.x = -14;
    this.asteroidTextureBtn.position.y = 11;
    this.asteroidTextureBtn.position.z = 10;
    this.asteroidTextureBtn.scaling = U3D.v(3);
    this.asteroidTextureBtn.parent = this.optionsMenuTab;

    if (this.asteroidInternalLogos)
      this.asteroidInternalLogos.dispose(false, true);
    let includeLogos = this.app.profile.asteroidExcludeLogos === true;
    let logoDesc = includeLogos ? 'Logos' : 'No Logos';
    this.asteroidInternalLogos = U3D.addDefaultText(this.app.scene, logoDesc);
    this.asteroidInternalLogos.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.asteroidChangeMaterial(null, null, !includeLogos);
      }
    };
    this.asteroidInternalLogos.position.x = -4;
    this.asteroidInternalLogos.position.y = 11;
    this.asteroidInternalLogos.position.z = 10;
    this.asteroidInternalLogos.scaling = U3D.v(3);
    this.asteroidInternalLogos.parent = this.optionsMenuTab;

    this._refreshSeatIndexStatus();
  }

  initScoreTab() {
    this.gameActionsPanel = new BABYLON.TransformNode('gameActionsPanel', this.app.scene);
    this.gameActionsPanel.parent = this.scoreMenuTab;
    this.gameActionsPanel.position.y = 1;
    this.gameActionsPanel.position.z = 1;

    this.startGameButton = U3D.addDefaultText(this.scene, "START Game", "#ffffff");
    this.startGameButton.parent = this.gameActionsPanel;
    this.startGameButton.scaling = U3D.v(2, 2, 2);
    this.startGameButton.position.x = -10;
    this.startGameButton.position.y = 10;
    this.startGameButton.position.z = 5;
    this.startGameButton.setEnabled(false);

    this.endGameButton = U3D.addDefaultText(this.scene, "END Game", "#440000");
    this.endGameButton.parent = this.gameActionsPanel;
    this.endGameButton.scaling = U3D.v(2, 2, 2);
    this.endGameButton.position.x = -10;
    this.endGameButton.position.y = 10;
    this.endGameButton.position.z = 5;

    this.endTurnButton = U3D.addDefaultText(this.scene, "End Turn", "#00ff00");
    this.endTurnButton.parent = this.gameActionsPanel;
    this.endTurnButton.scaling = U3D.v(2, 2, 2);
    this.endTurnButton.position.x = -20;
    this.endTurnButton.position.y = 10;
    this.endTurnButton.position.z = 5;
    this.endTurnButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.clickEndTurn();
      }
    };

    this.initTurnHistoryPanel(this.scoreMenuTab);
  }
  initTurnHistoryPanel(parent) {
    let nextSelectedMetaBtn = this.addActionPanelButton('next', async (pointerInfo, mesh, meta) => {
      this.app.paintedBoardTurn = this.app.paintedBoardTurn + 1;
    });
    nextSelectedMetaBtn.position.x = -16;
    nextSelectedMetaBtn.position.y = 2;
    nextSelectedMetaBtn.position.z = 5;
    nextSelectedMetaBtn.scaling = U3D.v(0.5);
    nextSelectedMetaBtn.parent = parent;

    let previousSelectedMetaBtn = this.addActionPanelButton('previous', async (pointerInfo, mesh, meta) => {
      this.app.paintedBoardTurn = this.app.paintedBoardTurn - 1;
    });
    previousSelectedMetaBtn.position.x = -26;
    previousSelectedMetaBtn.position.y = 2;
    previousSelectedMetaBtn.position.z = 5;
    previousSelectedMetaBtn.scaling = U3D.v(0.5);
    previousSelectedMetaBtn.parent = parent;
  }
  updateMenubarLabel() {
    if (this.app.boardTurnLabel === this.paintedLabel)
      return;
    this.paintedLabel = this.app.boardTurnLabel;

    if (this.selectedRoundIndexPanel)
      this.selectedRoundIndexPanel.dispose(false, true);

    this.selectedRoundIndexPanel = U3D.addDefaultText(this.app.scene, this.app.boardTurnLabel, '#aaffaa');
    this.selectedRoundIndexPanel.position.x = -21;
    this.selectedRoundIndexPanel.position.y = 2;
    this.selectedRoundIndexPanel.position.z = 5;
    this.selectedRoundIndexPanel.scaling = U3D.v(2);
    this.selectedRoundIndexPanel.parent = this.scoreMenuTab;

    this._refreshSeatIndexStatus();
  }

  async initFocusedAssetPanel(parent) {
    let scene = this.app.scene;

    let followSelectedMetaBtn = U3D.addDefaultText(scene, 'Follow [B]', "rgb(0, 200, 0)");
    followSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.bButtonPress();
      }
    };
    followSelectedMetaBtn.position.x = -1;
    followSelectedMetaBtn.position.y = -3.5;
    followSelectedMetaBtn.position.z = -5;
    followSelectedMetaBtn.scaling = U3D.v(2, 2, 2);
    followSelectedMetaBtn.parent = parent;

    let followStopBtn = U3D.addDefaultText(scene, 'Stop [A]', "rgb(200, 0, 0)");
    followStopBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.aButtonPress();
      }
    };
    followStopBtn.position.x = 5.75;
    followStopBtn.position.y = -3.5;
    followStopBtn.position.z = -5;
    followStopBtn.scaling = U3D.v(2, 2, 2);
    followStopBtn.parent = parent;

    let nextSelectedMetaBtn = this.addActionPanelButton('next', async (pointerInfo, mesh, meta) => {
      this.nextSelectedObject();
    });
    nextSelectedMetaBtn.position.x = 7.5;
    nextSelectedMetaBtn.position.y = 5;
    nextSelectedMetaBtn.position.z = -5;
    nextSelectedMetaBtn.parent = parent;

    let previousSelectedMetaBtn = this.addActionPanelButton('previous', async (pointerInfo, mesh, meta) => {
      this.nextSelectedObject(true);
    });
    previousSelectedMetaBtn.position.x = -3.5;
    previousSelectedMetaBtn.position.y = 5;
    previousSelectedMetaBtn.position.z = -5;
    previousSelectedMetaBtn.parent = parent;

    this.normalAssetSizeBtn = U3D.addDefaultText(scene, 'Better');
    this.normalAssetSizeBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.normalAssetSizeBtn.setEnabled(false);
        this.updateAssetSize('normal');
      }
    };
    this.normalAssetSizeBtn.position.x = 2.9;
    this.normalAssetSizeBtn.position.y = -1.25;
    this.normalAssetSizeBtn.position.z = -5;
    this.normalAssetSizeBtn.scaling = U3D.v(2);
    this.normalAssetSizeBtn.parent = parent;

    this.assetPanelHugeButton = U3D.addDefaultText(scene, 'Best');
    this.assetPanelHugeButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.assetPanelHugeButton.setEnabled(false);
        this.updateAssetSize('huge');
      }
    };
    this.assetPanelHugeButton.position.x = 6.75;
    this.assetPanelHugeButton.position.y = -1.25;
    this.assetPanelHugeButton.position.z = -5;
    this.assetPanelHugeButton.scaling = U3D.v(2);
    this.assetPanelHugeButton.parent = parent;

    this.assetSmallSizeButton = U3D.addDefaultText(scene, 'Normal');
    this.assetSmallSizeButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.assetSmallSizeButton.setEnabled(false);
        this.updateAssetSize('small');
      }
    };
    this.assetSmallSizeButton.position.x = -1.75;
    this.assetSmallSizeButton.position.y = -1.25;
    this.assetSmallSizeButton.position.z = -5;
    this.assetSmallSizeButton.scaling = U3D.v(2);
    this.assetSmallSizeButton.parent = parent;

    this.setSelectedAsset(this.obj('e1_luna').assetMeta);

    this.playerCardsTN = new BABYLON.TransformNode('playerCardsTN', scene);
    this.playerCardsTN.parent = parent;
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

    if (this.app.staticBoardObjects[id].moonCloneMesh) {
      let moonCloneInstance = window.staticMeshContainer[this.app.staticBoardObjects[id].assetMeta.containerPath].instantiateModelsToScene();
      let moonCloneMesh = moonCloneInstance.rootNodes[0];
      moonCloneMesh.parent = this.app.staticBoardObjects[id].moonCloneMesh.parent;
      this.app.staticBoardObjects[id].moonCloneMesh.dispose();
      this.app.staticBoardObjects[id].moonCloneMesh = moonCloneMesh;
      U3D.sizeNodeToFit(moonCloneMesh, 2.5);
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

    if (assetMeta.asteroidType)
      mesh.material = this.app.asteroidHelper.selectedAsteroidMaterial;

    if (this.selectedAssetLabel)
      this.selectedAssetLabel.dispose(false, true);

    this.selectedAssetLabel = U3D.addDefaultText(this.app.scene, desc, "#0000FF", "#ffffff");
    this.selectedAssetLabel.position.x = 2;
    this.selectedAssetLabel.position.y = 1.5;
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

  showAssetNamePlate(meta) {
    if (this.displayedNamePlate)
      this.displayedNamePlate.dispose(false, true);

    let nameDesc = meta.name;
    if (meta.solarPosition)
      nameDesc += ` (${meta.solarPosition})`;
    if (meta.asteroidType) {
      nameDesc = nameDesc.replace('.obj', '');
      nameDesc = nameDesc.charAt(0).toUpperCase() + nameDesc.slice(1);
    }

    let color = "rgb(200, 0, 0)";
    if (meta.color)
      color = meta.color;

    let width = 3;
    let height = 2;
    if (nameDesc.length > 6) {
      //  height = 2;
      width = 6;
    }

    let yOffset = meta.yOffset !== undefined ? meta.yOffset : 1.25;
    if (meta.avatarType) {
      let colors = U3D.get3DColors(meta.seatIndex);
      color = U3D.colorRGB255(colors.r + ',' + colors.g + ',' + colors.b);
      yOffset = 2.25;
    }

    this.displayedNamePlate = U3D.addDefaultText(this.app.scene, nameDesc, color, 'transparent');
    this.displayedNamePlate.billboardMode = 7;
    this.displayedNamePlate.position.y = yOffset;
    this.displayedNamePlate.parent = meta.basePivot;
    if (meta.assetSymbolPanel)
      meta.assetSymbolPanel.setEnabled(false);
  }
  hideAssetNamePlate(meta) {
    if (this.displayedNamePlate) {
      this.displayedNamePlate.dispose(false, true);
      this.displayedNamePlate = null;
    }

    if (meta.assetSymbolPanel)
      meta.assetSymbolPanel.setEnabled(true);
  }
}
