import U3D from '/models/utility3d.js';

export default class MenuTab3D {
  constructor(app) {
    this.app = app;
    this.scene = app.scene;
  }
  obj(name) {
    return this.app.staticBoardObjects[name];
  }

  initOptionsBar() {
    let scene = this.app.scene;
    let parent = this.app.menuBarTabButtonsTN;
    let panel = this.app.menuBarLeftTN;

    this.addTabButtons(parent);

    this.scoreMenuTab = new BABYLON.TransformNode('scoreMenuTab', scene);
    this.scoreMenuTab.parent = panel;
    this.scoreMenuTab.position.y = 0;
    this.scoreMenuTab.setEnabled(false);
    this.initScoreTab();

    this.optionsMenuTab = new BABYLON.TransformNode('optionsMenuTab', scene);
    this.optionsMenuTab.parent = panel;
    this.optionsMenuTab.position.y = 0;
    this.optionsMenuTab.setEnabled(false);
    this.initOptionsTab(this.optionsMenuTab);

    this.focusPanelTab = new BABYLON.TransformNode('focusPanelTab', scene);
    this.focusPanelTab.parent = panel;
    this.focusPanelTab.position.y = 0;
    this.focusPanelTab.setEnabled(false);
    this.initFocusedAssetPanel(this.focusPanelTab);

    this.playerMoonPanelTab = new BABYLON.TransformNode('playerMoonPanelTab', scene);
    this.playerMoonPanelTab.parent = panel;
    this.playerMoonPanelTab.position.y = 0;
    this.playerMoonPanelTab.setEnabled(false);
  }
  addTabButtons(tabBar) {
    let scoreMenuBtn = this.addIconBtn('score', 'scoreMenuBtn');
    scoreMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.scoreMenuTab);
      }
    };
    scoreMenuBtn.parent = tabBar;
    scoreMenuBtn.position.x = -25;
    scoreMenuBtn.position.z = 2;

    let optionsMenuBtn = this.addIconBtn('gear', 'optionsMenuBtn');
    optionsMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.optionsMenuTab);
      }
    };
    optionsMenuBtn.parent = tabBar;
    optionsMenuBtn.position.x = -20;
    optionsMenuBtn.position.z = 2;

    let playersMoonsMenuBtn = this.addIconBtn('diversity', 'playersMoonsMenuBtn');
    playersMoonsMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.playerMoonPanelTab);
      }
    };
    playersMoonsMenuBtn.parent = tabBar;
    playersMoonsMenuBtn.position.x = -15;
    playersMoonsMenuBtn.position.z = 2;

    let selectedObjectMenuBtn = this.addIconBtn('inspectobject', 'selectedObjectMenuBtn');
    selectedObjectMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.focusPanelTab);
      }
    };
    selectedObjectMenuBtn.parent = tabBar;
    selectedObjectMenuBtn.position.x = -10;
    selectedObjectMenuBtn.position.z = 2;
  }
  addIconBtn(iconName, name = 'random') {
    let texturePath = '/fontcons/' + iconName + '.svg';
    let mesh = BABYLON.MeshBuilder.CreatePlane(name, {
      width: 3,
      height: 3,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    let mat = new BABYLON.StandardMaterial(name + 'disc-mat', this.scene);

    let tex = new BABYLON.Texture(texturePath, this.scene, false, false);
    tex.hasAlpha = true;
    mat.opacityTexture = tex;
    mat.emissiveColor = new BABYLON.Color3(0, 0.5, 1);
    mat.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
    mat.ambientColor = new BABYLON.Color3(0.25, 0, 1);
    mesh.material = mat;
    mesh.rotation.x = Math.PI;

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
    let skyboxLabel = U3D.addTextPlane(this.app.scene, 'Skybox');
    skyboxLabel.position.x = -21;
    skyboxLabel.position.y = 4;
    skyboxLabel.position.z = 4;
    skyboxLabel.scaling = U3D.v(2);
    skyboxLabel.parent = parent;

    let skyboxPrev = this.addIconBtn('previous');
    skyboxPrev.position.x = -15;
    skyboxPrev.position.y = 4;
    skyboxPrev.position.z = 4;
    skyboxPrev.scaling = U3D.v(0.5);
    skyboxPrev.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.switchSkyboxNext(true);
      }
    };
    skyboxPrev.parent = parent;

    let skyboxNext = this.addIconBtn('next');
    skyboxNext.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.switchSkyboxNext();
      }
    };
    skyboxNext.position.x = -13;
    skyboxNext.position.y = 4;
    skyboxNext.position.z = 4;
    skyboxNext.scaling = U3D.v(0.5);
    skyboxNext.parent = parent;
    this.updateSkyboxLabel();

    let asteroidCountLabel = U3D.addTextPlane(this.app.scene, 'Asteroid Count');
    asteroidCountLabel.position.x = -22;
    asteroidCountLabel.position.y = 7;
    asteroidCountLabel.position.z = 7;
    asteroidCountLabel.scaling = U3D.v(2);
    asteroidCountLabel.parent = parent;

    let asteroidDownCountBtn = this.addIconBtn('minus');
    asteroidDownCountBtn.position.x = -15;
    asteroidDownCountBtn.position.y = 7;
    asteroidDownCountBtn.position.z = 7;
    asteroidDownCountBtn.scaling = U3D.v(0.5);
    asteroidDownCountBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.asteroidCountChange(-20);
      }
    };
    asteroidDownCountBtn.parent = parent;

    let asteroidUpCountBtn = this.addIconBtn('plus');
    asteroidUpCountBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.asteroidCountChange(20);
      }
    };
    asteroidUpCountBtn.position.x = -13;
    asteroidUpCountBtn.position.y = 7;
    asteroidUpCountBtn.position.z = 7;
    asteroidUpCountBtn.scaling = U3D.v(0.5);
    asteroidUpCountBtn.parent = parent;
    this.updateAsteroidOptions();
  }
  updateSkyboxLabel() {
    if (this.skyboxNamePanel)
      this.skyboxNamePanel.dispose(false, true);

    let skybox = this.app.profile.skyboxPath;
    if (!skybox)
      skybox = '';
    let pieces = skybox.split('_');
    pieces.forEach((piece, i) => {
      piece = piece.charAt(0).toUpperCase() + piece.slice(1);
      pieces[i] = piece;
    })
    skybox = pieces.join(' ');
    this.skyboxNamePanel = U3D.addTextPlane(this.app.scene, skybox, 'skyboxNamePanel');
    this.skyboxNamePanel.position.x = 0;
    this.skyboxNamePanel.position.y = 4;
    this.skyboxNamePanel.position.z = 4;
    this.skyboxNamePanel.scaling = U3D.v(2);
    this.skyboxNamePanel.parent = this.optionsMenuTab;
  }
  skyboxList() {
    return [
      'milkyway8k',
      'stars8k',
      'nebula_orange_blue',
      'moon_high_clear',
      'moonless_2',
      'nebula_black',
      'nebula_blue_red',
      'nebula_cold',
      'nebula_glow',
      'nebula_green',
      'nebula_red',
      'neon_starless',
      'vortex_starless'
    ];
  }
  updateAsteroidOptions() {
    if (this.asteroidCountLabel)
      this.asteroidCountLabel.dispose(false, true);
    let count = this.app.asteroidHelper.getAsteroidCount(this.app.profile.asteroidCount);
    this.asteroidCountLabel = U3D.addTextPlane(this.app.scene, count.toString(), "asteroidCountLabel", "Impact", "", "#ffffff");
    this.asteroidCountLabel.position.x = 0;
    this.asteroidCountLabel.position.y = 7;
    this.asteroidCountLabel.position.z = 7;
    this.asteroidCountLabel.scaling = U3D.v(2);
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
    let nextSelectedMetaBtn = this.addIconBtn('next', 'nextSelectedMetaBtn');
    nextSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.paintedBoardTurn = this.app.paintedBoardTurn + 1;
      }
    };
    nextSelectedMetaBtn.position.x = -16;
    nextSelectedMetaBtn.position.y = 2;
    nextSelectedMetaBtn.position.z = 5;
    nextSelectedMetaBtn.scaling = U3D.v(0.5);
    nextSelectedMetaBtn.parent = parent;

    let previousSelectedMetaBtn = this.addIconBtn('previous', 'previousSelectedMetaBtn');
    previousSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.paintedBoardTurn = this.app.paintedBoardTurn - 1;
      }
    };
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

    let nextSelectedMetaBtn = this.addIconBtn('next', 'nextSelectedMetaBtn');
    nextSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.nextSelectedObject();
      }
    };
    nextSelectedMetaBtn.position.x = 7.5;
    nextSelectedMetaBtn.position.y = 5;
    nextSelectedMetaBtn.position.z = -5;
    nextSelectedMetaBtn.scaling = U3D.v(1);
    nextSelectedMetaBtn.parent = parent;

    let previousSelectedMetaBtn = this.addIconBtn('previous', 'previousSelectedMetaBtn');
    previousSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.nextSelectedObject(true);
      }
    };
    previousSelectedMetaBtn.position.x = -3.5;
    previousSelectedMetaBtn.position.y = 5;
    previousSelectedMetaBtn.position.z = -5;
    previousSelectedMetaBtn.scaling = U3D.v(1);
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
      mesh.setEnabled(false);
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
