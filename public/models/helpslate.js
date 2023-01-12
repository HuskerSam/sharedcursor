import U3D from '/models/utility3d.js';

export default class HelpSlate {
  constructor(app) {
    this.app = app;
    this.idCounter = 0;
  }
  showHelpSlate() {
    if (this.helpSlate)
      this.helpSlate.dispose();

    this.helpSlate = new BABYLON.GUI.HolographicSlate("helpSlatePopup");
    this.helpSlate.minDimensions = new BABYLON.Vector2(1, 1);
    this.helpSlate.dimensions = new BABYLON.Vector2(2, 2);
    this.helpSlate.titleBarHeight = 0.5;
    this.helpSlate.title = "Storyverse";
    this.app.gui3DManager.addControl(this.helpSlate);
    this.helpSlate.defaultBehavior.followBehavior.defaultDistance = 7;
    this.helpSlate.defaultBehavior.followBehavior.minimumDistance = 5;
    this.helpSlate.defaultBehavior.followBehavior.maximumDistance = 12;
    this.helpSlate.defaultBehavior.followBehavior.lerpTime = 250;
    this.helpSlate.defaultBehavior.followBehavior.recenter();
    if (!this.helpSlate.defaultBehavior.followBehaviorEnabled) {
      this.helpSlate.defaultBehavior.followBehaviorEnabled = true;
      setTimeout(() => this.helpSlate.defaultBehavior.followBehaviorEnabled = false, 1000);
    }

    this.helpSlate.content = new BABYLON.GUI.Grid();

/*
    let buttonLeft = BABYLON.GUI.Button.CreateSimpleButton("left", "Accept");
    let buttonRight = BABYLON.GUI.Button.CreateSimpleButton("right", "Decline");

    buttonLeft.width = 0.5;
    buttonLeft.height = 0.2;
    buttonLeft.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    buttonLeft.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    buttonLeft.textBlock.color = "white";
    buttonLeft.onPointerUpObservable.add(() => {
      alert("yay!");
      // dialogSlate.dispose();
    });

    buttonRight.width = 0.5;
    buttonRight.height = 0.2;
    buttonRight.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    buttonRight.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    buttonRight.textBlock.color = "white";
    buttonRight.onPointerUpObservable.add(() => {
      alert("aww...");
      // dialogSlate.dispose();
    });
*/
//    this.helpSlate.content.addControl(buttonLeft);
  //  this.helpSlate.content.addControl(buttonRight);
    //this.helpSlate.content.addControl(title);
    //this.helpSlate.content.addControl(text);
    //this.helpSlate.content.background = "#000080";
  }
  addBlock(contentText, contentImage, seatIndex) {
    this.idCounter++;
    let title = new BABYLON.GUI.TextBlock("title" + this.idCounter);
    let text = new BABYLON.GUI.TextBlock("text" + this.idCounter);

    title.height = 0.2;
    title.color = "green";
    title.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
    title.setPadding("5%", "5%", "5%", "5%");
    title.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    title.text = "Elihu Husker";
    title.fontWeight = "bold";

    text.height = 0.8;
    text.color = "white";
    text.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
    text.setPadding("5%", "5%", "5%", "5%");
    text.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    text.text = "If humans can change the orbit of a planet, other lifeforms have already been doing it."

    this.helpSlate.content.addControl(title);
    this.helpSlate.content.addControl(text);
  }
}
