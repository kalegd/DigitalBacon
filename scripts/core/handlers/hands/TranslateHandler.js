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

class TranslateHandler {
    constructor() {
        this._id = uuidv4();
        this._heldAssets = {};
        PubSub.subscribe(this._id, PubSubTopics.TOOL_UPDATED, (handTool)=>{
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
                            object.position.fromArray(
                                heldAsset.preTransformState);
                            assetHelper._publish(['position']);
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

    attach(controller, hand, asset, positionDifference) {
        let controllerId = controller.getId();
        let otherHand = Hands.otherHand(hand);
        let otherHeldAsset = this._heldAssets[controllerId + ':' + otherHand];
        if(otherHeldAsset && otherHeldAsset.asset == asset) {
            this._swapToHand(controller, hand, otherHand, positionDifference);
        } else {
            let heldAsset = {
                asset: asset,
                controller: controller,
                hand: hand,
            }
            if(positionDifference) {
                heldAsset.positionDifference = positionDifference;
            } else {
                let position = asset.getWorldPosition();
                heldAsset.preTransformState = position.toArray();
                heldAsset.positionDifference = position.sub(heldAsset
                    .controller.getController(hand).getWorldPosition())
                    .toArray();
            }
            this._heldAssets[controllerId + ':' + hand] = heldAsset;
        }
        if(!positionDifference) {
            let heldAsset = this._heldAssets[controllerId + ':' + hand];
            PubSub.publish(this._id, PubSubTopics.INSTANCE_ATTACHED, {
                instance: asset,
                option: hand,
                type: 'translate',
                position: heldAsset.positionDifference,
            });
        }
    }

    detach(controller, hand, position) {
        let controllerId = controller.getId();
        let heldAsset = this._heldAssets[controllerId + ':' + hand];
        if(!heldAsset) return;
        delete this._heldAssets[controllerId + ':' + hand];
        if(!position) {
            position = this._update(heldAsset);
            let assetHelper = heldAsset.asset.editorHelper;
            let preState = heldAsset.preTransformState;
            let postState = position;
            assetHelper._updateVector3('position', postState, false, true,
                preState);
            assetHelper._publish(['position']);
            PubSub.publish(this._id, PubSubTopics.INSTANCE_DETACHED, {
                instance: heldAsset.asset,
                option: hand,
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
        //Eventually we'll need to set the world position of the asset once
        //we support parent child relationships
        let handPosition = heldAsset.controller.getController(heldAsset.hand)
            .getWorldPosition();
        let newPosition = [
            heldAsset.positionDifference[0] + handPosition.x,
            heldAsset.positionDifference[1] + handPosition.y,
            heldAsset.positionDifference[2] + handPosition.z
        ];
        heldAsset.asset.setPosition(newPosition);
        return newPosition;
    }

    _swapToHand(controller, newHand, oldHand, positionDifference) {
        let controllerId = controller.getId();
        let heldAsset = this._heldAssets[controllerId + ':' + oldHand];
        heldAsset.hand = newHand;
        this._heldAssets[controllerId + ':' + newHand] = heldAsset;
        delete this._heldAssets[controllerId + ':' + oldHand];
        if(positionDifference) {
            heldAsset.positionDifference = positionDifference;
        } else {
            let position = heldAsset.asset.getWorldPosition();
            heldAsset.positionDifference = position.sub(heldAsset
                .controller.getController(heldAsset.hand).getWorldPosition())
                .toArray();
        }
    }
}

let translateHandler = new TranslateHandler();
export default translateHandler;
