/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import UserController from '/scripts/core/assets/UserController.js';
import System from '/scripts/core/assets/systems/System.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import GripInteractable from '/scripts/core/interactables/GripInteractable.js';
import PointerInteractable from '/scripts/core/interactables/PointerInteractable.js';
import GripInteractableHandler from '/scripts/core/handlers/GripInteractableHandler.js';
import PointerInteractableHandler from '/scripts/core/handlers/PointerInteractableHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SystemsHandler from '/scripts/core/handlers/SystemsHandler.js';

export default class GrabbableSystem extends System {
    constructor(params = {}) {
        params['assetId'] = GrabbableSystem.assetId;
        super(params);
        this._addSubscriptions();
    }

    _getDefaultName() {
        return GrabbableSystem.assetName;
    }

    getDescription() {
        return 'Enables assets to be picked up by the user';
    }

    _addSubscriptions() {
        if(global.isEditor || global.disableImmersion) return;
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_ATTACHED, (message)=>{
            let instance = ProjectHandler.getSessionInstance(message.id);
            if(global.deviceType == 'XR') {
                this._addGripInteractable(instance.getObject());
            } else {
                this._addPointerInteractable(instance.getObject());
            }
        });
    }

    _addGripInteractable(object) {
        let interactable = new GripInteractable(object,
            (hand) => {
                UserController.hands[hand].attach(object);
            }, (hand) => {
                UserController.hands[hand].remove(object);
            }
        );
        GripInteractableHandler.addInteractable(interactable);
    }

    _addPointerInteractable(object) {
        let interactable = new PointerInteractable(object,
            () => {
                let avatar = UserController.getAvatar();
                if(avatar.hasChild(object)) {
                    avatar.remove(object);
                } else {
                    avatar.attach(object);
                }
            }, false);
        interactable.setMaximumDistance(2);
        PointerInteractableHandler.addInteractable(interactable);
    }

    static assetId = '6329e98a-4311-4457-9198-48d75640f8cc';
    static assetName = 'Grabbable System';
}

SystemsHandler.registerSystem(GrabbableSystem);
