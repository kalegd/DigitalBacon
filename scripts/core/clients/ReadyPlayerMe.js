/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import UserController from '/scripts/core/assets/UserController.js';
import SessionHandler from '/scripts/core/handlers/SessionHandler.js';

class ReadyPlayerMe {
    init(container) {
        this._setupIframe(container);
        this._addEventListeners();
    }

    _setupIframe(container) {
        this._iframe = document.createElement('iframe');
        this._iframe.id = "digital-bacon-rpm-iframe";
        this._iframe.allow = 'camera *; microphone *; clipboard-write';
        this._iframe.src = 'https://digitalbacon.readyplayer.me/avatar?frameApi';
        this._iframe.hidden = true;
        this._closeButton = document.createElement('button');
        this._closeButton.innerHTML = "Close Ready Player Me";
        this._closeButton.id = 'ready-player-me-close-button';
        $(this._closeButton).addClass("hidden");
        container.append(this._iframe);
        container.append(this._closeButton);
    }

    _addEventListeners() {
        window.addEventListener('message', (event) => {
            this._handleMessage(event);
        });
        this._closeButton.addEventListener('click', () => { this._close(); });
    }

    _handleMessage(e) {
        const json = parse(e);
        if(!json || json.source !== 'readyplayerme') return;

        // Susbribe to all events sent from Ready Player Me once frame is ready
        if(json.eventName === 'v1.frame.ready') {
            this._iframe.contentWindow.postMessage(
                JSON.stringify({
                    target: 'readyplayerme',
                    type: 'subscribe',
                    eventName: 'v1.**'
                }),
            '*');
        }

        // Get avatar GLB URL
        if(json.eventName === 'v1.avatar.exported') {
            UserController.updateAvatar(json.data.url);
            this._close();
        }

        // Get user id
        if(json.eventName === 'v1.user.set') {
            //console.log(`User with id ${json.data.id} set: ${JSON.stringify(json)}`);
        }
    }

    _close() {
        $(this._closeButton).addClass("hidden");
        this._iframe.hidden = true;
    }

    selectAvatar() {
        $(this._closeButton).removeClass("hidden");
        this._iframe.hidden = false;
        if(global.deviceType == "XR") {
            SessionHandler.exitXRSession();
        }
    }
}

function parse(e) {
    try {
        return JSON.parse(e.data);
    } catch (error) {
        return null;
    }
}

let readyPlayerMe = new ReadyPlayerMe();
export default readyPlayerMe;
