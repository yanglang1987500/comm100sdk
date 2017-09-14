var index =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	/**
	 * @module Comm100AgentConsoleAPI
	 * Comm100AgentConsoleAPI AgentConsole
	 * @method Comm100AgentConsoleAPI
	 * @author yanglang
	 * @date 20170830
	 */
	
	var Events = {};
	var toBeNotify = [];
	var EVENT_PREFIX = 'TPE';
	
	var _ = {
	  /*
	   * @method notify
	   * @param eventName
	   * @returns {_}
	   */
	  notify: function notify(eventName) {
	    var eventList = Events[eventName];
	    var i = 0;
	
	    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	      rest[_key - 1] = arguments[_key];
	    }
	
	    if (eventList) {
	      var len = eventList.length;
	      for (; i < len; i += 1) {
	        var _toBeNotify$slice;
	
	        eventList[i].apply(this, (_toBeNotify$slice = toBeNotify.slice).call.apply(_toBeNotify$slice, rest.concat([1])));
	      }
	    } else {
	      var _toBeNotify$slice2;
	
	      toBeNotify.push({
	        eventName: eventName,
	        data: (_toBeNotify$slice2 = toBeNotify.slice).call.apply(_toBeNotify$slice2, rest.concat([1])),
	        scope: this
	      });
	    }
	    if (eventName.startsWith(EVENT_PREFIX + '_')) {
	      this.unsubscribe(eventName);
	    }
	    return this;
	  },
	
	  /*
	   * @param eventName
	   * @param scope
	   * @param data
	   */
	  notifyWith: function notifyWith(eventName, scope) {
	    for (var _len2 = arguments.length, rest = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
	      rest[_key2 - 2] = arguments[_key2];
	    }
	
	    var _toBeNotify$slice3;
	
	    if (arguments.length < 2) {
	      throw new TypeError('arguments error');
	    }
	    this.notify.apply(scope, [eventName].concat((_toBeNotify$slice3 = toBeNotify.slice).call.apply(_toBeNotify$slice3, rest.concat([2]))));
	  },
	
	  /*
	   * @method subscribe
	   * @param eventName
	   * @param callback
	   */
	  subscribe: function subscribe(eventName, callback) {
	    var i = 0;
	    var len = toBeNotify.length;
	    if (arguments.length < 2) {
	      throw new TypeError('arguments error ');
	    }
	
	    var eventList = Events[eventName] ? Events[eventName] : Events[eventName] = [];
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
	  unsubscribe: function unsubscribe(eventName, callback) {
	    if (callback) {
	      var callbacks = Events[eventName];
	      for (var i = 0; i < callbacks.length; i += 1) {
	        if (callbacks[i] === callback) {
	          callbacks.splice(i -= 1, 1);
	        }
	      }
	    } else {
	      delete Events[eventName];
	    }
	    return this;
	  },
	  guid: function guid() {
	    return 'xxxxxxxx_xxxx_4xxx_yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
	      /* eslint-disable */
	      var r = Math.random() * 16 | 0;
	      var v = c === 'x' ? r : r & 0x3 | 0x8;
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
	  call: function call(api, data, alive) {
	    var eventName = '';
	    if (data.callback) {
	      eventName = !alive ? EVENT_PREFIX + '_' + this.guid() : api;
	      this.subscribe(eventName, data.callback);
	    }
	    var messageObj = {
	      api: api,
	      action: data.action,
	      params: data.params,
	      msgId: eventName
	    };
	    var message = JSON.stringify(messageObj);
	
	    if (typeof window !== 'undefined') {
	      if (typeof window.parent !== 'undefined') {
	        window.parent.postMessage(message, '*');
	      }
	    }
	
	    console.log('call', message);
	    return this;
	  }
	};
	
	var Comm100AgentConsoleAPI = {
	  onReady: function onReady(callback) {
	    window.addEventListener('message', function (e) {
	      if (e.source !== window.parent) {
	        console.log('from self return');
	        return;
	      }
	      var data = JSON.parse(e.data);
	      _.notify(data.msgId || data.api, data);
	    }, false);
	    if (callback) {
	      callback();
	    }
	  },
	  init: function init() {},
	  get: function get(key) {
	    return new Promise(function (resolve) {
	      _.call(key, {
	        action: 'get',
	        callback: function callback(data) {
	          resolve(data);
	          console.log('resolve', data);
	        }
	      });
	    });
	  },
	  set: function set(key, value) {
	    return new Promise(function (resolve) {
	      _.call(key, {
	        action: 'set',
	        params: {
	          value: value
	        },
	        callback: function callback(data) {
	          resolve(data);
	          console.log('resolve', data);
	        }
	      });
	    });
	  },
	  on: function on(key, callback) {
	    _.call(key, {
	      action: 'on',
	      callback: callback
	    }, true);
	  },
	  do: function _do(key, value) {
	    return new Promise(function (resolve) {
	      _.call(key, {
	        action: 'do',
	        params: {
	          value: encodeURIComponent(value)
	        },
	        callback: function callback(data) {
	          resolve(data);
	          console.log('resolve', data);
	        }
	      });
	    });
	  }
	};
	
	if (typeof window !== 'undefined') {
	  window.Comm100AgentConsoleAPI = Comm100AgentConsoleAPI;
	}
	
	exports.default = Comm100AgentConsoleAPI;

/***/ })
/******/ ]);
//# sourceMappingURL=comm100SDK.js.map