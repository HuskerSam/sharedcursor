import U3D from '/models/utility3d.js';

export default class Rocket3D {
  constructor(app) {
    this.app = app;
  }
  clearAnimations(probeId) {
    let asset = this.app.staticBoardObjects[probeId];
    let meta = asset.assetMeta;
    if (meta.orbitAnimation) {
      meta.orbitAnimation.stop();
      meta.orbitPivot.animations = [];
      meta.orbitAnimation = null;
    }

    return asset;
  }
  async shootRocket(probeId, targetId, originId) {
    let rotation = new BABYLON.Vector3(0, 0, 0);
    let startPosition = this.app.staticBoardObjects[originId].getAbsolutePosition();
    let endPosition = this.app.staticBoardObjects[targetId].getAbsolutePosition();

    let scene = this.app.scene;
    let asset = this.clearAnimations(probeId);

    let meta = asset.assetMeta;
    meta.basePivot.setEnabled(true);

    U3D.sizeNodeToFit(asset.baseMesh, meta.sizeBoxFit);

    let rocketTN = new BABYLON.TransformNode(asset.baseMesh.id + 'tn', scene);
    meta.basePivot.parent = rocketTN;

    let particles = U3D.createFireParticles(meta, rocketTN, scene);

    rocketTN.position.copyFrom(startPosition);
    rocketTN.rotation.copyFrom(rotation);
    particles.start();

    await this.rocketTakeOff(scene, rocketTN, 6, 10, 2500);
    await this.rocketTravelTo(scene, rocketTN, endPosition, 8000, 1500);
    particles.stop();
    await this.rocketLand(scene, asset, rocketTN, endPosition, 1500);

    asset.assetMeta.basePivot.parent = this.app.staticBoardObjects[targetId];
    this.clearAnimations(probeId);
    this.setOrbitAnimation(probeId);

    rocketTN.dispose();
    setTimeout(() => particles.dispose(), 2000);
  }

