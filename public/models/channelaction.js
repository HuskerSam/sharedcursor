import U3D from '/models/utility3d.js';

export default class ChannelAction {
  constructor(app) {
    this.app = app;
    this.agents = [];
    this.startStopTime = 4000;
    this.agentTargetHome = Array(4).fill(true);
    this.setupAgents();
  }
  updateAvatarPaths() {
    if (!this.app.avatarHelper.initedAvatars) return;
    if (this.app.avatarPathsInited === this.app.activeSeatIndex) return;
    this.app.avatarPathsInited = this.app.activeSeatIndex;

    clearInterval(this.activeSeatHomingInterval);
    this.lastStopTime = null;
    this.app.avatarHelper.initedAvatars.forEach((avatar, seatIndex) => {
      let avatarMeta = this.app.avatarMetas[seatIndex];
      if (seatIndex === this.app.activeSeatIndex) {
        this.agentTargetHome[seatIndex] = false;
        this.activeSeatHomingInterval = setInterval(() => {
          if (this.agents[seatIndex].stopped) {
            if (this.lastStopTime === null) {
              this.lastStopTime = Date.now();
              return;
            } else if (Date.now() - this.lastStopTime < this.startStopTime) {
              return;
            }
            this.lastStopTime = null;
          }

          let target = this.app.playerMoonAssets[seatIndex].baseMesh.getAbsolutePosition();
          this._sendAgentToTarget(seatIndex, U3D.v(target.x, 0, target.z));
        }, 50);
      } else if (!this.agentTargetHome[seatIndex]) {
        this.agentTargetHome[seatIndex] = true;
        this._sendAgentToTarget(seatIndex, U3D.v(avatarMeta.x, 0, avatarMeta.z), true);
      }
    });
  }
  setupAgents() {
    this.navigationPlugin = new BABYLON.RecastJSPlugin();

    this.app.staticNavigationMeshes.push(this.app.env.ground);
    this.navigationPlugin.createNavMesh(this.app.staticNavigationMeshes, {
      cs: 0.2,
      ch: 0.2,
      walkableSlopeAngle: 0,
      walkableHeight: 10,
      walkableClimb: 0,
      walkableRadius: 0.25,
      maxEdgeLen: 12.,
      maxSimplificationError: 1.3,
      minRegionArea: 8,
      mergeRegionArea: 20,
      maxVertsPerPoly: 6,
      detailSampleDist: 6,
      detailSampleMaxError: 1,
    });

    if (this.app.urlParams.get('shownavmesh')) {
      let debugMesh = this.navigationPlugin.createDebugNavMesh(this.app.scene);
      let matdebug = new BABYLON.StandardMaterial('matdebug', this.app.scene);
      matdebug.emissiveColor = new BABYLON.Color3(1, 0, 0.5);
      matdebug.alpha = 0.8;
      matdebug.disableLighting = true;
      debugMesh.material = matdebug;
    }
    this.crowd = this.navigationPlugin.createCrowd(4, 1.5, this.app.scene);

    this.crowd.onReachTargetObservable.add((agentInfos) => {
      this.stopWalk(agentInfos.agentIndex);
      this.agents[agentInfos.agentIndex].stopped = true;
    });
    this.app.scene.onBeforeRenderObservable.add(() => {
      let agentCount = this.agents.length;
      for (let i = 0; i < agentCount; i++) {
        let ag = this.agents[i];
        if (ag.stopped) {
          continue;
        }

        ag.mesh.position = this.crowd.getAgentPosition(ag.idx);
        let vel = this.crowd.getAgentVelocity(ag.idx);
        this.crowd.getAgentNextTargetPathToRef(ag.idx, ag.target);
        if (vel.length() > 0.2) {
          vel.normalize();
          let desiredRotation = Math.atan2(vel.x, vel.z);
          ag.mesh.rotation.y = ag.mesh.rotation.y + (desiredRotation - ag.mesh.rotation.y) * 0.02;
        }

      }
    });

    this.app.avatarHelper.initedAvatars.forEach((avatar, seatIndex) => {
      this.navigationAid(avatar.avatarPositionTN, seatIndex);
    });

    window.channelAction = this;
  }
  startWalk(seatIndex) {
    let avatarMeta = this.app.avatarMetas[seatIndex];
    let avatar = this.app.avatarHelper.initedAvatars[seatIndex];
    let walkAnimName = avatarMeta.walkAnim;
    let wAnim = avatar.animationGroups.find(n => n.name.indexOf(walkAnimName) !== -1);
    wAnim.start(true);
    wAnim.setWeightForAllAnimatables(1);
    avatarMeta.walkingAnimation = wAnim;
  }
  stopWalk(seatIndex) {
    let avatarMeta = this.app.avatarMetas[seatIndex];
    let avatar = this.app.avatarHelper.initedAvatars[seatIndex];
    let walkAnimName = avatarMeta.walkAnim;
    let wAnim = avatar.animationGroups.find(n => n.name.indexOf(walkAnimName) !== -1);
    wAnim.stop(true);

    avatar.animationGroups.find(n => n.name.indexOf(avatarMeta.idlePose) !== -1)
      .start(false, 1, 0.03333333507180214 * 60, 0.03333333507180214 * 60);
  }
  navigationAid(mesh, index) {
    let randomPos = mesh.position;
    let transform = new BABYLON.TransformNode();
    let agentIndex = this.crowd.addAgent(randomPos, {
      radius: 0.5,
      reachRadius: 2.5,
      height: 4,
      maxAcceleration: 3.0,
      maxSpeed: 1.5,
      collisionQueryRange: 2,
      pathOptimizationRange: 0.1,
      separationWeight: 50
    }, transform);
    this.agents.push({
      idx: agentIndex,
      trf: transform,
      mesh,
      target: new BABYLON.Vector3(0, 0, 0),
      avatarMesh: mesh
    });
  }
  _sendAgentToTarget(i, position, showLine, lineTimeout = 1500) {
    let seat = this.agents[i].mesh;
    let curPos = seat.getAbsolutePosition();

    if (this.agents[i].stopped)
      this.crowd.agentTeleport(i, curPos);
    this.crowd.agentGoto(i, position);
    this.startWalk(this.agents[i].idx);

    this.agents[i].target.x = position.x;
    this.agents[i].target.y = position.y;
    this.agents[i].target.z = position.z;
    this.agents[i].stopped = false;

    if (showLine) {
      let agentPosition = curPos;
      let pathPoints = this.navigationPlugin.computePath(agentPosition, position);
      let pathLine;
      pathLine = BABYLON.MeshBuilder.CreateDashedLines("ribbon", {
        points: pathPoints,
        updatable: true,
        instance: pathLine
      }, this.app.scene);
      let color = U3D.get3DColors(i);
      U3D.meshSetVerticeColors(pathLine, color.r, color.g, color.b);

      setTimeout(() => {
        pathLine.dispose();
      }, lineTimeout);
    }
  }
}