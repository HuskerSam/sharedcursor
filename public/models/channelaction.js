import U3D from '/models/utility3d.js';

export default class ChannelAction {
  constructor(app) {
    this.app = app;
  }
  updateAvatarPaths() {
    if (!this.app.avatarHelper.initedAvatars) return;
    if (this.app.avatarPathsInited === this.app.activeSeatIndex) return;

    this.app.avatarPathsInited = this.app.activeSeatIndex;
  }
  async setupAgents() {
    await Recast();
    this.navigationPlugin = new BABYLON.RecastJSPlugin();
    let navmeshParameters = {
      cs: 0.2,
      ch: 0.2,
      walkableSlopeAngle: 90,
      walkableHeight: 5,
      walkableClimb: 1,
      walkableRadius: 1,
      maxEdgeLen: 12.,
      maxSimplificationError: 1.3,
      minRegionArea: 8,
      mergeRegionArea: 20,
      maxVertsPerPoly: 6,
      detailSampleDist: 6,
      detailSampleMaxError: 1,
    };

    this.navigationPlugin.createNavMesh(this.app.staticNavigationMeshes, navmeshParameters);
    this.crowd = this.navigationPlugin.createCrowd(4, 0.5, this.app.scene);

    this.crowd.onReachTargetObservable.add((agentInfos) => {
      this.agents[agentInfos.agentIndex].avatarMesh.localRunning = false;
      this.agents[agentInfos.agentIndex].avatarMesh.modelAnimationGroup.pause();
      this.agents[agentInfos.agentIndex].stopped = true;

      this.crowd.agentGoto(agentInfos.agentIndex, this.crowd.getAgentPosition(agentInfos.agentIndex));
      this.crowd.agentTeleport(agentInfos.agentIndex, this.crowd.getAgentPosition(agentInfos.agentIndex));
    });


    this.agentParams = {
      radius: 0.5,
      reachRadius: 1,
      height: 4,
      maxAcceleration: 4.0,
      maxSpeed: 1.0,
      collisionQueryRange: 0.5,
      pathOptimizationRange: 0.0,
      separationWeight: 1.0
    };
    this.agents = [];

    this.scene.onBeforeRenderObservable.add(() => {
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
  }
  navigationAid(mesh, avatarMesh) {
    //let randomPos = this.navigationPlugin.getRandomPointAround(new BABYLON.Vector3(-2.0, 0.1, -1.8), 0.5);
    let transform = new BABYLON.TransformNode();
    let agentIndex = this.crowd.addAgent(mesh.position, this.agentParams, transform);
    mesh.parent = transform;
    this.agents.push({
      idx: agentIndex,
      trf: transform,
      mesh,
      target: new BABYLON.Vector3(0, 0, 0),
      avatarMesh
    });
  }
  groundClick(pointerInfo) {
    let startingPoint = pointerInfo.pickInfo.pickedPoint;
    if (startingPoint) {
      let agents = this.crowd.getAgents();
      let closest = this.navigationPlugin.getClosestPoint(startingPoint);

      for (let i = 0; i < agents.length; i++) {
        this.crowd.agentGoto(agents[i], closest);
        this.agents[i].avatarMesh.localRunning = true;
        this.agents[i].target.x = closest.x;
        this.agents[i].target.y = closest.y;
        this.agents[i].target.z = closest.z;
        this.agents[i].stopped = false;

        this.agents[i].avatarMesh.modelAnimationGroup.play();
      }
    }
  }
}
