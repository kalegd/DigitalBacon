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
        if(urgent) {
            this._publish(owner, topic, message);
        } else {
            this._toPublish.push(
                () => { this._publish(owner, topic, message);});
        }
    }

    _splitTopic(topic) {
        let topicParts = topic.split(":");
        let t = topicParts[0];
        let topics = [t];
        for(let i = 1; i < topicParts.length; i++) {
            t += ":" + topicParts[i];
            topics.push(t);
        }
        return topics;
    }

    _publish(owner, topic, message) {
        let topics = this._splitTopic(topic);
        for(let topic of topics) {
            if(!(topic in this._topics)) continue;
            let topicSubscribers = this._topics[topic];
            for(let subscriber in topicSubscribers) {
                if(subscriber == owner) continue;
                topicSubscribers[subscriber](message);
            }
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
