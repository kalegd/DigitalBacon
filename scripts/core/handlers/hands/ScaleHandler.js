/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import AssetEntityTypes from '/scripts/core/enums/AssetEntityTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PartyHandler from '/scripts/core/handlers/PartyHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import { InteractionToolHandler } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

class ScaleHandler {
    constructor() {
        this._id = uuidv4();
        this._heldAssets = {};
        InteractionToolHandler.addUpdateListener(() => {
            for(let key in this._heldAssets) {
                let heldAsset = this._heldAssets[key];
                if(heldAsset.preTransformState)
                    this.detach(heldAsset.ownerId);
            }
        });
        PubSub.subscribe(this._id, PubSubTopics.PARTY_STARTED, () => {
            if(!PartyHandler.isHost()) this._heldAssets = {};
        });
        PubSub.subscribe(this._id, PubSubTopics.PEER_CONNECTED, (message) => {
            for(let key in this._heldAssets) {
                let heldAsset = this._heldAssets[key];
                let asset = heldAsset.asset;
                if(heldAsset.preTransformState)
                    PartyHandler.publishInternalMessage('instance_attached', {
                        id: asset.id,
                        assetId: asset.assetId,
                        ownerId: key,
                        type: 'scale',
                        scale: heldAsset.scaleIdentity,
                        isXR: true,
                    }, false, message.peer);
            }
        });
        for(let assetType in AssetEntityTypes) {
            PubSub.subscribe(this._id, assetType + '_DELETED', (message) => {
                for(let key in this._heldAssets) {
                    let heldAsset = this._heldAssets[key];
                    if(heldAsset.asset == message.asset) {
                        let assetHelper = heldAsset.asset.editorHelper;
                        let object = heldAsset.asset.object;
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
                        let object = heldAsset.asset.object;
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

    attach(ownerId, asset, scaleIdentity) {
        let otherOwner = this._otherOwner(ownerId, asset);
        if(otherOwner) {
            this._swapToOwner(ownerId, otherOwner, scaleIdentity);
        } else {
            let heldAsset = {
                asset: asset,
                ownerId: ownerId,
            };
            if(scaleIdentity) {
                heldAsset.scaleIdentity = scaleIdentity;
                this._subscribeToDeletionOf(ownerId);
            } else {
                let distance = ProjectHandler.getAsset(ownerId)
                    .getWorldPosition().distanceTo(asset.getWorldPosition());
                let scale = asset.getWorldScale();
                heldAsset.preTransformState = asset.scale;
                heldAsset.scaleIdentity =scale.divideScalar(distance).toArray();
            }
            this._heldAssets[ownerId] = heldAsset;
        }
        if(!scaleIdentity) {
            let heldAsset = this._heldAssets[ownerId];
            PubSub.publish(this._id, PubSubTopics.INSTANCE_ATTACHED, {
                instance: asset,
                ownerId: ownerId,
                type: 'scale',
                scale: heldAsset.scaleIdentity,
            });
        }
    }

    detach(ownerId, scale) {
        let heldAsset = this._heldAssets[ownerId];
        if(!heldAsset) return;
        delete this._heldAssets[ownerId];
        if(!scale) {
            scale = this._update(heldAsset);
            let assetHelper = heldAsset.asset.editorHelper;
            let preState = heldAsset.preTransformState;
            let postState = scale;
            assetHelper._updateParameter('scale', postState, false, false,
                preState, true);
            PubSub.publish(this._id, PubSubTopics.INSTANCE_DETACHED, {
                instance: heldAsset.asset,
                ownerId: ownerId,
                type: 'scale',
                scale: scale,
            });
        } else {
            heldAsset.asset.scale = scale;
            this._unsubscribeFromDeletionOf(ownerId);
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
        let ownerAsset = ProjectHandler.getAsset(heldAsset.ownerId);
        if(!ownerAsset) return;
        let distance = heldAsset.asset.getWorldPosition().distanceTo(
            ownerAsset.getWorldPosition());
        let newScale = [
            heldAsset.scaleIdentity[0] * distance,
            heldAsset.scaleIdentity[1] * distance,
            heldAsset.scaleIdentity[2] * distance
        ];
        heldAsset.asset.scale = newScale;
        if(heldAsset.asset.parent) {
            let parentScale = heldAsset.asset.parent.getWorldScale();
            heldAsset.asset.object.scale.divide(parentScale);
            newScale = heldAsset.asset.scale;
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
            this._unsubscribeFromDeletionOf(oldOwner);
            this._subscribeToDeletionOf(newOwner);
        } else {
            let distance = ProjectHandler.getAsset(newOwner).getWorldPosition()
                .distanceTo(heldAsset.asset.getWorldPosition());
            let scale = heldAsset.asset.getWorldScale();
            heldAsset.scaleIdentity = scale.divideScalar(distance).toArray();
        }
    }

    _subscribeToDeletionOf(ownerId) {
        let ownerAsset = ProjectHandler.getSessionAsset(ownerId);
        let topic = 'INTERNAL_DELETED:' + ownerAsset.assetId +':'+ownerAsset.id;
        PubSub.subscribe(this._id, topic, (message) => {
            for(let key in this._heldAssets) {
                if(message.asset.id == key) delete this._heldAssets[key];
            }
        });
    }

    _unsubscribeFromDeletionOf(ownerId) {
        let ownerAsset = ProjectHandler.getSessionAsset(ownerId);
        let topic = 'INTERNAL_DELETED:' + ownerAsset.assetId +':'+ownerAsset.id;
        PubSub.unsubscribe(this._id, topic);
    }
}

let scaleHandler = new ScaleHandler();
export default scaleHandler;
