/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class PubSub {
    constructor() {
        this._topics = {};
        this._toPublish = [];
    }

    subscribe(owner, topic, callback) {
        if(!(topic in this._topics)) this._topics[topic] = {};
        this._topics[topic][owner] = callback;
    }

    unsubscribe(owner, topic) {
        if(!(topic in this._topics)) return;

        delete this._topics[topic][owner];
        if(Object.keys(this._topics[topic]).length == 0) {
            delete this._topics[topic];
        }
    }

    publish(owner, topic, message, urgent) {
        if(!topic in this._topics) {
            return;
        } else if(urgent) {
            this._publish(owner, topic, message);
        } else {
            this._toPublish.push(() => { this._publish(owner, topic, message)});
        }
    }

    _publish(owner, topic, message) {
        let topicSubscribers = this._topics[topic];
        for(let subscriber in topicSubscribers) {
            if(subscriber == owner) continue;
            topicSubscribers[subscriber](message);
        }
    }

    update() {
        for(let toPublish of this._toPublish) {
            toPublish();
        }
        this._toPublish = [];
    }
}

let pubSub = new PubSub();
export default pubSub;
