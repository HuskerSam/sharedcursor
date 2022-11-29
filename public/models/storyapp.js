import BaseApp from '/models/baseapp.js';
import GameCards from '/models/gamecards.js';
import Utility3D from '/models/utility3d.js';

export class StoryApp extends BaseApp {
  constructor() {
    super();
    this.apiType = 'story';
    this.cache = {};
    this.staticAssetMeshes = {};
    this.musicMeshes = {};
    this.seatMeshes = {};
    this.loading_dynamic_area = document.querySelector('.loading_dynamic_area');

    this.hide_loading_screen = document.querySelector('.hide_loading_screen');
    this.hide_loading_screen.addEventListener('click', e => {
      document.body.classList.remove('show_loading_banner');
    });

    this.show_loading_screen = document.querySelector('.show_loading_screen');
    this.show_loading_screen.addEventListener('click', e => {
      document.body.classList.add('show_loading_banner');
    });

    this._initGameCommon();

    this.currentplayer_score_dock = document.querySelector('.currentplayer_score_dock');
    this.match_board_wrapper = document.querySelector('.match_board_wrapper');

    this.turn_number_div = document.querySelector('.turn_number_div');
    this.player_total_points = document.querySelector('.player_total_points');
    this.player_total_for_turn = document.querySelector('.player_total_for_turn');
    this.player_dock_prompt = document.querySelector('.player_dock_prompt');
    this.player_dock_prompt.addEventListener('click', e => this.turnPhaseAdvance());

    this.game_header_panel = document.querySelector('.game_header_panel');

    this.alertErrors = false;
    this.debounceBusy = false;

    this.dockDiscRadius = .6;

    this.settings_button = document.querySelector('.settings_button');
    this.settings_button.addEventListener('click', e => this.viewSettings());

    this.canvasDisplayModal = document.querySelector('#canvasDisplayModal');
    this.modal = new bootstrap.Modal(this.canvasDisplayModal);

    this.menu_bar_toggle = document.querySelector('.menu_bar_toggle');
    this.menu_bar_toggle.addEventListener('click', e => this.toggleMenuBar());

    this.end_turn_button = document.querySelector('.end_turn_button');
    this.end_turn_button.addEventListener('click', e => this._endTurn());

  }
  toggleMenuBar() {
    document.body.classList.toggle('menu_bar_expanded');
  }
  addLineToLoading(str) {
    let div = document.createElement('div');
    div.innerHTML = str;
    this.loading_dynamic_area.appendChild(div);

    this.loading_dynamic_area.scrollIntoView(false);
  }
  async loadStaticScene() {
    this.hugeAssets = this.gameData.performanceFlags.indexOf('hugemodel_all') !== -1;
    this.smallAssets = this.gameData.performanceFlags.indexOf('hugemodel_small') !== -1;

    this.minMoonsLoad = this.gameData.performanceFlags.indexOf('moonlevel_5') !== -1;

    let staticWrapper = BABYLON.MeshBuilder.CreateBox('staticwrapper', {
      width: .01,
      height: .01,
      depth: .01
    }, this.scene);
    staticWrapper.material = this.mat1alpha;
    staticWrapper.visibility = 0;

    let mat1 = new BABYLON.StandardMaterial('mat1alpha', this.scene);
    mat1.alpha = 0;
    this.mat1alpha = mat1;

    this.addLineToLoading('Solar System Objects<br>');
    let navMeshes = [];
    let promises = [];
    let deck = GameCards.getCardDeck('solarsystem');
    deck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, staticWrapper));
      if (this.allCards[card.id].noNavMesh !== true)
        navMeshes.push(this.loadStaticNavMesh(card.id));
    });
    await Promise.all(promises);

    this.addLineToLoading('Moons<br>');

    promises = [];
    deck = GameCards.getCardDeck('moons1');
    deck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, staticWrapper));
      if (this.allCards[card.id].noNavMesh !== true)
        navMeshes.push(this.loadStaticNavMesh(card.id));
    });
    deck = GameCards.getCardDeck('moons2');
    deck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, staticWrapper));
      if (this.allCards[card.id].noNavMesh !== true)
        navMeshes.push(this.loadStaticNavMesh(card.id));
    });

    await Promise.all(promises);
    promises = [];
    deck = GameCards.getCardDeck('mascots');
    deck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, staticWrapper));
      if (this.allCards[card.id].noNavMesh !== true)
        navMeshes.push(this.loadStaticNavMesh(card.id));
    });
    await Promise.all(promises);

    this.navMesh = BABYLON.Mesh.MergeMeshes(navMeshes);
    this.navMesh.material = this.mat1alpha;

    this.selectedPlayerPanel = BABYLON.MeshBuilder.CreateSphere("selectedplayerpanel", {
      width: 1,
      height: 1,
      depth: 1
    }, this.scene);
    this.selectedPlayerPanel.position.y = -1000;
    let pm = new BABYLON.StandardMaterial('panelplayershowmat' + name, this.scene);
    this.selectedPlayerPanel.material = pm;

    this.selectedMoonPanel = BABYLON.MeshBuilder.CreateSphere("selectedmoonpanel", {
      width: 1,
      height: 1,
      depth: 1
    }, this.scene);
    this.selectedMoonPanel.position.y = -1000;
    this.selectedMoonPanel.material = pm;

    if (this.urlParams.get('showguides'))
      this.createGuides();

    await this.setupAgents();

    this.sceneInited = true;
    this.loadAvatars();
    this.loadAsteroids();
  }

  async loadAsteroids() {
    let asteroids = this.getAsteroids();

    let ratio = 0;
    let max = asteroids.length;

    let count = 20;
    this.gameData.performanceFlags.forEach(flag => {
      if (flag.indexOf('asteroids_') !== -1) {
        let ct = flag.replace('asteroids_', '');
        if (ct === 'all')
          count = asteroids.length;
        else
          count = Number(ct);
      }
    });

    this.addLineToLoading(`Loading Asteroids
      <a href="https://3d-asteroids.space/asteroids" target="_blank">radar based  data</a>`);
    this.addLineToLoading(`Picking ${count} from ${max} available`);

    let randomArray = [];
    for (let c = 0; c < max; c++) {
      randomArray.push(c);
    }
    randomArray = this._shuffleArray(randomArray);
    randomArray = randomArray.slice(0, count); //.sort();


    let linkNameList = '';
    randomArray.forEach((index, i) => {
      let name = asteroids[index];
      let path = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fasteroids%2F' +
        encodeURIComponent(name) + '?alt=media';
      linkNameList += `<a target="_blank" href="${path}">${name}</a>`;
      if (i < count - 1)
        linkNameList += ', '
      if (i % 4 === 3)
        linkNameList += '<br>';
    });
    this.addLineToLoading(linkNameList);

    for (let c = 0; c < count; c++)
      this._loadAsteroid(asteroids[randomArray[c]], c, count);
  }
  async _loadAsteroid(asteroid, index, count) {
    let startRatio = index / count;
    let mainY = 1;
    if (index % 2 !== 0)
      mainY = 2.5;

    let path = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fasteroids%2F' +
      encodeURIComponent(asteroid) + '?alt=media';
    let mesh = await this.loadStaticMesh(path, '', 1, 0, mainY, 0);

    if (!this.asteroidMaterial) {
      let m = new BABYLON.StandardMaterial('asteroidmaterial', this.scene);
      this.asteroidMaterial = m;
      m.wireframe = true;
      let at = new BABYLON.Texture('/images/asteroid2diff.jpg', this.scene);
      this.asteroidMaterial.diffuseTexture = at;

      this.asteroidSelectedMaterial = new BABYLON.StandardMaterial('asteroidmaterialselected', this.scene)
      let t = new BABYLON.Texture('/images/asteroid2diff.jpg', this.scene);
      this.asteroidSelectedMaterial.diffuseTexture = t;
      let bt = new BABYLON.Texture('/images/asteroid2normal.jpg', this.scene);
      this.asteroidSelectedMaterial.bumpTexture = bt;
      this.asteroidSelectedMaterial.roughness = 1;
      this.asteroidSelectedMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    }
    mesh.material = this.asteroidMaterial;

    let orbitWrapper = new BABYLON.TransformNode('assetorbitwrapper' + asteroid, this.scene);

    mesh.position.x = 20;
    orbitWrapper.position.x = 7;
    orbitWrapper.position.z = 9;

    mesh.parent = orbitWrapper;
    /*
    let shakeWrapper = BABYLON.MeshBuilder.CreateBox('assetshakewrapper' + asteroid, {
      width: .01,
      height: .01,
      depth: .01
    }, this.scene);
    shakeWrapper.visibility = 0;
    shakeWrapper.material = this.mat1alpha;
    shakeWrapper.parent = orbitWrapper;
    mesh.parent = shakeWrapper;

    let positionKeys = [];
    let px = orbitWrapper.position.x;
    let py = orbitWrapper.position.y;
    let pz = orbitWrapper.position.z;
    positionKeys.push({
      frame: 0,
      value: new BABYLON.Vector3(px, py, pz)
    });

    let position2factor = index % 2 === 1 ? -1 : 1;
    let position3factor = index % 3 === 1 ? -1 : 1;
    let position4factor = index % 4 === 1 ? 1 : -1;
    let wobbleEndFrame = 5 * 30;
    positionKeys.push({
      frame: wobbleEndFrame / 2,
      value: new BABYLON.Vector3(px + position4factor, py + position2factor, pz + position3factor + position2factor)
    });

    positionKeys.push({
      frame: wobbleEndFrame,
      value: new BABYLON.Vector3(px, py, pz)
    });

    let positionAnim = new BABYLON.Animation(
      "asteroidspinyposion" + asteroid,
      "position",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    positionAnim.setKeys(positionKeys);

    if (!shakeWrapper.animations)
      shakeWrapper.animations = [];
    shakeWrapper.animations.push(positionAnim);
    //    shakeWrapper.spinAnimation = this.scene.beginAnimation(shakeWrapper, 0, wobbleEndFrame, true);
    */

    let orbitAnim = new BABYLON.Animation(
      "asteroidorbit" + asteroid,
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let orbitEndFrame = 60 * 30;
    let orbitkeys = [];
    orbitkeys.push({
      frame: 0,
      value: new BABYLON.Vector3(0, 0, 0)
    });

    orbitkeys.push({
      frame: orbitEndFrame,
      value: new BABYLON.Vector3(0, -2 * Math.PI, 0)
    });

    orbitAnim.setKeys(orbitkeys);
    if (!orbitWrapper.animations)
      orbitWrapper.animations = [];
    orbitWrapper.animations.push(orbitAnim);
    orbitWrapper.spinAnimation = this.scene.beginAnimation(orbitWrapper, 0, orbitEndFrame, true);

    if (startRatio !== 0.0)
      orbitWrapper.spinAnimation.goToFrame(Math.floor(orbitEndFrame * startRatio));

    let anim = new BABYLON.Animation(
      "asteroidspiny" + asteroid,
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let x = mesh.rotation.x;
    let y = mesh.rotation.y;
    let z = mesh.rotation.z;
    let spinkeys = [];

    let extraFrames = 0;
    if (index % 3 === 0)
      extraFrames += 75;
    if (index % 3 === 1)
      extraFrames += 150;
    if (index % 2 === 0)
      extraFrames -= 50;
    if (index % 2 === 1)
      extraFrames -= 50;
    if (index % 5 === 0)
      extraFrames -= 50;

    let spinEndFrame = 24 * 30 + extraFrames;
    spinkeys.push({
      frame: 0,
      value: new BABYLON.Vector3(x, y, z)
    });

    let endY = y + -2 * Math.PI;
    if (Math.random() > 0.5)
      endY *= -1;
    spinkeys.push({
      frame: spinEndFrame,
      value: new BABYLON.Vector3(x + -4 * Math.PI, endY, z + 4 * Math.PI)
    });

    anim.setKeys(spinkeys);
    if (!mesh.animations)
      mesh.animations = [];

    mesh.animations.push(anim);
    orbitWrapper.localAnimation = this.scene.beginAnimation(mesh, 0, spinEndFrame, true);

    orbitWrapper.appClickable = true;
    orbitWrapper.clickToPause = true;
    orbitWrapper.clickCommand = 'pauseSpin';
    orbitWrapper.asteroidMesh = mesh;
    mesh.asteroidName = asteroid;
    orbitWrapper.asteroidType = true;
    orbitWrapper.asteroidName = asteroid;

    mesh.origsx = mesh.scaling.x;
    mesh.origsy = mesh.scaling.y;
    mesh.origsz = mesh.scaling.z;

    orbitWrapper.symbolWrapper = this.loadSymbolForAsteroid(mesh, asteroid, index);
  }
  loadSymbolForAsteroid(parent, name, index) {
    let size = 1;

    if (!this.asteroidSymbolMesh1) {
      let symbolWrapper = BABYLON.MeshBuilder.CreateBox('asteroidsymbolwrapper', {
        width: .01,
        height: .01,
        depth: .01
      }, this.scene);
      symbolWrapper.parent = parent;
      symbolWrapper.material = this.mat1alpha;
      this.asteroidSymbolMesh1 = symbolWrapper;

      let symbolMesh1 = BABYLON.MeshBuilder.CreatePlane('symbolshow1asteroid', {
        height: size,
        width: size
      }, this.scene);
      let symbolMesh3 = BABYLON.MeshBuilder.CreatePlane('symbolshow3asteroid', {
        height: size,
        width: size
      }, this.scene);

      let m = new BABYLON.StandardMaterial('symbolshowmatasteroid', this.scene);
      let file1 = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent('/symbol/asteroid.png') + '?alt=media';
      let t = new BABYLON.Texture(file1, this.scene);
      t.vScale = 1;
      t.uScale = 1;
      t.hasAlpha = true;

      m.diffuseTexture = t;
      m.emissiveTexture = t;
      m.ambientTexture = t;
      let extraY = 0;
      symbolMesh1.material = m;
      symbolMesh1.parent = symbolWrapper;
      symbolMesh1.rotation.y = 0;
      symbolMesh1.position.y = extraY;
      symbolMesh3.material = m;
      symbolMesh3.parent = symbolWrapper;
      symbolMesh3.rotation.y = Math.PI;
      symbolMesh3.position.y = extraY;
      symbolMesh3.scaling.x = -1;

      this.asteroidSymbolMeshName = BABYLON.MeshBuilder.CreateBox('asteroidnamewrapper', {
        width: .01,
        height: .01,
        depth: .01
      }, this.scene);
      this.asteroidSymbolMeshName.position.y = 1;
      this.asteroidSymbolMeshName.visibility = 0;
      this.asteroidSymbolMeshName.material = this.mat1alpha;
      this.asteroidSymbolMeshName.setEnabled(false);

      let nameMesh1 = BABYLON.MeshBuilder.CreatePlane('nameshow1asteroid', {
        height: size * 5,
        width: size * 5
      }, this.scene);
      let nameMesh2 = BABYLON.MeshBuilder.CreatePlane('nameshow2asteroid', {
        height: size * 5,
        width: size * 5
      }, this.scene);

      let nameMat = new BABYLON.StandardMaterial('nameshowmatasteroid', this.scene);
      this.__setTextMaterial(nameMat, 'asteroid');
      this.asteroidSymbolMeshName.nameMaterial = nameMat;

      nameMesh1.material = nameMat;
      nameMesh1.parent = this.asteroidSymbolMeshName;
      nameMesh2.material = nameMat;
      nameMesh2.parent = this.asteroidSymbolMeshName;
      nameMesh2.scaling.x = -1;

      let factor = -1.8;
      //    if (meta.symbolY < -0.99)
      //    factor = -2.75;
      nameMesh1.position.y = symbolMesh1.position.y + factor;
      nameMesh2.position.y = symbolMesh1.position.y + factor;
      nameMesh2.rotation.y = Math.PI;
    }
    if (!this.asteroidSymbolMesh2) {
      let symbolWrapper = BABYLON.MeshBuilder.CreateBox('asteroidsymbolwrapper2', {
        width: .01,
        height: .01,
        depth: .01
      }, this.scene);
      symbolWrapper.parent = parent;
      symbolWrapper.material = this.mat1alpha;
      this.asteroidSymbolMesh2 = symbolWrapper;

      let symbolMesh1 = BABYLON.MeshBuilder.CreatePlane('symbolshow1asteroid2', {
        height: size,
        width: size
      }, this.scene);
      let symbolMesh3 = BABYLON.MeshBuilder.CreatePlane('symbolshow3asteroid2', {
        height: size,
        width: size
      }, this.scene);

      let m = new BABYLON.StandardMaterial('symbolshowmatasteroid2', this.scene);
      let file1 = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent('/symbol/asteroid2.png') + '?alt=media';
      let t = new BABYLON.Texture(file1, this.scene);

      t.vScale = 1;
      t.uScale = 1;
      t.hasAlpha = true;

      m.diffuseTexture = t;
      m.emissiveTexture = t;
      m.ambientTexture = t;
      let extraY = 0;
      symbolMesh1.material = m;
      symbolMesh1.parent = symbolWrapper;
      symbolMesh1.rotation.y = 0;
      symbolMesh1.position.y = extraY;
      symbolMesh3.material = m;
      symbolMesh3.parent = symbolWrapper;
      symbolMesh3.rotation.y = Math.PI;
      symbolMesh3.position.y = extraY;
      symbolMesh3.scaling.x = -1;
    }

    //parent.symbolWrapper = symbolWrapper;
    let asteroidSymbol;
    if (index % 2 === 0) {
      asteroidSymbol = this.asteroidSymbolMesh1.clone("asteroidsymbol" + name);
      asteroidSymbol.parent = parent;
    } else {
      asteroidSymbol = this.asteroidSymbolMesh2.clone("asteroidsymbol" + name);
      asteroidSymbol.parent = parent;
    }

    return asteroidSymbol;
  }

  __setTextMaterial(mat, text, rgbColor = 'rgb(255,0,0)') {
    let nameTexture = Utility3D.__texture2DText(this.scene, text, rgbColor);
    nameTexture.vScale = 1;
    nameTexture.uScale = 1;
    nameTexture.hasAlpha = true;
    mat.diffuseTexture = nameTexture;
    mat.emissiveTexture = nameTexture;
    mat.ambientTexture = nameTexture;
  }

  loadStaticNavMesh(name) {
    let meta = this.allCards[name];

    let mercurysphere = BABYLON.MeshBuilder.CreateSphere(name + "navmeshsphere", {
      diameter: meta.diameter,
      segments: 16
    }, this.scene);
    mercurysphere.position.x = meta.x;
    mercurysphere.position.z = meta.z;
    return mercurysphere;
  }

  async loadStaticAsset(name, parent) {
    let meta = this.allCards[name];

    if (this.minMoonsLoad && meta.moonType === 5)
      return;

    if (meta.optionalLoad && this.gameData.performanceFlags.indexOf(meta.optionalFlags) === -1) {
      return;
    }

    let extendedMetaData = this.processStaticAssetMeta(meta);

    let mesh = await this.loadStaticMesh(extendedMetaData.glbPath, '', extendedMetaData.scale, 0, 0, 0);

    let normalLink = `<a href="${extendedMetaData.glbPath}" target="_blank">Normal</a>&nbsp;`;
    let smallLink = '';
    let largeLink = '';
    if (meta.largeglbpath)
      largeLink = `<a href="${extendedMetaData.largeGlbPath}" target="_blank">Large</a>&nbsp;`;
    if (meta.smallglbpath)
      smallLink = `<a href="${extendedMetaData.smallGlbPath}" target="_blank">Small</a>&nbsp;`;

    this.addLineToLoading(`<img src="${extendedMetaData.symbolPath}" class="symbol_image">
        <a href="${meta.url}" target="_blank"><img class="symbol_image" src="/images/wikilogo.png"></a>
        &nbsp;
        ${meta.name}:
        &nbsp;
        ${smallLink}
        ${normalLink}
        ${largeLink}
        <br>
      `);

    let outer_wrapper = new BABYLON.TransformNode('outerassetwrapper' + name, this.scene);
    let wrapper = new BABYLON.TransformNode('assetwrapper' + name, this.scene);
    wrapper.parent = outer_wrapper;
    mesh.parent = wrapper;

    outer_wrapper.position.x = meta.x;
    outer_wrapper.position.y = meta.y;
    outer_wrapper.position.z = meta.z;

    this._addParticlesStaticMesh(meta, wrapper, name);

    if (meta.noOrbit) {
      outer_wrapper.parent = this.staticAssetMeshes[meta.parent];

      if (meta.rx !== undefined)
        wrapper.rotation.x = meta.rx;
      if (meta.ry !== undefined)
        wrapper.rotation.y = meta.ry;
      if (meta.rz !== undefined)
        wrapper.rotation.z = meta.rz;
    }
    if (meta.moon90orbit) {
      wrapper.rotation.x += Math.PI / 2;
    }

    let clickWrapper = outer_wrapper;
    if (meta.parent && meta.noOrbit !== true) {
      let orbitMesh = Utility3D._addOrbitWrapper(name, meta, outer_wrapper, this.scene);
      orbitMesh.parent = this.staticAssetMeshes[meta.parent];
      clickWrapper = orbitMesh;
    }

    if (meta.noClick !== true) {
      clickWrapper.appClickable = true;
      clickWrapper.masterid = name;
      clickWrapper.clickToPause = true;
      clickWrapper.clickCommand = 'pauseSpin';

      if (meta.seatIndex !== undefined)
        this.seatMeshes[meta.seatIndex] = clickWrapper;
      clickWrapper.wrapperName = name;
      clickWrapper.rawMeshWrapper = wrapper;
    }

    this.staticAssetMeshes[name] = outer_wrapper;

    if (meta.showSymbol) this._renderSymbolInfoPanel(name, meta, wrapper, clickWrapper, extendedMetaData);
    if (meta.freeOrbit) Utility3D._addFreeOrbitWrapper(outer_wrapper, meta, name, wrapper, this.scene);
    if (this.shadowGenerator) this.shadowGenerator.addShadowCaster(mesh, true);
    if (meta.mp3file) this._loadMeshMusic(meta, mesh, name);
    if (meta.spintime) Utility3D.addSpinAnimation(name, meta, outer_wrapper, wrapper, this.scene);
  }
  processStaticAssetMeta(meta) {
    let normalGlbPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.glbpath) + '?alt=media';
    let smallGlbPath = '';
    if (meta.smallglbpath)
      smallGlbPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.smallglbpath) + '?alt=media';
    let largeGlbPath = '';
    if (meta.largeglbpath)
      largeGlbPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.largeglbpath) + '?alt=media';
    let normalScale = meta.glbscale;
    let largeScale = normalScale;
    if (meta.largeglbscale !== undefined)
      largeScale = meta.largeglbscale;
    let smallScale = normalScale;
    if (meta.smallglbscale !== undefined)
      smallScale = meta.smallglbscale;

    let scale = normalScale;
    let glbPath = normalGlbPath;

    if (this.hugeAssets) {
      scale = largeScale;
      if (largeGlbPath)
        glbPath = largeGlbPath;
    }

    if (this.smallAssets) {
      scale = smallScale;
      if (smallGlbPath)
        glbPath = smallGlbPath;
    }

    let symbolPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.symbol) + '?alt=media';

    return {
      symbolPath,
      normalGlbPath,
      smallGlbPath,
      largeGlbPath,
      normalScale,
      smallScale,
      largeScale,
      glbPath,
      scale
    };
  }
  _addParticlesStaticMesh(meta, wrapper, name) {
    if (meta.particlesEnabled && this.gameData.performanceFlags.indexOf('particles_none') === -1) {
      let particlePivot = BABYLON.Mesh.CreateBox("staticpivotparticle" + name, .001, this.scene);
      particlePivot.position.x = meta.px;
      particlePivot.position.y = meta.py;
      particlePivot.position.z = meta.pz;
      //particlePivot.rotation.x = -1 * Math.PI / 2;
      particlePivot.rotation.z = Math.PI;
      particlePivot.material = this.mat1alpha;
      particlePivot.parent = wrapper;

      wrapper.particleSystem = this.createParticleSystem(particlePivot, 'particlesstatic' + name);
      wrapper.particleSystem.start();
    }
  }
  _loadMeshMusic(meta, mesh, name) {
    if (this.gameData.performanceFlags.indexOf('sound_all') === -1)
      return;

    setTimeout(() => {
      let song = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' +
        encodeURIComponent(meta.mp3file) + '?alt=media&ext=.mp3';

      let music = new BABYLON.Sound("music", song, this.scene, null, {
        loop: true,
        spatialSound: true,
        distanceModel: "exponential",
        rolloffFactor: 2
      });
      music.attachToMesh(mesh);

      this.musicMeshes[name] = music;
    }, 10000);
  }
  _renderSymbolInfoPanel(name, meta, wrapper, parent, extendedMetaData) {
    let size = 1;

    let symbolWrapper = BABYLON.MeshBuilder.CreateBox('symbolpopupwrapper' + name, {
      width: .01,
      height: .01,
      depth: .01
    }, this.scene);
    symbolWrapper.visibility = 0;
    symbolWrapper.parent = wrapper;
    parent.symbolWrapper = symbolWrapper;
    if (meta.moon90orbit) {
      symbolWrapper.rotation.x -= 1.57;
    }

    let symbolMesh1 = BABYLON.MeshBuilder.CreatePlane('symbolshow1' + name, {
      height: size,
      width: size
    }, this.scene);
    let symbolMesh3 = BABYLON.MeshBuilder.CreatePlane('symbolshow3' + name, {
      height: size,
      width: size
    }, this.scene);

    let m = new BABYLON.StandardMaterial('symbolshowmat' + name, this.scene);
    let t = new BABYLON.Texture(extendedMetaData.symbolPath, this.scene);
    t.vScale = 1;
    t.uScale = 1;
    t.hasAlpha = true;

    m.diffuseTexture = t;
    m.emissiveTexture = t;
    m.ambientTexture = t;
    let extraY = 0;
    if (meta.symbolY)
      extraY = meta.symbolY;
    symbolMesh1.material = m;
    symbolMesh1.parent = symbolWrapper;
    symbolMesh1.rotation.y = 0;
    symbolMesh1.position.y = meta.diameter / 1.25 + extraY;
    symbolMesh3.material = m;
    symbolMesh3.parent = symbolWrapper;
    symbolMesh3.rotation.y = Math.PI;
    symbolMesh3.position.y = meta.diameter / 1.25 + extraY;
    symbolMesh3.scaling.x = -1;

    let boardWrapper = BABYLON.MeshBuilder.CreateBox('boardpopupwrapper' + name, {
      width: .01,
      height: .01,
      depth: .01
    }, this.scene);
    boardWrapper.visibility = 0;
    boardWrapper.parent = wrapper;
    if (meta.moon90orbit) {
      boardWrapper.rotation.x -= 1.57;
    }


    let nameMesh1 = BABYLON.MeshBuilder.CreatePlane('nameshow1' + name, {
      height: size * 5,
      width: size * 5
    }, this.scene);
    let nameMesh2 = BABYLON.MeshBuilder.CreatePlane('nameshow2' + name, {
      height: size * 5,
      width: size * 5
    }, this.scene);

    let factor = -1.8;
    //    if (meta.symbolY < -0.99)
    //    factor = -2.75;
    nameMesh1.position.y = symbolMesh1.position.y + factor;
    nameMesh2.position.y = symbolMesh1.position.y + factor;
    nameMesh2.rotation.y = Math.PI;

    let nameMat = new BABYLON.StandardMaterial('nameshowmat' + name, this.scene);
    let nameDesc = meta.name;
    if (meta.solarPosition)
      nameDesc += ` (${meta.solarPosition})`
    let nameTexture = Utility3D.__texture2DText(this.scene, nameDesc, meta.color);
    nameTexture.vScale = 1;
    nameTexture.uScale = 1;
    nameTexture.hasAlpha = true;
    nameMat.diffuseTexture = nameTexture;
    nameMat.emissiveTexture = nameTexture;
    nameMat.ambientTexture = nameTexture;
    nameMesh1.material = nameMat;
    nameMesh1.parent = boardWrapper;
    nameMesh2.material = nameMat;
    nameMesh2.parent = boardWrapper;
    nameMesh2.scaling.x = -1;

    boardWrapper.parent = wrapper;
    parent.boardWrapper = boardWrapper;

    this.hideBoardWrapper(parent);
  }

  showBoardWrapper(mesh) {
    if (!mesh.boardWrapper)
      return;
    mesh.boardWrapper.setEnabled(true);
    mesh.symbolWrapper.setEnabled(false);
  }
  hideBoardWrapper(mesh) {
    if (!mesh.boardWrapper)
      return;
    mesh.boardWrapper.setEnabled(false);
    mesh.symbolWrapper.setEnabled(true);
  }
  createParticleSystem(mesh, prefix = "static") {
    let useGPUVersion = true;
    if (this[prefix + 'particleSystem']) {
      this[prefix + 'particleSystem'].dispose();
    }

    if (useGPUVersion && BABYLON.GPUParticleSystem.IsSupported) {
      this[prefix + 'particleSystem'] = new BABYLON.GPUParticleSystem("particles", {
        capacity: 1000000
      }, this.scene);
      this[prefix + 'particleSystem'].activeParticleCount = 100000;
    } else {
      this[prefix + 'particleSystem'] = new BABYLON.ParticleSystem("particles", 25000, this.scene);
    }

    this[prefix + 'particleSystem'].emitRate = 500;
    // this[prefix + 'particleSystem'].particleEmitterType = new BABYLON.BoxParticleEmitter(1);
    this[prefix + 'particleSystem'].particleTexture = new BABYLON.Texture("/images/flare.png", this.scene);

    this[prefix + 'particleSystem'].gravity = new BABYLON.Vector3(0, 0, 0);

    // how long before the particles dispose?
    this[prefix + 'particleSystem'].minLifeTime = 2;
    this[prefix + 'particleSystem'].maxLifeTime = 2;

    // how much "push" from the back of the rocket.
    // Rocket forward movement also (seemingly) effects "push", but not really.
    this[prefix + 'particleSystem'].minEmitPower = 5;
    this[prefix + 'particleSystem'].maxEmitPower = 5;

    this[prefix + 'particleSystem'].minSize = 0.01;
    this[prefix + 'particleSystem'].maxSize = 0.1;

    // adjust diections to aim out fat-bottom end of rocket, with slight spread.
    this[prefix + 'particleSystem'].direction1 = new BABYLON.Vector3(-.2, 1, -.2);
    this[prefix + 'particleSystem'].direction2 = new BABYLON.Vector3(.2, 1, .2);

    this[prefix + 'particleSystem'].emitter = mesh;

    // rocket length 4, so move emission point... 2 units toward wide end of rocket.
    this[prefix + 'particleSystem'].minEmitBox = new BABYLON.Vector3(0, 2, 0)
    this[prefix + 'particleSystem'].maxEmitBox = new BABYLON.Vector3(0, 2, 0)


    // a few colors, based on age/lifetime.  Yellow to red, generally speaking.
    this[prefix + 'particleSystem'].color1 = new BABYLON.Color3(1, 1, 0);
    this[prefix + 'particleSystem'].color2 = new BABYLON.Color3(1, .5, 0);
    this[prefix + 'particleSystem'].colorDead = new BABYLON.Color3(1, 0, 0);

    //this[prefix + 'particleSystem'].start();

    return this[prefix + 'particleSystem'];
  }
  viewSettings() {
    this.modal.show();
  }
  getSeatData(seatIndex) {
    let key = 'seat' + seatIndex.toString();
    let name = '';
    let avatar = '';
    let uid = '';
    let seated = false;
    if (this.gameData[key]) {
      name = this.gameData.memberNames[this.gameData[key]];
      if (!name) name = "Anonymous";
      avatar = this.gameData.memberAvatars[this.gameData[key]];
      if (!avatar) avatar = "male1";

      uid = this.gameData[key];
      seated = true;
    }

    return {
      seated,
      name,
      key,
      avatar,
      uid: this.gameData[key]
    };
  }
  async loadAvatars() {
    if (!this.sceneInited)
      return;
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      if (seatIndex < this.runningSeatCount) {
        let data = this.getSeatData(seatIndex);
        let cacheValue = data.name + data.avatar + data.seated.toString();
        if (!this['dockSeatMesh' + seatIndex]) {
          let mesh = await this.renderSeat(seatIndex);

          this['dockSeatMesh' + seatIndex] = mesh;
          this['dockSeatCache' + seatIndex] = cacheValue;
          await this._updateSeat(seatIndex);
        } else if (this['dockSeatCache' + seatIndex] !== cacheValue) {
          await this._updateSeat(seatIndex);
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
    this.updateAgents();
    this.updateUserPresence();
    this.__updateSelectedSeatMesh();

    this.avatarsLoaded = true;
  }
  pointerUp(mesh, pointerInfo) {
    if (!mesh)
      return;

    if (mesh.clickCommand === 'pauseSpin') {
      this.hideBoardWrapper(mesh);

      if (mesh.spinAnimation._paused)
        mesh.spinAnimation.restart();

      if (mesh.asteroidType)
        this.asteroidPtrDown(mesh, true);

      if (this.currentSeatMesh !== mesh) {
        if (mesh.masterid && this.musicMeshes[mesh.masterid])
          this.musicMeshes[mesh.masterid].stop();
      }
    }
  }
  pointerDown(mesh) {
    while (mesh && !mesh.appClickable) {
      mesh = mesh.parent;
    }

    if (!mesh || !mesh.appClickable)
      return;

    if (mesh.emptySeat) {
      this.dockSit(mesh.seatIndex);
    }

    if (mesh.clickCommand === 'stand') {
      this._gameAPIStand(mesh.seatIndex);
    }

    if (mesh.clickCommand === 'pauseSpin') {
      this.showBoardWrapper(mesh);

      this.lastMesh = mesh;
      mesh.spinAnimation.pause();

      if (mesh.asteroidType)
        this.asteroidPtrDown(mesh);

      if (this.currentSeatMesh !== mesh) {
        if (mesh.masterid && this.musicMeshes[mesh.masterid])
          this.musicMeshes[mesh.masterid].play();
      }
    }

    if (mesh.wrapperName === 'sun')
      this._endTurn();
  }
  asteroidPtrDown(mesh, up = false) {
    if (!up) {
      mesh.asteroidMesh.material = this.asteroidSelectedMaterial;
      mesh.asteroidMesh.scaling.x = mesh.asteroidMesh.origsx * 1.25;
      mesh.asteroidMesh.scaling.y = mesh.asteroidMesh.origsy * 1.25;
      mesh.asteroidMesh.scaling.z = mesh.asteroidMesh.origsz * 1.25;

      mesh.symbolWrapper.setEnabled(false);
      this.asteroidSymbolMeshName.setEnabled(true);
      this.asteroidSymbolMeshName.parent = mesh.asteroidMesh;

      let text = mesh.asteroidMesh.asteroidName.replace('.obj', '');
      this.__setTextMaterial(this.asteroidSymbolMeshName.nameMaterial, text);

      setTimeout(() => {
        mesh.asteroidMesh.material = this.asteroidMaterial;
      }, 3000);
    } else {
      mesh.asteroidMesh.material = this.asteroidMaterial;
      mesh.asteroidMesh.scaling.x = mesh.asteroidMesh.origsx;
      mesh.asteroidMesh.scaling.y = mesh.asteroidMesh.origsy;
      mesh.asteroidMesh.scaling.z = mesh.asteroidMesh.origsz;

      mesh.symbolWrapper.setEnabled(true);
      this.asteroidSymbolMeshName.setEnabled(false);
    }
  }
  async loadStaticMesh(path, file, scale = 1, x = 0, y = 0, z = 0) {
    let result = await BABYLON.SceneLoader.ImportMeshAsync("", path, file);

    let mesh = result.meshes[0];

    mesh.scaling.x = -1 * scale;
    mesh.scaling.y = scale;
    mesh.scaling.z = scale;

    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;

    return mesh;
  }
  debounce() {
    return false;

    if (this.debounceBusy)
      return true;

    this.debounceBusy = true;
    setTimeout(() => this.debounceBusy = false, 500);
    return false;
  }
  async authUpdateStatusUI() {
    super.authUpdateStatusUI();
    if (!this.profile)
      return;

    this.currentGame = null;
    this.initRTDBPresence();

    let gameId = this.urlParams.get('game');
    if (gameId) {
      await this.gameAPIJoin(gameId);
      this.currentGame = gameId;
      this.gameid_span.innerHTML = 'id: <span class="impact-font">' + this.currentGame + '</span>';

      if (this.gameSubscription)
        this.gameSubscription();
      this.gameSubscription = firebase.firestore().doc(`Games/${this.currentGame}`)
        .onSnapshot((doc) => this.paintGameData(doc));
    }
  }
  async load() {
    this.allCards = await GameCards.loadDecks();
    await super.load();
  }

  async initGraphics() {
    await this.initBabylonEngine(".popup-canvas", true);
    if (this.loadStaticScene)
      await this.loadStaticScene();
  }
  paintDock() {
    super.paintDock();

    this.loadAvatars();
  }
  async paintGameData(gameDoc = null) {
    if (gameDoc)
      this.gameData = gameDoc.data();

    if (!this.gameData)
      return;

    if (!this.engine) {
      await this.initGraphics();
    }

    this.initGameMessageFeed();

    document.body.classList.add('game_loaded');

    this.queryStringPaintProcess();
    this.paintOptions();

    this._updateGameMembersList();
    this.paintDock();

    if (this.gameData.mode !== this.previousMode)
      this.matchBoardRendered = false;
    this.previousMode = this.gameData.mode;

    document.body.classList.remove('turnphase_select');
    document.body.classList.remove('turnphase_result');
    document.body.classList.remove('turnphase_clearprevious');
    let phase = "select";
    if (this.gameData.turnPhase)
      phase = this.gameData.turnPhase;
    document.body.classList.add('turnphase_' + phase);

    let phaseDesc = 'Select';
    let disabled = true;

    if (this.gameData.turnPhase === 'clearprevious') {
      phaseDesc = 'Clear';
      disabled = false;
    } else if (this.gameData.turnPhase === 'result') {
      phaseDesc = 'Next';
      disabled = false;
    }

    if (this.uid !== this.gameData['seat' + this.gameData.currentSeat]) {
      disabled = true;
    }

    if (disabled)
      this.player_dock_prompt.setAttribute('disabled', true);
    else
      this.player_dock_prompt.removeAttribute('disabled');

    let seatIndex = "0";
    if (this.gameData.currentSeat)
      seatIndex = this.gameData.currentSeat.toString();

    let displayTurnNumber = Math.floor(this.gameData.turnNumber / this.gameData.runningNumberOfSeats) + 1;
    this.turn_number_div.innerHTML = displayTurnNumber.toString();
    let pts = this.gameData['seatPoints' + seatIndex];
    this.player_total_points.innerHTML = pts;
    this.player_total_for_turn.innerHTML = this.gameData.pairsInARowMatched;
    this.player_dock_prompt.innerHTML = phaseDesc;

    this.currentplayer_score_dock.classList.remove('seat_color_0');
    this.currentplayer_score_dock.classList.remove('seat_color_1');
    this.currentplayer_score_dock.classList.remove('seat_color_2');
    this.currentplayer_score_dock.classList.remove('seat_color_3');

    this.match_board_wrapper.classList.remove('seat_color_0');
    this.match_board_wrapper.classList.remove('seat_color_1');
    this.match_board_wrapper.classList.remove('seat_color_2');
    this.match_board_wrapper.classList.remove('seat_color_3');

    this.currentplayer_score_dock.classList.add('seat_color_' + seatIndex);
    this.match_board_wrapper.classList.add('seat_color_' + seatIndex);

    let name = this.gameData.name.replace(' Avenue', '').replace(' Street', '');
    this.game_header_panel.innerHTML = `${name}`;

    document.body.classList.add('show_game_table');

    if (!this.avatarsLoaded)
      return;

    this.updateUserPresence();
    this.updateAgents();

    this.runRender = true;
    document.body.classList.add('avatars_loaded');
    this.__updateSelectedSeatMesh();
  }
  __updateSelectedSeatMesh() {
    let seatIndex = this.gameData.currentSeat;
    if (this.currentSeatMeshIndex === seatIndex)
      return;

    if (!this.runRender)
      return;

    let seatWrapperMesh = this['dockSeatMesh' + seatIndex];

    if (!seatWrapperMesh)
      return;

    for (let name in this.musicMeshes) {
      this.musicMeshes[name].stop();
    }

    let seatMesh = this.seatMeshes[seatIndex];
    this.currentSeatMesh = seatMesh;
    if (seatMesh.masterid && this.musicMeshes[seatMesh.masterid] && !this.musicMeshes[seatMesh.masterid].isPlaying)
      this.musicMeshes[seatMesh.masterid].play();

    this.selectedPlayerPanel.parent = seatWrapperMesh;
    this.selectedMoonPanel.parent = this.seatMeshes[seatIndex].rawMeshWrapper;
    this.selectedPlayerPanel.position.y = 4;
    this.selectedMoonPanel.position.y = 3;

    let colors = this.get3DColors(seatIndex);
    this.selectedPlayerPanel.material.diffuseColor = new BABYLON.Color3(colors.r, colors.g, colors.b);
    this.selectedPlayerPanel.material.ambientColor = new BABYLON.Color3(colors.r, colors.g, colors.b);
    this.selectedPlayerPanel.material.emissiveColor = new BABYLON.Color3(colors.r, colors.g, colors.b);

    this.currentSeatMeshIndex = seatIndex;
  }
  renderSeatText(mesh, index) {
    let seatData = this.getSeatData(index);
    let name = seatData.name;
    let colors = this.get3DColors(index);

    let name3d = this.__createTextMesh('seattext' + index, {
      text: name,
      fontFamily: 'Arial',
      size: 100,
      depth: .1
    });
    name3d.scaling.x = .15;
    name3d.scaling.y = .15;
    name3d.scaling.z = .15;
    name3d.position.y = 2;
    name3d.rotation.z = -Math.PI / 2;
    name3d.rotation.y = -Math.PI / 2;

    for (let i in this.scene.meshes) {
      if (this.scene.meshes[i].parent === name3d)
        this.meshSetVerticeColors(this.scene.meshes[i], colors.r, colors.g, colors.b);
    }

    this.meshSetVerticeColors(name3d, colors.r, colors.g, colors.b);
    name3d.parent = mesh;
    mesh.name3d = name3d;

    return name3d;
  }
  async renderSeatAvatar(wrapper, avatarWrapper, index) {
    let seatData = this.getSeatData(index);
    let avatar = seatData.avatar;
    let uid = seatData.uid;

    let colors = this.get3DColors(index);
    let mesh = await this.loadAvatarMesh(`/avatars/${avatar}.glb`, "", 1, 0, 0, 0);
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;
    mesh.parent = avatarWrapper;
    wrapper.avatarMesh = mesh;
    if (this.shadowGenerator)
      this.shadowGenerator.addShadowCaster(wrapper.avatarMesh, true);

    let circle = this.createCircle();
    circle.color = new BABYLON.Color3(colors.r, colors.g, colors.b);
    circle.position.y = .1;
    circle.parent = mesh;

    let isOwner = this.uid === this.gameData.createUser;
    if (this.uid === uid || isOwner) {
      let text = 'X';
      let intensity = 5;
      if (this.uid !== uid && isOwner) {
        intensity = 0;
        text = 'X';
      }
      let x3d = this.__createTextMesh('seattextX' + index, {
        text,
        fontFamily: 'monospace',
        size: 100,
        depth: .25
      });
      x3d.scaling.x = .2;
      x3d.scaling.y = .2;
      x3d.scaling.z = .2;
      x3d.position.y = 2.25;
      x3d.rotation.z = -Math.PI / 2;
      x3d.rotation.y = -Math.PI / 2;

      for (let i in this.scene.meshes) {
        if (this.scene.meshes[i].parent === x3d)
          this.meshSetVerticeColors(this.scene.meshes[i], intensity, intensity, intensity);
      }

      this.meshSetVerticeColors(x3d, intensity, intensity, intensity);
      x3d.parent = mesh;
      x3d.appClickable = true;
      x3d.clickCommand = 'stand';
      x3d.seatIndex = index;
    }
  }
  async _updateSeat(index) {
    let seatData = this.getSeatData(index);
    let colors = this.get3DColors(index);

    let seat = this['dockSeatMesh' + index];
    if (seat.avatarMesh) {
      seat.avatarMesh.dispose();
      seat.avatarMesh = null;
    }

    if (seat.name3d) {
      seat.name3d.dispose();
      seat.name3d = null;
    }

    if (seat.baseDisc) {
      seat.baseDisc.dispose();
      seat.baseDisc = null;
    }

    if (seatData.seated) {
      if (this.gameData.performanceFlags.indexOf('text3d_names') !== -1)
        this.renderSeatText(seat, index);
      await this.renderSeatAvatar(seat, seat.avatarWrapper, index);
    } else {
      let baseDisc = BABYLON.MeshBuilder.CreateDisc("emptyseat" + index.toString(), {
        radius: this.dockDiscRadius,
        //    tessellation: 9,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
      }, this.scene);

      baseDisc.rotation.x = Math.PI / 2;
      baseDisc.emptySeat = true;
      baseDisc.seatIndex = index;

      let colors = this.get3DColors(index);
      this.meshSetVerticeColors(baseDisc, colors.r, colors.g, colors.b);
      baseDisc.parent = seat;
      baseDisc.appClickable = true;

      seat.baseDisc = baseDisc;
    }
  }
  async renderSeat(index) {
    let wrapper = BABYLON.MeshBuilder.CreateBox('seatwrapper' + index, {
      width: .01,
      height: .01,
      depth: .01
    }, this.scene);
    wrapper.visibility = 0;

    let avatarWrapper = BABYLON.MeshBuilder.CreateBox('seatavatarwrapper' + index, {
      width: .01,
      height: .01,
      depth: .01
    }, this.scene);
    avatarWrapper.visibility = 0;
    avatarWrapper.rotation.y = Math.PI;
    avatarWrapper.parent = wrapper;
    wrapper.avatarWrapper = avatarWrapper;

    this.navigationAid(wrapper, index);

    return wrapper;
  }

  get3DColors(index) {
    let r = 220 / 255,
      g = 220 / 255,
      b = 0;
    if (index === 1) {
      r = 0;
      g = 220 / 255;
      b = 210 / 255;
    }
    if (index === 2) {
      r = 230 / 255;
      g = 0;
      b = 230 / 255;
    }
    if (index === 3) {
      r = 150 / 255;
      g = 130 / 255;
      b = 255 / 255;
    }

    return new BABYLON.Color3(r, g, b);
  }
  get3DPosition(index) {
    let x = 5,
      y = .1,
      z = (index * 1.25) - 2;
    return new BABYLON.Vector3(x, y, z);
  }
  meshSetVerticeColors(mesh, r, g, b, a = 1) {
    let colors = mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
    if (!colors) {
      colors = [];

      let positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

      for (let p = 0; p < positions.length / 3; p++) {
        colors.push(r, g, b, a);
      }
    }

    mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
  }
  createCircle(color) {
    let points = [];
    let radius = this.dockDiscRadius;

    for (let i = -Math.PI; i <= Math.PI; i += Math.PI / 360) {
      points.push(new BABYLON.Vector3(radius * Math.cos(i), 0, radius * Math.sin(i)));
    }

    let baseCircle = BABYLON.Mesh.CreateLines("qbezier2", points, this.scene);

    return baseCircle;
  }
  __createTextMesh(name, options) {
    let canvas = document.getElementById("highresolutionhiddencanvas");
    if (!canvas) {
      let cWrapper = document.createElement('div');
      cWrapper.innerHTML = `<canvas id="highresolutionhiddencanvas" width="4500" height="1500" style="display:none"></canvas>`;
      canvas = cWrapper.firstChild;
      document.body.appendChild(canvas);
    }
    let context2D = canvas.getContext("2d", {
      willReadFrequently: true
    });
    let size = 100;
    let vectorOptions = {
      polygons: true,
      textBaseline: "top",
      fontStyle: 'normal',
      fontWeight: 'normal',
      fontFamily: 'Georgia',
      size: size,
      stroke: false
    };
    for (let i in vectorOptions)
      if (options[i])
        vectorOptions[i] = options[i];
    if (options['size'])
      size = Number(options['size']);

    let vectorData = vectorizeText(options['text'], canvas, context2D, vectorOptions);
    let x = 0;
    let y = 0;
    let z = 0;
    let thick = 10;
    if (options['depth'])
      thick = Number(options['depth']);
    let scale = size / 100;
    let lenX = 0;
    let lenY = 0;
    let polies = [];

    for (var i = 0; i < vectorData.length; i++) {
      var letter = vectorData[i];
      var conners = [];
      for (var k = 0; k < letter[0].length; k++) {
        conners[k] = new BABYLON.Vector2(scale * letter[0][k][1], scale * letter[0][k][0]);
        if (lenX < conners[k].x) lenX = conners[k].x;
        if (lenY < conners[k].y) lenY = conners[k].y;
      }
      var polyBuilder = new BABYLON.PolygonMeshBuilder("pBuilder" + i, conners, this.scene);

      for (var j = 1; j < letter.length; j++) {
        var hole = [];
        for (var k = 0; k < letter[j].length; k++) {
          hole[k] = new BABYLON.Vector2(scale * letter[j][k][1], scale * letter[j][k][0]);
        }
        hole.reverse();
        polyBuilder.addHole(hole);
      }

      try {
        var polygon = polyBuilder.build(false, thick);
        //polygon.receiveShadows = true;

        polies.push(polygon);
      } catch (e) {
        console.log('text 3d render polygon error', e);
      }
    }

    //if (lenY < .001 && lenX < .001)
    //  this.context.logError('Zero Length result for text shape ' + this.__getParentRoute());
    if (lenY === 0)
      lenY = 0.001;
    if (lenX === 0)
      lenX = 0.001;
    let deltaY = thick / 2.0;
    let deltaX = lenX / 2.0;
    let deltaZ = lenY / 2.0;

    let textWrapperMesh = BABYLON.MeshBuilder.CreateBox(this._blockKey + 'textdetailswrapper', {
      width: lenX,
      height: thick,
      depth: lenY
    }, this.scene);
    textWrapperMesh.material = this.mat1alpha;
    for (let i = 0, l = polies.length; i < l; i++) {
      polies[i].position.x -= deltaX;
      polies[i].position.y += deltaY;
      polies[i].position.z -= deltaZ;
      polies[i].setParent(textWrapperMesh);
    }

    return textWrapperMesh;
  }

  async setupAgents() {
    await Recast();
    this.navigationPlugin = new BABYLON.RecastJSPlugin();
    let navmeshParameters = {
      cs: 0.2,
      ch: 0.2,
      walkableSlopeAngle: 90,
      walkableHeight: 1.0,
      walkableClimb: 1,
      walkableRadius: 1,
      maxEdgeLen: 12.,
      maxSimplificationError: 1.3,
      minRegionArea: 8,
      mergeRegionArea: 20,
      maxVertsPerPoly: 6,
      detailSampleDist: 6,
      detailSampleMaxError: 1,
    };

    this.navigationPlugin.createNavMesh([this.navMesh, this.env.ground], navmeshParameters);
    this.crowd = this.navigationPlugin.createCrowd(6, .25, this.scene);

    this.crowd.onReachTargetObservable.add((agentInfos) => {
      let seat = this.agents[agentInfos.agentIndex].mesh;
      if (seat.avatarMesh) {
        seat.avatarMesh.localRunning = false;
        if (seat.avatarMesh.modelAnimationGroup)
          seat.avatarMesh.modelAnimationGroup.pause();
        if (seat.particleSystem)
          seat.particleSystem.stop();
      }
      this.agents[agentInfos.agentIndex].stopped = true;

      this.crowd.agentTeleport(agentInfos.agentIndex, this.crowd.getAgentPosition(agentInfos.agentIndex));
    });

    this.agentParams = {
      radius: 0.1,
      reachRadius: .5,
      height: 0.2,
      maxAcceleration: 4.0,
      maxSpeed: 1.0,
      collisionQueryRange: 0.5,
      pathOptimizationRange: 0.0,
      separationWeight: 1.0
    };
    this.agents = [];

    this.scene.onBeforeRenderObservable.add(() => {
      let agentCount = this.agents.length;
      for (let i = 0; i < agentCount; i++) {
        let ag = this.agents[i];
        if (ag.stopped) {
          continue;
        }

        ag.mesh.position = this.crowd.getAgentPosition(ag.idx);
        let vel = this.crowd.getAgentVelocity(ag.idx);
        this.crowd.getAgentNextTargetPathToRef(ag.idx, ag.target);
        if (vel.length() > 0.2) {
          vel.normalize();
          let desiredRotation = Math.atan2(vel.x, vel.z);
          ag.mesh.rotation.y = ag.mesh.rotation.y + (desiredRotation - ag.mesh.rotation.y) * 0.02;
        }

      }
    });
  }
  navigationAid(mesh, index) {
    let randomPos = this.get3DPosition(index);
    let transform = new BABYLON.TransformNode();
    let agentIndex = this.crowd.addAgent(randomPos, this.agentParams, transform);
    this.agents.push({
      idx: agentIndex,
      trf: transform,
      mesh,
      target: new BABYLON.Vector3(0, 0, 0)
    });
  }
  groundClick(pointerInfo) {
    if (!this.crowd)
      return;

    let startingPoint = pointerInfo.pickInfo.pickedPoint;
    if (startingPoint) {
      let agents = this.crowd.getAgents();
      let closest = this.navigationPlugin.getClosestPoint(startingPoint);

      let key = 'seat' + this.currentSeatMeshIndex;
      if (this.gameData[key] === this.uid) // || this.uid === this.gameData.createUser)
        this.updateSeatPosition(this.currentSeatMeshIndex, closest);
    }
  }
  async updateSeatPosition(seatIndex, position) {
    let body = {
      seatIndex,
      gameNumber: this.currentGame,
      x: position.x,
      y: position.y,
      z: position.z
    };
    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + 'api/games/seat/position', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        token
      },
      body: JSON.stringify(body)
    });
    let json = await f_result.json();
  }
  updateAgents() {
    if (!this.crowd)
      return;

    let agents = this.crowd.getAgents();

    for (let i = 0; i < agents.length; i++) {
      let key = 'seat' + i.toString();
      let lastPosChange = this.gameData[key + '_pos_d'];
      if (lastPosChange && lastPosChange !== this.cache[key + '_pos_d']) {
        this.cache[key + '_pos_d'] = lastPosChange;
        let x = Number(this.gameData[key + '_pos_x']);
        let y = Number(this.gameData[key + '_pos_y']);
        let z = Number(this.gameData[key + '_pos_z']);
        let position = new BABYLON.Vector3(x, y, z);
        this._sendAgentToTarget(i, position);
      }
    }
  }
  _sendAgentToTarget(i, position) {
    let seat = this.agents[i].mesh;
    if (this.gameData['seat' + i] && !seat.avatarMesh) {
      return setTimeout(() => this._sendAgentToTarget(i, position), 50);
    }

    this.crowd.agentGoto(i, position);

    if (seat.avatarMesh) {
      seat.avatarMesh.localRunning = true;
      if (seat.avatarMesh.modelAnimationGroup)
        seat.avatarMesh.modelAnimationGroup.play();
      if (seat.particleSystem)
        seat.particleSystem.start();
    }
    this.agents[i].target.x = position.x;
    this.agents[i].target.y = position.y;
    this.agents[i].target.z = position.z;
    this.agents[i].stopped = false;

    let pathPoints = this.navigationPlugin.computePath(this.crowd.getAgentPosition(i), position);
    let pathLine;
    pathLine = BABYLON.MeshBuilder.CreateDashedLines("ribbon", {
      points: pathPoints,
      updatable: true,
      instance: pathLine
    }, this.scene);
    let color = this.get3DColors(i);
    this.meshSetVerticeColors(pathLine, color.r, color.g, color.b);

    setTimeout(() => {
      pathLine.dispose();
    }, 1500);
  }

  updateUserPresence() {
    super.updateUserPresence();

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
            diameter: .1,
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

  async _endTurn() {
    if (this.debounce())
      return;

    let action = 'endTurn';
    let body = {
      gameId: this.currentGame,
      action
    };
    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + `api/${this.apiType}/action`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        token
      },
      body: JSON.stringify(body)
    });
    let json = await f_result.json();

    if (!json.success) {
      console.log('selection send resolve', json);
      if (this.alertErrors)
        alert('Failed to resolve selection: ' + json.errorMessage);
      return;
    }
  }
  createGuides(size = 200) {
    let wrapper = null;
    let sObjects = [];
    let axisX = BABYLON.Mesh.CreateLines("axisX", [
      new BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(size, 0, 0),
      new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
      new BABYLON.Vector3(size, 0, 0),
      new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
    ], this.scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    wrapper = axisX;

    let localScene = this.scene;

    function __make2DTextMesh(text, color, size) {
      let dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, localScene, true);
      dynamicTexture.hasAlpha = true;
      dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
      let plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, localScene, true);
      plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", localScene);
      plane.material.backFaceCulling = false;
      plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
      plane.material.diffuseTexture = dynamicTexture;
      return plane;
    }

    let xChar = __make2DTextMesh("X", "red", size / 10);
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
    xChar.setParent(wrapper);

    let axisY = BABYLON.Mesh.CreateLines("axisY", [
      new BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(0, size, 0),
      new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
      new BABYLON.Vector3(0, size, 0),
      new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
    ], this.scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    axisY.setParent(wrapper);

    let yChar = __make2DTextMesh("Y", "green", size / 10);
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
    yChar.setParent(wrapper);

    let axisZ = BABYLON.Mesh.CreateLines("axisZ", [
      new BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(0, 0, size),
      new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
      new BABYLON.Vector3(0, 0, size),
      new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
    ], this.scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    axisZ.setParent(wrapper);

    let zChar = __make2DTextMesh("Z", "blue", size / 10);
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
    zChar.setParent(wrapper);

    return wrapper;
  }
  getAsteroids() {
    const fullList = ["aruna.obj",
      "asterope.obj",
      "athene.obj",
      "augusta.obj",
      "aurelia.obj",
      "azalea.obj",
      "bacchus.obj",
      "backlunda.obj",
      "bali.obj",
      "bambery.obj",
      "barolo.obj",
      "barringer.obj",
      "bauschinger.obj",
      "begonia.obj",
      "bella.obj",
      "bertha.obj",
      "billboyle.obj",
      "bodea.obj",
      "borsenberger.obj",
      "bressi.obj",
      "bruna.obj",
      "buda.obj",
      "buzzi.obj",
      "calvinia.obj",
      "carandrews.obj",
      "carlova.obj",
      "castalia.obj",
      "celsius.obj",
      "celuta.obj",
      "cerberus.obj",
      "cevenola.obj",
      "cheruskia.obj",
      "choukyongchol.obj",
      "claudia.obj",
      "constantia.obj",
      "cosima.obj",
      "cuitlahuac.obj",
      "cyane.obj",
      "cybele.obj",
      "dabu.obj",
      "danzig.obj",
      "datura.obj",
      "davida.obj",
      "dejanira.obj",
      "denisyuk.obj",
      "diebel.obj",
      "dike.obj",
      "doris.obj",
      "dudu.obj",
      "dysona.obj",
      "echo.obj",
      "einhardress.obj",
      "einstein.obj",
      "ella.obj",
      "elly.obj",
      "epyaxa.obj",
      "erigone.obj",
      "eryan.obj",
      "euler.obj",
      "faulkes.obj",
      "feiyiou.obj",
      "florentina.obj",
      "fragaria.obj",
      "fukuhara.obj",
      "gaby.obj",
      "gagarin.obj",
      "gajdariya.obj",
      "galinskij.obj",
      "ganymed.obj",
      "geographos.obj",
      "glarona.obj",
      "glasenappia.obj",
      "godwin.obj",
      "golevka.obj",
      "golia.obj",
      "gorgo.obj",
      "hagar.obj",
      "halawe.obj",
      "hardersen.obj",
      "hedera.obj",
      "hektor.obj",
      "hela.obj",
      "hera.obj",
      "herculina.obj",
      "herge.obj",
      "hermia.obj",
      "hertzsprung.obj",
      "hildrun.obj",
      "hirosetamotsu.obj",
      "hus.obj",
      "jugurtha.obj",
      "kaho.obj",
      "kalm.obj",
      "kani.obj",
      "karin.obj",
      "kate.obj",
      "kitty.obj",
      "klumpkea.obj",
      "klytaemnestra.obj",
      "kuritariku.obj",
      "landi.obj",
      "laputa.obj",
      "lucifer.obj",
      "ludmilla.obj",
      "lundmarka.obj",
      "magnitka.obj",
      "maja.obj",
      "maksutov.obj",
      "malyshev.obj",
      "malzovia.obj",
      "manto.obj",
      "manzano.obj",
      "marceline.obj",
      "margarita.obj",
      "marilyn.obj",
      "martir.obj",
      "medea.obj",
      "medusa.obj",
      "meta.obj",
      "mikejura.obj",
      "millis.obj",
      "mimi.obj",
      "mitaka.obj",
      "mutsumi.obj",
      "myroncope.obj",
      "naantali.obj",
      "naef.obj",
      "ndola.obj",
      "neckar.obj",
      "nele.obj",
      "nereus.obj",
      "nerthus.obj",
      "ninian.obj",
      "niobe.obj",
      "nirenberg.obj",
      "nonie.obj",
      "nriag.obj",
      "ohre.obj",
      "oort.obj",
      "otero.obj",
      "paeonia.obj",
      "paradise.obj",
      "paulina.obj",
      "pepita.obj",
      "pia.obj",
      "pire.obj",
      "plato.obj",
      "radegast.obj",
      "rakhat.obj",
      "reseda.obj",
      "rohloff.obj",
      "runcorn.obj",
      "sabine.obj",
      "safara.obj",
      "sedov.obj",
      "semiramis.obj",
      "senta.obj",
      "silver.obj",
      "sobolev.obj",
      "sphinx.obj",
      "storeria.obj",
      "svanberg.obj",
      "tabora.obj",
      "tacitus.obj",
      "takuma.obj",
      "takushi.obj",
      "tama.obj",
      "tanina.obj",
      "tapio.obj",
      "tarka.obj",
      "tarry.obj",
      "tatjana.obj",
      "tatsuo.obj",
      "taurinensis.obj",
      "teller.obj",
      "tempel.obj",
      "thais.obj",
      "thekla.obj",
      "themis.obj",
      "thernoe.obj",
      "thomana.obj",
      "thomsen.obj",
      "tiflis.obj",
      "tinchen.obj",
      "tinette.obj",
      "tirela.obj",
      "titicaca.obj",
      "tjilaki.obj",
      "tolosa.obj",
      "tombecka.obj",
      "tooting.obj",
      "trebon.obj",
      "tsia.obj",
      "tsoj.obj",
      "tulipa.obj",
      "turku.obj",
      "tyche.obj",
      "ucclia.obj",
      "ueta.obj",
      "uhland.obj",
      "ukko.obj",
      "ukraina.obj",
      "ulrike.obj",
      "ulula.obj",
      "una.obj",
      "ursa.obj",
      "valyaev.obj",
      "vasadze.obj",
      "vassar.obj",
      "veritas.obj",
      "verne.obj",
      "veveri.obj",
      "vibilia.obj",
      "vojno.obj",
      "volodia.obj",
      "wachmann.obj",
      "walkure.obj",
      "walraven.obj",
      "waltraut.obj",
      "wawel.obj",
      "webern.obj",
      "wempe.obj",
      "wolpert.obj",
      "wurm.obj",
      "xenophanes.obj",
      "xerxes.obj",
      "yamada.obj",
      "yorp.obj",
      "yoshiro.obj",
      "yrsa.obj",
      "zanda.obj",
      "zdenka.obj",
      "zerlina.obj",
      "zita.obj"
    ];

    return fullList;
  }
}
