import U3D from '/models/utility3d.js';
import R3D from '/models/rocket3d.js';

export default class MenuTab3D {
  constructor(app) {
    this.app = app;
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
    mat.emissiveColor = new BABYLON.Color3(1, 0, 1);
    mat.diffuseColor = new BABYLON.Color3(1, 0, 1);
    mat.ambientColor = new BABYLON.Color3(1, 0, 1);
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
        let endPosition = U3D.vector(this.app.staticAssetMeshes['mars'].position);
        let startPosition = U3D.vector(this.app.staticAssetMeshes['neptune'].position);
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
        this.app.randomizeAnimations();
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
  initMeteorTab(scene, parent) {
    let asteroidDownCountBtn = U3D.addTextPlane(scene, '-', 'asteroidDownCountBtn');
    asteroidDownCountBtn.position.x = -7;
    asteroidDownCountBtn.position.y = 3;
    asteroidDownCountBtn.position.z = 1;
    asteroidDownCountBtn.scaling = U3D.v(2, 2, 2);
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
    asteroidUpCountBtn.position.x = -3;
    asteroidUpCountBtn.position.y = 3;
    asteroidUpCountBtn.position.z = 1;
    asteroidUpCountBtn.scaling = U3D.v(2, 2, 2);
    asteroidUpCountBtn.parent = parent;
  }
  addTabButtons(scene, tabBar) {
    let iconName = 'meteor';
    let meteorMenuTabBtn = this.addIconBtn(scene, iconName, 'meteorMenuTabBtn');
    meteorMenuTabBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.selectedMenuBarTab(this.meteorMenuTab);
      }
    };
    meteorMenuTabBtn.parent = tabBar;
    meteorMenuTabBtn.position.x = -13;

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

    iconName = 'edit';
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
  async initFocusedAssetPanel(scene, parent) {
    let followSelectedMetaBtn = U3D.addTextPlane(scene, 'A Follow', 'followSelectedMetaBtn');
    followSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.setFollowMeta();
      }
    };
    followSelectedMetaBtn.position.x = -3;
    followSelectedMetaBtn.position.y = 5;
    followSelectedMetaBtn.position.z = 2;
    followSelectedMetaBtn.scaling = U3D.v(2, 2, 2);
    followSelectedMetaBtn.parent = parent;

    let size = 1;
    let selectedAssetNameMesh = BABYLON.MeshBuilder.CreatePlane('selectedAssetNameMesh', {
      height: 1.5,
      width: size * 5,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);
    selectedAssetNameMesh.position.y = 3;
    selectedAssetNameMesh.rotation.y = Math.PI;
    selectedAssetNameMesh.parent = parent;

    let selectedAssetNameMat = new BABYLON.StandardMaterial('selectedAssetNameMat', scene);
    selectedAssetNameMesh.material = selectedAssetNameMat;
    this.app.selectedAssetNameMat = selectedAssetNameMat;

    let nextSelectedMetaBtn = U3D.addTextPlane(scene, '>', 'nextSelectedMetaBtn');
    nextSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.nextSelectedObject();
      }
    };
    nextSelectedMetaBtn.position.x = 3;
    nextSelectedMetaBtn.position.y = 0;
    nextSelectedMetaBtn.position.z = 0;
    nextSelectedMetaBtn.scaling = U3D.v(2, 2, 2);
    nextSelectedMetaBtn.parent = parent;

    let previousSelectedMetaBtn = U3D.addTextPlane(scene, '<', 'previousSelectedMetaBtn');
    previousSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.nextSelectedObject(true);
      }
    };
    previousSelectedMetaBtn.position.x = -3;
    previousSelectedMetaBtn.position.y = 0;
    previousSelectedMetaBtn.position.z = 0;

    previousSelectedMetaBtn.scaling = U3D.v(2, 2, 2);
    previousSelectedMetaBtn.parent = parent;
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

    this.meteorMenuTab = new BABYLON.TransformNode('meteorMenuTab', scene);
    this.meteorMenuTab.parent = panel;
    this.meteorMenuTab.position.y = 0;
    this.meteorMenuTab.setEnabled(false);
    this.initMeteorTab(scene, this.meteorMenuTab);
    this.app.updateAsteroidLabel();

    this.focusPanelTab = new BABYLON.TransformNode('focusPanelTab', scene);
    this.focusPanelTab.parent = panel;
    this.focusPanelTab.position.y = 0;
    this.focusPanelTab.setEnabled(false);
    this.initFocusedAssetPanel(scene, this.focusPanelTab);

    let buttonPanel = this.app._initSizePanel();
    buttonPanel.position.y = 4;
    buttonPanel.parent = this.focusPanelTab;

    this.playerMoonPanelTab = new BABYLON.TransformNode('playerMoonPanelTab', scene);
    this.playerMoonPanelTab.parent = panel;
    this.playerMoonPanelTab.position.y = 0;
    this.playerMoonPanelTab.position.x = -8;
    this.playerMoonPanelTab.setEnabled(false);
    this.initPlayerMoonsPanel();

    this.gameStatusPanelTab = new BABYLON.TransformNode('gameStatusPanelTab', scene);
    this.gameStatusPanelTab.parent = panel;
    this.gameStatusPanelTab.position.y = 0;
    this.gameStatusPanelTab.setEnabled(false);
    this.initGameStatusPanel();
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
    if (this.meteorMenuTab)
      this.meteorMenuTab.setEnabled(false);
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

    for (let c = 0; c < 4; c++) {
      let result = window.staticMeshContainer[this.app.seatMeshes[c].assetMeta.containerPath].instantiateModelsToScene();
      let mesh = result.rootNodes[0];
      mesh.position = U3D.v(2 - (c * 1.5), 2, 0);
      let seatIndex = c;
      mesh.assetMeta = {
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.app._updateLastClickMeta(this.app.seatMeshes[seatIndex].assetMeta);
        }
      };
      mesh.parent = this.playerMoonSubPanel;
      U3D._fitNodeToSize(mesh, 1.25);
    }
  }
}
