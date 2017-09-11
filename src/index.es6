/**
 * @module Comm100AgentConsoleAPI
 * Comm100AgentConsoleAPI AgentConsole提供的SDK库调用封装
 * @method Comm100AgentConsoleAPI
 * @author yanglang
 * @date 20170830
 */

let Events = {},
    eventName = '',
    toBeNotify = [],
    EVENT_PREFIX = 'TPE'; //临时事件名称前缀，后缀为_+时间缀


const _ = {
    /**
     * 触发一个事件
     * @method notify
     * @param eventName 事件名称
     * @param data 事件数据 PS：现在支持变参，除了eventName,data以外还可以添加任意参数
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
            }); //暂时存入待触发列表
        }
        //若为临时事件，则通知一次之后马上注销
        if (eventName.startsWith(EVENT_PREFIX + '_'))
            this.unsubscribe(eventName);
        return this;
    },
    /**
     * 给定作用域触发一个事件
     * @param eventName 事件名称
     * @param scope 作用域
     * @param data 事件数据，支持变参
     */
    notifyWith(eventName, scope, data) {
        if (arguments.length < 2)
            throw new TypeError('按作用域触发事件请提供事件名称与作用域');
        this.notify.apply(scope, [eventName].concat(toBeNotify.slice.call(arguments, 2)));
    },
    /**
     * 订阅一个事件
     * @method subscribe
     * @param eventName 事件名称
     * @param callback 事件回调
     */
    subscribe(eventName, callback) {
        var i = 0,
            len = toBeNotify.length;
        if (arguments.length < 2)
            throw new TypeError('订阅事件请提供事件名称与事件回调');

        var eventList = Events[eventName] ? Events[eventName] : (Events[eventName] = []);
        eventList = Object.prototype.toString.call(callback) === '[object Array]' ? eventList.concat(callback) : eventList.push(callback);
        for (; i < len; i++) {
            if (toBeNotify[i].eventName === eventName) {
                //移除并触发之前已准备触发的事件
                this.notify.apply(toBeNotify[i].scope, [eventName].concat(toBeNotify[i].data));
                toBeNotify.splice(i, 1);
                break;
            }
        }
        return this;
    },
    /**
     * 取消订阅事件
     * @method unsubscribe
     * @param eventName 事件名称
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
     * 调用相关接口
     * @method call
     * @param api 请求地址
     * @param data Object 
     * @param alive 非临时事件
     */
    call(api, data, alive) {
        if (data.callback) {
            //非临时事件使用api作为事件名称
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
        window && window.parent && window.parent.postMessage(message, '*'); //TODO 暂时写死* 界时改为comm100服务器地址

        console.log('call', message)
        return this;
    }
};


const Comm100AgentConsoleAPI = {
    onReady(callback) {
        window.addEventListener('message',e=>{
            if(e.source!=window.parent) {
                console.log('我是自己页面的消息，不予处理，返回');
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
                    value: value
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