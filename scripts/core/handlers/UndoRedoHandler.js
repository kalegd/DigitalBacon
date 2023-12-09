/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Colors, Fonts, Textures } from '/scripts/core/helpers/constants.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';

import ThreeMeshUI from 'three-mesh-ui';

class UndoRedoHandler {
    init() {
        this._currentAction = {};
        this._disableOwners = new Set();
        this._setupButtons();
    }

    _setupButtons() {
        this._undoRedoParent = new ThreeMeshUI.Block({
            height: 0.12,
            width: 0.04,
            backgroundColor: Colors.defaultMenuBackground,
            backgroundOpacity: 0,
        });
        this._undoButton = ThreeMeshUIHelper.createButtonBlock({
            'backgroundTexture': Textures.undoIcon,
            'backgroundTextureScale': 0.8,
            'height': 0.04,
            'width': 0.04,
        });
        this._redoButton = ThreeMeshUIHelper.createButtonBlock({
            'backgroundTexture': Textures.redoIcon,
            'backgroundTextureScale': 0.8,
            'height': 0.04,
            'width': 0.04,
        });
        this._undoButton.visible = false;
        this._redoButton.visible = false;
        this._undoRedoParent.set({
            fontFamily: Fonts.defaultFamily,
            fontTexture: Fonts.defaultTexture
        });
        this._undoRedoParent.position.fromArray([0.245, 0, -0.001]);
        this._undoRedoParent.add(this._undoButton);
        this._undoRedoParent.add(this._redoButton);
        this._containerInteractable = new PointerInteractable();
        this._undoInteractable = new PointerInteractable(this._undoButton);
        this._undoInteractable.addAction(() => { this._undo(); });
        this._redoInteractable = new PointerInteractable(this._redoButton);
        this._redoInteractable.addAction(() => { this._redo(); });
    }

    addButtons(menu, interactable) {
        interactable.addChild(this._containerInteractable);
        menu.add(this._undoRedoParent);
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
        this._undoButton.visible = true;
        this._containerInteractable.addChild(this._undoInteractable);
    }

    _disableUndo() {
        this._undoButton.visible = false;
        this._containerInteractable.removeChild(this._undoInteractable);
    }

    _enableRedo() {
        this._redoButton.visible = true;
        this._containerInteractable.addChild(this._redoInteractable);
    }

    _disableRedo() {
        this._redoButton.visible = false;
        this._containerInteractable.removeChild(this._redoInteractable);
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
