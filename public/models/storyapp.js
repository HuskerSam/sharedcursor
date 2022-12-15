import BaseApp from '/models/baseapp.js';
import GameCards from '/models/gamecards.js';
import U3D from '/models/utility3d.js';
import MenuTab3D from '/models/menutab3d.js';
import Asteroid3D from '/models/asteroid3d.js';
import Avatar3D from '/models/avatar3d.js';

export class StoryApp extends BaseApp {
  constructor() {
    super();
    this.apiType = 'story';
    this.cache = {};
    this.staticAssetMeshes = {};

    this.initGameOptionsPanel();
    this._initMenuBar2D();

    this.alertErrors = false;
    this.debounceBusy = false;
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
    this.menu_bar_toggle.addEventListener('click', e => this.toggleMenuBar());

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
    this.sceneTransformNode = new BABYLON.TransformNode('sceneTransformNode', this.scene);
    this.asteroidHelper = new Asteroid3D(this);

    if (this.urlParams.get('showguides'))
      U3D.createGuides(this.scene);

    this.xr.baseExperience.camera.onBeforeCameraTeleport.add(() => {
      this.clearFollowMeta();
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
    let loadingResults = await Promise.all(promises);
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

      if (meta.noClick !== true) {
        meta.appClickable = true;
        meta.masterid = name;
        meta.clickCommand = 'customClick';
        meta.handlePointerDown = async (pointerInfo, mesh, meta) => {
          this.__pauseSpin(pointerInfo, mesh, meta);
        };
        meta.handlePointerMove = async (pointerInfo, mesh, meta) => {
          this.__pauseSpinMove(pointerInfo, mesh, meta);
        };
      }
    });

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

    this.menuBarLeftTN = new BABYLON.TransformNode('menuBarLeftTN', this.scene);
    this.menuBarLeftTN.position = U3D.v(1, 0.5, 1);
    this.menuBarLeftTN.scaling = U3D.v(0.3, 0.3, 0.3);
    this.menuBarLeftTN.billboardMode = 7;
    this.menuBarLeftTN.position.y = 4;

    this.menuBarRightTN = new BABYLON.TransformNode('menuBarRightTN', this.scene);
    this.menuBarRightTN.position = U3D.v(-5, 1, -5);
    this.menuBarRightTN.scaling = U3D.v(0.3, 0.3, 0.3);
    this.menuBarRightTN.billboardMode = 7;

    this.menuBarTabButtonsTN = new BABYLON.TransformNode('menuBarTabButtonsTN', this.scene);
    this.menuBarTabButtonsTN.parent = this.menuBarLeftTN;
    this.menuBarTabButtonsTN.position.y = -3;

    this.avatarHelper = new Avatar3D(this);
    this.menuTab3D = new MenuTab3D(this);

    await this.menuTab3D.initOptionsBar();
    await this.asteroidHelper.loadAsteroids(true);

    this.runRender = true;

    await this.avatarHelper.updateAvatarStatus();

    this.paintGameData();
  }
  async loadStaticAsset(name, sceneParent, profile, scene) {
    let meta = Object.assign({}, window.allStaticAssetMeta[name]);
    meta.extended = U3D.processStaticAssetMeta(meta, profile);

    if (meta.sizeBoxFit === undefined)
      meta.sizeBoxFit = 2;
    meta.containerPath = meta.extended.glbPath;
    let noShadow = meta.noShadow === true;
    let mesh = await U3D.loadStaticMesh(scene, meta.containerPath, meta.containerOnly, noShadow);
    if (meta.containerOnly)
      return {
        assetMeta: meta
      };

    U3D._fitNodeToSize(mesh, meta.sizeBoxFit);

    if (meta.wireframe) {
      mesh.material = this.asteroidHelper.selectedAsteroidMaterial;
      mesh.getChildMeshes().forEach(mesh => mesh.material = this.asteroidHelper.selectedAsteroidMaterial);
    }

    let meshPivot = new BABYLON.TransformNode('outerassetwrapper' + name, scene);
    mesh.parent = meshPivot;
    meta.basePivot = meshPivot;

    if (meta.symbol)
      meshPivot = U3D.infoPanel(name, meta, meshPivot, scene);

    if (meta.rotationTime)
      meshPivot = U3D.__rotationAnimation(name, meta, meshPivot, scene);
    if (meta.orbitTime)
      meshPivot = U3D.__orbitAnimation(name, meta, meshPivot, scene);

    meshPivot = U3D.positionPivot(name, meta, meshPivot, scene);

    meshPivot.assetMeta = meta;
    meshPivot.baseMesh = mesh;
    this.staticAssetMeshes[name] = meshPivot;

    let ___awaitAssetLoad = async (name) => {
      return new Promise((res, rej) => {
        let awaitInterval = setInterval(() => {
          if (this.staticAssetMeshes[name]) {
            clearInterval(awaitInterval);
            res(this.staticAssetMeshes[name]);
          }
        }, 50);
      });
    };

    if (meta.parent) {
      await ___awaitAssetLoad(meta.parent);
      if (meta.parentType === 'basePivot')
        meshPivot.parent = this.staticAssetMeshes[meta.parent].assetMeta.basePivot;
      else
        meshPivot.parent = this.staticAssetMeshes[meta.parent];
    } else
      meshPivot.parent = sceneParent;

    return this.staticAssetMeshes[name];
  }

