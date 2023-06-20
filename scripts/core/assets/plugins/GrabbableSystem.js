/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

if(!window.DigitalBacon) {
    console.error('Missing global DigitalBacon reference');
    throw new Error('Missing global DigitalBacon reference');
}

const { Assets, PartyMessageHelper, ProjectHandler, UserController, getDeviceType, isEditor } = window.DigitalBacon;
const { System } = Assets;
const deviceType = getDeviceType();

const AVATAR = 'AVATAR';
const GRABBED_TOPIC = 'GrabbableSystem:Grabbed';
const RELEASED_TOPIC = 'GrabbableSystem:Released';
const COMPONENT_ASSET_ID = 'd9891de1-914d-4448-9e66-8867211b5dc8';

export default class GrabbableSystem extends System {
    constructor(params = {}) {
        params['assetId'] = GrabbableSystem.assetId;
        super(params);
        this._actions = {};
        this._notStealable = {};
        this._publishForNewPeers = {};
        this._onPartyJoined = {};
        this._addSubscriptions();
    }

    _getDefaultName() {
        return GrabbableSystem.assetName;
    }

    getDescription() {
        return 'Enables assets to be picked up by the user';
    }

    _addSubscriptions() {
        if(isEditor()) return;
        this._listenForComponentAttached(COMPONENT_ASSET_ID, (message) => {
            let id = message.id;
            if(this._actions[id] || this._notStealable[id]) return;
            let instance = ProjectHandler.getSessionAsset(id);
            let component = ProjectHandler.getSessionAsset(message.componentId);
            if(deviceType == 'XR') {
                this._addGripAction(instance, component.getStealable());
            } else {
                this._addPointerAction(instance,component.getStealable());
            }
        });
        this._listenForComponentDetached(COMPONENT_ASSET_ID, (message) => {
            let instance = ProjectHandler.getSessionAsset(message.id);
            let action = this._actions[message.id];
            if(!action) return;
            if(deviceType == 'XR') {
                instance.removeGripAction(action.id);
            } else {
                instance.removePointerAction(action.id);
            }
            delete this._actions[message.id];
        });
        PartyMessageHelper.registerBlockableHandler(GRABBED_TOPIC, (p, m) => {
            this._handlePeerGrabbed(p, m);
        });
        PartyMessageHelper.registerBlockableHandler(RELEASED_TOPIC, (p, m) => {
            this._handlePeerReleased(p, m);
        });
    }

    _onPeerReady() {
        for(let key in this._publishForNewPeers) {
            this._publishForNewPeers[key]();
        }
    }

    _onPartyStarted(isHost) {
        if(isHost) return;
        for(let key in this._onPartyJoined) {
            this._onPartyJoined[key]();
        }
    }

    _onPartyEnded() {
        for(let id in this._notStealable) {
            let instance = ProjectHandler.getSessionAsset(message.id);
            let action = this._notStealable[id];
            this._actions[id] = action;
            if(deviceType == 'XR') {
                instance.addGripAction(action);
            } else {
                instance.addPointerAction(action);
            }
            delete this._notStealable[id];
        }
    }

    _addGripAction(instance, stealable) {
        let object = instance.getObject();
        let action = instance.addGripAction((side) => {
                let hand = UserController.getHand(side);
                hand.attach(object);
                this._publish(GRABBED_TOPIC, instance, side, stealable);
                this._publishForNewPeers[instance.getId()] = () => {
                    if(hand.hasChild(object))
                        this._publish(GRABBED_TOPIC, instance, side, stealable);
                };
                this._onPartyJoined[instance.getId()] = () => {
                    hand.remove(object);
                };
            }, (side) => {
                let hand = UserController.getHand(side);
                if(hand.remove(object)) {
                    this._publish(RELEASED_TOPIC, instance, side, stealable);
                    delete this._onPartyJoined[instance.getId()];
                    delete this._publishForNewPeers[instance.getId()];
                }
            }
        );
        this._actions[instance.getId()] = action;
    }

    _addPointerAction(instance, stealable) {
        let object = instance.getObject();
        let action = instance.addPointerAction(() => {
            let avatar = UserController.getAvatar();
            if(avatar.hasChild(object)) {
                if(avatar.remove(object)) {
                    delete this._onPartyJoined[instance.getId()];
                    delete this._publishForNewPeers[instance.getId()];
                    this._publish(RELEASED_TOPIC, instance, AVATAR,
                        stealable);
                }
            } else {
                avatar.attach(object);
                this._publish(GRABBED_TOPIC, instance, AVATAR, stealable);
                this._publishForNewPeers[instance.getId()] = () => {
                    if(avatar.hasChild(object))
                        this._publish(GRABBED_TOPIC, instance, AVATAR,
                            stealable);
                };
                this._onPartyJoined[instance.getId()] = () =>{
                    avatar.remove(object);
                };
            }
        }, null, 2);
        this._actions[instance.getId()] = action;
    }

    _handlePeerGrabbed(peer, message) {
        let instance = ProjectHandler.getSessionAsset(message.id);
        if(message.attachTo == AVATAR) {
            let avatar = peer.controller.getAvatar();
            avatar.attach(instance.getObject());
        } else {
            let hand = peer.controller.getHand(message.attachTo);
            hand.attach(instance.getObject());
        }
        instance.setPosition(message.position);
        instance.setRotation(message.rotation);
        if(!message.stealable && this._actions[message.id]) {
            let action = this._actions[message.id];
            this._notStealable[message.id] = action;
            if(deviceType == 'XR') {
                instance.removeGripAction(action.id);
            } else {
                instance.removePointerAction(action.id);
            }
            delete this._actions[message.id];
        }
    }

    _handlePeerReleased(peer, message) {
        let instance = ProjectHandler.getSessionAsset(message.id);
        if(message.attachTo == AVATAR) {
            let avatar = peer.controller.getAvatar();
            avatar.remove(instance.getObject());
        } else {
            let hand = peer.controller.getHand(message.attachTo);
            hand.remove(instance.getObject());
        }
        instance.setPosition(message.position);
        instance.setRotation(message.rotation);
        if(!message.stealable && this._notStealable[message.id]) {
            let action = this._notStealable[message.id];
            this._actions[message.id] = action;
            if(deviceType == 'XR') {
                instance.addGripAction(action);
            } else {
                instance.addPointerAction(action);
            }
            delete this._notStealable[message.id];
        }
    }

    _publish(topic, object, attachTo, stealable) {
        let message = {
            topic: topic,
            attachTo: attachTo,
            id: object.getId(),
            position: object.getPosition(),
            rotation: object.getRotation(),
            stealable: stealable,
        };
        PartyMessageHelper.queuePublish(JSON.stringify(message));
    }

    static assetId = '6329e98a-4311-4457-9198-48d75640f8cc';
    static assetName = 'Grabbable System';
}

ProjectHandler.registerAsset(GrabbableSystem);
