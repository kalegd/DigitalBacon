/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';

const AUTH_KEY = 'DigitalBacon:Sketchfab:authToken'
const AUTH_EXPIRY_KEY = 'DigitalBacon:Sketchfab:authExpiry'
const AUTH_URL = 'https://sketchfab.com/oauth2/authorize/?state=123456789&response_type=token&client_id=WXFMTux03Lde8DFpnZWlzwR4afwtSrpumZToMy62';
const FOUR_WEEKS = 1000 * 60 * 60 * 24 * 7 * 4;
const VALID_CALLBACK_ORIGIN = 'https://digitalbacon.io';
const SEARCH_URL = 'https://api.sketchfab.com/v3/search?type=models&downloadable=true&archives_flavours=false&q=';
const DOWNLOAD_URL = 'https://api.sketchfab.com/v3/models/{uid}/download';

class Sketchfab {
    constructor() {
        this._authToken = localStorage.getItem(AUTH_KEY);
        this._authExpiry = localStorage.getItem(AUTH_EXPIRY_KEY);
    }

    isSignedIn() {
        return this._authToken && this._authExpiry
            && this._authExpiry > Date.now();
    }

    signIn(staySignedIn, callback) {
        if(this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }

        let tab = window.open(AUTH_URL, '_blank');
        tab.focus();
        window._tab = tab;
        this._intervalId = setInterval(() => {
            tab.postMessage('fetch_auth_token', VALID_CALLBACK_ORIGIN);
        }, 1000);

        window.addEventListener('message', (event) => {
            if(event.origin != VALID_CALLBACK_ORIGIN) return;
            if(event.data.topic != 'sketchfab_auth_token') return;
            clearInterval(this._intervalId);
            tab.postMessage('close_tab', VALID_CALLBACK_ORIGIN);
            this._authToken = event.data.authToken;
            this._authExpiry = event.data.authExpiry;
            if(staySignedIn) {
                localStorage.setItem(AUTH_KEY, this._authToken);
                localStorage.setItem(AUTH_EXPIRY_KEY, this._authExpiry);
            }
            if(callback) callback();
        });
    }

    search(query, successCallback, errorCallback) {
        let url = SEARCH_URL + encodeURIComponent(query);
        this.fetch(url, successCallback, errorCallback);
    }

    fetch(url, successCallback, errorCallback) {
        fetch(url, {
            headers: {
                Authorization: 'Bearer ' + this._authToken,
            }
        }).then((response) => {
            return response.json();
        }).then((body) => {
            if(successCallback) successCallback(body);
        }).catch((error) => {
            console.error(error);
            if(errorCallback) errorCallback();
        });
    }

    _download(url, sketchfabAsset, successCallback, errorCallback) {
        fetch(url).then(response => response.blob()).then((blob) => {
            LibraryHandler.addNewAsset(blob, sketchfabAsset.name,
                AssetTypes.MODEL, (assetId) => {
                    //TODO: Add sketchfab details to library
                    console.log("TODO: Add Sketchfab details to library");
                    if(successCallback) successCallback(assetId);
                });
        }).catch((error) => {
            console.error(error);
            if(errorCallback) errorCallback();
        });
    }

    download(sketchfabAsset, successCallback, errorCallback) {
        this.fetch(DOWNLOAD_URL.replace('{uid}', sketchfabAsset.uid), (body) =>{
            if(!body.glb) {
                if(errorCallback) errorCallback();
                return;
            }
            this._download(body.glb.url, sketchfabAsset, successCallback,
                errorCallback);
        }, errorCallback);
    }
}

let sketchfab = new Sketchfab();
export default sketchfab;
