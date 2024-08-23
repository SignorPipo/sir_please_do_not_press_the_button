import { Component, Emitter, PhysXComponent, Property } from "@wonderlandengine/api";
import { CursorTarget } from "@wonderlandengine/components";
import { BrowserUtils, EasingFunction, FSM, Globals, InputUtils, PhysicsCollisionCollector, Timer, vec3_create, XRUtils } from "../../pp";
import { AnalyticsUtils } from "../analytics_utils";
import { GameGlobals } from "../game_globals";
import { SetHandednessComponent } from "./set_handedness_component";

export class SirDialogButtonComponent extends Component {
    static TypeName = "sir-dialog-button";
    static Properties = {
        _myButton: Property.object(),
        _myButtonVisual: Property.object(),
        _myText: Property.object()
    };

    start() {
        this._myStarted = false;

        this._myFSM = new FSM();
        //this._myFSM.setLogEnabled(true, "      Sir Dialog Button");

        this._myFSM.addState("init");
        this._myFSM.addState("idle");
        this._myFSM.addState("hidden");
        this._myFSM.addState("pop_in", this._popInUpdate.bind(this));
        this._myFSM.addState("visible");
        this._myFSM.addState("pop_out", this._popOutUpdate.bind(this));

        this._myFSM.addTransition("init", "idle", "start");
        this._myFSM.addTransition("idle", "hidden", "start", this._start.bind(this));
        this._myFSM.addTransition("hidden", "pop_in", "show", this._popIn.bind(this));
        //this._myFSM.addTransition("pop_out", "pop_in", "show", this._popIn.bind(this));
        this._myFSM.addTransition("pop_in", "visible", "end");
        this._myFSM.addTransition("pop_in", "pop_out", "hide", this._popOut.bind(this)); // should set the proper scale based on the current pop in state
        this._myFSM.addTransition("visible", "pop_out", "hide", this._popOut.bind(this));
        this._myFSM.addTransition("pop_out", "hidden", "end");

        this._myFSM.addTransition("idle", "idle", "stop");
        this._myFSM.addTransition("hidden", "idle", "stop", this._stop.bind(this));
        this._myFSM.addTransition("pop_in", "idle", "stop", this._stop.bind(this));
        this._myFSM.addTransition("visible", "idle", "stop", this._stop.bind(this));
        this._myFSM.addTransition("pop_out", "idle", "stop", this._stop.bind(this));

        this._myFSM.init("init");
        this._myFSM.perform("start");

        this._mySpawnTimer = new Timer(0.2, false);
        this._myUnspawnTimer = new Timer(0.2, false);
        this._myTargetScale = vec3_create(1);

        this._myClickEmitter = new Emitter();

        this._myPhysX = this.object.pp_getComponent(PhysXComponent);
        this._myCollisionsCollector = new PhysicsCollisionCollector(this._myPhysX, true);

        this._myCursorTarget = this.object.pp_getComponent(CursorTarget);
        this._myCursorTarget.onUpWithDown.add(this.clickButton.bind(this, true));

        this._myPreventClick = true;
        this._myIgnoreCollisionTimer = new Timer(0.1, false);
        this._myVisualUnpressTimer = new Timer(0.1);
        this._myVisualUnpressTimer.end();

        this._myClickAudioPlayer = Globals.getAudioManager().createAudioPlayer("click");

        this._stop();
    }

    update(dt) {
        this._myFSM.update(dt);
        this._myCollisionsCollector.update(dt);
        this._myVisualUnpressTimer.update(dt);

        if (!this._myPreventClick && (this._myFSM.isInState("pop_in") || this._myFSM.isInState("visible"))) {
            this._myIgnoreCollisionTimer.update(dt);
            if (this._myIgnoreCollisionTimer.isDone()) {
                if (this._myCollisionsCollector.getCollisionsStart().length > 0) {
                    let physx = this._myCollisionsCollector.getCollisionsStart()[0];
                    let handedness = physx.pp_getComponent(SetHandednessComponent);
                    if (handedness != null) {
                        Globals.getGamepad(handedness.getHandedness()).pulse(0.2, 0.2);
                        this.clickButton(false, handedness.getHandedness());
                    } else {
                        this.clickButton();
                    }

                }
            }
        }

        if (this._myCollisionsCollector.getCollisions().length == 0 && this._myVisualUnpressTimer.isDone()) {
            this._myButtonVisual.pp_resetPositionLocal();
            this._myText.pp_resetPositionLocal();
        }
    }

