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
    let endFrame = app.asteroidOrbitTime / 1000 * 60;
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
    let mesh = await Utility3D.loadStaticMesh(scene, path);
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
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let endFrame = app.asteroidOrbitTime / 1000 * 60;
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

    let keyPoints = [];

    keyPoints.push(this.v4(xMax, y, 0, 128));
    keyPoints.push(this.v4(0, y, zMax, 128));
    keyPoints.push(this.v4(xMin, y, 0, 128));
    keyPoints.push(this.v4(0, y, zMin, 128));
    keyPoints.push(this.v4(32, y, 0, 64));
    keyPoints.push(this.v4(0, y, 30, 64));
    keyPoints.push(this.v4(-10, y, 0, 64));

    keyPoints.push(this.v4(-50, y + 8, -40, 120));

    //saturn
    keyPoints.push(this.v4(-35, y, -20, 32));
    keyPoints.push(this.v4(-25, y, -15, 32));
    keyPoints.push(this.v4(-20, y, 0, 32));
    keyPoints.push(this.v4(-30, y, 5, 32));
    keyPoints.push(this.v4(-50, y + 8, -5, 32));

    //jupiter
    keyPoints.push(this.v4(-50, y, 20, 32));
    keyPoints.push(this.v4(-15, y, 20, 32));
    keyPoints.push(this.v4(-15, y, 55, 64));

    keyPoints.push(this.v4(-35, y + 8, 35, 64));

    let curve = this.curvePointsMerge(keyPoints);
    let path = curve.getPoints();

    return path;
  }
  static curvePointsMerge(keyPoints) {
    let count = keyPoints.length;
    let fullCurve;

    for (let c = 0; c < count; c++) {
      let pt1 = keyPoints[c].v;

      let index2 = c + 1;
      if (c + 1 >= count)
        index2 = 0;
      let pt2 = keyPoints[index2].v;
      let weight = keyPoints[index2].weight;
      let curve = BABYLON.Curve3.ArcThru3Points(
        pt1,
        this.curveV(pt1, pt2),
        pt2,
        weight);
      if (fullCurve)
        fullCurve = fullCurve.continue(curve);
      else
        fullCurve = curve;
    }

    return fullCurve;
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
  static v4(x, y, z, weight) {
    return {
      v: new BABYLON.Vector3(x, y, z),
      weight: weight * 2
    };
  }
  static vector(vector) {
    let v = new BABYLON.Vector3();
    v.copyFrom(vector);
    return v;
  }
  static retargetAnimationGroup(animationGroup, targetSkeleton) {
    //console.log("Retargeting animation group: " + animationGroup.name);
    animationGroup.targetedAnimations.forEach((targetedAnimation) => {
      const newTargetBone = targetSkeleton.bones.filter((bone) => {
        return bone.name === targetedAnimation.target.name
      })[0];
      //console.log("Retargeting bone: " + target.name + "->" + newTargetBone.name);
      targetedAnimation.target = newTargetBone ? newTargetBone.getTransformNode() : null;
    });
  }
}
