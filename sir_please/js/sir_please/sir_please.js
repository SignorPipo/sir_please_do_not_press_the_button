import { DialogController } from "../dialog/dialog-controller";
import { DialogManager } from "../dialog/dialog-manager";
import { ParticlesSpawnerComponent } from "../playground/particles_spawner_component";
import { FSM, Globals, PlayerLocomotionComponent } from "../pp";
import { AudioLoader } from "./audio_loader";
import { ButtonHandComponent } from "./components/button_hand_component";
import { ExplodeButtonComponent } from "./components/explode_button_component";
import { SirDialogButtonComponent } from "./components/sir_dialog_button_component";
import { SirDialogComponent } from "./components/sir_dialog_component";
import { GameGlobals } from "./game_globals";
import { GameState } from "./states/game_state";

export class SirPlease {
    constructor() {
        this._myFSM = new FSM();
        //this._myFSM.setLogEnabled(true, "Sir Please");
    }

    start() {
        this._myAudioLoader = new AudioLoader();
        this._myAudioLoader.load();

        this._collectSceneObjects();

        this._buildFSM();

        this._myFSM.perform("start");
    }

    update(dt) {
        this._myFSM.update(dt);
    }

    _buildFSM() {
        this._myFSM.addState("init");
        this._myFSM.addState("game", new GameState());

        this._myFSM.addTransition("init", "game", "start");
        this._myFSM.addTransition("game", "game", "end");

        this._myFSM.init("init");
    }

    _collectSceneObjects() {
        let playerLocomotionComponent = Globals.getScene().pp_getComponent(PlayerLocomotionComponent);
        GameGlobals.myPlayerLocomotion = playerLocomotionComponent._myPlayerLocomotion;
        GameGlobals.myPlayerLocomotion.setIdle(true);
        GameGlobals.myPlayerTransformManager = playerLocomotionComponent._myPlayerLocomotion._myPlayerTransformManager;

        GameGlobals.myExplodeParticlesSpawner = GameGlobals.myScene.pp_getObjectByName("Explode Particles Spawner").pp_getComponent(ParticlesSpawnerComponent);
        GameGlobals.myButtonParticlesSpawner = GameGlobals.myScene.pp_getObjectByName("Button Particles Spawner").pp_getComponent(ParticlesSpawnerComponent);
        GameGlobals.myHandParticlesSpawner = GameGlobals.myScene.pp_getObjectByName("Hand Particles Spawner").pp_getComponent(ParticlesSpawnerComponent);

        GameGlobals.myExplodeButton = GameGlobals.myScene.pp_getComponent(ExplodeButtonComponent);
        GameGlobals.myButtonHand = GameGlobals.myScene.pp_getComponent(ButtonHandComponent);
        GameGlobals.mySirDialog = GameGlobals.myScene.pp_getComponent(SirDialogComponent);
        GameGlobals.mySirDialogOption1Button = GameGlobals.mySirDialog.object.pp_getObjectByName("Option 1").pp_getComponent(SirDialogButtonComponent);
        GameGlobals.mySirDialogOption2Button = GameGlobals.mySirDialog.object.pp_getObjectByName("Option 2").pp_getComponent(SirDialogButtonComponent);

        GameGlobals.myDialogManager = GameGlobals.myScene.pp_getComponent(DialogManager);
        GameGlobals.myDialogController = GameGlobals.myScene.pp_getComponent(DialogController);
    }
}