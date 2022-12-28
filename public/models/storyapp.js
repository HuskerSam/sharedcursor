import BaseApp from '/models/baseapp.js';
import GameCards from '/models/gamecards.js';
import U3D from '/models/utility3d.js';
import MenuTab3D from '/models/menutab3d.js';
import Asteroid3D from '/models/asteroid3d.js';
import Avatar3D from '/models/avatar3d.js';
import ActionCards from '/models/actioncards.js';
import Rocket3D from '/models/rocket3d.js';

export class StoryApp extends BaseApp {
  constructor() {
    super();
    this.apiType = 'story';
    this.cache = {};
    this.staticBoardObjects = {};
    this.playerMoonAssets = new Array(4);
    this.overrideDisplayRound = null;

    this.initGameOptionsPanel();
    this._initMenuBar2D();

    this.alertErrors = false;
  }

  async _initMenuBar2D() {
    this.loading_dynamic_area = document.querySelector('.loading_dynamic_area');
    this.hide_loading_screen = document.querySelector('.hide_loading_screen');
    this.hide_loading_screen.addEventListener('click', e => {
      document.body.classList.remove('show_loading_banner');
    });

    this.show_loading_screen = document.querySelector('.show_loading_screen');
    this.show_loading_screen.addEventListener('click', e => {
      document.body.classList.add('show_loading_banner');
    });

    this.currentplayer_score_dock = document.querySelector('.currentplayer_score_dock');
    this.match_board_wrapper = document.querySelector('.match_board_wrapper');

    this.turn_number_div = document.querySelector('.turn_number_div');
    this.player_total_points = document.querySelector('.player_total_points');
    this.player_total_for_turn = document.querySelector('.player_total_for_turn');
    this.player_dock_prompt = document.querySelector('.player_dock_prompt');
    this.player_dock_prompt.addEventListener('click', e => this.turnPhaseAdvance());

    this.game_header_panel = document.querySelector('.game_header_panel');

    this.settings_button = document.querySelector('.settings_button');
    this.settings_button.addEventListener('click', e => this.modal.show());

    this.canvasDisplayModal = document.querySelector('#canvasDisplayModal');
    this.modal = new bootstrap.Modal(this.canvasDisplayModal);

    this.menu_bar_toggle = document.querySelector('.menu_bar_toggle');
    this.menu_bar_toggle.addEventListener('click', e => document.body.classList.toggle('menu_bar_expanded'));

    this.end_turn_button = document.querySelector('.end_turn_button');
    this.end_turn_button.addEventListener('click', e => this._endTurn());

    this.buttonOneRed = document.querySelector('.choice-button-one');
    this.buttonOneRed.addEventListener('click', e => this.aButtonPress());
    this.buttonTwo = document.querySelector('.choice-button-two');
    this.buttonTwo.addEventListener('click', e => this.bButtonPress());
    this.buttonThree = document.querySelector('.choice-button-three');
    this.buttonThree.addEventListener('click', e => this.xButtonPress());
    this.buttonFour = document.querySelector('.choice-button-four');
    this.buttonFour.addEventListener('click', e => this.yButtonPress());
  }
  async _initContent3D() {
    let startTime = new Date();
    this.sceneTransformNode = null; //new BABYLON.TransformNode('sceneTransformNode', this.scene);
    this.createMenu3DWrapper();
    this.menuTab3D = new MenuTab3D(this);
    this.asteroidHelper = new Asteroid3D(this);
    this.rocketHelper = new Rocket3D(this);

    if (this.urlParams.get('showguides'))
      U3D.createGuides(this.scene);

    this.xr.baseExperience.camera.onBeforeCameraTeleport.add(() => {
      this.clearActiveFollowMeta();
    });

    this.addLineToLoading('Loading Assets...<br>');
    let promises = [];
    let deck = GameCards.getCardDeck('solarsystem');

    deck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, this.profile, this.scene));
    });
    deck = GameCards.getCardDeck('moons1');
    deck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, this.profile, this.scene));
    });
    deck = GameCards.getCardDeck('moons2');
    deck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, this.profile, this.scene));
    });

    this.avatarHelper = new Avatar3D(this);
    let loadingResults;
    await Promise.all([
      this.avatarHelper.loadAndInitAvatars(),
      (loadingResults = await Promise.all(promises)),
      this.asteroidHelper.loadAsteroids()
    ]);

    let loadingHTML = '';
    loadingResults.forEach(assetMesh => {
      let meta = assetMesh.assetMeta;

      let normalLink = `<a href="${meta.extended.glbPath}" target="_blank">Normal</a>&nbsp;`;
      let smallLink = '';
      let largeLink = '';
      if (meta.largeglbpath)
        largeLink = `<a href="${meta.extended.largeGlbPath}" target="_blank">Large</a>&nbsp;`;
      if (meta.smallglbpath)
        smallLink = `<a href="${meta.extended.smallGlbPath}" target="_blank">Small</a>&nbsp;`;

      let imgHTML = meta.symbol ? `<img src="${meta.extended.symbolPath}" class="symbol_image">` : '';

      loadingHTML += `${meta.name}:
        &nbsp;
        ${smallLink}
        ${normalLink}
        ${largeLink}
        <br>
        <a href="${meta.url}" target="_blank">wiki</a>
        &nbsp; ${imgHTML}
        <br>`;

      if (meta.noClick !== true) {
        meta.appClickable = true;
        meta.clickCommand = 'customClick';
        meta.handlePointerDown = async (pointerInfo, mesh, meta) => {
          this.pauseAssetSpin(pointerInfo, mesh, meta);
        };
      }
    });
    this.addLineToLoading(loadingHTML);

    this.menuTab3D.initOptionsBar();
    this.avatarHelper.initPlayerPanel();
    this.asteroidHelper.asteroidUpdateMaterials();
    this.actionCardHelper = new ActionCards(this, this.menuTab3D.playerCardsTN);

    if (this.instrumentationOn) {
      let delta = new Date().getTime() - startTime.getTime();
      console.log('init3D', delta);
      this.addLineToLoading(`${delta} ms to load 3D content<br>`);
    }

    this.paintGameData();

    this.runRender = true;
  }
  createMenu3DWrapper() {
    this.menuBarLeftTN = new BABYLON.TransformNode('menuBarLeftTN', this.scene);
    this.menuBarLeftTN.position = U3D.v(1, 0.5, 1);
    this.menuBarLeftTN.scaling = U3D.v(0.3, 0.3, 0.3);
    this.menuBarLeftTN.position.y = 3;
    this.menuBarLeftTN.position.z = 3;
    this.menuBarLeftTN.billboardMode = 7;

    this.menuBarRightTN = new BABYLON.TransformNode('menuBarRightTN', this.scene);
    this.menuBarRightTN.position = U3D.v(-5, 1, -5);
    this.menuBarRightTN.scaling = U3D.v(0.3, 0.3, 0.3);
    this.menuBarRightTN.billboardMode = 7;

    this.menuBarTabButtonsTN = new BABYLON.TransformNode('menuBarTabButtonsTN', this.scene);
    this.menuBarTabButtonsTN.parent = this.menuBarLeftTN;
    this.menuBarTabButtonsTN.position.y = -3;
  }

  async loadStaticAsset(name, sceneParent, profile, scene, meta = null) {
    if (!meta) {
      meta = Object.assign({}, window.allStaticAssetMeta[name]);
      meta.extended = U3D.processStaticAssetMeta(meta, profile);
    }

    if (meta.sizeBoxFit === undefined)
      meta.sizeBoxFit = 2;
    meta.containerPath = meta.extended.glbPath;
    let noShadow = meta.noShadow === true;
    let scaleMesh = await U3D.loadStaticMesh(scene, meta.containerPath, noShadow);
    U3D.sizeNodeToFit(scaleMesh, meta.sizeBoxFit);

    if (meta.wireframe) {
      scaleMesh.material = this.asteroidHelper.selectedAsteroidMaterial;
      scaleMesh.getChildMeshes().forEach(mesh => mesh.material = this.asteroidHelper.selectedAsteroidMaterial);
    }

    let meshPivot = new BABYLON.TransformNode('outerassetwrapper' + name, scene);
    scaleMesh.parent = meshPivot;
    meta.basePivot = meshPivot;

    let outerPivot = meshPivot;
    if (meta.symbol) {
      meta.assetSymbolPanel = U3D.addSymbolPanel(meta, scene);
      meta.assetSymbolPanel.parent = outerPivot;
    }

    if (meta.rotationTime) {
      meta.rotationPivot = U3D.addRotationPivot(meta, scene);
      meta.rotationPivot.parent = outerPivot.parent;
      outerPivot.parent = meta.rotationPivot;
      outerPivot = meta.rotationPivot;
      meta.rotationAnimation = outerPivot.rotationAnimation;
    }

    if (meta.orbitTime) {
      meta.orbitPivot = U3D.addOrbitPivot(meta, scene);
      meta.orbitPivot.parent = outerPivot.parent;
      outerPivot.parent = meta.orbitPivot;
      outerPivot = meta.orbitPivot;
      meta.orbitAnimation = outerPivot.orbitAnimation;
    }

    meta.positionPivot = U3D.addPositionPivot(meta, this.scene);
    meta.positionPivot.parent = outerPivot.parent;
    outerPivot.parent = meta.positionPivot;
    outerPivot = meta.positionPivot;

    outerPivot.assetMeta = meta;
    outerPivot.baseMesh = scaleMesh;
    if (meta.loadDisabled)
      outerPivot.setEnabled(false);
    this.staticBoardObjects[name] = outerPivot;

    if (meta.parent) {
      await this.__awaitAssetLoad(meta.parent);
      this.staticBoardObjects[name].parent = this.parentPivot(meta.parent);
    } else
      this.staticBoardObjects[name].parent = sceneParent;

    return this.staticBoardObjects[name];
  }
  parentPivot(id) {
    let meta = this.staticBoardObjects[id].assetMeta;
    if (meta.objectType === 'moon' || meta.objectType === 'dwarf' || meta.objectType === 'nearearth')
      return meta.basePivot;

    return this.staticBoardObjects[id];
  }
  assetPosition(id) {
    return this.staticBoardObjects[id].baseMesh.getAbsolutePosition();
  }

  async __awaitAssetLoad(name) {
    if (this.staticBoardObjects[name])
      return this.staticBoardObjects[name];

    return new Promise((res, rej) => {
      let awaitInterval = setInterval(() => {
        if (this.staticBoardObjects[name]) {
          clearInterval(awaitInterval);
          res(this.staticBoardObjects[name]);
        }
      }, 100);
    });
  }
  addLineToLoading(str) {
    let div = document.createElement('div');
    div.innerHTML = str;
    this.loading_dynamic_area.appendChild(div);

    this.loading_dynamic_area.scrollIntoView(false);

    return div;
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
  get isOwner() {
    return this.uid === this.gameData.createUser;
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
  async getJSONFile(path) {
    let response = await fetch(path);
    return await response.json();
  }
  async load() {
    await Promise.all([
      window.allStaticAssetMeta = await GameCards.loadDecks(),
      this.actionCards = await this.getJSONFile('/story/actioncards.json'),
      this.boardResetRoundData = await this.getJSONFile('/story/defaultround.json')
    ])
    await super.load();
  }

  get activeSeatIndex() {
    if (!this.gameData)
      return 0;
    return this.gameData.currentSeat;
  }
  get activeMoon() {
    return this.playerMoonAssets[this.activeSeatIndex];
  }

  //profile related
  async switchSkyboxNext(previous) {
    let index = this.menuTab3D.skyboxList().indexOf(this.profile.skyboxPath);
    if (previous)
      index--;
    else
      index++;
    if (index > this.menuTab3D.skyboxList().length - 1)
      index = 0;
    if (index < 0)
      index = this.menuTab3D.skyboxList().length - 1;

    this.profile.skyboxPath = this.menuTab3D.skyboxList()[index];
    this.menuTab3D.updateSkyboxLabel();
    this.initSkybox();

    let updatePacket = {
      skyboxPath: this.profile.skyboxPath
    };
    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).update(updatePacket);
  }
  async asteroidCountChange(delta) {
    let asteroidCount = this.asteroidHelper.getAsteroidCount(this.profile.asteroidCount);
    asteroidCount = this.asteroidHelper.getAsteroidCount(asteroidCount + delta);

    this.profile.asteroidCount = asteroidCount;
    this.clearActiveFollowMeta();
    this.asteroidHelper.loadAsteroids();
    this.asteroidHelper.asteroidUpdateMaterials();
    this.menuTab3D.updateAsteroidOptions();

    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).update({
        asteroidCount
      });
  }
  async asteroidChangeMaterial(wireframe, colorOnly, excludeLogos) {
    let updatePacket = {};

    if (wireframe !== null) {
      updatePacket.asteroidWireframe = wireframe;
      this.profile.asteroidWireframe = wireframe;
    }
    if (colorOnly !== null) {
      updatePacket.asteroidColorOnly = colorOnly;
      this.profile.asteroidColorOnly = colorOnly;
    }
    if (excludeLogos !== null) {
      updatePacket.asteroidExcludeLogos = excludeLogos;
      this.profile.asteroidExcludeLogos = excludeLogos;
    }

    this.asteroidHelper.asteroidUpdateMaterials();
    this.menuTab3D.updateAsteroidOptions();

    await firebase.firestore().doc(`Users/${this.uid}`).set(updatePacket, {
      merge: true
    });
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
  async sceneLightChange(delta) {
    let sceneLightLevel = this._getLightLevel(this.profile.sceneLightLevel);
    sceneLightLevel = this._getLightLevel(sceneLightLevel + delta);
    this.profile.sceneLightLevel = sceneLightLevel;
    this.mainLight.intensity = sceneLightLevel;
    this.menuTab3D.updateDiffuseLightLabel();
    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).update({
        sceneLightLevel
      });
  }

  //game logic
  clickEndTurn() {
    this._endTurn();
  }
  clickStartGame() {

  }
  clickEndGame() {

  }
  async _endTurn() {
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
  async _initGameDataBasedContent() {
    if (this.initedGameBasedContent)
      return;

    this.initedGameBasedContent = true;

    await this.initGraphics();
    await this._initContent3D();
    this.initGameMessageFeed();
  }
  async paintGameData(gameDoc = null) {
    if (gameDoc)
      this.gameData = gameDoc.data();

    if (!this.gameData)
      return;

    this._initGameDataBasedContent();

    document.body.classList.add('game_loaded');

    this.queryStringPaintProcess();
    this.paintOptions();

    this._updateGameMembersList();
    this.paintDock();


    this.paintBoard();

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

    if (!this.avatarHelper || !this.avatarHelper.avatarsLoaded)
      return;

    this.updateUserPresence();

    document.body.classList.add('avatars_loaded');
  }
  async paintDock() {
    super.paintDock();
    if (this.avatarHelper)
      this.avatarHelper.updatePlayerDock();
  }
  updateUserPresence() {
    super.updateUserPresence();
    if (this.avatarHelper)
      this.avatarHelper.updateUserPresence();
  }

  enterXR() {
    this.menuBarLeftTN.position = U3D.v(0.05, 0.05, -0.05);
    this.menuBarLeftTN.scaling = U3D.v(0.02, 0.02, 0.02);
    this.menuBarLeftTN.parent = this.leftHandedControllerGrip;
    this.menuBarLeftTN.billboardMode = 7;
    this.inXR = true;

    this.menuBarRightTN.position = U3D.v(0.05, 0.05, -0.05);
    this.menuBarRightTN.scaling = U3D.v(0.02, 0.02, 0.02);
    this.menuBarRightTN.parent = this.rightHandedControllerGrip;

    this.menuTab3D.setSelectedAsset(this.menuTab3D.selectedObjectMeta);
  }
  enterNotInXR() {
    this.menuBarLeftTN.position = U3D.vector(-10, 1, -10);
    this.menuBarLeftTN.scaling = U3D.v(1, 1, 1);
    this.menuBarLeftTN.parent = null;

    this.inXR = false;

    this.menuBarRightTN.position = U3D.vector(-15, 1, -15);
    this.menuBarRightTN.scaling = U3D.v(1, 1, 1);
    this.menuBarRightTN.parent = null;
  }
  XRControllerAdded(model, handed) {
    if (handed === 'left') {
      this.leftHandedControllerGrip = model.grip;
      this.menuBarLeftTN.parent = model.grip;
    }
    if (handed === 'right') {
      this.rightHandedControllerGrip = model.grip;
      this.menuBarRightTN.parent = model.grip;
    }
  }

  pointerMove(pointerInfo) {
    if (this.menuTab3D && this.lastClickSpinPaused) {
      this.pauseAssetSpinMove(pointerInfo, this.menuTab3D.spinPauseMeta)
    }
  }
  pointerUp(pointerInfo) {
    if (this.lastClickSpinPaused) {
      this.lastClickSpinPaused = false;
      if (this.menuTab3D.spinPauseMeta && !this.menuTab3D.spinPauseMeta.activeSelectedObject) {
        if (!this.menuTab3D.spinPauseMeta.activeSelectedObject)
          this.menuTab3D.spinPauseMeta.basePivot.rotation.copyFrom(this.menuTab3D.spinPauseMeta.basePivot.originalRotation);
      }
    }
    if (this.menuTab3D.spinPauseMeta) {
      this.spinPauseMesh(this.menuTab3D.spinPauseMeta, true, null);
      this.menuTab3D.spinPauseMeta = null;
    }
  }
  pauseAssetSpin(pointerInfo, mesh, meta) {
    this.menuTab3D.spinPauseMeta = meta;

    if (meta.activeSelectedObject !== true) {
      this.menuTab3D.setSelectedAsset(meta);
    }

    meta.basePivot.originalRotation = U3D.vector(meta.basePivot.rotation);
    if (meta.asteroidType)
      meta.basePivot.rotation = this.getAbsoluteRotation(meta.basePivot);
    this.lastClickSpinPaused = true;
    this.spinPauseMetaPointerX = this.scene.pointerX;
    this.spinPauseMetaPointerY = this.scene.pointerY;

    this.spinPauseMesh(meta, false, mesh);
  }
  pauseAssetSpinMove(pointerInfo, meta) {
    let dX = this.scene.pointerX - this.spinPauseMetaPointerX;
    let dY = this.scene.pointerY - this.spinPauseMetaPointerY;

    //debounce so doesn't shake in XR
    if (Math.abs(dX) + Math.abs(dY) < 8)
      return;

    if (meta.activeSelectedObject) {
      meta.basePivot.rotation.y -= dX * 0.0035;
      meta.basePivot.rotation.x -= dY * 0.0035;
    } else {
      meta.basePivot.rotation.y -= dX * 0.005;
      meta.basePivot.rotation.x -= dY * 0.005;
    }

    this.spinPauseMetaPointerX = this.scene.pointerX;
    this.spinPauseMetaPointerY = this.scene.pointerY;
  }
  spinPauseMesh(meta, stop = false, mesh) {
    if (!stop) {
      if (!meta.activeSelectedObject)
        this.menuTab3D.showAssetNamePlate(meta);

      if (meta.rotationAnimation)
        meta.rotationAnimation.pause();

      if (meta.orbitAnimation)
        meta.orbitAnimation.pause();

      if (!this.inXR) {
        this.camera.detachControl(this.canvas)
      }
    } else {
      if (!meta.activeSelectedObject)
        this.menuTab3D.hideAssetNamePlate(meta);

      if (meta.rotationAnimation && meta.rotationAnimation._paused)
        meta.rotationAnimation.restart();

      if (meta.orbitAnimation && meta.orbitAnimation._paused)
        meta.orbitAnimation.restart();

      if (!this.inXR) {
        this.camera.attachControl(this.canvas)
      }
    }
  }
  pointerDown(pointerInfo) {
    let mesh = pointerInfo.pickInfo.pickedMesh;
    while (mesh && !(mesh.assetMeta && mesh.assetMeta.appClickable)) {
      mesh = mesh.parent;
    }

    if (!mesh || !mesh.assetMeta.appClickable)
      return false;

    let meta = mesh.assetMeta;

    if (meta.clickCommand === 'customClick')
      meta.handlePointerDown(pointerInfo, mesh, meta);

    return true;
  }
  clearActiveFollowMeta() {
    this.activeFollowMeta = null;
  }
  setActiveFollowMeta() {
    //  this.aimCamera();
    this.activeFollowMeta = this.menuTab3D.selectedObjectMeta;
    let v = new BABYLON.Vector3(0, 0, 0);

    if (this.activeFollowMeta.basePivot)
      v.copyFrom(this.activeFollowMeta.basePivot.getAbsolutePosition());
    else
      v.copyFrom(this.staticBoardObjects[this.activeFollowMeta.id].getAbsolutePosition());
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
  }
  yButtonPress() {
    this.clearActiveFollowMeta();
    this.aimCamera(this.cameraMetaX);
  }
  xButtonPress() {}
  bButtonPress() {
    this.setActiveFollowMeta();
  }
  aButtonPress() {
    this.clearActiveFollowMeta();
  }
  getAbsoluteRotation(mesh) {
    var rotation = BABYLON.Quaternion.Identity()
    var position = BABYLON.Vector3.Zero()

    mesh.getWorldMatrix().decompose(BABYLON.Vector3.Zero(), rotation, position)

    if (mesh.rotationQuaternion) {
      mesh.rotationQuaternion.copyFrom(rotation)
    } else {
      rotation.toEulerAnglesToRef(mesh.rotation)
    }

    return rotation;
  }
  updateAvatarRender() {
    if (this.avatarHelper)
      this.avatarHelper.updateAvatarRender();
  }

  get selectedAsset() {
    if (!this.menuTab3D)
      return {};
    return this.menuTab3D.selectedObjectMeta;
  }

  async paintBoard() {
    if (this.paintedBoardRoundIndex !== this.visibleRound) {
      this.paintedBoardRoundIndex = this.visibleRound;
      this.initListenGameRound(this.paintedBoardRoundIndex);

      let index = this.paintedBoardRoundIndex;
      if (index < 0) {
        let index = -1 * this.paintedBoardRoundIndex;
        this.boardRoundData = await this.getJSONFile(`/story/roundpre${index}.json`);
        this.updateBoardRoundData(true);
      }
    } else
      this.updateBoardRoundData(true);
  }
  applyBoardAction(boardAction) {
    if (boardAction.action === 'parentChange') {
      let asset = this.staticBoardObjects[boardAction.sourceId];
      if (asset) {
        asset.parent = this.staticBoardObjects[boardAction.targetId];
      }
    }
    if (boardAction.action === 'init') {
      this.applyInitRoundAction(boardAction);
    }
  }
  async loadReplay(startAutomation = false) {
    this.overrideDisplayRound = this.menuTab3D.selectedReplayRound;
    this.paintBoard();
  }
  get visibleRound() {
    if (this.overrideDisplayRound !== null)
      return this.overrideDisplayRound;

    return this.gameData.turnNumber;
  }

  updateBoardRoundData(reset) {
    if (!this.boardRoundData)
      return;

    if (reset) {
      this.boardResetRoundData.actions.forEach(meta => {
        if (meta.action === 'init') {
          this.applyInitRoundAction(meta);
        }
      });

      this.boardRoundData.actions.forEach((action, i) => {
        if (action.when === 'init')
          this.applyBoardAction(action);
      });

      this.roundCurrentSequenceIndex = -1;
    }

    this.iterateBoardRoundSequence();
  }
  async iterateBoardRoundSequence(reset) {
    if (reset)
      this.roundActionRunning = false;
    if (this.roundActionRunning)
      return;
    if (this.roundCurrentSequenceIndex === undefined)
      return;

    let actionIndex = this.roundCurrentSequenceIndex + 1;

    if (actionIndex < this.boardRoundData.actions.length) {
      this.roundActionRunning = true;
      this.roundCurrentSequenceIndex = actionIndex;
      let action = this.boardRoundData.actions[actionIndex];
      console.log(action);
      if (action.action === 'playCard')
        await this.animatedRoundAction(action);
      else {
        //apply
       this.applyBoardAction(action);
      }
      this.roundActionRunning = false;
      this.iterateBoardRoundSequence();
    }
  }
  initListenGameRound(roundIndex) {
    if (this.gameRoundSubscription) {
      this.gameRoundSubscription();
      this.gameRoundSubscription = null;
    }
    if (roundIndex < 0)
      return;

    let roundPath = `Games/${this.currentGame}/rounds/${roundIndex}`;
    this.gameRoundSubscription = firebase.firestore().doc(roundPath)
      .onSnapshot(async (doc) => {
        let data = doc.data();
        if (!data) {
          this.sendRoundAction('init');
          return;
        }
        this.boardRoundData = data;
        this.updateBoardRoundData();
      });
  }
  async sendRoundAction(roundAction, cardIndex = -1, cardDetails = null, targetId = null, sourceId = null, originId = null) {
    let body = {
      gameId: this.currentGame,
      action: 'roundType',
      roundAction,
      roundIndex: this.gameData.turnNumber,
      cardIndex,
      cardDetails,
      targetId,
      sourceId,
      originId
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

  async discardCard(cardIndex) {

  }
  async playCard(cardIndex) {
    let cardDetails = this.actionCards[cardIndex];
    await this.sendRoundAction('playCard', cardIndex, cardDetails, this.selectedAsset.id,
      cardDetails.gameCard, this.activeMoon.assetMeta.id);
  }
  async animatedRoundAction(actionDetails) {
    await this.rocketHelper.shootRocket(actionDetails.sourceId, actionDetails.targetId, actionDetails.originId);
    this.landProbe(actionDetails.sourceId, actionDetails.targetId);
  }
  applyInitRoundAction(meta) {
    let asset = this.staticBoardObjects[meta.sourceId];
    if (asset) {
      if (meta.parent === null)
        asset.parent = null;
      else if (meta.parent !== undefined) {
        this.landProbe(meta.sourceId, meta.parent);
      }
      asset.setEnabled(true);
    }
  }

  clearAnimations(probeId) {
    let asset = this.staticBoardObjects[probeId];
    let meta = asset.assetMeta;
    if (meta.orbitAnimation) {
      meta.orbitAnimation.stop();
      meta.orbitPivot.animations = [];
      meta.orbitAnimation = null;
    }
    if (meta.rotationAnimation) {
      meta.rotationAnimation.stop();
      meta.rotationPivot.animations = [];
      meta.rotationAnimation = null;
    }

    return asset;
  }
  landProbe(probeId, targetId) {
    this.clearAnimations(probeId);
    let asset = this.staticBoardObjects[probeId];
    asset.parent = this.parentPivot(targetId);
    let parentAsset = this.staticBoardObjects[targetId];

    let orbitRadius = 1.5;
    let startRatio = 0;
    if (parentAsset.assetMeta.objectType === 'planet') {
      asset.assetMeta.orbitPivot.position.y = 3;
      U3D.sizeNodeToFit(asset.baseMesh, 2);
      if (asset.assetMeta.objectType === 'moon') {
        startRatio = asset.assetMeta.startRatio;
        orbitRadius = asset.assetMeta.orbitRadius;
      }
    } else {
      asset.assetMeta.orbitPivot.position.y = 2;
      orbitRadius = 1.5;
      U3D.sizeNodeToFit(asset.baseMesh, 1);
    }

    let orbitPivot = U3D.addOrbitPivot({
      id: probeId,
      orbitDirection: 1,
      orbitRadius,
      startRatio,
      orbitTime: 60000
    }, this.scene, asset.assetMeta.orbitPivot);
    asset.assetMeta.orbitAnimation = orbitPivot.orbitAnimation;
  }
}
