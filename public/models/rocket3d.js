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
    if (meta.rotationAnimation) {
      meta.rotationAnimation.stop();
      meta.rotationPivot.animations = [];
      meta.rotationAnimation = null;
    }

    return asset;
  }
  async shootRocket(probeId, targetId, originId) {
    let scene = this.app.scene;
    let asset = this.clearAnimations(probeId);

    let meta = asset.assetMeta;
    asset.setEnabled(true);

    U3D.sizeNodeToFit(asset.baseMesh, meta.sizeBoxFit);
    let particles = U3D.createFireParticles(meta, meta.basePivot, scene);
    particles.start();

    await this.rocketTakeOff(probeId, originId);
    await this.rocketTravelTo(probeId, targetId);
    particles.stop();

    asset.assetMeta.basePivot.parent = this.app.staticBoardObjects[targetId];
    this.clearAnimations(probeId);
    //    this.setOrbitAnimation(probeId);

    setTimeout(() => particles.dispose(), 2000);
  }

  async rocketTakeOff(probeId, originId) {
    return new Promise((res, rej) => {
      let asset = this.app.staticBoardObjects[probeId];
      let meta = asset.assetMeta;

      let timeMS = 2500;
      const endFrame = timeMS * 60 / 1000;

      let startPosition = this.app.assetPosition(originId);

      let newOrbitAnim = new BABYLON.Animation("assetorbitanim_" + probeId,
        "position", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
      let orbitKeys = [];
      let height = 15;
      let width = 5;
      for (let frame = 0; frame < endFrame; frame++) {
        let ratio = frame / endFrame * Math.PI / 2;
        let x = Math.cos(ratio) * width + startPosition.x;
        let y = Math.sin(ratio) * height + startPosition.y;
        let z = startPosition.z;
        let value = U3D.v(x, y, z);
        orbitKeys.push({
          frame,
          value
        });
      }

      newOrbitAnim.setKeys(orbitKeys);
      meta.orbitPivot.animations.push(newOrbitAnim);
      meta.orbitAnimation = this.app.scene.beginAnimation(meta.orbitPivot, 0, endFrame, false, 1, () => {
        res();
      });

      if (meta.startRatio !== undefined)
        meta.orbitAnimation.goToFrame(Math.floor(endFrame * meta.startRatio));


      const newRotationAnim = new BABYLON.Animation("tnrotationassetanim_" + probeId,
        "rotation", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
      const rotationKeys = [];
      let startR = U3D.v(0, 0, 0);
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
      newRotationAnim.setKeys(rotationKeys);

      meta.rotationPivot.animations.push(newRotationAnim);
      meta.rotationAnimation = this.app.scene.beginAnimation(meta.rotationPivot, 0, endFrame, false);

      if (meta.startRatio !== undefined)
        meta.rotationAnimation.goToFrame(Math.floor(endFrame * meta.startRatio));
    });
  }
  async rocketTravelTo(probeId, targetId) {
    return new Promise((res, rej) => {
      let asset = this.app.staticBoardObjects[probeId];
      let meta = asset.assetMeta;

      let timeMS = 10000;
      const endFrame = timeMS * 60 / 1000;

      let newOrbitAnim = new BABYLON.Animation("assetorbitanim_" + probeId,
        "position", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
      let orbitKeys = [];

      let startPosition = this.app.assetPosition(probeId);
      let endPosition = this.app.assetPosition(targetId);

      orbitKeys.push({
        frame: 0,
        value: U3D.v(startPosition.x, startPosition.y, startPosition.z)
      });
      orbitKeys.push({
        frame: endFrame,
        value: U3D.v(endPosition.x, startPosition.y, endPosition.z)
      });


      newOrbitAnim.setKeys(orbitKeys);
      meta.orbitPivot.animations.push(newOrbitAnim);
      meta.orbitAnimation = this.app.scene.beginAnimation(meta.orbitPivot, 0, endFrame, false, 1, () => {
        res();
      });

      if (meta.startRatio !== undefined)
        meta.orbitAnimation.goToFrame(Math.floor(endFrame * meta.startRatio));

    });
  }
}
