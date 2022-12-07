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

    this.asteroidOrbitTime = 60000;
    this.dockDiscRadius = .6;

    this.settings_button = document.querySelector('.settings_button');
    this.settings_button.addEventListener('click', e => this.viewSettings());

    this.canvasDisplayModal = document.querySelector('#canvasDisplayModal');
    this.modal = new bootstrap.Modal(this.canvasDisplayModal);

    this.menu_bar_toggle = document.querySelector('.menu_bar_toggle');
    this.menu_bar_toggle.addEventListener('click', e => this.toggleMenuBar());

    this.end_turn_button = document.querySelector('.end_turn_button');
    this.end_turn_button.addEventListener('click', e => this._endTurn());

    this.profile_webglLevel = document.querySelector('.profile_webglLevel');
    this.profile_webglLevel.addEventListener('input', async e => {
      let updatePacket = {
        webGLLevel: this.profile_webglLevel.value
      };
      if (this.fireToken)
        await firebase.firestore().doc(`Users/${this.uid}`).update(updatePacket);

      alert('reload needed to see changes');
    });

    this.profile_skybox_status = document.querySelector('.profile_skybox_status');
    this.profile_skybox_status.addEventListener('input', async e => {
      let updatePacket = {
        skyboxPath: this.profile_skybox_status.value
      };
      if (this.fireToken)
        await firebase.firestore().doc(`Users/${this.uid}`).update(updatePacket);

      this.profile.skyboxPath = updatePacket.skyboxPath;
      this.initSkybox();
    });

    this.profile_skyboxrotation = document.querySelector('.profile_skyboxrotation');
    this.profile_skyboxrotation.addEventListener('input', async e => {
      let updatePacket = {
        skyboxRotation: this.profile_skyboxrotation.value
      };
      if (this.fireToken)
        await firebase.firestore().doc(`Users/${this.uid}`).update(updatePacket);

      this.profile.skyboxRotation = updatePacket.skyboxRotation;
      this.initSkybox();
    });

    this.profile_asteroid_count = document.querySelector('.profile_asteroid_count');
    this.profile_asteroid_count.addEventListener('input', async e => {
      let updatePacket = {
        asteroidCount: this.profile_asteroid_count.value
      };
      if (this.fireToken)
        await firebase.firestore().doc(`Users/${this.uid}`).update(updatePacket);

      this.profile.asteroidCount = updatePacket.asteroidCount;

      alert('reload needed to see changes');
    });
  }

  initCameraToolbar() {
    this.buttonOneRed = document.querySelector('.choice-button-one');
    this.buttonOneRed.addEventListener('click', e => this.aButtonPress());
    this.buttonTwo = document.querySelector('.choice-button-two');
    this.buttonTwo.addEventListener('click', e => this.bButtonPress());
    this.buttonThree = document.querySelector('.choice-button-three');
    this.buttonThree.addEventListener('click', e => this.xButtonPress());
    this.buttonFour = document.querySelector('.choice-button-four');
    this.buttonFour.addEventListener('click', e => this.yButtonPress());

    this.xr.baseExperience.camera.onBeforeCameraTeleport.add(() => {
      this.clearFollowMeta();
    });
  }

  aimCamera(locationMeta) {
    this.camera.restoreState();
    if (locationMeta) {
      this.camera.setPosition(locationMeta.position);
      this.camera.setTarget(locationMeta.target);
    }

    if (this.xr.baseExperience.state === BABYLON.WebXRState.IN_XR) { //inxr = 2
      this.xr.baseExperience.camera.setTransformationFromNonVRCamera(this.camera);
    }
  }

  clearFollowMeta() {
    this.buttonOneRed.innerHTML = 'A';
    this.buttonTwo.innerHTML = 'B';
    this.followMeta = null;
  }
  setFollowMeta() {
    //  this.aimCamera();
    this.followMeta = this.lastClickMetaButtonCache;
    let v = new BABYLON.Vector3(0, 0, 0);

    if (this.followMeta.basePivot)
      v.copyFrom(this.followMeta.basePivot.getAbsolutePosition());
    else
      v.copyFrom(this.staticAssetMeshes[this.followMeta.id].getAbsolutePosition());
    v.y += 4;
    this.camera.position.copyFrom(v);
    this.camera.alpha += Math.PI;

    if (this.xr.baseExperience.state === 2) {
      this.xr.baseExperience.camera.setTransformationFromNonVRCamera(this.camera);
      //      this.xr.baseExperience.camera.rotation.y = 0.2;
      /*
          const rotation = 3.14;
          BABYLON.Quaternion.FromEulerAngles(0, rotation, 0).multiplyToRef(
              this.xr.baseExperience.camera.rotationQuaternion,
              this.xr.baseExperience.camera.rotationQuaternion
          );
      */
    }
    this.buttonOneRed.innerHTML = 'A';
    this.buttonTwo.innerHTML = 'B Stop follow';
  }

  xButtonPress() {
    this.clearFollowMeta();
    this.aimCamera(this.cameraMetaX);
  }
  yButtonPress() {
    this.clickShowScoreboard()
  }
  aButtonPress() {
    this.setFollowMeta();
  }
  bButtonPress() {
    this.clearFollowMeta();
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
    if (this.profile.webGLLevel === "3") {
      this.hugeAssets = true;
    } else if (this.profile.webGLLevel === "2") {
      this.normalAssets = true;
    } else {
      this.smallAssets = true;
    }

    this.sceneTransformNode = new BABYLON.TransformNode('sceneTransformNode', this.scene);

    this.addLineToLoading('Solar System Objects<br>');
    let promises = [];
    let deck = GameCards.getCardDeck('solarsystem');

    deck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode));
    });
    await Promise.all(promises);

    this.addLineToLoading('Moons<br>');
    promises = [];
    deck = GameCards.getCardDeck('moons1');
    deck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode));
    });

    await Promise.all(promises);
    promises = [];
    deck = GameCards.getCardDeck('moons2');
    deck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode));
    });
    await Promise.all(promises);

    promises = [];
    deck = GameCards.getCardDeck('mascots');
    deck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode));
    });
    await Promise.all(promises);

    this.initItemNamePanel(this.scene);

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

    this.initCameraToolbar();

    this.sceneInited = true;
    this.initScoreboard();
    this.selectMoonMesh();

    this.addMascotsArea();

    this.loadAvatars();
    this.loadAsteroids();

    this.paintGameData();

    this.addRocket();

    this.verifyLoaddingComplete = setInterval(() => {
      if (!this.runRender)
        this.paintGameData();
      else
        clearInterval(this.verifyLoaddingComplete);
    }, 400);
  }
  async loadStaticAsset(name, parent, optionalLoadFlag = 'optionalLoadType') {
    let meta = Object.assign({}, this.allCards[name]);

    if (meta.optionalLoad && meta.optionalLoadFlag !== optionalLoadFlag)
      return;

    meta.extended = this.processStaticAssetMeta(meta);

    let mesh = await this.loadStaticMesh(meta.extended.glbPath, '', meta.extended.scale, 0, 0, 0);

    let normalLink = `<a href="${meta.extended.glbPath}" target="_blank">Normal</a>&nbsp;`;
    let smallLink = '';
    let largeLink = '';
    if (meta.largeglbpath)
      largeLink = `<a href="${meta.extended.largeGlbPath}" target="_blank">Large</a>&nbsp;`;
    if (meta.smallglbpath)
      smallLink = `<a href="${meta.extended.smallGlbPath}" target="_blank">Small</a>&nbsp;`;

    let imgHTML = meta.symbol ? `<img src="${meta.extended.symbolPath}" class="symbol_image">` : '';
    this.addLineToLoading(`
        ${meta.name}:
        &nbsp;
        ${smallLink}
        ${normalLink}
        ${largeLink}
        <br>
        <a href="${meta.url}" target="_blank">wiki</a>
        &nbsp; ${imgHTML}
        <br>
      `);

    let meshPivot = new BABYLON.TransformNode('outerassetwrapper' + name, this.scene);
    mesh.parent = meshPivot;

    if (this.shadowGenerator)
      this.shadowGenerator.addShadowCaster(mesh, true);

    meta.basePivot = meshPivot;

    if (meta.symbol)
      meshPivot = this.infoPanel(name, meta, meshPivot, this.scene);

    if (meta.rotationTime)
      meshPivot = Utility3D.rotationAnimation(name, meta, meshPivot, this.scene);
    if (meta.orbitTime)
      meshPivot = Utility3D.orbitAnimation(name, meta, meshPivot, this.scene);

    meshPivot = Utility3D.positionPivot(name, meta, meshPivot, this.scene);

    meshPivot.assetMeta = meta;
    meshPivot.baseMesh = mesh;
    this.staticAssetMeshes[name] = meshPivot;

    if (meta.parent) {
      if (meta.parentType === 'basePivot')
        meshPivot.parent = this.staticAssetMeshes[meta.parent].assetMeta.basePivot;
      else
        meshPivot.parent = this.staticAssetMeshes[meta.parent];
    } else
      meshPivot.parent = this.sceneTransformNode;

    if (meta.noClick !== true) {
      meta.appClickable = true;
      meta.masterid = name;
      meta.clickCommand = 'pauseSpin';
    }

    if (meta.seatIndex !== undefined)
      this.seatMeshes[meta.seatIndex] = meshPivot;

    if (meta.loadDisabled)
      meshPivot.setEnabled(false);
  }

  async loadAsteroids() {
    let asteroids = Utility3D.getAsteroids();

    let ratio = 0;
    let max = asteroids.length;

    let count = 20;
    if (this.profile.asteroidCount)
      count = Number(this.profile.asteroidCount);

    this.addLineToLoading(`Asteroids - ${count} from ${max} available`);

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

    let mats = Utility3D.asteroidMaterial(this.scene);
    this.asteroidMaterial = mats.material;
    this.selectedAsteroidMaterial = mats.selectedMaterial;

    this.asteroidSymbolMeshName = Utility3D.generateNameMesh(this.scene);
    this.asteroidSymbolMesh1 = Utility3D.generateSymbolMesh(this.scene, 'asteroidsymbolwrapper', 'asteroid');
    this.asteroidSymbolMesh2 = Utility3D.generateSymbolMesh(this.scene, 'asteroidsymbolwrapper2', 'asteroid2');

    this.asteroidSymbolMesh1.setEnabled(false);
    this.asteroidSymbolMesh2.setEnabled(false);

    this.loadedAsteroids = {};
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
    let mesh = await this.loadStaticMesh(path, '', 1, 0, 0, 0);

    mesh.material = this.asteroidMaterial;

    let orbitWrapper = new BABYLON.TransformNode('assetorbitwrapper' + asteroid, this.scene);
    let positionTN = new BABYLON.TransformNode('asteroidpositionwrapper' + asteroid, this.scene);

    positionTN.position.x = 20;
    positionTN.position.y = mainY;
    orbitWrapper.position.x = 7;
    orbitWrapper.position.z = 9;

    mesh.parent = positionTN;
    positionTN.parent = orbitWrapper;

    let orbitAnim = new BABYLON.Animation(
      "asteroidorbit" + asteroid,
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let orbitEndFrame = this.asteroidOrbitTime / 1000 * 30;
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
    let orbitAnimation = this.scene.beginAnimation(orbitWrapper, 0, orbitEndFrame, true);

    if (startRatio !== 0.0)
      orbitAnimation.goToFrame(Math.floor(orbitEndFrame * startRatio));

    let anim = new BABYLON.Animation(
      "asteroidspiny" + asteroid,
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let x = positionTN.rotation.x;
    let y = positionTN.rotation.y;
    let z = positionTN.rotation.z;
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
    if (!positionTN.animations)
      positionTN.animations = [];
    positionTN.animations.push(anim);

    let animR = this.scene.beginAnimation(positionTN, 0, spinEndFrame, true);

    let asteroidSymbolWrapper = this.loadSymbolForAsteroid(positionTN, asteroid, index);

    orbitWrapper.assetMeta = {
      appClickable: true,
      clickCommand: 'pauseSpin',
      name: asteroid,
      asteroidType: true,
      asteroidName: asteroid,
      asteroidMesh: positionTN,
      asteroidSymbolWrapper,
      orbitAnimation,
      basePivot: mesh
    };
    positionTN.origsx = positionTN.scaling.x;
    positionTN.origsy = positionTN.scaling.y;
    positionTN.origsz = positionTN.scaling.z;

    this.loadedAsteroids[asteroid] = {
      orbitWrapper,
      mesh
    };
  }
  loadSymbolForAsteroid(parent, name, index) {
    let asteroidSymbol;
    if (index % 2 === 0) {
      asteroidSymbol = this.asteroidSymbolMesh1.clone("asteroidsymbol" + name);
      asteroidSymbol.parent = parent;
    } else {
      asteroidSymbol = this.asteroidSymbolMesh2.clone("asteroidsymbol" + name);
      asteroidSymbol.parent = parent;
    }

    asteroidSymbol.setEnabled(true);

    return asteroidSymbol;
  }

  _loadMeshMusic(meta, mesh, name) {
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
  }
  infoPanel(name, meta, pivotMesh, scene) {
    let size = 1;

    let symbolPivot = new BABYLON.TransformNode('symbolpopupwrapper' + name, scene);
    let symbolMat = new BABYLON.StandardMaterial('symbolshowmatalpha' + name, scene);
    symbolPivot.parent = pivotMesh.parent;
    pivotMesh.parent = symbolPivot;

    let textPivot = new BABYLON.TransformNode('textsymbolpopupwrapper' + name, scene);
    textPivot.parent = symbolPivot;
    meta.textPivot = textPivot;

    if (meta.parent === 'uranus') {
      textPivot.rotation.x -= 1.57;
    }

    let symbolMesh1 = BABYLON.MeshBuilder.CreatePlane('symbolshow1' + name, {
      height: size,
      width: size,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);

    let m = new BABYLON.StandardMaterial('symbolshowmat' + name, scene);
    let t = new BABYLON.Texture(meta.extended.symbolPath, scene);
    t.vScale = 1;
    t.uScale = 1;
    t.hasAlpha = true;

    m.diffuseTexture = t;
    m.emissiveTexture = t;
    m.ambientTexture = t;
    let extraY = 0;
    if (meta.symbolY)
      extraY = meta.symbolY;

    meta.yOffset = 0.5 + extraY;
    symbolMesh1.material = m;
    symbolMesh1.parent = textPivot;
    symbolMesh1.rotation.y = 0;
    symbolMesh1.position.y = meta.yOffset;

    return symbolPivot;
  }
  showItemNamePanel(meta) {
    let nameDesc = meta.name;
    if (meta.solarPosition)
      nameDesc += ` (${meta.solarPosition})`

    let nameTexture = Utility3D.__texture2DText(this.scene, nameDesc, meta.color);
    nameTexture.vScale = 1;
    nameTexture.uScale = 1;
    nameTexture.hasAlpha = true;
    this.boardWrapper.nameMat.diffuseTexture = nameTexture;
    this.boardWrapper.nameMat.emissiveTexture = nameTexture;
    this.boardWrapper.nameMat.ambientTexture = nameTexture;
  }

  initItemNamePanel(scene) {
    let size = 1;
    let name = 'one';
    this.boardWrapper = new BABYLON.TransformNode('boardpopupwrapper' + name, scene);
    this.boardWrapper.position.y = -1000;

    let nameMesh1 = BABYLON.MeshBuilder.CreatePlane('nameshow1' + name, {
      height: size * 5,
      width: size * 5,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);

    let factor = -1.8;
    nameMesh1.position.y = factor;

    let nameMat = new BABYLON.StandardMaterial('nameshowmat' + name, this.scene);
    nameMesh1.material = nameMat;
    nameMesh1.parent = this.boardWrapper;

    this.boardWrapper.nameMat = nameMat;
    this.boardWrapper.nameMesh1 = nameMesh1;
  }

  showBoardWrapper(meta) {
    if (!meta.textPivot)
      return;
    this.showItemNamePanel(meta)
    this.boardWrapper.position.y = meta.yOffset;
    this.boardWrapper.parent = meta.textPivot.parent;
    meta.textPivot.position.y = -1000;
  }
  hideBoardWrapper(meta) {
    if (!meta.textPivot)
      return;
    this.boardWrapper.position.y = -1000;
    this.boardWrapper.parent = null;
    meta.textPivot.position.y = 0;
  }
  viewSettings() {
    this.modal.show();
  }
  getSeatData(seatIndex) {
    let key = 'seat' + seatIndex.toString();
    let name = '';
    let avatar = '';
    let uid = '';
    let image = '';
    let seated = false;
    if (this.gameData[key]) {
      name = this.gameData.memberNames[this.gameData[key]];
      if (!name) name = "Anonymous";
      avatar = this.gameData.memberAvatars[this.gameData[key]];
      if (!avatar) avatar = "male1";
      image = this.gameData.memberImages[this.gameData[key]];
      if (!image) image = "";

      uid = this.gameData[key];
      seated = true;
    }

    return {
      seated,
      name,
      key,
      avatar,
      image,
      uid: this.gameData[key]
    };
  }
  async loadAvatars() {
    if (!this.playerDock3DPanel)
      return;

    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      if (seatIndex < this.runningSeatCount) {
        let data = this.getSeatData(seatIndex);
        let cacheValue = data.name + data.image + data.seated.toString();
        if (!this['dockSeatMesh' + seatIndex]) {
          let mesh = await this.renderSeat(seatIndex);

          mesh.parent = this.playerDock3DPanel;

          this['dockSeatMesh' + seatIndex] = mesh;
        } else if (this['dockSeatCache' + seatIndex] !== cacheValue) {
          if (this.sceneInited) {
            await this._updateSeat(seatIndex);
            this['dockSeatCache' + seatIndex] = cacheValue;
          }
        }
      } else {
        if (this['dockSeatMesh' + seatIndex]) {
          this['dockSeatMesh' + seatIndex].dispose();
          this['dockSeatMesh' + seatIndex] = null;
          this['dockSeatCache' + seatIndex] = '';
        }
      }
    }

    if (this.sceneInited) {
      this.updateUserPresence();
      this.__updateSelectedSeatMesh();

      this.avatarsLoaded = true;
    }
  }

  pointerUp(pointerInfo) {

    if (this.lastClickMeta) {
      this.meshToggleAnimation(this.lastClickMeta, true, null);
      this.lastClickMeta = null;
      return;
    }
    /*
    let mesh = pointerInfo.pickInfo.pickedMesh;
    while (mesh && !(mesh.assetMeta && mesh.assetMeta.appClickable)) {
    mesh = mesh.parent;
  }

    if (!mesh || !mesh.assetMeta)
      return;

    let meta = mesh.assetMeta;

    if (meta.clickCommand === 'pauseSpin')
      this.meshToggleAnimation(meta, true, mesh);
      */
  }
  pointerDown(pointerInfo) {
    let mesh = pointerInfo.pickInfo.pickedMesh;
    while (mesh && !(mesh.assetMeta && mesh.assetMeta.appClickable)) {
      mesh = mesh.parent;
    }

    if (!mesh || !mesh.assetMeta.appClickable)
      return false;

    let meta = mesh.assetMeta;

    if (meta.emptySeat) {
      this.dockSit(meta.seatIndex);
    }

    if (meta.clickCommand === 'stand') {
      this._gameAPIStand(meta.seatIndex);
    }

    if (meta.clickCommand === 'pauseSpin') {
      this.lastClickMeta = meta;
      this.lastClickMetaButtonCache = this.lastClickMeta;
      this.meshToggleAnimation(meta, false, mesh);

      this._updateLastClickMeta(this.lastClickMetaButtonCache);
    }

    if (meta.clickCommand === 'endTurn')
      this.clickEndTurn();
    if (meta.clickCommand === 'startGame')
      this.clickStartGame();
    if (meta.clickCommand === 'endGame')
      this.clickEndGame();
    if (meta.clickCommand === 'customClick')
      meta.handleClick(pointerInfo, mesh, meta);
    if (meta.clickCommand === 'selectMainMesh')
      this.selectMoonMesh(meta.seatIndex);

    return true;
  }
  async _updateLastClickMeta(assetMeta) {
    this.lastClickMeta = assetMeta;
    this.lastClickMetaButtonCache = this.lastClickMeta;

    let desc = assetMeta.name.replace('.obj', '');
    this.buttonOneRed.innerHTML = 'A Follow ' + desc;
    this.buttonTwo.innerHTML = 'B';

    if (this.selectedMeshInstance) {
      this.selectedMeshInstance.wrapper.dispose();
    }

    this.selectedMeshInstance = await this.__loadRotatingAsset(assetMeta);
    this.selectedMeshInstance.wrapper.position.y = 2.5;
    this.selectedMeshInstance.wrapper.parent = this.assetFocusPanelTN;
    this._fitNodeToSize(this.selectedMeshInstance.mesh, 2.5);

    Utility3D.setTextMaterial(this.scene, this.selectedAssetNameMat, desc);

    this._updateAssetSizeButtons();
  }
  _updateAssetSizeButtons() {
    if (this.lastClickMeta.asteroidType) {
      this.assetPanelNormalButton.setEnabled(false);
      this.assetSmallSizeButton.setEnabled(false);
      this.assetPanelHugeButton.setEnabled(false);

      return;
    }

    let smallSize = this.lastClickMeta.smallglbpath ? true : false;
    let hugeSize = this.lastClickMeta.largeglbpath ? true : false;

    let isSmallSize = this.lastClickMeta.extended.smallGlbPath === this.lastClickMeta.extended.glbPath;
    let isHugeSize = this.lastClickMeta.extended.largeGlbPath === this.lastClickMeta.extended.glbPath;
    let isNormalSize = this.lastClickMeta.extended.normalGlbPath === this.lastClickMeta.extended.glbPath;

    this.assetPanelNormalButton.setEnabled(!isNormalSize);
    this.assetSmallSizeButton.setEnabled(smallSize && !isSmallSize);
    this.assetPanelHugeButton.setEnabled(hugeSize && !isHugeSize);
  }

  _fitNodeToSize(node, size) {
    const boundingInfo = node.getHierarchyBoundingVectors(true);
    const currentLength = boundingInfo.max.subtract(boundingInfo.min);
    const biggestSide = Math.max(currentLength.x, Math.max(currentLength.y, currentLength.z));
    let scale = size / biggestSide;
    node.scaling.scaleInPlace(scale);
  }

  clickEndTurn() {
    this._endTurn();
  }
  clickStartGame() {

  }
  clickEndGame() {

  }
  clickShowScoreboard() {
    if (this.lastShowScoreboardTime === undefined)
      this.lastShowScoreboardTime = 0;
    if (this.scoreboardShowing === undefined)
      this.scoreboardShowing = true;

    let testTime = this.lastShowScoreboardTime + 2000;
    let hideScoreboard = (new Date().getTime() < testTime) && this.scoreboardShowing;
    this.lastShowScoreboardTime = new Date().getTime();

    if (this.scoreboardShowing && hideScoreboard) {
      this.scoreboardShowing = false;
      this.scoreboardWrapper.origY = this.scoreboardWrapper.position.y;
      this.scoreboardWrapper.position.y = -100000;
      this.scoreboardWrapper.scaling.x = 0.001;
      this.scoreboardWrapper.scaling.y = 0.001;
      this.scoreboardWrapper.scaling.z = 0.001;

      return;
    }
    if (!this.scoreboardShowing) {
      this.scoreboardShowing = true;
    }

    this._updateLastClickMeta(this.lastClickMetaButtonCache);

    this.scoreboardWrapper.position.y = this.scoreboardWrapper.origY;
    this.scoreboardWrapper.scaling.x = 1;
    this.scoreboardWrapper.scaling.y = 1;
    this.scoreboardWrapper.scaling.z = 1;

    if (this.xr.baseExperience.state === BABYLON.WebXRState.IN_XR) {
      if (!this.scene.activeCamera.positionTN) {
        this.scene.activeCamera.positionTN = new BABYLON.TransformNode('camerapointerxr', this.scene);
        this.scene.activeCamera.positionTN.parent = this.scene.activeCamera;
        this.scene.activeCamera.positionTN.position.z += 5;
      }

      this.scoreboardWrapper.position.copyFrom(this.scene.activeCamera.positionTN.getAbsolutePosition());
      this.scoreboardWrapper.position.y = 0;

      let targetPosition = new BABYLON.Vector3();
      targetPosition.copyFrom(this.scene.activeCamera.position);
      targetPosition.y = 0;
      this.scoreboardWrapper.lookAt(targetPosition);
    } else {
      if (!this.scene.activeCamera.positionTN) {
        this.scene.activeCamera.positionTN = new BABYLON.TransformNode('camerapointernonxr', this.scene);
        this.scene.activeCamera.positionTN.parent = this.scene.activeCamera;
        this.scene.activeCamera.positionTN.position.z += 10;
      }

      this.scoreboardWrapper.position.copyFrom(this.scene.activeCamera.positionTN.getAbsolutePosition());
      this.scoreboardWrapper.position.y = 0;

      let targetPosition = new BABYLON.Vector3();
      targetPosition.copyFrom(this.scene.activeCamera.position);
      targetPosition.y = 0;
      this.scoreboardWrapper.lookAt(targetPosition);
    }
  }
  selectMoonMesh(seatIndex) {
    if (seatIndex === 1)
      this._updateLastClickMeta(this.staticAssetMeshes['ceres'].assetMeta);
    else if (seatIndex === 2)
      this._updateLastClickMeta(this.staticAssetMeshes['j5_io'].assetMeta);
    else if (seatIndex === 3)
      this._updateLastClickMeta(this.staticAssetMeshes['eris'].assetMeta);
    else
      this._updateLastClickMeta(this.staticAssetMeshes['e1_luna'].assetMeta);
  }
  meshToggleAnimation(meta, stop = false, mesh) {
    if (!stop) {
      this.showBoardWrapper(meta);

      if (meta.asteroidType)
        this.asteroidPtrDown(meta);

      //if (this.currentSeatMesh !== mesh) {
      if (meta.masterid && this.musicMeshes[meta.masterid])
        this.musicMeshes[meta.masterid].play();
      //}

      if (meta.rotationAnimation)
        meta.rotationAnimation.pause();

      if (meta.orbitAnimation)
        meta.orbitAnimation.pause();
    } else {
      this.hideBoardWrapper(meta);

      if (meta.asteroidType)
        this.asteroidPtrDown(meta, true);

      //  if (this.currentSeatMesh !== mesh) {
      if (meta.masterid && this.musicMeshes[meta.masterid])
        this.musicMeshes[meta.masterid].stop();
      //  }

      if (meta.rotationAnimation && meta.rotationAnimation._paused)
        meta.rotationAnimation.restart();

      if (meta.orbitAnimation && meta.orbitAnimation._paused)
        meta.orbitAnimation.restart();
    }
  }

  asteroidPtrDown(meta, up = false) {
    if (!up) {
      meta.asteroidMesh.material = this.selectedAsteroidMaterial;
      meta.asteroidMesh.scaling.x = meta.asteroidMesh.origsx * 1.25;
      meta.asteroidMesh.scaling.y = meta.asteroidMesh.origsy * 1.25;
      meta.asteroidMesh.scaling.z = meta.asteroidMesh.origsz * 1.25;

      meta.asteroidSymbolWrapper.setEnabled(false);
      this.asteroidSymbolMeshName.setEnabled(true);
      this.asteroidSymbolMeshName.parent = meta.asteroidMesh;

      let text = meta.asteroidName.replace('.obj', '');
      Utility3D.setTextMaterial(this.scene, this.asteroidSymbolMeshName.nameMaterial, text);

      setTimeout(() => {
        meta.asteroidMesh.material = this.asteroidMaterial;
      }, 3000);
    } else {
      meta.asteroidMesh.material = this.asteroidMaterial;
      meta.asteroidMesh.scaling.x = meta.asteroidMesh.origsx;
      meta.asteroidMesh.scaling.y = meta.asteroidMesh.origsy;
      meta.asteroidMesh.scaling.z = meta.asteroidMesh.origsz;

      meta.asteroidSymbolWrapper.setEnabled(true);
      this.asteroidSymbolMeshName.setEnabled(false);
    }
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

    if (this.profile.webGLLevel)
      this.profile_webglLevel.value = this.profile.webGLLevel;

    if (this.profile.skyboxPath)
      this.profile_skybox_status.value = this.profile.skyboxPath;

    if (this.profile.skyboxRotation)
      this.profile_skyboxrotation.value = this.profile.skyboxRotation;

    if (this.profile.asteroidCount)
      this.profile_asteroid_count.value = this.profile.asteroidCount;

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
  paintDock() {
    super.paintDock();

    this.loadAvatars();
  }
  async paintGameData(gameDoc = null) {
    if (gameDoc)
      this.gameData = gameDoc.data();

    if (!this.gameData)
      return;

    await this.initGraphics();

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
    this.currentSeatIndex = seatIndex;

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

    this.runRender = true;
    document.body.classList.add('avatars_loaded');
    this.__updateSelectedSeatMesh();

    this.updateScoreboard();
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
    if (seatMesh.assetMeta.masterid && this.musicMeshes[seatMesh.assetMeta.masterid] && !this.musicMeshes[seatMesh.assetMeta.masterid].isPlaying)
      this.musicMeshes[seatMesh.assetMeta.masterid].play();

    this.selectedPlayerPanel.parent = seatWrapperMesh;
    this.selectedMoonPanel.parent = this.seatMeshes[seatIndex].assetMeta.basePivot;
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

    let name3d = Utility3D.__createTextMesh('seattext' + index, {
      text: name,
      fontFamily: 'Arial',
      size: 100,
      depth: .25
    }, this.scene);
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
    let colors = this.get3DColors(index);
    let uid = seatData.uid;

    let mesh = new BABYLON.TransformNode("seatmeshtn" + index, this.scene);
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;
    mesh.parent = avatarWrapper;
    wrapper.avatarMesh = mesh;
    seatData.avatarMesh = mesh;

    const plane = BABYLON.MeshBuilder.CreatePlane("avatarimage" + index, {
        height: 2,
        width: 1,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
      },
      this.scene);
    plane.parent = mesh;
    plane.position.y = 1;

    let m = new BABYLON.StandardMaterial('avatarshowmat' + name, this.scene);
    let t = new BABYLON.Texture(seatData.image, this.scene);
    t.vScale = 1;
    t.uScale = 1;
    t.hasAlpha = true;

    m.diffuseTexture = t;
    m.emissiveTexture = t;
    m.ambientTexture = t;

    plane.material = m;

    let isOwner = this.uid === this.gameData.createUser;
    if (this.uid === uid || isOwner) {
      let text = 'X';
      let intensity = 5;
      if (this.uid !== uid && isOwner) {
        intensity = 0;
        text = 'X';
      }
      let x3d = Utility3D.__createTextMesh('seattextX' + index, {
        text,
        fontFamily: 'monospace',
        size: 100,
        depth: .25
      }, this.scene);
      x3d.scaling.x = 0.5;
      x3d.scaling.y = 0.5;
      x3d.scaling.z = 0.5;

      x3d.rotation.z = -Math.PI / 2;
      x3d.rotation.y = -Math.PI / 2;

      x3d.position.y = 1.9;
      x3d.position.x = 0.4;

      for (let i in this.scene.meshes) {
        if (this.scene.meshes[i].parent === x3d)
          this.meshSetVerticeColors(this.scene.meshes[i], intensity, intensity, intensity);
      }

      this.meshSetVerticeColors(x3d, intensity, intensity, intensity);
      x3d.parent = mesh;
      x3d.assetMeta = {
        appClickable: true,
        clickCommand: 'stand',
        seatIndex: index
      }
    }
  }

  async _updateSeat(index) {
    let seatData = this.getSeatData(index);
    let colors = this.get3DColors(index);

    let seat = this['dockSeatMesh' + index];
    let meta = seat.assetMeta;
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
      if (this.hugeAssets)
        this.renderSeatText(seat, index);
      await this.renderSeatAvatar(seat, seat.avatarWrapper, index);
    } else {
      let baseDisc = Utility3D.__createTextMesh("emptyseat" + index.toString(), {
        text: 'Sit',
        fontFamily: 'Arial',
        size: 100,
        depth: .25
      }, this.scene);

      //  baseDisc.rotation.x = Math.PI / 2;
      baseDisc.rotation.z = -Math.PI / 2;
      baseDisc.rotation.y = -Math.PI / 2;
      baseDisc.position.y = 1;
      baseDisc.assetMeta = {
        emptySeat: true,
        seatIndex: index,
        appClickable: true
      };

      let colors = this.get3DColors(index);
      this.meshSetVerticeColors(baseDisc, colors.r, colors.g, colors.b);
      baseDisc.parent = seat;

      seat.baseDisc = baseDisc;
    }
  }
  async renderSeat(index) {
    let wrapper = new BABYLON.TransformNode('seatwrapper' + index, this.scene);

    let avatarWrapper = new BABYLON.TransformNode('seatavatarwrapper' + index, this.scene);
    avatarWrapper.rotation.y = Math.PI;
    avatarWrapper.parent = wrapper;
    wrapper.avatarWrapper = avatarWrapper;


    wrapper.position.x = 2 - (index * 1.5);

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
            diameter: .25,
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
  createGuides(size = 30) {
    return new BABYLON.AxesViewer(this.scene, size);
  }

  updateScoreboard() {
    let seatIndex = this.gameData.currentSeat;

    let rgb = this.get3DColors(seatIndex);
    let str = rgb.r + ',' + rgb.g + "," + rgb.b;
    let backColor = Utility3D.colorRGB255(str);
    let color = seatIndex !== 3 ? "rgb(0,0,0)" : "rgb(255,255,255)";
    let nameTexture = Utility3D.__texture2DText(this.scene, "Scoreboard Status", color, backColor, 50);
    nameTexture.vScale = 1;
    nameTexture.uScale = 1;
    nameTexture.hasAlpha = true;
    this.scoreboardNameMaterial.diffuseTexture = nameTexture;
    this.scoreboardNameMaterial.ambientTexture = nameTexture;
    this.scoreboardNameMaterial.emissiveTexture = nameTexture;
  }
  initScoreboard() {
    if (this.scoreboardInited)
      return;

    this.scoreboardInited = true;

    let scoreboardWrapper = new BABYLON.TransformNode('scoreboardWrapper', this.scene);
    this.scoreboardWrapper = scoreboardWrapper;

    let scoreboardTransform = new BABYLON.TransformNode('scoreboardTransform', this.scene);
    scoreboardTransform.parent = this.scoreboardWrapper;
    scoreboardTransform.position.z = 2;
    scoreboardTransform.position.y = -0.5;

    this.__initScorePanel(scoreboardTransform);
    this.__initFocusedAssetPanel(scoreboardTransform);
    this.__initDock3DPanel(scoreboardTransform);

    return scoreboardWrapper;
  }
  __initScorePanel(scoreboardTransform) {
    this.playerMidPanelTransform = new BABYLON.TransformNode('playerMidPanelTransform', this.scene);
    this.playerMidPanelTransform.parent = scoreboardTransform;
    this.playerMidPanelTransform.position.x = 5;
    this.playerMidPanelTransform.position.z += 2;
    this.playerMidPanelTransform.rotation.y = -Math.PI / 4;

    let nameMesh1 = BABYLON.MeshBuilder.CreatePlane('scoreboardpanelX', {
      height: 2,
      width: 4
    }, this.scene);
    nameMesh1.position.y = 2.5;

    let nameMesh2 = BABYLON.MeshBuilder.CreatePlane('scoreboardpanelZ', {
      height: 2,
      width: 4
    }, this.scene);
    nameMesh2.position.y = 2.5;
    nameMesh2.rotation.y = Math.PI;

    this.scoreboardNameMaterial = new BABYLON.StandardMaterial('scoreboardmaterial', this.scene);
    nameMesh1.material = this.scoreboardNameMaterial;
    nameMesh1.parent = this.playerMidPanelTransform;
    nameMesh2.material = this.scoreboardNameMaterial;
    nameMesh2.parent = this.playerMidPanelTransform;

    this.startGameButton = Utility3D.__createTextMesh('startgamebutton', {
      text: 'Start Game',
      fontFamily: 'Arial',
      size: 100,
      depth: .25
    }, this.scene);
    this.startGameButton.scaling.x = .5;
    this.startGameButton.scaling.y = .5;
    this.startGameButton.scaling.z = .5;
    this.startGameButton.position.y = 2;
    this.startGameButton.position.x = -5;
    this.startGameButton.position.z = 0;
    this.startGameButton.rotation.z = -Math.PI / 2;
    this.startGameButton.rotation.y = -Math.PI / 2;
    this.startGameButton.setEnabled(false);
    this.startGameButton.parent = this.playerMidPanelTransform;
    this.__setTextMeshColor(this.startGameButton, 0, 1, 0);

    this.endGameButton = Utility3D.__createTextMesh('endgamebutton', {
      text: 'End Game',
      fontFamily: 'Arial',
      size: 100,
      depth: .25
    }, this.scene);
    this.endGameButton.scaling.x = .5;
    this.endGameButton.scaling.y = .5;
    this.endGameButton.scaling.z = .5;
    this.endGameButton.position.y = 4;
    this.endGameButton.position.x = 0;
    this.endGameButton.position.z = 0;
    this.endGameButton.rotation.z = -Math.PI / 2;
    this.endGameButton.rotation.y = -Math.PI / 2;
    this.endGameButton.parent = this.playerMidPanelTransform;
    this.__setTextMeshColor(this.endGameButton, 0, 1, 0);

    this.endTurnButton = Utility3D.__createTextMesh('endturnbutton', {
      text: 'End Turn',
      fontFamily: 'Arial',
      size: 100,
      depth: .25
    }, this.scene);
    this.endTurnButton.scaling.x = .5;
    this.endTurnButton.scaling.y = .5;
    this.endTurnButton.scaling.z = .5;
    this.endTurnButton.position.y = 1;
    this.endTurnButton.position.x = 0;
    this.endTurnButton.position.z = 0;
    this.endTurnButton.rotation.z = -Math.PI / 2;
    this.endTurnButton.rotation.y = -Math.PI / 2;
    this.endTurnButton.parent = this.playerMidPanelTransform;
    this.endTurnButton.assetMeta = {
      appClickable: true,
      clickCommand: 'endTurn'
    };
    this.__setTextMeshColor(this.endTurnButton, 0, 1, 0);

  }
  async __initFocusedAssetPanel(scoreboardTransform) {
    this.assetFocusPanelTN = new BABYLON.TransformNode('assetFocusPanelTN', this.scene);
    this.assetFocusPanelTN.parent = scoreboardTransform;

    this.activeMoonNav = Utility3D.__createTextMesh('activemoonnavigate', {
      text: 'A Follow',
      fontFamily: 'Impact',
      size: 100,
      depth: .25
    }, this.scene);
    this.activeMoonNav.scaling.x = .5;
    this.activeMoonNav.scaling.y = .5;
    this.activeMoonNav.scaling.z = .5;
    this.activeMoonNav.position.y = 1.25;
    this.activeMoonNav.position.z = 0;
    this.activeMoonNav.position.x = 0;
    this.activeMoonNav.rotation.z = -Math.PI / 2;
    this.activeMoonNav.rotation.y = -Math.PI / 2;
    this.activeMoonNav.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handleClick: async (pointerInfo, mesh, meta) => {
        this.setFollowMeta();
      }
    };
    this.activeMoonNav.parent = this.assetFocusPanelTN;
    this.__setTextMeshColor(this.activeMoonNav, 0, 0, 1);

    let buttonPanel = this._initSizePanel();
    buttonPanel.position.y = 4;
    buttonPanel.rotation.y = Math.PI;
    buttonPanel.parent = this.assetFocusPanelTN;

    let size = 1;
    this.selectedAssetNameMesh = BABYLON.MeshBuilder.CreatePlane('selectedAssetNameMesh', {
      height: 1.5,
      width: size * 5,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    this.selectedAssetNameMesh.position.y = 3;
    this.selectedAssetNameMesh.rotation.y = Math.PI;
    this.selectedAssetNameMesh.parent = this.assetFocusPanelTN;

    this.selectedAssetNameMat = new BABYLON.StandardMaterial('selectedAssetNameMat', this.scene);
    this.selectedAssetNameMesh.material = this.selectedAssetNameMat;

    this.nextselectedassetmesh = Utility3D.__createTextMesh('nextselectedassetmesh', {
      text: '>',
      fontFamily: 'Arial',
      size: 100,
      depth: .5
    }, this.scene);
    this.nextselectedassetmesh.scaling.x = .5;
    this.nextselectedassetmesh.scaling.y = .5;
    this.nextselectedassetmesh.scaling.z = .5;
    this.nextselectedassetmesh.position.y = 2.5;
    this.nextselectedassetmesh.position.x = -2;
    this.nextselectedassetmesh.rotation.z = -Math.PI / 2;
    this.nextselectedassetmesh.rotation.y = -Math.PI / 2;
    this.nextselectedassetmesh.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handleClick: async (pointerInfo, mesh, meta) => {
        this.nextSelectedObject();
      }
    };
    this.nextselectedassetmesh.parent = this.assetFocusPanelTN;
    this.__setTextMeshColor(this.nextselectedassetmesh, 0, 0, 1);

    this.previousselectedassetmesh = Utility3D.__createTextMesh('previousselectedassetmesh', {
      text: '<',
      fontFamily: 'Arial',
      size: 100,
      depth: .5
    }, this.scene);
    this.previousselectedassetmesh.scaling.x = .5;
    this.previousselectedassetmesh.scaling.y = .5;
    this.previousselectedassetmesh.scaling.z = .5;
    this.previousselectedassetmesh.position.y = 2.5;
    this.previousselectedassetmesh.position.x = 2;
    this.previousselectedassetmesh.rotation.z = -Math.PI / 2;
    this.previousselectedassetmesh.rotation.y = -Math.PI / 2;
    this.previousselectedassetmesh.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handleClick: async (pointerInfo, mesh, meta) => {
        this.nextSelectedObject(true);
      }
    };
    this.previousselectedassetmesh.parent = this.assetFocusPanelTN;
    this.__setTextMeshColor(this.nextselectedassetmesh, 0, 0, 1);
  }
  nextSelectedObject(previous = false) {
    let meta = this.lastClickMetaButtonCache;
    let id = meta.id;
    let factor = previous ? -1 : 1;
    if (meta.asteroidType) {
      let keys = Object.keys(this.loadedAsteroids).sort();

      let index = keys.indexOf(meta.name);
      let nextIndex = index + factor;
      if (nextIndex < 0)
        nextIndex = keys.length - 1;
      if (nextIndex > keys.length - 1)
        nextIndex = 0;

      let key = keys[nextIndex];
      this._updateLastClickMeta(this.loadedAsteroids[key].orbitWrapper.assetMeta);
    } else {
      let keys = Object.keys(this.staticAssetMeshes).sort((a, b) => {
        if (this.staticAssetMeshes[a].assetMeta.name > this.staticAssetMeshes[b].assetMeta.name)
          return 1;
        if (this.staticAssetMeshes[a].assetMeta.name < this.staticAssetMeshes[b].assetMeta.name)
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
      this._updateLastClickMeta(this.staticAssetMeshes[key].assetMeta);
    }
  }
  async __loadRotatingAsset(assetMeta, prefix = 'selected') {
    let mesh;
    if (assetMeta.asteroidType) {
      mesh = this.loadedAsteroids[assetMeta.asteroidName].mesh.clone(prefix + this.loadedAsteroids[assetMeta.asteroidName].mesh.id);
    } else {
      mesh = this.staticAssetMeshes[assetMeta.id].baseMesh.clone(prefix + this.staticAssetMeshes[assetMeta.id].baseMesh.id);

      //       await this.loadStaticMesh(assetMeta.extended.glbPath, '', assetMeta.extended.scale, 0, 0, 0);
    }

    let rotationTransform = new BABYLON.TransformNode(prefix + 'playerPanelMoonRotation', this.scene);
    mesh.parent = rotationTransform;

    let rotationAnim = new BABYLON.Animation(
      rotationTransform.id + 'anim',
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let x = 0;
    let y = 0;
    let z = 0;
    let keys = [];
    let endFrame = 20 * 30;

    let rotationDirection = -2;

    keys.push({
      frame: 0,
      value: new BABYLON.Vector3(x, y, z)
    });

    keys.push({
      frame: endFrame,
      value: new BABYLON.Vector3(x, y + rotationDirection * Math.PI, z)
    });

    rotationAnim.setKeys(keys);
    if (!mesh.animations)
      mesh.animations = [];
    mesh.animations.push(rotationAnim);
    this.scene.beginAnimation(mesh, 0, endFrame, true);

    return {
      wrapper: rotationTransform,
      mesh
    }
  }
  __setTextMeshColor(mesh, r, g, b) {
    for (let i in this.scene.meshes) {
      if (this.scene.meshes[i].parent === mesh)
        this.meshSetVerticeColors(this.scene.meshes[i], r, g, b);
    }

    this.meshSetVerticeColors(mesh, r, g, b);
  }

  async loadMoonButton(index) {
    if (this.playerMoonNavs[index.toString()])
      this.playerMoonNavs[index.toString()].dispose();

    let moonNav = this.staticAssetMeshes[this.seatMeshes[index].assetMeta.id].baseMesh.clone('moonnavmesh' + index);
    moonNav.position.y = 2.75;
    moonNav.position.x = 2 - (index * 1.5);
    moonNav.position.z = 0;
    moonNav.rotation.z = -Math.PI / 2;
    moonNav.rotation.y = -Math.PI / 2;

    moonNav.assetMeta = {
      appClickable: true,
      clickCommand: 'selectMainMesh',
      seatIndex: index
    };

    let rotationTransform = new BABYLON.TransformNode('playerPanelMoonRotation' + index, this.scene);
    rotationTransform.parent = this.playerDock3DPanel;
    moonNav.parent = rotationTransform;
    this._fitNodeToSize(moonNav, 1.25);

    let rotationAnim = new BABYLON.Animation(
      rotationTransform.id + 'anim',
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let x = 0;
    let y = 0;
    let z = 0;
    let keys = [];
    let endFrame = 20 * 30;

    let rotationDirection = index % 2 === 0 ? 2 : -2;

    keys.push({
      frame: 0,
      value: new BABYLON.Vector3(x, y, z)
    });

    keys.push({
      frame: endFrame,
      value: new BABYLON.Vector3(x, y + rotationDirection * Math.PI, z)
    });

    rotationAnim.setKeys(keys);
    if (!moonNav.animations)
      moonNav.animations = [];
    moonNav.animations.push(rotationAnim);
    this.scene.beginAnimation(moonNav, 0, endFrame, true);

    this.playerMoonNavs[index.toString()] = moonNav;
  }

  __initDock3DPanel(scoreboardTransform) {
    this.playerDock3DPanel = new BABYLON.TransformNode('playerDock3DPanel', this.scene);
    this.playerDock3DPanel.parent = scoreboardTransform;
    this.playerDock3DPanel.position.x = -5;
    this.playerDock3DPanel.position.z += 2;
    this.playerDock3DPanel.rotation.y = Math.PI / 4;

    this.playerMoonNavs = {};
    for (let d = 0; d < 4; d++) {
      this.loadMoonButton(d);
    }

    this.playerAvatarNavs = [];
    for (let c = 0; c < 4; c++) {

      let avatarNav = Utility3D.__createTextMesh('myavatarnavigate' + c.toString(), {
        text: this.seatMeshes[c].assetMeta.name,
        fontFamily: 'Tahoma',
        fontWeight: 'bold',
        size: 100,
        depth: .25
      }, this.scene)
      avatarNav.scaling.x = .5;
      avatarNav.scaling.y = .5;
      avatarNav.scaling.z = .5;
      avatarNav.position.y = 4;
      avatarNav.position.x = 2 - (c * 1.5);
      avatarNav.position.z = 0;
      avatarNav.rotation.z = -Math.PI / 2;
      avatarNav.rotation.y = -Math.PI / 2;
      avatarNav.assetMeta = {
        appClickable: true,
        clickCommand: 'selectMainMesh',
        seatIndex: c
      };
      avatarNav.parent = this.playerDock3DPanel;
      let colors = this.get3DColors(c);
      this.__setTextMeshColor(avatarNav, colors.r, colors.g, colors.b);
      this.playerAvatarNavs.push(avatarNav);
    }

  }

  _initSizePanel() {
    let buttonBarTransform = new BABYLON.TransformNode('assetPanelButtonTN', this.scene);

    let normalSizeButton = BABYLON.MeshBuilder.CreatePlane('assetPanelNormalSizeButton', {
      height: 0.25,
      width: 1.65,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    normalSizeButton.material = new BABYLON.StandardMaterial('assetPanelNormalSizeButtonMat', this.scene);
    Utility3D.setTextMaterial(this.scene, normalSizeButton.material, 'Normal', 'rgb(255, 255, 255)', 'transparent', 180);
    normalSizeButton.parent = buttonBarTransform;
    this.assetPanelNormalButton = normalSizeButton;

    let handleClick = async (pointerInfo, mesh, meta) => {
      normalSizeButton.setEnabled(false);
      this.updateAssetSize('normal', this.lastClickMetaButtonCache);
    };

    normalSizeButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handleClick
    };

    let hugeSizeButton = BABYLON.MeshBuilder.CreatePlane('assetPanelHugeSizeButton', {
      height: 0.25,
      width: 1.65,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    hugeSizeButton.material = new BABYLON.StandardMaterial('assetPanelHugeSizeButtonMat', this.scene);
    Utility3D.setTextMaterial(this.scene, hugeSizeButton.material, 'Huge', 'rgb(255, 255, 255)', 'transparent', 180);
    hugeSizeButton.parent = buttonBarTransform;
    this.assetPanelHugeButton = hugeSizeButton;

    hugeSizeButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handleClick: async (pointerInfo, mesh, meta) => {
        hugeSizeButton.setEnabled(false);
        this.updateAssetSize('huge', this.lastClickMetaButtonCache);
      }
    };
    hugeSizeButton.position.x = 2;

    let smallSizeButton = BABYLON.MeshBuilder.CreatePlane('assetPanelSmallSizeButton', {
      height: 0.25,
      width: 1.65,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    smallSizeButton.material = new BABYLON.StandardMaterial('assetPanelSmallSizeButtonMat', this.scene);
    Utility3D.setTextMaterial(this.scene, smallSizeButton.material, 'Small', 'rgb(255, 255, 255)', 'transparent', 180);
    smallSizeButton.parent = buttonBarTransform;
    this.assetSmallSizeButton = smallSizeButton;

    smallSizeButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handleClick: async (pointerInfo, mesh, meta) => {
        smallSizeButton.setEnabled(false);
        this.updateAssetSize('small', this.lastClickMetaButtonCache);
      }
    };

    smallSizeButton.position.x = -2;

    return buttonBarTransform;
  }
  async updateProfileMeshOverride(id, size) {
    if (!this.profile.assetSizeOverrides)
      this.profile.assetSizeOverrides = {};

    this.profile.assetSizeOverrides[id] = size;

    let updatePacket = {
      assetSizeOverrides: {
        [id]: size
      }
    };
    await firebase.firestore().doc(`Users/${this.uid}`).set(updatePacket, {
      merge: true
    });
  }
  async updateAssetSize(size, meta) {
    let id = meta.id;
    if (this.staticAssetMeshes[id]) {
      if (size === 'huge') {
        let freshMesh = await this.loadStaticMesh(meta.extended.largeGlbPath, '', meta.extended.largeScale, 0, 0, 0);
        freshMesh.parent = this.staticAssetMeshes[id].baseMesh.parent;
        this.staticAssetMeshes[id].baseMesh.dispose();
        this.staticAssetMeshes[id].baseMesh = freshMesh;
      }
      if (size === 'normal') {
        let freshMesh = await this.loadStaticMesh(meta.extended.normalGlbPath, '', meta.extended.normalScale, 0, 0, 0);
        freshMesh.parent = this.staticAssetMeshes[id].baseMesh.parent;
        this.staticAssetMeshes[id].baseMesh.dispose();
        this.staticAssetMeshes[id].baseMesh = freshMesh;
      }
      if (size === 'small') {
        let freshMesh = await this.loadStaticMesh(meta.extended.smallGlbPath, '', meta.extended.smallScale, 0, 0, 0);
        freshMesh.parent = this.staticAssetMeshes[id].baseMesh.parent;
        this.staticAssetMeshes[id].baseMesh.dispose();
        this.staticAssetMeshes[id].baseMesh = freshMesh;
      }
    }

    let moonIndex = ['e1_luna', 'ceres', 'j5_io', 'eris'].indexOf(id);
    if (moonIndex !== -1) {
      this.loadMoonButton(moonIndex);
    }

    await this.updateProfileMeshOverride(id, size);

    this.staticAssetMeshes[id].assetMeta.extended = this.processStaticAssetMeta(this.staticAssetMeshes[id].assetMeta);
    this._updateLastClickMeta(this.staticAssetMeshes[id].assetMeta);
  }

  addMascotsArea() {
    if (this.mascotsAreaInited)
      return;
    this.mascotsAreaInited = true;

    let iconName = 'home';
    let mascotsBtn = this._addOptionButton('https://unpkg.com/@fortawesome/fontawesome-free@5.7.2/svgs/solid/' + iconName + '.svg', 'button1');
    mascotsBtn.position.y = 1;
    mascotsBtn.position.x = 20;
    mascotsBtn.position.z = -20;
    mascotsBtn.rotation.y = 0.5;

    mascotsBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handleClick: async (pointerInfo, mesh, meta) => {
        this.loadOptional('mascots');
      }
    };


    iconName = 'edit';
    mascotsBtn = this._addOptionButton('https://unpkg.com/@fortawesome/fontawesome-free@5.7.2/svgs/solid/' + iconName + '.svg', 'button1');
    mascotsBtn.position.y = 1;
    mascotsBtn.position.x = 23;
    mascotsBtn.position.z = -18;
    mascotsBtn.rotation.y = 0.25;

    mascotsBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handleClick: async (pointerInfo, mesh, meta) => {
        let rotation = new BABYLON.Vector3(0, 0, 0);

        let endPosition = this.vector(this.staticAssetMeshes['mars'].position);
        let startPosition = this.vector(this.staticAssetMeshes['neptune'].position);
        this.shootRocket(startPosition, rotation, endPosition);
      }
    };

  }
  _addOptionButton(texturePath, name) {
    let mesh = BABYLON.MeshBuilder.CreateDisc(name, {
      radius: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    let mat = new BABYLON.StandardMaterial(name + 'disc-mat', this.scene);

    let tex = new BABYLON.Texture(texturePath, this.scene, false, false);
    tex.hasAlpha = true;
    mat.opacityTexture = tex;
    mat.emissiveColor = new BABYLON.Color3(1, 0, 1);
    mat.diffuseColor = new BABYLON.Color3(1, 0, 1);
    mat.ambientColor = new BABYLON.Color3(1, 0, 1);
    mesh.material = mat;

    return mesh;
  }
  async loadOptional(kind) {
    let promises = [];
    let deck = GameCards.getCardDeck('mascots');
    deck.forEach(card => {
      if (!this.staticAssetMeshes[card.id] && card.optionalLoadFlag === kind)
        promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, kind));
    });
    await Promise.all(promises);
  }

  v(x, y, z) {
    return new BABYLON.Vector3(x, y, z);
  }
  async rocketTakeOff(rocketMesh, height, xDelta, timeMS = 2000) {
    return new Promise((res, rej) => {
      const id = rocketMesh.id;
      const frameRate = 60;
      const endFrame = timeMS * frameRate / 1000;

      const heightAnim = new BABYLON.Animation(id + "heightPos", "position.y", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
      const heightKeys = [];
      heightKeys.push({
        frame: 0,
        value: rocketMesh.position.y
      });
      heightKeys.push({
        frame: Math.floor(0.5 * endFrame),
        value: rocketMesh.position.y + height / 5
      });
      heightKeys.push({
        frame: endFrame,
        value: rocketMesh.position.y + height
      });
      heightAnim.setKeys(heightKeys);

      const rotationAnim = new BABYLON.Animation(id + "rotationAnim", "rotation.x", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
      const rotationKeys = [];
      rotationKeys.push({
        frame: 0,
        value: rocketMesh.rotation.x
      });
      rotationKeys.push({
        frame: Math.floor(0.667 * endFrame),
        value: rocketMesh.rotation.x
      });
      rotationKeys.push({
        frame: Math.floor(0.75 * endFrame),
        value: rocketMesh.rotation.x + Math.PI / 4
      });
      rotationKeys.push({
        frame: endFrame,
        value: rocketMesh.rotation.x + Math.PI / 2
      });
      rotationAnim.setKeys(rotationKeys);

      const positionAnim = new BABYLON.Animation(id + "positionAnim", "position.z", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
      const positionKeys = [];
      positionKeys.push({
        frame: 0,
        value: rocketMesh.position.z
      });
      positionKeys.push({
        frame: Math.floor(0.667 * endFrame),
        value: rocketMesh.position.z
      });
      positionKeys.push({
        frame: endFrame,
        value: rocketMesh.position.z + xDelta
      });
      positionAnim.setKeys(positionKeys);


      rocketMesh.animations.push(heightAnim);
      rocketMesh.animations.push(rotationAnim);
      rocketMesh.animations.push(positionAnim);

      let rocketAnim = this.scene.beginAnimation(rocketMesh, 0, endFrame, true);

      let animArray = rocketMesh.animations;
      setTimeout(() => {
        rocketAnim.stop();
        animArray.splice(animArray.indexOf(heightAnim), 1);
        animArray.splice(animArray.indexOf(rotationAnim), 1);
        animArray.splice(animArray.indexOf(positionAnim), 1);
        res();
      }, timeMS);
    });
  }
  async rocketLand(rocketMesh, endPosition, timeMS = 1500) {
    return new Promise((res, rej) => {
      const id = rocketMesh.id;
      const frameRate = 60;
      const endFrame = timeMS * frameRate / 1000;

      const positionAnim = new BABYLON.Animation(id + "heightPosLand", "position", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
      const positionKeys = [];
      positionKeys.push({
        frame: 0,
        value: rocketMesh.position
      });
      positionKeys.push({
        frame: endFrame,
        value: endPosition
      });
      positionAnim.setKeys(positionKeys);

      const rotationAnim = new BABYLON.Animation(id + "rotationAnim", "rotation.x", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
      const rotationKeys = [];
      rotationKeys.push({
        frame: 0,
        value: rocketMesh.rotation.x
      });
      rotationKeys.push({
        frame: endFrame,
        value: rocketMesh.rotation.x + Math.PI / 3
      });
      rotationAnim.setKeys(rotationKeys);

      let origScaling = this.vector(rocketMesh.scaling);
      const scalingAnim = new BABYLON.Animation(id + "scaleLand", "scaling", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
      const scalingKeys = [];
      scalingKeys.push({
        frame: 0,
        value: origScaling
      });
      scalingKeys.push({
        frame: endFrame,
        value: this.v(origScaling.x * 0.25, origScaling.y * 0.25, origScaling.z * 0.25)
      });
      scalingAnim.setKeys(scalingKeys);

      rocketMesh.animations.push(rotationAnim);
      rocketMesh.animations.push(positionAnim);
      rocketMesh.animations.push(scalingAnim);

      let rocketAnim = this.scene.beginAnimation(rocketMesh, 0, endFrame, true);

      let animArray = rocketMesh.animations;
      setTimeout(() => {
        rocketAnim.stop();
        animArray.splice(animArray.indexOf(rotationAnim), 1);
        animArray.splice(animArray.indexOf(positionAnim), 1);
        animArray.splice(animArray.indexOf(scalingAnim), 1);
        rocketMesh.scaling.copyFrom(origScaling);
        res();
      }, timeMS);
    });
  }
  async rocketTravelTo(rocket, endPosition, travelTime, landingDelay = 1500) {
    return new Promise((res, rej) => {
      let startPosition = this.vector(rocket.position);
      const id = rocket.id;
      const frameRate = 60;
      const endFrame = Math.floor((travelTime + landingDelay) * frameRate / 1000);
      const delayFrame = Math.floor((travelTime) * frameRate / 1000);

      const positionAnimation = new BABYLON.Animation(id + "positionAnim", "position", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
      const positionKeys = [];
      positionKeys.push({
        frame: 0,
        value: this.v(startPosition.x, startPosition.y, startPosition.z)
      });
      positionKeys.push({
        frame: delayFrame,
        value: this.v(endPosition.x, startPosition.y, endPosition.z)
      });
      positionKeys.push({
        frame: endFrame,
        value: this.v(endPosition.x, startPosition.y, endPosition.z)
      });
      positionAnimation.setKeys(positionKeys);

      rocket.animations.push(positionAnimation);
      let rocketAnim = this.scene.beginAnimation(rocket, 0, travelTime, true);

      let animArray = rocket.animations;
      setTimeout(() => {
        rocketAnim.stop();
        animArray.splice(animArray.indexOf(positionAnimation), 1);
        res();
      }, (travelTime - landingDelay));
    });
  }
  vector(vector) {
    let v = new BABYLON.Vector3();
    v.copyFrom(vector);
    return v;
  }
  async shootRocket(startPos, startRotation, endPosition) {
    if (this.rocketRunning)
      return;

    let newRocket = this.staticAssetMeshes['rocket_atlasv'];
    this.rocketRunning = true;

    newRocket.position.copyFrom(startPos);
    newRocket.rotation.copyFrom(startRotation);
    newRocket.setEnabled(true);

    if (!newRocket.particleSystem)
      Utility3D.createFireParticles(this.staticAssetMeshes['rocket_atlasv'].assetMeta, newRocket, 'rocket1', this.scene);
    else {
      newRocket.particleSystem.reset();
      newRocket.particleSystem.start();
    }

    await this.rocketTakeOff(newRocket, 6, 10, 2500);
    await this.rocketTravelTo(newRocket, endPosition, 8000, 1500);
    await this.rocketLand(newRocket, endPosition, 1500);

    newRocket.particleSystem.stop();
    newRocket.setEnabled(false);
    newRocket.position.copyFrom(startPos);
    newRocket.rotation.copyFrom(startRotation);
    this.rocketRunning = false;
  }

  async addRocket() {

    //var input5 = new BABYLON.GUI.InputText();
  }
}