  async rocketTakeOff(scene, rocketMesh, height, xDelta, timeMS = 2000) {
    return new Promise((res, rej) => {
      const id = rocketMesh.id;
      const frameRate = 60;
      const endFrame = timeMS * frameRate / 1000;

      const heightAnim = new BABYLON.Animation(id + "heightPos", "position.y", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
      const heightKeys = [];
      heightKeys.push({
        frame: 0,
        value: rocketMesh.position.y
      });
      heightKeys.push({
        frame: Math.floor(0.5 * endFrame),
        value: rocketMesh.position.y + height / 5
      });
      heightKeys.push({
        frame: endFrame,
        value: rocketMesh.position.y + height
      });
      heightAnim.setKeys(heightKeys);

      const rotationAnim = new BABYLON.Animation(id + "rotationAnim", "rotation", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
      const rotationKeys = [];
      let startR = U3D.vector(rocketMesh.rotation);
      rotationKeys.push({
        frame: 0,
        value: startR
      });
      rotationKeys.push({
        frame: Math.floor(0.667 * endFrame),
        value: startR
      });
      let midR = U3D.v(startR.x + Math.PI / 4, startR.y, startR.z);
      rotationKeys.push({
        frame: Math.floor(0.75 * endFrame),
        value: midR
      });
      let endR = U3D.v(startR.x + Math.PI / 2, startR.y, startR.z);
      rotationKeys.push({
        frame: endFrame,
        value: endR
      });
      rotationAnim.setKeys(rotationKeys);

      const positionAnim = new BABYLON.Animation(id + "positionAnim", "position.z", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
      const positionKeys = [];
      positionKeys.push({
        frame: 0,
        value: rocketMesh.position.z
      });
      positionKeys.push({
        frame: Math.floor(0.667 * endFrame),
        value: rocketMesh.position.z
      });
      positionKeys.push({
        frame: endFrame,
        value: rocketMesh.position.z + xDelta
      });
      positionAnim.setKeys(positionKeys);

      rocketMesh.animations.push(heightAnim);
      rocketMesh.animations.push(rotationAnim);
      rocketMesh.animations.push(positionAnim);

      let rocketAnim = scene.beginAnimation(rocketMesh, 0, endFrame, true);
      let animArray = rocketMesh.animations;
      setTimeout(() => {
        rocketAnim.stop();
        animArray.splice(animArray.indexOf(heightAnim), 1);
        animArray.splice(animArray.indexOf(rotationAnim), 1);
        animArray.splice(animArray.indexOf(positionAnim), 1);
        res();
      }, timeMS);
    });
  }
  async rocketLand(scene, asset, rocketMesh, endPosition, timeMS = 1500) {
    return new Promise((res, rej) => {
      const id = rocketMesh.id;
      const frameRate = 60;
      const endFrame = timeMS * frameRate / 1000;

      const positionAnim = new BABYLON.Animation(id + "heightPosLand", "position", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
      const positionKeys = [];
      positionKeys.push({
        frame: 0,
        value: rocketMesh.position
      });
      positionKeys.push({
        frame: endFrame,
        value: endPosition
      });
      positionAnim.setKeys(positionKeys);

      const rotationAnim = new BABYLON.Animation(id + "rotationAnim", "rotation.x", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
      const rotationKeys = [];
      rotationKeys.push({
        frame: 0,
        value: rocketMesh.rotation.x
      });
      rotationKeys.push({
        frame: endFrame,
        value: rocketMesh.rotation.x + Math.PI / 3
      });
      rotationAnim.setKeys(rotationKeys);

      let origScaling = U3D.vector(rocketMesh.scaling);
      const scalingAnim = new BABYLON.Animation(id + "scaleLand", "scaling", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
      const scalingKeys = [];
      scalingKeys.push({
        frame: 0,
        value: origScaling
      });
      scalingKeys.push({
        frame: endFrame,
        value: U3D.v(origScaling.x * 0.25, origScaling.y * 0.25, origScaling.z * 0.25)
      });
      scalingAnim.setKeys(scalingKeys);

      rocketMesh.animations.push(rotationAnim);
      rocketMesh.animations.push(positionAnim);
      rocketMesh.animations.push(scalingAnim);

      let rocketAnim = scene.beginAnimation(rocketMesh, 0, endFrame, true);

      let animArray = rocketMesh.animations;
      let probeId = asset.assetMeta.id;
      setTimeout(() => {
        rocketAnim.stop();
        animArray.splice(animArray.indexOf(rotationAnim), 1);
        animArray.splice(animArray.indexOf(positionAnim), 1);
        animArray.splice(animArray.indexOf(scalingAnim), 1);
        asset.assetMeta.basePivot.parent = null;
        rocketMesh.dispose();
        res();
      }, timeMS);
    });
  }
  async rocketTravelTo(scene, rocket, endPosition, travelTime, landingDelay = 1500) {
    return new Promise((res, rej) => {
      let startPosition = U3D.vector(rocket.position);
      const id = rocket.id;
      const frameRate = 60;
      const endFrame = Math.floor((travelTime + landingDelay) * frameRate / 1000);
      const delayFrame = Math.floor((travelTime) * frameRate / 1000);

      const positionAnimation = new BABYLON.Animation(id + "positionAnim", "position", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
      const positionKeys = [];
      positionKeys.push({
        frame: 0,
        value: U3D.v(startPosition.x, startPosition.y, startPosition.z)
      });
      positionKeys.push({
        frame: delayFrame,
        value: U3D.v(endPosition.x, startPosition.y, endPosition.z)
      });
      positionKeys.push({
        frame: endFrame,
        value: U3D.v(endPosition.x, startPosition.y, endPosition.z)
      });
      positionAnimation.setKeys(positionKeys);

      rocket.animations.push(positionAnimation);
      let rocketAnim = scene.beginAnimation(rocket, 0, travelTime, true);

      let animArray = rocket.animations;
      setTimeout(() => {
        rocketAnim.stop();
        animArray.splice(animArray.indexOf(positionAnimation), 1);
        res();
      }, (travelTime - landingDelay));
    });
  }
  setOrbitAnimation(probeId, orbitRadius = 2, orbitTime = 30000) {
    let asset = this.app.staticBoardObjects[probeId];
    let meta = asset.assetMeta;

    let orbitAnimation = new BABYLON.Animation(
      "staticmeshorbitanim" + probeId,
      "position",
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    let keys = [];
    let endFrame = Math.floor(orbitTime / 1000 * 30);

    let orbitDirection = 1;

    let y = 4;
    let amp = Number(orbitRadius);
    for (let frame = 0; frame < endFrame; frame++) {
      let ratio = frame / endFrame * 2 * Math.PI * orbitDirection;
      let x = Math.cos(ratio) * amp;
      let z = Math.sin(ratio) * amp;
      let value = U3D.v(x, y, z);
      keys.push({
        frame,
        value
      });
    }

    orbitAnimation.setKeys(keys);
    meta.orbitPivot.animations.push(orbitAnimation);
    let anim = this.app.scene.beginAnimation(meta.orbitPivot, 0, endFrame, true);

    //if (meta.startRatio !== undefined)
    //  anim.goToFrame(Math.floor(endFrame * meta.startRatio));

    meta.orbitAnimation = anim;
  }
}
