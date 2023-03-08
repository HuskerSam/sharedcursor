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
  static async loadStaticMesh(scene, path, meta) {
    if (!window.staticMeshContainer)
      window.staticMeshContainer = {};
    if (!window.staticMaterialContainer)
      window.staticMaterialContainer = {};

    let resultMesh;
    let textureType = (meta && meta.extended.texturePath);
    if (textureType) {
      let sphereSize = meta.sizeBoxFit;
      let segments = 32;
      if (meta.lava || meta.furType) {
        sphereSize *= 50;
        if (meta.lavaReduction !== undefined)
          sphereSize *= meta.lavaReduction;
      }
      let sphere = BABYLON.MeshBuilder.CreateSphere("basemeshsphere" + meta.id, {
        diameter: sphereSize,
        segments
      }, scene);
      if (!window.staticMaterialContainer[meta.extended.texturePath]) {
        let texture;
        let material;
        if (meta.furType) {
          texture = new BABYLON.Texture(meta.extended.texturePath);
          material = new BABYLON.FurMaterial("basemeshmatlfur" + meta.id, scene);
          material.furLength = 4;
          material.furAngle = 0;
          material.furColor = new BABYLON.Color3(0, 3, 1);
          material.diffuseTexture = texture;
          material.furTexture = BABYLON.FurMaterial.GenerateTexture("furTexture", scene);
          //material.furOcclusion = 0.25;
          material.furSpacing = 6;
          material.furDensity = 2;
          material.furSpeed = 150;
          material.furGravity = this.v(0, -1, 0);

          let quality = 30;
          sphere.material = material;
          let shells = BABYLON.FurMaterial.FurifyMesh(sphere, quality);
        } else if (meta.lava) {
          texture = new BABYLON.Texture(meta.extended.texturePath);
          material = new BABYLON.LavaMaterial("basemeshmatlava" + meta.id, scene);
          material.noiseTexture = new BABYLON.Texture("/images/cloud.png", scene);
          material.diffuseTexture = texture;

          if (meta.lavaSpeed !== undefined)
            material.speed = meta.lavaSpeed;
          if (meta.lavaMovingSpeed !== undefined)
            material.movingSpeed = meta.lavaMovingSpeed;
          if (meta.lavaFogColor !== undefined)
            material.fogColor = this.color(meta.lavaFogColor);
          if (meta.lavaFogDensity !== undefined)
            material.fogDensity = meta.lavaFogDensity;
          material.unlit = true;
          //material.disableLighting = true;  //unlit = true?
        } else {
          texture = new BABYLON.Texture(meta.extended.texturePath);
          material = new BABYLON.StandardMaterial("basemeshmat" + meta.id, scene);
          material.ambientTexture = texture;

          if (!meta.noEmissive)
            material.emissiveTexture = texture;
          else
            material.diffuseTexture = texture;

          if (meta.bumpPath) {
            material.bumpTexture = new BABYLON.Texture(meta.extended.bumpPath);
            material.invertNormalMapX = true;
            material.invertNormalMapY = true;
          } else if (meta.cloneDiffuseForBump) {
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

          material.disableLighting = true; //unlit = true?
        }

        material.backFaceCulling = true;
        window.staticMaterialContainer[meta.extended.texturePath] = material;
      }
      sphere.material = window.staticMaterialContainer[meta.extended.texturePath];
      sphere.scaling = this.v(1, -1, 1);

      resultMesh = sphere;
    } else {
      if (!window.staticMeshContainer[path])
        window.staticMeshContainer[path] = await BABYLON.SceneLoader.LoadAssetContainerAsync(path, "", scene);

      let result = window.staticMeshContainer[path].instantiateModelsToScene();
      resultMesh = result.rootNodes[0];
    }
    resultMesh.setEnabled(false);

    return resultMesh;
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

    textPanel.billboardMode = BABYLON.TransformNode.BILLBOARDMODE_Y;

    if (meta.parent === 'uranus') {
      textPanel.rotation.x -= 1.57;
    }

    meta.yOffset = 0.5 + extraY;
    textPanel.material = m;
    textPanel.rotation.y = 0;
    textPanel.position.y = meta.yOffset;

    return textPanel;
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
  static addTextPlane(scene, text, color, planeHeight = 1, font_family = "Arial", bold = " ") {
    let backColor = "transparent";
    let id = text + font_family + bold;
    let paddingSides = 8;
    let font_size = 192;
    let font = bold + " " + font_size + "px " + font_family;
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
  static generateCirclePath(y = 0, xMin = -10, xMax = 10, zMin = -10, zMax = 10) {
    let keyPoints = [];
    let rotations = [];

    rotations.push(this.v(0, 0, 0));
    keyPoints.push(this.v4(xMax, y, 0, 1));

    keyPoints.push(this.v4(0, y, zMax, 100));
    rotations.push(this.v(0, -Math.PI / 2, 0));

    keyPoints.push(this.v4(xMin, y, 0, 100));
    rotations.push(this.v(0, -Math.PI, 0));

    keyPoints.push(this.v4(0, y, zMin, 100));
    rotations.push(this.v(0, -Math.PI * 3 / 2, 0));

    keyPoints.push(this.v4(xMax, y, 0, 99));
    rotations.push(this.v(0, -Math.PI * 2, 0));

    let curve = this.curvePointsMerge(keyPoints);
    let positions = curve.getPoints();

    return {
      positions,
      rotations
    };
  }
}
