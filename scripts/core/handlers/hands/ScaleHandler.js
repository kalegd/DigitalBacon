/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Hands from '/scripts/core/enums/Hands.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

class ScaleHandler {
    constructor() {
        this._id = uuidv4();
        this._heldAssets = {};
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
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_DELETED, (e) => {
            for(let key in this._heldAssets) {
                let heldAsset = this._heldAssets[key];
                if(heldAsset.asset == e.instance) {
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
        PubSub.subscribe(this._id, PubSubTopics.PROJECT_LOADING, (done) => {
            for(let key in this._heldAssets) {
                delete this._heldAssets[key];
            }
        });
    }

    attach(controller, hand, asset, scaleIdentity) {
        let controllerId = controller.getId();
        let otherHand = Hands.otherHand(hand);
        let otherHeldAsset = this._heldAssets[controllerId + ':' + otherHand];
        if(otherHeldAsset && otherHeldAsset.asset == asset) {
            this._swapToHand(controller, hand, otherHand, scaleIdentity);
        } else {
            let heldAsset = {
                asset: asset,
                controller: controller,
                hand: hand,
            }
            if(scaleIdentity) {
                heldAsset.scaleIdentity = scaleIdentity;
            } else {
                let distance = controller.hands[hand].getWorldPosition()
                    .distanceTo(asset.getWorldPosition());
                let scale = asset.getWorldScale();
                heldAsset.preTransformState = scale.toArray();
                heldAsset.scaleIdentity =scale.divideScalar(distance).toArray();
            }
            this._heldAssets[controllerId + ':' + hand] = heldAsset;
        }
        if(!scaleIdentity) {
            let heldAsset = this._heldAssets[controllerId + ':' + hand];
            PubSub.publish(this._id, PubSubTopics.INSTANCE_ATTACHED, {
                instance: asset,
                option: hand,
                type: 'scale',
                scale: heldAsset.scaleIdentity,
            });
        }
    }

    detach(controller, hand, scale) {
        let controllerId = controller.getId();
        let heldAsset = this._heldAssets[controllerId + ':' + hand];
        if(!heldAsset) return;
        delete this._heldAssets[controllerId + ':' + hand];
        if(!scale) {
            scale = this._update(heldAsset);
            let assetHelper = heldAsset.asset.editorHelper;
            let preState = heldAsset.preTransformState;
            let postState = scale;
            assetHelper._updateVector3('scale', postState, false, true,
                preState);
            assetHelper._publish(['scale']);
            PubSub.publish(this._id, PubSubTopics.INSTANCE_DETACHED, {
                instance: heldAsset.asset,
                option: hand,
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
        let distance = heldAsset.asset.getWorldPosition().distanceTo(heldAsset
            .controller.hands[heldAsset.hand].getWorldPosition());
        let newScale = [
            heldAsset.scaleIdentity[0] * distance,
            heldAsset.scaleIdentity[1] * distance,
            heldAsset.scaleIdentity[2] * distance
        ];
        heldAsset.asset.setScale(newScale);
        return newScale;
    }

    _swapToHand(controller, newHand, oldHand, scaleIdentity) {
        let controllerId = controller.getId();
        let heldAsset = this._heldAssets[controllerId + ':' + oldHand];
        heldAsset.hand = newHand;
        this._heldAssets[controllerId + ':' + newHand] = heldAsset;
        delete this._heldAssets[controllerId + ':' + oldHand];
        if(scaleIdentity) {
            heldAsset.scaleIdentity = scaleIdentity;
        } else {
            let distance = controller.hands[newHand].getWorldPosition()
                .distanceTo(heldAsset.asset.getWorldPosition());
            let scale = heldAsset.asset.getWorldScale();
            heldAsset.scaleIdentity = scale.divideScalar(distance).toArray();
        }
    }
}

let scaleHandler = new ScaleHandler();
export default scaleHandler;
