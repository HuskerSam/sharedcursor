import U3D from '/models/utility3d.js';

export default class MenuTab3D {
  static addIconBtn(scene, iconName, name) {
    let texturePath = 'https://unpkg.com/@fortawesome/fontawesome-free@5.7.2/svgs/solid/' + iconName + '.svg';
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
  static async initOptionsTab(scene, parent) {
    let shootRocketBtn = this.addIconBtn(scene, 'rocket', 'shootRocketBtn');
    shootRocketBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        if (window.App3D.rocketRunning)
          return;
        window.App3D.rocketRunning = true;
        let rotation = new BABYLON.Vector3(0, 0, 0);
        let endPosition = U3D.vector(window.App3D.staticAssetMeshes['mars'].position);
        let startPosition = U3D.vector(window.App3D.staticAssetMeshes['neptune'].position);
        await R3D.shootRocket(scene, startPosition, rotation, endPosition);

        setTimeout(() => window.App3D.rocketRunning = false, 1000);
      }
    };
    shootRocketBtn.parent = parent;
    shootRocketBtn.position.x = -5;

    let cycleRandomAvatarAnimations = this.addIconBtn(scene, 'robot', 'cycleRandomAvatarAnimations');
    cycleRandomAvatarAnimations.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        window.App3D.randomizeAnimations();
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
        window.App3D._nextSkybox();
      }
    };
  }
  static initMeteorTab(scene, parent) {
    let asteroidDownCountBtn = U3D.addTextPlane(scene, '-', 'asteroidDownCountBtn');
    asteroidDownCountBtn.position.x = -7;
    asteroidDownCountBtn.position.y = 3;
    asteroidDownCountBtn.position.z = 1;
    asteroidDownCountBtn.scaling = U3D.v(2, 2, 2);
    asteroidDownCountBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        window.App3D.asteroidCountChange(-20);
      }
    };
    asteroidDownCountBtn.parent = parent;

    let asteroidUpCountBtn = U3D.addTextPlane(scene, '+', 'asteroidUpCountBtn');
    asteroidUpCountBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        window.App3D.asteroidCountChange(20);
      }
    };
    asteroidUpCountBtn.position.x = -3;
    asteroidUpCountBtn.position.y = 3;
    asteroidUpCountBtn.position.z = 1;
    asteroidUpCountBtn.scaling = U3D.v(2, 2, 2);
    asteroidUpCountBtn.parent = parent;
  }
  static addTabButtons(scene, tabBar) {
    let iconName = 'meteor';
    let meteorMenuTabBtn = this.addIconBtn(scene, 'https://unpkg.com/@fortawesome/fontawesome-free@5.7.2/svgs/solid/' + iconName + '.svg',
      'meteorMenuTabBtn');
    meteorMenuTabBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        window.App3D.selectedMenuBarTab(window.App3D.meteorMenuTab);
      }
    };
    meteorMenuTabBtn.parent = tabBar;
    meteorMenuTabBtn.position.x = -13;

    iconName = 'sun';
    let optionsMenuBtn = this.addIconBtn(scene, 'https://unpkg.com/@fortawesome/fontawesome-free@5.7.2/svgs/solid/' + iconName + '.svg',
      'optionsMenuBtn');
    optionsMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        window.App3D.selectedMenuBarTab(window.App3D.optionsMenuTab);
      }
    };
    optionsMenuBtn.parent = tabBar;
    optionsMenuBtn.position.x = -10;

    iconName = 'anchor';
    let selectedObjectMenuBtn = this.addIconBtn(scene, 'https://unpkg.com/@fortawesome/fontawesome-free@5.7.2/svgs/solid/' + iconName + '.svg',
      'selectedObjectMenuBtn');
    selectedObjectMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        window.App3D.selectedMenuBarTab(window.App3D.focusPanelTab);
      }
    };
    selectedObjectMenuBtn.parent = tabBar;
    selectedObjectMenuBtn.position.x = -7;

    iconName = 'moon';
    let playersMoonsMenuBtn = this.addIconBtn(scene, 'https://unpkg.com/@fortawesome/fontawesome-free@5.7.2/svgs/solid/' + iconName + '.svg',
      'playersMoonsMenuBtn');
    playersMoonsMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        window.App3D.selectedMenuBarTab(window.App3D.playerMoonPanelTab);
      }
    };
    playersMoonsMenuBtn.parent = tabBar;
    playersMoonsMenuBtn.position.x = -4;

    iconName = 'edit';
    let gameStatusMenuBtn = this.addIconBtn(scene, 'https://unpkg.com/@fortawesome/fontawesome-free@5.7.2/svgs/solid/' + iconName + '.svg',
      'gameStatusMenuBtn');
    gameStatusMenuBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        window.App3D.selectedMenuBarTab(window.App3D.gameStatusPanelTab);
      }
    };
    gameStatusMenuBtn.parent = tabBar;
    gameStatusMenuBtn.position.x = -1;
  }
  static async initFocusedAssetPanel(scene, parent) {
    let followSelectedMetaBtn = U3D.addTextPlane(scene, 'A Follow', 'followSelectedMetaBtn');
    followSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        window.App3D.setFollowMeta();
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
    window.App3D.selectedAssetNameMat = selectedAssetNameMat;

    let nextSelectedMetaBtn = U3D.addTextPlane(scene, '>', 'nextSelectedMetaBtn');
    nextSelectedMetaBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        window.App3D.nextSelectedObject();
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
        window.App3D.nextSelectedObject(true);
      }
    };
    previousSelectedMetaBtn.position.x = -3;
    previousSelectedMetaBtn.position.y = 0;
    previousSelectedMetaBtn.position.z = 0;

    previousSelectedMetaBtn.scaling = U3D.v(2, 2, 2);
    previousSelectedMetaBtn.parent = parent;
  }
  static skyboxList() {
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
}
