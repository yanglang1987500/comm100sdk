/**
 * @module Comm100AgentConsoleAPI
 * Comm100AgentConsoleAPI AgentConsole
 * @method Comm100AgentConsoleAPI
 * @author yanglang
 * @date 20170830
 */

let Events = {},
    eventName = '',
    toBeNotify = [],
    EVENT_PREFIX = 'TPE'; 


const _ = {
    /**
     * @method notify
     * @param eventName 
     * @returns {_}
     */
    notify(eventName, data) {
        var eventList = Events[eventName],
            i = 0;
        if (eventList) {
            var len = eventList.length;
            for (; i < len; i++) {
                eventList[i].apply(this, toBeNotify.slice.call(arguments, 1));
            }
        } else {
            toBeNotify.push({
                eventName: eventName,
                data: toBeNotify.slice.call(arguments, 1),
                scope: this
            });
        }
        if (eventName.startsWith(EVENT_PREFIX + '_'))
            this.unsubscribe(eventName);
        return this;
    },
    /**
     * @param eventName 
     * @param scope 
     * @param data 
     */
    notifyWith(eventName, scope, data) {
        if (arguments.length < 2)
            throw new TypeError('arguments error');
        this.notify.apply(scope, [eventName].concat(toBeNotify.slice.call(arguments, 2)));
    },
    /**
     * @method subscribe
     * @param eventName 
     * @param callback 
     */
    subscribe(eventName, callback) {
        var i = 0,
            len = toBeNotify.length;
        if (arguments.length < 2)
            throw new TypeError('arguments error ');

        var eventList = Events[eventName] ? Events[eventName] : (Events[eventName] = []);
        eventList = Object.prototype.toString.call(callback) === '[object Array]' ? eventList.concat(callback) : eventList.push(callback);
        for (; i < len; i++) {
            if (toBeNotify[i].eventName === eventName) {
                this.notify.apply(toBeNotify[i].scope, [eventName].concat(toBeNotify[i].data));
                toBeNotify.splice(i, 1);
                break;
            }
        }
        return this;
    },
    /**
     * @method unsubscribe
     * @param eventName 
     */
    unsubscribe(eventName, callback) {
        if (callback) {
            var callbacks = Events[eventName];
            for (var i = 0; i < callbacks.length; i++) {
                if (callbacks[i] === callback) {
                    callbacks.splice(i--, 1);
                }
            }
        } else
            delete Events[eventName];
        return this;
    },
    guid() {
        return 'xxxxxxxx_xxxx_4xxx_yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c)=> {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    /**
     * @method call
     * @param api 
     * @param data Object 
     * @param alive 
     */
    call(api, data, alive) {
        if (data.callback) {
            eventName = !alive ? EVENT_PREFIX + '_' + this.guid() : api;
            this.subscribe(eventName, data.callback);
        }
        let messageObj = {
            api: api,
            action: data.action,
            params: data.params,
            msgId: eventName
        };
        let message = JSON.stringify(messageObj);
        window && window.parent && window.parent.postMessage(message, '*');

        console.log('call', message)
        return this;
    }
};


const Comm100AgentConsoleAPI = {
    onReady(callback) {
        window.addEventListener('message',e=>{
            if(e.source!=window.parent) {
                console.log('from self return');
                return;
            }
            let data = JSON.parse(e.data);
            _.notify(data.msgId || data.api,data);
        },false);
        callback && callback();
    },
    init() {

    },
    get(key) {
        return new Promise((resolve, reject)=> {
            _.call(key, {
                action: 'get',
                callback: (data)=> {
                    resolve(data);
                    console.log('resolve', data);
                }
            });
        });
    },
    set(key, value) {
        return new Promise((resolve, reject)=> {
            _.call(key, {
                action: 'set',
                params: {
                    value: value
                },
                callback: (data)=> {
                    resolve(data);
                    console.log('resolve', data);
                }
            });
        });
    },
    on(key, callback) {
        _.call(key, {
            action: 'on',
            callback: callback
        }, true);
    },
    do(key, value) {
        return new Promise((resolve, reject) =>{
            _.call(key, {
                action: 'do',
                params: {
                    value: encodeURIComponent(value)
                },
                callback: (data)=> {
                    resolve(data);
                    console.log('resolve', data);
                }
            });
        });
    }
};

window && (window.Comm100AgentConsoleAPI = Comm100AgentConsoleAPI);

export default Comm100AgentConsoleAPI;