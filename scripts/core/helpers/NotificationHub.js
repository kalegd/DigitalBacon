/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Colors, Fonts } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUI from 'three-mesh-ui';
import { Object3D } from 'three';

const BACKGROUND_OPACITY = 0.5;
const FONT_OPACITY = 1;
const FADE_TIME = 1;
const SUSTAIN_TIME = 3;
const NOTIFICATION_STATES = {
    FADE_IN: 'FADE_IN',
    SUSTAIN: 'SUSTAIN',
    FADE_OUT: 'FADE_OUT',
};

class NotificationHub {
    constructor() {
        this._pivotPoint = new Object3D();
        this._id = uuidv4();
        this._createNotification();
        this._addSubscriptions();
        this._pivotPoint.position.set(0, 0, -0.5);
        this._notifications = [];
    }

    _createNotification() {
        this._container = new ThreeMeshUI.Block({
            height: 0.04,
            width: 0.3,
            backgroundColor: Colors.defaultMenuBackground,
            backgroundOpacity: BACKGROUND_OPACITY,
            justifyContent: 'center',
        });
        this._container.set({
            fontFamily: Fonts.defaultFamily,
            fontTexture: Fonts.defaultTexture,
        });
        this._textComponent = new ThreeMeshUI.Text({
            content: 'Notificaton Placeholder',
            fontColor: Colors.white,
            fontSize: 0.025,
            fontOpacity: FONT_OPACITY,
            offset: 0,
        });
        this._container.add(this._textComponent);
        this._pivotPoint.add(this._container);
    }

    _handleNotification(notification) {
        this._notifications.push({
            state: NOTIFICATION_STATES.FADE_IN,
            text: notification['text'],
            sustainTime: notification['sustainTime'] || SUSTAIN_TIME,
            fadeTime: notification['fadeTime'] || FADE_TIME,
            timeInState: 0,
        });
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.NOTIFICATION,
            (notification) => { this._handleNotification(notification); });
    }

    update(timeDelta) {
        if(this._notifications.length == 0) return;
        let notification = this._notifications[0];
        if(notification.state == NOTIFICATION_STATES.FADE_IN) {
            if(notification.timeInState == 0) {
                this._camera.add(this._pivotPoint);
                this._textComponent.set({ content: notification.text });
            }
            notification.timeInState = Math.min(
                notification.timeInState + timeDelta, notification.fadeTime);
            let fadePercent = notification.timeInState / notification.fadeTime;
            this._container.set({
                backgroundOpacity: BACKGROUND_OPACITY * fadePercent
            });
            this._textComponent.set({ fontOpacity: FONT_OPACITY * fadePercent});
            if(fadePercent == 1) {
                notification.state = NOTIFICATION_STATES.SUSTAIN;
                notification.timeInState = 0;
            }
        } else if(notification.state == NOTIFICATION_STATES.SUSTAIN) {
            notification.timeInState += timeDelta;
            if(notification.timeInState >= notification.sustainTime) {
                notification.state = NOTIFICATION_STATES.FADE_OUT;
                notification.timeInState = 0;
            }
        } else if(notification.state == NOTIFICATION_STATES.FADE_OUT) {
            notification.timeInState = Math.min(
                notification.timeInState + timeDelta, notification.fadeTime);
            let fadePercent = 1 - (notification.timeInState / notification.fadeTime);
            this._container.set({
                backgroundOpacity: BACKGROUND_OPACITY * fadePercent
            });
            this._textComponent.set({ fontOpacity: FONT_OPACITY * fadePercent});
            if(fadePercent == 0) {
                this._notifications.shift();
                this._camera.remove(this._pivotPoint);
            }
        }
    }

    setCamera(camera) {
        if(camera) {
            this._camera = camera;
        }
    }
}

export default NotificationHub;
