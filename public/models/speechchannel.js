import U3D from '/models/utility3d.js';

export default class SpeechChannel {
  constructor(app) {
    this.app = app;
  }
  async avatarShowMessage(seatIndex, text, timeToShow = 10000, timeToBlock = 5000) {
    if (!this.app.avatarMetas[seatIndex].chatPanel) {
      let chatTN = new BABYLON.TransformNode('chattnfor' + seatIndex, this.app.scene);

      let chatBubbleMesh = BABYLON.MeshBuilder.CreatePlane('chatbubblefor' + seatIndex, {
        width: 5,
        height: 3
      }, this.app.scene);
      let mat = new BABYLON.StandardMaterial('chatbubblematfor' + seatIndex, this.app.scene);
      let texturePath = '/fontcons/chat' + seatIndex.toString() + '.svg';
      let tex = new BABYLON.Texture(texturePath, this.app.scene, false, false);
      tex.hasAlpha = true;
      mat.diffuseTexture = tex;
      mat.ambientTexture = tex;
      mat.emissiveTexture = tex;
      chatBubbleMesh.material = mat;
      chatBubbleMesh.position.x = -1.5;
      chatBubbleMesh.scaling = U3D.v(-1, 1, 1);
      chatBubbleMesh.rotation.x = Math.PI;
      chatBubbleMesh.parent = chatTN;
      chatBubbleMesh.isPickable = false;

      chatTN.position.y = 3.5;
      chatTN.rotation.y = Math.PI;
      chatTN.billboardMode = BABYLON.TransformNode.BILLBOARDMODE_Y;
      chatTN.isPickable = false;

      chatTN.parent = this.app.avatarHelper.initedAvatars[seatIndex].avatarPositionTN;
      this.app.avatarMetas[seatIndex].chatPanel = chatTN;
      this.app.avatarMetas[seatIndex].chatBubble = chatBubbleMesh;
    }

    this._updateAvatarTextChat(seatIndex, text, true);

    this.app.avatarMetas[seatIndex].chatPanel.setEnabled(true);
    clearTimeout(this.app.avatarMetas[seatIndex].chatCloseTimeout);
    this.app.avatarMetas[seatIndex].chatCloseTimeout = setTimeout(() => {
      this.app.avatarMetas[seatIndex].chatPanel.setEnabled(false);
    }, timeToShow);

    await this.waitTime(timeToBlock);
  }
  async waitTime(time) {
    return new Promise((res, rej) => {
      setTimeout(() => res(), time);
    })
  }
  _updateAvatarTextChat(seatIndex, text, reset) {
    let avatarMeta = this.app.avatarMetas[seatIndex]
    clearTimeout(avatarMeta.chatTextTimer);

    if (reset) {
      this.avatarMessage(seatIndex, text);
      avatarMeta.avatarChatCurrentWords = 0;
    }
    avatarMeta.avatarChatCurrentWords++;

    let words = text.split(' ');
    if (words.length < avatarMeta.avatarChatCurrentWords)
      return;
    //words = words.slice(0, avatarMeta.avatarChatCurrentWords);

    if (avatarMeta.chatTextPlane) {
      avatarMeta.chatTextPlane.dispose(true, true);
      avatarMeta.chatTextPlane2.dispose(true, true);
      avatarMeta.chatTextPlane3.dispose(true, true);
    }

    let color = U3D.color('0,0,0');
    if (seatIndex > 2)
      color = U3D.color('1,1,1');

    let line1Words = words.slice(0, 4);
    let line1 = line1Words.join(' ');
    let chatTextPlane = U3D.addTextPlane(this.app.scene, line1, color);
    avatarMeta.chatTextPlane = chatTextPlane;
    chatTextPlane.parent = avatarMeta.chatBubble;
    chatTextPlane.position.z = -0.01;
    chatTextPlane.position.y = -0.6;
    chatTextPlane.rotation.x = Math.PI;
    chatTextPlane.scaling = U3D.v(0.5, 0.5, 0.5);

    let line2Show = avatarMeta.avatarChatCurrentWords > 4;
    let line2Words = words.slice(4, 8);
    let line2 = line2Words.join(' ');
    if (!line2Show)
      line2 = '';
    let chatTextPlane2 = U3D.addTextPlane(this.app.scene, line2, color);
    chatTextPlane2.parent = chatTextPlane;
    chatTextPlane2.position.y = -1.1;
    avatarMeta.chatTextPlane2 = chatTextPlane2;

    let line3Show = avatarMeta.avatarChatCurrentWords > 8;
    let line3Words = words.slice(8, 12);
    let line3 = line3Words.join(' ');
    if (!line3Show)
      line3 = '';
    let chatTextPlane3 = U3D.addTextPlane(this.app.scene, line3, color);
    chatTextPlane3.parent = chatTextPlane;
    chatTextPlane3.position.y = -2.2;
    avatarMeta.chatTextPlane3 = chatTextPlane3;

    avatarMeta.chatTextTimer = setTimeout(() => this._updateAvatarTextChat(seatIndex, text), 600);
  }
  async avatarMessage(seatIndex, text) {
    let avatarMeta = this.app.avatarMetas[seatIndex];

    let voiceName = avatarMeta.voiceName;
    let fileResult = await this.getMP3ForText(text, voiceName);
    let soundPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/' + encodeURIComponent(fileResult) + '?alt=media&fileext=.mp3';
    if (this.voiceSoundObject) {
      this.voiceSoundObject.stop();
      this.voiceSoundObject.dispose();
    }

    this.voiceSoundObject = new BABYLON.Sound("voiceSoundObject", soundPath, this.app.scene, null, {
      loop: false,
      autoplay: true
    });
    this.voiceSoundObject.attachToMesh(avatarMeta.chatBubble);
  }
  async getMP3ForText(text, voiceName = 'en-AU-Standard-A') {
    if (!this.app.fireToken)
      return;

    let body = {
      text,
      voiceName
    };
    let token = await firebase.auth().currentUser.getIdToken();
    let basePath = `https://us-central1-${this.app.projectId}.cloudfunctions.net/`;
    let f_result = await fetch(basePath + 'api/games/texttospeech', {
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
    let soundPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/' + encodeURIComponent(json.path) + '?alt=media&fileext=.mp3';
    window.lastSoundPath = soundPath;
    return json.path;
  }
}
