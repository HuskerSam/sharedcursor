import U3D from '/models/utility3d.js';

export default class ChatSlate {
  constructor(app) {
    this.app = app;
    this.idCounter = 0;

    this.messageBlocks = {};
  }
  async initPanel() {
    this.inited = true;

    this.chatSlateNode = new BABYLON.TransformNode('chatSlateNode', this.app.scene);

    this.chatScrollerMesh = BABYLON.MeshBuilder.CreatePlane('chatSlatePanel', {
      height: 1.5,
      width: 2
    }, this.app.scene);
    this.chatScrollerMesh.parent = this.chatSlateNode;

    this.slateAdvancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
      this.chatScrollerMesh, 2048, 2048, true);

    this.scrollViewer = new BABYLON.GUI.ScrollViewer("chatscroller");
    this.scrollViewer.width = 1;
    this.scrollViewer.height = 1;
    this.scrollViewer.barSize = 75;
    this.scrollViewer.background = "transparent";
    this.scrollViewer.barBackground = "transparent";
    this.scrollViewer.scrollBackground = "transparent";
    this.scrollViewer.forceVerticalBar = true;
    this.scrollViewer.isPointerBlocker = true;
    this.scrollViewer.verticalBar.onPointerDownObservable.add(() => {
      if (!this.app.inXR)
        this.app.camera.detachControl(this.app.canvas);
    });
    this.scrollViewer.verticalBar.onPointerUpObservable.add(() => {
      if (!this.app.inXR)
        this.app.camera.attachControl(this.app.canvas);
    });

    this.contentStackPanel = new BABYLON.GUI.StackPanel();
    this.contentStackPanel.width = "100%";
    this.contentStackPanel.adaptHeightToChildren = true;
    this.scrollViewer.addControl(this.contentStackPanel);
    this.slateAdvancedTexture.addControl(this.scrollViewer);

    this.closeButtonHB = new BABYLON.GUI.HolographicButton();
    this.app.gui3DManager.addControl(this.closeButtonHB);
    this.closeButton = new BABYLON.TransformNode('ChatSlateCloseTN', this.app.scene);
    this.app.gui3DManager.addControl(this.closeButtonHB);
    this.closeButtonHB.linkToTransformNode(this.closeButton);
    this.closeButtonHB.text = "Close Chat";
    this.closeButtonHB.scaling = U3D.v(0.25);
    this.closeButtonHB.imageUrl = '/fontcons/remove.png?chatstateclosetn';
    this.closeButtonHB.onPointerDownObservable.add(() => this.closeSlate());
    this.closeButton.parent = this.chatSlateNode;
    this.closeButton.position = U3D.v(1.15, 0.875, 0);