    setPreventClick(preventClick) {
        this._myPreventClick = preventClick;
    }

    show() {
        this._myFSM.perform("show");
    }

    hide() {
        this._myFSM.perform("hide");
    }

    startButton() {
        this._myFSM.perform("start");
    }

    stopButton() {
        this._myPreventClick = true;

        this._myFSM.perform("stop");
    }

    isVisible() {
        return this._myFSM.isInState("pop_in") || this._myFSM.isInState("visible");
    }

    isReallyVisible() {
        return this._myFSM.isInState("pop_in") || this._myFSM.isInState("visible") || this._myFSM.isInState("pop_out");
    }

    _popInUpdate(dt, fsm) {
        if (this._mySpawnTimer.isRunning()) {
            this._mySpawnTimer.update(dt);

            this._myButton.pp_setScale(this._myTargetScale.vec3_scale(Math.max(EasingFunction.easeOut(this._mySpawnTimer.getPercentage()), Math.PP_EPSILON * 100)));

            if (this._mySpawnTimer.isDone()) {
                fsm.perform("end");
            }
        }
    }

    _popOutUpdate(dt, fsm) {
        if (this._myUnspawnTimer.isRunning()) {
            this._myUnspawnTimer.update(dt);

            this._myButton.pp_setScale(this._myTargetScale.vec3_scale(Math.max(EasingFunction.easeOut(1 - this._myUnspawnTimer.getPercentage()), Math.PP_EPSILON * 100)));

            if (this._myUnspawnTimer.isDone()) {
                this._myButton.pp_setActive(false);

                fsm.perform("end");
            }
        }
    }

    _start(fsm) {
        this._myButton.pp_setActive(false);
        this._myButtonVisual.pp_resetPositionLocal();
        this._myText.pp_resetPositionLocal();
    }

    _popIn(fsm) {
        this._myButtonVisual.pp_resetPositionLocal();
        this._myText.pp_resetPositionLocal();

        this._myIgnoreCollisionTimer.start();

        this._mySpawnTimer.start();

        this._myButton.pp_setScale(Math.PP_EPSILON * 100);

        this._myButton.pp_setActive(true);
    }

    _popOut(fsm) {
        this._myUnspawnTimer.start();

        this._myButton.pp_setScale(1);
    }

    _stop(fsm) {
        this._mySpawnTimer.reset();
        this._myUnspawnTimer.reset();

        this._myButton.pp_setActive(false);
    }

    registerClickEventListener(id, listener) {
        this._myClickEmitter.add(listener, { id: id });
    }

    unregisterClickEventListener(id) {
        this._myClickEmitter.remove(id);
    }

    clickButton(cursorClick = false, handedness = null) {
        if (!this._myPreventClick && (this._myFSM.isInState("pop_in") || this._myFSM.isInState("visible"))) {
            this._myClickEmitter.notify();

            GameGlobals.myButtonParticlesSpawner.spawn(this.object.pp_getPosition());

            this._myButtonVisual.pp_setPositionLocal(vec3_create(0, -0.01, 0));
            this._myText.pp_setPositionLocal(vec3_create(0, -0.01, 0));

            if (cursorClick) {
                this._myVisualUnpressTimer.start();
            }

            if (this._myClickAudioPlayer == null) {
                this._myClickAudioPlayer = Globals.getAudioManager().createAudioPlayer("click");
            }

            if (this._myClickAudioPlayer != null) {
                this._myClickAudioPlayer.setPosition(this.object.pp_getPosition());
                this._myClickAudioPlayer.play();
            }

            AnalyticsUtils.sendEventOnce("option_button_pressed");
            if (XRUtils.isSessionActive()) {
                AnalyticsUtils.sendEventOnce("option_button_pressed_vr");
                if (handedness != null) {
                    if (InputUtils.getInputSourceTypeByHandedness(handedness) == InputSourceType.TRACKED_HAND) {
                        AnalyticsUtils.sendEventOnce("option_button_pressed_vr_hand");
                    } else {
                        AnalyticsUtils.sendEventOnce("option_button_pressed_vr_gamepad");
                    }
                }
            } else {
                AnalyticsUtils.sendEventOnce("option_button_pressed_flat");
                if (BrowserUtils.isMobile()) {
                    AnalyticsUtils.sendEventOnce("option_button_pressed_flat_mobile");
                } else {
                    AnalyticsUtils.sendEventOnce("option_button_pressed_flat_desktop");
                }
            }
        }
    }
}