export default class Utility3D {
  static addSpinAnimation(name, meta, normalParent, parent, scene) {
    let spinAnimation = new BABYLON.Animation(
      "staticmeshrotation" + name,
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    //At the animation key 0, the value of scaling is "1"
    let x = parent.rotation.x;
    let y = parent.rotation.y;
    let z = parent.rotation.z;
    let keys = [];
    let endFrame = meta.spintime / 1000 * 30;
    let spindirection = meta.spindirection === -1 ? 2 : -2;
    if (meta.parent) {
      parent.rotation.y = meta.ry;
    }
    if (name === 'uranus') {
      z = z + Math.PI / -2;
      y += Math.PI + 1.15;
      keys.push({
        frame: 0,
        value: new BABYLON.Vector3(x, y, z)
      });

      keys.push({
        frame: endFrame,
        value: new BABYLON.Vector3(x + spindirection * Math.PI, y, z)
      });

    } else {
      keys.push({
        frame: 0,
        value: new BABYLON.Vector3(x, y, z)
      });

      keys.push({
        frame: endFrame,
        value: new BABYLON.Vector3(x, y + spindirection * Math.PI, z)
      });
    }

    if (!meta.parent && meta.noDaySpin !== true) {
      spinAnimation.setKeys(keys);
      if (!parent.animations)
        parent.animations = [];
      parent.animations.push(spinAnimation);
      let anim = scene.beginAnimation(parent, 0, endFrame, true);
      if (!meta.freeOrbit)
        normalParent.spinAnimation = anim;

      if (meta.startRatio !== undefined)
        anim.goToFrame(Math.floor(endFrame * meta.startRatio));
    }
  }
  static _addFreeOrbitWrapper(targetNode, meta, name, parent, scene) {
    let orbitTransformNode = new BABYLON.TransformNode('orbitassetwrapper' + name, scene);
    targetNode.parent = orbitTransformNode;

    targetNode.position.z = meta.orbitRadius;
    if (meta.orbitRadiusX)
      targetNode.position.x = meta.orbitRadiusX;

    if (meta.binaryOrbit) {
      let binaryOrbitTransformNode = new BABYLON.TransformNode('binaryassetwrapper' + name, scene);
      binaryOrbitTransformNode.parent = orbitTransformNode.parent;
      orbitTransformNode.parent = binaryOrbitTransformNode;

      let binaryAnimation = new BABYLON.Animation(
        "staticorbitmeshrotationbinary" + name,
        "position",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      let x = binaryOrbitTransformNode.position.x;
      let y = binaryOrbitTransformNode.position.y;
      let z = binaryOrbitTransformNode.position.z;
      let binarykeys = [];
      let endFrame = 5 * 30;
      binarykeys.push({
        frame: 0,
        value: new BABYLON.Vector3(x, y, z)
      });
      binarykeys.push({
        frame: 60,
        value: new BABYLON.Vector3(x - 0.5, y, z - 0.5)
      });
      binarykeys.push({
        frame: 120,
        value: new BABYLON.Vector3(x + 0.5, y, z + 0.5)
      });
      binarykeys.push({
        frame: 149,
        value: new BABYLON.Vector3(x, y, z)
      });

      binaryAnimation.setKeys(binarykeys);
      if (!binaryOrbitTransformNode.animations)
        binaryOrbitTransformNode.animations = [];
      binaryOrbitTransformNode.animations.push(binaryAnimation);
      targetNode.binaryAnimation = scene.beginAnimation(binaryOrbitTransformNode, 0, endFrame, true);
    }

    targetNode.position.x = 0;
    targetNode.position.y = 0;

    orbitTransformNode.position.x = meta.x;
    orbitTransformNode.position.y = meta.y;
    orbitTransformNode.position.z = meta.z;

    if (meta.rx !== undefined)
      parent.rotation.x = meta.rx;
    if (meta.ry !== undefined)
      parent.rotation.y = meta.ry;
    if (meta.rz !== undefined)
      parent.rotation.z = meta.rz;

    let orbitAnimation = new BABYLON.Animation(
      "staticorbitmeshrotation" + name,
      "rotation",
      30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    //At the animation key 0, the value of scaling is "1"
    let x = targetNode.rotation.x;
    let y = targetNode.rotation.y;
    let z = targetNode.rotation.z;
    let orbitkeys = [];
    let endFrame = meta.spintime / 1000 * 30;

    orbitkeys.push({
      frame: 0,
      value: new BABYLON.Vector3(x, y, z)
    });

    let factor = -2;
    if (meta.spindirection === -1)
      factor = 2;

    orbitkeys.push({
      frame: endFrame,
      value: new BABYLON.Vector3(x, y + factor * Math.PI, z)
    });

    orbitAnimation.setKeys(orbitkeys);
    if (!orbitTransformNode.animations)
      orbitTransformNode.animations = [];
    orbitTransformNode.animations.push(orbitAnimation);

    targetNode.spinAnimation = scene.beginAnimation(orbitTransformNode, 0, endFrame, true);

    if (meta.startRatio !== undefined)
      targetNode.spinAnimation.goToFrame(Math.floor(endFrame * meta.startRatio));

    if (meta.noDaySpin) {
      orbitTransformNode.appClickable = true;
      orbitTransformNode.masterid = name;
      orbitTransformNode.clickToPause = true;
      orbitTransformNode.clickCommand = 'pauseSpin';
      orbitTransformNode.spinAnimation = targetNode.spinAnimation;
    }

    return orbitTransformNode;
  }
  static _addOrbitWrapper(name, meta, model, scene) {
    let orbitLayerMesh = new BABYLON.TransformNode('assetwrapperorbit' + name, scene);

    model.parent = orbitLayerMesh;
    model.position.z = meta.z;
    model.position.x = meta.x;

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
    if (meta.moon90orbit) {
      x_factor = y_factor;
      y_factor = 0;
      y += 1.2;
    }

    let orbitkeys = [];
    let endFrame = meta.spintime / 1000 * 30;
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

}
