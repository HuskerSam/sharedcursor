import U3D from '/models/utility3d.js';
const charactersPerLine = 24;
const charactersPerSentance = charactersPerLine * 3;

export default class ChannelSpeech {
  constructor(app) {
    this.app = app;
    this.lingerTime = 2000;
    this.chatCloseTimeout = null;
    this.seatState = new Array(4).fill({});
    this.eventQueue = [];
    this.seatIndex = -1;

    this.app.avatarMetas.forEach((avatarMeta) => {
      let seatIndex = avatarMeta.seatIndex;
      if (seatIndex === undefined)
        return;
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
        height: 2.15,
        width: 3.65
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
      text.color = avatarMeta.foreColor;
      text.width = 1;
      text.fontSize = 256;
      text.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
      text.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      text.text = "";
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
  async addMessage(seatIndex, text, animationName) {
    //console.log(new Date().toISOString().slice(-7), seatIndex, text);
    let meta = await this._segment(seatIndex, text);
    meta.animationName = animationName;
    this.eventQueue.push(meta);
    if (!this.isPlaying) this._playNext();
  }
  stopSound() {
    this.eventQueue = [];
    this.isPlaying = false;
    this.activeSpeechEvent = null;
    this.app.avatarMetas.forEach(meta => {
      if (meta.seatIndex)
        meta.chatPanel.setEnabled(false);
    });
    this.seatIndex = -1;

    if (this.activeSoundObject) {
      this.activeSoundObject.stop();
      this.activeSoundObject.dispose();
      this.activeSoundObject = null;
    }
    this.app.menuTab3D.channelDisplayDirty = true;
  }
  async _playBlock(speechEvent) {
    this.seatIndex = speechEvent.seatIndex;
    this.activeSpeechEvent = speechEvent;
    let avatarMeta = this.app.avatarMetas[this.seatIndex];
    avatarMeta.chatPanel.setEnabled(true);
    let whenReady = () => {
      this._addAnimation(speechEvent.seatIndex, speechEvent.animationName);
      whenReady = null;
    };
    for (let fragmentIndex = 0, l = speechEvent.mp3Fragments.length; fragmentIndex < l; fragmentIndex++) {
      if (this.activeSpeechEvent !== speechEvent)
        return;

      if (this.activeSoundObject) {
        this.activeSoundObject.stop();
        this.activeSoundObject.dispose();
      }
      let mp3Frag = speechEvent.mp3Fragments[fragmentIndex];
      this.activeSoundObject = new BABYLON.Sound("voiceSoundObject", mp3Frag, this.app.scene, whenReady, {
        loop: false,
        autoplay: true
      });
      avatarMeta.textBlock.text = speechEvent.textFragments[fragmentIndex];
      await this._untilComplete(this.activeSoundObject.onEndedObservable);
    }
    avatarMeta.chatPanel.setEnabled(false);
    this.seatIndex = -1;
  }
  async _playNext() {
    let speechEvent = this.eventQueue.pop();
    this.isPlaying = true;
    this.app.menuTab3D.channelDisplayDirty = true;
    await this._playBlock(speechEvent);

    if (this.eventQueue.length === 0)
      this.isPlaying = false;
    else
      this._playNext();
  }
  get isPlaying() {
    return this._isPlaying;
  }
  set isPlaying(value) {
    this._isPlaying = value;
    this.app.menuTab3D.channelDisplayDirty = true;
  }
  async _segment(seatIndex, text) {
    if (text.slice(-1) === '.')
      text = text.slice(0, -1);
    let sentances = text.split('. ');
    let textFragments = [];
    let sentanceStopIndexes = [];
    sentances.forEach(sentance => {
      sentance = sentance.trim();
      let frags = this._fragmentText(sentance);
      textFragments = textFragments.concat(frags);
      sentanceStopIndexes.push(sentance.length - 1);
    });

    let avatarMeta = this.app.avatarMetas[seatIndex];
    let voiceName = avatarMeta.voiceName;
    let promises = [];
    textFragments.forEach((fragment, fragmentIndex) => {
      promises.push(this._mp3ForText(fragment, voiceName));
    });
    let fileNames = await Promise.all(promises);
    let mp3Fragments = [];
    fileNames.forEach(fileName =>
      mp3Fragments.push('https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/' + encodeURIComponent(fileName) + '?alt=media&fileext=.mp3')
    );

    return {
      seatIndex,
      text,
      textFragments,
      sentanceStopIndexes,
      mp3Fragments,
      added: new Date()
    };
  }
  _fragmentText(text) {
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
    let parts1 = this._fragmentText(part1);
    let parts2 = this._fragmentText(part2);

    return parts1.concat(parts2);
  }
  async _mp3ForText(text, voiceName = 'en-AU-Standard-A') {
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
  async _untilComplete(observable) {
    return new Promise((res, rej) => {
      observable.addOnce(() => res());
    });
  }
  _addAnimation(seatIndex, animationName) {
    let avatar = this.app.avatarHelper.initedAvatars[seatIndex];
    let animation = avatar.animationGroups.find(n => n.name.indexOf(animationName) !== -1);
    if (!animation) return;

    if (this.app.activeSeatIndex === seatIndex) {
      animation.setWeightForAllAnimatables(1);
      let additiveName = animation.name + 'forMovingAdded';
      let addedAnimation = avatar.animationGroups.find(n => n.name.indexOf(additiveName) !== -1);
      if (!addedAnimation) {
        addedAnimation = BABYLON.AnimationGroup.MakeAnimationAdditive(animation, animation.from,
          animation.to, true, additiveName);
        avatar.animationGroups.push(addedAnimation);
      }

      animation = addedAnimation;
    }

    animation.start(false);
    animation.setWeightForAllAnimatables(1);
  }
}
