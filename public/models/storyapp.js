import BaseApp from '/models/baseapp.js';
import GameCards from '/models/gamecards.js';
import U3D from '/models/utility3d.js';
import MenuTab3D from '/models/menutab3d.js';
import Asteroid3D from '/models/asteroid3d.js';

export class StoryApp extends BaseApp {
  constructor() {
    super();
    this.menuTab3D = new MenuTab3D(this);
    this.apiType = 'story';
    this.cache = {};
    this.staticAssetMeshes = {};
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

    this.asteroidOrbitTime = 300000;
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

  updateAsteroidLabel() {
    if (this.asteroidCountLabel)
      this.asteroidCountLabel.dispose();

    let count = Asteroid3D.getAsteroidCount(this.profile.asteroidCount);
    this.asteroidCountLabel = U3D.addTextPlane(this.scene, count.toString(), "asteroidCountLabel", "Impact", "", "#ffffff");
    this.asteroidCountLabel.parent = this.menuTab3D.meteorMenuTab;
    this.asteroidCountLabel.scaling = U3D.v(2, 2, 2);
    this.asteroidCountLabel.position.x = -5;
    this.asteroidCountLabel.position.y = 3;
    this.asteroidCountLabel.position.z = 1;
  }
  async randomizeAnimations() {
    if (this.initedAvatars === 'loading')
      return;

    if (!this.initedAvatars) {
      await this._loadAvatars();
      return;
    }

    this.initedAvatars.forEach(container => {
      let arr = container.animContainer.animationGroups;
      let index = Math.floor(Math.random() * arr.length);

      U3D.avatarSequence(container, index, this.scene);
    })
  }
  async asteroidCountChange(delta) {
    let asteroidCount = Asteroid3D.getAsteroidCount(this.profile.asteroidCount);
    asteroidCount = Asteroid3D.getAsteroidCount(asteroidCount + delta);

    let updatePacket = {
      asteroidCount
    };
    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).update(updatePacket);

    this.profile.asteroidCount = updatePacket.asteroidCount;
    Asteroid3D.loadAsteroids(this.scene, this);
    this.updateAsteroidLabel();
  }
  async _nextSkybox() {
    let index = this.menuTab3D.skyboxList().indexOf(this.profile.skyboxPath);
    if (index < this.menuTab3D.skyboxList().length - 1)
      index++
    else
      index = 0;
    this.profile.skyboxPath = this.menuTab3D.skyboxesList[index];
    window.App3D.initSkybox();

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

  clearFollowMeta() {
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

  async loadStaticScene() {
    this.sceneTransformNode = new BABYLON.TransformNode('sceneTransformNode', this.scene);

    let mats = U3D.asteroidMaterial(this.scene);
    window.asteroidMaterial = mats.material;
    window.selectedAsteroidMaterial = mats.selectedMaterial;

    this.addLineToLoading('Loading Assets...<br>');
    let promises = [];
    let deck = GameCards.getCardDeck('solarsystem');

    deck.forEach(card => {
      promises.push(U3D.loadStaticAsset(card.id, this.sceneTransformNode, this.profile, this.scene));
    });
    deck = GameCards.getCardDeck('moons1');
    deck.forEach(card => {
      promises.push(U3D.loadStaticAsset(card.id, this.sceneTransformNode, this.profile, this.scene));
    });
    deck = GameCards.getCardDeck('moons2');
    deck.forEach(card => {
      promises.push(U3D.loadStaticAsset(card.id, this.sceneTransformNode, this.profile, this.scene));
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

      if (meta.seatIndex !== undefined)
        this.seatMeshes[meta.seatIndex] = assetMesh;
      if (meta.noClick !== true && !meta.loadDisabled) {
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
      U3D.createGuides(this.scene);

    this.initCameraToolbar();

    this.menuBarLeftTN = new BABYLON.TransformNode('menuBarLeftTN', this.scene);
    this.menuBarLeftTN.position = U3D.v(-10, 1, -10);
    this.menuBarLeftTN.scaling = U3D.v(0.3, 0.3, 0.3);
    this.menuBarLeftTN.billboardMode = 7;

    this.menuBarRightTN = new BABYLON.TransformNode('menuBarRightTN', this.scene);
    this.menuBarRightTN.position = U3D.v(-15, 1, -15);
    this.menuBarRightTN.scaling = U3D.v(0.3, 0.3, 0.3);
    this.menuBarRightTN.billboardMode = 7;

    this.menuBarTabButtonsTN = new BABYLON.TransformNode('menuBarTabButtonsTN', this.scene);
    this.menuBarTabButtonsTN.parent = this.menuBarLeftTN;
    this.menuBarTabButtonsTN.position.y = 10;

    await this.menuTab3D.initOptionsBar();

    this.sceneInited = true;

    this.loadAvatars();
    Asteroid3D.loadAsteroids(this.scene, this);

    this.paintGameData();
    this.verifyLoaddingComplete = setInterval(() => {
      if (!this.runRender)
        this.paintGameData();
      else
        clearInterval(this.verifyLoaddingComplete);
    }, 400);
  }
  async _loadAvatars() {
    if (this.initedAvatars)
      return;
    this.initedAvatars = 'loading';
    let result = await U3D._initAvatars(this.scene);
    this.initedAvatars = result.initedAvatars;
    this.avatarContainers = result.avatarContainers;

    this.randomizeAnimations();
  }

  showItemNamePanel(meta) {
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
    this.showItemNamePanel(meta);
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
        let cacheValue = data.name + data.image + data.seated.toString();
        if (!this['dockSeatMesh' + seatIndex]) {
          let mesh = await this.renderSeat(seatIndex);

          mesh.parent = this.playerMoonPanelTab;

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

  async _updateLastClickMeta(assetMeta) {
    this.lastClickMeta = assetMeta;
    this.lastClickMetaButtonCache = this.lastClickMeta;

    let desc = assetMeta.name.replace('.obj', '');

    if (this.selectedContainerTransform)
      this.selectedContainerTransform.dispose();

    this.selectedContainerTransform = new BABYLON.TransformNode('selectedContainerTransform', this.scene);
    this.selectedContainerTransform.parent = this.focusPanelTab;
    this.selectedContainerTransform.position.y = 2.5;

    let result = window.staticMeshContainer[assetMeta.containerPath].instantiateModelsToScene();
    let mesh = result.rootNodes[0];
    mesh.parent = this.selectedContainerTransform;
    let factor = 0.7;
    if (this.inXR)
      factor *= 0.2;
    U3D._fitNodeToSize(this.selectedContainerTransform, factor);
    if (assetMeta.asteroidType)
      mesh.material = window.selectedAsteroidMaterial;

    U3D.setTextMaterial(this.scene, this.selectedAssetNameMat, desc);
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

  clickEndTurn() {
    this._endTurn();
  }
  clickStartGame() {

  }
  clickEndGame() {

  }

  meshToggleAnimation(meta, stop = false, mesh) {
    if (!stop) {
      this.showBoardWrapper(meta);

      if (meta.rotationAnimation)
        meta.rotationAnimation.pause();

      if (meta.orbitAnimation)
        meta.orbitAnimation.pause();
    } else {
      this.hideBoardWrapper(meta);

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

    let seatMesh = this.seatMeshes[seatIndex];
    this.currentSeatMesh = seatMesh;

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

    let name3d = U3D.__createTextMesh('seattext' + index, {
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
        U3D.meshSetVerticeColors(this.scene.meshes[i], colors.r, colors.g, colors.b);
    }

    U3D.meshSetVerticeColors(name3d, colors.r, colors.g, colors.b);
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
      let x3d = U3D.__createTextMesh('seattextX' + index, {
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
          U3D.meshSetVerticeColors(this.scene.meshes[i], intensity, intensity, intensity);
      }

      U3D.meshSetVerticeColors(x3d, intensity, intensity, intensity);
      x3d.parent = mesh;
      x3d.assetMeta = {
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this._gameAPIStand(index);
        }
      };
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
      //    this.renderSeatText(seat, index);
      await this.renderSeatAvatar(seat, seat.avatarWrapper, index);
    } else {
      let baseDisc = U3D.__createTextMesh("emptyseat" + index.toString(), {
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
        seatIndex: index,
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.dockSit(index);
        }
      };

      let colors = this.get3DColors(index);
      U3D.meshSetVerticeColors(baseDisc, colors.r, colors.g, colors.b);
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
  _initSizePanel() {
    let buttonBarTransform = new BABYLON.TransformNode('assetPanelButtonTN', this.scene);

    let normalSizeButton = BABYLON.MeshBuilder.CreatePlane('assetPanelNormalSizeButton', {
      height: 0.25,
      width: 1.65,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    normalSizeButton.material = new BABYLON.StandardMaterial('assetPanelNormalSizeButtonMat', this.scene);
    U3D.setTextMaterial(this.scene, normalSizeButton.material, 'Normal', 'rgb(255, 255, 255)', 'transparent', 180);
    normalSizeButton.parent = buttonBarTransform;
    this.assetPanelNormalButton = normalSizeButton;

    let handlePointerDown = async (pointerInfo, mesh, meta) => {
      normalSizeButton.setEnabled(false);
      this.updateAssetSize('normal', this.lastClickMetaButtonCache);
    };

    normalSizeButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown
    };

    let hugeSizeButton = BABYLON.MeshBuilder.CreatePlane('assetPanelHugeSizeButton', {
      height: 0.25,
      width: 1.65,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    hugeSizeButton.material = new BABYLON.StandardMaterial('assetPanelHugeSizeButtonMat', this.scene);
    U3D.setTextMaterial(this.scene, hugeSizeButton.material, 'Huge', 'rgb(255, 255, 255)', 'transparent', 180);
    hugeSizeButton.parent = buttonBarTransform;
    this.assetPanelHugeButton = hugeSizeButton;

    hugeSizeButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
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
    U3D.setTextMaterial(this.scene, smallSizeButton.material, 'Small', 'rgb(255, 255, 255)', 'transparent', 180);
    smallSizeButton.parent = buttonBarTransform;
    this.assetSmallSizeButton = smallSizeButton;

    smallSizeButton.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
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
      if (size === 'huge')
        meta.containerPath = meta.extended.largeGlbPath;
      if (size === 'normal')
        meta.containerPath = meta.extended.normalGlbPath;
      if (size === 'small')
        meta.containerPath = meta.extended.smallGlbPath;

      let freshMesh = await U3D.loadStaticMesh(this.scene, meta.containerPath);
      freshMesh.parent = this.staticAssetMeshes[id].baseMesh.parent;
      U3D._fitNodeToSize(freshMesh, meta.sizeBoxFit);
      this.staticAssetMeshes[id].baseMesh.dispose();
      this.staticAssetMeshes[id].baseMesh = freshMesh;
    }

    let moonIndex = ['e1_luna', 'ceres', 'j5_io', 'eris'].indexOf(id);
    if (moonIndex !== -1) {
      this.loadMoonButton(moonIndex);
    }

    await this.updateProfileMeshOverride(id, size);

    this.staticAssetMeshes[id].assetMeta.extended = U3D.processStaticAssetMeta(this.staticAssetMeshes[id].assetMeta, this.profile);
    this._updateLastClickMeta(this.staticAssetMeshes[id].assetMeta);
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
    if (this.lastClickMeta && this.lastClickSpinPaused) {
      this.__pauseSpinMove(pointerInfo, this.lastClickMeta)
    }
  }
  pointerUp(pointerInfo) {
    if (this.lastClickSpinPaused) {
      this.lastClickSpinPaused = false;
      if (this.lastClickMeta) {
        this.lastClickMeta.basePivot.rotation.copyFrom(this.lastClickMeta.basePivot.originalRotation);
      }
    }
    if (this.lastClickMeta) {
      this.meshToggleAnimation(this.lastClickMeta, true, null);
      this.lastClickMeta = null;
      return;
    }
  }
  __pauseSpin(pointerInfo, mesh, meta) {
    this.lastClickMeta = meta;
    this.lastClickMetaButtonCache = this.lastClickMeta;

    this.lastClickMetaPointerX = this.scene.pointerX;
    this.lastClickMetaPointerY = this.scene.pointerY;
    this.lastClickSpinPaused = true;
    meta.basePivot.originalRotation = U3D.vector(meta.basePivot.rotation);

    this.meshToggleAnimation(meta, false, mesh);
    this._updateLastClickMeta(this.lastClickMetaButtonCache);
  }
  __pauseSpinMove(pointerInfo, meta) {
    let dX = this.scene.pointerX - this.lastClickMetaPointerX;
    let dY = this.scene.pointerY - this.lastClickMetaPointerY;

    //debounce so doesn't shake in XR
    if (Math.abs(dX) + Math.abs(dY) < 5)
      return;

    meta.basePivot.rotation.y -= dX * 0.01;
    meta.basePivot.rotation.x -= dY * 0.01;
    this.lastClickMetaPointerX = this.scene.pointerX;
    this.lastClickMetaPointerY = this.scene.pointerY;
  }
}
