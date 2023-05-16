/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntityTypes from '/scripts/core/enums/AssetEntityTypes.js';
import Hands from '/scripts/core/enums/Hands.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import { Euler, Quaternion } from 'three';

class RotateHandler {
    constructor() {
        this._id = uuidv4();
        this._heldAssets = {};
        this._quaternion = new Quaternion();
        this._euler1 = new Euler();
        this._euler2 = new Euler();
        PubSub.subscribe(this._id, PubSubTopics.HAND_TOOLS_SWITCH, (handTool)=>{
            for(let key in this._heldAssets) {
                let heldAsset = this._heldAssets[key];
                if(heldAsset.preTransformState)
                    this.detach(heldAsset.controller, heldAsset.hand);
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.MENU_FIELD_FOCUSED, (message)=>{
            if(message['targetOnlyMenu']) return;
            for(let key in this._heldAssets) {
                let heldAsset = this._heldAssets[key];
                if(heldAsset.preTransformState)
                    this.detach(heldAsset.controller, heldAsset.hand);
            }
        });
        for(let assetType in AssetEntityTypes) {
            PubSub.subscribe(this._id, assetType + '_DELETED', (message) => {
                for(let key in this._heldAssets) {
                    let heldAsset = this._heldAssets[key];
                    if(heldAsset.asset == message.asset) {
                        let assetHelper = heldAsset.asset.editorHelper;
                        let object = heldAsset.asset.getObject();
                        if(heldAsset.preTransformState) {
                            object.quaternion.fromArray(
                                heldAsset.preTransformState);
                            object.rotation.setFromQuaternion(
                                object.quaternion);
                            assetHelper._publish(['rotation']);
                        }
                        delete this._heldAssets[key];
                    }
                }
            });
        }
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (done) => {
            for(let key in this._heldAssets) {
                delete this._heldAssets[key];
            }
        });
    }

    attach(controller, hand, asset, rotationDifference) {
        let controllerId = controller.getId();
        let otherHand = Hands.otherHand(hand);
        let otherHeldAsset = this._heldAssets[controllerId + ':' + otherHand];
        if(otherHeldAsset && otherHeldAsset.asset == asset) {
            this._swapToHand(controller, hand, otherHand, rotationDifference);
        } else {
            let heldAsset = {
                asset: asset,
                controller: controller,
                hand: hand,
            }
            if(rotationDifference) {
                heldAsset.rotationDifference = rotationDifference;
            } else {
                let rotation = asset.getWorldQuaternion();
                heldAsset.preTransformState = rotation.toArray();
                heldAsset.rotationDifference = controller.hands[hand]
                    .getWorldQuaternion().conjugate().multiply(rotation)
                    .toArray();
            }
            this._heldAssets[controllerId + ':' + hand] = heldAsset;
        }
        if(!rotationDifference) {
            let heldAsset = this._heldAssets[controllerId + ':' + hand];
            PubSub.publish(this._id, PubSubTopics.INSTANCE_ATTACHED, {
                instance: asset,
                option: hand,
                type: 'rotate',
                rotation: heldAsset.rotationDifference,
            });
        }
    }

    detach(controller, hand, rotation) {
        let controllerId = controller.getId();
        let heldAsset = this._heldAssets[controllerId + ':' + hand];
        if(!heldAsset) return;
        delete this._heldAssets[controllerId + ':' + hand];
        if(!rotation) {
            rotation = this._update(heldAsset);
            let assetHelper = heldAsset.asset.editorHelper;
            this._quaternion.fromArray(heldAsset.preTransformState);
            this._euler1.setFromQuaternion(this._quaternion);
            this._quaternion.fromArray(rotation);
            this._euler2.setFromQuaternion(this._quaternion);
            let preState = this._euler1.toArray();
            let postState = this._euler2.toArray();
            assetHelper._updateEuler('rotation', postState, false, true,
                preState);
            assetHelper._publish(['rotation']);
            PubSub.publish(this._id, PubSubTopics.INSTANCE_DETACHED, {
                instance: heldAsset.asset,
                option: hand,
                type: 'rotate',
                rotation: rotation,
            });
        } else {
            heldAsset.asset.setRotationFromQuaternion(rotation);
        }
    }

    update() {
        for(let key in this._heldAssets) {
            let heldAsset = this._heldAssets[key];
            this._update(heldAsset);
        }
    }

    _update(heldAsset) {
        if(!heldAsset) return;
        //Eventually we'll need to set the world rotation of the asset once
        //we support parent child relationships
        let handRotation = heldAsset.controller.hands[heldAsset.hand]
            .getWorldQuaternion();
        this._quaternion.fromArray(heldAsset.rotationDifference);
        let newRotation = handRotation.multiply(this._quaternion).toArray();
        heldAsset.asset.setRotationFromQuaternion(newRotation);
        return newRotation;
    }

    _swapToHand(controller, newHand, oldHand, rotationDifference) {
        let controllerId = controller.getId();
        let heldAsset = this._heldAssets[controllerId + ':' + oldHand];
        heldAsset.hand = newHand;
        this._heldAssets[controllerId + ':' + newHand] = heldAsset;
        delete this._heldAssets[controllerId + ':' + oldHand];
        if(rotationDifference) {
            heldAsset.rotationDifference = rotationDifference;
        } else {
            let rotation = heldAsset.asset.getWorldQuaternion();
            heldAsset.rotationDifference = heldAsset.controller
                .hands[heldAsset.hand].getWorldQuaternion().conjugate()
                .multiply(rotation).toArray();
        }
    }
}

let rotateHandler = new RotateHandler();
export default rotateHandler;
