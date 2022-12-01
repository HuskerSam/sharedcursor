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
  static setTextMaterial(scene, mat, text, rgbColor = 'rgb(255,0,0)') {
    let nameTexture = Utility3D.__texture2DText(scene, text, rgbColor);
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
      width: size
    }, scene);
    let symbolMesh3 = BABYLON.MeshBuilder.CreatePlane(name + 'symbolshow3', {
      height: size,
      width: size
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
    symbolMesh3.material = m;
    symbolMesh3.parent = symbolWrapper;
    symbolMesh3.rotation.y = Math.PI;
    symbolMesh3.position.y = extraY;
    symbolMesh3.scaling.x = -1;

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
      width: size * 5
    }, scene);
    let nameMesh2 = BABYLON.MeshBuilder.CreatePlane(name + 'show2asteroid', {
      height: size * 5,
      width: size * 5
    }, scene);

    let nameMat = new BABYLON.StandardMaterial(name + 'showmatasteroid', scene);
    asteroidNameMesh.nameMaterial = nameMat;
    nameMesh1.material = nameMat;
    nameMesh1.parent = asteroidNameMesh;
    nameMesh2.material = nameMat;
    nameMesh2.parent = asteroidNameMesh;
    nameMesh2.scaling.x = -1;

    let factor = -1.25;
    nameMesh1.position.y = factor;
    nameMesh2.position.y = factor;
    nameMesh2.rotation.y = Math.PI;

    return asteroidNameMesh;
  }
  static loadStaticNavMesh(name, meta, scene) {
    let mercurysphere = BABYLON.MeshBuilder.CreateSphere(name + "navmeshsphere", {
      diameter: meta.navDiameter,
      segments: 16
    }, scene);
    if (meta.x)
      mercurysphere.position.x = meta.x;
    if (meta.z)
      mercurysphere.position.z = meta.z;
    return mercurysphere;
  }
}
