import U3D from '/models/utility3d.js';

export default class Rocket3D {
  constructor(app) {
    this.app = app;
  }
  async shootRocket(probeId, targetId, originId) {
    let asset = this.app.clearAnimations(probeId);

    let meta = asset.assetMeta;
    asset.parent = null;
    asset.setEnabled(true);

    //U3D.sizeNodeToFit(asset.baseMesh, meta.sizeBoxFit);

    await this.rocketTravel(probeId, targetId, originId);
  }

  __createTravelPath(startPosition, startRotation, endPosition) {
    let phase1Time = 2500;
    let phase2Time = 6000;
    let takeOffHeight = 8;
    let takeOffX = 2.5;

    let xDelta = endPosition.x - startPosition.x;
    let zDelta = endPosition.z - startPosition.z;
    let yPointedRotation = Math.atan2(xDelta, zDelta);

    let phase1PosStart = U3D.v(startPosition.x, startPosition.y, startPosition.z);
    let phase1PosEnd = U3D.v(startPosition.x + takeOffX, startPosition.y + takeOffHeight, startPosition.z);

    let positionKeys = [];
    let rotationKeys = [];
    let endPhase1 = phase1Time * 60 / 1000;
    for (let frame = 0; frame < endPhase1; frame++) {
      let ratio = frame / endPhase1;// * Math.PI / 2;
      let x = ratio * takeOffX + startPosition.x;
      let y = ratio * takeOffHeight + startPosition.y;
      let z = startPosition.z;
      let value = U3D.v(x, y, z);
      positionKeys.push({
        frame,
        value
      });
    }

    let phase1RotStart = U3D.vector(startRotation);
    let phase1RotEnd = U3D.v(startRotation.x, startRotation.y, startRotation.z + Math.PI / 2);

    rotationKeys.push({
      frame: 0,
      value: phase1RotStart
    });
    rotationKeys.push({
      frame: Math.floor(0.667 * endPhase1),
      value: phase1RotStart
    });
    rotationKeys.push({
      frame: Math.floor(0.75 * endPhase1),
      value: U3D.v(phase1RotStart.x, phase1RotStart.y, (phase1RotStart.z + phase1RotEnd.z) / 2)
    });
    rotationKeys.push({
      frame: endPhase1,
      value: phase1RotEnd
    });


    let endPhase2 = phase2Time * 60 / 1000;
    positionKeys.push({
      frame: endPhase1 + 1,
      value: U3D.vector(phase1PosEnd)
    });
    positionKeys.push({
      frame: endPhase1 + endPhase2,
      value: U3D.v(endPosition.x, phase1PosEnd.y, endPosition.z)
    });


    let phase2RotStart = phase1RotEnd;
    let phase2RotStop = U3D.v(phase1RotEnd.x, yPointedRotation, phase1RotEnd.z);
    rotationKeys.push({
      frame: endPhase1 + 1,
      value: phase2RotStart
    });
    rotationKeys.push({
      frame: endPhase1 + endPhase2,
      value: phase2RotStop
    });

    return {
      positionKeys,
      rotationKeys,
      frames: endPhase1 + endPhase2,
      time: phase1Time + phase2Time
    }
  }
  async rocketTravel(probeId, targetId, originId) {
    return new Promise((res, rej) => {
      let asset = this.app.staticBoardObjects[probeId];
      let meta = asset.assetMeta;

      //U3D.sizeNodeToFit(asset.baseMesh, meta.sizeBoxFit);
      let startPosition = this.app.assetPosition(originId);
      let endPosition = this.app.assetPosition(targetId);
      let startRotation = U3D.v(0);
      let travelPath = this.__createTravelPath(startPosition, startRotation, endPosition)

      let particles = U3D.createFireParticles(meta, meta.basePivot, this.app.scene);
      particles.start();
      setTimeout(() => particles.dispose(), 15000);


      let newOrbitAnim = new BABYLON.Animation("assetorbitanim_" + probeId,
        "position", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
      let newRotationAnim = new BABYLON.Animation("assetrotationanim_" + probeId,
        "rotation", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);

      newOrbitAnim.setKeys(travelPath.positionKeys);
      newRotationAnim.setKeys(travelPath.rotationKeys);
      meta.orbitPivot.animations.push(newOrbitAnim);
      meta.rotationPivot.animations.push(newRotationAnim);

      let endFrame = travelPath.frames;
      meta.orbitAnimation = this.app.scene.beginAnimation(meta.orbitPivot, 0, endFrame, false, 1, () => {
        particles.stop();
        res();
      });
      meta.rotationAnimation = this.app.scene.beginAnimation(meta.rotationPivot, 0, endFrame, false);
      setTimeout(() => res(), 20000);
    });
  }
}
