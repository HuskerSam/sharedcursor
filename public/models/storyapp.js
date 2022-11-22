import BaseApp from '/models/baseapp.js';
import GameCards from '/models/gamecards.js';

export class StoryApp extends BaseApp {
  constructor() {
    super();
    this.apiType = 'story';
    this.cache = {};
    this.staticAssetMeshes = {};

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

    this.initBabylonEngine(".popup-canvas", true);

    this.dockDiscRadius = .6;

    this.settings_button = document.querySelector('.settings_button');
    this.settings_button.addEventListener('click', e => this.viewSettings());

    this.canvasDisplayModal = document.querySelector('#canvasDisplayModal');
    this.modal = new bootstrap.Modal(this.canvasDisplayModal);

    this.menu_bar_toggle = document.querySelector('.menu_bar_toggle');
    this.menu_bar_toggle.addEventListener('click', e => this.toggleMenuBar());
  }
  toggleMenuBar() {
    document.body.classList.toggle('menu_bar_expanded');
  }
  async loadStaticScene() {
    let staticWrapper = BABYLON.MeshBuilder.CreateBox('staticwrapper', {
      width: .01,
      height: .01,
      depth: .01
    }, this.scene);
    staticWrapper.visibility = 0;

    let mat1 = new BABYLON.StandardMaterial('mat1alpha', this.scene);
    mat1.alpha = 0;
    this.mat1alpha = mat1;

    this.staticNames = ['sun', 'mercury', 'venus', 'earth', 'mars',
      'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'ceres', 'eris',
      'makemake', 'haumea', 'arrokoth', 'itokawa', 'bennu', 'eros'
    ];
    this.orbitNames = ['moon_luna', 'moon_deimos', 'moon_phobos', 'moon_europa',
    'moon_io', 'moon_ganymede', 'moon_callisto', 'moon_titan', 'moon_encedulas',
    'moon_miranda', 'moon_titania', 'moon_charon', 'moon_tethys', 'moon_lapetus',
  'moon_hyperion', 'moon_mimas', 'moon_lander', 'moon_buggy'];

    let navMeshes = [];
    let promises = [];
    this.staticNames.forEach(name => {
      promises.push(this.loadStaticAsset(name, staticWrapper, true));
      if (this.allCards[name].noNavMesh !== true)
        navMeshes.push(this.loadStaticNavMesh(name));
    });
    await Promise.all(promises);

    this.orbitNames.forEach(name => {
      this.loadStaticAsset(name, staticWrapper);
      if (this.allCards[name].noNavMesh !== true)
        navMeshes.push(this.loadStaticNavMesh(name));
    });

    this.navMesh = BABYLON.Mesh.MergeMeshes(navMeshes);
    this.navMesh.material = this.mat1alpha;

    await this.setupAgents();

    this.sceneInited = true;
    this.loadAvatars();
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
  async loadStaticAsset(name, parent, clickToPause = false) {
    let meta = this.allCards[name];

    let mesh;
    if (meta.texturepath) {
      mesh = BABYLON.MeshBuilder.CreateSphere('meshtexture' + name, {
        diameter: meta.diameter
      }, this.scene);

      let m = new BABYLON.StandardMaterial('meshtexturemat' + name, this.scene);
      let t = new BABYLON.Texture(meta.texturepath, this.scene);
      t.vScale = 1;
      t.uScale = 1;
      m.diffuseTexture = t;
      m.specularPower = 32;

      if (!meta.bumppath)
        meta.bumppath = meta.texturepath;
      if (meta.bumppath) {
        let b = new BABYLON.Texture(meta.bumppath, this.scene);
        b.vScale = 1;
        b.uScale = 1;
        m.bumpTexture = b;
      }

      m.emissiveColor = new BABYLON.Color3(1, 1, 1);
      m.emissiveTexture = new BABYLON.Texture(meta.texturepath, this.scene);

      mesh.material = m;
    } else {
      mesh = await this.loadStaticMesh(meta.glbpath, '', meta.glbscale, 0, 0, 0);
    }
    let outer_wrapper = BABYLON.MeshBuilder.CreateBox('outerassetwrapper' + name, {
      width: .01,
      height: .01,
      depth: .01
    }, this.scene);
    outer_wrapper.visibility = 0;

    let wrapper = BABYLON.MeshBuilder.CreateBox('assetwrapper' + name, {
      width: .01,
      height: .01,
      depth: .01
    }, this.scene);
    wrapper.visibility = 0;
    wrapper.parent = outer_wrapper;
    mesh.parent = wrapper;

    outer_wrapper.position.x = meta.x;
    outer_wrapper.position.y = meta.y;
    outer_wrapper.position.z = meta.z;

    if (meta.parent) {
      let orbit_wrapper = BABYLON.MeshBuilder.CreateBox('assetwrapperorbit' + name, {
        width: .01,
        height: .01,
        depth: .01
      }, this.scene);
      orbit_wrapper.visibility = 0;
      orbit_wrapper.parent = this.staticAssetMeshes[meta.parent];

      outer_wrapper.parent = orbit_wrapper;
      outer_wrapper.position.z = meta.z;
      outer_wrapper.position.x = meta.x;

      if (meta.clickToPause) {
        orbit_wrapper.appClickable = true;
        orbit_wrapper.clickToPause = clickToPause;
        orbit_wrapper.clickCommand = 'pauseSpin';
      }


      let orbitAnimation = new BABYLON.Animation(
        "staticorbitmeshrotation" + name,
        "rotation",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      //At the animation key 0, the value of scaling is "1"
      let x = outer_wrapper.rotation.x;
      let y = outer_wrapper.rotation.y;
      let z = outer_wrapper.rotation.z;
      let orbitkeys = [];
      let endFrame = meta.spintime / 1000 * 30;
      orbitkeys.push({
        frame: 0,
        value: new BABYLON.Vector3(x, y, z)
      });

      orbitkeys.push({
        frame: endFrame,
        value: new BABYLON.Vector3(x, y + -2 * Math.PI, z)
      });


      orbitAnimation.setKeys(orbitkeys);
      if (!orbit_wrapper.animations)
        orbit_wrapper.animations = [];
      orbit_wrapper.animations.push(orbitAnimation);
      orbit_wrapper.spinAnimation = this.scene.beginAnimation(orbit_wrapper, 0, endFrame, true);
    } else {
      if (clickToPause) {
        outer_wrapper.appClickable = true;
        outer_wrapper.clickToPause = clickToPause;
        outer_wrapper.clickCommand = 'pauseSpin';
      }
      outer_wrapper.parent = parent;
    }

    if (meta.freeOrbit) {
      let orbit_wrapper = BABYLON.MeshBuilder.CreateBox('assetwrapper' + name, {
        width: .01,
        height: .01,
        depth: .01
      }, this.scene);
      orbit_wrapper.visibility = 0;
      orbit_wrapper.parent = this.staticAssetMeshes[meta.parent];

      outer_wrapper.parent = orbit_wrapper;
      outer_wrapper.position.z = meta.orbitRadius;


      outer_wrapper.position.x = 0;
      outer_wrapper.position.y = 0;
      //      outer_wrapper.position.z =0;

      orbit_wrapper.position.x = meta.x;
      orbit_wrapper.position.y = meta.y;
      orbit_wrapper.position.z = meta.z;
      //outer_wrapper.position.x = meta.x;
      //outer_wrapper.position.z = meta.z;

      let orbitAnimation = new BABYLON.Animation(
        "staticorbitmeshrotation" + name,
        "rotation",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      //At the animation key 0, the value of scaling is "1"
      let x = outer_wrapper.rotation.x;
      let y = outer_wrapper.rotation.y;
      let z = outer_wrapper.rotation.z;
      let orbitkeys = [];
      let endFrame = meta.spintime / 1000 * 30;
      orbitkeys.push({
        frame: 0,
        value: new BABYLON.Vector3(x, y, z)
      });

      let factor = -2;
      if (meta.spindirection === -1)
        factor = 2;

      orbitkeys.push({
        frame: endFrame,
        value: new BABYLON.Vector3(x, y + factor * Math.PI, z)
      });


      orbitAnimation.setKeys(orbitkeys);
      if (!orbit_wrapper.animations)
        orbit_wrapper.animations = [];
      orbit_wrapper.animations.push(orbitAnimation);
      outer_wrapper.spinAnimation = this.scene.beginAnimation(orbit_wrapper, 0, endFrame, true);
    }

    this.staticAssetMeshes[name] = outer_wrapper;

    if (meta.showSymbol) {
      let size = meta.diameter / 4;
      let symbolMesh1 = BABYLON.MeshBuilder.CreatePlane('symbolshow1' + name, {
        height: size,
        width: size
      }, this.scene);
      let symbolMesh3 = BABYLON.MeshBuilder.CreatePlane('symbolshow3' + name, {
        height: size,
        width: size
      }, this.scene);

      let m = new BABYLON.StandardMaterial('symbolshowmat' + name, this.scene);
      let t = new BABYLON.Texture(meta.symbol, this.scene);
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
      symbolMesh1.parent = wrapper;
      symbolMesh1.rotation.y = 0;
      symbolMesh1.position.y = meta.diameter / 1.25 + extraY;
      symbolMesh3.material = m;
      symbolMesh3.parent = wrapper;
      symbolMesh3.rotation.y = Math.PI;
      symbolMesh3.position.y = meta.diameter / 1.25 + extraY;
    }

    this.shadowGenerator.addShadowCaster(mesh, true);

    if (meta.enableMusic) {
      let music = new BABYLON.Sound("music", meta.mp3file, this.scene, null, {
        loop: true,
        autoplay: true,
        spatialSound: true,
        distanceModel: "exponential",
        rolloffFactor: 2
      });
      music.attachToMesh(mesh);
    }

    if (meta.spintime) {
      let spinAnimation = new BABYLON.Animation(
        "staticmeshrotation" + name,
        "rotation",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      //At the animation key 0, the value of scaling is "1"
      let x = wrapper.rotation.x;
      let y = wrapper.rotation.y;
      let z = wrapper.rotation.z;
      let keys = [];
      let endFrame = meta.spintime / 1000 * 30;
      let spindirection = meta.spindirection === -1 ? 2 : -2;
      if (meta.parent) {
        wrapper.rotation.y = meta.ry;
      }
      if (meta.spinrotationz) {
        z = z + Math.PI / -2;
        keys.push({
          frame: 0,
          value: new BABYLON.Vector3(x, y, z)
        });

        keys.push({
          frame: endFrame,
          value: new BABYLON.Vector3(x + spindirection * Math.PI, y, z)
        });

      } else {
        keys.push({
          frame: 0,
          value: new BABYLON.Vector3(x, y, z)
        });

        keys.push({
          frame: endFrame,
          value: new BABYLON.Vector3(x, y + spindirection * Math.PI, z)
        });
      }

      if (!meta.parent) {
        spinAnimation.setKeys(keys);
        if (!wrapper.animations)
          wrapper.animations = [];
        wrapper.animations.push(spinAnimation);
        let anim = this.scene.beginAnimation(wrapper, 0, endFrame, true);
        if (!meta.freeOrbit)
          outer_wrapper.spinAnimation = anim;
      }
    }
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
      this[prefix + 'particleSystem'].activeParticleCount = 200000;
    } else {
      this[prefix + 'particleSystem'] = new BABYLON.ParticleSystem("particles", 50000, this.scene);
    }

    this[prefix + 'particleSystem'].emitRate = 1000;
    // this[prefix + 'particleSystem'].particleEmitterType = new BABYLON.BoxParticleEmitter(1);
    this[prefix + 'particleSystem'].particleTexture = new BABYLON.Texture("/match/deckmedia/flare.png", this.scene);

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

    this.avatarsLoaded = true;
  }
  pointerUp(mesh, pointerInfo) {
    if (!mesh)
      return;

    if (mesh.clickCommand === 'pauseSpin') {
      if (mesh.spinAnimation._paused)
        mesh.spinAnimation.restart();
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

      this.lastMesh = mesh;
      mesh.spinAnimation.pause();
    }

  }
  async loadStaticMesh(path, file, scale, x, y, z, invert = -1) {
    let result = await BABYLON.SceneLoader.ImportMeshAsync("", path, file);

    let mesh = result.meshes[0];

    mesh.scaling.x = invert * scale;
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

    if (this.loadStaticScene)
      this.loadStaticScene();
  }

  paintDock() {
    super.paintDock();

    this.loadAvatars();
  }
  paintGameData(gameDoc = null) {
    if (gameDoc)
      this.gameData = gameDoc.data();

    if (!this.gameData)
      return;

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

    this.updateUserPresence();
    this.updateAgents();

    if (this.avatarsLoaded)
      setTimeout(() => {
        this.runRender = true;
        document.body.classList.add('avatars_loaded');
      }, 100);
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
    let mesh = await this.loadAvatarMesh(`/match/deckmedia/${avatar}.glb`, "", 1, 0, 0, 0);
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;
    mesh.parent = avatarWrapper;
    wrapper.avatarMesh = mesh;
    this.shadowGenerator.addShadowCaster(wrapper.avatarMesh, true);

    let circle = this.createCircle();
    circle.color = new BABYLON.Color3(colors.r, colors.g, colors.b);
    circle.position.y = .1;
    circle.parent = mesh;

    let particlePivot = BABYLON.Mesh.CreateBox("pivotseat" + index, .001, this.scene);
    particlePivot.position.x = 0;
    particlePivot.position.y = 1;
    particlePivot.position.z = 2;
    particlePivot.rotation.x = -1 * Math.PI / 2;
    particlePivot.material = this.mat1alpha;
    wrapper.particleSystem = this.createParticleSystem(particlePivot, 'seat' + index);
    particlePivot.parent = wrapper;

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
      this.renderSeatText(seat, index);
      await this.renderSeatAvatar(seat, seat.avatarWrapper, index);
    } else {
      let baseDisc = BABYLON.MeshBuilder.CreateDisc("emptyseat" + index.toString(), {
        radius: this.dockDiscRadius,
        //    tessellation: 9,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
      }, this.scene);

      let position = this.get3DPosition(index);
      baseDisc.position.x = position.x;
      baseDisc.position.y = position.y;
      baseDisc.position.z = position.z;

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
    let x = 0,
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
    textWrapperMesh.isVisible = false;
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
        seat.avatarMesh.modelAnimationGroup.pause();
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

    //    BABYLON.Engine.audioEngine.unlock();

    let startingPoint = pointerInfo.pickInfo.pickedPoint;
    if (startingPoint) {
      let agents = this.crowd.getAgents();
      let closest = this.navigationPlugin.getClosestPoint(startingPoint);

      for (let i = 0; i < agents.length; i++) {
        let key = 'seat' + i.toString();
        if (this.gameData[key] === this.uid)
          this.updateSeatPosition(i, closest);
      }
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
      seat.avatarMesh.modelAnimationGroup.play();
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
}
