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

    this.recentExpanded = {};

    this.initRTDBPresence();
    //redraw feeds to update time since values
    /*
    setInterval(() => this.updateGamesFeed(), this.baseRedrawFeedTimer);
    setInterval(() => this.updatePublicGamesFeed(), this.baseRedrawFeedTimer);
    */

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

    let gameType = this.gametype_select.value;
    document.body.classList.add('newgametype_' + gameType);

    this.basic_options.classList.remove('gametype_guess');
    this.basic_options.classList.remove('gametype_match');
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
    let toggle_buttons = this.game_history_view.querySelectorAll('button.toggle_expanded_game');
    toggle_buttons.forEach(btn => btn.addEventListener('click', e => this.toggleFeedSeats(btn)));
    let sit_buttons = this.game_history_view.querySelectorAll('.sit_button');
    sit_buttons.forEach(btn => btn.addEventListener('click', e => this.gameSitClick(btn)));
    let link_buttons = this.game_history_view.querySelectorAll('.code_link');
    link_buttons.forEach(btn => btn.addEventListener('click', e => this.copyGameLink(btn)));

    this.refreshOnlinePresence();
  }
  toggleFeedSeats(btn) {
    let p = btn.parentElement.parentElement.parentElement;
    let gameNumber = btn.dataset.gamenumber;

    if (p.classList.contains('show_seats')) {
      this.recentExpanded[gameNumber] = false;
      p.classList.remove('show_seats');
    } else {
      this.recentExpanded[gameNumber] = true;
      p.classList.add('show_seats');
    }
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
    let ownerHTML = this.__getUserTemplate(data.createUser, data.memberNames[data.createUser], data.memberImages[data.createUser], true);
    let memberIsUp = '';
    let openImpactFont = '';
    let displayClass = '';
    let seatsFull = true;
    if (publicFeed) {
      displayClass = ' show_seats';
      if (this.recentExpanded['public_' + doc.id] === false)
        displayClass = '';
    } else {
      if (this.recentExpanded[doc.id])
        displayClass = ' show_seats';
    }
    for (let c = 0; c < data.numberOfSeats; c++) {
      if (c === 2)
        membersHtml += '</div><div class="member_feed_wrapper">';
      let member = data['seat' + c];
      let innerHTML = '';
      if (member) {
        let name = data.memberNames[member];
        let img = data.memberImages[member];
        if (!name)
          name = 'Anonymous';
        if (!img)
          img = '/images/defaultprofile.png';
        innerHTML = this.__getUserTemplate(member, name, img, !publicFeed, false, 'paragraphfit_auto');

        if (c === data.currentSeat) {
          memberUpHtml = this.__getUserTemplate(member, name, img, true, true, 'paragraphfit_auto');

          if (member === this.uid) {
            memberIsUp = ' gameplayer_turn_next';
            openImpactFont = ' impact-font';
          }
        }
      } else {
        seatsFull = false;
        if (!isUserSeated)
          innerHTML = `<button class="sit_anchor sit_button btn btn-primary" data-gamenumber="${data.gameNumber}" data-seatindex="${c}">
            Sit
          </button>`;
        else
          innerHTML = '<button class="sit_anchor open_sit">Empty</button>';
        innerHTML = `<div style="flex:1;text-align:center;">${innerHTML}</div>`;
      }

      membersHtml += `<div class="game_user_wrapper game_list_user">${innerHTML}</div>`;
    }

    if (data.numberOfSeats % 2 === 1)
      membersHtml += '<div class="table_seat_fill"></div>';

    membersHtml += '</div>';

    let title = this.gameTypeMetaData()[data.gameType].name;
    let img = `url(${this.gameTypeMetaData()[data.gameType].icon})`;
    let timeSince = this.timeSince(new Date(data.lastActivity));
    let shortDate = new Date(data.created).toLocaleDateString();
    shortDate = shortDate.substring(0, shortDate.length - 5);
    let timeStr = this.isoToLocal(data.created).toISOString().substr(11, 5);
    let hour = Number(timeStr.substr(0, 2));
    let suffix = hour < 12 ? 'am' : 'pm';
    let seatsFullClass = seatsFull ? ' seats_full' : '';

    hour = hour % 12;
    if (hour === 0)
      hour = 12;
    timeStr = hour.toString() + timeStr.substr(2) + ' ' + suffix;

    shortDate += ' ' + timeStr;
    let round = (Math.floor(data.turnNumber / data.runningNumberOfSeats) + 1).toString();

    return `<div class="item_card_shadow col-lg-4 col-md-6 col-sm-12 col-xs-12">
      <div class="gamelist_item${owner_class}${memberIsUp} gametype_${data.gameType} ${displayClass}${modeClass}${seatsFullClass}"
          data-gamenumber="${gnPrefix}${doc.id}">
      <div>${data.name}</div>
      <div class="gamefeed_item_header">
        <div style="background-image:${img}" class="game_type_image"></div>
        <div class="game_name">
          <span class="title">
          ${title}
          </span>
        </div>
        <div class="open_button_wrapper">
          <a href="/${data.gameType}/?game=${data.gameNumber}" class="game_number_open btn btn-primary">Open</a>
        </div>
      </div>
      <div class="gamefeed_timesince"><span class="mode impact-font">${data.mode}</span> - <span class="timesince">${timeSince}</span></div>
      <div style="display:flex;flex-direction:row">
        <button class="code_link game" data-url="/${data.gameType}/?game=${data.gameNumber}"><i class="material-icons">content_copy</i> <span>${data.gameNumber}</span></button>
        <div style="flex:1"></div>
        <div>
          <button class="game toggle_expanded_game" data-gamenumber="${gnPrefix}${data.gameNumber}">
            <span class="label">Round &nbsp; &nbsp; &nbsp;</span>
            <span class="round">${round}</span>
            <span class="icon">&#9660;</span>
          </button>
        </div>
      </div>

      <div class="next_player">
        <span class="next_label">&nbsp;Player:</span>
        <span class="next_player_wrapper game_user_wrapper">${memberUpHtml}</span>
      </div>
      <div class="gamefeed_members_list">
        ${membersHtml}
      </div>
      <div class="gamefeed_owners_panel">
        <span class="game_owner_label owner_wrapper">Game<br>Owner</span>
        <div class="owner_wrapper game_user_wrapper">
           ${ownerHTML}
        </div>

        <div style="line-height: 4em">
          <button class="delete_game btn btn-secondary" data-gamenumber="${data.gameNumber}">
            Delete
          </button>
          <button class="logout_game btn btn-secondary" data-gamenumber="${data.gameNumber}">
            Leave
          </button>
        </div>
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
    let toggle_buttons = this.public_game_view.querySelectorAll('button.toggle_expanded_game');
    toggle_buttons.forEach(btn => btn.addEventListener('click', e => this.toggleFeedSeats(btn)));
    let sit_buttons = this.public_game_view.querySelectorAll('.sit_button');
    sit_buttons.forEach(btn => btn.addEventListener('click', e => this.gameSitClick(btn)));
    let link_buttons = this.public_game_view.querySelectorAll('.code_link');
    link_buttons.forEach(btn => btn.addEventListener('click', e => this.copyGameLink(btn)));

    //this.applyAutoSizeToParagraph();

    this.refreshOnlinePresence();
  }

  copyGameLink(btn) {
    navigator.clipboard.writeText(window.location.origin + btn.dataset.url);
  }

  async gameSitClick(btn) {
    let result = await this._gameAPISit(btn.dataset.seatindex, btn.dataset.gamenumber);

    if (result) {
      btn.parentElement.parentElement.parentElement.parentElement.querySelector('.game_number_open').click();
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
    let scoringSystem = document.querySelector('.scoring_system_select').value;

    let body = {
      gameType,
      visibility,
      numberOfSeats,
      messageLevel,
      seatsPerUser,
      cardDeck,
      scoringSystem
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
