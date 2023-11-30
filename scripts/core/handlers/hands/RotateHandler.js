/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntityTypes from '/scripts/core/enums/AssetEntityTypes.js';
import Handedness from '/scripts/core/enums/Handedness.js';
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
        PubSub.subscribe(this._id, PubSubTopics.TOOL_UPDATED, (handTool)=>{
            for(let key in this._heldAssets) {
                let heldAsset = this._heldAssets[key];
                if(heldAsset.preTransformState)
                    this.detach(heldAsset.ownerId);
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.MENU_FIELD_FOCUSED, (message)=>{
            if(message['targetOnlyMenu']) return;
            for(let key in this._heldAssets) {
                let heldAsset = this._heldAssets[key];
                if(heldAsset.preTransformState)
                    this.detach(heldAsset.ownerId);
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
            PubSub.subscribe(this._id, assetType + '_UPDATED', (message) => {
                for(let key in this._heldAssets) {
                    let heldAsset = this._heldAssets[key];
                    if(heldAsset.asset == message.asset) {
                        let assetHelper = heldAsset.asset.editorHelper;
                        let object = heldAsset.asset.getObject();
                        if(message.fields.includes('visualEdit')
                                && heldAsset.preTransformState)
                        {
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

    _otherOwner(ownerId, asset) {
        for(let otherId in this._heldAssets) {
            if(this._heldAssets[otherId].asset == asset && otherId != ownerId)
                return otherId;
        }
    }

    attach(owner, asset, rotationDifference) {
        let otherOwner = this._otherOwner(owner, asset);
        if(otherOwner) {
            this._swapToOwner(owner, otherOwner, rotationDifference);
        } else {
            let heldAsset = {
                asset: asset,
                ownerId: owner,
            };
            if(rotationDifference) {
                heldAsset.rotationDifference = rotationDifference;
            } else {
                let rotation = asset.getWorldQuaternion();
                heldAsset.preTransformState = asset.getObject().quaternion
                    .toArray();
                heldAsset.rotationDifference = ProjectHandler.getAsset(owner)
                    .getWorldQuaternion().conjugate().multiply(rotation)
                    .toArray();
            }
            this._heldAssets[owner] = heldAsset;
        }
        if(!rotationDifference) {
            let heldAsset = this._heldAssets[owner];
            PubSub.publish(this._id, PubSubTopics.INSTANCE_ATTACHED, {
                instance: asset,
                option: owner,
                type: 'rotate',
                rotation: heldAsset.rotationDifference,
            });
        }
    }

    detach(owner, rotation) {
        let heldAsset = this._heldAssets[owner];
        if(!heldAsset) return;
        delete this._heldAssets[owner];
        if(!rotation) {
            rotation = this._update(heldAsset);
            let assetHelper = heldAsset.asset.editorHelper;
            this._quaternion.fromArray(heldAsset.preTransformState);
            this._euler1.setFromQuaternion(this._quaternion);
            this._quaternion.fromArray(rotation);
            this._euler2.setFromQuaternion(this._quaternion);
            let preState = this._euler1.toArray();
            let postState = this._euler2.toArray();
            assetHelper._updateEuler('rotation', postState, false, false,
                preState);
            PubSub.publish(this._id, PubSubTopics.INSTANCE_DETACHED, {
                instance: heldAsset.asset,
                option: owner,
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
        let handRotation = ProjectHandler.getAsset(heldAsset.ownerId)
            .getWorldQuaternion();
        this._quaternion.fromArray(heldAsset.rotationDifference);
        let newRotation = handRotation.multiply(this._quaternion);
        if(heldAsset.asset.parent) {
            let parentObject = heldAsset.asset.parent.getObject();
            parentObject.getWorldQuaternion(this._quaternion).conjugate();
            this._quaternion.multiply(newRotation);
        }
        heldAsset.asset.setRotationFromQuaternion(this._quaternion.toArray());
        return this._quaternion.toArray();
    }

    _swapToOwner(newOwner, oldOwner, rotationDifference) {
        let heldAsset = this._heldAssets[oldOwner];
        heldAsset.ownerId = newOwner;
        this._heldAssets[newOwner] = heldAsset;
        delete this._heldAssets[oldOwner];
        if(rotationDifference) {
            heldAsset.rotationDifference = rotationDifference;
        } else {
            let rotation = heldAsset.asset.getWorldQuaternion();
            heldAsset.rotationDifference = ProjectHandler.getAsset(newOwner)
                .getWorldQuaternion().conjugate().multiply(rotation).toArray();
        }
    }
}

let rotateHandler = new RotateHandler();
export default rotateHandler;
