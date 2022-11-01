import BaseApp from '/models/baseapp.js';

export class MatchApp extends BaseApp {
  constructor() {
    super();
    this.apiType = 'match';

    this._initGameCommon();

    this.currentplayer_score_dock = document.querySelector('.currentplayer_score_dock');
    this.match_board_wrapper = document.querySelector('.match_board_wrapper');
    this.game_table_view = document.querySelector('.game_table_view');

    this.card_deck_display = document.querySelector('.card_deck_display');
    this.card_deck_select = document.querySelector('.card_deck_select');
    this.card_deck_select.addEventListener('input', e => this.gameAPIOptions());

    this.scoring_system_display = document.querySelector('.scoring_system_display');
    this.scoring_system_select = document.querySelector('.scoring_system_select');
    this.scoring_system_select.addEventListener('input', e => this.gameAPIOptions());

    this.turn_number_div = document.querySelector('.turn_number_div');
    this.player_total_points = document.querySelector('.player_total_points');
    this.player_total_for_turn = document.querySelector('.player_total_for_turn');
    this.player_dock_prompt = document.querySelector('.player_dock_prompt');
    this.player_dock_prompt.addEventListener('click', e => this.turnPhaseAdvance());

    this.game_header_toggle_button = document.querySelector('.game_header_toggle_button');
    this.game_header_toggle_button.addEventListener('click', e => this.toggleOptionsPanel(e));

    this.tracer_line_0 = document.querySelector('.tracer_line_0');
    this.tracer_line_1 = document.querySelector('.tracer_line_1');

    this.game_header_panel = document.querySelector('.game_header_panel');

    this.alertErrors = false;
    this.debounceBusy = false;

    this.toggleOptionsPanel();
  }
  debounce() {
    return false;

    if (this.debounceBusy)
      return true;

    this.debounceBusy = true;
    setTimeout(() => this.debounceBusy = false, 500);
    return false;
  }
  toggleOptionsPanel(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (document.body.classList.contains('show_game_table')) {
      document.body.classList.remove('show_game_table');
      document.body.classList.add('show_game_options');
    } else {
      document.body.classList.add('show_game_table');
      document.body.classList.remove('show_game_options');

    }

    return false;
  }
  async authUpdateStatusUI() {
    super.authUpdateStatusUI();
    if (!this.profile)
      return;

    this.currentGame = null;
    this.gameid_span.innerHTML = '';
    this.initRTDBPresence();

    let gameId = this.urlParams.get('game');
    if (gameId) {
      await this.gameAPIJoin(gameId);
      this.currentGame = gameId;
      this.gameid_span.innerHTML = this.currentGame;

      if (this.gameSubscription)
        this.gameSubscription();
      this.gameSubscription = firebase.firestore().doc(`Games/${this.currentGame}`)
        .onSnapshot((doc) => this.paintGameData(doc));
    }
  }
  async load() {
    await this.readJSONFile(`/match/ziplinedeck.json`, 'ziplineCardDeck');
    await this.readJSONFile(`/match/empyreandeck.json`, 'empyreanCardDeck');

    await super.load();
  }
  getCardDeck() {
    if (this.gameData.cardDeck === 'zipline')
      return window.ziplineCardDeck;
    return window.empyreanCardDeck;
  }
  getCardMeta(cardIndex) {
    let cards = 8;
    if (this.gameData.runningNumberOfSeats > 2)
      cards = 12;
    cardIndex = cardIndex % cards;

    let meta = this.getCardDeck()[cardIndex];

    if (!meta)
      meta = {};

    return meta;
  }
  paintGameData(gameDoc = null) {
    if (gameDoc)
      this.gameData = gameDoc.data();

    if (!this.gameData)
      return;

    document.body.classList.add('game_loaded');

    this.queryStringPaintProcess();
    this.paintOptions();
    this.card_deck_display.innerHTML = this.gameData.cardDeck;
    this.card_deck_select.value = this.gameData.cardDeck;
    this.scoring_system_display.innerHTML = this.gameData.scoringSystem;
    this.scoring_system_select.value = this.gameData.scoringSystem;

    this._updateGameMembersList();
    this.paintDock();
    this._paintDockSeats('.match_end_result ');

    if (this.gameData.mode === this.previousMode)
      this.matchBoardRendered = false;
    this.previousMode = this.gameData.mode;

    if (this.matchBoardRendered !== this.gameData.cardCount)
      this._renderMatchBoard();

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

    this.game_header_panel.innerHTML = `${this.gameData.name}`;

    this._updateCardStatus();
    this._updateFinishStatus();
    this.updateUserPresence();
  }

