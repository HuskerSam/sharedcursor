import BaseApp from '/models/baseapp.js';

export class GamesApp extends BaseApp {
  constructor() {
    super();

    this.create_new_game_btn = document.querySelector('.create_new_game_btn');
    this.create_new_game_btn.addEventListener('click', e => this.createNewGame());

    this.game_history_view = document.querySelector('.game_history_view');
    this.public_game_view = document.querySelector('.public_game_view');

    this.join_game_btn = document.querySelector('.join_game_btn');
    this.join_game_btn.addEventListener('click', e => this.joinGame());

    this.game_code_start = document.querySelector('.game_code_start');
    this.game_code_start.addEventListener("keyup", e => {
      if (event.key === "Enter")
        this.joinGame();
    });

    this.gametype_select = document.querySelector('.gametype_select');
    this.gametype_select.addEventListener('input', e => this.updateNewGameType());

    let gameId = this.urlParams.get('game');
    if (gameId) {
      let terminatePage = this._handlePassedInGameID(gameId);

      if (terminatePage)
        return;
    }

    this.new_game_type_wrappers = document.querySelectorAll('.new_game_type_wrapper');
    this.new_game_type_wrappers.forEach(btn => btn.addEventListener('click', e => this.handleGameTypeClick(btn)));

    this.basic_options = document.querySelector('.basic_options');

    this.updateNewGameType();

    this.initRTDBPresence();

    this.tab_buttons = document.querySelectorAll('.tab_buttons button');
    this.tab_buttons.forEach((btn, i) => btn.addEventListener('click', e => this.updateTabButtons(btn, i)));

    this.tab_panes = document.querySelectorAll(".body_wrapper .tab-pane");
  }
  updateTabButtons(btn, i) {
    if (btn) {
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
  }
  handleGameTypeClick(btn) {
    this.new_game_type_wrappers.forEach(b => b.classList.remove('selected'));
    this.gametype_select.value = btn.value;
    this.updateNewGameType();
    btn.classList.add('selected');
  }
  toggleTabView() {
    if (document.body.classList.contains('show_games_view')) {
      document.body.classList.remove('show_games_view');
      document.body.classList.add('show_new_game');
      this.game_header_toggle_button.innerHTML = 'Games';
    } else {
      document.body.classList.add('show_games_view');
      document.body.classList.remove('show_new_game');
      this.game_header_toggle_button.innerHTML = 'New';
    }

    return false;
  }
  toggleFeedView() {
    if (document.body.classList.contains('show_public_games_view')) {
      document.body.classList.remove('show_public_games_view');
      document.body.classList.add('show_profile_games');
      this.game_feed_toggle_button.innerHTML = 'Find';
    } else {
      document.body.classList.add('show_public_games_view');
      document.body.classList.remove('show_profile_games');
      this.game_feed_toggle_button.innerHTML = 'Recent';
    }

    return false;
  }

  updateNewGameType() {
    document.body.classList.remove('newgametype_guess');
    document.body.classList.remove('newgametype_match');
    document.body.classList.remove('newgametype_story');

    let gameType = this.gametype_select.value;
    document.body.classList.add('newgametype_' + gameType);

    this.basic_options.classList.remove('gametype_guess');
    this.basic_options.classList.remove('gametype_match');
    this.basic_options.classList.remove('gametype_story');
    this.basic_options.classList.add('gametype_' + gameType);

    let gameMeta = this.gameTypeMetaData()[gameType];
    this.create_new_game_btn.innerHTML = "Create " + gameMeta.name;
  }
  async _handlePassedInGameID(gameId) {
    let gameQuery = await firebase.firestore().doc(`Games/${gameId}`).get();
    let gameData = gameQuery.data();

    if (!gameData) {
      alert('game not found');
      return false;
    }

    window.history.replaceState({
      state: 1
    }, "", `/${gameData.gameType}/?game=${gameId}`);
    location.reload();

    return true;
  }
  authUpdateStatusUI() {
    super.authUpdateStatusUI();
    this.initGameFeeds();
    this.initRTDBPresence();
  }

  async initGameFeeds() {
    if (this.gameFeedInited || !this.profile)
      return;
    this.gameFeedInited = true;

    if (this.gameFeedSubscription)
      this.gameFeedSubscription();
    if (this.publicFeedSubscription)
      this.publicFeedSubscription();

    this.gameFeedSubscription = firebase.firestore().collection(`Games`)
      .orderBy(`members.${this.uid}`, 'desc')
      .limit(20)
      .onSnapshot(snapshot => this.updateGamesFeed(snapshot));

    this.publicFeedSubscription = firebase.firestore().collection(`Games`)
      .orderBy(`lastActivity`, 'desc')
      .where('publicStatus', '==', 'publicOpen')
      .limit(20)
      .onSnapshot(snapshot => this.updatePublicGamesFeed(snapshot));
  }
  updateGamesFeed(snapshot) {
    if (snapshot)
      this.lastGamesFeedSnapshot = snapshot;
    else if (this.lastGamesFeedSnapshot)
      snapshot = this.lastGamesFeedSnapshot;
    else
      return;

    let html = '';
    snapshot.forEach((doc) => html += this._renderGameFeedLine(doc));
    this.game_history_view.innerHTML = html;

    let delete_buttons = this.game_history_view.querySelectorAll('button.delete_game');
    delete_buttons.forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      this.deleteGame(btn, btn.dataset.gamenumber);
    }));
    let logout_buttons = this.game_history_view.querySelectorAll('button.logout_game');
    logout_buttons.forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      this.logoutGame(btn, btn.dataset.gamenumber);
    }));
    let sit_buttons = this.game_history_view.querySelectorAll('.sit_button');
    sit_buttons.forEach(btn => btn.addEventListener('click', e => this.gameSitClick(btn)));
    let link_buttons = this.game_history_view.querySelectorAll('.code_link');
    link_buttons.forEach(btn => btn.addEventListener('click', e => this.copyGameLink(btn)));

    this.refreshOnlinePresence();
  }
  __getUserTemplate(member, name, img, onlineStatus = false, impact = false, nameClass = '') {
    let impactFont = impact ? ' impact-font' : '';
    let innerHTML = `<span style="background-image:url(${img});width: 30px;display: inline-block;"></span> <span class="name${impactFont} ${nameClass}">${name}</span>`;
    if (onlineStatus) {
      this.addUserPresenceWatch(member);
      innerHTML += `<div class="member_online_status" data-uid="${member}"></div>`;
    }

    return innerHTML;
  }
  _renderGameFeedLine(doc, publicFeed = false) {
    let data = doc.data();
    let owner_class = '';
    let gnPrefix = publicFeed ? 'public_' : '';
    if (data.createUser === this.uid)
      owner_class += ' feed_game_owner';

    let modeClass = ' gameitem_' + data.mode;

    let isUserSeated = false;
    for (let c = 0; c < data.numberOfSeats; c++)
      if (data['seat' + c] === this.uid) {
        isUserSeated = true;
        break;
      }

    let membersHtml = '<div class="member_feed_wrapper">';
    let memberUpHtml = '';
    let memberIsUp = '';
    let displayClass = '';
    let seatsFull = true;
    let limit1 = data.seatsPerUser === 'one';

    for (let c = 0; c < 4; c++) {
      if (c === 2)
        membersHtml += '</div><div class="member_feed_wrapper">';

      if (c >= data.numberOfSeats) {
        membersHtml += '<div class="table_seat_fill">&nbsp;</div>';
        continue;
      }

      let member = data['seat' + c];
      let innerHTML = '';
      let memberCellClass = '';
      if (member) {
        let name = data.memberNames[member];
        let img = data.memberImages[member];
        if (!name)
          name = 'Anonymous';
        if (!img)
          img = '/images/defaultprofile.png';
        innerHTML = this.__getUserTemplate(member, name, img, !publicFeed, false);

        if (c === data.currentSeat) {
          if (member === this.uid) {
            memberIsUp = ' gameplayer_turn_next';
            memberCellClass = ' gameplayer_cell_next';
          }
        }
      } else {
        seatsFull = false;
        if (!isUserSeated)
          innerHTML = `<button class="sit_anchor sit_button btn btn-primary" data-gamenumber="${data.gameNumber}" data-seatindex="${c}">
            Sit
          </button>`;
        else if (!limit1)
          innerHTML = `<button class="sit_anchor sit_button btn btn-secondary" data-gamenumber="${data.gameNumber}" data-seatindex="${c}">
          Sit
        </button>`;
        else
          innerHTML = 'Empty';
        innerHTML = `<div style="flex:1;text-align:center;">${innerHTML}</div>`;
      }

      membersHtml += `<div class="game_user_wrapper game_list_user ${memberCellClass}">${innerHTML}</div>`;
    }

    membersHtml += '</div>';

    let title = this.gameTypeMetaData()[data.gameType].name;
    let img = `url(${this.gameTypeMetaData()[data.gameType].icon})`;
    let timeSince = this.timeSince(new Date(data.lastActivity));
    let timeStr = this.isoToLocal(data.created).toISOString().substr(11, 5);
    let hour = Number(timeStr.substr(0, 2));
    let suffix = hour < 12 ? 'am' : 'pm';
    let seatsFullClass = seatsFull ? ' seats_full' : '';

    hour = hour % 12;
    if (hour === 0)
      hour = 12;
    timeStr = hour.toString() + timeStr.substr(2) + ' ' + suffix;

    let round = (Math.floor(data.turnNumber / data.runningNumberOfSeats) + 1).toString();

    return `<div class="item_card_shadow col-lg-4 col-md-6 col-sm-12 col-xs-12">
      <div class="gamelist_item${owner_class}${memberIsUp} gametype_${data.gameType} ${displayClass}${modeClass}${seatsFullClass}"
          data-gamenumber="${gnPrefix}${doc.id}">
      <div class="header">
        <div style="background-image:${img}" class="game_type_image"></div>
        <span class="name">${data.name}</span>
        <span class="timesince time_since_updatable" data-timesince="${data.lastActivity}">${timeSince}</span>
      </div>
      <div class="open_button_wrapper">
        <button class="delete_game btn btn-secondary" data-gamenumber="${data.gameNumber}"><i class="material-icons">delete</i></button>
        <button class="logout_game btn btn-secondary" data-gamenumber="${data.gameNumber}"><i class="material-icons">logout</i></button>
        <button class="code_link btn btn-secondary" data-url="/${data.gameType}/?game=${data.gameNumber}"><i class="material-icons">content_copy</i></button>
        <a href="/${data.gameType}/?game=${data.gameNumber}" class="game_number_open btn btn-primary">Open</a>
        <a href="/${data.gameType}/?game=${data.gameNumber}" class="game_number_open btn btn-primary" target="_blank"><i class="material-icons">open_in_new</i></a>
      </div>
      <div class="gamefeed_item_header">
        <div class="game_name">
          <span class="title">
          ${title}
          </span>
        </div>
        <div class="round_wrapper">
          <span class="label">${data.gameNumber} &nbsp; </span>
          <span class="round">${round}</span>
        </div>
      </div>
      <div class="gamefeed_members_list">
        ${membersHtml}
      </div>
      <div style="clear:both"></div>
    </div>
    </div>`;
  }

  updatePublicGamesFeed(snapshot) {
    if (snapshot)
      this.lastPublicFeedSnapshot = snapshot;
    else if (this.lastPublicFeedSnapshot)
      snapshot = this.lastPublicFeedSnapshot;
    else
      return;

    let html = '';
    snapshot.forEach((doc) => html += this._renderGameFeedLine(doc, true));
    this.public_game_view.innerHTML = html;
    let delete_buttons = this.public_game_view.querySelectorAll('button.delete_game');
    delete_buttons.forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      this.deleteGame(btn, btn.dataset.gamenumber);
    }));
    let sit_buttons = this.public_game_view.querySelectorAll('.sit_button');
    sit_buttons.forEach(btn => btn.addEventListener('click', e => this.gameSitClick(btn)));
    let link_buttons = this.public_game_view.querySelectorAll('.code_link');
    link_buttons.forEach(btn => btn.addEventListener('click', e => this.copyGameLink(btn)));

    this.refreshOnlinePresence();
  }

  copyGameLink(btn) {
    navigator.clipboard.writeText(window.location.origin + btn.dataset.url);
  }

  async gameSitClick(btn) {
    let result = await this._gameAPISit(btn.dataset.seatindex, btn.dataset.gamenumber);

    if (result) {
      btn.closest('.gamelist_item').querySelector('.game_number_open').click();
    }
  }
  async joinGame(gameNumber, gameType = '') {
    if (!gameNumber)
      gameNumber = this.game_code_start.value;
    let a = document.createElement('a');
    if (gameType !== '')
      gameType += '/';
    a.setAttribute('href', `/${gameType}?game=${gameNumber}`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  async createNewGame() {
    if (!this.profile)
      return;

    this.create_new_game_btn.setAttribute('disabled', true);
    this.create_new_game_btn.innerHTML = 'Creating...';

    let gameType = document.querySelector('.gametype_select').value;
    let visibility = document.querySelector('.visibility_select').value;
    let numberOfSeats = Number(document.querySelector('.seat_count_select').value);
    let messageLevel = document.querySelector('.message_level_select').value;
    let seatsPerUser = document.querySelector('.seats_per_user_select').value;
    let cardDeck = document.querySelector('.card_deck_select').value;
    let bones_status = document.querySelector('.bones_status').value;
    let shadow_status = document.querySelector('.shadow_status').value;
    let sound_status = document.querySelector('.sound_status').value;
    let text3d_status = document.querySelector('.text3d_status').value;
    let scoringSystem = document.querySelector('.scoring_system_select').value;
    let asteroid_status = document.querySelector('.asteroid_status').value;
    let skybox_status = document.querySelector('.skybox_status').value;
    let skyboxrotation_status = document.querySelector('.skyboxrotation_status').value;
    let hugemodel_status = document.querySelector('.hugemodel_status').value;
    let moonlevel_status = document.querySelector('.moonlevel_status').value;
    let extras_status = document.querySelector('.extras_status').value;

    let body = {
      gameType,
      visibility,
      numberOfSeats,
      messageLevel,
      seatsPerUser,
      cardDeck,
      scoringSystem,
      performanceFlags: [
        bones_status,
        shadow_status,
        sound_status,
        text3d_status,
        asteroid_status,
        skybox_status,
        skyboxrotation_status,
        hugemodel_status,
        extras_status,
        moonlevel_status
      ]
    };

    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + 'api/games/create', {
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

    let a = document.createElement('a');
    a.setAttribute('href', `/${gameType}/?game=${json.gameNumber}`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  async deleteGame(btn, gameNumber) {
    if (!confirm('Are you sure you want to delete this game?'))
      return;

    btn.setAttribute('disabled', 'true');
    if (!gameNumber) {
      alert("Game Number not found - error");
      return;
    }

    let body = {
      gameNumber
    };
    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + 'api/games/delete', {
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
      alert('Delete failed');
    }
  }
  async logoutGame(btn, gameNumber) {
    btn.setAttribute('disabled', 'true');
    if (!gameNumber) {
      alert("Game Number not found - error");
      return;
    }

    let body = {
      gameNumber
    };
    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + 'api/games/leave', {
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
      alert('Logout failed');
    }
  }
}
