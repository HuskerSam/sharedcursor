import Utility from '/models/utility.js';
import U3D from '/models/utility3d.js';

export class BaseApp {
  constructor() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      this.deferredPWAInstallPrompt = e;
    });
    if ('serviceWorker' in navigator)
      navigator.serviceWorker.register('/sw.js');

    this.projectId = firebase.app().options.projectId;
    this.basePath = `https://us-central1-${this.projectId}.cloudfunctions.net/`;
    if (window.location.hostname === 'localhost')
      this.basePath = `http://localhost:5001/${this.projectId}/us-central1/`;

    this.urlParams = new URLSearchParams(window.location.search);
    if (this.urlParams.get('instrumentation'))
      this.instrumentationOn = true;

    this.muted = false;

    this.night_mode_toggle = document.querySelector('.night_mode_toggle');
    if (this.night_mode_toggle)
      this.night_mode_toggle.addEventListener('click', e => this.nightModeToggle(e));

    this.mute_button = document.querySelector('.mute_button');
    if (this.mute_button)
      this.mute_button.addEventListener('click', e => this.muteClick(e));

    firebase.auth().onAuthStateChanged(u => this.authHandleEvent(u));
    this.signInWithURL();

    this.apiType = 'invalid';
    this.userPresenceStatus = {};
    this.userPresenceStatusRefs = {};

    this.lastMessageId = null;

    document.addEventListener('visibilitychange', e => {
      this.refreshOnlinePresence()
    });

    setInterval(() => {
      let timeSinceElements = document.querySelectorAll('.time_since_updatable');
      timeSinceElements.forEach(ele => {
        let d = new Date(ele.dataset.timesince);
        let html = this.timeSince(d);

        if (ele.innerHTML !== html)
          ele.innerHTML = html;
      });
    }, 10000);


    this.load();
  }
  async load() {
    this.authUpdateStatusUI();
    if (this.loadCallback)
      this.loadCallback();
  }
  async readJSONFile(path) {
    try {
      let response = await fetch(path);
      return await response.json();
    } catch (e) {
      console.log('ERROR with download of ' + path, e);
      return {};
    }
  }
  authUpdateStatusUI() {
    let html = '';
    document.body.classList.add('loaded');
    if (this.fireToken) {
      html = 'Profile';

      if (document.body.dataset.creator === this.uid)
        document.body.classList.add('user_editable_record');
    } else {
      html = 'Sign In';
    }
    if (this.profile_status_label)
      this.profile_status_label.innerHTML = html;

    if (this.profile) {
      this.updateNightModeStatus(this.profile.nightModeState);
      this.updateUserStatus();
      this.updateMute(this.profile.muteState);
    }
  }
  async authHandleEvent(user) {
    //ignore unwanted events
    if (user && this.uid === user.uid) {
      return;
    }
    if (user) {
      this.fireUser = user;
      this.uid = this.fireUser.uid;
      this.fireToken = await user.getIdToken();

      await this._authInitProfile();

      try {
        let loginResult = await firebase.auth().getRedirectResult();
        if (loginResult.operationType === 'signIn') {
          window.location = '/'
        }
      } catch (error) {
        alert(error.message);
        console.log('loginerror', error)
      }
    } else {
      this.fireToken = null;
      this.fireUser = null;
      this.uid = null;
      document.body.classList.remove('app_signed_in');
      document.body.classList.add('app_signed_out');
      this.authUpdateStatusUI();
    }

    return;
  }
  async _authInitProfile() {
    this.profileSubscription = firebase.firestore().doc(`Users/${this.uid}`)
      .onSnapshot(async snapshot => {
        this.profileInited = true;
        this.profile = snapshot.data();
        if (!this.profile) {

          if (!this.fireUser.isAnonymous) {
            let result = await firebase.auth().fetchSignInMethodsForEmail(this.fireUser.email);

            //user was deleted dont create new profile
            if (result.length < 1)
              return;
          }

          await this._authCreateDefaultProfile();
        }

        if (this.fireUser.isAnonymous)
          document.body.classList.add('signed_in_anonymous');

        document.body.classList.add('app_signed_in');
        document.body.classList.remove('app_signed_out');

        this.authUpdateStatusUI();
      });
  }
  async _authCreateDefaultProfile() {
    this.profileLogos = await this.readJSONFile(`/profile/logos.json`);
    let displayImage = '';
    if (this.profileLogos) {
      let keys = Object.keys(this.profileLogos);
      let index = Math.floor(Math.random() * keys.length);
      let key = keys[index];
      displayImage = this.profileLogos[key];
    }
    this.profile = {
      points: 0,
      locationTrack: false,
      displayName: Utility.generateName(),
      displayImage,
      displayAvatar: Utility.generateAvatarName()
    };

    await firebase.firestore().doc(`Users/${this.uid}`).set(this.profile);
  }
  logAvatarFunction() {
    console.log(Utility.generateAvatarName());
  }

  updateUserStatus() {}
  async updateProfileAudioMode(ctl, index, e) {
    let mute = false;
    if (index === 0)
      mute = true;
    let updatePacket = {
      muteState: mute
    };
    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).update(updatePacket);
  }
  async updateProfileNightMode(ctl, index, e) {
    let updatePacket = {
      nightModeState: index
    };
    this.updateNightModeStatus(index);
    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).update(updatePacket);
  }
  updateNightModeStatus(state = 0) {
    let nite = false;
    if (state === 2)
      nite = true;
    if (state === 0)
      if (new Date().getHours() < 8 || new Date().getHours() > 18)
        nite = true;
    this.nightModeCurrent = nite;

    if (nite)
      document.body.classList.add('night_mode');
    else
      document.body.classList.remove('night_mode');
  }
  nightModeToggle(e) {
    let niteMode = 2;
    if (this.nightModeCurrent)
      niteMode = 1;
    this.updateNightModeStatus(niteMode);
    this.updateProfileNightMode(null, niteMode, null);
    e.preventDefault();
    return true;
  }
  async updateMute(muted) {
    let update = false;
    if (this.muted !== muted) {
      update = true;
      this.muted = muted;
    }
    if (!this.mute_button)
      return;

    if (muted) {
      this.mute_button.children[0].innerHTML = 'volume_off';

      muted = true;
    } else {
      this.mute_button.children[0].innerHTML = 'volume_up';
      muted = false;
    }
    if (this.profile && update) {
      let updatePacket = {
        muteState: muted
      };
      await firebase.firestore().doc(`Users/${this.uid}`).update(updatePacket);
    }
  }
  async authGoogleSignIn(e) {
    this.provider = new firebase.auth.GoogleAuthProvider();
    this.provider.setCustomParameters({
      'display': 'popup'
    });
    await firebase.auth().signInWithRedirect(this.provider);
  }
  async signInAnon(e) {
    e.preventDefault();
    await firebase.auth().signInAnonymously();
  }
  async signInByEmail(e) {
    let email = '';
    if (this.login_email)
      email = this.login_email.value;

    if (!email) {
      alert("A valid email is required for sending a link");
      return;
    }
    let actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true
    };

    await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);

    window.localStorage.setItem('emailForSignIn', email);
    alert('Email Sent');
  }
  signInWithURL() {
    if (!firebase.auth().isSignInWithEmailLink)
      return;
    if (firebase.auth().isSignInWithEmailLink(window.location.href) !== true)
      return;

    let email = window.localStorage.getItem('emailForSignIn');
    if (!email)
      email = window.prompt('Please provide your email for confirmation');

    firebase.auth().signInWithEmailLink(email, window.location.href)
      .then((result) => this.__finishSignInURL(result.user))
      .catch(e => console.log(e));
  }
  __finishSignInURL(user) {
    window.localStorage.removeItem('emailForSignIn');
    location = '/profile';
    //this.authHandleEvent(user);
  }
  _shuffleArray(array) {
    let currentIndex = array.length,
      randomIndex;
    while (0 !== currentIndex) {

      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]
      ];
    }
    return array;
  }
  timeSince(date) {
    let seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;

    if (interval > 1) {
      return Math.floor(interval) + ` year${Math.floor(interval) === 1 ? '' : 's'} ago`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + ` month${Math.floor(interval) === 1 ? '' : 's'} ago`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + ` day${Math.floor(interval) === 1 ? '' : 's'} ago`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + ` hour${Math.floor(interval) === 1 ? '' : 's'} ago`;
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + ` min${Math.floor(interval) === 1 ? '' : 's'} ago`;
    }
    //return Math.floor(seconds) + " seconds ago";
    return ' just now';
  }
  isoToLocal(startTimeISOString) {
    let startTime = new Date(startTimeISOString);
    let offset = startTime.getTimezoneOffset();
    return new Date(startTime.getTime() - (offset * 60000));
  }
  shortShowDate(d) {
    d = new Date(d);
    if (isNaN(d))
      return '';
    let str = d.toISOString().substr(0, 10);
    let mo = str.substr(5, 2);
    let ye = str.substr(2, 2);
    let da = str.substr(8, 2);
    return `${mo}/${da}/${ye}`;
  }
  muteClick(e) {
    this.updateMute(!this.muted);
    e.preventDefault();
    return true;
  }
  initGameOptionsPanel() {
    this.gameid_span = document.querySelector('.gameid_span');
    this.turnindex_span = document.querySelector('.turnindex_span');
    this.turnphase_span = document.querySelector('.turnphase_span');

    this.members_list = document.querySelector('.members_list');
    this.visibility_display = document.querySelector('.visibility_display');
    this.seat_count_display = document.querySelector('.seat_count_display');
    this.message_level_display = document.querySelector('.message_level_display');
    this.seats_per_user_display = document.querySelector('.seats_per_user_display');

    this.message_level_select = document.querySelector('.message_level_select');
    this.message_level_select.addEventListener('input', e => this.gameAPIOptions());

    this.seats_per_user_select = document.querySelector('.seats_per_user_select');
    this.seats_per_user_select.addEventListener('input', e => this.gameAPIOptions());

    this.visibility_select = document.querySelector('.visibility_select');
    this.visibility_select.addEventListener('input', e => this.gameAPIOptions());

    this.seat_count_select = document.querySelector('.seat_count_select');
    this.seat_count_select.addEventListener('input', e => this.gameAPIOptions());

    this.games_tab_radios = document.querySelectorAll('input[name="game_view_type"]');
    this.games_tab_radios.forEach(ctl => ctl.addEventListener('input', e => this.updateTabView(e)));
    this.updateTabView();

    this.code_link_href = document.querySelector('.code_link_href');
    this.code_link_copy = document.querySelector('.code_link_copy');
    if (this.code_link_copy)
      this.code_link_copy.addEventListener('click', e => this.copyGameLinkToClipboard());

    this.tab_buttons = document.querySelectorAll('.tab_buttons button');
    this.tab_buttons.forEach((btn, i) => btn.addEventListener('click', e => this.updateOptionsPanel(btn, i)));

    this.tab_panes = document.querySelectorAll(".game_options_panel_wrapper .tab-pane");

    this.initGameMessageFeed();
  }
  updateOptionsPanel(btn, i) {
    this.tabSelected = btn.value;
    this.tab_buttons.forEach(btn => btn.classList.remove('active'));
    this.tab_panes.forEach(tab => {
      tab.classList.remove('active');
      tab.classList.remove('show');
    });
    this.tab_panes[i].classList.add('active');
    this.tab_panes[i].classList.add('show');
    btn.classList.add('active');
  }
  refreshOnlinePresence() {
    if (this.userStatusDatabaseRef)
      this.userStatusDatabaseRef.set({
        state: 'online',
        last_changed: firebase.database.ServerValue.TIMESTAMP,
      });
  }
  initRTDBPresence() {
    if (!this.uid)
      return;

    if (this.rtdbPresenceInited)
      return;

    this.rtdbPresenceInited = true;

    this.userStatusDatabaseRef = firebase.database().ref('/OnlinePresence/' + this.uid);

    this.isOfflineForDatabase = {
      state: 'offline',
      last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    this.isOnlineForDatabase = {
      state: 'online',
      last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    firebase.database().ref('.info/connected').on('value', (snapshot) => {
      if (snapshot.val() == false) {
        return;
      };
      this.userStatusDatabaseRef.onDisconnect().set(this.isOfflineForDatabase).then(() => {
        this.userStatusDatabaseRef.set(this.isOnlineForDatabase);
      });
    });
  }
  addUserPresenceWatch(uid) {
    if (!this.userPresenceStatusRefs[uid]) {
      this.userPresenceStatusRefs[uid] = firebase.database().ref('OnlinePresence/' + uid);
      this.userPresenceStatusRefs[uid].on('value', snapshot => {
        this.userPresenceStatus[uid] = false;
        let data = snapshot.val();
        if (data) {
          if (data.state === 'online')
            this.userPresenceStatus[uid] = true;
          else if (uid === this.uid) {
            this.userStatusDatabaseRef.set(this.isOnlineForDatabase);
          }
        }
        this.updateUserPresence();
      });

    }
  }
  updateUserPresence() {}
  updateTabView() {}
  gameTypeMetaData() {
    return {
      guess: {
        name: 'Guess?',
        icon: '/images/logo_guess.png'
      },
      match: {
        name: 'Match!',
        icon: '/images/logo_match.png'
      },
      story: {
        name: 'Solar*',
        icon: '/images/logo_story.png'
      }
    }
  }
  _updateGameMembersList() {
    let html = '';
    if (this.gameData) {
      let currentPlayer = this.gameData['seat' + this.gameData.currentSeat];
      let winningPlayer = this.gameData['seat' + this.gameData.winningSeatIndex];

      let members = {};
      if (this.gameData.members)
        members = this.gameData.members;
      let membersList = Object.keys(members);
      membersList = membersList.sort();
      membersList.forEach(member => {
        this.addUserPresenceWatch(member);
        let data = this._gameMemberData(member);
        let owner = (this.gameData.createUser === member) ? ' impact-font' : '';
        let winner = (winningPlayer === member && this.gameData.mode === 'end') ? ' winner' : '';

        let userSeats = [];
        let seatTotals = '';
        for (let c = 0; c < this.gameData.numberOfSeats; c++)
          if (this.gameData['seat' + c] === member) {
            let points = this.gameData['seatPoints' + c.toString()];
            if (!points)
              points = 0;
            let data = {
              seat: c,
              points
            };
            seatTotals += `<div class="pts_block">
              <span class="seat_description">Seat ${(c + 1).toString()}:</span><span class="points">${points} pt${points === 1 ? '' : 's'}</span>
              </div>`;

            userSeats.push(data);
          }

        let userSeated = userSeats.length > 0 ? ' impact-font' : '';

        let playerUp = (currentPlayer === member && this.gameData.mode === 'running') ? ' player_up' : '';

        let timeSince = this.timeSince(new Date(members[member]));
        html += `<div class="member_list_item card_shadow app_panel${playerUp}${winner}" data-uid="${member}">
          <div class="game_user_wrapper">
            <span class="logo" style="background-image:url(${data.img})"></span>
            <span class="name${owner}">${data.name}</span>
            <div class="member_online_status" data-uid="${member}"></div>
          </div>

          <span class="member_list_time_since time_since_updatable ${userSeated}" data-timesince="${members[member]}">${timeSince}</span>
          <br>
          <div class="seat_stati">
            ${seatTotals}
          </div>
        </div>`;
      });
    }
    this.members_list.innerHTML = html;
  }
  async queryStringPaintProcess() {
    let seatId = this.urlParams.get('seat');
    if (seatId !== null && !this.loadSeatingComplete) {
      this.loadSeatingComplete = true;
      if (this.gameData['seat' + seatId] === null) {
        await this._gameAPISit(Number(seatId));
      } else {
        if (this.gameData['seat' + seatId] !== this.uid)
          alert('seat is filled');
      }
    }
  }

  async gameAPIJoin(gameNumber) {
    if (!this.fireToken)
      return;

    let body = {
      gameNumber
    };
    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + 'api/games/join', {
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

    return;
  }
  async gameAPIToggle(seatIndex) {
    if (this.gameData['seat' + seatIndex.toString()] === this.uid)
      return this._gameAPIStand(seatIndex);

    if (this.gameData['seat' + seatIndex.toString()] !== null && this.gameData.createUser === this.uid) {
      if (confirm("Boot Player in Seat " + (seatIndex + 1).toString() + "?"))
        return this._gameAPIStand(seatIndex);

      return;
    }

    return this._gameAPISit(seatIndex);
  }
  async _gameAPISit(seatIndex, gameNumber = null) {
    if (gameNumber === null)
      gameNumber = this.currentGame;
    let body = {
      gameNumber,
      seatIndex
    };
    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + 'api/games/sit', {
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
    if (!json.success)
      alert(json.errorMessage);

    return json.success;
  }
  async _gameAPIStand(seatIndex) {
    let body = {
      gameNumber: this.currentGame,
      seatIndex
    };
    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + 'api/games/stand', {
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
  async gameAPIOptions() {
    let visibility = this.visibility_select.value;
    let numberOfSeats = Number(this.seat_count_select.value);
    let messageLevel = this.message_level_select.value;
    let seatsPerUser = this.seats_per_user_select.value;

    let body = {
      gameNumber: this.currentGame,
      visibility,
      numberOfSeats,
      seatsPerUser,
      messageLevel
    };

    if (this.card_deck_select) {
      body.cardDeck = this.card_deck_select.value;
    }

    if (this.scoring_system_select) {
      body.scoringSystem = this.scoring_system_select.value;
    }

    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + 'api/games/options', {
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

  _gameMemberData(uid) {
    let name = this.gameData.memberNames[uid];
    let img = this.gameData.memberImages[uid];
    let avatar = this.gameData.memberAvatars[uid];
    if (!name)
      name = 'Anonymous';
    if (!img)
      img = '/images/defaultprofile.png';
    if (!avatar)
      avatar = 'male1';

    return {
      name,
      img,
      avatar
    }
  }
  async initGameMessageFeed() {
    if (!this.gameData)
      return;

    if (this.gameFeedInited)
      return;
    this.gameFeedInited = true;
    let gameId = this.urlParams.get('game');
    if (!gameId)
      return;

    if (this.gameMessagesSubscription)
      this.gameMessagesSubscription();

    this.gameMessagesSubscription = firebase.firestore().collection(`Games/${gameId}/messages`)
      .orderBy(`created`, 'desc')
      .limit(50)
      .onSnapshot(snapshot => this.updateGameMessagesFeed(snapshot));
  }
  async deleteMessage(btn, gameNumber, messageId) {
    btn.setAttribute('disabled', 'true');

    let body = {
      gameNumber,
      messageId
    };
    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + 'api/games/message/delete', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        token
      },
      body: JSON.stringify(body)
    });

    let result = await f_result.json();
    if (!result.success) {
      alert('Delete message failed');
    }
  }
  async dockSit(seatIndex) {
    if (this.gameData['seat' + seatIndex.toString()] !== null)
      return;

    let limit1 = this.gameData.seatsPerUser === 'one';
    if (this.userSeated && limit1)
      return;

    return this._gameAPISit(seatIndex);
  }

  get seatCount() {
    return 4;
  }
  paintDock() {}
  paintOptions() {
    if (this.gameData.createUser === this.uid) {
      document.body.classList.add('game_owner');
      document.body.classList.remove('not_game_owner');
    } else {
      document.body.classList.remove('game_owner');
      document.body.classList.add('not_game_owner');
    }

    document.body.classList.remove('mode_ready');
    document.body.classList.remove('mode_running');
    document.body.classList.remove('mode_end');
    let mode = this.gameData.mode;
    if (!mode)
      mode = 'ready';
    document.body.classList.add('mode_' + mode);

    this.visibility_display.innerHTML = this.gameData.visibility;
    this.visibility_select.value = this.gameData.visibility;
    this.seat_count_display.innerHTML = this.gameData.numberOfSeats.toString() + ' seats';
    this.seat_count_select.value = this.gameData.numberOfSeats;
    this.message_level_display.innerHTML = this.gameData.messageLevel;
    this.message_level_select.value = this.gameData.messageLevel;
    this.seats_per_user_display.innerHTML = this.gameData.seatsPerUser;
    this.seats_per_user_select.value = this.gameData.seatsPerUser;

    if (this.code_link_href) {
      let path = window.location.href;
      this.code_link_href.setAttribute('href', path);
    }
  }

  copyGameLinkToClipboard() {
    let path = this.code_link_href.getAttribute('href');
    navigator.clipboard.writeText(path);
  }

  async finishGame() {
    this.refreshOnlinePresence();

    this.match_finish.setAttribute('disabled', true);
    let action = 'endGame';
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
    this.match_finish.removeAttribute('disabled');

    if (!json.success) {
      console.log('finish fail', json);
      if (this.alertErrors)
        alert('Failed to finish game: ' + json.errorMessage);
      return;
    }
  }
  async resetGame() {
    this.refreshOnlinePresence();

    this.match_reset.setAttribute('disabled', true);
    let action = 'resetGame';
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
    this.match_reset.removeAttribute('disabled');

    if (!json.success) {
      console.log('reset fail', json);
      if (this.alertErrors)
        alert('Failed to reset game: ' + json.errorMessage);
      return;
    }
  }
  async startGame() {
    this.refreshOnlinePresence();

    this.match_start.setAttribute('disabled', true);
    let action = 'startGame';
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
    this.match_start.removeAttribute('disabled');

    if (!json.success) {
      console.log('start fail', json);
      if (this.alertErrors)
        alert('Failed to start game: ' + json.errorMessage);
      return;
    }
    this.matchBoardRendered = false;
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

    });
  }
  async initGraphics() {
    if (this.engine)
      return;

    this.cameraMetaX = {
      position: U3D.v(5, 3, 0),
      target: U3D.v(0, 2, 0)
    };


    this.canvas = document.querySelector(".popup-canvas");
    this.engine = new BABYLON.Engine(this.canvas, true);
    BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;
    BABYLON.Animation.AllowMatricesInterpolation = true;

    this.engine.enableOfflineSupport = false;
    this.scene = await this.createScene();

    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }
  toggleXRMovementType() {
    if (!this.currentXRFeature) {
      this.xr.baseExperience.featuresManager.disableFeature(BABYLON.WebXRFeatureName.TELEPORTATION);
      this.xr.baseExperience.featuresManager.enableFeature(BABYLON.WebXRFeatureName.MOVEMENT, "stable", {
        xrInput: this.xr.input,
        movementSpeed: 0.075,
        rotationSpeed: 0.15
      });
      this.currentXRFeature = 'movement';
      //this.xr.teleportation.setSelectionFeature(null);
    } else {
      this.xr.baseExperience.featuresManager.disableFeature(BABYLON.WebXRFeatureName.MOVEMENT);

      this.xr.teleportation = this.xr.baseExperience.featuresManager.enableFeature(BABYLON.WebXRFeatureName.TELEPORTATION, "stable", {
        xrInput: this.xr.input,
        floorMeshes: [this.env.ground]
      });
      this.xr.teleportation.setSelectionFeature(this.xr.pointerSelection);
      this.currentXRFeature = false;
    }
  }
  async createScene() {
    let scene = new BABYLON.Scene(this.engine);
    this.scene = scene;
    this.scene.autoClear = false; // Color buffer
    this.scene.autoClearDepthAndStencil = false; // Depth and stencil, obviously
    if (this.instrumentationOn) {
      let instrumentation = new BABYLON.SceneInstrumentation(this.scene);
      instrumentation.captureFrameTime = true;
      setInterval(() => {
        let perfValue = instrumentation.frameTimeCounter.lastSecAverage.toFixed(2);
        console.log(perfValue + "ms per frame");
      }, 300);
    }

    this.mainLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, -1, 0), this.scene);
    this.mainLight.intensity = 0.8;
    this.scene.mainLight = this.mainLight;

    let environment = scene.createDefaultEnvironment({
      createSkybox: false,
      groundOpacity: 0,
      groundSize: 150,
      enableGroundShadow: false,
      enableGroundMirror: false
    });
    this.env = environment;

    scene.createDefaultCamera(false, true, true);
    this.camera = scene.activeCamera;

    scene.activeCamera.position = U3D.vector(this.cameraMetaX.position);
    scene.activeCamera.setTarget(U3D.vector(this.cameraMetaX.target));
    scene.activeCamera.speed = 0.5;
    this.camera.angularSensibility = 5000;
    scene.activeCamera.storeState();

    this.initSkybox();
    this.xr = await scene.createDefaultXRExperienceAsync({
      floorMeshes: [environment.ground]
    });
    this.toggleXRMovementType();

    environment.ground.isPickable = false;
    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
          if (pointerInfo.pickInfo.hit) {
            if (this.pointerDown(pointerInfo))
              break;
          }
          if (pointerInfo.pickInfo.pickedMesh === this.env.ground) {
            this.groundClick(pointerInfo);
            break;
          }
          break;
        case BABYLON.PointerEventTypes.POINTERUP:
          this.pointerUp(pointerInfo);
          break;
        case BABYLON.PointerEventTypes.POINTERMOVE:
          this.pointerMove(pointerInfo);
          break;
      }
    });

    this.xr.input.onControllerAddedObservable.add((controller) => {
      controller.onMotionControllerInitObservable.add((motionController) => {
        motionController.onModelLoadedObservable.add(mc => {
          this.XRControllerAdded(controller, motionController.handedness);
        })

        let yComponent = motionController.getComponent('y-button');
        if (yComponent)
          yComponent.onButtonStateChangedObservable.add(btn => {
            if (btn.pressed) {
              this.yButtonPress();
            }
          });
        let xComponent = motionController.getComponent('x-button');
        if (xComponent)
          xComponent.onButtonStateChangedObservable.add(btn => {
            if (btn.pressed) {
              this.xButtonPress();
            }
          });
        let aComponent = motionController.getComponent('a-button');
        if (aComponent)
          aComponent.onButtonStateChangedObservable.add(btn => {
            if (btn.pressed) {
              this.aButtonPress();
            }
          });
        let bComponent = motionController.getComponent('b-button');
        if (bComponent)
          bComponent.onButtonStateChangedObservable.add(btn => {
            if (btn.pressed) {
              this.bButtonPress();
            }
          });
      });
    });

    this.xr.baseExperience.onInitialXRPoseSetObservable.add(() => {
      // append the initial position of the camera to the parent node
      //childForCamera.position.addInPlace(xr.baseExperience.camera.position);
      this.xr.baseExperience.sessionManager.onXRFrameObservable.add(() => {

        if (this.activeFollowMeta && this.activeFollowMeta.basePivot) {
          let position = new BABYLON.Vector3(0, 0, 0);
          position.copyFrom(this.activeFollowMeta.basePivot.getAbsolutePosition());
          position.y += 4;

          let mX = position.x - this.scene.activeCamera.position.x;
          let mZ = position.z - this.scene.activeCamera.position.z;

          let movementVector = new BABYLON.Vector3(mX, 0, mZ);
          this.xr.baseExperience.camera.position.copyFrom(position);
        }
      })
    });

    this.xr.baseExperience.onStateChangedObservable.add((state) => {
      switch (state) {
        case BABYLON.WebXRState.IN_XR:
          this.enterXR();
          break;
        case BABYLON.WebXRState.NOT_IN_XR:
          this.enterNotInXR();
          break;
      }
    });

    return scene;
  }
  initSkybox() {
    let equipath = `https://s3-us-west-2.amazonaws.com/hcwebflow/textures/sky/stars8k.jpg`;
    if (!this.photoDome) {
      this.photoDome = new BABYLON.PhotoDome(
        "photoDome",
        equipath, {
          resolution: 256,
          size: 150
        },
        this.scene
      );
      this.photoDome.imageMode = BABYLON.PhotoDome.MODE_MONOSCOPIC;
      this.photoDome.fovMultiplier = 2.0;
      this.photoDome.isPickable = false;
    } else {
      if (this.photoDome.photoTexture)
        this.photoDome.photoTexture.dispose();
      this.photoDome.photoTexture = new BABYLON.Texture(equipath, this.scene, false, true);
    }
  }

  enterXR() {}
  enterNotInXR() {}
  pointerMove() {}
  xButtonPress() {}
  yButtonPress() {}
  aButtonPress() {}
  bButtonPress() {}

  pointerUp() {}
  pointerDown() {}
  async loadAvatarMesh(path, file, scale, x, y, z, noLoadWalk = false) {
    if (!this.animationResult && !noLoadWalk) {
      let bonesPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent("/solar/avatar-walk.glb") + '?alt=media';

      this.animationResult = await BABYLON.SceneLoader.ImportMeshAsync(null, bonesPath, null, this.scene);
      this.animationGLB = this.animationResult.meshes[0];
      this.animationGLB.setEnabled(false);
      this.animationResult.animationGroups[0].stop();
    }

    let skinPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(path) + '?alt=media';
    let result2 = await BABYLON.SceneLoader.ImportMeshAsync(null, skinPath, file);

    let mesh = result2.meshes[0];

    mesh.scaling.x = scale * -1;
    mesh.scaling.y = scale;
    mesh.scaling.z = scale;

    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;

    if (this.animationResult) {
      const modelTransformNodes = mesh.getChildTransformNodes();
      const modelAnimationGroup = this.animationResult.animationGroups[0].clone("clone", (oldTarget) => {
        return modelTransformNodes.find((node) => node.name === oldTarget.name);
      });
      modelAnimationGroup.start();
      modelAnimationGroup.pause();
      mesh.modelAnimationGroup = modelAnimationGroup;
      modelAnimationGroup.goToFrame(Math.floor(Math.random() * modelAnimationGroup.to));
      modelAnimationGroup.loopAnimation = true;
    }

    return mesh;
  }
  groundClick(pointerInfo) {
    return;
  }
}

export default BaseApp;
