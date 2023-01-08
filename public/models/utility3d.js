export default class Utility3D {
  static addPositionPivot(meta, scene) {
    let positionPivot = new BABYLON.TransformNode("transformposition" + meta.id, scene);
    if (meta.x !== undefined)
      positionPivot.position.x = meta.x;
    if (meta.y !== undefined)
      positionPivot.position.y = meta.y;
    if (meta.z !== undefined)
      positionPivot.position.z = meta.z;

    if (meta.rx !== undefined)
      positionPivot.rotation.x = meta.rx;
    if (meta.ry !== undefined)
      positionPivot.rotation.y = meta.ry;
    if (meta.rz !== undefined)
      positionPivot.rotation.z = meta.rz;

    return positionPivot;
  }
  static addOrbitPivot(meta, scene, orbitPivot) {
    if (!orbitPivot)
      orbitPivot = new BABYLON.TransformNode("assetorbittn_" + meta.id, scene);
    let orbitAnimation = new BABYLON.Animation(
      "assetorbitanim_" + meta.id,
      "position",
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let keys = [];
    let endFrame = Math.floor(meta.orbitTime / 1000 * 60);

    let orbitDirection = meta.orbitDirection === -1 ? -1 : 1;

    let y = 0;
    let amp = Number(meta.orbitRadius);
    for (let frame = 0; frame < endFrame; frame++) {
      let ratio = frame / endFrame * 2 * Math.PI * orbitDirection;
      let x = Math.cos(ratio) * amp;
      let z = Math.sin(ratio) * amp;
      let value = this.v(x, y, z);
      keys.push({
        frame,
        value
      });
    }

    orbitAnimation.setKeys(keys);
    orbitPivot.animations.push(orbitAnimation);
    let anim = scene.beginAnimation(orbitPivot, 0, endFrame, true);

    if (meta.startRatio !== undefined)
      anim.goToFrame(Math.floor(endFrame * meta.startRatio));

    orbitPivot.orbitAnimation = anim;
    return orbitPivot;
  }
  static addRotationPivot(meta, scene) {
    let rotationPivot = new BABYLON.TransformNode("tnrotationasset" + meta.id, scene);

    let rotationAnimation = new BABYLON.Animation(
      "tnrotationassetanim_" + meta.id,
      "rotation",
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let keys = [];
    let x = 0;
    let y = 0;
    let z = 0;

    let endFrame = meta.rotationTime / 1000 * 60;
    let rotationDirection = meta.rotationDirection === -1 ? 2 : -2;

    keys.push({
      frame: 0,
      value: new BABYLON.Vector3(x, y, z)
    });

    keys.push({
      frame: endFrame,
      value: new BABYLON.Vector3(x, y + rotationDirection * Math.PI, z)
    });

    rotationAnimation.setKeys(keys);
    if (!rotationPivot.animations)
      rotationPivot.animations = [];
    rotationPivot.animations.push(rotationAnimation);
    let anim = scene.beginAnimation(rotationPivot, 0, endFrame, true);
    if (rotationPivot.rotateStartRatio !== undefined)
      anim.goToFrame(Math.floor(endFrame * meta.rotateStartRatio));
    rotationPivot.rotationAnimation = anim;

    return rotationPivot;
  }
  static selectedRotationAnimation(node, scene, noAnim) {
    let rotationPivot = new BABYLON.TransformNode("tnselectionrotation" + node.id, scene);
    let rotationAnimation = new BABYLON.Animation(
      "selectedRotationAnimation" + name,
      "rotation",
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let endFrame = 36 * 60;
    let keys = [{
      frame: 0,
      value: this.v(0, 0, 0)
    }];

    if (noAnim !== true)
      keys.push({
        frame: endFrame,
        value: this.v(2 * Math.PI, 0, 8 * Math.PI)
      });
    rotationAnimation.setKeys(keys);
    rotationPivot.animations.push(rotationAnimation);
    let runningAnimation = scene.beginAnimation(rotationPivot, 0, endFrame, true);
    runningAnimation.goToFrame(Math.floor(Math.random() * endFrame));

    return {
      rotationPivot,
      rotationAnimation,
      runningAnimation
    };
  }


  static get3DColors(seatIndex) {
    let r = 220 / 255,
      g = 220 / 255,
      b = 0;
    if (seatIndex === 1) {
      r = 0;
      g = 220 / 255;
      b = 210 / 255;
    }
    if (seatIndex === 2) {
      r = 230 / 255;
      g = 0;
      b = 230 / 255;
    }
    if (seatIndex === 3) {
      r = 100 / 255;
      g = 50 / 255;
      b = 230 / 255;
    }

    return new BABYLON.Color3(r, g, b);
  }
  static color(str) {
    if (!str) {
      str = '1,1,1';
    }
    let parts = str.split(',');
    let cA = [];
    let r = Number(parts[0]);
    if (isNaN(r))
      r = 0;
    let g = Number(parts[1]);
    if (isNaN(g))
      g = 0;
    let b = Number(parts[2]);
    if (isNaN(b))
      b = 0;
    if (typeof window !== "undefined" && window.BABYLON)
      return new BABYLON.Color3(r, g, b);

    return {
      r,
      g,
      b
    };
  }
  static colorRGB255(str) {
    let bC = this.color(str);
    if (isNaN(bC.r))
      bC.r = 1;
    if (isNaN(bC.g))
      bC.g = 1;
    if (isNaN(bC.b))
      bC.b = 1;

    return 'rgb(' + (bC.r * 255.0).toFixed(0) + ',' + (bC.g * 255.0).toFixed(0) + ',' + (bC.b * 255.0).toFixed(0) + ')'
  }
  static generateNameMesh(scene, name = 'asteroidnamemesh') {
    let alphaMat = new BABYLON.StandardMaterial(name + 'mat1alpha', scene);
    alphaMat.alpha = 0;

    let asteroidNameMesh = BABYLON.Mesh.CreateBox(name + 'wrapper', 0.001, scene);
    asteroidNameMesh.position.y = 1;
    asteroidNameMesh.material = alphaMat;
    asteroidNameMesh.setEnabled(false);

    let size = 1;
    let nameMesh1 = BABYLON.MeshBuilder.CreatePlane(name + 'show1asteroid', {
      height: size * 5,
      width: size * 5,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);

    let nameMat = new BABYLON.StandardMaterial(name + 'showmatasteroid', scene);
    asteroidNameMesh.nameMaterial = nameMat;
    nameMesh1.material = nameMat;
    nameMesh1.parent = asteroidNameMesh;

    let factor = -1.25;
    nameMesh1.position.y = factor;

    return asteroidNameMesh;
  }
  static createFireParticles(meta, wrapper, scene) {
    let particlePivot = new BABYLON.TransformNode("staticpivotparticle", scene);
    particlePivot.position.x = meta.px;
    particlePivot.position.y = meta.py;
    particlePivot.position.z = meta.pz;
    //particlePivot.rotation.x = -1 * Math.PI / 2;
    particlePivot.rotation.z = Math.PI;
    particlePivot.parent = wrapper;

    wrapper.particleSystem = this.createParticleSystem(scene);
    wrapper.particleSystem.emitter = particlePivot;

    wrapper.particleSystem.start();

    return wrapper.particleSystem;
  }
  static createParticleSystem(scene) {
    let pSystem = new BABYLON.GPUParticleSystem("particles", {
      capacity: 30000
    }, scene)
    pSystem.activeParticleCount = 20000;

    pSystem.emitRate = 150;
    // pSystem.particleEmitterType = new BABYLON.BoxParticleEmitter(1);
    pSystem.particleTexture = new BABYLON.Texture("/images/flare.png", scene);

    pSystem.gravity = new BABYLON.Vector3(0, 0, 0);

    // how long before the particles dispose?
    pSystem.minLifeTime = 2;
    pSystem.maxLifeTime = 2;

    // how much "push" from the back of the rocket.
    // Rocket forward movement also (seemingly) effects "push", but not really.
    pSystem.minEmitPower = 5;
    pSystem.maxEmitPower = 5;

    pSystem.minSize = 0.025;
    pSystem.maxSize = 0.25;

    // adjust diections to aim out fat-bottom end of rocket, with slight spread.
    pSystem.direction1 = new BABYLON.Vector3(-.2, 1, -.2);
    pSystem.direction2 = new BABYLON.Vector3(.2, 1, .2);


    // rocket length 4, so move emission point... 2 units toward wide end of rocket.
    pSystem.minEmitBox = new BABYLON.Vector3(0, 2, 0)
    pSystem.maxEmitBox = new BABYLON.Vector3(0, 2, 0)


    // a few colors, based on age/lifetime.  Yellow to red, generally speaking.
    pSystem.color1 = new BABYLON.Color3(1, 1, 0);
    pSystem.color2 = new BABYLON.Color3(1, .5, 0);
    pSystem.colorDead = new BABYLON.Color3(1, 0, 0);

    return pSystem;
  }
  static getAsteroids() {
    const fullList = ["aruna.obj",
      "asterope.obj",
      "athene.obj",
      "augusta.obj",
      "aurelia.obj",
      "azalea.obj",
      "bacchus.obj",
      "backlunda.obj",
      "bali.obj",
      "bambery.obj",
      "barolo.obj",
      "barringer.obj",
      "bauschinger.obj",
      "begonia.obj",
      "bella.obj",
      "bertha.obj",
      "billboyle.obj",
      "bodea.obj",
      "borsenberger.obj",
      "bressi.obj",
      "bruna.obj",
      "buda.obj",
      "buzzi.obj",
      "calvinia.obj",
      "carandrews.obj",
      "carlova.obj",
      "castalia.obj",
      "celsius.obj",
      "celuta.obj",
      "cerberus.obj",
      "cevenola.obj",
      "cheruskia.obj",
      "choukyongchol.obj",
      "claudia.obj",
      "constantia.obj",
      "cosima.obj",
      "cuitlahuac.obj",
      "cyane.obj",
      "cybele.obj",
      "dabu.obj",
      "danzig.obj",
      "datura.obj",
      "davida.obj",
      "dejanira.obj",
      "denisyuk.obj",
      "diebel.obj",
      "dike.obj",
      "doris.obj",
      "dudu.obj",
      "dysona.obj",
      "echo.obj",
      "einhardress.obj",
      "einstein.obj",
      "ella.obj",
      "elly.obj",
      "epyaxa.obj",
      "erigone.obj",
      "eryan.obj",
      "euler.obj",
      "faulkes.obj",
      "feiyiou.obj",
      "florentina.obj",
      "fragaria.obj",
      "fukuhara.obj",
      "gaby.obj",
      "gagarin.obj",
      "gajdariya.obj",
      "galinskij.obj",
      "ganymed.obj",
      "geographos.obj",
      "glarona.obj",
      "glasenappia.obj",
      "godwin.obj",
      "golevka.obj",
      "golia.obj",
      "gorgo.obj",
      "hagar.obj",
      "halawe.obj",
      "hardersen.obj",
      "hedera.obj",
      "hektor.obj",
      "hela.obj",
      "hera.obj",
      "herculina.obj",
      "herge.obj",
      "hermia.obj",
      "hertzsprung.obj",
      "hildrun.obj",
      "hirosetamotsu.obj",
      "hus.obj",
      "jugurtha.obj",
      "kaho.obj",
      "kalm.obj",
      "kani.obj",
      "karin.obj",
      "kate.obj",
      "kitty.obj",
      "klumpkea.obj",
      "klytaemnestra.obj",
      "kuritariku.obj",
      "landi.obj",
      "laputa.obj",
      "lucifer.obj",
      "ludmilla.obj",
      "lundmarka.obj",
      "magnitka.obj",
      "maja.obj",
      "maksutov.obj",
      "malyshev.obj",
      "malzovia.obj",
      "manto.obj",
      "manzano.obj",
      "marceline.obj",
      "margarita.obj",
      "marilyn.obj",
      "martir.obj",
      "medea.obj",
      "medusa.obj",
      "meta.obj",
      "mikejura.obj",
      "millis.obj",
      "mimi.obj",
      "mitaka.obj",
      "mutsumi.obj",
      "myroncope.obj",
      "naantali.obj",
      "naef.obj",
      "ndola.obj",
      "neckar.obj",
      "nele.obj",
      "nereus.obj",
      "nerthus.obj",
      "ninian.obj",
      "niobe.obj",
      "nirenberg.obj",
      "nonie.obj",
      "nriag.obj",
      "ohre.obj",
      "oort.obj",
      "otero.obj",
      "paeonia.obj",
      "paradise.obj",
      "paulina.obj",
      "pepita.obj",
      "pia.obj",
      "pire.obj",
      "plato.obj",
      "radegast.obj",
      "rakhat.obj",
      "reseda.obj",
      "rohloff.obj",
      "runcorn.obj",
      "sabine.obj",
      "safara.obj",
      "sedov.obj",
      "semiramis.obj",
      "senta.obj",
      "silver.obj",
      "sobolev.obj",
      "sphinx.obj",
      "storeria.obj",
      "svanberg.obj",
      "tabora.obj",
      "tacitus.obj",
      "takuma.obj",
      "takushi.obj",
      "tama.obj",
      "tanina.obj",
      "tapio.obj",
      "tarka.obj",
      "tarry.obj",
      "tatjana.obj",
      "tatsuo.obj",
      "taurinensis.obj",
      "teller.obj",
      "tempel.obj",
      "thais.obj",
      "thekla.obj",
      "themis.obj",
      "thernoe.obj",
      "thomana.obj",
      "thomsen.obj",
      "tiflis.obj",
      "tinchen.obj",
      "tinette.obj",
      "tirela.obj",
      "titicaca.obj",
      "tjilaki.obj",
      "tolosa.obj",
      "tombecka.obj",
      "tooting.obj",
      "trebon.obj",
      "tsia.obj",
      "tsoj.obj",
      "tulipa.obj",
      "turku.obj",
      "tyche.obj",
      "ucclia.obj",
      "ueta.obj",
      "uhland.obj",
      "ukko.obj",
      "ukraina.obj",
      "ulrike.obj",
      "ulula.obj",
      "una.obj",
      "ursa.obj",
      "valyaev.obj",
      "vasadze.obj",
      "vassar.obj",
      "veritas.obj",
      "verne.obj",
      "veveri.obj",
      "vibilia.obj",
      "vojno.obj",
      "volodia.obj",
      "wachmann.obj",
      "walkure.obj",
      "walraven.obj",
      "waltraut.obj",
      "wawel.obj",
      "webern.obj",
      "wempe.obj",
      "wolpert.obj",
      "wurm.obj",
      "xenophanes.obj",
      "xerxes.obj",
      "yamada.obj",
      "yorp.obj",
      "yoshiro.obj",
      "yrsa.obj",
      "zanda.obj",
      "zdenka.obj",
      "zerlina.obj",
      "zita.obj"
    ];

    return fullList;
  }
  static createAsteroidPath() {
    let v3 = (x, y, z) => new BABYLON.Vector3(x, y, z);
    let curve = BABYLON.Curve3.CreateCubicBezier(v3(5, 0, 0), v3(2.5, 2.5, -0.5), v3(1.5, 2, -1), v3(1, 2, -2), 10);
    let curveCont = BABYLON.Curve3.CreateCubicBezier(v3(1, 2, -2), v3(0, 2, -4.5), v3(-2, 1, -3.5), v3(-0.75, 3, -2), 10);
    curve = curve.continue(curveCont);
    curveCont = BABYLON.Curve3.CreateCubicBezier(v3(-0.75, 3, -2), v3(0, 4, -1), v3(0.5, 4.5, 0), v3(-0.5, 4.75, 1), 10);
    curve = curve.continue(curveCont);
    curveCont = BABYLON.Curve3.CreateCubicBezier(v3(-0.5, 4.75, 1), v3(-1, 4.75, 1.5), v3(-1.5, 4, 2.5), v3(-2, 3, 3.5), 10);
    curve = curve.continue(curveCont);
    curveCont = BABYLON.Curve3.CreateCubicBezier(v3(-2, 3, 3.5), v3(-2.5, 2, 4), v3(-1, 2.5, 5), v3(0, 0, 5), 10);
    curve = curve.continue(curveCont);
    let curveMesh = BABYLON.MeshBuilder.CreateLines(
      "bezier", {
        points: curve.getPoints()
      }, scene);
    curveMesh.color = new BABYLON.Color3(1, 1, 0.5);
    curveMesh.parent = pathGroup;
  }

  static async loadContainer(scene, path) {
    return new Promise((res, rej) => {
      BABYLON.SceneLoader.LoadAssetContainer(path, "", scene, container => {
        res(container);
      });
    })
  }
  static v(x, y, z) {
    if (x === undefined) x = 0;
    if (y === undefined) y = x;
    if (z === undefined) z = x;
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

  static async loadStaticMesh(scene, path, meta) {
    if (!window.staticMeshContainer)
      window.staticMeshContainer = {};
    if (!window.staticMaterialContainer)
      window.staticMaterialContainer = {};

    let resultMesh;
    let textureType = (meta && meta.extended.texturePath);
    if (textureType) {
      let sphere = BABYLON.MeshBuilder.CreateSphere("basemeshsphere" + meta.id, {
        diameter: meta.sizeBoxFit,
        segments: 16
      }, scene);
      if (!window.staticMaterialContainer[meta.extended.texturePath]) {
        let texture = new BABYLON.Texture(meta.extended.texturePath);
        let material = new BABYLON.StandardMaterial("basemeshmat" + meta.id, scene);
        material.ambientTexture = texture;

        if (!meta.noEmissive)
          material.emissiveTexture = texture;
        else
          material.diffuseTexture = texture;

        if (meta.cloneDiffuseForBump) {
          material.bumpTexture = texture;
          if (meta.invertBump) {
            material.invertNormalMapX = true;
            material.invertNormalMapY = true;
          }
        }
        if (meta.specularPower !== undefined)
          material.specularPower = meta.specularPower;
        else
          material.specularPower = 16;

        if (meta.emissiveBlack) {
          material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
          material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        }
        if (meta.noShadow) {
          material.diffuseColor = new BABYLON.Color3(9, 9, 0);
          material.emissiveColor = new BABYLON.Color3(9, 9, 0);
        }

        window.staticMaterialContainer[meta.extended.texturePath] = material;
      }
      sphere.material = window.staticMaterialContainer[meta.extended.texturePath];
      sphere.scaling = this.v(1, -1, 1);

      resultMesh = sphere;
    } else {
      if (!window.staticMeshContainer[path])
        window.staticMeshContainer[path] = await this.loadContainer(scene, path);

      let result = window.staticMeshContainer[path].instantiateModelsToScene();
      resultMesh = result.rootNodes[0];
    }
    resultMesh.setEnabled(false);

    if (meta && meta.noShadow) {
      scene.lights[0].excludedMeshes.push(resultMesh);
    } else {
      scene.baseShadowGenerator.addShadowCaster(resultMesh);
    }
    return resultMesh;
  }
  static processStaticAssetMeta(meta, profile) {

    let override = '';
    if (profile.assetSizeOverrides && profile.assetSizeOverrides[meta.id])
      override = profile.assetSizeOverrides[meta.id];

    let normalGlbPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.glbpath) + '?alt=media';
    let smallGlbPath = '';
    if (meta.smallglbpath)
      smallGlbPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.smallglbpath) + '?alt=media';
    let largeGlbPath = '';
    if (meta.largeglbpath)
      largeGlbPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.largeglbpath) + '?alt=media';
    let glbPath = normalGlbPath;

    if (smallGlbPath)
      glbPath = smallGlbPath;

    if (override === 'normal') {
      glbPath = normalGlbPath;
    }
    if (override === 'small') {
      if (smallGlbPath)
        glbPath = smallGlbPath;
    }
    if (override === 'huge') {
      if (largeGlbPath)
        glbPath = largeGlbPath;
    }

    let symbolPath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.symbol) + '?alt=media';

    let texturePath = null;
    let specularPower = null;
    if (meta.texturePath) {
      texturePath = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(meta.texturePath) + '?alt=media';
      glbPath = null;
      if (meta.specularPower)
        specularPower = meta.specularPower;
    }

    return {
      symbolPath,
      normalGlbPath,
      smallGlbPath,
      largeGlbPath,
      texturePath,
      specularPower,
      glbPath
    };
  }
  static sizeNodeToFit(node, size) {
    if (node.refreshBoundingInfo)
      node.refreshBoundingInfo(true);
    node.computeWorldMatrix(true);
    const boundingInfo = node.getHierarchyBoundingVectors(true);
    const currentLength = boundingInfo.max.subtract(boundingInfo.min);
    const biggestSide = Math.max(currentLength.x, Math.max(currentLength.y, currentLength.z));
    let scale = size / biggestSide;
    node.scaling.scaleInPlace(scale);
  }
  static addSymbolPanel(meta, scene) {
    let textPanel = BABYLON.MeshBuilder.CreatePlane('assettextPanel_' + meta.id, {
      height: 1,
      width: 1,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);

    let m = new BABYLON.StandardMaterial('assettextPanelMat_' + meta.id, scene);
    let t = new BABYLON.Texture(meta.extended.symbolPath, scene);
    t.vScale = 1;
    t.uScale = 1;
    t.hasAlpha = true;

    m.diffuseTexture = t;
    m.emissiveTexture = t;
    m.ambientTexture = t;
    let extraY = 1.25;
    if (meta.symbolY)
      extraY = meta.symbolY;

    textPanel.billboardMode = 7;

    if (meta.parent === 'uranus') {
      textPanel.rotation.x -= 1.57;
    }

    meta.yOffset = 0.5 + extraY;
    textPanel.material = m;
    textPanel.rotation.y = 0;
    textPanel.position.y = meta.yOffset;

    return textPanel;
  }

  static createGuides(scene, size = 30) {
    let makeTextPlane = function(text, color, size) {
      let dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
      dynamicTexture.hasAlpha = true;
      dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
      let plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
      plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
      plane.material.backFaceCulling = false;
      plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
      plane.material.diffuseTexture = dynamicTexture;
      return plane;
    };

    let axisX = BABYLON.Mesh.CreateLines("axisX", [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
      new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
    ], scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    let xChar = makeTextPlane("X", "red", size / 10);
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
    let axisY = BABYLON.Mesh.CreateLines("axisY", [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
      new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
    ], scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    let yChar = makeTextPlane("Y", "green", size / 10);
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
    let axisZ = BABYLON.Mesh.CreateLines("axisZ", [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
      new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
    ], scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    let zChar = makeTextPlane("Z", "blue", size / 10);
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
  }
  static meshSetVerticeColors(mesh, r, g, b, a = 1) {
    let colors = mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
    if (!colors) {
      colors = [];

      let positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

      for (let p = 0; p < positions.length / 3; p++) {
        colors.push(r, g, b, a);
      }
    }

    mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
  }
  static addTextPlane(scene, text, color, font_family = "Arial", bold = " ") {
    let backColor = "transparent";
    let id = text + font_family + bold;
    let paddingSides = 8;
    let font_size = 192;
    let font = bold + " " + font_size + "px " + font_family;
    let planeHeight = 1;
    let DTHeight = 1.5 * font_size; //or set as wished
    let ratio = planeHeight / DTHeight;
    let temp = new BABYLON.DynamicTexture(id + "dt2", 64, scene);
    let tmpctx = temp.getContext();
    tmpctx.font = font;
    let DTWidth = tmpctx.measureText(text).width + paddingSides;
    temp.dispose();

    let planeWidth = DTWidth * ratio;
    let dynamicTexture = new BABYLON.DynamicTexture(id + "dt", {
      width: DTWidth,
      height: DTHeight
    }, scene, false);
    let mat = new BABYLON.StandardMaterial(id + "mat", scene);
    mat.opacityTexture = dynamicTexture;
    mat.diffuseColor = color;
    mat.emissiveColor = color;
    mat.ambientColor = color;
    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(text, null, 205, font, "#000000", backColor, true);

    let plane = BABYLON.MeshBuilder.CreatePlane(id + "textplane", {
      width: planeWidth,
      height: planeHeight,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);
    plane.isPickable = false;
    plane.material = mat;

    return plane;
  }
}