    this._initKeyboardInput();
  }
  closeSlate() {
    this.chatSlateNode.setEnabled(false);
    this.slateShown = false;
    this.keyboardAdvancedTexture.moveFocusToControl(null);
  }
  async showChatPanel() {
    if (!this.inited)
      await this.initPanel();

    if (this.slateShown && this.lastShow && Date.now() - this.lastShow < 1000)
      return this.closeSlate();

    this.lastShow = new Date();
    this.slateShown = true;

    this.chatSlateNode.parent = this.app.scene.activeCamera;
    this.chatSlateNode.position = U3D.v(0, 0, 5);
    let pos = this.chatSlateNode.getAbsolutePosition();
    this.chatSlateNode.parent = null;
    this.chatSlateNode.position = U3D.v(pos.x, 3, pos.z);
    let cameraPos = U3D.v(this.app.scene.activeCamera.position.x, 1, this.app.scene.activeCamera.position.z)
    this.chatSlateNode.lookAt(cameraPos, Math.PI, -0.35, 0);
    this.chatSlateNode.setEnabled(true);

    this.updateMessageFeed();
  }
  _initKeyboardInput() {
    this.keyboardMesh = BABYLON.MeshBuilder.CreatePlane('chatSlateKeyboard', {
      height: 1,
      width: 2
    }, this.app.scene);
    this.keyboardMesh.parent = this.chatSlateNode;
    this.keyboardMesh.position = U3D.v(0, -1, 0);

    this.keyboardAdvancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
      this.keyboardMesh, 1024, 1024, true);


    let blockBackground = 'rgba(0,0,0,0.85)';
    let blockWrapperPanel = new BABYLON.GUI.StackPanel();
    blockWrapperPanel.background = blockBackground;
    blockWrapperPanel.adaptHeightToChildren = true;

    this.textAreaMessage = new BABYLON.GUI.InputTextArea();
    this.textAreaMessage.height = "400px";
    this.textAreaMessage.width = 1;
    this.textAreaMessage.text = "";
    this.textAreaMessage.outlineColor = 'rgb(0,255,0)'
    this.textAreaMessage.fontSize = '80px';
    this.textAreaMessage.color = "white";
    this.textAreaMessage.background = "black";
    blockWrapperPanel.addControl(this.textAreaMessage);
    this.keyboard = new BABYLON.GUI.VirtualKeyboard('chatkeyboard');

    this.keyboard.defaultButtonBackground = 'white';
    this.keyboard.defaultButtonColor = 'blue';
    this.keyboard.defaultButtonHeight = '125px';
    this.keyboard.defaultButtonWidth = '80px';
    this.keyboard.fontSize = '70px';

    this.keyboard.addKeysRow(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "\u2190"]);
    this.keyboard.addKeysRow(["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]);
    this.keyboard.addKeysRow(["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "\u21B5"]);
    this.keyboard.addKeysRow(["\u21E7", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/"]);
    this.keyboard.addKeysRow([" ", "Send"], [{
      width: "300px"
    }, {
      width: "300px"
    }]);

    blockWrapperPanel.addControl(this.keyboard);
    this.keyboard.connect(this.textAreaMessage);
    this.keyboard.onKeyPressObservable.add((key) => {
      if (key === 'Send') this.sendMessage();
    })

    this.keyboardAdvancedTexture.addControl(blockWrapperPanel);

    this.textAreaMessage.onBlurObservable.add(() => {
      setTimeout(() => {
        if (this.slateShown)
          this.keyboardAdvancedTexture.moveFocusToControl(this.textAreaMessage);
      }, 0);
    });
    this.keyboardAdvancedTexture.moveFocusToControl(this.textAreaMessage);

  }
  async sendMessage() {
    let msg = this.textAreaMessage.text;
    this.textAreaMessage.text = 'Sending...';
    let result = await this.app.sendGameMessage(msg, this.app.activeSeatIndex);

    if (!result.success) {
      this.textAreaMessage.text = result.errorMessage + ' - will restore in 5 seconds';
      setTimeout(() => {
        this.textAreaMessage.text = msg;
      }, 5000)
    } else
      this.textAreaMessage.text = '';
  }
  updateMessageFeed() {
    if (!this.inited || !this.app.lastMessagesSnapshot) return;

    this.app.lastMessagesSnapshot.forEach((doc) => this._messageFeedBlock(doc));
    this.app.refreshOnlinePresence();
  }
  _messageFeedBlock(doc) {
    if (this.messageBlocks[doc.id])
      return;

    let data = doc.data();
    let stackPanel = null;

    let message = data.message;
    let seatIndex = data.seatIndex;

    let avatarMeta = this.app.avatarMetas[seatIndex];
    let colors = U3D.get3DColors(seatIndex);
    let rgb = U3D.colorRGB255(colors.r + ',' + colors.g + ',' + colors.b);

    let blockBackground = 'rgba(0,0,0,0.85)';
    let blockWrapperPanel = new BABYLON.GUI.StackPanel();
    blockWrapperPanel.background = blockBackground;
    blockWrapperPanel.adaptHeightToChildren = true;

    let button = BABYLON.GUI.Button.CreateImageButton("speakername" + this.idCounter, 'Narration', '/fontcons/ear.png?abc=' + this.idCounter);
    button.width = "350px";
    button.height = "150px";
    button.fontSize = "80px";
    button.color = 'black';
    button.cornerRadius = 35;
    button.background = rgb;
    button.setPadding("30px", "20px", "30px", "20px");
    blockWrapperPanel.addControl(button);
    button.onPointerClickObservable.add(() => {
      this.app.channelSpeechHelper.addMessage(seatIndex, message);
    });

    let text = new BABYLON.GUI.TextBlock("text" + this.idCounter);
    text.resizeToFit = true;
    text.color = rgb;
    text.width = 1;
    text.fontSize = "96px";
    text.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
    text.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    text.setPadding("35px", "35px", "35px", "35px");
    text.text = message;
    blockWrapperPanel.addControl(text);

    let footerPanel = new BABYLON.GUI.StackPanel();
    footerPanel.background = rgb;

    let speaker = new BABYLON.GUI.TextBlock("speakername" + this.idCounter);
    speaker.resizeToFit = true;
    speaker.color = 'black';
    speaker.fontSize = "96px";
    speaker.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
    speaker.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    speaker.setPadding("15px", "0px", "15px", "25px");
    speaker.text = ' - as by ' + avatarMeta.name;
    footerPanel.addControl(speaker);
    blockWrapperPanel.addControl(footerPanel);
    this.contentStackPanel.addControl(blockWrapperPanel);

    this.idCounter++;
    this.messageBlocks[doc.id] = blockWrapperPanel;
  }
}
