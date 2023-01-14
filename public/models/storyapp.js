import BaseApp from '/models/baseapp.js';
import U3D from '/models/utility3d.js';
import MenuTab3D from '/models/menutab.js';
import Asteroid3D from '/models/asteroid3d.js';
import Avatar3D from '/models/avatar3d.js';
import ActionCards from '/models/actioncards.js';
import Rocket3D from '/models/rocket3d.js';
import HelpSlate from '/models/helpslate.js';

export class StoryApp extends BaseApp {
  constructor() {
    super();
    this.apiType = 'story';
    this.cache = {};
    this.staticBoardObjects = {};
    this._paintedBoardTurn = null;
    this.minimumPrequel = -5;

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
    this.sceneTransformNode = new BABYLON.TransformNode('sceneBaseNodeForScale', this.scene);
    this.gui3DManager = new BABYLON.GUI.GUI3DManager(this.scene);

    this.createMenu3DWrapper();
    this.menuTab3D = new MenuTab3D(this);
    this.asteroidHelper = new Asteroid3D(this);
    this.rocketHelper = new Rocket3D(this);
    this.helpSlateHelper = new HelpSlate(this);
    this.invisibleMaterial = new BABYLON.StandardMaterial("invisiblematerial", this.scene);
    this.invisibleMaterial.alpha = 0;

    if (this.urlParams.get('showguides'))
      U3D.createGuides(this.scene);

    this.xr.baseExperience.camera.onBeforeCameraTeleport.add(() => {
      this.clearActiveFollowMeta();
    });

    this.addLineToLoading('Loading Assets...<br>');
    let promises = [];
    this.solarSystemDeck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, this.scene));
    });
    this.moonsDeck1.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, this.scene));
    });
    this.moonsDeck2.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, this.scene));
    });

    this.avatarHelper = new Avatar3D(this);
    let loadingResults;
    await Promise.all([
      this.avatarHelper.loadAndInitAvatars(),
      (loadingResults = await Promise.all(promises)),
      this.asteroidHelper.loadAsteroids()
    ]);

    this.playerMoonAssets = new Array(4);
    let loadingHTML = '';
    loadingResults.forEach(assetMesh => {
      let meta = assetMesh.assetMeta;

      if (meta.seatIndex !== undefined)
        this.playerMoonAssets[meta.seatIndex] = assetMesh;

      let normalLink = `<a href="${meta.extended.glbPath}" target="_blank">Asset</a>&nbsp;`;
      let imgHTML = meta.symbol ? `<img src="${meta.extended.symbolPath}" class="symbol_image">` : '';

      loadingHTML += `${meta.name}:
        &nbsp;
        ${normalLink}
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
    this.actionCardHelper = new ActionCards(this);

    let delta = new Date().getTime() - startTime.getTime();
    console.log('init3D', delta);
    this.addLineToLoading(`${delta} ms to load 3D content<br>`);

    this.paintedBoardTurn = this.turnNumber;

    this.enterNotInXR();

    this.runRender = true;
    this.paintGameData();
  }
  createMenu3DWrapper() {
    this.menuBarLeftTN = new BABYLON.TransformNode('menuBarLeftTN', this.scene);
    this.menuBarLeftTN.position = U3D.v(1, 5, 2);
    this.menuBarLeftTN.scaling = U3D.v(0.3, 0.3, 0.3);
    this.menuBarLeftTN.billboardMode = 0;

    this.menuBarShowWebXRInterval = setInterval(() => this.updateMenuBarShowWebXR(), 100);

    this.menuBarTabButtonsTN = new BABYLON.TransformNode('menuBarTabButtonsTN', this.scene);
    this.menuBarTabButtonsTN.parent = this.menuBarLeftTN;

    this.browserScreenMenuTN = new BABYLON.TransformNode("browserScreenMenuTN", this.scene);
    this.browserScreenMenuTN.position.x = 0;
    this.browserScreenMenuTN.position.y = -5.9;
    this.browserScreenMenuTN.position.z = 3.5;
    this.browserScreenMenuTN.parent = this.camera;
  }
  _processStaticAssetMeta(meta) {
    let glbPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.glbpath) + '?alt=media';
    let symbolPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.symbol) + '?alt=media';
    let texturePath = null;
    let specularPower = null;
    if (meta.texturePath) {
      texturePath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.texturePath) + '?alt=media';
      glbPath = null;
      if (meta.specularPower)
        specularPower = meta.specularPower;
    }
    let bumpPath = null;
    if (meta.bumpPath) {
      bumpPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.bumpPath) + '?alt=media';
    }

    return {
      symbolPath,
      texturePath,
      bumpPath,
      specularPower,
      glbPath
    };
  }
  async loadStaticAsset(name, sceneParent, scene, meta = null) {
    if (!meta) {
      meta = Object.assign({}, this.allStaticAssetMeta[name]);
      meta.extended = this._processStaticAssetMeta(meta);
    }

    if (meta.sizeBoxFit === undefined)
      meta.sizeBoxFit = 2;
    meta.containerPath = meta.extended.glbPath;
    let scaleMesh = await U3D.loadStaticMesh(scene, meta.containerPath, meta);
    let boundingMesh = scaleMesh;
    if (!meta.texturePath) {
      U3D.sizeNodeToFit(scaleMesh, meta.sizeBoxFit);
      let boundingInfo = scaleMesh.getHierarchyBoundingVectors(true);
      boundingMesh = new BABYLON.Mesh("boundingBoxselectedAsset" + meta.id, this.scene);
      boundingMesh.setBoundingInfo(new BABYLON.BoundingInfo(boundingInfo.min, boundingInfo.max));
      boundingMesh.isPickable = false;
      scaleMesh.parent = boundingMesh;
    }
    meta.boundingMesh = boundingMesh;
    scaleMesh.setEnabled(true);
    if (meta.wireframe) {
      scaleMesh.material = this.asteroidHelper.asteroidMaterial;
      scaleMesh.getChildMeshes().forEach(mesh => mesh.material = this.asteroidHelper.asteroidMaterial);
    }

    let meshPivot = new BABYLON.TransformNode('outerassetwrapper' + name, scene);
    boundingMesh.parent = meshPivot;
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
      this.camera.position = U3D.vector(locationMeta.position);
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
        .onSnapshot((doc) => {
          if (doc.data())
            this.paintGameData(doc);
          else {
            alert("Game doesn't exist");
            window.location = "/dashboard";
          }
        });
    }
  }
  async getJSONFile(path) {
    let response = await fetch(path);
    return await response.json();
  }
  async _loadDecks() {
    await Promise.all([
      this.solarSystemDeck = await this.readJSONFile(`/story/solarsystemdeck.json`),
      this.moonsDeck1 = await this.readJSONFile(`/story/moons1deck.json`),
      this.moonsDeck2 = await this.readJSONFile(`/story/moons2deck.json`)
    ]);

    let allCards = {};
    this.solarSystemDeck.forEach(card => allCards[card.id] = card);
    this.moonsDeck1.forEach(card => allCards[card.id] = card);
    this.moonsDeck2.forEach(card => allCards[card.id] = card);

    return allCards;
  }
  async load() {
    await Promise.all([
      this.allStaticAssetMeta = await this._loadDecks(),
      this.actionCards = await this.getJSONFile('/story/actioncards.json'),
      this.boardResetRoundData = await this.getJSONFile('/story/defaultround.json'),
      this.avatarMetas = await this.getJSONFile('/story/avatars.json')
    ]);
    await super.load();
  }

  get activeSeatIndex() {
    if (!this.gameData)
      return 0;
    if (this.paintedBoardTurn !== null) {
      let seatTurn = this.paintedBoardTurn;
      if (seatTurn < 0) {
        let turn = seatTurn % this.gameData.runningNumberOfSeats + 4;
        if (turn === 4)
          turn = 0;
        return turn;
      }

      return seatTurn % this.gameData.runningNumberOfSeats;
    }
    return this.gameData.currentSeat;
  }
  get activeMoon() {
    return this.playerMoonAssets[this.activeSeatIndex];
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

    if (!this.runRender)
      return;

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

    let name = this.gameData.name.replace(' Avenue', '').replace(' Street', '');
    this.game_header_panel.innerHTML = `${name}`;

    this.updateUserPresence();

    if (!this.avatarHelper || !this.avatarHelper.avatarsLoaded)
      return;

    document.body.classList.add('avatars_loaded');
  }
  get turnNumber() {
    if (!this.gameData)
      return 0;
    return this.gameData.turnNumber;
  }
  async paintDock() {
    super.paintDock();
    this.menuTab3D.updatePlayerDock();
  }
  updateUserPresence() {
    if (!this.avatarHelper || !this.avatarHelper.avatarsLoaded)
      return;

    super.updateUserPresence();
    this.menuTab3D.updateUserPresence();
  }

  updateMenuBarShowWebXR() {
    if (!this.inXR && this.menuBarVisible)
      return;

    if (this.inXR) {
      let leftShow = false;
      let rightShow = false;
      if (this.leftHandedControllerGrip) {
        let rotation = this.leftHandedControllerGrip.rotationQuaternion.toEulerAngles();
        leftShow = (rotation.z > 0.9 || rotation.z < -1.5);
      }
      if (this.rightHandedControllerGrip) {
        let rotation = this.rightHandedControllerGrip.rotationQuaternion.toEulerAngles();
        rightShow = (rotation.z > 1.5 || rotation.z < -0.9);
      }
      let show = (leftShow || rightShow);

      if (this.menuBarVisible !== show) {
        if (leftShow) {
          this.menuBarTabButtonsTN.position = U3D.v(this.menuTab3D.optionBarWidth, 0, 1);
          this.menuBarLeftTN.parent = this.leftHandedControllerGrip;
        }
        else if (rightShow) {
          this.menuBarTabButtonsTN.position = U3D.v(-this.menuTab3D.optionBarWidth, 0, 1);
          this.menuBarLeftTN.parent = this.rightHandedControllerGrip;
        }

        this.menuBarVisible = show;
        this.menuBarLeftTN.setEnabled(show);
      }
    } else {
      this.menuBarVisible = true;
      this.menuBarLeftTN.setEnabled(true);
    }
  }
  enterXR() {
    super.enterXR();
    this.menuBarLeftTN.position = U3D.v(0, 0, 0);
    this.menuBarLeftTN.scaling = U3D.v(0.02, 0.02, 0.02);
    this.menuBarLeftTN.parent = null;
    this.menuBarLeftTN.billboardMode = BABYLON.TransformNode.BILLBOARDMODE_Z + BABYLON.TransformNode.BILLBOARDMODE_Y;
    this.inXR = true;

    this.menuTab3D.setSelectedAsset(this.menuTab3D.selectedObjectMeta);
  }
  enterNotInXR() {
    this.menuBarLeftTN.position = U3D.v(0, 4.05, 1.5);
    this.menuBarLeftTN.scaling = U3D.v(0.1, 0.1, 0.1);
    this.menuBarLeftTN.parent = this.browserScreenMenuTN;
    this.menuBarLeftTN.billboardMode = 0;

    this.inXR = false;
  }
  XRControllerAdded(model, handed) {
    if (handed === 'left') {
      this.leftHandedControllerGrip = model.grip;
      this.menuBarLeftTN.parent = model.grip;
    }
    if (handed === 'right') {
      this.rightHandedControllerGrip = model.grip;
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

    if (meta.avatarType) {
      meta.basePivot.originalRotation = U3D.vector(meta.basePivot.rotation);
    } else if (meta.asteroidType) {
      meta.basePivot.originalRotation = this.getAbsoluteRotation(meta.basePivot);
    } else {
      meta.basePivot.originalRotation = U3D.vector(meta.basePivot.rotation);
    }


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
    } else if (meta.avatarType) {
      meta.basePivot.rotation.y -= dX * 0.005;
      meta.basePivot.rotation.x -= dY * 0.005;
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
        this.showAssetNamePlate(meta);

      if (meta.rotationAnimation)
        meta.rotationAnimation.pause();

      if (meta.orbitAnimation)
        meta.orbitAnimation.pause();

      if (meta.avatarType) {
        let avatarMeta = this.avatarMetas[meta.seatIndex];
        if (avatarMeta && avatarMeta.positionAnimation) {
          avatarMeta.positionAnimation.pause();
          avatarMeta.walkingAnimation.pause();
        }
      }

      if (meta.asteroidType) {
        meta.basePivot.material = this.asteroidHelper.selectedAsteroidMaterial;
      }

      if (!this.inXR) {
        this.camera.detachControl(this.canvas)
      }
    } else {
      if (!meta.activeSelectedObject)
        this.hideAssetNamePlate(meta);

      if (meta.rotationAnimation && meta.rotationAnimation._paused)
        meta.rotationAnimation.restart();

      if (meta.orbitAnimation && meta.orbitAnimation._paused)
        meta.orbitAnimation.restart();

      let avatarMeta = this.avatarMetas[meta.seatIndex];
      if (avatarMeta && avatarMeta.positionAnimation) {
        avatarMeta.positionAnimation.restart();
        avatarMeta.walkingAnimation.restart();
      }

      if (meta.asteroidType) {
        meta.basePivot.material = this.asteroidHelper.asteroidMaterial;
      }

      if (!this.inXR) {
        this.camera.attachControl(this.canvas);
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

    let color = U3D.color("0.8,0,0");
    switch (meta.objectType) {
      case 'moon':
        color = U3D.color("1,0.8,0.25");
      case 'planet':
        color = U3D.color("0.25,0.25,1");
      case 'dwarf':
        color = U3D.color("0.8,0.25,0.8");
      case 'nearearth':
        color = U3D.color("0.8,0.25,0.25");
      case 'star':
        color = U3D.color("0.8,0.8,0.8");
    }

    let yOffset = meta.yOffset !== undefined ? meta.yOffset : 1.25;
    if (meta.avatarType) {
      color = U3D.get3DColors(meta.seatIndex);
      yOffset = 2.25;
    }
    this.displayedNamePlate = U3D.addTextPlane(this.scene, nameDesc, color);
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
  yButtonPress() {
    this.clearActiveFollowMeta();
    this.aimCamera(this.cameraMetaX);
  }
  xButtonPress() {
    this.toggleXRMovementType();
    if (this.currentXRFeature)
      this.menuTab3D.toggleBtn.holographicButton.imageUrl = '/fontcons/teleport.png';
    else
      this.menuTab3D.toggleBtn.holographicButton.imageUrl = '/fontcons/fly.png';
  }
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

  get selectedAsset() {
    if (!this.menuTab3D)
      return {};
    return this.menuTab3D.selectedObjectMeta;
  }

  async paintBoard() {
    this.menuTab3D.updateRoundAndScoreStatus();
    if (this._renderedBoardTurn !== this.paintedBoardTurn) {
      this.boardTurnFirstLoad = true;
      this._renderedBoardTurn = this.paintedBoardTurn;
      this.initListenGameRound(this._renderedBoardTurn);

      let index = this._renderedBoardTurn;
      if (index < 0) {
        let index = -1 * this._renderedBoardTurn;
        this.boardRoundData = await this.getJSONFile(`/story/roundpre${index}.json`);
        this.updateBoardRoundData(true);
      }
    } else
      this.updateBoardRoundData();
    this.updateAvatarPaths();
    this.actionCardHelper.updateCardsForPlayer();
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
  get paintedBoardTurn() {
    if (this._paintedBoardTurn !== null)
      return this._paintedBoardTurn;

    return this.turnNumber;
  }
  set paintedBoardTurn(value) {
    let min = this.minimumPrequel;
    let max = this.turnNumber;
    this._paintedBoardTurn = value;
    if (this._paintedBoardTurn < min)
      this._paintedBoardTurn = min;
    if (this._paintedBoardTurn > max)
      this._paintedBoardTurn = max;

    if (this._paintedBoardTurn === max)
      this._paintedBoardTurn = null;

    if (this._paintedBoardTurn === null)
      this.boardTurnLabel = "Live " + (this.turnNumber + 1).toString();
    else if (this._paintedBoardTurn < 0)
      this.boardTurnLabel = "Prequel " + (-1 * this._paintedBoardTurn).toString();
    else
      this.boardTurnLabel = "History " + (this._paintedBoardTurn + 1).toString();

    this.paintBoard();
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
      else if (action.action === 'avatarMessage') {
        await this.boardActionAvatarMessage(action)
      } else {
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
        this.updateBoardRoundData(this.boardTurnFirstLoad);
        this.boardTurnFirstLoad = false;
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


  async boardActionAvatarMessage(action) {
    if (action.addAnimation) {
      let avatar = this.avatarHelper.initedAvatars[action.seatIndex];

      let aAnim;
      if (this.activeSeatIndex === action.seatIndex) {
        //is moving
        aAnim = avatar.animationGroups.find(n => n.name.indexOf(action.addAnimation + 'moving') !== -1);
        if (!aAnim) {
          let origAnim = avatar.animationGroups.find(n => n.name.indexOf(action.addAnimation) !== -1);
          aAnim = BABYLON.AnimationGroup.MakeAnimationAdditive(origAnim, origAnim.from, origAnim.to, true, origAnim.name + 'moving');
          avatar.animationGroups.push(aAnim);
        }
      } else {
        aAnim = avatar.animationGroups.find(n => n.name.indexOf(action.addAnimation) !== -1);
      }

      aAnim.setWeightForAllAnimatables(1);
      aAnim.start(false);
    }

    await this.avatarShowMessage(action.seatIndex, action.text, action.timeToShow, action.timeToBlock);
  }

  async discardCard(cardIndex) {

  }
  async playCard(cardIndex) {
    let cardDetails = this.actionCards[cardIndex];
    /*
    let avatarMeta = this.avatarMetas[this.activeSeatIndex];
    let fromName = this.activeMoon.assetMeta.name;
    let toName = this.selectedAsset.name;
    let text = `${avatarMeta.name} launches Atlas V rocket from ${fromName} to ${toName}`;
    this.avatarMessage(text);
    */
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
      let enabled = true;
      if (meta.parent === null) {
        asset.parent = null;
        if (asset.assetMeta.objectType === 'probe')
          enabled = false;
      } else if (meta.parent !== undefined) {
        this.landProbe(meta.sourceId, meta.parent);
      }

      asset.setEnabled(enabled);
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

  async avatarShowMessage(seatIndex, text, timeToShow = 10000, timeToBlock = 5000) {
    if (!this.avatarMetas[seatIndex].chatPanel) {
      let chatTN = new BABYLON.TransformNode('chattnfor' + seatIndex, this.scene);

      let chatBubbleMesh = BABYLON.MeshBuilder.CreatePlane('chatbubblefor' + seatIndex, {
        width: 5,
        height: 3
      }, this.scene);
      let mat = new BABYLON.StandardMaterial('chatbubblematfor' + seatIndex, this.scene);
      let texturePath = '/fontcons/chat' + seatIndex.toString() + '.svg';
      let tex = new BABYLON.Texture(texturePath, this.scene, false, false);
      tex.hasAlpha = true;
      mat.diffuseTexture = tex;
      mat.ambientTexture = tex;
      mat.emissiveTexture = tex;
      chatBubbleMesh.material = mat;
      chatBubbleMesh.position.x = -1.5;
      chatBubbleMesh.scaling = U3D.v(-1, 1, 1);
      chatBubbleMesh.rotation.x = Math.PI;
      chatBubbleMesh.parent = chatTN;
      chatBubbleMesh.isPickable = false;

      chatTN.position.y = 3.5;
      chatTN.rotation.y = Math.PI;
      chatTN.billboardMode = 7;
      chatTN.isPickable = false;

      chatTN.parent = this.avatarHelper.initedAvatars[seatIndex].avatarPositionTN;
      this.avatarMetas[seatIndex].chatPanel = chatTN;
      this.avatarMetas[seatIndex].chatBubble = chatBubbleMesh;
    }

    this._updateAvatarTextChat(seatIndex, text, true);

    this.avatarMetas[seatIndex].chatPanel.setEnabled(true);
    clearTimeout(this.avatarMetas[seatIndex].chatCloseTimeout);
    this.avatarMetas[seatIndex].chatCloseTimeout = setTimeout(() => {
      this.avatarMetas[seatIndex].chatPanel.setEnabled(false);
    }, timeToShow);

    await this.waitTime(timeToBlock);
  }
  async waitTime(time) {
    return new Promise((res, rej) => {
      setTimeout(() => res(), time);
    })
  }
  _updateAvatarTextChat(seatIndex, text, reset) {
    let avatarMeta = this.avatarMetas[seatIndex]
    clearTimeout(avatarMeta.chatTextTimer);

    if (reset) {
      this.avatarMessage(seatIndex, text);
      avatarMeta.avatarChatCurrentWords = 0;
    }
    avatarMeta.avatarChatCurrentWords++;

    let words = text.split(' ');
    if (words.length < avatarMeta.avatarChatCurrentWords)
      return;
    //words = words.slice(0, avatarMeta.avatarChatCurrentWords);

    if (avatarMeta.chatTextPlane) {
      avatarMeta.chatTextPlane.dispose(true, true);
      avatarMeta.chatTextPlane2.dispose(true, true);
      avatarMeta.chatTextPlane3.dispose(true, true);
    }

    let color = U3D.color('0,0,0');
    if (seatIndex > 2)
      color = U3D.color('1,1,1');

    let line1Words = words.slice(0, 4);
    let line1 = line1Words.join(' ');
    let chatTextPlane = U3D.addTextPlane(this.scene, line1, color);
    avatarMeta.chatTextPlane = chatTextPlane;
    chatTextPlane.parent = avatarMeta.chatBubble;
    chatTextPlane.position.z = -0.01;
    chatTextPlane.position.y = -0.6;
    chatTextPlane.rotation.x = Math.PI;
    chatTextPlane.scaling = U3D.v(0.5, 0.5, 0.5);

    let line2Show = avatarMeta.avatarChatCurrentWords > 4;
    let line2Words = words.slice(4, 8);
    let line2 = line2Words.join(' ');
    if (!line2Show)
      line2 = '';
    let chatTextPlane2 = U3D.addTextPlane(this.scene, line2, color);
    chatTextPlane2.parent = chatTextPlane;
    chatTextPlane2.position.y = -1.1;
    avatarMeta.chatTextPlane2 = chatTextPlane2;

    let line3Show = avatarMeta.avatarChatCurrentWords > 8;
    let line3Words = words.slice(8, 12);
    let line3 = line3Words.join(' ');
    if (!line3Show)
      line3 = '';
    let chatTextPlane3 = U3D.addTextPlane(this.scene, line3, color);
    chatTextPlane3.parent = chatTextPlane;
    chatTextPlane3.position.y = -2.2;
    avatarMeta.chatTextPlane3 = chatTextPlane3;

    avatarMeta.chatTextTimer = setTimeout(() => this._updateAvatarTextChat(seatIndex, text), 600);
  }
  async avatarMessage(seatIndex, text) {
    let avatarMeta = this.avatarMetas[seatIndex];

    let voiceName = avatarMeta.voiceName;
    let fileResult = await this.getMP3ForText(text, voiceName);
    let soundPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/' + encodeURIComponent(fileResult) + '?alt=media&fileext=.mp3';
    if (this.voiceSoundObject) {
      this.voiceSoundObject.stop();
      this.voiceSoundObject.dispose();
    }

    this.voiceSoundObject = new BABYLON.Sound("voiceSoundObject", soundPath, this.scene, null, {
      loop: false,
      autoplay: true
    });
    this.voiceSoundObject.attachToMesh(avatarMeta.chatBubble);
  }

  updateAvatarPaths() {
    if (!this.avatarHelper.initedAvatars)
      return;

    if (this.avatarPathsInited === this.activeSeatIndex)
      return;
    this.avatarPathsInited = this.activeSeatIndex;

    let path = this._generatePath();
    let pathWalkTime = 60000;
    let endFrame = pathWalkTime / 1000 * 60;
    let avatarPositionKeys = [];
    let avatarRotationKeys = [];

    let positions = path.positions;
    let positionCount = positions.length - 1;
    positions.forEach((value, index) => {
      avatarPositionKeys.push({
        frame: Math.floor(endFrame * index / positionCount),
        value
      });
    });

    let rotations = path.rotations;
    let rotationCount = rotations.length - 1;
    rotations.forEach((value, index) => {
      avatarRotationKeys.push({
        frame: Math.floor(endFrame * index / rotationCount),
        value
      });
    });

    this.avatarHelper.initedAvatars.forEach((avatar, seatIndex) => {
      let avatarMeta = this.avatarMetas[seatIndex];

      let positionTN = avatar.avatarPositionTN;
      if (avatarMeta.positionAnimation) {
        avatarMeta.positionAnimation.stop();
        avatarMeta.positionAnimation = null;
        avatarMeta.walkingAnimation = null;
      }
      positionTN.animations = [];

      if (seatIndex === this.activeSeatIndex) {
        let walkAnimName = avatarMeta.walkAnim;
        let wAnim = avatar.animationGroups.find(n => n.name.indexOf(walkAnimName) !== -1);

        wAnim.start(true);
        wAnim.setWeightForAllAnimatables(1);
        avatarMeta.walkingAnimation = wAnim;

        let positionAnim = new BABYLON.Animation(
          "avatarpositionTN" + seatIndex,
          "position",
          60,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        positionAnim.setKeys(avatarPositionKeys);
        positionTN.animations.push(positionAnim);

        let rotationAnim = new BABYLON.Animation(
          "avatarrotationTN" + seatIndex,
          "rotation",
          60,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        rotationAnim.setKeys(avatarRotationKeys);
        positionTN.animations.push(rotationAnim);

        avatarMeta.positionAnimation = this.scene.beginAnimation(positionTN, 0, endFrame, true);
        avatarMeta.positionAnimation.goToFrame(Math.floor(endFrame * seatIndex / 4));
      } else {
        avatar.avatarPositionTN.position.x = avatarMeta.x;
        avatar.avatarPositionTN.position.z = avatarMeta.z;
        avatar.animationGroups.forEach(anim => anim.stop());

        //avatar.skeletons[0].returnToRest();
        let aAnim = avatar.animationGroups.find(n => n.name.indexOf(avatarMeta.idlePose) !== -1);
        aAnim.start();
        aAnim.goToFrame(1);
        setTimeout(() => {
          aAnim.stop();
        }, 50);
      }

    });
  }


  _generatePath(keyPointsArray) {
    let y = 0;

    let xMin = -10;
    let xMax = 10;
    let zMin = -10;
    let zMax = 10;

    let keyPoints = [];
    let rotations = [];

    rotations.push(U3D.v(0, 0, 0));
    keyPoints.push(U3D.v4(xMax, y, 0, 1));

    keyPoints.push(U3D.v4(0, y, zMax, 100));
    rotations.push(U3D.v(0, -Math.PI / 2, 0));

    keyPoints.push(U3D.v4(xMin, y, 0, 100));
    rotations.push(U3D.v(0, -Math.PI, 0));

    keyPoints.push(U3D.v4(0, y, zMin, 100));
    rotations.push(U3D.v(0, -Math.PI * 3 / 2, 0));

    keyPoints.push(U3D.v4(xMax, y, 0, 99));
    rotations.push(U3D.v(0, -Math.PI * 2, 0));

    let curve = U3D.curvePointsMerge(keyPoints);
    let positions = curve.getPoints();

    return {
      positions,
      rotations
    };
  }
  showOptionalNote(str) {
    if (this.temporaryHelperNote)
      this.temporaryHelperNote.dispose(false, true);

    this.temporaryHelperNote = U3D.addTextPlane(this.scene, str, U3D.color('1,1,1'));
    this.temporaryHelperNote.parent = this.menuBarTabButtonsTN;
    this.temporaryHelperNote.scaling = U3D.v(1);
    this.temporaryHelperNote.position = U3D.v(-18, 4, 0);

  }
}
