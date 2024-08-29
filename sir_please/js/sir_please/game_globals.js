import { vec3_create } from "../pp";

export let GameGlobals = {
    myScene: null,
    mySirRoom: null,
    myEarthView: null,

    myUp: vec3_create(0, 1, 0),

    myStarted: false,

    myPlayerLocomotion: null,
    myPlayerTransformManager: null,

    myBlackFader: null,

    myExplodeButton: null,
    myButtonHand: null,
    myHideHands: null,
    myDialogManager: null,
    mySirDialog: null,
    mySirDialogOption1Button: null,
    mySirDialogOption2Button: null,

    myExplodeParticlesSpawner: null,
    myButtonParticlesSpawner: null,
    myHandParticlesSpawner: null,

    myDebugEnabled: false,
    mySkipIntro: false,

    myGameCompleted: false,

    myDebugDialogs: false,

    myTrackedHandTeleported: false
};