import { describe, expect, jest, test } from '@jest/globals';
import PubSub from '../../../../scripts/core/handlers/PubSub.js';

const TOPIC = 'TOPIC';
const TOPIC_MULTI_PART = 'TOPIC:MULTI:PART';
const TOPIC_2 = 'TOPIC_2';
const MESSAGE = 'MESSAGE';

function createSubscriber(topic, callback) {
    let subscriber = { id: Math.floor(Math.random() * 1000000) };
    PubSub.subscribe(subscriber.id, topic, (message) => {
        if(subscriber.callback) subscriber.callback(message);
    });
    return subscriber;
}

function cleanUp() {
    PubSub._topics = {};
    PubSub._toPublish = [];
}

test('subscriber receives message', () => {
    let subscriber = createSubscriber(TOPIC);
    subscriber.callback = jest.fn();
    PubSub.publish(null, TOPIC, MESSAGE);
    PubSub.update();
    expect(subscriber.callback).toHaveBeenCalledWith(MESSAGE);
    cleanUp();
});

test('subscribers receive message from multi-part topic', () => {
    let subscriber = createSubscriber(TOPIC);
    let subscriber2 = createSubscriber(TOPIC_MULTI_PART);
    subscriber.callback = jest.fn();
    subscriber2.callback = jest.fn();
    PubSub.publish(null, TOPIC_MULTI_PART, MESSAGE);
    PubSub.update();
    expect(subscriber.callback).toHaveBeenCalledWith(MESSAGE);
    expect(subscriber2.callback).toHaveBeenCalledWith(MESSAGE);
    cleanUp();
});

test('subscriber receives urgent message', () => {
    let subscriber = createSubscriber(TOPIC);
    subscriber.callback = jest.fn();
    PubSub.publish(null, TOPIC, MESSAGE, true);
    expect(subscriber.callback).toHaveBeenCalledWith(MESSAGE);
    cleanUp();
});

test('subscriber does not receive message', () => {
    let subscriber = createSubscriber(TOPIC);
    subscriber.callback = jest.fn();
    PubSub.publish(null, TOPIC_2, MESSAGE);
    PubSub.update();
    expect(subscriber.callback).not.toHaveBeenCalled();
    cleanUp();
});

test('subscriber does not receive message before PubSub.update() called', () => {
    let subscriber = createSubscriber(TOPIC);
    subscriber.callback = jest.fn();
    PubSub.publish(null, TOPIC, MESSAGE);
    expect(subscriber.callback).not.toHaveBeenCalled();
    cleanUp();
});
