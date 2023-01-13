import U3D from '/models/utility3d.js';

export default class HelpSlate {
  constructor(app) {
    this.app = app;
    this.idCounter = 0;
  }
  _initHelpPanel() {
    this.inited = true;

    this.helpSlateTN = BABYLON.MeshBuilder.CreatePlane('helpSlatePanel', {
      height: 2,
      width: 2
    }, this.app.scene);

    this.helpSlateAdvancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(
      this.helpSlateTN, 1024, 1024, true);

    this.scrollViewer = new BABYLON.GUI.ScrollViewer();
    this.scrollViewer.width = 1;
    this.scrollViewer.height = 1;
    this.scrollViewer.background = "#0000BB";

    this.stackPanel = new BABYLON.GUI.StackPanel();
    this.stackPanel.width = "100%";
    this.stackPanel.clipChildren = false;
    this.stackPanel.clipContent = false;
    this.stackPanel.adaptHeightToChildren = true;
    this.scrollViewer.addControl(this.stackPanel);
    this.helpSlateAdvancedTexture.addControl(this.scrollViewer);

    let tb = this.addBlock("If humans can change the orbit of a planet, other lifeforms have already been doing it.", null, 3);
    this.stackPanel.addControl(tb);
    let tb2 = this.addBlock("If humans can change the orbit of a planet, other lifeforms have already been doing it.", null, 2);
    this.stackPanel.addControl(tb2);
    let tb3 = this.addBlock("If humans can change the orbit of a planet, other lifeforms have already been doing it.", null, 2);
    this.stackPanel.addControl(tb3);
    let tb4 = this.addBlock("If humans can change the orbit of a planet, other lifeforms have already been doing it.", null, 2);
    this.stackPanel.addControl(tb4);
    let tb5 = this.addBlock("If humans can change the orbit of a planet, other lifeforms have already been doing it.", null, 2);
    this.stackPanel.addControl(tb5);

  }
  showHelpSlate() {
    if (!this.inited)
      this._initHelpPanel();

    this.helpSlateTN.parent = this.app.scene.activeCamera;
    this.helpSlateTN.position = U3D.v(0, 0, 5);
    let pos = this.helpSlateTN.getAbsolutePosition();
    this.helpSlateTN.parent = null;
    this.helpSlateTN.position = U3D.v(pos.x, 2.5, pos.z);
    let cameraPos = U3D.v(this.app.scene.activeCamera.position.x, 1, this.app.scene.activeCamera.position.z)
    this.helpSlateTN.lookAt(cameraPos, Math.PI, -0.35, 0);

  }
  addBlock(contentText, contentImage, seatIndex) {
    this.idCounter++;

    let avatarMeta = this.app.avatarMetas[seatIndex];

    let text = new BABYLON.GUI.TextBlock("text" + this.idCounter);
    text.resizeToFit = true;

    text.color = "white";
    text.width = 1;
    text.fontSize = "64px";
    text.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
    text.setPadding("0", "5%", "5%", "5%");
    text.text = contentText;

    return text;
  }
}
