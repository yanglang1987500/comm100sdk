/**
 * @module Comm100AgentConsoleAPI
 * Comm100AgentConsoleAPI AgentConsole
 * @method Comm100AgentConsoleAPI
 * @author yanglang
 * @date 20170830
 */

const Events = {};
const toBeNotify = [];
const EVENT_PREFIX = 'TPE';


const _ = {
  /*
   * @method notify
   * @param eventName
   * @returns {_}
   */
  notify(eventName, ...rest) {
    const eventList = Events[eventName];
    let i = 0;
    if (eventList) {
      const len = eventList.length;
      for (; i < len; i += 1) {
        eventList[i].apply(this, toBeNotify.slice.call(...rest, 1));
      }
    } else {
      toBeNotify.push({
        eventName,
        data: toBeNotify.slice.call(...rest, 1),
        scope: this,
      });
    }
    if (eventName.startsWith(`${EVENT_PREFIX}_`)) { this.unsubscribe(eventName); }
    return this;
  },
  /*
   * @param eventName
   * @param scope
   * @param data
   */
  notifyWith(eventName, scope, ...rest) {
    if (arguments.length < 2) { throw new TypeError('arguments error'); }
    this.notify.apply(scope, [eventName].concat(toBeNotify.slice.call(...rest, 2)));
  },
  /*
   * @method subscribe
   * @param eventName
   * @param callback
   */
  subscribe(eventName, callback) {
    let i = 0;
    const len = toBeNotify.length;
    if (arguments.length < 2) { throw new TypeError('arguments error '); }

    let eventList = Events[eventName] ? Events[eventName] : (Events[eventName] = []);
    if (Object.prototype.toString.call(callback) === '[object Array]') {
      eventList = eventList.concat(callback);
    } else {
      eventList.push(callback);
    }
    for (; i < len; i += 1) {
      if (toBeNotify[i].eventName === eventName) {
        this.notify.apply(toBeNotify[i].scope, [eventName].concat(toBeNotify[i].data));
        toBeNotify.splice(i, 1);
        break;
      }
    }
    return this;
  },
  /*
   * @method unsubscribe
   * @param eventName
   */
  unsubscribe(eventName, callback) {
    if (callback) {
      const callbacks = Events[eventName];
      for (let i = 0; i < callbacks.length; i += 1) {
        if (callbacks[i] === callback) {
          callbacks.splice(i -= 1, 1);
        }
      }
    } else { delete Events[eventName]; }
    return this;
  },
  guid() {
    return 'xxxxxxxx_xxxx_4xxx_yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      /* eslint-disable */
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      /* eslint-enable */
      return v.toString(16);
    });
  },
  /*
   * @method call
   * @param api
   * @param data Object
   * @param alive
   */
  call(api, data, alive) {
    let eventName = '';
    if (data.callback) {
      eventName = !alive ? `${EVENT_PREFIX}_${this.guid()}` : api;
      this.subscribe(eventName, data.callback);
    }
    const messageObj = {
      api,
      action: data.action,
      params: data.params,
      msgId: eventName,
    };
    const message = JSON.stringify(messageObj);

    if (typeof window !== 'undefined') {
      if (typeof window.parent !== 'undefined') {
        window.parent.postMessage(message, '*');
      }
    }

    console.log('call', message);
    return this;
  },
};


const Comm100AgentConsoleAPI = {
  onReady(callback) {
    window.addEventListener('message', (e) => {
      if (e.source !== window.parent) {
        console.log('from self return');
        return;
      }
      const data = JSON.parse(e.data);
      _.notify(data.msgId || data.api, data);
    }, false);
    if (callback) {
      callback();
    }
  },
  init() {

  },
  get(key) {
    return new Promise((resolve) => {
      _.call(key, {
        action: 'get',
        callback: (data) => {
          resolve(data);
          console.log('resolve', data);
        },
      });
    });
  },
  set(key, value) {
    return new Promise((resolve) => {
      _.call(key, {
        action: 'set',
        params: {
          value,
        },
        callback: (data) => {
          resolve(data);
          console.log('resolve', data);
        },
      });
    });
  },
  on(key, callback) {
    _.call(key, {
      action: 'on',
      callback,
    }, true);
  },
  do(key, value) {
    return new Promise((resolve) => {
      _.call(key, {
        action: 'do',
        params: {
          value: encodeURIComponent(value),
        },
        callback: (data) => {
          resolve(data);
          console.log('resolve', data);
        },
      });
    });
  },
};

if (typeof window !== 'undefined') {
  window.Comm100AgentConsoleAPI = Comm100AgentConsoleAPI;
}

export default Comm100AgentConsoleAPI;
