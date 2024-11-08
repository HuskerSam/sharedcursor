import BaseApp from '/models/baseapp.js';
import Utility from '/models/utility.js';

export class ProfileApp extends BaseApp {
  constructor() {
    super();

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

    this.night_mode_select = document.querySelector('.night_mode_select');
    this.night_mode_select.addEventListener('input', e => {
      let index = 0;
      let niteMode = 2;
      if (this.nightModeCurrent)
        niteMode = 1;
      if (this.night_mode_select.value === 'day')
        index = 1;
      if (this.night_mode_select.value === 'night')
        index = 2;
      this.updateProfileNightMode(null, index);
    });

    this.audio_mode_select = document.querySelector('.audio_mode_select');
    this.audio_mode_select.addEventListener('input', e => {
      let index = 1;
      if (this.audio_mode_select.value === 'muted')
        index = 0;
      this.updateProfileAudioMode(null, index, e);
    });


    this.reset_profile = document.querySelector('.reset_profile');
    this.reset_profile.addEventListener('click', e => {
      if (confirm("Are you sure you want to clear out all reviews and profile data?")) {
        this._authCreateDefaultProfile();
      }
      e.preventDefault();
      return true;
    });

    this.profile_display_name = document.querySelector('.profile_display_name');
    this.profile_display_image = document.querySelector('.profile_display_image');

    this.profile_display_image_upload = document.querySelector('.profile_display_image_upload');
    this.profile_display_image_upload.addEventListener('click', e => this.uploadProfileImage());

    this.file_upload_input = document.querySelector('.file_upload_input');
    this.file_upload_input.addEventListener('input', e => this.fileUploadSelected());

    this.profile_display_image_clear = document.querySelector('.profile_display_image_clear');
    this.profile_display_image_clear.addEventListener('click', e => this.clearProfileImage());

    this.profile_display_image_preset = document.querySelector('.profile_display_image_preset');
    this.profile_display_image_preset.addEventListener('input', e => this.selectedProfilePreset());

    this.profile_randomize_name = document.querySelector('.profile_randomize_name');
    this.profile_randomize_name.addEventListener('click', e => this.randomizeProfileName());

    this.user_email = document.querySelector('.user_email');

    this.change_email_button = document.querySelector('.change_email_button');
    this.change_email_button.addEventListener('click', e => this.changeEmail());

    this.delete_profile_button = document.querySelector('.delete_profile_button');
    this.delete_profile_button.addEventListener('click', e => this.deleteAccount());

    this.card_select_list = document.querySelector('.card_select_list');

    this.initPresetLogos();

    this.help_panel_buttons = document.querySelectorAll('.help_panel_button');
    this.help_panel_buttons.forEach(ctl => ctl.addEventListener('click', e => {
      if (ctl.dataset.levels === '3')
        ctl.parentElement.parentElement.parentElement.classList.toggle('expanded');
      else
        ctl.parentElement.parentElement.classList.toggle('expanded');
    }));

    this.sign_out_all_button = document.querySelector('.sign_out_all_button');
    this.sign_out_all_button.addEventListener('click', e => this.signOutAll());


    this.canvasDisplayModal = document.querySelector('#canvasDisplayModal');
    this.view_avatar_btn = document.querySelector('.view_avatar_btn');
    this.view_avatar_btn.addEventListener('click', e => this.viewAvatar());

    this.clear_avatar_btn = document.querySelector('.clear_avatar_btn');
    this.clear_avatar_btn.addEventListener('click', e => {
      this.updateAvatarPreset('');
    });

    this.profile_display_avatar_preset = document.querySelector('.profile_display_avatar_preset');

    this.modal = new bootstrap.Modal(this.canvasDisplayModal);

    this.create_login_code_button = document.querySelector('.create_login_code_button');
    this.create_login_code_button.addEventListener('click', e => this.createLoginCode());

    this.access_code_login = document.querySelector('#access_code_login');
    this.access_code_login.addEventListener('click', e => this.customCodeLogin());

    window.addEventListener('message', event => this.handleiFrameMessage(event));
  }
  async createLoginCode() {
    let body = {};
    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + `api/user/auth/custom`, {
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
      alert('failed to create code');
    }
    document.querySelector('.login_code_display').innerHTML = json.data.accessCode;
    console.log(json);
  }
  async customCodeLogin() {
    let accessCode = document.querySelector('.access_code').value;
    let body = {
      accessCode
    };
    let f_result = await fetch(this.basePath + `api/user/auth/query`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    let json = await f_result.json();

    if (!json.success) {
      alert('failed to login');
      return;
    }
    console.log(json);
    if (json.customToken) {
      await firebase.auth().signInWithCustomToken(json.customToken);
    } else {
      alert('login failed');
      return;
    }
  }
  async updateAvatarPreset(displayAvatar) {
    let updatePacket = {
      displayAvatar
    };
    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).set(updatePacket, {
        merge: true
      });
  }
  async viewAvatar() {
    this.modal.show();
  }
  async load() {
    await super.load();
  }
  async initPresetLogos() {
    this.profileLogos = await this.readJSONFile(`/profile/logos.json`);
    let html = '<option value="">Select a preset image</option>';

    for (let logo in this.profileLogos) {
      let desc = logo.replaceAll('-', ' ').replaceAll('_', '&');
      html += `<option value="${this.profileLogos[logo]}">${desc}</option>`
    }

    this.profile_display_image_preset.innerHTML = html;
  }
  async selectedProfilePreset() {
    let updatePacket = {
      rawImage: this.profile_display_image_preset.value,
      displayImage: this.profile_display_image_preset.value
    };
    if (this.fireToken)
      await firebase.firestore().doc(`Users/${this.uid}`).set(updatePacket, {
        merge: true
      });
  }
  async authSignInClick(e) {
    e.preventDefault();
    if (this.fireToken) {
      await firebase.auth().signOut();

      this.fireToken = null;
      this.fireUser = null;
      this.uid = null;

      location = '/profile';
      location.reload();
    }
  }
  async changeEmail() {
    let newEmail = document.querySelector('.profile_new_email').value.trim();

    let oldEmail = this.fireUser.email;
    if (newEmail === oldEmail) {
      alert('Email is already ' + oldEmail);
      return;
    }

    if (!confirm(`Are you sure you want to change your email to ${newEmail} from ${oldEmail}?`)) {
      return;
    }

    let success = true;
    try {
      await this.fireUser.updateEmail(newEmail)
    } catch (error) {
      success = false;
      alert('email change FAILED: \n' + error.message);
    }

    if (success) {
      this.authSignInClick();
    }
  }
  authUpdateStatusUI() {
    if (this.profile) {
      let displayName = this.profile.displayName;
      if (!displayName)
        displayName = '';

      this.profile_display_name.innerHTML = displayName;

      if (this.profile.displayImage)
        this.profile_display_image.style.backgroundImage = `url(${this.profile.displayImage})`;
      else
        this.profile_display_image.style.backgroundImage = `url(/images/defaultprofile.png)`;

      if (this.profile.displayImage)
        this.profile_display_image_preset.value = this.profile.displayImage;
      else
        this.profile_display_image_preset.selectedIndex = 0;

      if (this.fireUser.isAnonymous)
        this.user_email.innerHTML = 'Anonymous';
      else
        this.user_email.innerHTML = this.fireUser.email;


      if (!this.profile.nightModeState)
        this.profile.nightModeState = 0;
      this.night_mode_select.value = '';
      if (this.profile.nightModeState === 1)
        this.night_mode_select.value = 'day';
      if (this.profile.nightModeState === 2)
        this.night_mode_select.value = 'night';

      if (!this.profile.muteState) {
        this.muted = false
        this.profile.muteState = false;
        this.audio_mode_select.selectedIndex = 0;
      } else {
        this.muted = true;
        this.profile.muteState = true;
        this.audio_mode_select.selectedIndex = 1;
      }

      this.profile_display_avatar_preset.innerHTML = this.profile.displayAvatar;

      //this.initGraphics();
    }

    super.authUpdateStatusUI();
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
  testFunction() {
    
  }
  async randomizeProfileName() {
    let updates = {
      displayName: Utility.generateName()
    };

    await firebase.firestore().doc(`Users/${this.uid}`).set(updates, {
      merge: true
    });
  }
  async signOutAll() {
    let body = {};
    let token = await firebase.auth().currentUser.getIdToken();
    let f_result = await fetch(this.basePath + `api/user/signallout`, {
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
      alert('Failed to logout all');
    }
    location.reload();
  }

  handleiFrameMessage(json) {
    this.updateAvatarPreset(json.data);
    //this.profile_display_avatar_preset.innerHTML = json.data;
  }
}
