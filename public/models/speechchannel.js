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

      let chatTextPlane = BABYLON.MeshBuilder.CreatePlane('chatSlatePanel', {
        height: 2.25,
        width: 3.75
      }, this.app.scene);
      chatTextPlane.parent = chatBubbleMesh;
      chatTextPlane.isPickable = false;
      chatTextPlane.rotation.x = Math.PI;
      chatTextPlane.position.z = -0.005;
      chatTextPlane.position.y = -0.15;

      let chatTextAdvancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
        chatTextPlane, 2048, 2048, true);
      let text = new BABYLON.GUI.TextBlock("text" + this.idCounter);
      text.resizeToFit = true;
      text.color = seatIndex > 2 ? 'rgb(255,255,255)' : 'rgb(0,0,0)';
      text.width = 1;
      text.fontSize = 300;
      text.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
      text.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      text.text = "My long long long long long long long long long long long and more long message.";
      chatTextAdvancedTexture.addControl(text);

      chatTN.position.y = 3.5;
      chatTN.rotation.y = Math.PI;
      chatTN.billboardMode = BABYLON.TransformNode.BILLBOARDMODE_Y;
      chatTN.isPickable = false;
      chatTN.parent = this.app.avatarHelper.initedAvatars[seatIndex].avatarPositionTN;

      avatarMeta.textBlock = text;
      avatarMeta.chatTextPlane = chatTextPlane;
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
    await this.playText(seatIndex, text);
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
    let textFragments = this.seatState[seatIndex].textFragments;
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

      avatarMeta.textBlock.text = textFragments[fragmentIndex];
      avatarMeta.chatPanel.setEnabled(true);
      await this._waitUntilObservable(localSoundObjects[fragmentIndex].onEndedObservable);
      localSoundObjects[fragmentIndex].dispose();
      avatarMeta.chatPanel.setEnabled(false);
    }
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
  stopSound() {


  }
}