  _updateFinishStatus() {
    if (this.gameData.mode !== 'end')
      return;

    let msg = "Game ended early - no winner"
    if (this.gameData.gameFinished) {
      msg = "";
    }

    this.match_result_message = document.querySelector('.match_result_message');
    this.seat0_total = document.querySelector('.seat0_results .score_total');
    this.seat1_total = document.querySelector('.seat1_results .score_total');
    this.seat2_total = document.querySelector('.seat2_results .score_total');
    this.seat3_total = document.querySelector('.seat3_results .score_total');

    let name = this.gameData.memberNames[this.gameData.seat0];
    if (!name) name = "Anonymous";

    document.querySelector('.seat0_results').classList.remove('winner');
    document.querySelector('.seat1_results').classList.remove('winner');
    document.querySelector('.seat2_results').classList.remove('winner');
    document.querySelector('.seat3_results').classList.remove('winner');

    let w_index = this.gameData.winningSeatIndex;
    if (!w_index)
      w_index = 0;
    document.querySelector(`.seat${w_index}_results`).classList.add('winner');

    this.match_result_message.innerHTML = msg;
    this.seat0_total.innerHTML = `<span class="score_name">${name}</span>
    <span class="score_points">${this.gameData.seatPoints0} pts</span>`;

    if (this.gameData.runningNumberOfSeats > 1) {
      let name = this.gameData.memberNames[this.gameData.seat1];
      if (!name) name = "Anonymous";
      this.seat1_total.innerHTML = `<span class="score_name">${name}</span>
      <span class="score_points">${this.gameData.seatPoints1} pts</span>`;;
    } else
      this.seat1_total.innerHTML = '';

    if (this.gameData.runningNumberOfSeats > 2) {
      let name = this.gameData.memberNames[this.gameData.seat2];
      if (!name) name = "Anonymous";

      this.seat2_total.innerHTML = `<span class="score_name">${name}</span>
      <span class="score_points">${this.gameData.seatPoints2} pts</span>`;;
    } else
      this.seat2_total.innerHTML = '';

    if (this.gameData.runningNumberOfSeats > 3) {
      let name = this.gameData.memberNames[this.gameData.seat3];
      if (!name) name = "Anonymous";

      this.seat3_total.innerHTML = `<span class="score_name">${name}</span>
      <span class="score_points">${this.gameData.seatPoints3} pts</span>`;;
    } else
      this.seat3_total.innerHTML = '';

    this.match_end_display_promo = document.querySelector('.match_end_display_promo');
    let deckIndex = 0;
    if (this.gameData.lastMatchIndex)
      deckIndex = this.gameData.lastMatchIndex;
    let cardMeta = this.getCardMeta(deckIndex);
    this.match_end_display_promo.querySelector('.beer_image').style.backgroundImage = `url(${cardMeta.image})`;
    this.match_end_display_promo.querySelector('.beer_name').innerHTML = cardMeta.brand + ' ' + cardMeta.name;
    this.match_end_display_promo.querySelector('.beer_name_anchor').setAttribute('href', cardMeta.url);

  }
  _updateCardStatus() {
    for (let c = 0, l = this.gameData.cardCount; c < l; c++) {
      this.matchCards[c].classList.remove('previously_shown');
      this.matchCards[c].classList.remove('matched_hidden');
      this.matchCards[c].classList.remove('show_face');
      this.matchCards[c].style.backgroundImage = '';
      this.matchCards[c].classList.remove('selection_missed');
      this.matchCards[c].classList.remove('selection_matched');

      if (this.gameData.cardIndexesShown[c])
        this.matchCards[c].classList.add('previously_shown');
      if (this.gameData.cardIndexesRemoved[c] && c !== this.gameData.previousCard0 &&
        c !== this.gameData.previousCard1)
        this.matchCards[c].classList.add('matched_hidden');
    }

    if (this.gameData.previousCard0 > -1) {
      let card = this.matchCards[this.gameData.previousCard0];
      card.classList.add('show_face');
      let span = card.querySelector('span');
      span.style.backgroundImage = 'url(' + atob(span.dataset.bkg) + ')';
    }
    if (this.gameData.previousCard1 > -1) {
      let card = this.matchCards[this.gameData.previousCard1];
      card.classList.add('show_face');
      let span = card.querySelector('span');
      span.style.backgroundImage = 'url(' + atob(span.dataset.bkg) + ')';
    }

    if (!this.zoom_out_beer_cards)
      return;

    this.zoom_out_beer_cards.forEach(ctl => ctl.classList.remove('selection_missed'));
    this.zoom_out_beer_cards.forEach(ctl => ctl.classList.remove('selection_matched'));

    this._updateCardZoomState();
    if (this.gameData.previousCard0 > -1 && this.gameData.previousCard1 > -1) {
      if (this.gameData.selectionMatched) {
        this.matchCards[this.gameData.previousCard0].classList.add('selection_matched');
        this.matchCards[this.gameData.previousCard1].classList.add('selection_matched');
        this.zoom_out_beer_cards.forEach(ctl => ctl.classList.add('selection_matched'));
      } else {
        this.matchCards[this.gameData.previousCard0].classList.add('selection_missed');
        this.matchCards[this.gameData.previousCard1].classList.add('selection_missed');
        this.zoom_out_beer_cards.forEach(ctl => ctl.classList.add('selection_missed'));
      }

      let smallCard0 = this.matchCards[this.gameData.previousCard0];
      let smallCard1 = this.matchCards[this.gameData.previousCard1];


      let leftOffset = this.match_board_wrapper.getBoundingClientRect().x;
      let topOffset = this.match_board_wrapper.getBoundingClientRect().y;

      function setTracer(smallCard, bigCard, line) {
        let small_width = smallCard.getBoundingClientRect().width;
        let small_height = smallCard.getBoundingClientRect().height;
        let big_width = bigCard.getBoundingClientRect().width;
        let big_height = bigCard.getBoundingClientRect().height;
        let small_x0 = smallCard.getBoundingClientRect().x + small_width / 2;
        let small_y0 = smallCard.getBoundingClientRect().y + small_height / 2;
        let big_x0 = bigCard.getBoundingClientRect().x + big_width / 2;
        let big_y0 = bigCard.getBoundingClientRect().y + big_height / 2;

        let startPoint = [small_x0, small_y0];
        let endPoint = [big_x0, big_y0];
        let rise = endPoint[1] - startPoint[1];
        let run = endPoint[0] - startPoint[0];
        let slope = rise / run;
        let DEGREES = 57.2957795;
        let width = Math.sqrt((rise * rise) + (run * run));

        line.style.top = startPoint[0] + 'px';
        line.style.left = startPoint[1] + 'px';
        line.style.width = width + "px";
        line.style.transform = "rotate(" + (Math.atan(slope) * DEGREES) + "deg)";
        line.style.transformOrigin = "0 0";

        let delta_x0 = small_x0;
        let delta_y0 = small_y0;

        if (small_x0 > big_x0 && small_y0 < big_y0) {
          delta_y0 = big_y0;
          delta_x0 = big_x0;
        } else if (small_x0 > big_x0 && small_y0 > big_y0) {
          delta_x0 = big_x0;
          delta_y0 = big_y0
        }

        line.style.left = delta_x0 - leftOffset + 'px';
        line.style.top = delta_y0 - topOffset + 'px';
      }


      setTracer(smallCard0, this.bigDiv0, this.tracer_line_0);
      this.tracer_line_0.style.display = 'block';
      setTracer(smallCard1, this.bigDiv1, this.tracer_line_1);
      this.tracer_line_1.style.display = 'block';
    } else {
      this.tracer_line_0.style.display = 'none';
      this.tracer_line_1.style.display = 'none';
    }
  }
  _renderMatchBoard() {
    this.matchBoardRendered = this.gameData.cardCount;
    let lower_left = document.querySelector('.lower_left.match_quandrant');
    let lower_right = document.querySelector('.lower_right.match_quandrant');
    let upper_left = document.querySelector('.upper_left.match_quandrant');
    let upper_right = document.querySelector('.upper_right.match_quandrant');
    lower_left.innerHTML = '';
    lower_right.innerHTML = '';
    upper_left.innerHTML = '';
    upper_right.innerHTML = '';

    this.matchCards = [];

    this.cardsPerColumn = 2;
    if (this.gameData.runningNumberOfSeats > 2)
      this.cardsPerColumn = 3;

    for (let cardIndex = 0; cardIndex < this.cardsPerColumn * 8; cardIndex++) {
      let div = document.createElement('div');
      div.classList.add('match_card_wrapper');
      div.addEventListener('click', e => this.cardSelected(e, div, cardIndex));

      let orderIndex = this.gameData.cardIndexOrder[cardIndex];
      let meta = this.getCardMeta(orderIndex);
      let cardInfo = {
        boardPositionIndex: cardIndex,
        orderIndex,
        meta,
        image: meta.image
      };
      div.innerHTML = this._cardTemplate(cardInfo);
      if (cardIndex < this.cardsPerColumn * 2)
        upper_left.appendChild(div);
      else if (cardIndex < this.cardsPerColumn * 4)
        upper_right.appendChild(div);
      else if (cardIndex < this.cardsPerColumn * 6)
        lower_left.appendChild(div);
      else
        lower_right.appendChild(div);

      this.matchCards.push(div);
    }

    this.upperLeftDisplayCard = document.createElement('div');
    this.upperLeftDisplayCard.classList.add('zoom_out_beer_card');
    upper_left.appendChild(this.upperLeftDisplayCard);
    this.upperRightDisplayCard = document.createElement('div');
    this.upperRightDisplayCard.classList.add('zoom_out_beer_card');
    upper_right.appendChild(this.upperRightDisplayCard);
    this.lowerLeftDisplayCard = document.createElement('div');
    this.lowerLeftDisplayCard.classList.add('zoom_out_beer_card');
    lower_left.appendChild(this.lowerLeftDisplayCard);
    this.lowerRightDisplayCard = document.createElement('div');
    this.lowerRightDisplayCard.classList.add('zoom_out_beer_card');
    lower_right.appendChild(this.lowerRightDisplayCard);
    this.upperLeftDisplayCard.addEventListener('click', e => this.turnPhaseAdvance());
    this.upperRightDisplayCard.addEventListener('click', e => this.turnPhaseAdvance());
    this.lowerLeftDisplayCard.addEventListener('click', e => this.turnPhaseAdvance());
    this.lowerRightDisplayCard.addEventListener('click', e => this.turnPhaseAdvance());

    this.zoom_out_beer_cards = document.querySelectorAll('.zoom_out_beer_card');
  }
  turnPhaseAdvance() {
    if (this.uid !== this.gameData['seat' + this.gameData.currentSeat])
      return;

    if (this.gameData.turnPhase === 'result') {
      this._endTurn();
      return;
    }

    this._clearSelection();
    this._updateCardStatus();
  }

