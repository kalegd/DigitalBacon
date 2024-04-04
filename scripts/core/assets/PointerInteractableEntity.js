/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Entity from '/scripts/core/assets/Entity.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';

export default class PointerInteractableEntity extends Entity {
    constructor() {
        super();
        this._pointerInteractable = new PointerInteractable();
    }
    
    setPointerInteractableParent(interactableParent) {
        if(interactableParent) {
            interactableParent.addChild(this._pointerInteractable);
        }
    }

    removeParentInteractableParent() {
        if(this._pointerInteractable.parent)
            this._pointerInteractable.parent.removeChild(
                this._pointerInteractable);
    }

    addToScene(scene, interactableParent) {
        super.addToScene(scene);
        this.setPointerInteractableParent(interactableParent);
    }

    removeFromScene() {
        super.removeFromScene();
        this.removeParentInteractableParent();
    }
}
