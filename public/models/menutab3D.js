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

    this.addTabButtons(scene, parent);

    this.scoreMenuTab = new BABYLON.TransformNode('scoreMenuTab', scene);
    this.scoreMenuTab.parent = panel;
    this.scoreMenuTab.position.y = 0;
    this.scoreMenuTab.setEnabled(false);
    this.initScoreTab();

    this.optionsMenuTab = new BABYLON.TransformNode('optionsMenuTab', scene);
    this.optionsMenuTab.parent = panel;
    this.optionsMenuTab.position.y = 0;
    this.optionsMenuTab.setEnabled(false);
    this.initOptionsTab(scene, this.optionsMenuTab);

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
  addTabButtons(scene, tabBar) {
    let iconName = 'xmark';
    let closeMenuTabBtn = this.addIconBtn(scene, iconName, 'closeMenuTabBtn');
    closeMenuTabBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(null);
      }
    };
    closeMenuTabBtn.parent = tabBar;
    closeMenuTabBtn.position.x = -16;

    iconName = 'score';
    let scoreMenuBtn = this.addIconBtn(scene, iconName, 'scoreMenuBtn');
    scoreMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.scoreMenuTab);
      }
    };
    scoreMenuBtn.parent = tabBar;
    scoreMenuBtn.position.x = -13;

    iconName = 'gear';
    let optionsMenuBtn = this.addIconBtn(scene, iconName, 'optionsMenuBtn');
    optionsMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.optionsMenuTab);
      }
    };
    optionsMenuBtn.parent = tabBar;
    optionsMenuBtn.position.x = -10;

    iconName = 'inspectobject';
    let selectedObjectMenuBtn = this.addIconBtn(scene, iconName, 'selectedObjectMenuBtn');
    selectedObjectMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.focusPanelTab);
      }
    };
    selectedObjectMenuBtn.parent = tabBar;
    selectedObjectMenuBtn.position.x = -4;

    iconName = 'diversity';
    let playersMoonsMenuBtn = this.addIconBtn(scene, iconName, 'playersMoonsMenuBtn');
    playersMoonsMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.playerMoonPanelTab);
      }
    };
    playersMoonsMenuBtn.parent = tabBar;
    playersMoonsMenuBtn.position.x = -7;
  }
  addIconBtn(scene, iconName, name) {
    let texturePath = '/fontcons/' + iconName + '.svg';
    let mesh = BABYLON.MeshBuilder.CreateDisc(name, {
      radius: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);
    let mat = new BABYLON.StandardMaterial(name + 'disc-mat', scene);

    let tex = new BABYLON.Texture(texturePath, scene, false, false);
    tex.hasAlpha = true;
    mat.opacityTexture = tex;
    mat.emissiveColor = new BABYLON.Color3(0.25, 0, 1);
    mat.diffuseColor = new BABYLON.Color3(0.25, 0, 1);
    mat.ambientColor = new BABYLON.Color3(0.25, 0, 1);
    mesh.material = mat;

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

  initOptionsTab(scene, parent) {
    let lightDnBtn = U3D.addTextPlane(scene, '-', 'lightDnBtn');
    lightDnBtn.position.x = -11;
    lightDnBtn.position.y = 3;
    lightDnBtn.position.z = 1;
    lightDnBtn.scaling = U3D.v(3, 3, 3);
    lightDnBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.sceneLightChange(-0.1);
      }
    };
    lightDnBtn.parent = parent;

    let lightUpBtn = U3D.addTextPlane(scene, '+', 'lightUpBtn');
    lightUpBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.sceneLightChange(0.1);
      }
    };
    lightUpBtn.position.x = -9;
    lightUpBtn.position.y = 3;
    lightUpBtn.position.z = 1;
    lightUpBtn.scaling = U3D.v(3, 3, 3);
    lightUpBtn.parent = parent;

    this._updateLightIntensityPanel();

    let cycleSkyboxBtn = this.addIconBtn(scene, 'eye', 'cycleSkyboxBtn');
    cycleSkyboxBtn.position.x = -16;
    cycleSkyboxBtn.position.y = 5;
    cycleSkyboxBtn.parent = parent;
    cycleSkyboxBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.switchSkyboxNext();
      }
    };
    this._updateSkyboxNamePanel();

    this.asteroidOptionsPanel = new BABYLON.TransformNode('asteroidOptionsPanel', scene);
    this.asteroidOptionsPanel.parent = parent;
    this.asteroidOptionsPanel.position.y = 7;
    this.initAsteroidsTab(scene, this.asteroidOptionsPanel);
  }
  _updateLightIntensityPanel() {
    if (this.lightLevelPanel)
      this.lightLevelPanel.dispose();

    let level = Number(this.app.profile.sceneLightLevel).toFixed(1);
    this.lightLevelPanel = U3D.addTextPlane(this.app.scene, level, 'lightLevelPanel');
    this.lightLevelPanel.position.x = -7;
    this.lightLevelPanel.position.y = 3;
    this.lightLevelPanel.position.z = 1;
    this.lightLevelPanel.scaling = U3D.v(2, 2, 2);
    this.lightLevelPanel.parent = this.optionsMenuTab;
  }
  _updateSkyboxNamePanel() {
    if (this.skyboxNamePanel)
      this.skyboxNamePanel.dispose();

    let skybox = this.app.profile.skyboxPath;
    let pieces = skybox.split('_');
    pieces.forEach((piece, i) => {
      piece = piece.charAt(0).toUpperCase() + piece.slice(1);
      pieces[i] = piece;
    })
    skybox = pieces.join(' ');
    this.skyboxNamePanel = U3D.addTextPlane(this.app.scene, skybox, 'skyboxNamePanel');
    this.skyboxNamePanel.position.x = -6;
    this.skyboxNamePanel.position.y = 5;
    this.skyboxNamePanel.position.z = 1;
    this.skyboxNamePanel.scaling = U3D.v(2, 2, 2);
    this.skyboxNamePanel.parent = this.optionsMenuTab;
  }
  skyboxList() {
    return [
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

  initAsteroidsTab(scene, parent) {
    let asteroidDownCountBtn = U3D.addTextPlane(scene, '-', 'asteroidDownCountBtn');
    asteroidDownCountBtn.position.x = -11;
    asteroidDownCountBtn.position.y = 1;
    asteroidDownCountBtn.position.z = 1;
    asteroidDownCountBtn.scaling = U3D.v(3, 3, 3);
    asteroidDownCountBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.asteroidCountChange(-20);
      }
    };
    asteroidDownCountBtn.parent = parent;

    let asteroidUpCountBtn = U3D.addTextPlane(scene, '+', 'asteroidUpCountBtn');
    asteroidUpCountBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.asteroidCountChange(20);
      }
    };
    asteroidUpCountBtn.position.x = -7;
    asteroidUpCountBtn.position.y = 1;
    asteroidUpCountBtn.position.z = 1;
    asteroidUpCountBtn.scaling = U3D.v(3, 3, 3);
    asteroidUpCountBtn.parent = parent;
  }

  initScoreTab() {
    this.gameActionsPanel = new BABYLON.TransformNode('gameActionsPanel', this.app.scene);
    this.gameActionsPanel.parent = this.scoreMenuTab;
    this.gameActionsPanel.position.y = 1;
    this.gameActionsPanel.position.z = 1;

    this.startGameButton = U3D.addTextPlane(this.scene, "START Game", "startGameButton", "Impact", "", "#ffffff");
    this.startGameButton.parent = this.gameActionsPanel;
    this.startGameButton.scaling = U3D.v(2, 2, 2);
    this.startGameButton.position.x = -5;
    this.startGameButton.position.y = 5;
    this.startGameButton.position.z = 1;
    this.startGameButton.setEnabled(false);

    this.endGameButton = U3D.addTextPlane(this.scene, "END Game", "endGameButton", "Impact", "", "#ffffff");
    this.endGameButton.parent = this.gameActionsPanel;
    this.endGameButton.scaling = U3D.v(2, 2, 2);
    this.endGameButton.position.x = -10;
    this.endGameButton.position.y = 5;
    this.endGameButton.position.z = 1;

    this.endTurnButton = U3D.addTextPlane(this.scene, "End Turn", "endTurnButton", "Arial", "", "#ffffff");
    this.endTurnButton.parent = this.gameActionsPanel;
    this.endTurnButton.scaling = U3D.v(2, 2, 2);
    this.endTurnButton.position.x = -10;
    this.endTurnButton.position.y = 2;
    this.endTurnButton.position.z = 1;
    this.endTurnButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.clickEndTurn();
      }
    };

    this.initRoundPanel(this.scoreMenuTab);
  }
  initRoundPanel(parent) {
    let scene = this.scene;
    let nextRoundButton = U3D.addTextPlane(scene, '>', 'nextRoundButton');
    nextRoundButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.nextReplayRound(1);
      }
    };
    nextRoundButton.position.x = -8;
    nextRoundButton.position.y = 0;
    nextRoundButton.position.z = 0;
    nextRoundButton.scaling = U3D.v(2, 2, 2);
    nextRoundButton.parent = parent;

    let previousRoundButton = U3D.addTextPlane(scene, '<', 'previousRoundButton');
    previousRoundButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.nextReplayRound(-1);
      }
    };
    previousRoundButton.position.x = -16;
    previousRoundButton.position.y = 0;
    previousRoundButton.position.z = 0;
    previousRoundButton.scaling = U3D.v(2, 2, 2);
    previousRoundButton.parent = parent;

    let nextReplayPlayerButton = U3D.addTextPlane(scene, '>', 'nextReplayPlayerButton');
    nextReplayPlayerButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.nextReplayPlayer(1);
      }
    };
    nextReplayPlayerButton.position.x = -8;
    nextReplayPlayerButton.position.y = 1.5;
    nextReplayPlayerButton.position.z = 0;
    nextReplayPlayerButton.scaling = U3D.v(2, 2, 2);
    nextReplayPlayerButton.parent = parent;

    let previousReplayPlayerButton = U3D.addTextPlane(scene, '<', 'previousReplayPlayerButton');
    previousReplayPlayerButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.nextReplayPlayer(-1);
      }
    };
    previousReplayPlayerButton.position.x = -16;
    previousReplayPlayerButton.position.y = 1.5;
    previousReplayPlayerButton.position.z = 0;
    previousReplayPlayerButton.scaling = U3D.v(2, 2, 2);
    previousReplayPlayerButton.parent = parent;

    this.selectedReplayRound = -1;
    this.selectedReplayPlayer = 0;
    this.nextReplayRound(0);
    this.nextReplayPlayer(0);

    this.loadReplayButton = U3D.addTextPlane(this.scene, "Load Replay", "loadReplayButton", "Arial", "", "#ffffff");
    this.loadReplayButton.parent = parent;
    this.loadReplayButton.scaling = U3D.v(2, 2, 2);
    this.loadReplayButton.position.x = -1;
    this.loadReplayButton.position.y = 1.5;
    this.loadReplayButton.position.z = 0;
    this.loadReplayButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.loadReplay();
      }
    };

    this.playReplayButton = U3D.addTextPlane(this.scene, "Play Replay", "playReplayButton", "Arial", "", "#ffffff");
    this.playReplayButton.parent = parent;
    this.playReplayButton.scaling = U3D.v(2, 2, 2);
    this.playReplayButton.position.x = -1;
    this.playReplayButton.position.y = 0;
    this.playReplayButton.position.z = 0;
    this.playReplayButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.loadReplay(true);
      }
    };
  }
  nextReplayRound(delta) {
    if (this.selectedRoundIndexPanel)
      this.selectedRoundIndexPanel.dispose();

    let min = -3;
    let max = -1;
    this.selectedReplayRound += delta;
    if (this.selectedReplayRound < min)
      this.selectedReplayRound = max;
    if (this.selectedReplayRound > max)
      this.selectedReplayRound = min;

    let label = "Round " + (this.selectedReplayRound + 1).toString();
    if (this.selectedReplayRound < 0)
      label = "Prequel " + (-1 * this.selectedReplayRound).toString();
    this.selectedRoundIndexPanel = U3D.addTextPlane(this.app.scene, label, 'selectedRoundIndexPanel');
    this.selectedRoundIndexPanel.position.x = -12;
    this.selectedRoundIndexPanel.position.y = 0;
    this.selectedRoundIndexPanel.position.z = 0;
    this.selectedRoundIndexPanel.scaling = U3D.v(1.5, 1.5, 1.5);
    this.selectedRoundIndexPanel.parent = this.scoreMenuTab;
  }
  nextReplayPlayer(delta) {
    if (this.selectedReplayPlayerPanel)
      this.selectedReplayPlayerPanel.dispose();

    let desc = "Geronimo";
    this.selectedReplayPlayerPanel = U3D.addTextPlane(this.app.scene, desc, 'selectedReplayPlayerPanel');
    this.selectedReplayPlayerPanel.position.x = -12;
    this.selectedReplayPlayerPanel.position.y = 1.5;
    this.selectedReplayPlayerPanel.position.z = 0;
    this.selectedReplayPlayerPanel.scaling = U3D.v(1.5, 1.5, 1.5);
    this.selectedReplayPlayerPanel.parent = this.scoreMenuTab;
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

      let freshMesh = await U3D.loadStaticMesh(this.app.scene, meta.containerPath);
      freshMesh.parent = this.obj(id).baseMesh.parent;
      U3D.sizeNodeToFit(freshMesh, meta.sizeBoxFit);
      this.obj(id).baseMesh.dispose();
      this.obj(id).baseMesh = freshMesh;
    }

    let moonIndex = ['e1_luna', 'ceres', 'j5_io', 'eris'].indexOf(id);
    if (moonIndex !== -1) {
      //this.loadMoonButton(moonIndex);
    }

    await this.app.updateProfileMeshOverride(id, size);
    this.obj(id).assetMeta.extended = U3D.processStaticAssetMeta(this.obj(id).assetMeta, this.app.profile);
    this.setSelectedAsset(this.obj(id).assetMeta);
  }
  async initFocusedAssetPanel(parent) {
    let scene = this.app.scene;
    let followSelectedMetaBtn = U3D.addTextPlane(scene, 'Follow [B]', 'followSelectedMetaBtn', "Arial", "", "rgb(0, 200, 0)");
    followSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.bButtonPress();
      }
    };
    followSelectedMetaBtn.position.x = -14;
    followSelectedMetaBtn.position.y = 0;
    followSelectedMetaBtn.position.z = 0;
    followSelectedMetaBtn.scaling = U3D.v(2, 2, 2);
    followSelectedMetaBtn.parent = parent;

    let followStopBtn = U3D.addTextPlane(scene, 'Stop [A]', 'followSelectedMetaBtn', "Arial", "", "rgb(255, 0, 0)");
    followStopBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.aButtonPress();
      }
    };
    followStopBtn.position.x = -6;
    followStopBtn.position.y = 0;
    followStopBtn.position.z = 0;
    followStopBtn.scaling = U3D.v(2, 2, 2);
    followStopBtn.parent = parent;

    let nextSelectedMetaBtn = U3D.addTextPlane(scene, '>', 'nextSelectedMetaBtn');
    nextSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.nextSelectedObject();
      }
    };
    nextSelectedMetaBtn.position.x = -4;
    nextSelectedMetaBtn.position.y = 2;
    nextSelectedMetaBtn.position.z = 0;
    nextSelectedMetaBtn.scaling = U3D.v(2, 2, 2);
    nextSelectedMetaBtn.parent = parent;

    let previousSelectedMetaBtn = U3D.addTextPlane(scene, '<', 'previousSelectedMetaBtn');
    previousSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.nextSelectedObject(true);
      }
    };
    previousSelectedMetaBtn.position.x = -16;
    previousSelectedMetaBtn.position.y = 2;
    previousSelectedMetaBtn.position.z = 0;
    previousSelectedMetaBtn.scaling = U3D.v(2, 2, 2);
    previousSelectedMetaBtn.parent = parent;

    this.normalAssetSizeBtn = U3D.addTextPlane(scene, 'Better', 'normalAssetSizeBtn');
    this.normalAssetSizeBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.normalAssetSizeBtn.setEnabled(false);
        this.updateAssetSize('normal');
      }
    };
    this.normalAssetSizeBtn.position.x = -12;
    this.normalAssetSizeBtn.position.y = 4;
    this.normalAssetSizeBtn.position.z = 0;
    this.normalAssetSizeBtn.scaling = U3D.v(1, 1, 1);
    this.normalAssetSizeBtn.parent = parent;

    this.assetPanelHugeButton = U3D.addTextPlane(scene, 'Best', 'assetPanelHugeButton');
    this.assetPanelHugeButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.assetPanelHugeButton.setEnabled(false);
        this.updateAssetSize('huge');
      }
    };
    this.assetPanelHugeButton.position.x = -7;
    this.assetPanelHugeButton.position.y = 4;
    this.assetPanelHugeButton.position.z = 0;
    this.assetPanelHugeButton.scaling = U3D.v(1, 1, 1);
    this.assetPanelHugeButton.parent = parent;

    this.assetSmallSizeButton = U3D.addTextPlane(scene, 'Normal', 'assetSmallSizeButton');
    this.assetSmallSizeButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.assetSmallSizeButton.setEnabled(false);
        this.updateAssetSize('small');
      }
    };
    this.assetSmallSizeButton.position.x = -17;
    this.assetSmallSizeButton.position.y = 4;
    this.assetSmallSizeButton.position.z = 0;
    this.assetSmallSizeButton.scaling = U3D.v(1, 1, 1);
    this.assetSmallSizeButton.parent = parent;

    this.setSelectedAsset(this.obj('e1_luna').assetMeta);

    this.playerCardsTN = new BABYLON.TransformNode('playerCardsTN', scene);
    this.playerCardsTN.parent = parent;
    this.playerCardsTN.position.y = 6;
    this.playerCardsTN.position.z = 4;


    //this.app.actionCardHelper.init();
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
    this.selectedContainerTransform.position.y = 5;
    this.selectedContainerTransform.rotation.y = Math.PI;

    let result, mesh;
    if (assetMeta.avatarType) {
      result = this.app.avatarHelper.avatarContainers[assetMeta.name].instantiateModelsToScene();
      mesh = result.rootNodes[0];
      result.animationGroups[0].stop();
      result.skeletons[0].returnToRest();
    } else {
      result = window.staticMeshContainer[assetMeta.containerPath].instantiateModelsToScene();
      mesh = result.rootNodes[0];
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
    let factor = 2.5;
    if (this.app.inXR)
      factor = 0.35;
    U3D.sizeNodeToFit(mesh, factor);

    if (assetMeta.asteroidType)
      mesh.material = this.app.asteroidHelper.selectedAsteroidMaterial;

    if (this.selectedAssetLabel)
      this.selectedAssetLabel.dispose();

    this.selectedAssetLabel = U3D.addTextPlane(this.scene, desc, 'selectedAssetLabel');
    this.selectedAssetLabel.position.x = -10;
    this.selectedAssetLabel.position.y = 2;
    this.selectedAssetLabel.position.z = 0;
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
      this.displayedNamePlate.dispose();

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

    this.displayedNamePlate = U3D.getTextPlane(nameDesc, 'seletecedAssetNamePlate', this.scene, width, height, color, 'transparent');
    this.displayedNamePlate.billboardMode = 7;
    this.displayedNamePlate.position.y = yOffset;
    this.displayedNamePlate.parent = meta.basePivot;
    if (meta.textPivot)
      meta.textPivot.setEnabled(false);
  }
  hideAssetNamePlate(meta) {
    if (this.displayedNamePlate) {
      this.displayedNamePlate.dispose();
      this.displayedNamePlate = null;
    }

    if (meta.textPivot)
      meta.textPivot.setEnabled(true);
  }
}
