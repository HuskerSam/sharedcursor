import Utility3D from '/models/utility3d.js';

export default class Asteroid3D {
  static async loadAsteroids(scene, app) {
    if (app.asteroidLoadingLine1) {
      app.asteroidLoadingLine1.remove();
      app.asteroidLoadingLine2.remove();

      for (let asteroid in app.loadedAsteroids) {
        app.loadedAsteroids[asteroid].orbitWrapper.dispose();
      }
    }
    app.loadedAsteroids = {};

    let asteroids = Utility3D.getAsteroids();

    let ratio = 0;
    let max = asteroids.length;

    let count = 20;
    if (app.profile.asteroidCount === 'all')
      count = max;
    else if (app.profile.asteroidCount)
      count = Number(app.profile.asteroidCount);

    app.asteroidLoadingLine1 = app.addLineToLoading(`Asteroids - ${count} from ${max} available`);

    let randomArray = [];
    for (let c = 0; c < max; c++) {
      randomArray.push(c);
    }
    randomArray = app._shuffleArray(randomArray);
    randomArray = randomArray.slice(0, count); //.sort();


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
    app.asteroidLoadingLine2 = app.addLineToLoading(linkNameList);

    app.asteroidSymbolMeshName = Utility3D.generateNameMesh(scene);

    app.defaultAsteroidPath = this._buildAsteroidPath(app);
    let endFrame = app.asteroidOrbitTime / 1000 * 30;
    app.defaultAsteroidPositionKeys = [];

    let ptCount = app.defaultAsteroidPath.length - 1;
    app.defaultAsteroidPath.forEach((value, index) => {
      app.defaultAsteroidPositionKeys.push({
        frame: Math.floor(endFrame * index / ptCount),
        value
      });
    });

    app.runRender = false;
    let promises = [];
    for (let c = 0; c < count; c++)
      promises.push(this._loadAsteroid(asteroids[randomArray[c]], c, count, scene, app));

    await Promise.all(promises);
    app.runRender = true;

  }
  static async _loadAsteroid(asteroid, index, count, scene, app) {
    let startRatio = index / count;
    let mainY = 1.5;

    let path = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fasteroids%2F' +
      encodeURIComponent(asteroid) + '?alt=media';
    let mesh = await app.loadStaticMesh(path, '', 1, 0, -1000, 0);
    app._fitNodeToSize(mesh, 1.5);
    mesh.origScaling = this.vector(mesh.scaling);

    mesh.material = app.asteroidMaterial;

    let orbitWrapper = new BABYLON.TransformNode('assetorbitwrapper' + asteroid, scene);
    orbitWrapper.parent = mesh.parent;
    mesh.parent = orbitWrapper;
    orbitWrapper.origScaling = this.vector(orbitWrapper.scaling);

    let positionAnim = new BABYLON.Animation(
      "asteroidposition" + asteroid,
      "position",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let endFrame = app.asteroidOrbitTime / 1000 * 30;
    positionAnim.setKeys(app.defaultAsteroidPositionKeys);
    if (!orbitWrapper.animations)
      orbitWrapper.animations = [];
    orbitWrapper.animations.push(positionAnim);
    let orbitAnimation = scene.beginAnimation(orbitWrapper, 0, endFrame, true);

    if (startRatio !== 0.0) {
      orbitAnimation.goToFrame(Math.floor(endFrame * startRatio));
    }

    mesh.position.y = 0;

    orbitWrapper.assetMeta = {
      appClickable: true,
      clickCommand: 'pauseSpin',
      name: asteroid,
      asteroidType: true,
      asteroidName: asteroid,
      asteroidMesh: orbitWrapper,
      orbitAnimation,
      basePivot: mesh
    };

    app.loadedAsteroids[asteroid] = {
      orbitWrapper,
      mesh
    };
  }
  static asteroidPtrDown(scene, app, meta, up = false) {
    if (!up) {
      meta.basePivot.material = app.selectedAsteroidMaterial;

      meta.asteroidMesh.scaling.x = meta.asteroidMesh.origScaling.x * 1.25;
      meta.asteroidMesh.scaling.y = meta.asteroidMesh.origScaling.y * 1.25;
      meta.asteroidMesh.scaling.z = meta.asteroidMesh.origScaling.z * 1.25;

      app.asteroidSymbolMeshName.setEnabled(true);
      app.asteroidSymbolMeshName.parent = meta.asteroidMesh;

      let text = meta.asteroidName.replace('.obj', '');
      Utility3D.setTextMaterial(scene, app.asteroidSymbolMeshName.nameMaterial, text);

      setTimeout(() => {
        meta.basePivot.material = app.asteroidMaterial;
      }, 3000);
    } else {
      meta.basePivot.material = app.asteroidMaterial;
      meta.asteroidMesh.scaling.copyFrom(meta.asteroidMesh.origScaling);

      app.asteroidSymbolMeshName.setEnabled(false);
    }
  }
  static _buildAsteroidPath() {
    let y = 2;

    let xMin = -60;
    let xMax = 35;
    let zMin = -48;
    let zMax = 48;

    let basePoint = this.v(xMax, y, 0);
    let point1 = this.v(0, y, zMax);
    const lowerRight = BABYLON.Curve3.ArcThru3Points(
      basePoint,
      this.curveV(basePoint, point1),
      point1,
      32);

    let point2 = this.v(xMin, y, 0);
    const upperRight = BABYLON.Curve3.ArcThru3Points(
      point1,
      this.curveV(point1, point2),
      point2,
      32);

    let point3 = this.v(0, y, zMin)
    const upperLeft = BABYLON.Curve3.ArcThru3Points(
      point2,
      this.curveV(point2, point3),
      point3,
      32);

    let point4 = this.v(28, y, 0);
    const lowerLeft = BABYLON.Curve3.ArcThru3Points(
      point3,
      this.curveV(point3, point4),
      point4,
      32);

    let point5 = this.v(0, y, 25);
    const lowerRight2 = BABYLON.Curve3.ArcThru3Points(
      point4,
      this.curveV(point4, point5),
      point5,
      32);

    let point6 = this.v(-10, y, 0);
    const upperRight2 = BABYLON.Curve3.ArcThru3Points(
      point5,
      this.curveV(point5, point6),
      point6,
      32);

    let point7 = this.v(0, y + 5, -5);
    const upperLeft2 = BABYLON.Curve3.ArcThru3Points(
      point6,
      this.curveV(point6, point7),
      point7,
      32);

  //  let point8 = this.v(xMax, y, 0);
    const lowerLeft2 = BABYLON.Curve3.ArcThru3Points(
      point7,
      this.curveV(point7, basePoint),
      basePoint,
      32);

    let outerLoop = lowerRight.continue(upperRight).continue(upperLeft).continue(lowerLeft)
      .continue(lowerRight2).continue(upperRight2).continue(upperLeft2).continue(lowerLeft2);
    let path = outerLoop.getPoints();

    return path;
  }
  static curveV(v1, v2) {
    let x = v1.x;
    let z = v1.z;
    if (Math.abs(v2.x) > Math.abs(v1.x))
      x = v2.x;
    if (Math.abs(v2.z) > Math.abs(v1.z))
      z = v2.z;

    return this.v(0.707 * x, v1.y + v2.y / 2.0, 0.707 * z);
  }
  static v(x, y, z) {
    return new BABYLON.Vector3(x, y, z);
  }
  static vector(vector) {
    let v = new BABYLON.Vector3();
    v.copyFrom(vector);
    return v;
  }
}
