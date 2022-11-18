import BaseApp from '/models/baseapp.js';
import GameCards from '/models/gamecards.js';

export class StoryApp extends BaseApp {
  constructor() {
    super();
    this.apiType = 'story';

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

    this.avatars = [];
    let gizmoManager = new BABYLON.GizmoManager(
      this.scene
    );
    //gizmoManager.positionGizmoEnabled = true;
    this.loadStaticMesh("/match/deckmedia/", "sun.glb", .001, -7.7721, 1, 0);
    this.loadStaticMesh("/match/deckmedia/", "mercury.glb", .001, -3.2281, 1, 0);
    this.loadStaticMesh("/match/deckmedia/", "venus.glb", .001, 1.2962, 1, 0);
    this.loadStaticMesh("/match/deckmedia/", "earth.glb", .001, 4, 1, 0);
    this.loadStaticMesh("/match/deckmedia/", "mars.glb", .001, 8.544, 1, 0);
    this.loadAvatarMesh("/match/deckmedia/", "male1.glb", 2, 0, 0, 1);
    this.loadAvatarMesh("/match/deckmedia/", "male2.glb", 1, 0, 0, 2);
    this.loadAvatarMesh("/match/deckmedia/", "male3.glb", 1, 0, 0, 3);
    this.loadAvatarMesh("/match/deckmedia/", "male4.glb", 1, 0, 0, 4);
    this.loadAvatarMesh("/match/deckmedia/", "male5.glb", 1, 0, 0, 5);
    this.loadAvatarMesh("/match/deckmedia/", "male6.glb", 1, 0, 0, 6);
    this.loadAvatarMesh("/match/deckmedia/", "male7.glb", 1, 0, 0, 7);
    this.loadAvatarMesh("/match/deckmedia/", "male8.glb", 1, 0, 0, 8);
    this.loadAvatarMesh("/match/deckmedia/", "female1.glb", 2, 0, 0, -1);
    this.loadAvatarMesh("/match/deckmedia/", "female2.glb", 1, 0, 0, -2);
    this.loadAvatarMesh("/match/deckmedia/", "female3.glb", 1, 0, 0, -3);
    this.loadAvatarMesh("/match/deckmedia/", "female4.glb", 1, 0, 0, -4);
    this.loadAvatarMesh("/match/deckmedia/", "female5.glb", 1, 0, 0, -5);
    this.loadAvatarMesh("/match/deckmedia/", "female6.glb", 1, 0, 0, -6);
    this.loadAvatarMesh("/match/deckmedia/", "female7.glb", 1, 0, 0, -7);
    this.loadAvatarMesh("/match/deckmedia/", "female8.glb", 1, 0, 0, -8);

    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
          if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh != this.env.ground) {
            this.pointerDown(pointerInfo.pickInfo.pickedMesh)
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
  }
  pointerDown(pickedMesh) {
    let mesh = pickedMesh;
    while (mesh.parent !== null) {
      mesh = mesh.parent;
    }

    let meshIndex = this.avatars.indexOf(mesh);
    if (meshIndex !== -1) {
      if (mesh.localRunning) {
        mesh.localRunning = false;
        mesh.modelAnimationGroup.stop();
      } else {
        mesh.localRunning = true;
        mesh.modelAnimationGroup.start();
      }
    }
  }
  async loadAvatarMesh(path, file, scale, x, y, z) {
    let result1 = await BABYLON.SceneLoader.ImportMeshAsync(null, "/match/deckmedia/avatar-walk.glb", null, this.scene);
    let animationGLB = result1.meshes[0];
    animationGLB.position = new BABYLON.Vector3(x, y, z);
    result1.animationGroups[0].stop();

    let result2 = await BABYLON.SceneLoader.ImportMeshAsync(null, path, file);

    let mesh = result2.meshes[0];

    mesh.scaling.x = scale;
    mesh.scaling.y = scale;
    mesh.scaling.z = scale;

    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;

    mesh.isPickable = true;

    this.avatars.push(mesh);

    const modelTransformNodes = mesh.getChildTransformNodes();
    const modelAnimationGroup = result1.animationGroups[0].clone("clone", (oldTarget) => {
      return modelTransformNodes.find((node) => node.name === oldTarget.name);
    });
    modelAnimationGroup.start();
    mesh.modelAnimationGroup = modelAnimationGroup;
    mesh.localRunning = true;

    modelAnimationGroup.loopAnimation = true;
    animationGLB.dispose();
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
  }

}
