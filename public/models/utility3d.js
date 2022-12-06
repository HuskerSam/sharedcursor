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
  static orbitAnimation(name, meta, meshPivot, scene) {
    let orbitPivot = new BABYLON.TransformNode("transformorbit" + name, scene);
    orbitPivot.parent = meshPivot.parent;
    meshPivot.parent = orbitPivot;

    if (meta.orbitRadius)
      meshPivot.position.x = meta.orbitRadius;

    let orbitAnimation = new BABYLON.Animation(
      "staticmeshrotation" + name,
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let x = 0;
    let y = 0;
    let z = 0;
    let keys = [];
    let endFrame = meta.orbitTime / 1000 * 30;

    let orbitDirection = meta.orbitDirection === -1 ? 2 : -2;

    keys.push({
      frame: 0,
      value: new BABYLON.Vector3(x, y, z)
    });

    keys.push({
      frame: endFrame,
      value: new BABYLON.Vector3(x, y + orbitDirection * Math.PI, z)
    });

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
  static rotationAnimation(name, meta, meshPivot, scene) {
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

  static _addOrbitWrapper(name, meta, model, scene) {
    let orbitLayerMesh = new BABYLON.TransformNode('assetwrapperorbit' + name, scene);

    model.parent = orbitLayerMesh;

    if (meta.norx !== undefined)
      model.rotation.x = meta.norx;
    if (meta.nory !== undefined)
      model.rotation.y = meta.nory;
    if (meta.norz !== undefined)
      model.rotation.z = meta.norz;

    let orbitAnimation = new BABYLON.Animation(
      "staticorbitmeshrotation" + name,
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    //At the animation key 0, the value of scaling is "1"
    let x = model.rotation.x;
    let y = model.rotation.y;
    let z = model.rotation.z;

    let y_factor = -2 * Math.PI;
    let x_factor = 0;
    if (meta.parent === 'uranus') {
      x_factor = y_factor;
      y_factor = 0;
      y += 1.2;
    }

    let orbitkeys = [];
    let endFrame = meta.orbitTime / 1000 * 30;
    orbitkeys.push({
      frame: 0,
      value: new BABYLON.Vector3(x, y, z)
    });

    orbitkeys.push({
      frame: endFrame,
      value: new BABYLON.Vector3(x + x_factor, y + y_factor, z)
    });

    orbitAnimation.setKeys(orbitkeys);
    if (!orbitLayerMesh.animations)
      orbitLayerMesh.animations = [];
    orbitLayerMesh.animations.push(orbitAnimation);
    orbitLayerMesh.spinAnimation = scene.beginAnimation(orbitLayerMesh, 0, endFrame, true);

    if (meta.startRatio !== undefined)
      orbitLayerMesh.spinAnimation.goToFrame(Math.floor(endFrame * meta.startRatio));

    return orbitLayerMesh;
  }
  static __texture2DText(scene, textureText, cssColor, cssClearColor, textFontSize = 90, textFontFamily = 'Geneva', fontWeight = 'normal', renderSize = 512) {
    let texture = new BABYLON.DynamicTexture("dynamic texture", renderSize, scene, true);
    let numChar = textureText.length;
    let minFontSize = Math.ceil(renderSize * 1.5 / numChar);

    let font = fontWeight + ' ' + textFontSize + 'px ' + textFontFamily;
    let invertY = true;

    let color = cssColor ? cssColor : "white";
    let clearColor = cssClearColor ? cssClearColor : 'transparent';
    let x = 0;
    let y = textFontSize;

    texture._context.font = font;
    let wResult = texture.getContext().measureText(textureText);
    let text1Width = wResult.width;
    let leftOffset = (renderSize - text1Width) / 2.0;
    texture.drawText(textureText, x + leftOffset, y, font, color, clearColor);

    return texture;
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
    let bC = Utility3D.color(str);
    if (isNaN(bC.r))
      bC.r = 1;
    if (isNaN(bC.g))
      bC.g = 1;
    if (isNaN(bC.b))
      bC.b = 1;

    return 'rgb(' + (bC.r * 255.0).toFixed(0) + ',' + (bC.g * 255.0).toFixed(0) + ',' + (bC.b * 255.0).toFixed(0) + ')'
  }
  static __createTextMesh(name, options, scene) {
    let canvas = document.getElementById("highresolutionhiddencanvas");
    if (!canvas) {
      let cWrapper = document.createElement('div');
      cWrapper.innerHTML = `<canvas id="highresolutionhiddencanvas" width="4500" height="1500" style="display:none"></canvas>`;
      canvas = cWrapper.firstChild;
      document.body.appendChild(canvas);
    }
    let context2D = canvas.getContext("2d", {
      willReadFrequently: true
    });
    let size = 100;
    let vectorOptions = {
      polygons: true,
      textBaseline: "top",
      fontStyle: 'normal',
      fontWeight: 'normal',
      fontFamily: 'Georgia',
      size: size,
      stroke: false
    };
    for (let i in vectorOptions)
      if (options[i])
        vectorOptions[i] = options[i];
    if (options['size'])
      size = Number(options['size']);

    let vectorData = vectorizeText(options['text'], canvas, context2D, vectorOptions);
    let x = 0;
    let y = 0;
    let z = 0;
    let thick = 10;
    if (options['depth'])
      thick = Number(options['depth']);
    let scale = size / 100;
    let lenX = 0;
    let lenY = 0;
    let polies = [];

    for (var i = 0; i < vectorData.length; i++) {
      var letter = vectorData[i];
      var conners = [];
      for (var k = 0; k < letter[0].length; k++) {
        conners[k] = new BABYLON.Vector2(scale * letter[0][k][1], scale * letter[0][k][0]);
        if (lenX < conners[k].x) lenX = conners[k].x;
        if (lenY < conners[k].y) lenY = conners[k].y;
      }
      var polyBuilder = new BABYLON.PolygonMeshBuilder("pBuilder" + i, conners, scene);

      for (var j = 1; j < letter.length; j++) {
        var hole = [];
        for (var k = 0; k < letter[j].length; k++) {
          hole[k] = new BABYLON.Vector2(scale * letter[j][k][1], scale * letter[j][k][0]);
        }
        hole.reverse();
        polyBuilder.addHole(hole);
      }

      try {
        var polygon = polyBuilder.build(false, thick);
        //polygon.receiveShadows = true;

        polies.push(polygon);
      } catch (e) {
        console.log('text 3d render polygon error', e);
      }
    }

    if (lenY === 0)
      lenY = 0.001;
    if (lenX === 0)
      lenX = 0.001;
    let deltaY = thick / 2.0;
    let deltaX = lenX / 2.0;
    let deltaZ = lenY / 2.0;

    //keep this for bounds box? (vs TransformNode)
    let textWrapperMesh = BABYLON.MeshBuilder.CreateBox('textdetailswrapper' + name, {
      width: lenX,
      height: thick,
      depth: lenY
    }, scene);
    textWrapperMesh.isVisible = false;
    for (let i = 0, l = polies.length; i < l; i++) {
      polies[i].position.x -= deltaX;
      polies[i].position.y += deltaY;
      polies[i].position.z -= deltaZ;
      polies[i].setParent(textWrapperMesh);
    }

    return textWrapperMesh;
  }
  static setTextMaterial(scene, mat, text, rgbColor = 'rgb(255,0,0)', cssClearColor, textFontSize = 90, textFontFamily = 'Geneva', fontWeight = 'normal', renderSize = 512) {
    let nameTexture = Utility3D.__texture2DText(scene, text, rgbColor, cssClearColor, textFontSize, textFontFamily, fontWeight, renderSize);
    nameTexture.vScale = 1;
    nameTexture.uScale = 1;
    nameTexture.hasAlpha = true;
    mat.diffuseTexture = nameTexture;
    mat.emissiveTexture = nameTexture;
    mat.ambientTexture = nameTexture;
  }
  static asteroidMaterial(scene, name = 'asteroidmaterial') {
    let material = new BABYLON.StandardMaterial(name, scene);
    material.wireframe = true;
    let at = new BABYLON.Texture('/images/asteroid2diff.jpg', scene);
    material.diffuseTexture = at;

    let selectedMaterial = new BABYLON.StandardMaterial(name + 'selected', scene)
    let t = new BABYLON.Texture('/images/asteroid2diff.jpg', scene);
    selectedMaterial.diffuseTexture = t;
    let bt = new BABYLON.Texture('/images/asteroid2normal.jpg', scene);
    selectedMaterial.bumpTexture = bt;
    selectedMaterial.roughness = 1;
    selectedMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

    return {
      selectedMaterial,
      material
    }
  }
  static generateSymbolMesh(scene, name = 'asteroidsymbolwrapper', texturePrefix = 'asteroid') {
    let size = 1;

    let alphaMat = new BABYLON.StandardMaterial(name + 'mat1alpha', scene);
    alphaMat.alpha = 0;

    let symbolWrapper = BABYLON.MeshBuilder.CreateBox(name, {
      width: .01,
      height: .01,
      depth: .01
    }, scene);
    symbolWrapper.material = alphaMat;

    let symbolMesh1 = BABYLON.MeshBuilder.CreatePlane(name + 'symbolshow1', {
      height: size,
      width: size,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);

    let m = new BABYLON.StandardMaterial(name + 'mat', scene);
    let file1 = 'https://firebasestorage.googleapis.com/v0/b/sharedcursor.appspot.com/o/meshes' + encodeURIComponent(`/symbol/${texturePrefix}.png`) + '?alt=media';
    let t = new BABYLON.Texture(file1, scene);
    t.vScale = 1;
    t.uScale = 1;
    t.hasAlpha = true;

    m.diffuseTexture = t;
    m.emissiveTexture = t;
    m.ambientTexture = t;
    let extraY = 0;
    symbolMesh1.material = m;
    symbolMesh1.parent = symbolWrapper;
    symbolMesh1.rotation.y = 0;
    symbolMesh1.position.y = extraY;

    return symbolWrapper;
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
  static createFireParticles(meta, wrapper, name, scene) {
    if (!meta.particlesEnabled)
      return;
    let particlePivot = new BABYLON.TransformNode("staticpivotparticle" + name, scene);
    particlePivot.position.x = meta.px;
    particlePivot.position.y = meta.py;
    particlePivot.position.z = meta.pz;
    //particlePivot.rotation.x = -1 * Math.PI / 2;
    particlePivot.rotation.z = Math.PI;
    particlePivot.parent = wrapper;

    wrapper.particleSystem = this.createParticleSystem(particlePivot);
    wrapper.particleSystem.emitter = particlePivot;

    wrapper.particleSystem.start();

    return wrapper.particleSystem;
  }
  static createParticleSystem(scene) {
    let pSystem;
    if (BABYLON.GPUParticleSystem.IsSupported) {
      pSystem = new BABYLON.GPUParticleSystem("particles", {
        capacity: 1000000
      }, scene);
      pSystem.activeParticleCount = 100000;
    } else {
      pSystem = new BABYLON.ParticleSystem("particles", 25000, this.scene);
    }

    pSystem.emitRate = 500;
    // pSystem.particleEmitterType = new BABYLON.BoxParticleEmitter(1);
    pSystem.particleTexture = new BABYLON.Texture("/images/flare.png", this.scene);

    pSystem.gravity = new BABYLON.Vector3(0, 0, 0);

    // how long before the particles dispose?
    pSystem.minLifeTime = 2;
    pSystem.maxLifeTime = 2;

    // how much "push" from the back of the rocket.
    // Rocket forward movement also (seemingly) effects "push", but not really.
    pSystem.minEmitPower = 5;
    pSystem.maxEmitPower = 5;

    pSystem.minSize = 0.01;
    pSystem.maxSize = 0.1;

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
}
