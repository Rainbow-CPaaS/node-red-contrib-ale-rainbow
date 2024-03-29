module.exports = function (RED) {
    let _RainbowSDK = null;
    const util = require('util');
    let errorMsgBuffer = [];
    const maxBufferLength = 500;

    function allocateSDK(node, server) {
        node.log("RainbowSDK instance allocated" + " cnx: " + JSON.stringify(server.name));
        let handler;
        server.rainbow.sdk = new _RainbowSDK(server.rainbow.options);
        if (server.rainbow.sdkhandler !== undefined && server.rainbow.sdkhandler.length !== 0) {
            node.log("RainbowSDK : Re-registering event handlers");
            for (var i = 0, len = server.rainbow.sdkhandler.length; i < len; i++) {
                handler = server.rainbow.sdkhandler[i];
                server.rainbow.sdk.events.on(handler.evt, handler.fct);
            }
        } else {
            server.rainbow.sdkhandler = [];
        }
        if (server.rainbow.sdkLoghandler !== undefined && server.rainbow.sdkLoghandler.length !== 0) {
            node.log("RainbowSDK : Re-registering event Log handlers");
            for (var i = 0, len = server.rainbow.sdkLoghandler.length; i < len; i++) {
                handler = server.rainbow.sdkLoghandler[i];
                server.rainbow.sdk.events.onLog(handler.evt, handler.fct);
            }
        } else {
            server.rainbow.sdkLoghandler = [];
        }
    }

    function releaseSDK(node, server) {
        node.log("Removing RainbowSDK (releaseSDK) instance " + " cnx: " + JSON.stringify(server.name));
        if (server.rainbow.sdk === null) {
            node.log("Removing RainbowSDK (releaseSDK) server.rainbow.sdk is null, cnx: " + JSON.stringify(server.name));
            return
        }

        //node.log("Removing RainbowSDK (releaseSDK) server.rainbow.sdk stopped, remove it, cnx: " + JSON.stringify(server.name));
        delete server.rainbow.sdk;
        server.rainbow.sdk = null;
        //node.log("Removing RainbowSDK (releaseSDK) exit, cnx: " + JSON.stringify(server.name));
    }

    function pauseSDK(node, server, done) {
        node.log("****************************************** IN");
        node.log("Removing RainbowSDK (pauseSDK) instance " + " cnx: " + JSON.stringify(server.name));
        if (server.rainbow.sdk === null) {
            return
        }

        server.rainbow.sdk.stop().catch(function (e) {
            node.log("catched error during pauseSDK stop : " + " cnx: " + JSON.stringify(e)); // "zut !"
            if (typeof done === "function") done();
        }).then((res) => {
            server.rainbow.logged = false;
            delete server.rainbow.sdk;
            server.rainbow.sdk = null;
            node.log("****************************************** OUT");
            node.status({
                fill: "grey",
                shape: "dot",
                text: "off"
            });
            if (typeof done === "function") done();
        });
    }

    function removeEventListeners(node, server) {
        node.log("Removing RainbowSDK event listeners for instance " + " cnx: " + JSON.stringify(server.name));
        if (server.rainbow.sdk === null) {
            return
        }

        var handler = server.rainbow.sdkhandler.pop();
        while (handler) {
            node.log("Remove listenner function :" + handler.fct.name + " cnx: " + JSON.stringify(server.name));
            server.rainbow.sdk.events.eee.removeListener(handler.evt, handler.fct);
            handler = server.rainbow.sdkhandler.pop();
        }

        handler = server.rainbow.sdkLoghandler.pop();
        while (handler) {
            node.log("Remove Log listenner function :" + handler.fct.name + " cnx: " + JSON.stringify(server.name));
            server.rainbow.sdk.events.removeLogListener(handler.evt, handler.fct);
            handler = server.rainbow.sdkLoghandler.pop();
        }

    }

    function login(config) {
        RED.nodes.createNode(this, config);
        var context = this.context();
        this.proxyHost = config.proxyHost;
        this.proxyPort = config.proxyPort;
        this.proxyProto = config.proxyProto;
        this.ackIM = config.ackIM;
        this.sdkConsoleLog = config.sdkConsoleLog;
        this.sdkFileLog = config.sdkFileLog;
        this.sdkEventsLog = config.sdkEventsLog;
        this.sendRetryOnReconnect = config.sendRetryOnReconnect;
        this.retryPrefixTemplate = config.retryPrefixTemplate;
        this.messageMaxLength = config.messageMaxLength;
        this.sendMessageToConnectedUser = config.sendMessageToConnectedUser;
        this.conversationsRetrievedFormat = config.conversationsRetrievedFormat;
        this.storeMessages = config.storeMessages;
        this.nbMaxConversations = config.nbMaxConversations;
        this.rateLimitPerHour = config.rateLimitPerHour;
        this.autoLogin = config.autoLogin;
        context.set('RBLoginState', false);
        var successiveCOnnectionFail = 0;
        var node = this;

        node.log("login: **************************************************");
        node.log("login: **************************************************");
        node.log("login: " + JSON.stringify(config));
        node.log("login: **************************************************");
        node.log("login: " + JSON.stringify(node.credentials));
        node.log("login: **************************************************");
        node.log("login: " + JSON.stringify(node));
        node.log("login: **************************************************");
        node.log("login: **************************************************");

        // node.log("TEMP: " + JSON.stringify(process.env));
        let tempDir = process.env["TEMP"];
        node.log("TEMP: " + tempDir);

        node.rainbow = {};
        node.rainbow.logged = false;
        node.rainbow.options = {
            "rainbow": {
//                host: "official",
                "host": config.host
            },
            "credentials": {
                "login": node.credentials.username,
                "password": node.credentials.password
            },
            // Application identifier
            "application": {
                "appID": node.credentials.appID,
                "appSecret": node.credentials.appSecret,
            },
            "logs": {
                "enableConsoleLogs": config.sdkConsoleLog, // Default: false
//                "enableConsoleLogs": false, // Default: false
                "enableFileLogs": config.sdkFileLog, // Default: false
                "enableEventsLogs": config.sdkEventsLog, // Default: false
                "color": true,
                "level": 'debug',
                "customLabel": "noderedcontrib",
                "system-dev": {
                    "internals": config.sdkLogInternals,
                    "http": config.sdkLogHttp
                }, // */
                "file": {
                    "path": tempDir, // Default path used
                    "level": 'debug' // Default log level used
                }
            },
            "proxy": {
                "host": config.proxyHost,
                "port": config.proxyPort,
                "protocol": config.proxyProto
            },
            "im": {
                "sendReadReceipt": config.ackIM, // True to send the 'read' receipt automatically
                "messageMaxLength": config.messageMaxLength,
                "sendMessageToConnectedUser": config.sendMessageToConnectedUser,
                "conversationsRetrievedFormat": config.conversationsRetrievedFormat,
                "storeMessages": config.storeMessages,
                "nbMaxConversations": config.nbMaxConversations,
                "rateLimitPerHour": config.rateLimitPerHour,
                //"messagesDataStore": DataStoreType.NoPermanentStore
            },
            "servicesToStart": {
                "s2s": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._settings);
                "presence": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._settings);
                "contacts": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest);
                "conversations": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": true
                }, //need services :  (that._xmpp, that._rest, that._contacts, that._bubbles, that._fileStorage, that._fileServer);
                "im": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": true
                }, //need services :  (that._xmpp, that._conversations, that._bubbles, that._fileStorage);
                "profiles": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest);
                "groups": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest);

                "bubbles": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest);
                "telephony": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest, that._contacts, that._bubbles, that._profiles);
                "channels": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest);
                "admin": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest);
                "fileServer": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest, that._fileStorage);
                "fileStorage": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest, that._fileServer, that._conversations);
                "calllog": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest, that._contacts, that._profiles, that._telephony);
                "favorites": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest);
                "alerts": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest);
                "invitation": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services :  (that._xmpp, that._rest);
                "settings": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services : ( XMPPService, _rest : RESTService)
                "webinar": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services : ( )
                "rbvoice": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services : ( )
                "httpoverxmpp": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                }, //need services : ( )
                "rpcoverxmpp": {
                    "start_up": true,
                    "optional": true,
                    "logEntryParameters": false
                } //need services : ( )
            }
        };
        if (config.sdkFileLog) {
            node.log("Rainbow : logs stored in folder : " + JSON.stringify(tempDir));
        }
        node.log("Rainbow : login node initialized :" + " cnx: " + JSON.stringify(node.name));
        if (_RainbowSDK === null) {
            node.log("Rainbow : login node launch require **********" + " cnx: " + JSON.stringify(node.name));
            _RainbowSDK = require("rainbow-node-sdk");
        }
        //node.log("config : "+JSON.stringify(config));
        node.log("ENV : http_proxy=" + process.env.http_proxy + " cnx: " + JSON.stringify(node.name));
        node.log("ENV : https_proxy=" + process.env.https_proxy + " cnx: " + JSON.stringify(node.name));
        var ConnectionFail = function ConnectionFail() {
            successiveCOnnectionFail++;
            if (config.proxyHost !== "") {
                //We are configure to work behind a proxy.
                if (successiveCOnnectionFail === 5) {
                    // 5 successive fail, let's try to change proxy config
                    node.rainbow.options.proxy.host = "";
                    node.rainbow.options.proxy.port = "";
                    node.rainbow.options.proxy.proto = "";
                }
                if (successiveCOnnectionFail === 10) {
                    // Still failling, let's retry on default config
                    successiveCOnnectionFail = 0;
                    node.rainbow.options.proxy.host = config.proxyHost;
                    node.rainbow.options.proxy.port = config.proxyPort;
                    node.rainbow.options.proxy.proto = config.proxyProto;
                }
            }
        }
        if ((node.rainbow.sdk === undefined) || (node.rainbow.sdk === null)) {
            node.log("login: **************************************************" + " cnx: " + JSON.stringify(node.name));
            allocateSDK(node, node);
            node.log("login: **** SDK allocated" + " cnx: " + JSON.stringify(node.name));
            node.log("login: **** SDK allocated version: " + node.rainbow.sdk.version);

            var onLoginConnectionReady = function onLoginConnectionReady() {
                node.log("++++++++++++++++++++");
                node.log("onLoginConnectionReady()" + " cnx: " + JSON.stringify(node.name));
                node.log("++++++++++++++++++++");
                successiveCOnnectionFail = 0;
                node.rainbow.logged = true;

                // We flush the message buffer
                if (node.sendRetryOnReconnect && errorMsgBuffer.length > 0) {
                    let content = null;

                    node.log("Rainbow : node: " + JSON.stringify(node.name) + ' flushing message buffer');
                    let inc = 0;
                    while (content = errorMsgBuffer.shift()) {
                        setTimeout((arg) => {
                            arg.node.emit('input', arg.msg);
                        }, inc * 5, content);
                        inc++;
                    }
                }
            };

            node.rainbow.sdk.events.on('rainbow_onready', onLoginConnectionReady);
            node.rainbow.sdkhandler.push({
                evt: 'rainbow_onready',
                fct: onLoginConnectionReady
            });
            node.log("Rainbow : login register for event 'rainbow_onready'");
            var onLoginConnectionStopped = function onLoginConnectionStopped() {
                node.log("--------------------");
                node.log("onLoginConnectionStopped()" + " cnx: " + JSON.stringify(node.name));
                node.log("--------------------");
                node.rainbow.logged = false;
            };
            node.rainbow.sdk.events.on('rainbow_onstopped', onLoginConnectionStopped);
            node.rainbow.sdkhandler.push({
                evt: 'rainbow_onstopped',
                fct: onLoginConnectionStopped
            });
            node.log("Rainbow : login register for event 'rainbow_onstopped'" + " cnx: " + JSON.stringify(node.name));
            var onLoginConnectionError = function onLoginConnectionError(error) {
                var label = (error ? (error.label ? error.label : error) : "unknown");
                node.log("********************");
                node.log("onLoginConnectionError() : " + label + " cnx: " + JSON.stringify(node.name) + ", error : " + JSON.stringify(error));
                node.log("********************");
                node.rainbow.logged = false;
                if (node.autoLogin) {
                    node.log("onLoginConnectionError() - autologin mode" + " cnx: " + JSON.stringify(node.name));
                    ConnectionFail();
                    node.connectTimer = setTimeout(function () {
                        releaseSDK(node, node);
                        allocateSDK(node, node);
                    }, 5000);
                }
            }
            node.rainbow.sdk.events.on('rainbow_onconnectionerror', onLoginConnectionError);
            node.rainbow.sdk.events.on('rainbow_onerror', onLoginConnectionError);
            node.rainbow.sdkhandler.push({
                evt: 'rainbow_onconnectionerror',
                fct: onLoginConnectionError
            });
            node.log("Rainbow : login register for event 'rainbow_onconnectionerror'" + " cnx: " + JSON.stringify(node.name));

            var onLoginRainbowError = function onLoginRainbowError(error) {
                var label = (error ? (error.label ? error.label : error) : "unknown");
                node.log("////////////////////");
                node.log("onLoginRainbowError() : " + label + " cnx: " + JSON.stringify(node.name));
                node.log("////////////////////");
                node.rainbow.logged = false;
                if (node.autoLogin) {
                    ConnectionFail();
                    node.connectTimer = setTimeout(function () {
                        releaseSDK(node, node);
                        allocateSDK(node, node);
                    }, 5000);
                }
            };
            node.rainbow.sdk.events.on('rainbow_onfailed', onLoginRainbowError);
            node.rainbow.sdk.events.on('rainbow_onerror', onLoginRainbowError);
            node.rainbow.sdkhandler.push({
                evt: 'rainbow_onerror',
                fct: onLoginRainbowError
            });
            node.log("Rainbow : login register for event 'rainbow_onxmpperror'" + " cnx: " + JSON.stringify(node.name));

            var onLoginRainbowXMPPError = function onLoginRainbowXMPPError(error) {
                var label = (error ? (error.label ? error.label : error) : "unknown");
                let errorStr = util.inspect(error);
                node.log("////////////////////");
                node.log("onLoginRainbowXMPPError() : " + label + " cnx: " + JSON.stringify(node.name) + ", error : " + errorStr);
                node.log("////////////////////");
                /*
                node.rainbow.logged = false;
                if (node.autoLogin) {
                    ConnectionFail();
                    node.connectTimer = setTimeout(function() {
                        releaseSDK(node, node);
                        allocateSDK(node, node);
                    }, 5000);
                }
                // */
            };
            node.rainbow.sdk.events.on('rainbow_onxmpperror', onLoginRainbowXMPPError);
            node.rainbow.sdkhandler.push({
                evt: 'rainbow_onxmpperror',
                fct: onLoginRainbowXMPPError
            });
            node.log("Rainbow : login register for event 'rainbow_onerror'" + " cnx: " + JSON.stringify(node.name));
            if (node.autoLogin) {
                node.log("RainbowSDK instance for autostart " + " cnx: " + JSON.stringify(node.name));
                node.connectTimer = setTimeout(function () {
                    node.rainbow.sdk.start().then(() => {
                        node.rainbow.logged = true;
                    });
                }, 3000);
            }
        }
        this.on('close', function (removed, done) {
            node.log("§§§§§§§§§§§§§§§§§§§§ Node-Red on 'close'- IN" + " cnx: " + JSON.stringify(node.name));
            if (removed) {
                node.log("Receive 'close' with flag removed set, trying to stop instance " + " cnx: " + JSON.stringify(node.name));
                node.rainbow.sdk.stop().then(() => {
                    node.rainbow.logged = false;
                    removeEventListeners(node, node.id);
                    releaseSDK(node, node);
                    clearTimeout(node.connectTimer);
                    node.log("Receive 'close' with flag removed set, instance " + " cnx: " + JSON.stringify(node.name) + " stopped and cleared");
                    node.log("§§§§§§§§§§§§§§§§§§§§ Node-Red on 'close'- OUT (removed)");
                    if (typeof done === "function") done();
                });
            } else {
                node.log("Receive 'close', trying to restart (refresh) instance " + " cnx: " + JSON.stringify(node.name));
                node.log("§§§§§§§§§§§§§§§§§§§§ Node-Red on 'close'- OUT" + done + " cnx: " + JSON.stringify(node.name));
                pauseSDK(node, node, done);
            }
        });
    }

    function getCnxState(config) {
        RED.nodes.createNode(this, config);
        this.server = RED.nodes.getNode(config.server);
        //this.filter = config.filter;
        var cfgTimer = null;
        var node = this;
        node.log("Rainbow : getCnxState node initialized :" + " cnx: " + JSON.stringify(node.server.name));
        node.status({
            fill: "grey",
            shape: "dot",
            text: "off"
        });
        // Update status
        var getRainbowSDKGetCnxState = function getRainbowSDKGetCnxState() {
            if ((node.server.rainbow.sdk === undefined) || (node.server.rainbow.sdk === null)) {
                node.log("Rainbow SDK not ready (" + config.server + ")");
                cfgTimer = setTimeout(getRainbowSDKGetCnxState, 2000);
            } else {
                var onGetRainbowSDKConnectionOk = function onGetRainbowSDKConnectionOk() {
                    node.status({
                        fill: "orange",
                        shape: "dot",
                        text: "signin" + " " + JSON.stringify(node.server.name)
                    });
                    var msg = {
                        payload: "rainbow_onconnected"
                    };
                    node.send(msg);
                };
                node.server.rainbow.sdk.events.on('rainbow_onconnected', onGetRainbowSDKConnectionOk);
                node.server.rainbow.sdkhandler.push({
                    evt: 'rainbow_onconnected',
                    fct: onGetRainbowSDKConnectionOk
                });
                node.log("Rainbow : getCnxState register for event 'rainbow_onconnected'");

                var onLogReceived = function onLogReceived(data) {
                    //node.log("Rainbow : getCnxState received debug data : " + data);
                    var msg = {
                        payload: data
                    };
                    node.send([undefined, msg]);
                };
                if (node.server.rainbow.sdk.events.onLog) {
                    node.server.rainbow.sdk.events.onLog('debug', onLogReceived);
                    node.server.rainbow.sdkLoghandler.push({
                        evt: 'debug',
                        fct: onLogReceived
                    });
                    node.log("Rainbow : getCnxState register for log event 'debug'");
                }

                var onLoginConnectionStopped = function onLoginConnectionStopped() {
                    node.status({
                        fill: "grey",
                        shape: "dot",
                        text: "off" + " " + JSON.stringify(node.server.name)
                    });
                    var msg = {
                        payload: "rainbow_ondisconnected"
                    };
                    node.send(msg);
                };
                node.server.rainbow.sdk.events.on('rainbow_onstopped', onLoginConnectionStopped);
                node.log("Rainbow : getCnxState register for event 'rainbow_onstopped'");
                node.server.rainbow.sdkhandler.push({
                    evt: 'rainbow_onstopped',
                    fct: onLoginConnectionStopped
                });
                node.log("Rainbow : getCnxState register for event 'rainbow_onstopped'");

                var onGetRainbowSDKConnectionDown = function onGetRainbowSDKConnectionDown() {
                    node.status({
                        fill: "grey",
                        shape: "dot",
                        text: "off" + " " + JSON.stringify(node.server.name)
                    });
                    var msg = {
                        payload: "rainbow_ondisconnected"
                    };
                    node.send(msg);
                };
                node.server.rainbow.sdk.events.on('rainbow_ondisconnected', onGetRainbowSDKConnectionDown);
                node.server.rainbow.sdkhandler.push({
                    evt: 'rainbow_ondisconnected',
                    fct: onGetRainbowSDKConnectionDown
                });
                node.log("Rainbow : getCnxState register for event 'rainbow_ondisconnected'");


                var onGetRainbowSDKConnectionError = function onGetRainbowSDKConnectionError() {
                    node.status({
                        fill: "red",
                        shape: "ring",
                        text: "connection error" + " " + JSON.stringify(node.server.name)
                    });
                    var msg = {
                        payload: "rainbow_onconnectionerror"
                    };
                    node.send(msg);
                };
                node.server.rainbow.sdk.events.on('rainbow_onconnectionerror', onGetRainbowSDKConnectionError);
                node.server.rainbow.sdkhandler.push({
                    evt: 'rainbow_onconnectionerror',
                    fct: onGetRainbowSDKConnectionError
                });
                node.log("Rainbow : getCnxState register for event 'rainbow_onconnectionerror'");
                var onGetRainbowSDKError = function onGetRainbowSDKError() {
                    node.status({
                        fill: "red",
                        shape: "ring",
                        text: "config error" + " " + JSON.stringify(node.server.name)
                    });
                    var msg = {
                        payload: "rainbow_onerror"
                    };
                    node.send(msg);
                };
                node.server.rainbow.sdk.events.on('rainbow_onerror', onGetRainbowSDKError);
                node.server.rainbow.sdkhandler.push({
                    evt: 'rainbow_onerror',
                    fct: onGetRainbowSDKError
                });
                node.log("Rainbow : getCnxState register for event 'rainbow_onerror'");
                var onGetRainbowSDKReady = function onGetRainbowSDKReady() {
                    node.status({
                        fill: "green",
                        shape: "ring",
                        text: "connected" + " " + JSON.stringify(node.server.name)
                    });
                    var msg = {
                        payload: "rainbow_onready"
                    };
                    node.send(msg);
                };
                node.server.rainbow.sdk.events.on('rainbow_onready', onGetRainbowSDKReady);
                node.server.rainbow.sdkhandler.push({
                    evt: 'rainbow_onready',
                    fct: onGetRainbowSDKReady
                });
                node.log("Rainbow : getCnxState register for event 'rainbow_onready'");
            }
        }
        //Eventy from Button to triger Login
        this.on("input", function (msg) {
            node.log("Got API order : " + util.inspect(msg));
            node.log("Rainbow : GetCnxState input event : " + util.inspect(msg));
            node.log("Rainbow : node: " + JSON.stringify(node.server.name));
            try {
                switch (msg.payload) {
                    case 'login': {
                        node.status({
                            fill: "red",
                            shape: "ring",
                            text: "init" + " " + JSON.stringify(node.server.name)
                        });
                        if (node.server.rainbow.logged) {
                            pauseSDK(node, node.server, undefined);
                        } else {
                            releaseSDK(node, node.server);
                            allocateSDK(node, node.server);
                            node.server.rainbow.sdk.start().then(() => {
                                node.server.rainbow.logged = true;

                                // We flush the message buffer
                                /*
                                if (node.server.sendRetryOnReconnect && errorMsgBuffer.length > 0) {
                                    let content = null;

                                    node.log("Rainbow : node: " + JSON.stringify(node.server.name) + ' flushing message buffer');
                                    while (content = errorMsgBuffer.shift()) {
                                        content.node.emit('input', content.msg);
                                    }
                                }

                                 */
                            });
                        }
                        break;
                    }
                    case 'logout': {
                        node.status({
                            fill: "red",
                            shape: "ring",
                            text: "init" + " " + JSON.stringify(node.server.name)
                        });
                        if (node.server.rainbow.logged) {
                            // Temporary modification due to issue #4
                            node.server.rainbow.sdk._core._xmpp.stop(true).then(() => {
                                node.server.rainbow.sdk.stop().then((res) => {
                                    node.server.rainbow.logged = false;
                                    delete node.server.rainbow.sdk;
                                    node.server.rainbow.sdk = null;

                                    var msg = {
                                        payload: "stopped by logout"
                                    };
                                    node.send(msg);
                                });
                            });
                        }
                        break;
                    }
                }
            } catch (err) {
                this.error(err, msg);
            }
        });
        getRainbowSDKGetCnxState();
        this.on('close', function () {
            // tidy up any state
            clearTimeout(cfgTimer);
        });
    }

    RED.httpAdmin.post("/Login/:id", RED.auth.needsPermission("Notified_CnxState.write"), function (req, res) {
        var node = RED.nodes.getNode(req.params.id);
        var state = req.params.state;
        node.log("Rainbow : Got /Login request: " + JSON.stringify(req.params));
        if (node != null) {
            try {
                var msg = {
                    payload: "login",
                    state: state
                };
                node.receive(msg);
                res.sendStatus(200);
            } catch (err) {
                res.sendStatus(500);
                node.error(RED._("Notified_CnxState.failed", {
                    error: err.toString()
                }));
            }
        } else {
            res.sendStatus(404);
        }
    });

    function sendMessage(config) {
        RED.nodes.createNode(this, config);
        this.destJid = config.destJid;
        this.server = RED.nodes.getNode(config.server);
        var cfgTimer = null;
        var msgSent = 0;
        var node = this;
        node.log("Rainbow : sendMessage node initialized :" + " cnx: " + JSON.stringify(node.server.name))
        var getRainbowSDKSendMessage = function () {
            if ((node.server.rainbow.sdk === undefined) || (node.server.rainbow.sdk === null)) {
                node.log("Rainbow SDK not ready (" + config.server + ")" + " cnx: " + JSON.stringify(node.server.name));
                cfgTimer = setTimeout(getRainbowSDKSendMessage, 2000);
            }
        }
        var sendMessageToBubble = function (content, bubbleJid, lang, alternateContent, subject, mentions, urgency) {
            node.server.rainbow.sdk.im.sendMessageToBubbleJid(content, bubbleJid, lang, alternateContent, subject, mentions, urgency);
            msgSent++;
            node.status({
                fill: "green",
                shape: "dot",
                text: "Nb sent: " + msgSent
            });
        }

        var sendMessageToContact = function (content, destJid, lang, alternateContent, subject, urgency) {
            node.server.rainbow.sdk.im.sendMessageToJid(content, destJid, lang, alternateContent, subject, urgency);
            msgSent++;
            node.status({
                fill: "green",
                shape: "dot",
                text: "Nb sent: " + msgSent
            });
        }

        getRainbowSDKSendMessage();

        this.on('close', function () {
            // tidy up any state
            clearTimeout(cfgTimer);
        });

        this.on('input', function (msg) {
            node.status({
                fill: "orange",
                shape: "dot",
                text: "will send..."
            });
            node.log("Rainbow : sendMessage to cnx: " + JSON.stringify(node.server.name));

            if (node.server.rainbow.logged === false) {
                node.log("Rainbow SDK not ready (" + config.server + ")" + " cnx: " + JSON.stringify(node.server.name));
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "not connected"
                });

                /**
                 * Do we use message buffer to keep them and wait for connection up ?
                 */
                if (msg && msg.payload && node.server.sendRetryOnReconnect) {
                    node.log("Connection is not ready, we push the msg to buffer");
                    if (errorMsgBuffer.length >= maxBufferLength) {
                        node.warn("Buffer has reached its limit, so we drop the oldest message !");
                    }

                    if (node.server.retryPrefixTemplate && node.server.retryPrefixTemplate !== '') {
                        // Is msg already prefixed ?
                        if (!msg.payload.isRetryPrefixed) {
                            msg.payload.content = node.server.retryPrefixTemplate.replace(':DATE:', new Date().toUTCString()) + '\n' + msg.payload.content;
                            msg.payload.isRetryPrefixed = true;
                        }
                    }
                    errorMsgBuffer.push({msg: msg, node: node});
                }
            } else {
                if (!msg || !msg.payload) {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "no valid payload!"
                    });
                    return;
                }
                let destJid = (msg.payload.destJid !== undefined ? msg.payload.destJid : (node.destJid !== "" ? node.destJid : msg.payload.fromJid));
                let lang = msg.payload.lang ? msg.payload.lang : null;
                let content = msg.payload.content;
                let alternateContent = (msg.payload.alternateContent ? msg.payload.alternateContent : null);
                let subject = (msg.payload.subject ? msg.payload.subject : null);
                let mentions = (msg.payload.mentions ? msg.payload.mentions : null);
                let urgency = (msg.payload.urgency ? msg.payload.urgency : null);
                if (destJid !== undefined && "" !== destJid) {
                    node.log("Rainbow SDK (" + config.server + " " + content + " " + node.destJid + " " + JSON.stringify(alternateContent) + " cnx: " + JSON.stringify(node.server.name));
                    if (destJid.substring(0, 5) === "room_") {
                        var bubbleJid = destJid.split("/")[0]
                        if (msg.payload.customData !== undefined) {
                            node.server.rainbow.sdk.bubbles.getBubbleByJid(bubbleJid).then(bubble => {
                                if (bubble !== null) {
                                    node.server.rainbow.sdk.bubbles.setBubbleCustomData(bubble, msg.payload.customData).then(function () {
                                        node.log("Rainbow SDK (" + config.server + " setBubbleCustomData " + bubbleJid + " " + JSON.stringify(msg.payload.customData) + " cnx: " + JSON.stringify(node.server.name));
                                        sendMessageToBubble(content, bubbleJid, lang, alternateContent, subject, mentions, urgency);

                                    }, function (error) {
                                        var label = (error ? (error.label ? error.label : error) : "unknown");
                                        node.log("Rainbow SDK (" + config.server + " setBubbleCustomData " + bubbleJid + " failed")
                                        node.log("Rainbow SDK (" + config.server + "bubble " + JSON.stringify(bubble.id) + " , error: " + (typeof label == 'object' ? JSON.stringify(label) : label));
                                        sendMessageToBubble(content, bubbleJid, lang, alternateContent, subject, mentions, urgency);
                                    });
                                }
                            });
                        } else {
                            sendMessageToBubble(content, bubbleJid, lang, alternateContent, subject, mentions, urgency);
                        }

                    } else {
                        sendMessageToContact(content, destJid, lang, alternateContent, subject, urgency);

                    }

                } else {
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: "no valid destination Jid"
                    });
                }
            }

        });
    }

    function getMessage(config) {
        RED.nodes.createNode(this, config);
        this.filter = config.filter;
        this.filterContact = config.filterContact;
        this.filterCompany = config.filterCompany;
        this.ignorechat = config.ignorechat;
        this.ignoregroupchat = config.ignoregroupchat;
        this.server = RED.nodes.getNode(config.server);
        serverctx = this.server.context();
        var cfgTimer = null;
        var node = this;
        var msgGot = 0;
        var sendMsg = function (message, contact, bubble) {
            var msg;
            if (bubble) {
                msg = {
                    payload: message,
                    contact: contact,
                    bubble: bubble
                };
            } else {
                msg = {
                    payload: message,
                    contact: contact
                };
            }
            node.send(msg);
        }
        var getFromContactThenSendMsg = function (message, fromJID, bubble) {
            // Get contact information from server
            node.server.rainbow.sdk.contacts.getContactByJid(fromJID).then((contact) => {
                if (contact) {
                    // Contact filter ?
                    if ((node.filterContact !== '') && (node.filterContact !== undefined)) {
                        if ((node.filterContact === contact.loginEmail) || (node.filterContact === contact.jid_im)) {
                            node.log("Rainbow : Contact filter OK !" + " cnx: " + JSON.stringify(node.server.name));
                        } else {
                            node.log("Rainbow : Contact filter blocked !" + " cnx: " + JSON.stringify(node.server.name));
                            return;
                        }
                    }
                    // Company filter ?
                    if ((node.filterCompany !== '') && (node.filterCompany !== undefined)) {
                        if (node.filterCompany === contact.companyId) {
                            node.log("Rainbow : Company id filter OK !" + " cnx: " + JSON.stringify(node.server.name));
                        } else {
                            node.log("Rainbow : Company id filter blocked !" + " cnx: " + JSON.stringify(node.server.name));
                            return;
                        }
                    }
                    node.log("Rainbow : sending message." + " cnx: " + JSON.stringify(node.server.name));
                    sendMsg(message, contact, bubble)
                } else {
                    node.warn("Rainbow : couldn't find user for jID : " + message.fromJid + " cnx: " + JSON.stringify(node.server.name));
                    sendMsg(message, {}, bubble)
                }
            });
        }
        node.log("Rainbow : getMessage node initialized :" + " cnx: " + JSON.stringify(node.server.name))
        var rainbow_onmessagereceivedGetMessage = function rainbow_onmessagereceivedGetMessage(message) {
            let filterOK = true;
            var fromJID = "";
            var bubble = null;
            node.log("Rainbow : onMessageReceived: " + JSON.stringify(node.server.name))
            msgGot++;
            node.status({
                fill: "green",
                shape: "ring",
                text: "Nb: " + msgGot
            });
            // Ignore asked ?
            if ((node.ignorechat) && ("chat" === message.type)) {
                node.log("Rainbow : ignore chat asked" + JSON.stringify(node.server.name));
                return;
            }
            if ((node.ignoregroupchat) && ("groupchat" === message.type)) {
                node.log("Rainbow : ignore groupchat asked" + JSON.stringify(node.server.name));
                return;
            }
            // RegExp filter ?
            if ((node.filter !== '') && (node.filter !== undefined)) {
                var regexp = new RegExp(node.filter, 'img');
                node.log("Rainbow : Apply filter :" + node.filter + " cnx: " + JSON.stringify(node.server.name));
                var res = JSON.stringify(message.content).match(regexp);
                node.log("Rainbow : Filter result:" + JSON.stringify(res) + " cnx: " + JSON.stringify(node.server.name))
                if (res == null) {
                    filterOK = false;
                    node.log("Rainbow : RegExp filter blocked !" + " cnx: " + JSON.stringify(node.server.name));
                    return;
                }
            }

            // Check if the message comes from a user
            if (message.type === "groupchat") {
                node.log("Rainbow : Message GROUPCHAT !" + " cnx: " + JSON.stringify(node.server.name));
                // Get the from JID
                if (message.fromBubbleJid) {
                    var bubbleJid = message.fromBubbleJid;
                    node.log("Rainbow : Message GROUPCHAT working with bubbleJid: " + bubbleJid + " cnx: " + JSON.stringify(node.server.name));
                    node.server.rainbow.sdk.bubbles.getBubbleByJid(bubbleJid).then(bubble => {
                        node.log("Rainbow : Message GROUPCHAT fromJid : " + message.fromBubbleUserJid + " cnx: " + JSON.stringify(node.server.name));
                        getFromContactThenSendMsg(message, message.fromBubbleUserJid, bubble)
                    });
                }
            } else {
                getFromContactThenSendMsg(message, message.fromJid, null)
            }
        };
        var getRainbowSDKGetMessageGetMessage = function getRainbowSDKGetMessageGetMessage() {
            if ((node.server.rainbow.sdk === undefined) || (node.server.rainbow.sdk === null)) {
                node.log("Rainbow SDK not ready (" + config.server + ")" + " cnx: " + JSON.stringify(node.server.name));
                cfgTimer = setTimeout(getRainbowSDKGetMessageGetMessage, 2000);
            } else {
                node.log("Rainbow SDK (" + config.server + ") Registering rainbow_onmessagereceived" + " cnx: " + JSON.stringify(node.server.name));
                node.server.rainbow.sdk.events.on('rainbow_onmessagereceived', rainbow_onmessagereceivedGetMessage);
                node.server.rainbow.sdkhandler.push({
                    evt: 'rainbow_onmessagereceived',
                    fct: rainbow_onmessagereceivedGetMessage
                });
                node.log("Rainbow : getMessage register for event 'rainbow_onmessagereceived'" + " cnx: " + JSON.stringify(node.server.name));
            }
        }
        getRainbowSDKGetMessageGetMessage();
        this.on('close', function () {
            // tidy up any state
            clearTimeout(cfgTimer);
        });
    }

    function notifyMessageRead(config) {
        RED.nodes.createNode(this, config);
        this.server = RED.nodes.getNode(config.server);
        this.filter = config.filter;
        var cfgTimer = null;
        var node = this;
        node.log("Rainbow : notifyMessageRead node initialized :" + JSON.stringify(node.server.name))
        var rainbow_onmessagereceiptreadreceived_notifyMessageRead = function (message) {
            node.log("Rainbow : onMessageReceiptReadReceived")
            if ((node.filter !== '') && (node.filter !== undefined)) {
                var regexp = new RegExp(node.filter, 'img');
                node.log("Rainbow : Apply filter :" + node.filter);
                var res = JSON.stringify(contact).match(regexp);
                node.log("Rainbow : Filter result:" + JSON.stringify(res))
                if (res == null) return;
            }
            var msg = {
                payload: {
                    ack: message
                }
            };
            node.send(msg);
        };
        var getRainbowSDKnotifyMessageRead = function getRainbowSDKnotifyMessageRead() {
            if ((node.server.rainbow.sdk === undefined) || (node.server.rainbow.sdk === null)) {
                node.log("Rainbow SDK not ready (" + config.server + ")");
                cfgTimer = setTimeout(getRainbowSDK, 2000);
            } else {
                node.server.rainbow.sdk.events.on('rainbow_onmessagereceiptreadreceived', rainbow_onmessagereceiptreadreceived_notifyMessageRead);
                node.server.rainbow.sdkhandler.push({
                    evt: 'rainbow_onmessagereceiptreadreceived',
                    fct: rainbow_onmessagereceiptreadreceived_notifyMessageRead
                });
                node.log("Rainbow : notifyMessageRead register for event 'rainbow_onmessagereceiptreadreceived'");
            }
        }
        getRainbowSDKnotifyMessageRead();
        this.on('close', function () {
            // tidy up any state
            clearTimeout(cfgTimer);
        });
    }

    function ackMessage(config) {
        RED.nodes.createNode(this, config);
        this.server = RED.nodes.getNode(config.server);
        this.destJid = config.destJid;
        var cfgTimer = null;
        var node = this;
        node.log("Rainbow : ackMessage node initialized :" + JSON.stringify(node.server.name))
        var getRainbowSDKackMessage = function () {
            if ((node.server.rainbow.sdk === undefined) || (node.server.rainbow.sdk === null)) {
                node.log("Rainbow SDK not ready (" + config.server + ")");
                cfgTimer = setTimeout(getRainbowSDKackMessage, 2000);
            }
        }
        getRainbowSDKackMessage();
        this.on('input', function (msg) {
            node.log("Ack msg " + util.inspect(msg));
            if (node.server.rainbow.logged === false) {
                node.log("Rainbow SDK not ready (" + config.server + ")");
            } else {
                node.server.rainbow.sdk.im.markMessageAsRead(msg.payload);
            }
            this.on('close', function () {
                // tidy up any state
                clearTimeout(cfgTimer);
            });
        });
    }

    function getContactsPresence(config) {
        RED.nodes.createNode(this, config);
        this.server = RED.nodes.getNode(config.server);
        this.filter = config.filter;
        var cfgTimer = null;
        var node = this;
        node.log("Rainbow : getContactsPresence node initialized :" + JSON.stringify(node.server.name))
        var rainbow_oncontactpresencechanged_getContactsPresence = function rainbow_oncontactpresencechanged_getContactsPresence(contact) {
            node.log("Rainbow : onContactPresenceChanged");
            if ((node.filter !== '') && (node.filter !== undefined)) {
                var regexp = new RegExp(node.filter, 'img');
                node.log("Rainbow : Apply filter :" + node.filter);
                node.log("Rainbow : on content :" + util.inspect(contact));
                var res = JSON.stringify(contact).match(regexp);
                node.log("Rainbow : Filter result:" + JSON.stringify(res))
                if (res === null) return;
            }
            var msg = {
                payload: {
                    loginemail: contact.loginEmail,
                    displayname: contact.displayName,
                    fromJid: contact.jid_im,
                    presence: contact.presence,
                    status: contact.status
                }
            };
            node.send(msg);
        };
        this.on('close', function () {
            // tidy up any state
            clearTimeout(cfgTimer);
        });
        var getRainbowSDKgetContactsPresence = function getRainbowSDKgetContactsPresence() {
            if ((node.server.rainbow.sdk === undefined) || (node.server.rainbow.sdk === null)) {
                node.log("Rainbow SDK not ready (" + config.server + ")");
                cfgTimer = setTimeout(getRainbowSDKgetContactsPresence, 2000);
            } else {
                node.server.rainbow.sdk.events.on('rainbow_oncontactpresencechanged', rainbow_oncontactpresencechanged_getContactsPresence);
                node.server.rainbow.sdkhandler.push({
                    evt: 'rainbow_oncontactpresencechanged',
                    fct: rainbow_oncontactpresencechanged_getContactsPresence
                });
                node.log("Rainbow : getContactsPresence register for event 'rainbow_oncontactpresencechanged'");
            }
        }
        getRainbowSDKgetContactsPresence();
    }

    function setPresence(config) {
        RED.nodes.createNode(this, config);
        this.server = RED.nodes.getNode(config.server);
        this.filter = config.filter;
        var cfgTimer = null;
        var node = this;
        node.log("Rainbow : setPresence node initialized login:" + JSON.stringify(node.server.rainbow.options.credentials.login, null, 2))
        var getRainbowSDKsetPresence = function getRainbowSDKsetPresence() {
            node.log("Rainbow : getRainbowSDKsetPresence login :" + JSON.stringify(node.server.rainbow.options.credentials.login, null, 2))
            if ((node.server.rainbow.sdk === undefined) || (node.server.rainbow.sdk === null)) {
                node.log("Rainbow SDK not ready (" + config.server + ")");
                cfgTimer = setTimeout(getRainbowSDKsetPresence, 2000);
            } else {
            }
        }
        getRainbowSDKsetPresence();
        this.on('input', function (msg) {
            node.log("Set presence " + util.inspect(msg));
            if (node.server.rainbow.logged === false) {
                node.log("Rainbow SDK not ready (" + config.server + ")");
            } else {
                var pres = node.server.rainbow.sdk.presence.RAINBOW_PRESENCE_ONLINE;
                switch (msg.payload) {
                    case 'online':
                        pres = node.server.rainbow.sdk.presence.RAINBOW_PRESENCE_ONLINE;
                        break;
                    case 'dnd':
                        pres = node.server.rainbow.sdk.presence.RAINBOW_PRESENCE_DONOTDISTURB;
                        break;
                    case 'away':
                        pres = node.server.rainbow.sdk.presence.RAINBOW_PRESENCE_AWAY;
                        break;
                    case 'invisible':
                        pres = node.server.rainbow.sdk.presence.RAINBOW_PRESENCE_INVISIBLE;
                        break;
                }
                node.log("set presence to " + pres);
                node.server.rainbow.sdk.presence.setPresenceTo(pres);
            }
        });
        this.on('close', function () {
            // tidy up any state
            clearTimeout(cfgTimer);
        });
    }


    function sendMessageToChannel(config) {
        RED.nodes.createNode(this, config);
        this.channelId = config.channelId;
        this.server = RED.nodes.getNode(config.server);
        var cfgTimer = null;
        var msgSent = 0;
        var node = this;
        node.log("Rainbow : sendMessageToChannel node initialized :" + " cnx: " + JSON.stringify(node.server.name))
        var getRainbowSDKSendMessageToChannel = function getRainbowSDKSendMessageToChannel() {
            if ((node.server.rainbow.sdk === undefined) || (node.server.rainbow.sdk === null)) {
                node.log("Rainbow SDK not ready (" + config.server + ")" + " cnx: " + JSON.stringify(node.server.name));
                cfgTimer = setTimeout(getRainbowSDKSendMessageToChannel, 2000);
            }
        }
        getRainbowSDKSendMessageToChannel();
        this.on('input', function (msg) {
            node.status({
                fill: "orange",
                shape: "dot",
                text: "will send..."
            });
            node.log("Rainbow : sendMessageToChannel to cnx: " + JSON.stringify(node.server.name));
            if (node.server.rainbow.logged === false) {
                node.log("Rainbow SDK not ready (" + config.server + ")" + " cnx: " + JSON.stringify(node.server.name));
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "not connected"
                });
            } else {
                let channel = (msg.payload.channel !== undefined ? msg.payload.channel : (node.channelId !== "" ? {id: node.channelId} : null));
                let message = msg.payload.content;
                let title = (msg.payload.title ? msg.payload.title : null);
                let url = (msg.payload.url ? msg.payload.url : null);
                if (channel !== undefined && null != channel && channel.id !== undefined && "" !== channel.id) {
                    node.log("Sending to id " + channel.id + " (" + message + " " + ") cnx: " + JSON.stringify(node.server.name));

                    node.server.rainbow.sdk.channels.publishMessageToChannel(
                        channel,
                        message,
                        title,
                        url);

                    msgSent++;
                    node.status({
                        fill: "green",
                        shape: "dot",
                        text: "Nb sent: " + msgSent
                    });
                } else {
                    let errorTxt = "no valid destination channel/id, looks like : " + util.inspect(channel);
                    node.status({
                        fill: "red",
                        shape: "dot",
                        text: errorTxt
                    });
                    node.error("Can't send to Channel: " + errorTxt);
                }
            }
            this.on('close', function () {
                // tidy up any state
                clearTimeout(cfgTimer);
            });
        });
    }

    function getMessageFromChannel(config) {
        RED.nodes.createNode(this, config);
        this.channelId = config.channelId;
        this.server = RED.nodes.getNode(config.server);
        serverctx = this.server.context();
        var cfgTimer = null;
        var node = this;
        var msgGot = 0;

        node.log("Rainbow : getMessageFromChannel node initialized :" + " cnx: " + JSON.stringify(node.server.name))
        var rainbow_onchannelmessagereceivedGetMessageFromChannel = function rainbow_onchannelmessagereceivedGetMessageFromChannel(message) {
            node.log("Rainbow : onChannelMessageReceived: " + JSON.stringify(node.server.name))

            if (node.channelId !== undefined && node.channelId !== "") {
                if (node.channelId !== message.channelId) {
                    // Not wanted channel, filtering
                    node.log("Rainbow : onChannelMessageReceived: ignoring message as not from good channel id");
                    return;
                }
            }

            msgGot++;
            node.status({
                fill: "green",
                shape: "ring",
                text: "Nb: " + msgGot
            });

            node.log("Rainbow : sending message." + " cnx: " + JSON.stringify(node.server.name));

            var msg;

            msg = {
                payload: message
            };
            node.send(msg);

        };
        var getRainbowSDKGetMessageFromChannel = function getRainbowSDKGetMessageFromChannel() {
            if ((node.server.rainbow.sdk === undefined) || (node.server.rainbow.sdk === null)) {
                node.log("Rainbow SDK not ready (" + config.server + ")" + " cnx: " + JSON.stringify(node.server.name));
                cfgTimer = setTimeout(getRainbowSDKGetMessageGetMessageFromChannel, 2000);
            } else {
                node.log("Rainbow SDK (" + config.server + ") Registering rainbow_onchannelmessagereceived" + " cnx: " + JSON.stringify(node.server.name));
                node.server.rainbow.sdk.events.on('rainbow_onchannelmessagereceived', rainbow_onchannelmessagereceivedGetMessageFromChannel);
                node.server.rainbow.sdkhandler.push({
                    evt: 'rainbow_onchannelmessagereceived',
                    fct: rainbow_onchannelmessagereceivedGetMessageFromChannel
                });
                node.log("Rainbow : getMessageFromChannel register for event 'rainbow_onchannelmessagereceived'" + " cnx: " + JSON.stringify(node.server.name));
            }
        }
        getRainbowSDKGetMessageFromChannel();
        this.on('close', function () {
            // tidy up any state
            clearTimeout(cfgTimer);
        });
    }

    function notifyEventReceived(config) {
        RED.nodes.createNode(this, config);
        this.server = RED.nodes.getNode(config.server);
        this.event = RED.nodes.getNode(config.event);
        let cfgTimer = null;
        let node = this;
        node.log("Rainbow : notifyMessageRead node initialized :" + JSON.stringify(node.server.name))
        let getCallback_onevent = function (eventName) {
            return function (...args) {
                node.log("Rainbow : rainbow_oneventreceived for event : " + eventName)
                if (node.event && node.event.event !== "NONE" && (node.event.event === eventName || node.event.event === "ALL")) {
                    /*
                    let dataStr = util.inspect(arguments);
                    node.log("////////////////////");
                    node.log("rainbow_oneventreceived() : " + eventName + " cnx: " + JSON.stringify(node.name) + ", data : " + dataStr);
                    node.log("////////////////////");
                    // */
                    node.log("Rainbow : send event : " + eventName)
                    let msg = {
                        payload: {
                            eventName,
                            "data": args
                        }
                    };
                    node.send(msg);
                } else {
                    node.log("Rainbow : ignore event : " + eventName)
                }
            };
        };

        let getRainbowSDKnotifyEventReceived = function getRainbowSDKnotifyEventReceived() {
            if ((node.server.rainbow.sdk === undefined) || (node.server.rainbow.sdk === null)) {
                node.log("Rainbow SDK not ready (" + config.server + ")");
                cfgTimer = setTimeout(getRainbowSDK, 2000);
            } else {
                node.log("Rainbow : notifyEventReceived will register for events.");
                let sdkPublicEventsName = node.server.rainbow.sdk.events.sdkPublicEventsName;
                for (const configKey in sdkPublicEventsName) {
                    let sdkEventName = sdkPublicEventsName[configKey];
                    let fn_rainbow_oneventreceived = getCallback_onevent(sdkEventName);
                    node.server.rainbow.sdk.events.on(sdkEventName, fn_rainbow_oneventreceived);
                    node.server.rainbow.sdkhandler.push({
                        evt: sdkEventName,
                        fct: fn_rainbow_oneventreceived
                    });
                    node.log("Rainbow : notifyEventReceived register for event : " + sdkEventName);
                }
            }
        }
        getRainbowSDKnotifyEventReceived();
        this.on('close', function () {
            // tidy up any state
            clearTimeout(cfgTimer);
        });
    }

    function eventSelectNode(n) {
        RED.nodes.createNode(this, n);
        this.event = n.event;
    }

    RED.httpAdmin.get("/rainbowsdkevents", function (req, res) {
        let node = this;

        // node.log("Rainbow : rainbowsdkevents will get events names.");
        let options = {
            "rainbow": {
                "host": "sandbox",
                "mode": "xmpp",
            },
            "xmpp": {
                "host": "",
                "port": "443",
                "protocol": "wss",
                "timeBetweenXmppRequests": "20",
                "raiseLowLevelXmppInEvent": false,
                "raiseLowLevelXmppOutReq": false
            },
            "credentials": {
                "login": "",
                "password": "",
            },
            "application": {
                "appID": "",
                "appSecret": ""

            },
            proxy: {
                host: undefined,
                port: 8080,
                protocol: undefined,
                user: undefined,
                password: undefined,
                secureProtocol: undefined //"SSLv3_method"
            },
            "logs": {
                "enableConsoleLogs": false,
                "enableFileLogs": false,
                "enableEventsLogs": false,
                "color": false,
                //"level": "info",
                "level": "info",
                "customLabel": "RainbowNone",
                "system-dev": {
                    "internals": false,
                    "http": false,
                },
                "file": {
                    "path": "c:/temp/",
                    "customFileName": "R-SDK-Node-None",
                    "zippedArchive": false
                }
            },
            "testOutdatedVersion": false,
            "intervalBetweenCleanMemoryCache": 1000 * 60 * 60 * 6, // Every 6 hours.
            "requestsRate": {
                "maxReqByIntervalForRequestRate": 600, // nb requests during the interval.
                "intervalForRequestRate": 60, // nb of seconds used for the calcul of the rate limit.
                "timeoutRequestForRequestRate": 600 // nb seconds Request stay in queue before being rejected if queue is full.
            },
            // IM options
            "im": {},
            "servicesToStart": {
                s2s: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._settings);
                presence: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._settings);
                contacts: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest);
                conversations: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: true
                }, //need services :  (that._xmpp, that._rest, that._contacts, that._bubbles, that._fileStorage, that._fileServer);
                im: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: true
                }, //need services :  (that._xmpp, that._conversations, that._bubbles, that._fileStorage);
                profiles: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest);
                groups: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest);

                bubbles: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest);
                telephony: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest, that._contacts, that._bubbles, that._profiles);
                channels: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest);
                admin: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest);
                fileServer: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest, that._fileStorage);
                fileStorage: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest, that._fileServer, that._conversations);
                calllog: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest, that._contacts, that._profiles, that._telephony);
                favorites: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest);
                alerts: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest);
                invitation: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services :  (that._xmpp, that._rest);
                settings: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services : ( XMPPService, _rest : RESTService)
                webinar: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services : ( )
                rbvoice: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services : ( )
                httpoverxmpp: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                }, //need services : ( )
                rpcoverxmpp: {
                    start_up: true,
                    optional: true,
                    logEntryParameters: false
                } //need services : ( )
            },
        };
        let sdkInstance = new _RainbowSDK(options);
        let sdkPublicEventsName = [];
        if ((sdkInstance === undefined) || (sdkInstance === null)) {
            //node.log("Rainbow SDK not ready (" + ")");
            sdkPublicEventsName = [];
        } else {
            //node.log("Rainbow : rainbowsdkevents will get events names.");
            sdkPublicEventsName = sdkInstance.events.sdkPublicEventsName;
        }
        res.json(sdkPublicEventsName);
    });

    RED.nodes.registerType("Send_IM", sendMessage);
    RED.nodes.registerType("Notified_IM", getMessage);
    RED.nodes.registerType("event-select", eventSelectNode);
    RED.nodes.registerType("Notified_Event", notifyEventReceived);

    RED.nodes.registerType("Notified_Presence", getContactsPresence);
    RED.nodes.registerType("Set_Presence", setPresence);

    RED.nodes.registerType("Notified_IM_Read", notifyMessageRead);
    RED.nodes.registerType("Ack_IM_Read", ackMessage);

    RED.nodes.registerType("Send_Channel", sendMessageToChannel);
    RED.nodes.registerType("Notified_Channel", getMessageFromChannel);

    RED.nodes.registerType("CnxState", getCnxState);
    RED.nodes.registerType("Login", login, {
        credentials: {
            username: {
                type: "text"
            },
            password: {
                type: "password"
            },
            appID: {
                type: "text"
            },
            appSecret: {
                type: "password"
            }
        }
    });
}
