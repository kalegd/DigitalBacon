/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PointerInteractableEntity from '/scripts/core/assets/PointerInteractableEntity.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { ValidKeys } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import Keyboard from '/scripts/core/menu/input/Keyboard.js';
import { InputHandler, InteractableStates } from '/scripts/DigitalBacon-UI.js';

import ThreeMeshUI from 'three-mesh-ui';

class TextField extends PointerInteractableEntity {
    constructor(params) {
        super();
        this._onBlur = params['onBlur'] || null;
        this._onEnter = params['onEnter'] || null;
        this._onUpdate = params['onUpdate'] || null;
        this._defaultContent = params['text'] || "";
        this._initialContent = params['initialText'] || "";
        this._maxLength = params['maxLength'] || null;
        this.content = "";
        if(global.deviceType == "POINTER") this._setupEventListeners();
        this._object = ThreeMeshUIHelper.createInputBlock(params);
        this._pointerInteractable = new PointerInteractable(this._object, true);
        this._pointerInteractable.addAction(() => { this._activate(); });
        this._active = false;

        if(this._initialContent) this.setContent(this._initialContent);
    }

    _setupEventListeners() {
        this._keyListener = (event) => { this.handleKey(event.key); };
        this._clickListener = () => {
            if(!Keyboard.isKeyPressed() && this._pointerInteractable.getState()
                != InteractableStates.SELECTED)
            {
                this.deactivate();
            }
        };
        this._pasteListener = (event) => { this._handlePaste(event); };
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.MENU_FIELD_FOCUSED, (message)=>{
            if(this._id != message.id) this.deactivate();
        });
        PubSub.subscribe(this._id, PubSubTopics.MENU_PAGE_CHANGED, () => {
            this.deactivate();
        });
        if(global.deviceType == "XR") {
            PubSub.subscribe(this._id, PubSubTopics.INSTANCE_ATTACHED, () => {
                this.deactivate();
            });
        }
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.MENU_FIELD_FOCUSED);
        PubSub.unsubscribe(this._id, PubSubTopics.MENU_PAGE_CHANGED);
        if(global.deviceType == "XR")
            PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_ATTACHED);
    }

    _handlePaste(e) {
        if(e.clipboardData.types.indexOf('text/plain') < 0) return;
        let data = e.clipboardData.getData('text/plain');
        let valid = true;
        for(let key of data) {
            if(!ValidKeys.has(key)) valid = false;
        }
        if(valid) {
            this.appendToContent(data);
            e.preventDefault();
        }
    }

    handleKey(key) {
        if(InputHandler.isKeyCodePressed("ControlLeft")) {
            return;
        } else if(InputHandler.isKeyCodePressed("MetaLeft")) {
            return;
        } else if(ValidKeys.has(key)) {
            this.appendToContent(key);
            if(this._onUpdate) this._onUpdate();
        } else if(key == "Backspace") {
            this._removeFromEndOfContent();
            if(this._onUpdate) this._onUpdate();
        } else if(key == "Enter") {
            this.deactivate();
            if(this._onEnter) this._onEnter();
        }
    }

    appendToContent(str) {
        this.content += str;
        this._updateDisplayedContentWithCursor();
    }

    _removeFromEndOfContent() {
        if(this.content.length > 0) {
            this.content = this.content.slice(0, -1);
            this._updateDisplayedContentWithCursor();
        }
    }

    _updateDisplayedContentWithCursor() {
        this._updateDisplayedContent(true);
    }

    _updateDisplayedContentWithoutCursor() {
        this._updateDisplayedContent(false);
    }

    _updateDisplayedContent(addPipe) {
        let newContent = this.content;
        let textComponent = this._object.children[1];
        if(this._maxLength && newContent.length > this._maxLength) {
            newContent = "..." + newContent.substring(
                newContent.length - this._maxLength);
        }
        if(addPipe) newContent += "|";
        textComponent.set({ content: newContent });
    }

    _activate() {
        if(global.deviceType == "XR") {
            if(this._active) return;
            this._active = true;

            this._updateDisplayedContentWithCursor();
            Keyboard.setOwner(this);
            this._addSubscriptions();
        } else if(global.deviceType == "POINTER") {
            if(this._active) return;
            this._active = true;

            this._updateDisplayedContentWithCursor();
            document.addEventListener("keydown", this._keyListener);
            document.addEventListener("click", this._clickListener);
            document.addEventListener("paste", this._pasteListener);
            global.keyboardLock = true;
        } else if (global.deviceType == "MOBILE") {
            let content = prompt("Enter Value", this.content);
            if(content || content == '') {
                this.setContent(content);
                if(this._onBlur) this._onBlur();
                if(this._onEnter) this._onEnter();
            }
        }
        PubSub.publish(this._id, PubSubTopics.MENU_FIELD_FOCUSED, {
            'id': this._id, 'targetOnlyMenu': false });
    }

    deactivate() {
        if(!this._active) return;
        this._active = false;

        if(global.deviceType == "XR") {
            Keyboard.removeOwner(this);
            this._updateDisplayedContentWithoutCursor();
            ThreeMeshUI.update();
            this._removeSubscriptions();
        } else if(global.deviceType == "POINTER") {
            document.removeEventListener("keydown", this._keyListener);
            document.removeEventListener("click", this._clickListener);
            document.removeEventListener("paste", this._pasteListener);
            global.keyboardLock = false;
            this._updateDisplayedContentWithoutCursor();
            ThreeMeshUI.update();
        }
        if(this._onBlur) this._onBlur();
    }

    setContent(content) {
        this.content = content;
        let textComponent = this._object.children[1];
        let oldContent = textComponent.content;
        if(oldContent == content) return;
        if(oldContent.length > 0 && oldContent.endsWith("|")) {
            this._updateDisplayedContentWithCursor();
        } else {
            this._updateDisplayedContentWithoutCursor();
        }
    }

    setDefaultContent(defaultContent) {
        this._defaultContent = defaultContent;
    }

    isBlank() {
        return this.content == "";
    }

    reset() {
        if(this._initialContent) {
            this.setContent(this._initialContent);
        } else {
            this.content = "";
            let textComponent = this._object.children[1];
            textComponent.set({ content: this._defaultContent });
        }
    }
}

export default TextField;
