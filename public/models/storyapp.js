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


    this.camera_switch = document.querySelector('.camera_switch');
    this.camera_switch.addEventListener('click', e => this.cameraOptionSwitch());

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


    this.startCameraAlpha = this.scene.activeCamera.alpha;
    this.scene.onPointerObservable.add((eventData) => {
      if (this.xr.baseExperience.state !== 3) { //inxr is 2
        return
      }
      if (this.attachControl !== false) {
        return
      }

      if (eventData.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        this.pointerActive = true;
      } else if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
        this.pointerActive = false;
      } else if (this.pointerActive && eventData.type === BABYLON.PointerEventTypes.POINTERMOVE) {
        let evt = eventData.event;
        let mX, mY
        if (evt.movementX != 0) {
          mX = evt.movementX / -20
        } else mX = evt.movementX
        if (evt.movementY != 0) {
          mY = evt.movementY / 20
        } else mY = evt.movementY;

        let movementVector = new BABYLON.Vector3(mX, 0, mY);

        let angle = this.startCameraAlpha - this.scene.activeCamera.alpha;
        movementVector.set(
          movementVector.x * Math.cos(angle) + movementVector.z * Math.sin(angle),
          0,
          movementVector.z * Math.cos(angle) - movementVector.x * Math.sin(angle)
        );

        this.scene.activeCamera.position.addInPlace(movementVector);
        this.scene.activeCamera.target.addInPlace(movementVector);
      }
    });

    this.xr.baseExperience.camera.onBeforeCameraTeleport.add(() => {
      this.clearFollowMeta();
    });
  }

  cameraOptionSwitch() {
    this.clearFollowMeta();
    if (this.attachControl !== false) {
      this.scene.activeCamera.detachControl();
      this.attachControl = false;
      this.camera_switch.innerHTML = 'Rotate';
    } else {
      this.scene.activeCamera.attachControl(this.canvas, true);
      this.attachControl = true;
      this.camera_switch.innerHTML = 'Pan';
    }
  }
  aimCamera(locationMeta) {
    this.camera.restoreState();
    if (locationMeta) {
      this.camera.setPosition(locationMeta.position);
      this.camera.setTarget(locationMeta.target);
    }

    if (this.xr.baseExperience.state === 2) { //inxr = 2
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
    if (!this.attachControl) {
      this.scene.activeCamera.attachControl(this.canvas, true);
      this.attachControl = true;
    }
    let v = new BABYLON.Vector3(0, 0, 0);
    v.copyFrom(this.followMeta.basePivot.getAbsolutePosition());
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
    this.clearFollowMeta();
    this.aimCamera(this.cameraMetaY);
    if (this.xr.baseExperience.state === 2)
      this.scene.activeCamera.position.y += 10;
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
    this.hugeAssets = this.testPerformanceFlags('hugemodel_all');
    this.smallAssets = this.testPerformanceFlags('hugemodel_small');

    this.sceneTransformNode = new BABYLON.TransformNode('sceneTransformNode', this.scene);

    this.addLineToLoading('Solar System Objects<br>');
    let navMeshes = [];
    let promises = [];
    let deck = GameCards.getCardDeck('solarsystem');

    deck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode));
      if (this.allCards[card.id].navDiameter !== undefined)
        navMeshes.push(Utility3D.loadStaticNavMesh(card.id, this.allCards[card.id], this.scene));
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

    this.navMesh = BABYLON.Mesh.MergeMeshes(navMeshes);
    this.navMesh.setEnabled(false);

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

    await this.setupAgents();

    this.sceneInited = true;
    this.loadAvatars();
    this.loadAsteroids();

    this.paintGameData();

    this.initCameraToolbar();
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

    mesh.material = this.asteroidMaterial;

    let orbitWrapper = new BABYLON.TransformNode('assetorbitwrapper' + asteroid, this.scene);

    mesh.position.x = 20;
    orbitWrapper.position.x = 7;
    orbitWrapper.position.z = 9;

    mesh.parent = orbitWrapper;

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

    let animR = this.scene.beginAnimation(mesh, 0, spinEndFrame, true);

    let asteroidSymbolWrapper = this.loadSymbolForAsteroid(mesh, asteroid, index);

    orbitWrapper.assetMeta = {
      appClickable: true,
      clickToPause: true,
      clickCommand: 'pauseSpin',
      name: asteroid,
      asteroidType: true,
      asteroidName: asteroid,
      asteroidMesh: mesh,
      asteroidSymbolWrapper,
      orbitAnimation,
      basePivot: mesh
    };
    mesh.origsx = mesh.scaling.x;
    mesh.origsy = mesh.scaling.y;
    mesh.origsz = mesh.scaling.z;

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

  async loadStaticAsset(name, parent) {
    let meta = Object.assign({}, this.allCards[name]);

    if (meta.optionalLoad && !this.testPerformanceFlags(meta.optionalFlags))
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

    this.addLineToLoading(`
        ${meta.name}:
        &nbsp;
        ${smallLink}
        ${normalLink}
        ${largeLink}
        <br>
        <a href="${meta.url}" target="_blank">wiki</a>
        &nbsp; <img src="${meta.extended.symbolPath}" class="symbol_image">
        <br>
      `);

    let meshPivot = new BABYLON.TransformNode('outerassetwrapper' + name, this.scene);
    mesh.parent = meshPivot;

    if (this.shadowGenerator)
      this.shadowGenerator.addShadowCaster(mesh, true);

    if (meta.mp3file)
      this._loadMeshMusic(meta, mesh, name);

    meta.basePivot = meshPivot;

    if (meta.symbol)
      meshPivot = this.infoPanel(name, meta, meshPivot, this.scene);

    if (meta.rotationTime)
      meshPivot = Utility3D.rotationAnimation(name, meta, meshPivot, this.scene);
    if (meta.orbitTime)
      meshPivot = Utility3D.orbitAnimation(name, meta, meshPivot, this.scene);

    meshPivot = Utility3D.positionPivot(name, meta, meshPivot, this.scene);

    meshPivot.assetMeta = meta;
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
      meta.clickToPause = true;
      meta.clickCommand = 'pauseSpin';
    }

    if (meta.seatIndex !== undefined)
      this.seatMeshes[meta.seatIndex] = meshPivot;
  }

  _loadMeshMusic(meta, mesh, name) {
    if (!this.hugeAssets)
      return;

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
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      if (seatIndex < this.runningSeatCount) {
        let data = this.getSeatData(seatIndex);
        let cacheValue = data.name + data.avatar + data.seated.toString();
        if (!this['dockSeatMesh' + seatIndex]) {
          let mesh = await this.renderSeat(seatIndex);

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
      this.updateAgents();
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
      return;

    let meta = mesh.assetMeta;

    if (meta.emptySeat) {
      this.dockSit(meta.seatIndex);
    }

    if (meta.clickCommand === 'stand') {
      this._gameAPIStand(meta.seatIndex);
    }

    if (meta.clickCommand === 'pauseSpin') {
      this.lastClickMeta = meta;
      this.buttonOneRed.innerHTML = 'A Follow ' + this.lastClickMeta.name;
      this.buttonTwo.innerHTML = 'B';

      this.lastClickMetaButtonCache = this.lastClickMeta;

      this.meshToggleAnimation(meta, false, mesh);
    }

    if (meta.masterid === 'sun')
      this._endTurn();
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

    //if (meta.parent)
    //  this.meshToggleAnimation(this.staticAssetMeshes[meta.parent].assetMeta, stop);
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
      depth: .1
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
    if (this.smallAssets) {
      return this.renderSmallSeatAvatar(wrapper, avatarWrapper, index);
    }
    return await this.renederNormalSeatAvatar(wrapper, avatarWrapper, index);
  }
  async renderSmallSeatAvatar(wrapper, avatarWrapper, index) {
    let seatData = this.getSeatData(index);
    let colors = this.get3DColors(index);
    let avatar = seatData.avatar;
    let uid = seatData.uid;

    let mesh = new BABYLON.TransformNode("seatmeshtn" + index, this.scene);
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;
    mesh.parent = avatarWrapper;
    wrapper.avatarMesh = mesh;
    seatData.avatarMesh = mesh;

    let circle = this.createCircle();
    circle.color = new BABYLON.Color3(colors.r, colors.g, colors.b);
    circle.position.y = 0;
    circle.parent = mesh;

    circle = this.createCircle();
    circle.color = new BABYLON.Color3(colors.r, colors.g, colors.b);
    circle.position.y = 0.25;
    circle.parent = mesh;

    circle = this.createCircle();
    circle.color = new BABYLON.Color3(colors.r, colors.g, colors.b);
    circle.position.y = 0.5;
    circle.parent = mesh;

    circle = this.createCircle();
    circle.color = new BABYLON.Color3(colors.r, colors.g, colors.b);
    circle.position.y = 0.75;
    circle.parent = mesh;

    circle = this.createCircle();
    circle.color = new BABYLON.Color3(colors.r, colors.g, colors.b);
    circle.position.y = 1;
    circle.parent = mesh;

    const plane = BABYLON.MeshBuilder.CreatePlane("avatarimage" + index, {
        height: 2,
        width: 1,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
      },
      this.scene);
    plane.parent = mesh;
    plane.position.y = 1.5;

    let m = new BABYLON.StandardMaterial('avatarshowmat' + name, this.scene);
    let t = new BABYLON.Texture(seatData.image, this.scene);
    t.vScale = 1;
    t.uScale = 1;
    t.hasAlpha = true;

    m.diffuseTexture = t;
    m.emissiveTexture = t;
    m.ambientTexture = t;

    plane.material = m;
  }
  async renderNormalSeatAvatar(wrapper, avatarWrapper, index) {
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
    seatData.avatarMesh = mesh;
    if (this.shadowGenerator)
      this.shadowGenerator.addShadowCaster(wrapper.avatarMesh, true);

    let circle = this.createCircle();
    circle.color = new BABYLON.Color3(colors.r, colors.g, colors.b);
    circle.position.y = 0;
    circle.parent = mesh;

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
      let baseDisc = BABYLON.MeshBuilder.CreateDisc("emptyseat" + index.toString(), {
        radius: this.dockDiscRadius,
        //    tessellation: 9,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
      }, this.scene);

      baseDisc.rotation.x = Math.PI / 2;
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
      y = 0.01,
      z = (index * 2) + 5;
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
  createGuides(size = 50) {
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
