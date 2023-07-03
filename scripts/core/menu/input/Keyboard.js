/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import States from '/scripts/core/enums/InteractableStates.js';
import { Colors, Fonts, Textures } from '/scripts/core/helpers/constants.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUI from 'three-mesh-ui';
import { Object3D } from 'three';

const KEYBOARD_SCALE = 0.6;
const KEYBOARD_VERTICAL_OFFSET = -0.275;

let i = 0;

class Keyboard {
    constructor() {
        this._id = uuidv4();
        this._pivotPoint = new Object3D();
        this._interactables = [];
        this._pageInteractables = [[],[]];
        this._keyboardPage = 0;
        this._owner = null;
        this._keysPressed = new Set();
    }

    init(scene) {
        this._scene = scene;
        this._setupKeyboard();
    }

    _setupKeyboard() {
        this._keyboard = new ThreeMeshUI.Keyboard({
            language: 'English',
            fontFamily: Fonts.defaultFamily,
            fontTexture: Fonts.defaultTexture,
            fontSize: 0.035, // fontSize will propagate to the keys blocks
            backgroundColor: Colors.keyboard,
            backgroundOpacity: 1,
            backspaceTexture: 'images/icons/backspace_icon_white.png',
            shiftTexture: 'images/icons/shift_icon_white.png',
            enterTexture: 'images/icons/enter_icon_white.png',
        });
        this._keyboard.scale.set(KEYBOARD_SCALE,KEYBOARD_SCALE,KEYBOARD_SCALE);
        for(let i = 0; i < this._keyboard.keys.length; i++) {
            this._setupKey(i);
        }
        this._pivotPoint.position.setY(KEYBOARD_VERTICAL_OFFSET);
        this._pivotPoint.add(this._keyboard);
    }

    _setupKey(index) {
        let key = this._keyboard.keys[index];
        key.setupState({
            state: States.IDLE,
            attributes: {
                offset: 0,
                backgroundColor: Colors.keyboardButtonIdle,
                backgroundOpacity: 1,
            },
            onSet: () => {
                this._keysPressed.delete(key);
            },
        });
        key.setupState({
            state: States.HOVERED,
            attributes: {
                offset: 0,
                backgroundColor: Colors.keyboardButtonHovered,
                backgroundOpacity: 1,
            },
            onSet: () => {
                this._keysPressed.delete(key);
            },
        });
        key.setupState({
            state: States.SELECTED,
            attributes: {
                offset: 0,
                backgroundColor: Colors.keyboardButtonSelected,
                backgroundOpacity: 1,
            },
            onSet: () => {
                this._keysPressed.add(key);
                if(key.info.command) {
                    switch(key.info.command) {

						// switch between panel charsets (eg: russian/english)
						case 'switch-set' :
							this._keyboard.setNextCharset();
							break;

						case 'enter' :
                            this._owner.handleKey('Enter');
							break;

						case 'space' :
                            this._owner.handleKey(' ');
							break;

						case 'backspace' :
                            this._owner.handleKey('Backspace');
							break;

						case 'shift' :
							this._keyboard.toggleCase();
							break;

					};
                } else if(key.info.input) {
                    this._owner.handleKey(key.info.input);
                }
            },
        });
        let interactable;
        // Need to make switch run on release otherwise _keysPressed prematurely
        // becomes empty
        let emptyFunction = () => {};
        if(key.info.command == 'switch') {
            // switch between panels
            interactable = new PointerInteractable(key);
            interactable.addAction(() => { this._switchPanel(); });
        } else {
            interactable = new PointerInteractable(key);
            interactable.addAction(emptyFunction);
        }
        if(index <= 32) {
            this._pageInteractables[0].push(interactable);
        } else {
            this._pageInteractables[1].push(interactable);
        }
        this._interactables.push(interactable);
    }

    _switchPanel() {
        this._keyboard.setNextPanel();
        if(this._owner) {
            PointerInteractableHandler.removeInteractables(
                this._pageInteractables[this._keyboardPage]);
            this._keyboardPage = (this._keyboardPage + 1) % 2;
            PointerInteractableHandler.addInteractables(
                this._pageInteractables[this._keyboardPage]);
        }
    }

    isKeyPressed() {
        return this._keysPressed.size != 0;
    }

    setOwner(owner) {
        this._owner = owner;
        this._scene.add(this._pivotPoint);
        PointerInteractableHandler.addInteractables(this._pageInteractables[this._keyboardPage]);
        UndoRedoHandler.disable(this._id);
    }

    removeOwner(owner) {
        if(this._owner == owner && this._pivotPoint.parent) {
            this._owner = null;
            this._pivotPoint.parent.remove(this._pivotPoint);
            PointerInteractableHandler.removeInteractables(this._interactables);
            UndoRedoHandler.enable(this._id);
        }
    }
}

let keyboard = new Keyboard();
export default keyboard;
