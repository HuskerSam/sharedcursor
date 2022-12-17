import U3D from '/models/utility3d.js';

export default class Asteroid3D {
  constructor(app) {
    this.app = app;
    this.asteroidOrbitTime = 300000;
  }
  async loadAsteroids(init) {
    let app = this.app;
    let scene = this.app.scene;
    if (app.asteroidLoadingLine1) {
      app.asteroidLoadingLine1.remove();
      app.asteroidLoadingLine2.remove();

      for (let asteroid in this.loadedAsteroids) {
        this.loadedAsteroids[asteroid].orbitWrapper.dispose();
      }
    }
    this.loadedAsteroids = {};

    this.asteroidUpdateMaterials();
    let asteroids = U3D.getAsteroids();

    let ratio = 0;
    let max = asteroids.length;

    let count = 20;
    if (app.profile.asteroidCount === 'all')
      count = max;
    else if (app.profile.asteroidCount)
      count = Number(app.profile.asteroidCount);

    this.asteroidLoadingLine1 = app.addLineToLoading(`Asteroids - ${count} from ${max} available`);

    let randomArray = [];
    for (let c = 0; c < max; c++) {
      randomArray.push(c);
    }
    randomArray = app._shuffleArray(randomArray);
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
    this.asteroidLoadingLine2 = app.addLineToLoading(linkNameList);

    this.asteroidSymbolMeshName = U3D.generateNameMesh(scene);

    this.defaultAsteroidPath = this._buildAsteroidPath(app);
    let endFrame = this.asteroidOrbitTime / 1000 * 60;
    this.defaultAsteroidPositionKeys = [];

    let ptCount = this.defaultAsteroidPath.length - 1;
    this.defaultAsteroidPath.forEach((value, index) => {
      this.defaultAsteroidPositionKeys.push({
        frame: Math.floor(endFrame * index / ptCount),
        value
      });
    });

    if (!init)
      app.runRender = false;
    let promises = [];
    for (let c = 0; c < count; c++)
      promises.push(this._loadAsteroid(asteroids[randomArray[c]], c, count, scene, app));

    await Promise.all(promises);
    this.__addLogosToAsteroids();

    if (!init)
      app.runRender = true;
    this.updateAsteroidLabel();
  }
  async _loadAsteroid(asteroid, index, count, scene, app) {
    let startRatio = index / count;

    let containerPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes%2Fasteroids%2F' +
      encodeURIComponent(asteroid) + '?alt=media';
    let mesh = await U3D.loadStaticMesh(scene, containerPath);
    U3D._fitNodeToSize(mesh, 1.5);
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
    let endFrame = this.asteroidOrbitTime / 1000 * 60;
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
        app.__pauseSpin(pointerInfo, mesh, meta);
      },
      name: asteroid,
      asteroidType: true,
      asteroidName: asteroid,
      asteroidMesh: orbitWrapper,
      orbitAnimation,
      basePivot: mesh,
      offsetY: 1.25,
      containerPath
    };


    this.loadedAsteroids[asteroid] = {
      orbitWrapper,
      mesh
    };
  }
  _buildAsteroidPath() {
    let y = 1;

    let xMin = -60;
    let xMax = 35;
    let zMin = -48;
    let zMax = 48;

    let keyPoints = [];

    keyPoints.push(this.v4(xMax, y, -5, 128));
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
  curvePointsMerge(keyPoints) {
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
  curveV(v1, v2) {
    let x = v1.x;
    let z = v1.z;
    if (Math.abs(v2.x) > Math.abs(v1.x))
      x = v2.x;
    if (Math.abs(v2.z) > Math.abs(v1.z))
      z = v2.z;

    return U3D.v(0.707 * x, v1.y + v2.y / 2.0, 0.707 * z);
  }
  v4(x, y, z, weight) {
    return {
      v: new BABYLON.Vector3(x, y, z),
      weight: weight * 2
    };
  }
  vector(vector) {
    let v = new BABYLON.Vector3();
    v.copyFrom(vector);
    return v;
  }
  retargetAnimationGroup(animationGroup, targetSkeleton) {
    //console.log("Retargeting animation group: " + animationGroup.name);
    animationGroup.targetedAnimations.forEach((targetedAnimation) => {
      const newTargetBone = targetSkeleton.bones.filter((bone) => {
        return bone.name === targetedAnimation.target.name
      })[0];
      //console.log("Retargeting bone: " + target.name + "->" + newTargetBone.name);
      targetedAnimation.target = newTargetBone ? newTargetBone.getTransformNode() : null;
    });
  }
  getAsteroidCount(profileString) {
    if (!profileString)
      profileString = 20;
    let count = Number(profileString);
    if (count > U3D.getAsteroids().length)
      count = U3D.getAsteroids().length;
    if (count < 20)
      count = 20;
    return count;
  }
  updateAsteroidLabel() {
    if (this.asteroidCountLabel)
      this.asteroidCountLabel.dispose();

    let count = this.getAsteroidCount(this.app.profile.asteroidCount);
    this.asteroidCountLabel = U3D.addTextPlane(this.app.scene, count.toString(), "asteroidCountLabel", "Impact", "", "#ffffff");
    this.asteroidCountLabel.parent = this.app.menuTab3D.asteroidMenuTab;
    this.asteroidCountLabel.scaling = U3D.v(2, 2, 2);
    this.asteroidCountLabel.position.x = -9;
    this.asteroidCountLabel.position.y = 1;
    this.asteroidCountLabel.position.z = 1;
  }
  asteroidUpdateMaterials() {
    let name = 'Wireframe';
    let wireframe = this.app.profile.asteroidWireframe === true;
    if (wireframe)
      name = 'Solid';

    if (this.asteroidWireframeBtn)
      this.asteroidWireframeBtn.dispose();
    this.asteroidWireframeBtn = U3D.addTextPlane(this.scene, name, 'asteroidWireframeBtn');
    this.asteroidWireframeBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.asteroidChangeMaterial(!wireframe, null, null);
      }
    };
    this.asteroidWireframeBtn.position.x = -7;
    this.asteroidWireframeBtn.position.y = 3;
    this.asteroidWireframeBtn.scaling = U3D.v(2, 2, 2);
    this.asteroidWireframeBtn.parent = this.app.menuTab3D.asteroidMenuTab;

    name = 'Rocky';
    let profileTexture = this.app.profile.asteroidColorOnly === true;
    if (profileTexture)
      name = 'Color';
    if (this.asteroidTextureBtn)
      this.asteroidTextureBtn.dispose();
    this.asteroidTextureBtn = U3D.addTextPlane(this.scene, name, 'asteroidTextureBtn');
    this.asteroidTextureBtn.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.asteroidChangeMaterial(null, !profileTexture, null);
      }
    };
    this.asteroidTextureBtn.position.x = -14;
    this.asteroidTextureBtn.position.y = 3;
    this.asteroidTextureBtn.scaling = U3D.v(2, 2, 2);
    this.asteroidTextureBtn.parent = this.app.menuTab3D.asteroidMenuTab;

    name = 'Logos';
    let includeLogos = this.app.profile.asteroidExcludeLogos === true;
    if (!includeLogos)
      name = "No Logos";
    if (this.asteroidInternalLogos)
      this.asteroidInternalLogos.dispose();
    this.asteroidInternalLogos = U3D.addTextPlane(this.scene, name, 'asteroidInternalLogos');
    this.asteroidInternalLogos.assetMeta = {
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: async (pointerInfo, mesh, meta) => {
        this.app.asteroidChangeMaterial(null, null, !includeLogos);
      }
    };
    this.asteroidInternalLogos.position.x = 0;
    this.asteroidInternalLogos.position.y = 3;
    this.asteroidInternalLogos.scaling = U3D.v(2, 2, 2);
    this.asteroidInternalLogos.parent = this.app.menuTab3D.asteroidMenuTab;

    name = 'asteroidmaterial';
    let scene = this.app.scene;

    if (!this.asteroidMaterial)
      this.asteroidMaterial = new BABYLON.StandardMaterial(name + 'mat', scene);
    if (!this.selectedAsteroidMaterial)
      this.selectedAsteroidMaterial = new BABYLON.StandardMaterial(name + 'selectedmat', scene);

    this.asteroidMaterial.wireframe = this.app.profile.asteroidWireframe === true;
    this.selectedAsteroidMaterial.wireframe = this.app.profile.asteroidWireframe !== true;
    if (this.app.profile.asteroidColorOnly) {
      this.asteroidMaterial.diffuseTexture = null;
      this.asteroidMaterial.diffuseColor = new BABYLON.Color3(0.35, 0.35, 0.35);

      this.selectedAsteroidMaterial.diffuseTexture = null;
      this.selectedAsteroidMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
      this.selectedAsteroidMaterial.ambientColor = new BABYLON.Color3(0.75, 0.75, 0.75);
      this.selectedAsteroidMaterial.emissiveColor = new BABYLON.Color3(0.75, 0.75, 0.75);
    } else {
      let at = new BABYLON.Texture('/images/rockymountain.jpg', scene);
      this.asteroidMaterial.diffuseTexture = at;

      let t = new BABYLON.Texture('/images/rockymountain.jpg', scene);
      this.selectedAsteroidMaterial.diffuseTexture = t;
      this.selectedAsteroidMaterial.wireframe = this.app.profile.asteroidWireframe !== true;
      this.selectedAsteroidMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
      this.selectedAsteroidMaterial.ambientColor = new BABYLON.Color3(0.75, 0.75, 0.75);
      this.selectedAsteroidMaterial.emissiveColor = new BABYLON.Color3(0.75, 0.75, 0.75);
    }
    this.__addLogosToAsteroids();
  }
  __addLogosToAsteroids() {
    let includeLogos = this.app.profile.asteroidExcludeLogos === true;

    if (!this.asteroidSymbolMesh) {
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

    for (let name in this.loadedAsteroids) {
      if (this.loadedAsteroids[name].asteroidSymbol) {
        this.loadedAsteroids[name].asteroidSymbol.dispose();
        this.loadedAsteroids[name].asteroidSymbol = null;
      }

      if (!includeLogos) {
        let delta = "";
        if (Math.floor(Math.random() * 2) === 0) {
          delta = "2";
        }
        if (Math.floor(Math.random() * 8) === 0) {
          delta = "3";
        }
        const asteroidSymbol = this['asteroidSymbolMesh' + delta].clone("symbolshow1asteroid" + delta);
        asteroidSymbol.setEnabled(true);
        asteroidSymbol.parent = this.loadedAsteroids[name].mesh;
        this.loadedAsteroids[name].asteroidSymbol = asteroidSymbol;
      }
    }
  }
}
