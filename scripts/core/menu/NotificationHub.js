/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Colors, Styles } from '/scripts/core/helpers/constants.js';
import { Span, Style, Text } from '/node_modules/digitalbacon-ui/build/DigitalBacon-UI.min.js';

const BACKGROUND_OPACITY = 0.8;
const FADE_TIME = 1;
const SUSTAIN_TIME = 3;
const NOTIFICATION_STATES = {
    FADE_IN: 'FADE_IN',
    SUSTAIN: 'SUSTAIN',
    FADE_OUT: 'FADE_OUT',
};
const SPAN_STYLE = new Style({
    backgroundVisible: true,
    borderRadius: 0.01,
    height: 0.04,
    justifyContent: 'center',
    materialColor: Colors.defaultMenuBackground,
    opacity: BACKGROUND_OPACITY,
    width: 0.3,
});

class NotificationHub extends Span {
    constructor() {
        super(SPAN_STYLE);
        this._createNotification();
        this._addSubscriptions();
        this.position.setZ(0.01);
        this._notificationHeight = 0;
        this._notifications = [];
    }

    _createNotification() {
        this._textComponent = new Text('Placeholder', Styles.bodyText);
        this.add(this._textComponent);
        this.visible = false;
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
                this.visible = true;
                let height = Math.ceil(notification.text.length/20) * 0.02+0.02;
                this.height = height;
                this._textComponent.text = notification.text;
                this.position.setY(this._notificationHeight);
            }
            notification.timeInState = Math.min(
                notification.timeInState + timeDelta, notification.fadeTime);
            let fadePercent = notification.timeInState / notification.fadeTime;
            this.material.opacity = BACKGROUND_OPACITY * fadePercent;
            this._textComponent.troikaText.material.opacity = fadePercent;
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
            let fadePercent
                = 1 - (notification.timeInState / notification.fadeTime);
            this.material.opacity = BACKGROUND_OPACITY * fadePercent;
            this._textComponent.troikaText.material.opacity = fadePercent;
            if(fadePercent == 0) {
                this._notifications.shift();
                this.position.setY(0);
                this.visible = false;
            }
        }
    }
}

export default NotificationHub;
