import BaseApp from '/models/baseapp.js';
import GameCards from '/models/gamecards.js';

export class StoryApp extends BaseApp {
  constructor() {
    super();
    this.apiType = 'story';
    this.staticMeshes = [];
    this.cache = {};

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

    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
          if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh != this.env.ground) {
            this.pointerDown(pointerInfo.pickInfo.pickedMesh)
          }
          if (pointerInfo.pickInfo.pickedMesh === this.env.ground) {
            this.groundClick(pointerInfo);
          }
          break;
        case BABYLON.PointerEventTypes.POINTERUP:
          //this.pointerUp();
          break;
        case BABYLON.PointerEventTypes.POINTERMOVE:
          //this.pointerMove();
          break;
      }
    });

    this.settings_button = document.querySelector('.settings_button');
    this.settings_button.addEventListener('click', e => this.viewSettings());

    this.canvasDisplayModal = document.querySelector('#canvasDisplayModal');
    this.modal = new bootstrap.Modal(this.canvasDisplayModal);

    this.staticMeshes.push(this.env.ground);
    this.loadStaticScene();
  }
  async loadStaticScene() {
    await this.loadStaticMesh("/match/deckmedia/", "sun.glb", .002, -7.7721, 1, 0);
    await this.loadStaticMesh("/match/deckmedia/", "mercury.glb", .001, -3.2281, 1, 0);
    await this.loadStaticMesh("/match/deckmedia/venus.glb", "", .001, 1.2962, 1, 0);
    await this.loadStaticMesh("/match/deckmedia/earth.glb", "", .001, 4, 1, 0);
    await this.loadStaticMesh("/match/deckmedia/mars.glb", "", .001, 8.544, 1, 0);

    let mat1 = new BABYLON.StandardMaterial('mat1', this.scene);
    mat1.alpha = 0;

    let sunsphere = BABYLON.MeshBuilder.CreateSphere("sunsphere", {
      diameter: 2,
      segments: 16
    }, this.scene);
    sunsphere.material = mat1;
    sunsphere.position.x = -7.7721;
    sunsphere.position.y = 0;
    sunsphere.position.z = 0;

    let mercurysphere = BABYLON.MeshBuilder.CreateSphere("mercurysphere", {
      diameter: 1.1,
      segments: 16
    }, this.scene);
    mercurysphere.material = mat1;
    mercurysphere.position.x = -3.2281;

    let venussphere = BABYLON.MeshBuilder.CreateSphere("venussphere", {
      diameter: 1.2,
      segments: 16
    }, this.scene);
    venussphere.material = mat1;
    venussphere.position.x = 1.2962;

    let earthsphere = BABYLON.MeshBuilder.CreateSphere("earthsphere", {
      diameter: 1.2,
      segments: 16
    }, this.scene);
    earthsphere.material = mat1;
    earthsphere.position.x = 4;

    let marssphere = BABYLON.MeshBuilder.CreateSphere("marssphere", {
      diameter: 1.15,
      segments: 16
    }, this.scene);
    marssphere.material = mat1;
    marssphere.position.x = 8.544;

    this.navMesh = BABYLON.Mesh.MergeMeshes([sunsphere, mercurysphere, venussphere, earthsphere, marssphere]);

    await this.setupAgents();

    this.genGround = BABYLON.Mesh.CreateGround("ground1", 20, 20, 2, this.scene);
    this.genGround.position.y = -.05;
    let matdebug = new BABYLON.StandardMaterial('matdebug', this.scene);
    matdebug.diffuseColor = new BABYLON.Color3(0.1, 0.2, 1);
    this.genGround.material = matdebug;

    this.sceneInited = true;
    this.loadAvatars();
  }
  viewSettings() {
    this.modal.show();
  }
  async loadAvatars() {
    if (!this.sceneInited)
      return;
    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      if (seatIndex < this.runningSeatCount) {
        let key = 'seat' + seatIndex.toString();

        if (this.gameData[key]) {
          let name = this.gameData.memberNames[this.gameData[key]];
          if (!name) name = "Anonymous";
          let avatar = this.gameData.memberAvatars[this.gameData[key]];
          if (!avatar) avatar = "male1";

          let cacheValue = name + avatar;
          if (this['dockSeatCache' + seatIndex] !== cacheValue) {
            if (this['dockSeatMesh' + seatIndex])
              this['dockSeatMesh' + seatIndex].dispose();
            this['dockSeatCache' + seatIndex] = cacheValue;

            let mesh = await this.renderSeat(seatIndex, avatar, name, this.gameData[key]);
            this['dockSeatMesh' + seatIndex] = mesh;
            this['dockSeatMesh' + seatIndex].appClickable = true;
          }
        } else {
          if (this['dockSeatCache' + seatIndex] !== 'empty') {
            if (this['dockSeatMesh' + seatIndex])
              this['dockSeatMesh' + seatIndex].dispose();
            this['dockSeatCache' + seatIndex] = 'empty';
            this['dockSeatMesh' + seatIndex] = await this.createEmptySeat(seatIndex);
            this['dockSeatMesh' + seatIndex].appClickable = true;
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
    this.updateAgents();
  }
  pointerDown(mesh) {
    while (mesh && !mesh.appClickable) {
      mesh = mesh.parent;
    }

    if (!mesh || !mesh.appClickable)
      return;

    for (let seatIndex = 0; seatIndex < 4; seatIndex++) {
      if (this['dockSeatMesh' + seatIndex] === mesh) {
        if (this['dockSeatCache' + seatIndex] === 'empty') {
          this.dockSit(seatIndex);
        } else {
          if (mesh.avatarMesh.localRunning) {
            //mesh.avatarMesh.localRunning = false;
            //mesh.avatarMesh.modelAnimationGroup.pause();
          } else {
            //mesh.avatarMesh.localRunning = true;
            //mesh.avatarMesh.modelAnimationGroup.play();
          }
        }
      }
    }

    if (mesh.clickCommand === 'stand') {
      this._gameAPIStand(mesh.seatIndex);
    }

  }
  async loadStaticMesh(path, file, scale, x, y, z) {
    let result = await BABYLON.SceneLoader.ImportMeshAsync("", path, file);

    let mesh = result.meshes[0];

    mesh.scaling.x = scale;
    mesh.scaling.y = scale;
    mesh.scaling.z = scale;

    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;

    this.staticMeshes.push(mesh);
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
    await GameCards.loadDecks();
    await super.load();
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
  }
  async renderSeat(index, avatar, name, uid) {
    let colors = this.get3DColors(index);

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

    let mesh = await this.loadAvatarMesh(`/match/deckmedia/${avatar}.glb`, "", 1, 0, 0, 0);
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;
    mesh.parent = avatarWrapper;
    wrapper.avatarMesh = mesh;

    let circle = this.createCircle();
    circle.color = new BABYLON.Color3(colors.r, colors.g, colors.b);
    circle.position.y = .1;
    circle.parent = mesh;

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

    let isOwner = this.uid === this.gameData.createUser;
    if (this.uid === uid || isOwner) {
      let text = 'stand';
      let intensity = 5;
      if (this.uid !== uid && isOwner) {
        intensity = 0;
        text = 'boot';
      }
      let x3d = this.__createTextMesh('seattextX' + index, {
        text,
        fontFamily: 'monospace',
        size: 100,
        depth: .25
      });
      x3d.scaling.x = .08;
      x3d.scaling.y = .08;
      x3d.scaling.z = .08;
      x3d.position.y = 2.15;
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


    this.navigationAid(wrapper, mesh, index);
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
  async createEmptySeat(index) {
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

    let colors = this.get3DColors(index);
    this.meshSetVerticeColors(baseDisc, colors.r, colors.g, colors.b);

    return baseDisc;
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
      this.agents[agentInfos.agentIndex].avatarMesh.localRunning = false;
      this.agents[agentInfos.agentIndex].avatarMesh.modelAnimationGroup.pause();
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
  navigationAid(mesh, avatarMesh, index) {
    //let randomPos = this.navigationPlugin.getRandomPointAround(new BABYLON.Vector3(0, 0, 0), 0.2);
    let randomPos = this.get3DPosition(index);
    let transform = new BABYLON.TransformNode();
    let agentIndex = this.crowd.addAgent(randomPos, this.agentParams, transform);
    //mesh.parent = transform;
    this.agents.push({
      idx: agentIndex,
      trf: transform,
      mesh,
      target: new BABYLON.Vector3(0, 0, 0),
      avatarMesh
    });
  }
  groundClick(pointerInfo) {
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
    this.crowd.agentGoto(i, position);
    this.agents[i].avatarMesh.localRunning = true;
    this.agents[i].target.x = position.x;
    this.agents[i].target.y = position.y;
    this.agents[i].target.z = position.z;
    this.agents[i].stopped = false;

    this.agents[i].avatarMesh.modelAnimationGroup.play();

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
}
