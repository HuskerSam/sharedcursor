import U3D from '/models/utility3d.js';

export default class Rocket3D {
  constructor(app) {
    this.app = app;
  }
  async shootRocket(probe, startPos, startRotation, endPosition) {
    let scene = this.app.scene;
    let meta = Object.assign({}, window.allStaticAssetMeta[probe]);
    meta.extended = U3D.processStaticAssetMeta(meta, {});
    let mesh = await U3D.loadStaticMesh(scene, meta.extended.glbPath);
    U3D.sizeNodeToFit(mesh, meta.sizeBoxFit);

    let rocketTN = new BABYLON.TransformNode(mesh.id + 'tn', scene);
    mesh.parent = rocketTN;

    let particles = U3D.createFireParticles(meta, rocketTN, scene);

    rocketTN.position.copyFrom(startPos);
    rocketTN.rotation.copyFrom(startRotation);
    particles.start();

    await this.rocketTakeOff(scene, rocketTN, 6, 10, 2500);
    await this.rocketTravelTo(scene, rocketTN, endPosition, 8000, 1500);
    particles.stop();
    await this.rocketLand(scene, rocketTN, endPosition, 1500);

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
  async rocketLand(scene, rocketMesh, endPosition, timeMS = 1500) {
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
      setTimeout(() => {
        rocketAnim.stop();
        animArray.splice(animArray.indexOf(rotationAnim), 1);
        animArray.splice(animArray.indexOf(positionAnim), 1);
        animArray.splice(animArray.indexOf(scalingAnim), 1);
        rocketMesh.scaling.copyFrom(origScaling);
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
}