  cardSelected(e, div, cardIndex) {
    this.refreshOnlinePresence();

    if (this.uid !== this.gameData['seat' + this.gameData.currentSeat])
      return;

    if (this.gameData.turnPhase !== 'select')
      return this.turnPhaseAdvance();

    if (div.classList.contains('show_face'))
      return;

    div.classList.add('user_click_to_show_face');

    if (this.gameData.previousCard0 < 0) {
      this.gameData.previousCard0 = cardIndex;
      this._sendUpdateSelection();
    } else if (this.gameData.previousCard1 < 0) {
      this.gameData.previousCard1 = cardIndex;
      this._sendSelection();
    } else {
      //alert('selection error');
      return;
    }
  }
  _updateCardZoomState() {
    if (!this.upperLeftDisplayCard)
      return;
    this.upperLeftDisplayCard.style.display = '';
    this.upperRightDisplayCard.style.display = '';
    this.lowerLeftDisplayCard.style.display = '';
    this.lowerRightDisplayCard.style.display = '';
    if (this.gameData.previousCard0 < 0 ||
      this.gameData.previousCard1 < 0) {

    } else {
      let card0 = this.gameData.previousCard0;
      let card1 = this.gameData.previousCard1;
      let q0 = this._quandrantForCard(card0);
      let q1 = this._quandrantForCard(card1);

      let qs0 = 1;
      if (q0 === 0) {
        if (q1 !== 1)
          qs0 = 1;
        else
          qs0 = 2;
      }
      if (q0 === 1) {
        if (q1 !== 3)
          qs0 = 3;
        else
          qs0 = 0;
      }
      if (q0 === 2) {
        if (q1 !== 3)
          qs0 = 3;
        else
          qs0 = 0;
      }
      if (q0 === 3) {
        if (q1 !== 2)
          qs0 = 2;
        else
          qs0 = 1;
      }

      let qs1 = 1;
      if (q1 === 0) {
        if (q0 !== 1 && q1 !== 1 && qs0 !== 1)
          qs1 = 1;
        else
          qs1 = 2;
      }
      if (q1 === 1) {
        if (q0 !== 3 && q1 !== 3 && qs0 !== 3)
          qs1 = 3;
        else
          qs1 = 0;
      }
      if (q1 === 2) {
        if (q0 !== 3 && q1 !== 3 && qs0 !== 3)
          qs1 = 3;
        else
          qs1 = 0;
      }
      if (q1 === 3) {
        if (q0 !== 2 && q1 !== 2 && qs0 !== 2)
          qs1 = 2;
        else
          qs1 = 1;
      }


      let card0Meta = this.getCardMeta(this.gameData.cardIndexOrder[card0]);
      if (qs0 === 0) {
        this.bigDiv0 = this.upperLeftDisplayCard;
        this.upperLeftDisplayCard.style.display = 'block';
        this.upperLeftDisplayCard.style.backgroundImage = `url(${card0Meta.image})`;
        if (q0 === 1) {
          this.upperLeftDisplayCard.style.top = '10%';
          this.upperLeftDisplayCard.style.right = '-5%';
        } else {
          this.upperLeftDisplayCard.style.bottom = '-5%';
          this.upperLeftDisplayCard.style.left = '10%';
        }
      }
      if (qs0 === 1) {
        this.bigDiv0 = this.upperRightDisplayCard;
        this.upperRightDisplayCard.style.display = 'block';
        this.upperRightDisplayCard.style.backgroundImage = `url(${card0Meta.image})`;
        if (q0 === 0) {
          this.upperRightDisplayCard.style.top = '10%';
          this.upperRightDisplayCard.style.left = '-5%';
        } else {
          this.upperRightDisplayCard.style.bottom = '-5%';
          this.upperRightDisplayCard.style.left = '10%';
        }
      }
      if (qs0 === 2) {
        this.bigDiv0 = this.lowerLeftDisplayCard;
        this.lowerLeftDisplayCard.style.display = 'block';
        this.lowerLeftDisplayCard.style.backgroundImage = `url(${card0Meta.image})`;
        if (q0 === 0) {
          this.lowerLeftDisplayCard.style.top = '-5%';
          this.lowerLeftDisplayCard.style.left = '10%';
        } else {
          this.lowerLeftDisplayCard.style.top = '10%';
          this.lowerLeftDisplayCard.style.right = '-5%';
        }
      }
      if (qs0 === 3) {
        this.bigDiv0 = this.lowerRightDisplayCard;
        this.lowerRightDisplayCard.style.display = 'block';
        this.lowerRightDisplayCard.style.backgroundImage = `url(${card0Meta.image})`;
        if (q0 === 1) {
          this.lowerRightDisplayCard.style.top = '-5%';
          this.lowerRightDisplayCard.style.left = '10%';
        } else {
          this.lowerRightDisplayCard.style.top = '10%';
          this.lowerRightDisplayCard.style.left = '-5%';
        }
      }

      let card1Meta = this.getCardMeta(this.gameData.cardIndexOrder[card1]);
      if (qs1 === 0) {
        this.bigDiv1 = this.upperLeftDisplayCard;
        this.upperLeftDisplayCard.style.display = 'block';
        this.upperLeftDisplayCard.style.backgroundImage = `url(${card1Meta.image})`;
        if (q1 === 1) {
          this.upperLeftDisplayCard.style.top = '10%';
          this.upperLeftDisplayCard.style.right = '-5%';
        } else {
          this.upperLeftDisplayCard.style.bottom = '-5%';
          this.upperLeftDisplayCard.style.left = '10%';
        }
      }
      if (qs1 === 1) {
        this.bigDiv1 = this.upperRightDisplayCard;
        this.upperRightDisplayCard.style.display = 'block';
        this.upperRightDisplayCard.style.backgroundImage = `url(${card1Meta.image})`;
        if (q1 === 0) {
          this.upperRightDisplayCard.style.top = '10%';
          this.upperRightDisplayCard.style.left = '-5%';
        } else {
          this.upperRightDisplayCard.style.bottom = '-5%';
          this.upperRightDisplayCard.style.left = '10%';
        }
      }
      if (qs1 === 2) {
        this.bigDiv1 = this.lowerLeftDisplayCard;
        this.lowerLeftDisplayCard.style.display = 'block';
        this.lowerLeftDisplayCard.style.backgroundImage = `url(${card1Meta.image})`;
        if (q1 === 0) {
          this.lowerLeftDisplayCard.style.top = '-5%';
          this.lowerLeftDisplayCard.style.left = '10%';
        } else {
          this.lowerLeftDisplayCard.style.top = '10%';
          this.lowerLeftDisplayCard.style.right = '-5%';
        }
      }
      if (qs1 === 3) {
        this.bigDiv1 = this.lowerRightDisplayCard;
        this.lowerRightDisplayCard.style.display = 'block';
        this.lowerRightDisplayCard.style.backgroundImage = `url(${card1Meta.image})`;
        if (q1 === 1) {
          this.lowerRightDisplayCard.style.top = '-5%';
          this.lowerRightDisplayCard.style.left = '10%';
        } else {
          this.lowerRightDisplayCard.style.top = '10%';
          this.lowerRightDisplayCard.style.left = '-5%';
        }
      }


      this.cardShowQs = {
        q0,
        q1,
        qs0,
        qs1
      }
    }
  }
  _quandrantForCard(card) {
    return Math.floor(card / (this.cardsPerColumn * 2));
  }
  async _sendSelection() {
    if (this.debounce())
      return;
    //  this.match_start.setAttribute('disabled', true);
    let action = 'sendSelection';
    let selectedCards = [];
    let body = {
      gameId: this.currentGame,
      previousCard0: this.gameData.previousCard0,
      previousCard1: this.gameData.previousCard1,
      action,
      selectedCards
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
      console.log('selection send fail', json);
      if (this.alertErrors)
        alert('Failed to send selection: ' + json.errorMessage);
      return;
    }
  }
  async _sendUpdateSelection() {
    if (this.debounce())
      return;
    //  this.match_start.setAttribute('disabled', true);
    let action = 'updateSelection';

    let body = {
      gameId: this.currentGame,
      action,
      previousCard0: this.gameData.previousCard0
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
      console.log('selection send fail', json);
      if (this.alertErrors)
        alert('Failed to send selection: ' + json.errorMessage);
      return;
    }
  }
  async _endTurn() {
    if (this.debounce())
      return;

    this.match_start.setAttribute('disabled', true);
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
    this.match_start.removeAttribute('disabled');

    if (!json.success) {
      console.log('selection send resolve', json);
      if (this.alertErrors)
        alert('Failed to resolve selection: ' + json.errorMessage);
      return;
    }
  }
  async _clearSelection() {
    if (this.debounce())
      return;
    this.match_start.setAttribute('disabled', true);
    let action = 'clearSelection';
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
      console.log('selection send resolve', json);
      if (this.alertErrors)
        alert('Failed to resolve selection: ' + json.errorMessage);
      return;
    }
  }
  _cardTemplate(cardInfo) {
    return `<span class="card_inner" data-bkg="${btoa(cardInfo.image)}"></span>`
  }
}
