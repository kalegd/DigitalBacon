/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

if(!window.DigitalBacon) {
    console.error('Missing global DigitalBacon reference');
    throw new Error('Missing global DigitalBacon reference');
}

const { Assets, PartyMessageHelper, ProjectHandler, PubSub, UserController, getDeviceType, isEditor } = window.DigitalBacon;
const { System } = Assets;

const PUBLISH_TOPIC = 'PublishSystem:published';
const COMPONENT_ASSET_ID = '2a310a93-3f00-465a-862f-2bf8de118984';

export default class PublishSystem extends System {
    constructor(params = {}) {
        params['assetId'] = PublishSystem.assetId;
        super(params);
        this._actions = {};
        this._notStealable = {};
        this._onPartyJoined = {};
        this._addSubscriptions();
    }

    _getDefaultName() {
        return PublishSystem.assetName;
    }

    getDescription() {
        return 'Publishes events when assets are selected';
    }

    _addSubscriptions() {
        if(isEditor()) return;
        this._listenForComponentAttached(COMPONENT_ASSET_ID, (message) => {
            let id = message.id + ':' + message.componentId;
            if(this._actions[id]) return;
            let instance = ProjectHandler.getSessionAsset(message.id);
            let component = ProjectHandler.getSessionAsset(message.componentId);
            this._addPointerAction(id, instance, component.getTopic());
        });
        this._listenForComponentDetached(COMPONENT_ASSET_ID, (message) => {
            let id = message.id + ':' + message.componentId;
            let action = this._actions[id];
            if(!action) return;
            let instance = ProjectHandler.getSessionAsset(message.id);
            instance.removePointerAction(action.id);
            delete this._actions[id];
        });
        PartyMessageHelper.registerBlockableHandler(PUBLISH_TOPIC, (p, m) => {
            this._handlePeerPublished(p, m);
        });
    }

    _addPointerAction(id, instance, topic) {
        let action = instance.addPointerAction(() => {
            PubSub.publish(this._id, topic, {
                asset: instance, userController: UserController,
            });
            this._publish(topic, instance.getId());
        });
        this._actions[id] = action;
    }

    _handlePeerPublished(peer, message) {
        let instance = ProjectHandler.getSessionAsset(message.id);
        PubSub.publish(this._id, message.pubSubTopic, {
            asset: instance, userController: peer.controller,
        });
    }

    _publish(pubSubTopic, objectId) {
        let message = {
            topic: PUBLISH_TOPIC,
            pubSubTopic: pubSubTopic,
            id: objectId,
        };
        PartyMessageHelper.queuePublish(JSON.stringify(message));
    }

    static assetId = 'a94b683c-8176-486a-98fc-b44a8bebae57';
    static assetName = 'Publish System';
}

ProjectHandler.registerAsset(PublishSystem);
