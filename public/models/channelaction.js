import U3D from '/models/utility3d.js';

export default class ChannelAction {
  constructor(app) {
    this.app = app;
    this.agents = [];
    this.startStopTime = 2000;
    this.agentTargetHome = Array(4).fill(true);

    this.cardPanel = this.app.menuTab3D.cardsPanelTab;
    this.cardPositions = [];
    this.cardWidth = 14;
    this.cardHeight = 8;

    this.setupCards();
    this.setupAgents();
  }
  setupCards() {
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      let cardHolder = new BABYLON.TransformNode('playercardholder' + cardIndex, this.app.scene);
      cardHolder.parent = this.cardPanel;
      let x = -this.cardWidth / 2 - 0.25;
      let y = this.cardHeight / 2 + 0.25;
      let z = 0;
      if (cardIndex % 2 === 1)
        x = this.cardWidth / 2 + 0.125;
      if (cardIndex > 1)
        y = this.cardHeight * 1.5 + 0.5;
      cardHolder.position = U3D.v(x, y - 2, z);

      this.cardPositions.push(cardHolder);

      cardHolder.playButton = this.app.menuTab3D.addActionPanelButton('/fontcons/action.png?cardindex=' + cardIndex, "Select Card",
        () => this.app.playCard(cardIndex), 2.25);
      cardHolder.playButton.position = U3D.v(this.cardWidth / 2 - 2, 1.4, 0);
      cardHolder.playButton.parent = cardHolder;
      cardHolder.playButton.setEnabled(false);

      cardHolder.discardButton = this.app.menuTab3D.addActionPanelButton('/fontcons/discard.png?cardindex=' + cardIndex, "Recycle Card",
        () => this.app.discardCard(cardIndex), 2.25);
      cardHolder.discardButton.position = U3D.v(this.cardWidth / 2 - 2, -1.4, 0);
      cardHolder.discardButton.parent = cardHolder;
      cardHolder.discardButton.setEnabled(false);

      let plane = BABYLON.MeshBuilder.CreatePlane("random", {
        height: this.cardHeight,
        width: this.cardWidth
      }, this.app.scene);
      plane.material = this.app.menuTab3D.playerCardHollowMaterial;
      plane.isPickable = false;
      plane.parent = cardHolder;

      cardHolder.cardAssetHolder = new BABYLON.TransformNode('cardAssetHolder' + cardIndex, this.app.scene);
      cardHolder.cardAssetHolder.parent = cardHolder;
      cardHolder.cardAssetHolder.position = U3D.v(-0.25, 0, 0);
      cardHolder.cardAssetHolder.rotation.z = Math.PI / 2;
    }
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
          this.toTarget(seatIndex, U3D.v(target.x, 0, target.z));
        }, 50);
      } else if (!this.agentTargetHome[seatIndex]) {
        this.agentTargetHome[seatIndex] = true;

        this.toTarget(seatIndex, U3D.v(avatarMeta.x, 0, avatarMeta.z), true);
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
    this.crowd = this.navigationPlugin.createCrowd(6, 1.5, this.app.scene);

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
        if (this.agents[agentInfos.agentIndex].agentType === "cardCart") {
          this.probeTrailMesh.setEnabled(false);
          this.resolveActionCard(this.lastAnimateAction);
        }
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
      this.addCrowdAgent(avatar.avatarPositionTN, seatIndex, 'avatarCart');
    });

    this.actionProbeTransform = new BABYLON.TransformNode('actionProbeTransform', this.app.scene);
    this.actionProbeTransformInner = new BABYLON.TransformNode('actionProbeTransformInner', this.app.scene);
    this.actionProbeTransformInner.parent = this.actionProbeTransform;
    this.actionProbeTransformInner.rotation = U3D.v(Math.PI / 2, -Math.PI / 2, Math.PI / 2);

    this.probeParticlePivot = new BABYLON.TransformNode("probeParticlePivot", this.app.scene);
    this.probeParticlePivot.rotation.z = Math.PI;
    this.probeParticlePivot.parent = this.actionProbeTransformInner;
    this.probeTrailMesh = new BABYLON.TrailMesh("probeTrailMesh", this.probeParticlePivot, this.app.scene, 0.5, 30, true);
    const sourceMat = new BABYLON.StandardMaterial("sourceMat", this.app.scene);
    sourceMat.emissiveColor = sourceMat.diffuseColor = new BABYLON.Color3.Red();
    sourceMat.specularColor = new BABYLON.Color3.Blue();
    this.probeTrailMesh.material = sourceMat;
    this.probeTrailMesh.setEnabled(false);

    this.addCrowdAgent(this.actionProbeTransform, null, 'cardCart');

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
  addCrowdAgent(mesh, index, agentType) {
    let randomPos = mesh.position;
    let transform = new BABYLON.TransformNode();
    let agentIndex = this.crowd.addAgent(randomPos, {
      radius: 0.5,
      reachRadius: 2.5,
      height: 4,
      maxAcceleration: 3.0,
      maxSpeed: agentType === 'avatarCart' ? 1.5 : 4,
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
  toTarget(agentIndex, position, showLine, lineTimeout = 1500) {
    let seat = this.agents[agentIndex].mesh;
    let curPos = seat.getAbsolutePosition();

    if (this.agents[agentIndex].stopped)
      this.crowd.agentTeleport(agentIndex, curPos);
    this.crowd.agentGoto(agentIndex, position);
    if (this.agents[agentIndex].agentType === "avatarCart")
      this.startWalk(agentIndex);

    this.agents[agentIndex].target.x = position.x;
    this.agents[agentIndex].target.y = position.y;
    this.agents[agentIndex].target.z = position.z;
    this.agents[agentIndex].stopped = false;

    if (showLine) {
      let agentPosition = curPos;
      let pathPoints = this.navigationPlugin.computePath(agentPosition, position);
      let pathLine;
      pathLine = BABYLON.MeshBuilder.CreateDashedLines("ribbon", {
        points: pathPoints,
        updatable: true,
        instance: pathLine
      }, this.app.scene);
      let color = U3D.get3DColors(agentIndex);
      U3D.meshSetVerticeColors(pathLine, color.r, color.g, color.b);

      setTimeout(() => {
        pathLine.dispose();
      }, lineTimeout);
    }
  }

  async animateActionCard(actionDetails) {
    let asset = this.clearAnimations(actionDetails.sourceId);
    asset.baseMesh.parent = this.actionProbeTransformInner;
    asset.baseMesh.setEnabled(true);
    //console.log(asset);
    let startPosition = this.app.assetPosition(actionDetails.originId);
    let endPosition = this.app.assetPosition(actionDetails.targetId);

    this.probeParticlePivot.position.x = asset.assetMeta.px;
    this.probeParticlePivot.position.y = asset.assetMeta.py;
    this.probeParticlePivot.position.z = asset.assetMeta.pz;
    this.probeTrailMesh.setEnabled(true);
    startPosition.y = 0;
    endPosition.y = 0;
    this.agents[4].stopped = true;
    this.toTarget(4, endPosition);
    this.lastAnimateAction = actionDetails;
  }
  resolveActionCard(actionDetails) {
    this.clearAnimations(actionDetails.sourceId);

    let asset = this.app.staticBoardObjects[actionDetails.sourceId];
    let parentId = (actionDetails.action === 'init') ? actionDetails.parent : actionDetails.targetId;
    asset.parent = this.app.parentPivot(parentId);
    let parentAsset = this.app.staticBoardObjects[parentId];
    //console.log(actionDetails);

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
      id: actionDetails.sourceId,
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

  updateCardsForPlayer() {
    if (!this.app.boardRoundData)
      return;

    let actionCards = this.app.actionCards;
    let cardIndexes = this.getRoundCardsForPlayer();
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      this.renderPlayerCard(cardIndex, cardIndexes[cardIndex]);
    }
  }
  getRoundCardsForPlayer() {
    let cardIndexes = Array(4).fill(-1);
    let seatIndex = this.app.activeSeatIndex;

    this.app.boardRoundData.actions.forEach(action => {
      if (action.action === 'cardUpdate' && action.seatIndex === seatIndex)
        cardIndexes[action.cardIndex] = action.cardId;
    });

    return cardIndexes;
  }
  renderPlayerCard(cardPositionIndex, cardId) {
    let cardHolder = this.cardPositions[cardPositionIndex];

    if (cardHolder.cachedIndex === cardId) return;

    cardHolder.cachedIndex = cardId;
    if (cardHolder.assetMesh) {
      cardHolder.assetMesh.dispose();
      cardHolder.assetMesh = null;
    }

    if (cardId === -1) return;

    let cardMeta = this.app.actionCards[cardId];
    let meta = this.app.allStaticAssetMeta[cardMeta.gameCard];
    let mesh = this.app.staticBoardObjects[cardMeta.gameCard].baseMesh.clone();
    mesh.setEnabled(true);
    U3D.sizeNodeToFit(mesh, 6);
    mesh.parent = cardHolder.cardAssetHolder;
    mesh.assetMeta = {
      activeSelectedObject: true,
      appClickable: true,
      clickCommand: 'customClick',
      handlePointerDown: () => this.app.menuTab3D.setSelectedAsset(meta)
    };
    cardHolder.assetMesh = mesh;

    if (cardHolder.assetName)
      cardHolder.assetName.dispose(false, true);
    cardHolder.assetName = U3D.addTextPlane(this.app.scene, meta.name, U3D.color("1,1,1"));
    cardHolder.assetName.position = U3D.v(0, -this.cardHeight / 2 + 0.75, 0);
    cardHolder.assetName.scaling = U3D.v(1);
    cardHolder.assetName.parent = cardHolder;

    if (cardHolder.assetDescription)
      cardHolder.assetDescription.dispose(false, true);
    cardHolder.assetDescription = U3D.addTextPlane(this.app.scene, meta.shortDescription, U3D.color("0.5,0.5,1"));
    cardHolder.assetDescription.position = U3D.v(0, this.cardHeight / 2 - 0.75, 0);
    cardHolder.assetDescription.scaling = U3D.v(1);
    cardHolder.assetDescription.parent = cardHolder;


    //let types = ['planet', 'moon', 'dwarf', 'nearearth']
    //if (types.indexOf(this.app.selectedAsset.objectType) !== -1) {
    cardHolder.playButton.setEnabled(true);
    //  } else {
    //    cardHolder.playButton.setEnabled(false);
    //    }

    cardHolder.discardButton.setEnabled(true);
  }
}
