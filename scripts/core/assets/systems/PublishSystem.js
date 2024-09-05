/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import System from '/scripts/core/assets/systems/System.js';
import UserController from '/scripts/core/assets/UserController.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';

const PUBLISH_TOPIC = 'PublishSystem:published';
const COMPONENT_ASSET_ID = '2a310a93-3f00-465a-862f-2bf8de118984';

export default class PublishSystem extends System {
    constructor(params = {}) {
        params['assetId'] = PublishSystem.assetId;
        super(params);
        this._actions = {};
        this._addSubscriptions();
    }

    _getDefaultName() {
        return PublishSystem.assetName;
    }

    get description() { return 'Publishes events when assets are selected'; }

    _addSubscriptions() {
        if(global.isEditor) return;
        this._listenForComponentAttached(COMPONENT_ASSET_ID, (message) => {
            let id = message.id + ':' + message.componentId;
            if(this._actions[id]) return;
            let instance = ProjectHandler.getSessionAsset(message.id);
            let component = ProjectHandler.getSessionAsset(message.componentId);
            let callback = () => {
                PubSub.publish(this._id, component.topic, {
                    asset: instance, userController: UserController,
                });
                this._publish(component.topic, instance.id);
            };
            if(component.pointerEvent != 'none')
                instance.pointerInteractable.addEventListener(
                    component.pointerEvent, callback);
            if(component.gripEvent != 'none')
                instance.gripInteractable.addEventListener(
                    component.gripEvent, callback);
            if(component.touchEvent != 'none')
                instance.touchInteractable.addEventListener(
                    component.touchEvent, callback);
            this._actions[id] = {
                callback: callback,
                pointerEvent: component.pointerEvent,
                gripEvent: component.gripEvent,
                touchEvent: component.touchEvent,
            };
        });
        this._listenForComponentDetached(COMPONENT_ASSET_ID, (message) => {
            let id = message.id + ':' + message.componentId;
            let action = this._actions[id];
            if(!action) return;
            let instance = ProjectHandler.getSessionAsset(message.id);
            if(action.pointerEvent != 'none')
                instance.pointerInteractable.removeEventListener(
                    action.pointerEvent, action.callback);
            if(action.gripEvent != 'none')
                instance.gripInteractable.removeEventListener(
                    action.gripEvent, action.callback);
            if(action.touchEvent != 'none')
                instance.touchInteractable.removeEventListener(
                    action.touchEvent, action.callback);
            delete this._actions[id];
        });
    }

    _onPeerMessage(peer, message) {
        let instance = ProjectHandler.getSessionAsset(message.id);
        PubSub.publish(this._id, message.pubSubTopic, {
            asset: instance, userController: peer.controller,
        });
    }

    _publish(pubSubTopic, objectId) {
        let message = {
            pubSubTopic: pubSubTopic,
            id: objectId,
        };
        this._publishPeerMessage(message);
    }

    static assetId = 'a94b683c-8176-486a-98fc-b44a8bebae57';
    static assetName = 'Publish System';
}

ProjectHandler.registerAsset(PublishSystem);
LibraryHandler.loadBuiltIn(PublishSystem);
