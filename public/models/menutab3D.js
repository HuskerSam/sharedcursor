import U3D from '/models/utility3d.js';
import R3D from '/models/rocket3d.js';

export default class MenuTab3D {
  constructor(app) {
    this.app = app;
    this.scene = app.scene;
  }
  obj(name) {
    return this.app.staticAssetMeshes[name];
  }

  initOptionsBar() {
    let scene = this.app.scene;
    let parent = this.app.menuBarTabButtonsTN;
    let panel = this.app.menuBarLeftTN;

    this.addTabButtons(scene, parent);

    this.optionsMenuTab = new BABYLON.TransformNode('optionsMenuTab', scene);
    this.optionsMenuTab.parent = panel;
    this.optionsMenuTab.position.y = 0;
    this.optionsMenuTab.setEnabled(false);
    this.initOptionsTab(scene, this.optionsMenuTab);

    this.asteroidMenuTab = new BABYLON.TransformNode('asteroidMenuTab', scene);
    this.asteroidMenuTab.parent = panel;
    this.asteroidMenuTab.position.y = 0;
    this.asteroidMenuTab.setEnabled(false);
    this.initAsteroidsTab(scene, this.asteroidMenuTab);

    this.focusPanelTab = new BABYLON.TransformNode('focusPanelTab', scene);
    this.focusPanelTab.parent = panel;
    this.focusPanelTab.position.y = 0;
    this.focusPanelTab.setEnabled(false);
    this.initFocusedAssetPanel(this.focusPanelTab);

    this.playerMoonPanelTab = new BABYLON.TransformNode('playerMoonPanelTab', scene);
    this.playerMoonPanelTab.parent = panel;
    this.playerMoonPanelTab.position.y = 0;
    this.playerMoonPanelTab.position.x = -10;
    this.playerMoonPanelTab.setEnabled(false);
    this.initPlayerMoonsPanel();

    this.gameStatusPanelTab = new BABYLON.TransformNode('gameStatusPanelTab', scene);
    this.gameStatusPanelTab.parent = panel;
    this.gameStatusPanelTab.position.y = 0;
    this.gameStatusPanelTab.setEnabled(false);
    this.initGameStatusPanel();
  }
  addTabButtons(scene, tabBar) {
    let iconName = 'xmark';
    let closeMenuTabBtn = this.addIconBtn(scene, iconName, 'asteroidMenuTabBtn');
    closeMenuTabBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(null);
      }
    };
    closeMenuTabBtn.parent = tabBar;
    closeMenuTabBtn.position.x = -16;

    iconName = 'meteor';
    let asteroidMenuTabBtn = this.addIconBtn(scene, iconName, 'asteroidMenuTabBtn');
    asteroidMenuTabBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.asteroidMenuTab);
      }
    };
    asteroidMenuTabBtn.parent = tabBar;
    asteroidMenuTabBtn.position.x = -13;

    iconName = 'sun';
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

    iconName = 'anchor';
    let selectedObjectMenuBtn = this.addIconBtn(scene, iconName, 'selectedObjectMenuBtn');
    selectedObjectMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.focusPanelTab);
      }
    };
    selectedObjectMenuBtn.parent = tabBar;
    selectedObjectMenuBtn.position.x = -7;

    iconName = 'moon';
    let playersMoonsMenuBtn = this.addIconBtn(scene, iconName, 'playersMoonsMenuBtn');
    playersMoonsMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.playerMoonPanelTab);
      }
    };
    playersMoonsMenuBtn.parent = tabBar;
    playersMoonsMenuBtn.position.x = -4;

    iconName = 'eventrepeat';
    let gameStatusMenuBtn = this.addIconBtn(scene, iconName, 'gameStatusMenuBtn');
    gameStatusMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.gameStatusPanelTab);
      }
    };
    gameStatusMenuBtn.parent = tabBar;
    gameStatusMenuBtn.position.x = -1;
  }
  addIconBtn(scene, iconName, name) {
    //let texturePath = 'https://unpkg.com/@fortawesome/fontawesome-free@5.7.2/svgs/solid/' + iconName + '.svg';
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

  async initOptionsTab(scene, parent) {
    let shootRocketBtn = this.addIconBtn(scene, 'rocket', 'shootRocketBtn');
    shootRocketBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        if (this.rocketRunning)
          return;
        this.rocketRunning = true;
        setTimeout(() => this.rocketRunning = false, 1000);

        let rotation = new BABYLON.Vector3(0, 0, 0);
        let endPosition = U3D.vector(this.obj('mars').position);
        let startPosition = U3D.vector(this.obj('neptune').position);
        await R3D.shootRocket(scene, startPosition, rotation, endPosition);

      }
    };
    shootRocketBtn.parent = parent;
    shootRocketBtn.position.x = -5;

    let cycleRandomAvatarAnimations = this.addIconBtn(scene, 'robot', 'cycleRandomAvatarAnimations');
    cycleRandomAvatarAnimations.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.avatarHelper.randomizeAnimations();
      }
    };
    cycleRandomAvatarAnimations.position.x = -7.5;
    cycleRandomAvatarAnimations.parent = parent;

    let cycleSkyboxBtn = this.addIconBtn(scene, 'eye', 'cycleSkyboxBtn');
    cycleSkyboxBtn.position.x = -2.5;
    cycleSkyboxBtn.parent = parent;
    cycleSkyboxBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app._nextSkybox();
      }
    };
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

  initGameStatusPanel() {
    this.startGameButton = U3D.addTextPlane(this.scene, "START Game", "startGameButton", "Impact", "", "#ffffff");
    this.startGameButton.parent = this.gameStatusPanelTab;
    this.startGameButton.scaling = U3D.v(2, 2, 2);
    this.startGameButton.position.x = -5;
    this.startGameButton.position.y = 3;
    this.startGameButton.position.z = 1;
    this.startGameButton.setEnabled(false);

    this.endGameButton = U3D.addTextPlane(this.scene, "END Game", "endGameButton", "Impact", "", "#ffffff");
    this.endGameButton.parent = this.gameStatusPanelTab;
    this.endGameButton.scaling = U3D.v(2, 2, 2);
    this.endGameButton.position.x = -10;
    this.endGameButton.position.y = 3;
    this.endGameButton.position.z = 1;

    this.endTurnButton = U3D.addTextPlane(this.scene, "End Turn", "endTurnButton", "Arial", "", "#ffffff");
    this.endTurnButton.parent = this.gameStatusPanelTab;
    this.endTurnButton.scaling = U3D.v(2, 2, 2);
    this.endTurnButton.position.x = 0;
    this.endTurnButton.position.y = 3;
    this.endTurnButton.position.z = 1;
    this.endTurnButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.clickEndTurn();
      }
    };
  }
  selectedMenuBarTab(menuTabToShow) {
    if (this.asteroidMenuTab)
      this.asteroidMenuTab.setEnabled(false);
    if (this.optionsMenuTab)
      this.optionsMenuTab.setEnabled(false);
    if (this.focusPanelTab)
      this.focusPanelTab.setEnabled(false);
    if (this.playerMoonPanelTab)
      this.playerMoonPanelTab.setEnabled(false);
    if (this.gameStatusPanelTab)
      this.gameStatusPanelTab.setEnabled(false);

    if (menuTabToShow)
      menuTabToShow.setEnabled(true);
  }
  initPlayerMoonsPanel() {
    this.playerMoonSubPanel = new BABYLON.TransformNode('playerMoonSubPanel', this.app.scene);
    this.playerMoonSubPanel.parent = this.playerMoonPanelTab;
    this.playerMoonSubPanel.position.y = 4;

    let seatMeshes = this.app.avatarHelper.seatMeshes;
    for (let c = 0; c < 4; c++) {
      let result = window.staticMeshContainer[seatMeshes[c].assetMeta.containerPath].instantiateModelsToScene();
      let mesh = result.rootNodes[0];
      mesh.position = U3D.v(2 - (c * 1.5), 2, 0);
      let seatIndex = c;
      mesh.assetMeta = {
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.setSelectedAsset(this.app.seatMeshes[seatIndex].assetMeta);
        }
      };
      mesh.parent = this.playerMoonSubPanel;
      U3D._fitNodeToSize(mesh, 1.25);
    }
  }

  updateAssetSizeButtons() {
    let meta = this.lastClickMetaButtonCache;
    if (meta.asteroidType) {
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
    let meta = this.lastClickMetaButtonCache;
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
      U3D._fitNodeToSize(freshMesh, meta.sizeBoxFit);
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

    let name = 'one';
    this.boardWrapper = new BABYLON.TransformNode('boardpopupwrapper' + name, this.scene);
    this.boardWrapper.position.y = -1000;

    let nameMesh1 = BABYLON.MeshBuilder.CreatePlane('nameshow1' + name, {
      height: 5,
      width: 5,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);

    let factor = -1.8;
    nameMesh1.position.y = factor;

    let nameMat = new BABYLON.StandardMaterial('nameshowmat' + name, this.scene);
    nameMesh1.material = nameMat;
    nameMesh1.parent = this.boardWrapper;

    this.boardWrapper.nameMat = nameMat;
    this.boardWrapper.nameMesh1 = nameMesh1;

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
  }
  async setSelectedAsset(assetMeta) {
    this.lastClickMeta = assetMeta;
    this.lastClickMetaButtonCache = this.lastClickMeta;

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

    let result = window.staticMeshContainer[assetMeta.containerPath].instantiateModelsToScene();
    let mesh = result.rootNodes[0];
    mesh.parent = this.selectedContainerTransform;

    let factor = 2.5;
    if (this.app.inXR)
      factor = 0.35;
    U3D._fitNodeToSize(mesh, factor);

    if (assetMeta.asteroidType)
      mesh.material = this.app.asteroidHelper.selectedAsteroidMaterial;

    if (this.selectedAssetLabel)
      this.selectedAssetLabel.dispose();

    this.selectedAssetLabel = U3D.addTextPlane(this.scene, desc, 'selectedAssetLabel');
    this.selectedAssetLabel.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.nextSelectedObject();
      }
    };
    this.selectedAssetLabel.position.x = -10;
    this.selectedAssetLabel.position.y = 2;
    this.selectedAssetLabel.position.z = 0;
    this.selectedAssetLabel.scaling = U3D.v(2, 2, 2);
    this.selectedAssetLabel.parent = this.focusPanelTab;

    this.updateAssetSizeButtons();
  }
  nextSelectedObject(previous = false) {
    let meta = this.lastClickMetaButtonCache;
    let id = meta.id;
    let factor = previous ? -1 : 1;
    if (meta.asteroidType) {
      let keys = Object.keys(this.app.loadedAsteroids).sort();

      let index = keys.indexOf(meta.name);
      let nextIndex = index + factor;
      if (nextIndex < 0)
        nextIndex = keys.length - 1;
      if (nextIndex > keys.length - 1)
        nextIndex = 0;

      let key = keys[nextIndex];
      this.setSelectedAsset(this.app.loadedAsteroids[key].orbitWrapper.assetMeta);
    } else {
      let keys = Object.keys(this.app.staticAssetMeshes).sort((a, b) => {
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
  showBoardWrapper(meta) {
    let nameDesc = meta.name;
    if (meta.solarPosition)
      nameDesc += ` (${meta.solarPosition})`;
    if (meta.asteroidType)
      nameDesc = nameDesc.replace('.obj', '');

    let color = "rgb(200, 0, 0)";
    if (meta.color)
      color = meta.color;
    let nameTexture = U3D.__texture2DText(this.scene, nameDesc, color);
    nameTexture.vScale = 1;
    nameTexture.uScale = 1;
    nameTexture.hasAlpha = true;
    this.boardWrapper.nameMat.diffuseTexture = nameTexture;
    this.boardWrapper.nameMat.emissiveTexture = nameTexture;
    this.boardWrapper.nameMat.ambientTexture = nameTexture;

    this.boardWrapper.billboardMode = 7;
    let yOffset = meta.yOffset !== undefined ? meta.yOffset : 1.25;
    this.boardWrapper.setEnabled(true);
    this.boardWrapper.position.y = yOffset;
    this.boardWrapper.parent = meta.basePivot;
    if (meta.textPivot)
      meta.textPivot.setEnabled(false);
  }
  hideBoardWrapper(meta) {
    this.boardWrapper.setEnabled(false);
    this.boardWrapper.parent = null;
    if (meta.textPivot)
      meta.textPivot.setEnabled(true);
  }
}
