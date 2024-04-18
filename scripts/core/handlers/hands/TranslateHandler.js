/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntityTypes from '/scripts/core/enums/AssetEntityTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

class TranslateHandler {
    constructor() {
        this._id = uuidv4();
        this._heldAssets = {};
        PubSub.subscribe(this._id, PubSubTopics.TOOL_UPDATED, () => {
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
                            object.position.fromArray(
                                heldAsset.preTransformState);
                            assetHelper._publish(['position']);
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
                            object.position.fromArray(
                                heldAsset.preTransformState);
                            assetHelper._publish(['position']);
                        }
                        delete this._heldAssets[key];
                    }
                }
            });
        }
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, () => {
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

    attach(ownerId, asset, positionDifference) {
        let otherOwner = this._otherOwner(ownerId, asset);
        if(otherOwner) {
            this._swapToOwner(ownerId, otherOwner, positionDifference);
        } else {
            let heldAsset = {
                asset: asset,
                ownerId: ownerId,
            };
            if(positionDifference) {
                heldAsset.positionDifference = positionDifference;
            } else {
                let position = asset.getWorldPosition();
                heldAsset.preTransformState = asset.getPosition();
                heldAsset.positionDifference = position.sub(ProjectHandler
                    .getAsset(ownerId).getWorldPosition()).toArray();
            }
            this._heldAssets[ownerId] = heldAsset;
        }
        if(!positionDifference) {
            let heldAsset = this._heldAssets[ownerId];
            PubSub.publish(this._id, PubSubTopics.INSTANCE_ATTACHED, {
                instance: asset,
                ownerId: ownerId,
                type: 'translate',
                position: heldAsset.positionDifference,
            });
        }
    }

    detach(ownerId, position) {
        let heldAsset = this._heldAssets[ownerId];
        if(!heldAsset) return;
        delete this._heldAssets[ownerId];
        if(!position) {
            position = this._update(heldAsset);
            let assetHelper = heldAsset.asset.editorHelper;
            let preState = heldAsset.preTransformState;
            let postState = position;
            assetHelper._updateVector3('position', postState, false, false,
                preState, true);
            PubSub.publish(this._id, PubSubTopics.INSTANCE_DETACHED, {
                instance: heldAsset.asset,
                ownerId: ownerId,
                type: 'translate',
                position: position,
            });
        } else {
            heldAsset.asset.setPosition(position);
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
        let handPosition = ProjectHandler.getAsset(heldAsset.ownerId)
            .getWorldPosition();
        let newPosition = [
            heldAsset.positionDifference[0] + handPosition.x,
            heldAsset.positionDifference[1] + handPosition.y,
            heldAsset.positionDifference[2] + handPosition.z
        ];
        heldAsset.asset.setPosition(newPosition);
        if(heldAsset.asset.parent) {
            let parentObject = heldAsset.asset.parent.getObject();
            parentObject.worldToLocal(heldAsset.asset.getObject().position);
            newPosition = heldAsset.asset.getPosition();
        }
        return newPosition;
    }

    _swapToOwner(newOwner, oldOwner, positionDifference) {
        let heldAsset = this._heldAssets[oldOwner];
        heldAsset.ownerId = newOwner;
        this._heldAssets[newOwner] = heldAsset;
        delete this._heldAssets[oldOwner];
        if(positionDifference) {
            heldAsset.positionDifference = positionDifference;
        } else {
            let position = heldAsset.asset.getWorldPosition();
            heldAsset.positionDifference = position.sub(ProjectHandler
                .getAsset(newOwner).getWorldPosition()).toArray();
        }
    }
}

let translateHandler = new TranslateHandler();
export default translateHandler;
