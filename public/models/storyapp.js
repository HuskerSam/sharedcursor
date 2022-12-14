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
  async loadStaticScene() {
    this.sceneTransformNode = new BABYLON.TransformNode('sceneTransformNode', this.scene);

    this.xr.baseExperience.camera.onBeforeCameraTeleport.add(() => {
      this.clearFollowMeta();
    });

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

    if (this.urlParams.get('showguides'))
      U3D.createGuides(this.scene);

    this.initCameraToolbar();

    this.menuBarLeftTN = new BABYLON.TransformNode('menuBarLeftTN', this.scene);
    this.menuBarLeftTN.position = U3D.v(1, 0.5, 1);
    this.menuBarLeftTN.scaling = U3D.v(0.3, 0.3, 0.3);
    this.menuBarLeftTN.billboardMode = 7;

    this.menuBarRightTN = new BABYLON.TransformNode('menuBarRightTN', this.scene);
    this.menuBarRightTN.position = U3D.v(-5, 1, -5);
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

  initCameraToolbar() {
    this.buttonOneRed = document.querySelector('.choice-button-one');
    this.buttonOneRed.addEventListener('click', e => this.aButtonPress());
    this.buttonTwo = document.querySelector('.choice-button-two');
    this.buttonTwo.addEventListener('click', e => this.bButtonPress());
    this.buttonThree = document.querySelector('.choice-button-three');
    this.buttonThree.addEventListener('click', e => this.xButtonPress());
    this.buttonFour = document.querySelector('.choice-button-four');
    this.buttonFour.addEventListener('click', e => this.yButtonPress());
  }
  viewSettings() {
    this.modal.show();
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
    this.profile.skyboxPath = this.menuTab3D.skyboxList()[index];
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


  async _loadAvatars() {
    if (this.initedAvatars)
      return;
    this.initedAvatars = 'loading';
    let result = await U3D._initAvatars(this.scene);
    this.initedAvatars = result.initedAvatars;
    this.avatarContainers = result.avatarContainers;

    this.randomizeAnimations();
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

          mesh.parent = this.menuTab3D.playerMoonPanelTab;

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
      let color =  (this.uid !== uid && isOwner) ? "#ffffff" : '#000000';
      let standBtn = U3D.addTextPlane(this.scene, "X", 'seattextX' + index, "Impact", "", color);
      standBtn.scaling = U3D.v(2, 2, 2);
      standBtn.position.x = 0.4;
      standBtn.position.y = 1.9;
      standBtn.parent = mesh;
      standBtn.assetMeta = {
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

    if (seat.standButton) {
      seat.standButton.dispose();
      seat.standButton = null;
    }

    if (seatData.seated) {
      await this.renderSeatAvatar(seat, seat.avatarWrapper, index);
    } else {
      let colors = this.get3DColors(index);
      let rgb = U3D.colorRGB255(colors.r + ',' + colors.g + ',' + colors.b);

      let standBtn = U3D.addTextPlane(this.scene, "Sit", 'seatsitbtn' + index, "Arial", "", rgb);
      standBtn.position.y = 1;
      standBtn.assetMeta = {
        seatIndex: index,
        appClickable: true,
        clickCommand: 'customClick',
        handlePointerDown: async (pointerInfo, mesh, meta) => {
          this.dockSit(index);
        }
      };

      standBtn.parent = seat;
      seat.standButton = standBtn;
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
