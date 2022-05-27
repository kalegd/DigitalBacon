/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const CLIENT_ID = '791471431939-q3fifjtaq8mhlhce0l5h96k38m8fchn2.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBdadP7BFyNpPCRAlCfV-ikXklXkdJ188s';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true";
const UPDATE_URL = "https://www.googleapis.com/upload/drive/v3/files/{fileId}?uploadType=resumable";

class GoogleDrive {
    init() {
        this._files;
        this._fileId;
        this._folderId;
        this._gapiInitialized = false;
        this._gisInitialized = false;
        gapi.load('client', () => { this._initClient() });
    }

    _initClient() {
        this._tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (tokenResponse) => {
                this._accessToken = tokenResponse.access_token;
                this._gisInitialized = true;
                this._initialize();
                if(this._authCallback) this._authCallback();
                this._authCallback = null;
            },
        });
        gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
        }).then(() => {
            this._gapiInitialized = true;
            this._initialize();
        }, function(error) {
            if(error.error == "idpiframe_initialization_failed") {
                if(error.details.includes("Cookies")) {
                    console.log("TODO: Let user know cookies must be enabled for Google Drive to work");
                }
            }
            console.error(JSON.stringify(error, null, 2));
        });
    }

    _initialize() {
        if(this._gisInitialized && this._gapiInitialized && !this._folderId) {
            this._fetchFolder();
            this.fetchFiles();
        }
    }

    handleAuthButton(callback) {
        this._authCallback = callback;
        this._tokenClient.requestAccessToken();
    }

    handleSignoutButton(callback) {
        gapi.client.setToken();
        this._gisInitialized = false;
        this._folderId = null;
        if(callback) callback();
    }

    _fetchFolder() {
        var request = gapi.client.drive.files.list({
            'q': "mimeType = 'application/vnd.google-apps.folder'",
            'spaces': 'drive',
        });
        request.execute((response) => {
            if(response.files.length == 0) {
                this._createFolder();
            } else {
                this._folderId = response.files[0].id;
            }
        });
    }

    _createFolder() {
        let fileMetadata = {
          'name': 'Digital Bacon',
          'mimeType': 'application/vnd.google-apps.folder'
        };
        gapi.client.drive.files.create({
            'resource': fileMetadata,
        }).then((response) => {
            if(response.status != 200) {
                console.log("TODO: Let user know there was a problem");
            } else {
                this._folderId = response.result.id;
            }
        });

    }

    isSignedIn() {
        return gapi.client && gapi.client.getToken() != null;
    }

    hasActiveFile() {
        return this._fileId != null;
    }

    clearActiveFile() {
        this._fileId = null;
    }

    fetchFiles(callback) {
        var request = gapi.client.drive.files.list({
            'q': "mimeType='application/zip'",
        });
        request.execute((response) => {
            this._files = response.files;
            if(callback) callback(this._files);
        });
        return this._files;
    }

    loadFile(fileId, successCallback, errorCallback) {
        gapi.client.drive.files.get({ fileId: fileId, alt: 'media' })
            .then((response) => {
                JSZip.loadAsync(response.body).then((jsZip) => {
                    this._fileId = fileId;
                    if(successCallback) successCallback(jsZip);
                });
            }, function (reason) {
                console.error('Failed to get file: ' + reason);
                if(errorCallback) errorCallback();
            });
    }

    save(zip, successCallback, errorCallback) {
        let isSignedIn = this.isSignedIn();
        if(!isSignedIn) {
            throw("Not signed into google drive");
        }
        zip.generateAsync({type:"blob"})
            .then((blob) => {
                this._update(blob, successCallback, errorCallback);
            });
    }

    saveAs(projectName, zip, successCallback, errorCallback) {
        let isSignedIn = this.isSignedIn();
        if(!isSignedIn) {
            throw("Not signed into google drive");
        }
        zip.generateAsync({type:"blob"})
            .then((blob) => {
                this._upload(projectName, blob, successCallback, errorCallback);
            });
    }

    //Gets the resumable endpoint then _resumeableUpload handles actual upload
    _upload(projectName, data, successCallback, errorCallback) {
        let metadata = {
            'name': projectName + '.zip',
            'mimeType': 'application/zip',
            'parents': [this._folderId],
        };
        let body = JSON.stringify(metadata);
        let accessToken = this._accessToken;
        fetch(UPLOAD_URL, {
            method: 'POST',
            headers: new Headers({
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Length': body.length,
            }),
            body: body,
        }).then((res) => {
            if(res.status != 200) {
                console.error('Error:', error);
                errorCallback();
            } else {
                let url = res.headers.get("location");
                this._resumableUpload(url, data, successCallback, errorCallback,
                    false);
            }
        });
    }

    //Gets the resumable endpoint then _resumeableUpload handles actual upload
    _update(data, successCallback, errorCallback) {
        let accessToken = this._accessToken;
        fetch(UPDATE_URL.replace("{fileId}", this._fileId), {
            method: 'PUT',
            headers: new Headers({
                'Authorization': 'Bearer ' + accessToken,
                'X-HTTP-Method-Override' : 'PATCH',
            }),
        }).then((res) => {
            if(res.status != 200) {
                console.error('Error:', error);
                errorCallback();
            } else {
                let url = res.headers.get("location");
                this._resumableUpload(url, data, successCallback, errorCallback,
                    true);
            }
        });
    }

    _resumableUpload(url, data, successCallback, errorCallback, isUpdate) {
        let accessToken = this._accessToken;
        let headers = { 'Authorization': 'Bearer ' + accessToken };
        if(isUpdate) headers['X-HTTP-Method-Override'] = 'PATCH';

        fetch(url, {
            method: 'PUT',
            headers: new Headers(headers),
            body: data,
        }).then((res) => {
            if(res.status == 200) {
                successCallback();
                res.json().then((val) => { this._fileId = val.id; });
            } else {
                //TODO: Resume upload up to a certain number of times and
                //      then if it still fails cancel and tell user there
                //      is an error or to check their internet connectivity
                console.error('Error:', error);
                //Only call this when we give up and stop retrying (TBD)
                errorCallback();
            }
        });
    }
}

let googleDrive = new GoogleDrive();
export default googleDrive;
