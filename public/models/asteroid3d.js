import U3D from '/models/utility3d.js';

export default class Asteroid3D {
  constructor(app) {
    this.app = app;
    this.asteroidOrbitFrameCount = 300000 / 1000 * 60;
    this.asteroidMaterial = new BABYLON.StandardMaterial('asteroidMaterial', this.app.scene);
    this.selectedAsteroidMaterial = new BABYLON.StandardMaterial('selectedAsteroidMaterial', this.app.scene);

    this.asteroidMaterial.wireframe = true;
    this.asteroidMaterial.disableLighting = true
    this.selectedAsteroidMaterial.disableLighting = true
    let t11 = new BABYLON.Texture('/images/asteroid2diff.jpg', this.app.scene);
    let t12 = new BABYLON.Texture('/images/asteroid2normal.jpg', this.app.scene);
    t11.vScale = 2;
    t11.uScale = 2;
    t12.vScale = 2;
    t12.uScale = 2;
    this.asteroidMaterial.diffuseTexture = t11;
    this.asteroidMaterial.emissiveTexture = t11;
    this.asteroidMaterial.ambientTexture = t11;
    this.asteroidMaterial.bumpTexture = t12;

    this.selectedAsteroidMaterial.diffuseTexture = t11;
    this.selectedAsteroidMaterial.emissiveTexture = t11;
    this.selectedAsteroidMaterial.ambientTexture = t11;
    this.asteroidMaterial.bumpTexture = t12;

    this.asteroidSymbolMesh = BABYLON.MeshBuilder.CreatePlane('symbolshow1asteroid', {
      height: 1,
      width: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    this.asteroidSymbolMesh.setEnabled(false);

    let imgPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fsymbol%2F' +
      encodeURIComponent('atari.svg') + '?alt=media';
    let m = new BABYLON.StandardMaterial('symbolshowmatasteroid', this.app.scene);
    let t = new BABYLON.Texture(imgPath, this.app.scene);
    t.hasAlpha = true;
    m.diffuseTexture = t;
    m.emissiveTexture = t;
    m.ambientTexture = t;
    this.asteroidSymbolMesh.material = m;

    this.asteroidSymbolMesh2 = BABYLON.MeshBuilder.CreatePlane('symbolshow1asteroid2', {
      height: 1,
      width: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    this.asteroidSymbolMesh2.setEnabled(false);
    let imgPath2 = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fsymbol%2F' +
      encodeURIComponent('commodore.svg') + '?alt=media';
    let m2 = new BABYLON.StandardMaterial('symbolshowmatasteroid2', this.app.scene);
    let t2 = new BABYLON.Texture(imgPath2, this.app.scene);
    t2.hasAlpha = true;
    m2.diffuseTexture = t2;
    m2.emissiveTexture = t2;
    m2.ambientTexture = t2;
    this.asteroidSymbolMesh2.material = m2;

    this.asteroidSymbolMesh3 = BABYLON.MeshBuilder.CreatePlane('symbolshow1asteroid3', {
      height: 1,
      width: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, this.scene);
    this.asteroidSymbolMesh3.setEnabled(false);
    let imgPath3 = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fsymbol%2F' +
      encodeURIComponent('herbie.png') + '?alt=media';
    let m3 = new BABYLON.StandardMaterial('symbolshowmatasteroid3', this.app.scene);
    let t3 = new BABYLON.Texture(imgPath3, this.app.scene);
    t3.hasAlpha = true;
    m3.diffuseTexture = t3;
    m3.emissiveTexture = t3;
    m3.ambientTexture = t3;
    this.asteroidSymbolMesh3.material = m3;
  }
  async loadAsteroids() {
    let scene = this.app.scene;
    if (this.asteroidLoadingLine1) {
      this.asteroidLoadingLine1.remove();

      for (let asteroid in this.loadedAsteroids) {
        this.loadedAsteroids[asteroid].orbitWrapper.dispose();
      }
    }
    this.loadedAsteroids = {};

    let asteroids = await this.app.readJSONFile('/story/asteroidslist.json');

    let ratio = 0;
    let max = asteroids.length;

    let count = 8;

    let randomArray = [];
    for (let c = 0; c < max; c++) {
      randomArray.push(c);
    }
    randomArray = this.app._shuffleArray(randomArray);
    randomArray = randomArray.slice(0, count);
    randomArray = randomArray.sort();
    let linkNameList = '';
    randomArray.forEach((index, i) => {
      let name = asteroids[index];
      let path = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fasteroids%2F' +
        encodeURIComponent(name) + '?alt=media';
      linkNameList += `<a target="_blank" href="${path}">${name}</a>`;
      if (i < count - 1)
        linkNameList += ', '
      if (i % 4 === 3)
        linkNameList += '<br>';
    });
    this.asteroidLoadingLine1 = this.app.addLineToLoading(`Asteroids - ${count} from ${max} available<br>` + linkNameList);

    this.asteroidSymbolMeshName = U3D.generateNameMesh(scene);

    this.defaultAsteroidPath = this.buildAsteroidPath();
    let endFrame = this.asteroidOrbitFrameCount;
    this.defaultAsteroidPositionKeys = [];

    let ptCount = this.defaultAsteroidPath.length - 1;
    this.defaultAsteroidPath.forEach((value, index) => {
      this.defaultAsteroidPositionKeys.push({
        frame: Math.floor(endFrame * index / ptCount),
        value
      });
    });

    let promises = [];
    for (let c = 0; c < count; c++)
      promises.push(this.loadAsteroid(asteroids[randomArray[c]], c, count));

    await Promise.all(promises);
  }
  async loadAsteroid(asteroid, index, count) {
    let scene = this.app.scene;
    let startRatio = index / count;

    let containerPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fasteroids%2F' +
      encodeURIComponent(asteroid) + '?alt=media';
    let mesh = await U3D.loadStaticMesh(scene, containerPath);
    U3D.sizeNodeToFit(mesh, 3);
    mesh.setEnabled(true);

    mesh.material = this.asteroidMaterial;

    let orbitWrapper = new BABYLON.TransformNode('assetorbitwrapper' + asteroid, scene);
    orbitWrapper.parent = mesh.parent;
    mesh.parent = orbitWrapper;

    let positionAnim = new BABYLON.Animation(
      "asteroidposition" + asteroid,
      "position",
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    orbitWrapper.position.y = -1000;
    let endFrame = this.asteroidOrbitFrameCount;
    positionAnim.setKeys(this.defaultAsteroidPositionKeys);
    if (!orbitWrapper.animations)
      orbitWrapper.animations = [];
    orbitWrapper.animations.push(positionAnim);
    let orbitAnimation = scene.beginAnimation(orbitWrapper, 0, endFrame, true);

    if (startRatio !== 0.0) {
      orbitAnimation.goToFrame(Math.floor(endFrame * startRatio));
    }

    orbitWrapper.assetMeta = {
      appClickable: true,
      clickCommand: "customClick",
      handlePointerDown: (pointerInfo, mesh, meta) => {
        this.app.pauseAssetSpin(pointerInfo, mesh, meta);
      },
      name: asteroid,
      asteroidType: true,
      asteroidName: asteroid,
      asteroidMesh: orbitWrapper,
      orbitAnimation,
      basePivot: mesh,
      offsetY: 1.25,
      containerPath,
      extended: {}
    };
    orbitWrapper.parent = this.app.sceneTransformNode;

    let delta = "";
    if (Math.floor(Math.random() * 2) === 0) {
      delta = "2";
    }
    if (Math.floor(Math.random() * 8) === 0) {
      delta = "3";
    }
    const asteroidSymbol = this['asteroidSymbolMesh' + delta].clone("symbolshow1asteroid" + delta);
    asteroidSymbol.setEnabled(true);
    asteroidSymbol.parent = orbitWrapper;

    this.loadedAsteroids[asteroid] = {
      orbitWrapper,
      mesh,
      asteroidSymbol
    };
  }
  buildAsteroidPath() {
    let y = 1;

    let xMin = -60;
    let xMax = 35;
    let zMin = -48;
    let zMax = 48;

    let keyPoints = [];

    keyPoints.push(U3D.v4(xMax, y, -5, 128));
    keyPoints.push(U3D.v4(0, y, zMax, 128));
    keyPoints.push(U3D.v4(xMin, y, 0, 128));
    keyPoints.push(U3D.v4(0, y, zMin, 128));
    keyPoints.push(U3D.v4(32, y, 0, 64));
    keyPoints.push(U3D.v4(0, y, 30, 64));
    keyPoints.push(U3D.v4(-10, y, 0, 64));

    keyPoints.push(U3D.v4(-50, y + 8, -40, 120));

    //saturn
    keyPoints.push(U3D.v4(-35, y, -20, 32));
    keyPoints.push(U3D.v4(-25, y, -15, 32));
    keyPoints.push(U3D.v4(-20, y, 0, 32));
    keyPoints.push(U3D.v4(-30, y, 5, 32));
    keyPoints.push(U3D.v4(-50, y + 8, -5, 32));

    //jupiter
    keyPoints.push(U3D.v4(-50, y, 20, 32));
    keyPoints.push(U3D.v4(-15, y, 20, 32));
    keyPoints.push(U3D.v4(-15, y, 55, 64));

    keyPoints.push(U3D.v4(-35, y + 8, 35, 64));

    let curve = U3D.curvePointsMerge(keyPoints);
    let path = curve.getPoints();

    return path;
  }
}
