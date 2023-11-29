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

class ScaleHandler {
    constructor() {
        this._id = uuidv4();
        this._heldAssets = {};
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
                            object.scale.fromArray(heldAsset.preTransformState);
                            assetHelper._publish(['scale']);
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
                            object.scale.fromArray(heldAsset.preTransformState);
                            assetHelper._publish(['scale']);
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

    attach(owner, asset, scaleIdentity) {
        let otherOwner = this._otherOwner(owner, asset);
        if(otherOwner) {
            this._swapToOwner(owner, otherOwner, scaleIdentity);
        } else {
            let heldAsset = {
                asset: asset,
                ownerId: owner,
            }
            if(scaleIdentity) {
                heldAsset.scaleIdentity = scaleIdentity;
            } else {
                let distance = ProjectHandler.getAsset(owner).getWorldPosition()
                    .distanceTo(asset.getWorldPosition());
                let scale = asset.getWorldScale();
                heldAsset.preTransformState = asset.getScale();
                heldAsset.scaleIdentity =scale.divideScalar(distance).toArray();
            }
            this._heldAssets[owner] = heldAsset;
        }
        if(!scaleIdentity) {
            let heldAsset = this._heldAssets[owner];
            PubSub.publish(this._id, PubSubTopics.INSTANCE_ATTACHED, {
                instance: asset,
                option: owner,
                type: 'scale',
                scale: heldAsset.scaleIdentity,
            });
        }
    }

    detach(owner, scale) {
        let heldAsset = this._heldAssets[owner];
        if(!heldAsset) return;
        delete this._heldAssets[owner];
        if(!scale) {
            scale = this._update(heldAsset);
            let assetHelper = heldAsset.asset.editorHelper;
            let preState = heldAsset.preTransformState;
            let postState = scale;
            assetHelper._updateVector3('scale', postState, false, false,
                preState);
            PubSub.publish(this._id, PubSubTopics.INSTANCE_DETACHED, {
                instance: heldAsset.asset,
                option: owner,
                type: 'scale',
                scale: scale,
            });
        } else {
            heldAsset.asset.setScale(scale);
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
        //Eventually we'll need to set the world scale of the asset once
        //we support parent child relationships
        let distance = heldAsset.asset.getWorldPosition().distanceTo(
            ProjectHandler.getAsset(heldAsset.ownerId).getWorldPosition());
        let newScale = [
            heldAsset.scaleIdentity[0] * distance,
            heldAsset.scaleIdentity[1] * distance,
            heldAsset.scaleIdentity[2] * distance
        ];
        heldAsset.asset.setScale(newScale);
        if(heldAsset.asset.parent) {
            let parentScale = heldAsset.asset.parent.getWorldScale();
            heldAsset.asset.getObject().scale.divide(parentScale);
            newScale = heldAsset.asset.getScale();
        }
        return newScale;
    }

    _swapToOwner(newOwner, oldOwner, scaleIdentity) {
        let heldAsset = this._heldAssets[oldOwner];
        heldAsset.ownerId = newOwner;
        this._heldAssets[newOwner] = heldAsset;
        delete this._heldAssets[oldOwner];
        if(scaleIdentity) {
            heldAsset.scaleIdentity = scaleIdentity;
        } else {
            let distance = ProjectHandler.getAsset(newOwner).getWorldPosition()
                .distanceTo(heldAsset.asset.getWorldPosition());
            let scale = heldAsset.asset.getWorldScale();
            heldAsset.scaleIdentity = scale.divideScalar(distance).toArray();
        }
    }
}

let scaleHandler = new ScaleHandler();
export default scaleHandler;
