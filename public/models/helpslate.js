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
      this.helpSlateTN, 1024, 1024, true);

    this.scrollViewer = new BABYLON.GUI.ScrollViewer("helpscroller");
    this.scrollViewer.width = 1;
    this.scrollViewer.height = 1;
    this.scrollViewer.barSize = 75;
    this.scrollViewer.background = "rgba(0,0,0,0.5)";
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
      let seatIndex = item.seatIndex;
      if (seatIndex === -1)
        seatIndex = index % 4;

      let tb = this.addBlock(item.description, item.image, seatIndex);
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
  addBlock(contentText, contentImage, seatIndex) {
    this.idCounter++;

    let panel = new BABYLON.GUI.StackPanel();
    panel.width = "100%";
    panel.adaptHeightToChildren = true;

    let avatarMeta = this.app.avatarMetas[seatIndex];

    let text = new BABYLON.GUI.TextBlock("text" + this.idCounter);
    text.resizeToFit = true;

    text.color = "white";
    text.width = 1;
    text.fontSize = "64px";
    text.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
    text.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    //    text.setPadding("0", "5%", "5%", "5%");
    text.text = contentText;

    panel.addControl(text)
    return panel;
  }
}
