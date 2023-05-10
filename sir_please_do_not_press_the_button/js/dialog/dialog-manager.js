import { Component, Emitter, Property } from '@wonderlandengine/api';

/**
 * dialog-manager
 */
export class DialogManager extends Component {
    static TypeName = 'dialog-manager';

    init() {
        fetch('./Dialog.json')
            .then((response) => response.json())
            .then((json) => {
                console.log(json)
                this.dialogs = json;
            });

        this.events = new Map();
    }

    getDialog(name) {
        return this.dialogs[name];
    }

    play(dialogController) {
        if (this.playingDialog) return;

        this.playingDialog = dialogController;
        dialogController.play();
    }

    end(dialog) {
        if (this.playingDialog != dialog) return;
        this.playingDialog = null;
    }

    advance(choiceIndex) {
        if (!this.playingDialog) return;
        this.playingDialog.advance(choiceIndex);
    }

    addEventListener(name, callback) {
        if (!this.events.has(name)) {
            this.events.set(name, new Emitter());
        }
        this.events.get(name).add(callback);
    }

    dispatchEvent(name) {
        if (!this.events.has(name)) return;
        const emitter = this.events.get(name);
        emitter.notify();
    }
}
