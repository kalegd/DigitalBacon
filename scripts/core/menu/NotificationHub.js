/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Entity from '/scripts/core/assets/Entity.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Colors, Fonts, FontSizes } from '/scripts/core/helpers/constants.js';
import ThreeMeshUIHelper from '/scripts/core/helpers/ThreeMeshUIHelper.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import ThreeMeshUI from 'three-mesh-ui';
import { Object3D } from 'three';

const BACKGROUND_OPACITY = 0.8;
const FONT_OPACITY = 1;
const FADE_TIME = 1;
const SUSTAIN_TIME = 3;
const NOTIFICATION_STATES = {
    FADE_IN: 'FADE_IN',
    SUSTAIN: 'SUSTAIN',
    FADE_OUT: 'FADE_OUT',
}

class NotificationHub extends Entity {
    constructor() {
        super();
        this._createNotification();
        this._addSubscriptions();
        this._object.position.setZ(0.01);
        this._notificationHeight = 0;
        this._notifications = [];
    }

    _createNotification() {
        this._container = new ThreeMeshUI.Block({
            height: 0.04,
            width: 0.3,
            interline: 0.01,
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
            fontSize: FontSizes.body,
            fontOpacity: FONT_OPACITY,
            offset: 0,
        });
        this._container.add(this._textComponent);
        this._object.add(this._container);
        this._container.visible = false;
    }

    setNotificationHeight(y) {
        this._notificationHeight = y;
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
        PubSub.subscribe(this._id, PubSubTopics.MENU_NOTIFICATION,
            (notification) => { this._handleNotification(notification); });
    }

    update(timeDelta) {
        if(this._notifications.length == 0) return;
        let notification = this._notifications[0];
        if(notification.state == NOTIFICATION_STATES.FADE_IN) {
            if(notification.timeInState == 0) {
                this._container.visible = true;
                let height = Math.ceil(notification.text.length/20) * 0.02+0.02;
                this._container.set({ height: height });
                this._textComponent.set({ content: notification.text });
                this._object.position.setY(this._notificationHeight);
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
                this._object.position.setY(0);
                this._container.visible = false;
            }
        }
    }
}

export default NotificationHub;
