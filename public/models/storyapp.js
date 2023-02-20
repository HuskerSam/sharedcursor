import BaseApp from '/models/baseapp.js';
import U3D from '/models/utility3d.js';
import MenuTab3D from '/models/menutab.js';
import Asteroid3D from '/models/asteroid3d.js';
import Avatar3D from '/models/avatar3d.js';
import HelpSlate from '/models/helpslate.js';
import ChatSlate from '/models/chatslate.js';
import ChannelSpeech from '/models/channelspeech.js';
import ChannelAction from '/models/channelaction.js';

export class StoryApp extends BaseApp {
  constructor() {
    super();
    this.apiType = 'story';
    this.cache = {};
    this.staticBoardObjects = {};
    this.staticNavigationMeshes = [];
    this._paintedBoardTurn = null;
    this.minimumPrequel = -5;

    this.initGameOptionsPanel();
    this._initMenuBar2D();

    this.alertErrors = false;
  }

  startEngine() {
    if (this.engine3DStarted)
      return;
    this.engine3DStarted = true;
    this.engine.runRenderLoop(() => {
      this.scene.render();

      if (this.activeFollowMeta && this.xr.baseExperience.state === 3 && this.activeFollowMeta.basePivot) {
        let position = new BABYLON.Vector3(0, 0, 0);
        position.copyFrom(this.activeFollowMeta.basePivot.getAbsolutePosition());
        position.y += 4;

        let mX = position.x - this.scene.activeCamera.position.x;
        let mZ = position.z - this.scene.activeCamera.position.z;

        let movementVector = new BABYLON.Vector3(mX, 0, mZ);

        this.scene.activeCamera.position.addInPlace(movementVector);
        this.scene.activeCamera.target.addInPlace(movementVector);
      }

      if (this.inXR) {
        this.updateMenuBarShowWebXR();
      }
    });
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

    this.menu_bar_toggle = document.querySelector('.menu_bar_toggle');
    this.menu_bar_toggle.addEventListener('click', e => document.body.classList.toggle('menu_bar_expanded'));
  }
  async _initContent3D() {
    let startTime = new Date();
    this.sceneTransformNode = new BABYLON.TransformNode('sceneBaseNodeForScale', this.scene);
    this.gui3DManager = new BABYLON.GUI.GUI3DManager(this.scene);

    this.createMenu3DWrapper();
    this.scene.collisionsEnabled = false;
    this.menuTab3D = new MenuTab3D(this);
    this.asteroidHelper = new Asteroid3D(this);
    this.helpSlateHelper = new HelpSlate(this);
    this.chatSlateHelper = new ChatSlate(this);
    this.invisibleMaterial = new BABYLON.StandardMaterial("invisiblematerial", this.scene);
    this.invisibleMaterial.alpha = 0;

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
      this.asteroidHelper.loadAsteroids(),
      Recast()
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
    this.channelSpeechHelper = new ChannelSpeech(this);
    this.actionChannelHelper = new ChannelAction(this);

    let delta = new Date().getTime() - startTime.getTime();
    console.log('init3D', delta);
    this.addLineToLoading(`${delta} ms to load 3D content<br>`);

    this.paintedBoardTurn = this.turnNumber;
    this.startEngine();

    this.enterNotInXR();

    this.paintGameData();
  }
  createMenu3DWrapper() {
    this.menuBarTransformNode = new BABYLON.TransformNode('menuBarTransformNode', this.scene);

    this.menuBarTabButtonsTN = new BABYLON.TransformNode('menuBarTabButtonsTN', this.scene);
    this.menuBarTabButtonsTN.parent = this.menuBarTransformNode;

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
    const scaleMesh = await U3D.loadStaticMesh(scene, meta.containerPath, meta);
    let boundingMesh = scaleMesh;
    U3D.sizeNodeToFit(scaleMesh, meta.sizeBoxFit);
    if (!meta.texturePath) {
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
      let localMeta = meta;
      let localOuterPivot = outerPivot;
      setTimeout(() => {
        localMeta.assetSymbolPanel = U3D.addSymbolPanel(localMeta, scene);
        localMeta.assetSymbolPanel.parent = localOuterPivot;
      }, 1000);
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
      this.staticBoardObjects[name].parent = this.parentMeshForId(meta.parent);
    } else
      this.staticBoardObjects[name].parent = sceneParent;

    if (['planet', 'star'].indexOf(meta.objectType) !== -1) {
      let radius = meta.navRadius ? meta.navRadius : meta.sizeBoxFit * 0.5 + 0.5;
      let navDisc = BABYLON.MeshBuilder.CreateDisc('navmeshdisc_' + meta.id, {
        radius,
        tessellation: 512
      }, this.scene);
      if (meta.x !== undefined)
        navDisc.position.x = meta.x;
      navDisc.position.y = 0.75;
      if (meta.z !== undefined)
        navDisc.position.z = meta.z;

      navDisc.rotation.x = Math.PI / 2;
      navDisc.setEnabled(false);
      this.staticNavigationMeshes.push(navDisc);
    }

    return this.staticBoardObjects[name];
  }
  parentMeshForId(id) {
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
            window.location = "/";
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
    if (gameDoc) this.gameData = gameDoc.data();
    if (!this.gameData) return;
    this._initGameDataBasedContent();
    if (!this.engine3DStarted) return;

    this.queryStringPaintProcess();
    this.paintOptions();

    this._updateGameMembersList();
    this.paintDock();
    this.paintBoard();

    if (this.gameData.mode !== this.previousMode)
      this.matchBoardRendered = false;
    this.previousMode = this.gameData.mode;

    let phase = "select";
    if (this.gameData.turnPhase)
      phase = this.gameData.turnPhase;

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
    if (!this.inXR)
      return;

    let leftShow = false;
    let rightShow = false;
    if (this.leftHandedControllerGrip) {
      let rotation = this.leftHandedControllerGrip.rotationQuaternion.toEulerAngles();
      leftShow = (rotation.z > 0.7 || rotation.z < -1.5);
    }
    if (this.rightHandedControllerGrip) {
      let rotation = this.rightHandedControllerGrip.rotationQuaternion.toEulerAngles();
      rightShow = (rotation.z > 1.5 || rotation.z < -0.7);
    }
    let show = (leftShow || rightShow);

    if (this.menuBarVisible !== show) {
      if (leftShow) {
        this.menuBarTabButtonsTN.position = U3D.v(this.menuTab3D.optionBarWidth, 0, 5);
        this.menuBarTransformNode.parent = null;// this.leftHandedControllerGrip;
        this.activeControllerGrip = this.leftHandedControllerGrip;
      } else if (rightShow) {
        this.menuBarTabButtonsTN.position = U3D.v(-this.menuTab3D.optionBarWidth, 0, 5);
        this.menuBarTransformNode.parent = null;//this.rightHandedControllerGrip;
        this.activeControllerGrip = this.rightHandedControllerGrip;
      }

      this.menuBarVisible = show;
      this.menuBarTransformNode.setEnabled(show);
    }

    if (this.menuBarVisible) {
      //this.menuBarTabButtonsTN.billboardMode = BABYLON.TransformNode.BILLBOARDMODE_Z + BABYLON.TransformNode.BILLBOARDMODE_Y
      //let cameraPos = U3D.v(this.app.scene.activeCamera.position.x, 1, this.app.scene.activeCamera.position.z)

      let cameraPos = this.scene.activeCamera.position;
      let controllerPos = this.activeControllerGrip.position;
      //console.log('cpos', controllerPos);
      this.menuBarTransformNode.position = controllerPos;
      this.menuBarTransformNode.lookAt(cameraPos, Math.PI, 0, 0);
    }
  }
  enterXR() {
    super.enterXR();
    this.inXR = true;
    this.menuBarTransformNode.position = U3D.v(0, 0, 0);
    this.menuBarTransformNode.scaling = U3D.v(0.02, 0.02, 0.02);
    this.menuBarTransformNode.parent = null;

    this.menuTab3D.setSelectedAsset(this.menuTab3D.selectedObjectMeta);
  }
  enterNotInXR() {
    this.inXR = false;
    this.menuBarTransformNode.parent = this.browserScreenMenuTN;

    this.menuBarTransformNode.rotation = U3D.v(0, 0, 0);
    this.menuBarTransformNode.position = U3D.v(0, 4.05, 1.5);
    this.menuBarTransformNode.scaling = U3D.v(0.1, 0.1, 0.1);
    this.menuBarTabButtonsTN.position = U3D.v(0, 0, 0);
  }
  XRControllerAdded(model, handed) {
    if (handed === 'left') {
      this.leftHandedControllerGrip = model.grip;
      this.menuBarTransformNode.parent = model.grip;
      console.log(model)
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
    this.displayedNamePlate.billboardMode = BABYLON.TransformNode.BILLBOARDMODE_Y;
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
    await this.actionChannelHelper.updateAvatarPaths();
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

    this.paintBoard();
  }
  updateBoardRoundData(reset) {
    if (!this.boardRoundData)
      return;

    if (reset) {
      this.channelSpeechHelper.stopSound();

      this.boardResetRoundData.actions.forEach(roundAction => {
        if (roundAction.action === 'init') {
          this.applyInitRoundAction(roundAction);
        }
      });

      this.boardRoundData.actions.forEach((action, i) => {
        if (action.when === 'init')
          this.applyBoardAction(action);
      });

      this.roundCurrentSequenceIndex = -1;
    }

    this.iterateBoardRoundSequence();
    this.actionChannelHelper.updateCardsForPlayer();
  }
  async iterateBoardRoundSequence() {
    if (this.roundActionRunning)
      return;
    if (this.roundCurrentSequenceIndex === undefined)
      return;

    let actionIndex = this.roundCurrentSequenceIndex + 1;

    if (actionIndex < this.boardRoundData.actions.length) {
      this.roundActionRunning = true;
      this.roundCurrentSequenceIndex = actionIndex;
      let action = this.boardRoundData.actions[actionIndex];
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
    await this.channelSpeechHelper.addMessage(action.seatIndex, action.text, action.addAnimation);
  }

  async discardCard(cardIndex) {
    await this.sendRoundAction('recycleCard', cardIndex);
  }
  async playCard(cardIndex) {
    let cardDetails = this.actionCards[cardIndex];
    /*
    let avatarMeta = this.avatarMetas[this.activeSeatIndex];
    let fromName = this.activeMoon.assetMeta.name;
    let toName = this.selectedAsset.name;
    let text = `${avatarMeta.name} launches Atlas V rocket from ${fromName} to ${toName}`;
    */
    await this.sendRoundAction('playCard', cardIndex, cardDetails, this.selectedAsset.id,
      cardDetails.gameCard, this.activeMoon.assetMeta.id);
  }
  async animatedRoundAction(actionDetails) {
    this.actionChannelHelper.addAction(actionDetails);
  }
  applyInitRoundAction(actionDetails) {
    let asset = this.staticBoardObjects[actionDetails.sourceId];
    if (asset) {
      let enabled = true;
      if (actionDetails.parent === null) {
        asset.parent = null;
        if (asset.assetMeta.objectType === 'probe')
          enabled = false;
      } else if (actionDetails.parent !== undefined) {
        this.actionChannelHelper.resolveActionCard(actionDetails);
      }

      asset.setEnabled(enabled);
    }
  }
  updateGameMessagesFeed(snapshot) {
    this.lastMessagesSnapshot = snapshot;
    if (this.chatSlateHelper)
      this.chatSlateHelper.updateMessageFeed();
  }
  async sendGameMessage(message, seatIndex) {
    if (message === '') {
      return;
    }

    if (message.length > 1000)
      message = message.substr(0, 1000);

    let body = {
      gameNumber: this.currentGame,
      message,
      seatIndex
    };
    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + 'api/games/message', {
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
    return json;
  }
}
