import BaseApp from '/models/baseapp.js';

export class ProfileApp extends BaseApp {
  constructor() {
    super();

    this.review_count = document.querySelector('.review_count');
    this.review_overall = document.querySelector('.overall_count');
    this.feed_list_wrapper = document.querySelector('.feed_list_wrapper');
    this.logged_in_status = document.querySelector('.logged_in_status');
    this.location_list_display = document.querySelector('.location_list_display');
    this.brewery_list_display = document.querySelector('.brewery_list_display');
    this.beer_list_display = document.querySelector('.beer_list_display');

    this.login_google = document.getElementById('login_google');
    this.login_google.addEventListener('click', e => this.authGoogleSignIn(e));
    this.login_email_anchor = document.getElementById('login_email_anchor');
    this.login_email_anchor.addEventListener('click', e => this.signInByEmail(e));

    this.login_email = document.querySelector('.login_email');
    this.anon_login_anchor = document.querySelector('.anon_login_anchor');
    this.anon_login_anchor.addEventListener('click', e => this.signInAnon(e));

    this.sign_out_button = document.querySelector('.sign_out_button');
    this.sign_out_button.addEventListener('click', e => {
      this.authSignInClick(e);
      e.preventDefault();
      return false;
    });

    this.night_mode_radios = document.querySelectorAll('[name="night_mode_radio"]');
    this.night_mode_radios.forEach((ctl, index) => ctl.addEventListener('input', e => {
      this.updateProfileNightMode(ctl, index, e);
    }));

    this.mute_audio_radios = document.querySelectorAll('[name="mute_audio_radio"]');
    this.mute_audio_radios.forEach((ctl, index) => ctl.addEventListener('input', e => {
      this.updateProfileAudioMode(ctl, index, e);
    }));

    this.reset_profile = document.querySelector('.reset_profile');
    this.reset_profile.addEventListener('click', e => {
      if (confirm("Are you sure you want to clear out all reviews and profile data?")) {
        this._authCreateDefaultProfile();
      }
      e.preventDefault();
      return true;
    });

    this.filter_radios = document.querySelectorAll('.filter_panel input');
    this.filter_radios.forEach(ctl => ctl.addEventListener('input', e => this.initReportsFeed(true)));

    this.profile_display_name = document.querySelector('.profile_display_name');
    this.profile_display_image = document.querySelector('.profile_display_image');
    this.profile_display_name.addEventListener('input', e => this.displayNameChange());

    this.profile_display_image_upload = document.querySelector('.profile_display_image_upload');
    this.profile_display_image_upload.addEventListener('click', e => this.uploadProfileImage());

    this.file_upload_input = document.querySelector('.file_upload_input');
    this.file_upload_input.addEventListener('input', e => this.fileUploadSelected());

    this.profile_display_image_clear = document.querySelector('.profile_display_image_clear');
    this.profile_display_image_clear.addEventListener('click', e => this.clearProfileImage());

    this.profile_display_image_preset = document.querySelector('.profile_display_image_preset');
    this.profile_display_image_preset.addEventListener('input', e => this.selectedProfilePreset());

    this.initPresetLogos();
  }
  async load() {
    await this.readJSONFile(`https://firebasestorage.googleapis.com/v0/b/${this.projectId}.appspot.com/o/beerJSON%2FstoreMap.json?alt=media`, 'storesJSON');
    await super.load();
  }
  async initPresetLogos() {
    await this.readJSONFile(`/profile/logos.json`, 'profileLogos');
    let html = '<option>Select a preset image</option>';

    for (let logo in window.profileLogos) {
      html += `<option value="${window.profileLogos[logo]}">${logo}</option>`
    }

    this.profile_display_image_preset.innerHTML = html;
  }
  async selectedProfilePreset() {
    if (this.profile_display_image_preset.selectedIndex > 0) {
      let updatePacket = {
        rawImage: this.profile_display_image_preset.value,
        displayImage: this.profile_display_image_preset.value
      };
      if (this.fireToken)
        await firebase.firestore().doc(`Users/${this.uid}`).set(updatePacket, {
          merge: true
        });
    }
  }
  async authSignInClick(e) {
    e.preventDefault();
    if (this.fireToken) {
      await firebase.auth().signOut();

      this.fireToken = null;
      this.fireUser = null;
      this.uid = null;

      location = '/profile';
    }
  }
  async initReportsFeed(reload) {
    if (this.reportsInited && !reload)
      return;
    this.reportsInited = true;
    if (this.reportsSubscription)
      this.reportsSubscription();

    let index = 0;
    this.filter_radios.forEach((ctl, i) => {
      if (ctl.checked)
        index = i;
    });

    if (index === 0) {
      this.reportsSubscription = firebase.firestore().collection(`Reports`)
        .orderBy('activityDate', 'desc')
        .limit(this.feedLimit)
        .where('creator', '==', this.uid)
        .onSnapshot(snapshot => this.updateReportsDom(snapshot));
    } else if (index === 1) {
      this.reportsSubscription = firebase.firestore().collection(`Reports`)
        .orderBy('activityDate', 'desc')
        .limit(this.feedLimit)
        .where('creator', '==', this.uid)
        .where('sent', '==', false)
        .onSnapshot(snapshot => this.updateReportsDom(snapshot));
    } else if (index === 2) {
      this.reportsSubscription = firebase.firestore().collection(`Reports`)
        .orderBy('activityDate', 'desc')
        .limit(this.feedLimit)
        .where('creator', '==', this.uid)
        .where('responded', '==', true)
        .onSnapshot(snapshot => this.updateReportsDom(snapshot));
    }
  }
  _renderReportListLine(doc) {
    return this._render2BeerReportLine(doc);
  }
  authUpdateStatusUI() {
    if (this.profile) {
      let displayName = this.profile.displayName;
      if (!displayName)
        displayName = '';

      if (!this.lastNameChange || this.lastNameChange + 2000 < new Date())
        this.profile_display_name.value = displayName;

      if (this.profile.displayImage)
        this.profile_display_image.style.backgroundImage = `url(${this.profile.displayImage})`;
      else
        this.profile_display_image.style.backgroundImage = `url(/images/defaultprofile.png)`;

      if (this.profile.displayImage)
        this.profile_display_image_preset.value = this.profile.displayImage;
      else
        this.profile_display_image_preset.selectedIndex = 0;
    }

    super.authUpdateStatusUI();
    this.initReportsFeed();
    this.updateInfoProfile();
    this.updateFavorites();
  }
  async displayNameChange() {
    this.profile.displayName = this.profile_display_name.value.trim().substring(0, 15);

    let updatePacket = {
      displayName: this.profile.displayName
    };
    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).set(updatePacket, {
        merge: true
      });
    this.lastNameChange = new Date();
  }
  updateFavorites() {
    if (!this.profile)
      return;
    if (!window.storesJSON || !window.breweryJSON || !this.allBeers)
      return;

    let loc_html = '';
    if (this.profile.favoriteStores) {
      let storeSlugs = Object.keys(this.profile.favoriteStores).sort();
      storeSlugs.forEach(slug => {
        let store = window.storesJSON[slug];
        loc_html += `<div class="store_anchor_wrapper"><a class="location_link_anchor" style="flex:1" href="/map/?store=${slug}">
          <div style="background-image:url(${store.mapImage})"></div>
          <span>${store.name}</span></a>
          <a href="/map?store=${slug}"><i class="material-icons">map</i></a></div>`;
      });
    }
    this.location_list_display.innerHTML = loc_html;

    loc_html = '';
    if (this.profile.favoriteBreweries) {
      let brewerySlugs = Object.keys(this.profile.favoriteBreweries).sort();
      brewerySlugs.forEach(slug => {
        let b = window.breweryJSON[slug];
        let name = b.name;
        let img = b.mapImage;
        if (!name) {
          name = 'Baseline Beers';
          img = '/images/logo64.png';
        }
        if (slug === 'baseline')
          name = "Baseline Beers";
        loc_html += `<a href="/${slug}" class="location_link_anchor">
        <div style="background-image:url(${img})"></div>
        <span>${name}</span></a>`;
      });
    }
    this.brewery_list_display.innerHTML = loc_html;

    loc_html = '';
    if (this.profile.favoriteBeers) {
      let brewerySlugs = Object.keys(this.profile.favoriteBeers).sort();
      brewerySlugs.forEach(slug => {
        let beer = this.allBeers[slug];
        let path = slug.split(':').join('/');
        loc_html += `
        <a href="/${path}" class="location_link_anchor">
        <div style="background-image:url(${beer.mapImage})"></div>
        <span>${this.gameNameForBeer(slug)}</span></a>`;
      });
    }
    this.beer_list_display.innerHTML = loc_html;
  }
  updateInfoProfile() {
    if (!this.profile || !this.tagList) {
      return;
    }
    let email = firebase.auth().currentUser.email;
    if (!email)
      email = 'Anonymous Login';
    else
      email = email;
    this.logged_in_status.innerHTML = email;

    if (!this.profile.nightModeState)
      this.profile.nightModeState = 0;
    if (this.night_mode_radios.length > 0) {
      this.night_mode_radios[this.profile.nightModeState].checked = true;
    }

    if (!this.profile.muteState) {
      this.muted = false
      this.profile.muteState = false;
    } else {
      this.muted = true;
      this.profile.muteState = true;
    }
    if (this.mute_audio_radios.length > 0) {
      if (this.muted)
        this.mute_audio_radios[0].checked = true;
      else
        this.mute_audio_radios[1].checked = true;
    }

    let html = '';
    if (!this.userProfileSums)
      this.userProfileSums = {};

    if (this.userProfileSums.overall) {
      let totals = window.beerTotals.beers;
      let count = Object.keys(totals).length;

      let ratio = (this.userProfileSums.count / count) * 100;

      this.review_count.innerHTML = this.userProfileSums.count + ' / ' + count;
      this.review_overall.innerHTML = (this.userProfileSums.overall * 10).toFixed(0);
    }

    let basicTags = [];
    let bitterTags = [];
    let distinctTags = [];
    for (let tag in window.beerTagsMap) {
      if (window.beerTagsMap[tag] === 'basic')
        basicTags.push(tag);
      if (window.beerTagsMap[tag] === 'bitter')
        bitterTags.push(tag);
      if (window.beerTagsMap[tag] === 'distinct')
        distinctTags.push(tag);
    }

    basicTags = basicTags.sort();
    bitterTags = bitterTags.sort();
    distinctTags = distinctTags.sort();

    let htmlForTag = (tag) => {
      let index = this.tagList.indexOf(tag);
      let backgroundColor = this.tagColors[index];
      let color = this.tagPens[index];
      let result = '';

      let value = 0;
      let count = 0;
      if (this.userProfileSums[tag]) {
        value = this.userProfileSums[tag];
        count = this.userProfileSums[tag + 'Count'];
      }
      let tag_display = tag + '<span>' + count + '</span>';

      result += `<div style="display:inline-block;position:relative;margin-right:6px;"><a class="floating_tag_display" href="/?tag=${tag}">
                <div>
                  ${tag_display}
                </div>
              </a>
              <a class="floating_tag_display second" href="/?tag=${tag}"  style="background-color:${backgroundColor};color:${color};width:${value * 100}%">
                <div>
                  ${tag_display}
                </div>
              </a></div>`;
      return result;
    };

    html = '';
    basicTags.forEach(tag => {
      html += htmlForTag(tag);
    });
    document.querySelector('.review_basic_levels').innerHTML = html;

    html = "";
    bitterTags.forEach(tag => {
      html += htmlForTag(tag);
    });
    document.querySelector('.review_bitter_levels').innerHTML = html;

    html = "";
    distinctTags.forEach(tag => {
      html += htmlForTag(tag);
    });
    document.querySelector('.review_distinct_levels').innerHTML = html;

    html = 'Please review beers for likability predictions!';
    if (this.profile.beerReviews && window.beerTotals) {
      let reviewSlugs = Object.keys(this.profile.beerReviews);
      if (reviewSlugs.length > 0) {
        html = '';
        reviewSlugs = reviewSlugs.sort();
        reviewSlugs.forEach(slug => {
          let slugs = slug.split(':');
          let review = this.profile.beerReviews[slug];
          let overall = review.overall * 10.0;

          html += `<div style="display:block;position:relative;"><a class="floating_tag_display beers"
           href="/${slugs[0]}/${slugs[1]}">
                    <div>
                      ${this.gameNameForBeer(slug)}
                    </div>
                  </a>
                  <a class="floating_tag_display second beers" href="/${slugs[0]}/${slugs[1]}"
                  style="background-color:rgb(250,190,50);color:rgb(0,0,0);width:${overall}%">
                    <div>
                      ${this.gameNameForBeer(slug)}
                    </div>
                  </a></div>`;
        })
      }
    }
    document.querySelector('.beer_review_list').innerHTML = html;
  }
  uploadProfileImage() {
    this.file_upload_input.click();
  }
  async fileUploadSelected() {
    let file = this.file_upload_input.files[0];
    let sRef = firebase.storage().ref("Users").child(this.uid + '/pimage');

    if (file.size > 1500000) {
      alert('File needs to be less than 1mb in size');
      return;
    }

    this.profile_display_image.style.backgroundImage = ``;

    let result = await sRef.put(file);
    let path = await sRef.getDownloadURL();
    setTimeout(() => this._finishImagePathUpdate(path), 1500);
  }
  async _finishImagePathUpdate(path) {
    let sRef2 = firebase.storage().ref("Users").child(this.uid + '/_resized/pimage_70x70');
    let resizePath = await sRef2.getDownloadURL();
    let updatePacket = {
      rawImage: path,
      displayImage: resizePath
    };
    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).set(updatePacket, {
        merge: true
      });
  }
  async clearProfileImage() {
    let updatePacket = {
      displayImage: ''
    };
    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).set(updatePacket, {
        merge: true
      });
  }
}
