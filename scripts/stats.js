class Stats {
    constructor() {
        this._key = 'STATS:' + window.location.pathname + ':HAS_VISITED';
        let hasVisitedBefore = localStorage.getItem(this._key);
        if(hasVisitedBefore) {
            this.post('RETURN');
        } else {
            detectIncognito().then((result) => {
                this.post((result.isPrivate) ? 'PRIVATE' : 'UNIQUE');
            });
        }
    }

    post(userType) {
        fetch('https://api.digitalbacon.io/stats', {
            method: 'POST',
            body: JSON.stringify({ userType: userType }),
            headers: { 'Content-type': 'application/json' },
            referrerPolicy: 'no-referrer-when-downgrade',
        }).then((response) => {
            return response.json();
        }).then((body) => {
            if(body.data && body.data.timestamp) {
                this._timestamp = body.data.timestamp;
                window.onbeforeunload = () => {
                    this.put({ pageClosed: true });
                };
            }
            if(userType != 'RETURN') localStorage.setItem(this._key, true);
        }).catch((error) => {
            console.error('Could not POST to stats endpoint');
            console.error(error);
        });
    }

    put(params) {
        if(!this._timestamp) return;
        params.timestamp = this._timestamp;
        fetch('https://api.digitalbacon.io/stats', {
            method: 'PUT',
            body: JSON.stringify(params),
            headers: { 'Content-type': 'application/json' },
            referrerPolicy: 'no-referrer-when-downgrade',
            keepalive: true,
        });
    }
}


/**
 *
 * detectIncognito v1.3.0 - (c) 2022 Joe Rutkowski <Joe@dreggle.com> (https://github.com/Joe12387/detectIncognito)
 *
 **/
var detectIncognito = function () {
    return new Promise(function (resolve, reject) {
        var browserName = "Unknown";
        function __callback(isPrivate) {
            resolve({
                isPrivate: isPrivate,
                browserName: browserName
            });
        }
        function identifyChromium() {
            var ua = navigator.userAgent;
            if (ua.match(/Chrome/)) {
                if (navigator.brave !== undefined) {
                    return "Brave";
                }
                else if (ua.match(/Edg/)) {
                    return "Edge";
                }
                else if (ua.match(/OPR/)) {
                    return "Opera";
                }
                return "Chrome";
            }
            else {
                return "Chromium";
            }
        }
        function assertEvalToString(value) {
            return value === eval.toString().length;
        }
        function isSafari() {
            var v = navigator.vendor;
            return (v !== undefined && v.indexOf("Apple") === 0 && assertEvalToString(37));
        }
        function isChrome() {
            var v = navigator.vendor;
            return (v !== undefined && v.indexOf("Google") === 0 && assertEvalToString(33));
        }
        function isFirefox() {
            return (document.documentElement !== undefined &&
                document.documentElement.style.MozAppearance !== undefined &&
                assertEvalToString(37));
        }
        function isMSIE() {
            return (navigator.msSaveBlob !== undefined && assertEvalToString(39));
        }
        /**
         * Safari (Safari for iOS & macOS)
         **/
        function newSafariTest() {
            var tmp_name = String(Math.random());
            try {
                var db = window.indexedDB.open(tmp_name, 1);
                db.onupgradeneeded = function (i) {
                    var _a, _b;
                    var res = (_a = i.target) === null || _a === void 0 ? void 0 : _a.result;
                    try {
                        res.createObjectStore("test", {
                            autoIncrement: true
                        }).put(new Blob);
                        __callback(false);
                    }
                    catch (e) {
                        var message = e;
                        if (e instanceof Error) {
                            message = (_b = e.message) !== null && _b !== void 0 ? _b : e;
                        }
                        if (typeof message !== 'string') {
                            return __callback(false);
                        }
                        var matchesExpectedError = /BlobURLs are not yet supported/.test(message);
                        return __callback(matchesExpectedError);
                    }
                    finally {
                        res.close();
                        window.indexedDB.deleteDatabase(tmp_name);
                    }
                };
            }
            catch (e) {
                return __callback(false);
            }
        }
        function oldSafariTest() {
            var openDB = window.openDatabase;
            var storage = window.localStorage;
            try {
                openDB(null, null, null, null);
            }
            catch (e) {
                return __callback(true);
            }
            try {
                storage.setItem("test", "1");
                storage.removeItem("test");
            }
            catch (e) {
                return __callback(true);
            }
            return __callback(false);
        }
        function safariPrivateTest() {
            if (navigator.maxTouchPoints !== undefined) {
                newSafariTest();
            }
            else {
                oldSafariTest();
            }
        }
        /**
         * Chrome
         **/
        function getQuotaLimit() {
            var w = window;
            if (w.performance !== undefined &&
                w.performance.memory !== undefined &&
                w.performance.memory.jsHeapSizeLimit !== undefined) {
                return performance.memory.jsHeapSizeLimit;
            }
            return 1073741824;
        }
        // >= 76
        function storageQuotaChromePrivateTest() {
            navigator.webkitTemporaryStorage.queryUsageAndQuota(function (_, quota) {
                var quotaInMib = Math.round(quota / (1024 * 1024));
                var quotaLimitInMib = Math.round(getQuotaLimit() / (1024 * 1024)) * 2;
                __callback(quotaInMib < quotaLimitInMib);
            }, function (e) {
                reject(new Error("detectIncognito somehow failed to query storage quota: " +
                    e.message));
            });
        }
        // 50 to 75
        function oldChromePrivateTest() {
            var fs = window.webkitRequestFileSystem;
            var success = function () {
                __callback(false);
            };
            var error = function () {
                __callback(true);
            };
            fs(0, 1, success, error);
        }
        function chromePrivateTest() {
            if (self.Promise !== undefined && self.Promise.allSettled !== undefined) {
                storageQuotaChromePrivateTest();
            }
            else {
                oldChromePrivateTest();
            }
        }
        /**
         * Firefox
         **/
        function firefoxPrivateTest() {
            __callback(navigator.serviceWorker === undefined);
        }
        /**
         * MSIE
         **/
        function msiePrivateTest() {
            __callback(window.indexedDB === undefined);
        }
        function main() {
            if (isSafari()) {
                browserName = 'Safari';
                safariPrivateTest();
            }
            else if (isChrome()) {
                browserName = identifyChromium();
                chromePrivateTest();
            }
            else if (isFirefox()) {
                browserName = "Firefox";
                firefoxPrivateTest();
            }
            else if (isMSIE()) {
                browserName = "Internet Explorer";
                msiePrivateTest();
            }
            else {
                reject(new Error("detectIncognito cannot determine the browser"));
            }
        }
        main();
    });
};

let stats = new Stats();
export default stats;
