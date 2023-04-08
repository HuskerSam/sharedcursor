export class MoonBallApp {
  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    if (this.urlParams.get('instrumentation'))
      this.instrumentationOn = true;

    this.load();
  }
  async load() {
    await this.initGraphics();
    await this._initContent3D();
  }
  async initGraphics() {
    if (this.engine)
      return;

    this.cameraMetaX = {
      position: U3D.v(5, 3, 0),
      target: U3D.v(0, 2, 0)
    };

    this.canvas = document.querySelector(".popup-canvas");
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.engine.enableOfflineSupport = false;
    BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;
    BABYLON.Animation.AllowMatricesInterpolation = true;

    this.engine.enableOfflineSupport = false;
    this.scene = await this.createScene();

    this.pipeline = new BABYLON.DefaultRenderingPipeline("default", true, this.scene, [this.camera, this.xr.baseExperience.camera]);
    this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
    this.scene.imageProcessingConfiguration.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
    this.scene.imageProcessingConfiguration.exposure = 1;
    this.pipeline.glowLayerEnabled = true;
    this.pipeline.glowLayer.intensity = 0.35;

    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }
  async _initContent3D() {
    let startTime = new Date();
    this.sceneTransformNode = new BABYLON.TransformNode('sceneBaseNodeForScale', this.scene);
    this.gui3DManager = new BABYLON.GUI.GUI3DManager(this.scene);

    this.createMenu3DWrapper();
    this.scene.collisionsEnabled = false;
    this.menuTab3D = new MenuTab3D(this);
    this.asteroidHelper = new Asteroid3D(this);
    this.helpSlateHelper = new HelpSlate(this);
    this.chatSlateHelper = new ChatSlate(this);
    this.invisibleMaterial = new BABYLON.StandardMaterial("invisiblematerial", this.scene);
    this.invisibleMaterial.alpha = 0;

    this.xr.baseExperience.camera.onBeforeCameraTeleport.add(() => {
      this.clearActiveFollowMeta();
    });

    this.addLineToLoading('Loading Assets...<br>');
    let promises = [];
    this.solarSystemDeck.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, this.scene));
    });
    this.moonsDeck1.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, this.scene));
    });
    this.moonsDeck2.forEach(card => {
      promises.push(this.loadStaticAsset(card.id, this.sceneTransformNode, this.scene));
    });

    this.avatarHelper = new Avatar3D(this);
    let loadingResults;
    await Promise.all([
      this.avatarHelper.loadAndInitAvatars(),
      (loadingResults = await Promise.all(promises)),
      this.asteroidHelper.loadAsteroids(),
      Recast()
    ]);

    this.playerMoonAssets = new Array(4);
    let loadingHTML = '';
    loadingResults.forEach(assetMesh => {
      let meta = assetMesh.assetMeta;

      if (meta.seatIndex !== undefined)
        this.playerMoonAssets[meta.seatIndex] = assetMesh;

      let normalLink = `<a href="${meta.extended.glbPath}" target="_blank">Asset</a>&nbsp;`;
      let imgHTML = meta.symbol ? `<img src="${meta.extended.symbolPath}" class="symbol_image">` : '';

      loadingHTML += `${meta.name}:
        &nbsp;
        ${normalLink}
        <br>
        <a href="${meta.url}" target="_blank">wiki</a>
        &nbsp; ${imgHTML}
        <br>`;

      if (meta.noClick !== true) {
        meta.appClickable = true;
        meta.clickCommand = 'customClick';
        meta.handlePointerDown = async (pointerInfo, mesh, meta) => {
          this.pauseAssetSpin(pointerInfo, mesh, meta);
        };
      }
    });
    this.addLineToLoading(loadingHTML);

    this.menuTab3D.initOptionsBar();
    this.channelSpeechHelper = new ChannelSpeech(this);
    this.actionChannelHelper = new ChannelAction(this);

    let delta = new Date().getTime() - startTime.getTime();
    console.log('init3D', delta);
    this.addLineToLoading(`${delta} ms to load 3D content<br>`);

    this.paintedBoardTurn = this.turnNumber;
    this.startEngine();

    this.enterNotInXR();

    this.paintGameData();
  }
}
