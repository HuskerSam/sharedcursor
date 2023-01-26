import U3D from '/models/utility3d.js';

export default class ActiveSeatChannel {
  constructor(app) {
    this.app = app;
  }
  updateAvatarPaths() {
    if (!this.app.avatarHelper.initedAvatars)
      return;

    if (this.app.avatarPathsInited === this.app.activeSeatIndex)
      return;
    this.app.avatarPathsInited = this.app.activeSeatIndex;

    let path = U3D.generateComplexPath();
    let pathWalkTime = 60000;
    let endFrame = pathWalkTime / 1000 * 60;
    let avatarPositionKeys = [];
    let avatarRotationKeys = [];

    let positions = path.positions;
    let positionCount = positions.length - 1;
    positions.forEach((value, index) => {
      avatarPositionKeys.push({
        frame: Math.floor(endFrame * index / positionCount),
        value
      });
    });

    let rotations = path.rotations;
    let rotationCount = rotations.length - 1;
    rotations.forEach((value, index) => {
      avatarRotationKeys.push({
        frame: Math.floor(endFrame * index / rotationCount),
        value
      });
    });

    this.app.avatarHelper.initedAvatars.forEach((avatar, seatIndex) => {
      let avatarMeta = this.app.avatarMetas[seatIndex];

      let positionTN = avatar.avatarPositionTN;
      if (avatarMeta.positionAnimation) {
        avatarMeta.positionAnimation.stop();
        avatarMeta.positionAnimation = null;
        avatarMeta.walkingAnimation = null;
      }
      positionTN.animations = [];

      if (seatIndex === this.app.activeSeatIndex) {
        let walkAnimName = avatarMeta.walkAnim;
        let wAnim = avatar.animationGroups.find(n => n.name.indexOf(walkAnimName) !== -1);

        wAnim.start(true);
        wAnim.setWeightForAllAnimatables(1);
        avatarMeta.walkingAnimation = wAnim;

        let positionAnim = new BABYLON.Animation(
          "avatarpositionTN" + seatIndex,
          "position",
          60,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        positionAnim.setKeys(avatarPositionKeys);
        positionTN.animations.push(positionAnim);

        let rotationAnim = new BABYLON.Animation(
          "avatarrotationTN" + seatIndex,
          "rotation",
          60,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        rotationAnim.setKeys(avatarRotationKeys);
        positionTN.animations.push(rotationAnim);

        avatarMeta.positionAnimation = this.app.scene.beginAnimation(positionTN, 0, endFrame, true);
        avatarMeta.positionAnimation.goToFrame(Math.floor(endFrame * seatIndex / 4));
      } else {
        avatar.avatarPositionTN.position.x = avatarMeta.x;
        avatar.avatarPositionTN.position.z = avatarMeta.z;
        avatar.animationGroups.forEach(anim => anim.stop());

        //avatar.skeletons[0].returnToRest();
        let aAnim = avatar.animationGroups.find(n => n.name.indexOf(avatarMeta.idlePose) !== -1);
        aAnim.start();
        aAnim.goToFrame(1);
        setTimeout(() => {
          aAnim.stop();
        }, 50);
      }

    });
  }

}
