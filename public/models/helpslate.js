import U3D from '/models/utility3d.js';

export default class HelpSlate {
  constructor(app) {
    this.app = app;
    this.idCounter = 0;
  }
  async _initHelpPanel() {
    this.inited = true;

    this.helpSlateTN = BABYLON.MeshBuilder.CreatePlane('helpSlatePanel', {
      height: 2,
      width: 2
    }, this.app.scene);

    this.helpSlateAdvancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
      this.helpSlateTN, 2048, 2048, true);

    this.scrollViewer = new BABYLON.GUI.ScrollViewer("helpscroller");
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

    this.stackPanel = new BABYLON.GUI.StackPanel();
    this.stackPanel.width = "100%";
    this.stackPanel.adaptHeightToChildren = true;
    this.scrollViewer.addControl(this.stackPanel);
    this.helpSlateAdvancedTexture.addControl(this.scrollViewer);

    this.closeButtonHB = new BABYLON.GUI.HolographicButton();
    this.app.gui3DManager.addControl(this.closeButtonHB);
    this.closeButton = new BABYLON.TransformNode('HelpSlateCloseTN', this.app.scene);
    this.app.gui3DManager.addControl(this.closeButtonHB);
    this.closeButtonHB.linkToTransformNode(this.closeButton);
    this.closeButtonHB.text = "Close Help";
    this.closeButtonHB.scaling = U3D.v(0.25);
    this.closeButtonHB.imageUrl = '/fontcons/remove.png?helpstateclosetn';
    this.closeButtonHB.onPointerDownObservable.add(() => this.closeHelpSlate());
    this.closeButton.parent = this.helpSlateTN;
    this.closeButton.position = U3D.v(1.15, 0.875, 0);


    this.helpItems = await this.app.getJSONFile('/story/helpitems.json');
    this.helpItems.forEach((item, index) => {
      let tb = this.addBlock(item);
      this.stackPanel.addControl(tb);
    });

    this.scrollViewer.freezeControls = true;
  }
  closeHelpSlate() {
    this.helpSlateTN.setEnabled(false);
    this.helpSlateShown = false;
  }
  async showHelpSlate() {
    if (!this.inited)
      await this._initHelpPanel();

    if (this.helpSlateShown && this.lastHelpShow && Date.now() - this.lastHelpShow < 1000)
      return this.closeHelpSlate();

    this.lastHelpShow = new Date();
    this.helpSlateShown = true;

    this.helpSlateTN.parent = this.app.scene.activeCamera;
    this.helpSlateTN.position = U3D.v(0, 0, 5);
    let pos = this.helpSlateTN.getAbsolutePosition();
    this.helpSlateTN.parent = null;
    this.helpSlateTN.position = U3D.v(pos.x, 2.5, pos.z);
    let cameraPos = U3D.v(this.app.scene.activeCamera.position.x, 1, this.app.scene.activeCamera.position.z)
    this.helpSlateTN.lookAt(cameraPos, Math.PI, -0.35, 0);
    this.helpSlateTN.setEnabled(true);

  }
  addBlock(helpBlock) {
    let seatIndex = helpBlock.seatIndex;
    if (seatIndex === -1)
      seatIndex = this.idCounter % 4;

    let avatarMeta = this.app.avatarMetas[seatIndex];
    let colors = U3D.get3DColors(seatIndex);
    let rgb = U3D.colorRGB255(colors.r + ',' + colors.g + ',' + colors.b);

    let blockBackground = 'rgba(0,0,0,0.85)';
    let blockWrapperPanel = new BABYLON.GUI.StackPanel();
    blockWrapperPanel.background = blockBackground;
    blockWrapperPanel.adaptHeightToChildren = true;

    let headerPanel = new BABYLON.GUI.StackPanel();
    let title = new BABYLON.GUI.TextBlock("title" + this.idCounter);
    title.resizeToFit = true;
    title.color = rgb;
    title.fontWeight = 'bold';
    title.width = 1;
    title.fontSize = "64px";
    title.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
    title.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    title.setPadding("30px", "10px", "30px", "10px");
    title.text = helpBlock.title;
    headerPanel.addControl(title);

    blockWrapperPanel.addControl(headerPanel);

    var image2 = new BABYLON.GUI.Image("helpimage" + this.idCounter, helpBlock.image);
    image2.width = "100%";
    image2.height = "500px";
    image2.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
    blockWrapperPanel.addControl(image2);

    let button = BABYLON.GUI.Button.CreateImageButton("speakername" + this.idCounter, 'Narration', '/fontcons/ear.png?abc=' +  this.idCounter);
    button.width = "350px";
    button.height = "150px";
    button.fontSize = "40px";
    button.color = 'black';
    button.cornerRadius = 35;
    button.background = rgb;
    button.setPadding("30px", "20px", "30px", "20px");

    blockWrapperPanel.addControl(button);
    button.onPointerClickObservable.add(() => {
      this.app.speechChannelHelper.addMessage(seatIndex, helpBlock.description);
    });

    let text = new BABYLON.GUI.TextBlock("text" + this.idCounter);
    text.resizeToFit = true;
    text.color = rgb;
    text.width = 1;
    text.fontSize = "48px";
    text.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
    text.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    text.setPadding("35px", "35px", "35px", "35px");
    text.text = helpBlock.description;
    blockWrapperPanel.addControl(text);

    let footerPanel = new BABYLON.GUI.StackPanel();
    footerPanel.background = rgb;

    let speaker = new BABYLON.GUI.TextBlock("speakername" + this.idCounter);
    speaker.resizeToFit = true;
    speaker.color = 'black';
    speaker.fontSize = "48px";
    speaker.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
    speaker.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    speaker.setPadding("15px", "0px", "15px", "25px");
    speaker.text = ' - as by ' + avatarMeta.name;
    footerPanel.addControl(speaker);
    blockWrapperPanel.addControl(footerPanel);

    this.idCounter++;

    return blockWrapperPanel;
  }
}
