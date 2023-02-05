import U3D from '/models/utility3d.js';

export default class ChannelAction {
  constructor(app) {
    this.app = app;
    this.agents = [];
    this.startStopTime = 2000;
    this.agentTargetHome = Array(4).fill(true);
    this.cardActionTransforms = [];
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
      let delay = 0;
      if (agentInfos.agentIndex !== this.app.activeSeatIndex) {
        let pos = this.agents[agentInfos.agentIndex].mesh.getAbsolutePosition();
        let distance = pos.subtract(agentInfos.destination).length();
        if (distance > 0.5)
          delay = 2000;
      }
      setTimeout(() => {
        if (this.agents[agentInfos.agentIndex].agentType === "avatarCart")
          this.stopWalk(agentInfos.agentIndex);
        this.agents[agentInfos.agentIndex].stopped = true;
      }, delay);
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
      this.navigationAid(avatar.avatarPositionTN, seatIndex, 'avatarCart');
    });

    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      this.cardActionTransforms.push(new BABYLON.TransformNode('cardHolder' + cardIndex, this.app.scene));
      this.navigationAid(this.cardActionTransforms[cardIndex], cardIndex, 'cardCart');
    }

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

    if (seatIndex !== this.app.activeSeatIndex) {
      this.app.avatarHelper.setHome(avatar, avatarMeta);
      avatar.animationGroups.find(n => n.name.indexOf(avatarMeta.idlePose) !== -1)
        .start(false, 1, 0.03333333507180214 * 60, 0.03333333507180214 * 60);
    }
  }
  navigationAid(mesh, index, agentType) {
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
      agentType,
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
    if (this.agents[i].agentType === "avatarCart")
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
  async shootRocket(actionMeta) {
    let {
      probeId,
      targetId,
      originId
    } = actionMeta;

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
      let ratio = frame / endPhase1; // * Math.PI / 2;
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

      let particlePivot = new BABYLON.TransformNode("staticpivotparticle" + probeId, this.app.scene);
      particlePivot.position.x = meta.px;
      particlePivot.position.y = meta.py;
      particlePivot.position.z = meta.pz;
      //particlePivot.rotation.x = -1 * Math.PI / 2;
      particlePivot.rotation.z = Math.PI;
      const trail = new BABYLON.TrailMesh("new", particlePivot, this.app.scene, 0.5, 8, true);
      const sourceMat = new BABYLON.StandardMaterial("sourceMat", this.app.scene);
      sourceMat.emissiveColor = sourceMat.diffuseColor = new BABYLON.Color3.Red();
      sourceMat.specularColor = new BABYLON.Color3.Black();
      trail.material = sourceMat;
      particlePivot.parent = meta.basePivot;

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
        trail.dispose();
        particlePivot.dispose();
        res();
      });
      meta.rotationAnimation = this.app.scene.beginAnimation(meta.rotationPivot, 0, endFrame, false);
      setTimeout(() => res(), 20000);
    });
  }
  landProbe(meta) {
    let {
      probeId,
      targetId
    } = meta;
    this.clearAnimations(probeId);
    let asset = this.app.staticBoardObjects[probeId];
    asset.parent = this.app.parentPivot(targetId);
    let parentAsset = this.app.staticBoardObjects[targetId];

    let orbitRadius = 1.5;
    let startRatio = 0;
    if (parentAsset.assetMeta.objectType === 'planet') {
      asset.assetMeta.orbitPivot.position.y = 3;
      U3D.sizeNodeToFit(asset.baseMesh, 2);
      if (asset.assetMeta.objectType === 'moon') {
        startRatio = asset.assetMeta.startRatio;
        orbitRadius = asset.assetMeta.orbitRadius;
      }
    } else {
      asset.assetMeta.orbitPivot.position.y = 2;
      orbitRadius = 1.5;
      U3D.sizeNodeToFit(asset.baseMesh, 1);
    }

    let orbitPivot = U3D.addOrbitPivot({
      id: probeId,
      orbitDirection: 1,
      orbitRadius,
      startRatio,
      orbitTime: 60000
    }, this.app.scene, asset.assetMeta.orbitPivot);
    asset.assetMeta.orbitAnimation = orbitPivot.orbitAnimation;
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
}
