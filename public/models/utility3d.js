export default class Utility3D {
  static positionPivot(name, meta, meshPivot, scene) {
    let positionPivot = new BABYLON.TransformNode("transformposition" + name, scene);
    positionPivot.parent = meshPivot.parent;
    meshPivot.parent = positionPivot;

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
  static __orbitAnimation(name, meta, meshPivot, scene) {
    let orbitPivot = new BABYLON.TransformNode("transformorbit" + name, scene);
    orbitPivot.parent = meshPivot.parent;
    meshPivot.parent = orbitPivot;

    let orbitAnimation = new BABYLON.Animation(
      "staticmeshorbitanim" + name,
      "position",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let keys = [];
    let endFrame = Math.floor(meta.orbitTime / 1000 * 30);

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
    if (!orbitPivot.animations)
      orbitPivot.animations = [];
    orbitPivot.animations.push(orbitAnimation);
    let anim = scene.beginAnimation(orbitPivot, 0, endFrame, true);

    if (meta.startRatio !== undefined)
      anim.goToFrame(Math.floor(endFrame * meta.startRatio));

    meta.orbitAnimation = anim;

    return orbitPivot;
  }
  static __rotationAnimation(name, meta, meshPivot, scene) {
    let rotationPivot = new BABYLON.TransformNode("transformrotation" + name, scene);
    rotationPivot.parent = meshPivot.parent;
    meshPivot.parent = rotationPivot;

    let rotationAnimation = new BABYLON.Animation(
      "rotationanimationrotation" + name,
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let keys = [];
    let x = 0;
    let y = 0;
    let z = 0;

    let endFrame = meta.rotationTime / 1000 * 30;
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
    meta.rotationAnimation = anim;

    return rotationPivot;
  }
  static selectedRotationAnimation(node, scene, noAnim) {
    let rotationPivot = new BABYLON.TransformNode("tnselectionrotation" + node.id, scene);
    let rotationAnimation = new BABYLON.Animation(
      "selectedRotationAnimation" + name,
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let endFrame = 36 * 30;
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
    let pSystem;
    if (BABYLON.GPUParticleSystem.IsSupported) {
      pSystem = new BABYLON.GPUParticleSystem("particles", {
        capacity: 10000
      }, scene)
      pSystem.activeParticleCount = 10000;
    } else {
      pSystem = new BABYLON.ParticleSystem("particles", 2500, scene);
    }

    pSystem.emitRate = 75;
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
  static getTextPlane(text, name, scene, planeWidth = 4, planeHeight = 1, color = "rgb(255, 0, 255)", backcolor = "rgba(0, 0, 0, 0.25)",
    font_type = "Arial", scaleFactor = 100) {
    let plane = BABYLON.MeshBuilder.CreatePlane(name + "textplane", {
      width: planeWidth,
      height: planeHeight,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);

    let DTWidth = planeWidth * scaleFactor;
    let DTHeight = planeHeight * scaleFactor;

    let dynamicTexture = new BABYLON.DynamicTexture(name + "textplaneDynamicTexture", {
      width: DTWidth,
      height: DTHeight
    }, scene);

    let ctx = dynamicTexture.getContext();
    let size = 12; //any value will work
    ctx.font = size + "px " + font_type;
    let textWidth = ctx.measureText(text).width;
    let ratio = textWidth / size;
    let font_size = Math.floor(DTWidth / (ratio * 1)); //size of multiplier (1) can be adjusted, increase for smaller text
    let font = font_size + "px " + font_type;

    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(text, null, null, font, color, backcolor, true);

    let mat = new BABYLON.StandardMaterial(name + "textplanemat", scene);
    mat.diffuseTexture = dynamicTexture;
    mat.emissiveTexture = dynamicTexture;
    mat.ambientTexture = dynamicTexture;

    plane.material = mat;
    return plane;
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
    var curveMesh = BABYLON.MeshBuilder.CreateLines(
      "bezier", {
        points: curve.getPoints()
      }, scene);
    curveMesh.color = new BABYLON.Color3(1, 1, 0.5);
    curveMesh.parent = pathGroup;
  }

  static async loadContainer(scene, path) {
    return new Promise((res, rej) => {
      BABYLON.SceneLoader.LoadAssetContainer(path, "", scene, container => {
        container.animContainer = container;
        res(container);
      });
    })
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

  static async loadStaticMesh(scene, path, containerOnly, noShadow) {
    if (!window.staticMeshContainer)
      window.staticMeshContainer = {};

    if (!window.staticMeshContainer[path])
      window.staticMeshContainer[path] = await this.loadContainer(scene, path);

    if (containerOnly)
      return null;

    let result = window.staticMeshContainer[path].instantiateModelsToScene();
    if (noShadow) {
      scene.lights[0].excludedMeshes.push(result.rootNodes[0]);
    } else
      scene.baseShadowGenerator.addShadowCaster(result.rootNodes[0]);
    return result.rootNodes[0];
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

    return {
      symbolPath,
      normalGlbPath,
      smallGlbPath,
      largeGlbPath,
      glbPath
    };
  }
  static _fitNodeToSize(node, size) {
    const boundingInfo = node.getHierarchyBoundingVectors(true);
    const currentLength = boundingInfo.max.subtract(boundingInfo.min);
    const biggestSide = Math.max(currentLength.x, Math.max(currentLength.y, currentLength.z));
    let scale = size / biggestSide;
    node.scaling.scaleInPlace(scale);
  }
  static infoPanel(name, meta, pivotMesh, scene) {
    let size = 1;

    let symbolPivot = new BABYLON.TransformNode('symbolpopupwrapper' + name, scene);
    let symbolMat = new BABYLON.StandardMaterial('symbolshowmatalpha' + name, scene);
    symbolPivot.parent = pivotMesh.parent;
    pivotMesh.parent = symbolPivot;

    let textPivot = new BABYLON.TransformNode('textsymbolpopupwrapper' + name, scene);
    textPivot.parent = symbolPivot;
    textPivot.billboardMode = 7;
    meta.textPivot = textPivot;

    if (meta.parent === 'uranus') {
      textPivot.rotation.x -= 1.57;
    }

    let symbolMesh1 = BABYLON.MeshBuilder.CreatePlane('symbolshow1' + name, {
      height: size,
      width: size,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);

    let m = new BABYLON.StandardMaterial('symbolshowmat' + name, scene);
    let t = new BABYLON.Texture(meta.extended.symbolPath, scene);
    t.vScale = 1;
    t.uScale = 1;
    t.hasAlpha = true;

    m.diffuseTexture = t;
    m.emissiveTexture = t;
    m.ambientTexture = t;
    let extraY = 0;
    if (meta.symbolY)
      extraY = meta.symbolY;

    meta.yOffset = 0.5 + extraY;
    symbolMesh1.material = m;
    symbolMesh1.parent = textPivot;
    symbolMesh1.rotation.y = 0;
    symbolMesh1.position.y = meta.yOffset;

    return symbolPivot;
  }

  static createGuides(scene, size = 30) {
    var makeTextPlane = function(text, color, size) {
      var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
      dynamicTexture.hasAlpha = true;
      dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
      var plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
      plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
      plane.material.backFaceCulling = false;
      plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
      plane.material.diffuseTexture = dynamicTexture;
      return plane;
    };

    var axisX = BABYLON.Mesh.CreateLines("axisX", [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
      new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
    ], scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    var xChar = makeTextPlane("X", "red", size / 10);
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
    var axisY = BABYLON.Mesh.CreateLines("axisY", [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
      new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
    ], scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    var yChar = makeTextPlane("Y", "green", size / 10);
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
    var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
      new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
    ], scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    var zChar = makeTextPlane("Z", "blue", size / 10);
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
  static addTextPlane(scene, text, id = "randomid", font_family = "Arial", bold = " bold", color = "#FF00FF", backColor = "transparent") {
    let font_size = 192;
    var font = bold + " " + font_size + "px " + font_family;
    var planeHeight = 1;
    var DTHeight = 1.5 * font_size; //or set as wished
    var ratio = planeHeight / DTHeight;
    var temp = new BABYLON.DynamicTexture(id + "dt2", 64, scene);
    var tmpctx = temp.getContext();
    tmpctx.font = font;
    var DTWidth = tmpctx.measureText(text).width + 8;

    //Calculate width the plane has to be
    var planeWidth = DTWidth * ratio;

    //Create dynamic texture and write the text
    var dynamicTexture = new BABYLON.DynamicTexture(id + "dt", {
      width: DTWidth,
      height: DTHeight
    }, scene, false);
    var mat = new BABYLON.StandardMaterial(id + "mat", scene);
    mat.diffuseTexture = dynamicTexture;
    mat.emissiveTexture = dynamicTexture;
    mat.ambientTexture = dynamicTexture;
    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(text, null, null, font, color, backColor, true);

    //Create plane and set dynamic texture as material
    var plane = BABYLON.MeshBuilder.CreatePlane(id + "textplane", {
      width: planeWidth,
      height: planeHeight,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);
    plane.material = mat;

    return plane;
  }
}
