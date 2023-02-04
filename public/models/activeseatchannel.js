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


    this.app.avatarHelper.initedAvatars.forEach((avatar, seatIndex) => {
      let avatarMeta = this.app.avatarMetas[seatIndex];

      let positionTN = avatar.avatarPositionTN;
      if (avatarMeta.positionAnimation) {
        avatarMeta.positionAnimation.stop();
        avatarMeta.positionAnimation = null;
        avatarMeta.walkingAnimation = null;
      }
      positionTN.animations = [];

//      if (seatIndex === this.app.activeSeatIndex)
      avatar.avatarPositionTN.position.x = avatarMeta.x;
      avatar.avatarPositionTN.position.z = avatarMeta.z;
      avatar.animationGroups.forEach(anim => anim.stop());

      //avatar.skeletons[0].returnToRest();
      let aAnim = avatar.animationGroups.find(n => n.name.indexOf(avatarMeta.idlePose) !== -1);
      aAnim.start(false, 1, 0.03333333507180214 * 60, 0.03333333507180214 * 60);

    });
  }
}