  yButtonPress() {
    this.clearFollowMeta();
    this.aimCamera(this.cameraMetaX);
  }
  xButtonPress() {}
  bButtonPress() {
    this.setFollowMeta();
  }
  aButtonPress() {
    this.clearFollowMeta();
  }

  async _nextSkybox() {
    let index = this.menuTab3D.skyboxList().indexOf(this.profile.skyboxPath);
    if (index < this.menuTab3D.skyboxList().length - 1)
      index++
    else
      index = 0;
    this.profile.skyboxPath = this.menuTab3D.skyboxList()[index];
    this.initSkybox();

    let updatePacket = {
      skyboxPath: this.profile.skyboxPath
    };
    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).update(updatePacket);
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

  async asteroidCountChange(delta) {
    let asteroidCount = this.asteroidHelper.getAsteroidCount(this.profile.asteroidCount);
    asteroidCount = this.asteroidHelper.getAsteroidCount(asteroidCount + delta);

    let updatePacket = {
      asteroidCount
    };
    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).update(updatePacket);

    this.profile.asteroidCount = updatePacket.asteroidCount;
    this.asteroidHelper.loadAsteroids();
  }
  async asteroidChangeMaterial(wireframe, texture) {
    let updatePacket = {};

    if (wireframe !== null) {
      this.asteroidHelper.asteroidMaterial.wireframe = wireframe;
      updatePacket.asteroidWireframe = wireframe;
      this.profile.asteroidWireframe = wireframe;
    }
    if (texture !== null)
      updatePacket.asteroidTexture = texture;

    this.asteroidHelper.asteroidUpdateMaterial();

    await firebase.firestore().doc(`Users/${this.uid}`).set(updatePacket, {
      merge: true
    });
  }

  clearFollowMeta() {
    this.followMeta = null;
  }
  setFollowMeta() {
    //  this.aimCamera();
    this.followMeta = this.menuTab3D.lastClickMetaButtonCache;
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
  }

  toggleMenuBar() {
    document.body.classList.toggle('menu_bar_expanded');
  }
  addLineToLoading(str) {
    let div = document.createElement('div');
    div.innerHTML = str;
    this.loading_dynamic_area.appendChild(div);

    this.loading_dynamic_area.scrollIntoView(false);

    return div;
  }

  clickEndTurn() {
    this._endTurn();
  }
  clickStartGame() {

  }
  clickEndGame() {

  }

  meshToggleAnimation(meta, stop = false, mesh) {
    if (!stop) {
      this.menuTab3D.showBoardWrapper(meta);

      if (meta.rotationAnimation)
        meta.rotationAnimation.pause();

      if (meta.orbitAnimation)
        meta.orbitAnimation.pause();
    } else {
      this.menuTab3D.hideBoardWrapper(meta);

      if (meta.rotationAnimation && meta.rotationAnimation._paused)
        meta.rotationAnimation.restart();

      if (meta.orbitAnimation && meta.orbitAnimation._paused)
        meta.orbitAnimation.restart();
    }
  }

  debounce() {
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
    window.allStaticAssetMeta = await GameCards.loadDecks();
    await super.load();
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
    this.avatarHelper.updateSelectedSeatMesh();

    this.updateScoreboard();
  }
  paintDock() {
    super.paintDock();
    if (this.avatarHelper)
      this.avatarHelper.updateAvatarStatus();
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
  updateUserPresence() {
    super.updateUserPresence();
    if (this.avatarHelper)
      this.avatarHelper.updateUserPresence();
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
  updateScoreboard() {
    /*
        let seatIndex = this.gameData.currentSeat;

        let rgb = this.get3DColors(seatIndex);
        let str = rgb.r + ',' + rgb.g + "," + rgb.b;
        let backColor = U3D.colorRGB255(str);
        let color = seatIndex !== 3 ? "rgb(0,0,0)" : "rgb(255,255,255)";
        let nameTexture = U3D.__texture2DText(this.scene, "Scoreboard Status", color, backColor, 50);
        nameTexture.vScale = 1;
        nameTexture.uScale = 1;
        nameTexture.hasAlpha = true;
        this.scoreboardNameMaterial.diffuseTexture = nameTexture;
        this.scoreboardNameMaterial.ambientTexture = nameTexture;
        this.scoreboardNameMaterial.emissiveTexture = nameTexture;
    */
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

  enterXR() {
    this.menuBarLeftTN.position = U3D.v(0.05, 0.05, -0.05);
    this.menuBarLeftTN.scaling = U3D.v(0.02, 0.02, 0.02);
    this.menuBarLeftTN.parent = this.leftHandedControllerGrip;

    this.inXR = true;

    this.menuBarRightTN.position = U3D.v(0.05, 0.05, -0.05);
    this.menuBarRightTN.scaling = U3D.v(0.02, 0.02, 0.02);
    this.menuBarRightTN.parent = this.rightHandedControllerGrip;
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
      this.__pauseSpinMove(pointerInfo, this.menuTab3D.lastClickMeta)
    }
  }
  pointerUp(pointerInfo) {
    if (this.lastClickSpinPaused) {
      this.lastClickSpinPaused = false;
      if (this.menuTab3D.lastClickMeta) {
        this.menuTab3D.lastClickMeta.basePivot.rotation.copyFrom(this.menuTab3D.lastClickMeta.basePivot.originalRotation);
      }
    }
    if (this.menuTab3D.lastClickMeta) {
      this.meshToggleAnimation(this.menuTab3D.lastClickMeta, true, null);
      this.menuTab3D.lastClickMeta = null;
      return;
    }
  }
  __pauseSpin(pointerInfo, mesh, meta) {
    this.menuTab3D.setSelectedAsset(meta);

    this.lastClickMetaPointerX = this.scene.pointerX;
    this.lastClickMetaPointerY = this.scene.pointerY;
    this.lastClickSpinPaused = true;
    meta.basePivot.originalRotation = U3D.vector(meta.basePivot.rotation);

    this.meshToggleAnimation(meta, false, mesh);
  }
  __pauseSpinMove(pointerInfo, meta) {
    let dX = this.scene.pointerX - this.lastClickMetaPointerX;
    let dY = this.scene.pointerY - this.lastClickMetaPointerY;

    //debounce so doesn't shake in XR
    if (Math.abs(dX) + Math.abs(dY) < 8)
      return;

    meta.basePivot.rotation.y -= dX * 0.005;
    meta.basePivot.rotation.x -= dY * 0.005;
    this.lastClickMetaPointerX = this.scene.pointerX;
    this.lastClickMetaPointerY = this.scene.pointerY;
  }

}
