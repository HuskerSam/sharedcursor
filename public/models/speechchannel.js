import U3D from '/models/utility3d.js';
const charactersPerLine = 25;
const charactersPerSentance = charactersPerLine * 3;

export default class SpeechChannel {
  constructor(app) {
    this.app = app;
    this.lingerTime = 2000;
    this.chatCloseTimeout = null;
    this.activeSeatIndex = -1;
    this.seatState = new Array(4).fill({});

    this.app.avatarMetas.forEach((avatarMeta, seatIndex) => {
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
      avatarMeta.chatPanel = chatTN;
      avatarMeta.chatBubble = chatBubbleMesh;
      avatarMeta.chatPanel.setEnabled(false);
    });
  }
  splitLongText(text) {
    if (text.length <= charactersPerSentance)
      return [text];

    let words = text.split(' ');
    let charCount = 0;
    let charThreshold = text.length / 2;

    let firstHalfCount = 0;
    while (charCount < charThreshold)
      charCount += words[firstHalfCount++].length + 1;

    let part1 = words.slice(0, firstHalfCount).join(' ');
    let part2 = words.slice(firstHalfCount).join(' ');
    let parts1 = this.splitLongText(part1);
    let parts2 = this.splitLongText(part2);

    return parts1.concat(parts2);
  }
  async generateSoundSegments(seatIndex, text) {
    if (this.seatState[seatIndex].text === text)
      return;
    this.seatState[seatIndex].text = text;

    let seatState = this.seatState[seatIndex];
    seatState.totalCharacters = text.length;

    if (text.slice(-1) === '.')
      text = text.slice(0, -1);
    let sentances = text.split('. ');
    seatState.textFragments = [];
    let sentanceStopIndexes = [];
    sentances.forEach(sentance => {
      sentance = sentance.trim();
      let frags = this.splitLongText(sentance.trim());
      seatState.textFragments = seatState.textFragments.concat(frags);
      sentanceStopIndexes.push(seatState.length - 1);
    });

    console.log(seatState.textFragments);

    let avatarMeta = this.app.avatarMetas[seatIndex];
    let voiceName = avatarMeta.voiceName;
    let promises = [];
    seatState.textFragments.forEach((fragment, fragmentIndex) => {
      promises.push(this.getMP3ForText(fragment, voiceName));
    });
    let fileNames = await Promise.all(promises);
    seatState.mp3Fragments = [];
    fileNames.forEach(fileName => {
      seatState.mp3Fragments.push('https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/' + encodeURIComponent(fileName) + '?alt=media&fileext=.mp3');
    });
  }
  async avatarShowMessage(seatIndex, text) {
    await this.generateSoundSegments(seatIndex, text);
    this.app.avatarMetas[seatIndex].chatPanel.setEnabled(true);
    this.playText(seatIndex, text);
  }
  async waitTime(time) {
    return new Promise((res, rej) => {
      setTimeout(() => res(), time);
    })
  }
  _waitUntilObservable(observable) {
    return new Promise((res, rej) => {
      observable.addOnce(() => res());
    });
  }
  async playText(seatIndex, text) {
    let avatarMeta = this.app.avatarMetas[seatIndex]

    let mp3Fragments = this.seatState[seatIndex].mp3Fragments;
    let localSoundObjects = [];
    for (let fragmentIndex = 0, l = mp3Fragments.length; fragmentIndex < l; fragmentIndex++) {
      localSoundObjects.push(new BABYLON.Sound("voiceSoundObject", mp3Fragments[fragmentIndex], this.app.scene, null, {
        loop: false,
        autoplay: false
      }));
      localSoundObjects[fragmentIndex].attachToMesh(avatarMeta.chatBubble);
    }

    for (let fragmentIndex = 0, l = mp3Fragments.length; fragmentIndex < l; fragmentIndex++) {
      localSoundObjects[fragmentIndex].autoplay = true;
      localSoundObjects[fragmentIndex].play();
      await this._waitUntilObservable(localSoundObjects[fragmentIndex].onEndedObservable);
    }
    for (let fragmentIndex = 0, l = mp3Fragments.length; fragmentIndex < l; fragmentIndex++)
      localSoundObjects[fragmentIndex].dispose();
    /*
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
      */
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
