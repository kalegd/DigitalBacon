/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Textures } from '/scripts/core/helpers/constants.js';
import { createSmallButton } from '/scripts/core/helpers/DigitalBaconUIHelper.js';
import { Div } from '/scripts/DigitalBacon-UI.js';

class UndoRedoHandler {
    init() {
        this._currentAction = {};
        this._disableOwners = new Set();
        this._setupButtons();
    }

    _setupButtons() {
        this._undoParent = new Div({ height: 0.04, width: 0.04 });
        this._redoParent = new Div({ height: 0.04, width: 0.04 });
        this._undoParent.bypassContentPositioning = true;
        this._redoParent.bypassContentPositioning = true;
        this._undoParent.position.fromArray([0.249, 0.026, 0]);
        this._redoParent.position.fromArray([0.249, -0.026, 0]);

        this._undoButton = createSmallButton(Textures.undoIcon, 0.8);
        this._redoButton = createSmallButton(Textures.redoIcon, 0.8);
        this._undoButton.onClick = () => this._undo();
        this._redoButton.onClick = () => this._redo();
    }

    addButtons(menu) {
        menu.add(this._undoParent);
        menu.add(this._redoParent);
    }

    reset() {
        this._currentAction = {};
        this._disableUndo();
        this._disableRedo();
    }

    addAction(undo, redo) {
        let action = {
            head: this._currentAction,
            undo: undo,
            redo: redo,
        };
        this._currentAction.tail = action;
        this._currentAction = action;
        if(this._disableOwners.size == 0) {
            this._enableUndo();
            this._disableRedo();
        }
        return action;
    }

    deleteAction(action) {
        if(action.head) {
            action.head.tail = action.tail;
            if(action.tail) {
                action.tail.head = action.head;
            }
            if(this._currentAction == action) this._currentAction = action.head;
            if(!this._currentAction.head) this._disableUndo();
        }
    }

    _undo() {
        if(this._currentAction.undo) this._currentAction.undo();
        if(this._currentAction.head) {
            this._currentAction = this._currentAction.head;
            this._enableRedo();
        }
        if(!this._currentAction.head) this._disableUndo();
    }

    _redo() {
        if(this._currentAction.tail) {
            this._enableUndo();
            this._currentAction = this._currentAction.tail;
            if(this._currentAction.redo) this._currentAction.redo();
        }
        if(!this._currentAction.tail) this._disableRedo();
    }

    _enableUndo() {
        this._undoParent.add(this._undoButton);
    }

    _disableUndo() {
        if(this._undoParent) this._undoParent.remove(this._undoButton);
    }

    _enableRedo() {
        this._redoParent.add(this._redoButton);
    }

    _disableRedo() {
        if(this._redoParent) this._redoParent.remove(this._redoButton);
    }

    enable(owner) {
        this._disableOwners.delete(owner);
        if(this._disableOwners.size != 0) return;
        if(this._currentAction.head) this._enableUndo();
        if(this._currentAction.tail) this._enableRedo();
    }

    disable(owner) {
        this._disableOwners.add(owner);
        this._disableUndo();
        this._disableRedo();
    }

}

let undoRedoHandler = new UndoRedoHandler();
export default undoRedoHandler;
