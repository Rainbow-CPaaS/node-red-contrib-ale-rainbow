module.exports = function(RED) {

  var connectTimer = null;
  var rainbowSDK = [];
  var rainbowSDKHandlers = [];
  var SDKoptions = [];
  var _RainbowSDK = null;
  var started = false;
  var stopping = false;
  var stopped = false;



  function allocateSDK(node, instanceId) {
    rainbowSDK[instanceId] = new _RainbowSDK (SDKoptions[instanceId]);
    node.log ("RainbowSDK instance "+instanceId + " allocated");
    if  (rainbowSDKHandlers[instanceId] != undefined && rainbowSDKHandlers[instanceId].length != 0) {
      node.log ("RainbowSDK : Re-registering event handlers");
      for (var i = 0, len = rainbowSDKHandlers[instanceId].length; i < len; i++) {
        handler = rainbowSDKHandlers[instanceId][i];
        rainbowSDK[instanceId].events.on(handler.evt, handler.fct);
      }
    } else {
      rainbowSDKHandlers[instanceId] = [];
    }
  }

  function releaseSDK(node, instanceId) {
    node.log ("Removing RainbowSDK (releaseSDK) instance "+instanceId);
    if (rainbowSDK[instanceId] === null) {return};
    delete rainbowSDK[instanceId];
    rainbowSDK[instanceId] = null;
  }
  
  function refreshSDK(node, instanceId) {
    node.log ("****************************************** IN");
    node.log ("Removing RainbowSDK (refreshSDK) instance "+instanceId);
    if (rainbowSDK[instanceId] === null) {return};
    stopping = true;
    rainbowSDK[instanceId].stop()
    .catch(function(e) {
      node.log("catched error during refreshSDK stop : " + JSON.stringify(e)); // "zut !"
    })
    .then((res) => 
      {
        //removeEventListeners(node, instanceId);
        // SDK has been stopped
        started = false;
        stopping = false;
        stopped = true;
        delete rainbowSDK[instanceId];
        rainbowSDK[instanceId] = null;
        node.log ("****************************************** OUT");
/*        
        allocateSDK(node, instanceId);
        // launch it again
        rainbowSDK[instanceId].start().then(() => {
          // SDK is connected to Rainbow
          started = true;
          stopped = false;
        });*/
      }
    );
  }

  function removeEventListeners (node, instanceId) {
    node.log ("Removing RainbowSDK event listeners for instance "+instanceId);
    if (rainbowSDK[instanceId] === null) {return};
    var handler = rainbowSDKHandlers[instanceId].pop();
     while(handler) {
       node.log("Remove listenner function :" + handler.fct );
      rainbowSDK[instanceId].events.eee.removeListener(handler.evt, handler.fct);
      handler = rainbowSDKHandlers[instanceId].pop();
     };
  }

  function login(config) {

    RED.nodes.createNode(this,config);
    var context = this.context();

    this.proxyHost = config.proxyHost;
    this.proxyPort = config.proxyPort;
    this.proxyProto = config.proxyProto;
    this.ackIM = config.ackIM;
    this.autoLogin = config.autoLogin;
    context.set('RBLoginState',false);

    var successiveCOnnectionFail = 0;
    var node = this;
    node.log("******************** IN login");

    node.log("Rainbow : login node initialized :" + this.id)

    SDKoptions[this.id] = {
      rainbow: {
        host: "official",
      },
      credentials: {
        login: node.credentials.username,
        password: node.credentials.password
      },
      logs: {
        enableConsoleLogs: true,            // Default: true
        enableFileLogs: false,              // Default: false
        file: {
            path: '/var/tmp/rainbowsdk/',   // Default path used
            level: 'debug'                  // Default log level used
        }
      },
      proxy: {
        host:config.proxyHost,
        port:config.proxyPort,
        protocol:config.proxyProto
      },
      im: {
        sendReadReceipt: config.ackIM   // True to send the the 'read' receipt automatically
      }
    };

    if (_RainbowSDK === null) {
      node.log("Rainbow : login node launch require **********");
      _RainbowSDK = require("rainbow-node-sdk");
    }

    node.log("config : "+JSON.stringify(config));
    node.log("ENV : http_proxy="+process.env.http_proxy);
    node.log("ENV : https_proxy="+process.env.https_proxy);
    var ConnectionFail = function ConnectionFail() {
      successiveCOnnectionFail++;
      if (config.proxyHost != "") {
        //We are configure to work behind a proxy.
        if (successiveCOnnectionFail == 5) {
          // 5 successive fail, let's try to change proxy config
          SDKoptions[node.id].proxy.host="";
          SDKoptions[node.id].proxy.port="";
          SDKoptions[node.id].proxy.proto="";
        }
        if (successiveCOnnectionFail == 10) {
          // Still failling, let's retry on default config
          successiveCOnnectionFail = 0;
          SDKoptions[node.id].proxy.host=config.proxyHost;
          SDKoptions[node.id].proxy.port=config.proxyPort;
          SDKoptions[node.id].proxy.proto=config.proxyProto;
        }
      }
    }

    if ((rainbowSDK[node.id] === undefined) || (rainbowSDK[node.id] === null)) {
      allocateSDK (node, node.id);

      var onLoginConnectionReady = function onLoginConnectionReady() {
        node.log("++++++++++++++++++++");
        node.log("onLoginConnectionReady()");
        node.log("++++++++++++++++++++");
        successiveCOnnectionFail = 0;
        started = true;
        stopped = stopping = false;
        context.set('RBLoginState',true);
      };
      rainbowSDK[node.id].events.on('rainbow_onready', onLoginConnectionReady);
      rainbowSDKHandlers[node.id].push ({evt:'rainbow_onready', fct:onLoginConnectionReady});
      node.log("Rainbow : login register for event 'rainbow_onready'");

      var onLoginConnectionStopped = function onLoginConnectionStopped() {
        node.log("--------------------");
        node.log("onLoginConnectionStopped()");
        node.log("--------------------");
        started = false;
        stopped = true;
        stopping = false;
        context.set('RBLoginState',false);
      };
      rainbowSDK[node.id].events.on('rainbow_onstopped', onLoginConnectionStopped);
      rainbowSDKHandlers[node.id].push ({evt:'rainbow_onstopped', fct:onLoginConnectionStopped});
      node.log("Rainbow : login register for event 'rainbow_onstopped'");

      var onLoginConnectionError = function onLoginConnectionError( error ) {
        var label = ( error ? (error.label ? error.label : error) : "unknown" );
        node.log("********************");
        node.log("onLoginConnectionError() : " + label );
        node.log("********************");
        started = false;
        stopped = true;
        stopping = false;
        context.set('RBLoginState',false);
        if (node.autoLogin) {
          node.log("onLoginConnectionError() - autologin mode");
          ConnectionFail();
          connectTimer = setTimeout(function() {
            refreshSDK(node, node.id);
          },5000);
        }
      }
      rainbowSDK[node.id].events.on('rainbow_onconnectionerror', onLoginConnectionError);
      rainbowSDKHandlers[node.id].push ({evt:'rainbow_onconnectionerror', fct:onLoginConnectionError});
      node.log("Rainbow : login register for event 'rainbow_onconnectionerror'");

      var onLoginRainbowError = function onLoginRainbowError( error ) {
        var label = ( error ? (error.label ? error.label : error) : "unknown" );
        node.log("////////////////////");
        node.log("onLoginRainbowError() : " + label );
        node.log("////////////////////");
        started = false;
        stopped = true;
        stopping = false;
        context.set('RBLoginState',false);
        if (node.autoLogin) {
          ConnectionFail();
          connectTimer = setTimeout(function() {
            refreshSDK(node, node.id);
          },5000);
        }
      };
      rainbowSDK[node.id].events.on('rainbow_onerror', onLoginRainbowError);
      rainbowSDKHandlers[node.id].push ({evt:'rainbow_onerror', fct:onLoginRainbowError});
      node.log("Rainbow : login register for event 'rainbow_onerror'");

      if (node.autoLogin) {
        node.log("RainbowSDK instance for autostart "+node.id);
        connectTimer = setTimeout(function () {
          rainbowSDK[node.id].start().then(() => {
            // SDK is connected to Rainbow
            started = true;
            stopped = false;
          });
        },3000);
      }
    }

    this.on('close', function(removed, done) {
      node.log("§§§§§§§§§§§§§§§§§§§§ Node-Red on 'close'- IN");

      if (removed) {
        node.log("Receive 'close' with flag removed set, trying to stop instance " + node.id);
        rainbowSDK[node.id].stop().then(() => {
          // SDK is connected to Rainbow
          started = false;
          stopped = true;
          removeEventListeners(node, node.id);
          releaseSDK(node, node.id);
          clearTimeout(connectTimer);
          node.log("Receive 'close' with flag removed set, instance " + node.id + " stopped and cleared");
          node.log("§§§§§§§§§§§§§§§§§§§§ Node-Red on 'close'- OUT (removed)");
          done();
        });        
      } else {
        node.log("Receive 'close', trying to restart (refresh) instance " + node.id);
        node.log("§§§§§§§§§§§§§§§§§§§§ Node-Red on 'close'- OUT");
        refreshSDK(node, node.id);
        done();
      }
      
    });
  }

  function getCnxState(config) {
    RED.nodes.createNode(this,config);
    this.server = RED.nodes.getNode(config.server);
    serverctx = this.server.context();
    //this.filter = config.filter;

    var cfgTimer = null;
    var node = this;

    node.log("Rainbow : getCnxState node initialized :" + this.id)

    node.status({fill:"grey",shape:"dot",text:"off"});

    // Update status
    var getRainbowSDKGetCnxState = function getRainbowSDKGetCnxState() {
      if ((rainbowSDK[config.server] === undefined) || (rainbowSDK[config.server] === null)) {
        node.log("Rainbow SDK not ready ("+config.server+")");
        cfgTimer = setTimeout (getRainbowSDKGetCnxState, 2000);
      } else {
        var onGetRainbowSDKConnectionOk = function onGetRainbowSDKConnectionOk() {
          node.status({fill:"orange",shape:"dot",text:"signin"});
          var msg = { payload:"rainbow_onconnected" };
          node.send(msg);
        };
        rainbowSDK[config.server].events.on('rainbow_onconnected', onGetRainbowSDKConnectionOk);
        rainbowSDKHandlers[config.server].push ({evt:'rainbow_onconnected', fct:onGetRainbowSDKConnectionOk});
        node.log("Rainbow : getCnxState register for event 'rainbow_onconnected'");

        var onGetRainbowSDKConnectionError = function onGetRainbowSDKConnectionError() {
          node.status({fill:"red",shape:"ring",text:"connection error"});
          var msg = { payload:"rainbow_onconnectionerror" };
          node.send(msg);
        };
        rainbowSDK[config.server].events.on('rainbow_onconnectionerror', onGetRainbowSDKConnectionError);
        rainbowSDKHandlers[config.server].push ({evt:'rainbow_onconnectionerror', fct:onGetRainbowSDKConnectionError});
        node.log("Rainbow : getCnxState register for event 'rainbow_onconnectionerror'");

        var onGetRainbowSDKError = function onGetRainbowSDKError() {
          node.status({fill:"red",shape:"ring",text:"config error"});
          var msg = { payload:"rainbow_onerror" };
          node.send(msg);
        };
        rainbowSDK[config.server].events.on('rainbow_onerror', onGetRainbowSDKError);
        rainbowSDKHandlers[config.server].push ({evt:'rainbow_onerror', fct:onGetRainbowSDKError});
        node.log("Rainbow : getCnxState register for event 'rainbow_onerror'");

        var onGetRainbowSDKReady = function onGetRainbowSDKReady() {
          node.status({fill:"green",shape:"ring",text:"connected"});
          var msg = { payload:"rainbow_onready" };
          node.send(msg);
        };
        rainbowSDK[config.server].events.on('rainbow_onready', onGetRainbowSDKReady);
        rainbowSDKHandlers[config.server].push ({evt:'rainbow_onready', fct:onGetRainbowSDKReady});
        node.log("Rainbow : getCnxState register for event 'rainbow_onready'");
      }
    }

    //Eventy from Button to triger Login
    this.on("input",function(msg) {
      node.log ("Got API order "+JSON.stringify(msg));
      node.log("Rainbow : GetCnxState input event: "+JSON.stringify(msg));
      try {
        switch (msg.payload) {
          case 'login': {
            node.status({fill:"red",shape:"ring",text:"init"});
            if (started) {
              refreshSDK(node, config.server);
            } else {
              releaseSDK(node, config.server);
              allocateSDK(node, config.server);
              rainbowSDK[config.server].start().then(() => {
                // SDK is connected to Rainbow
                started = true;
                stopped = false;
              });
            }
            break;
          }
          case'logout': {
            node.status({fill:"red",shape:"ring",text:"init"});
            if (started) {
              // Temporary modification due to issue #4
              rainbowSDK[config.server]._core._xmpp.stop(true)
              .then(() => {
                rainbowSDK[config.server].stop().then((res) => {
                  // Do something when the SDK has been stopped
                  stopping = false;
                  stopped = true;
                  delete rainbowSDK[config.server];
                  rainbowSDK[config.server] = null;
                  var msg = { payload:"stopped by logout" };
                  node.send(msg);
                });
              });
            }
            break;
          }
        }
      } catch(err) {
        this.error(err,msg);
      }
    });

    getRainbowSDKGetCnxState();

    this.on('close', function() {
      // tidy up any state
      clearTimeout (cfgTimer);
    });
  }

  RED.httpAdmin.post(
    "/Login/:id", 
    RED.auth.needsPermission("Notified_CnxState.write"), 
    function(req,res) {
      var node = RED.nodes.getNode(req.params.id);
      var state = req.params.state;
      node.log("Rainbow : Got /Login request: "+JSON.stringify(req.params));
      if (node != null) {
        try {
          var msg = {
            payload:"login",
            state:state
          };
          node.receive(msg);
          res.sendStatus(200);
        } catch(err) {
          res.sendStatus(500);
          node.error(RED._("Notified_CnxState.failed",{error:err.toString()}));
        }
      } else {
          res.sendStatus(404);
      }
    }
  );

  function sendMessage(config) {
    RED.nodes.createNode(this,config);
    this.destJid = config.destJid;
    this.server = RED.nodes.getNode(config.server);
    serverctx = this.server.context();
    var cfgTimer = null;
    var node = this;

    node.log("Rainbow : sendMessage node initialized :" + this.id)

    var getRainbowSDKSendMessage = function getRainbowSDKSendMessage() {
      if ((rainbowSDK[config.server] === undefined) || (rainbowSDK[config.server] === null)) {
        node.log("Rainbow SDK not ready ("+config.server+")");
        cfgTimer = setTimeout (getRainbowSDKSendMessage, 2000);
      }
    }
    getRainbowSDKSendMessage();

    this.on('input', function(msg) {
      node.log ("Get msg : "+JSON.stringify(msg));
      if (serverctx.get('RBLoginState') === false) {
        node.log("Rainbow SDK not ready ("+config.server+")");
      } else {
        let lang = msg.payload.lang ? msg.payload.lang : null;
        let content = msg.payload.alternateContent ? msg.payload.alternateContent : null;
        let subject = msg.payload.lang ? msg.payload.lang : null;
        if (msg.payload.destJid) {
          if (msg.payload.destJid.substring(0,5) === "room_") {
            rainbowSDK[config.server].im.sendMessageToBubbleJid(msg.payload.content,msg.payload.destJid, lang, content, subject);
          } else {
            rainbowSDK[config.server].im.sendMessageToJid(msg.payload.content,msg.payload.destJid, lang, content, subject);
          }
        } else {
          node.log("Rainbow SDK ("+config.server+" "+msg.payload.content + " "+node.destJid);
          if (node.destJid.substring(0,5) === "room_") {
            rainbowSDK[config.server].im.sendMessageToBubbleJid(msg.payload.content,node.destJid, lang, content, subject);
          } else {
            rainbowSDK[config.server].im.sendMessageToJid(msg.payload.content,node.destJid, lang, content, subject);
          }
        }
      }

      this.on('close', function() {
        // tidy up any state
        clearTimeout (cfgTimer);
      });
    });
  }

  function getMessage(config) {
    RED.nodes.createNode(this,config);
    this.filter = config.filter;
    this.filterContact = config.filterContact;
    this.filterCompany = config.filterCompany;
    this.server = RED.nodes.getNode(config.server);
    serverctx = this.server.context();

    var cfgTimer = null;
    var node = this;
    node.log("Rainbow : getMessage node initialized :" + this.id)

    var rainbow_onmessagereceivedGetMessage = function rainbow_onmessagereceivedGetMessage(message) {
      let filterOK = true;
      node.log("Rainbow : onMessageReceived")
      node.log("Rainbow : Message :"+JSON.stringify(message));

      // RegExp filter ?
      if ((node.filter != '') && (node.filter != undefined)) {
        var regexp = new RegExp(node.filter, 'img');
        node.log("Rainbow : Apply filter :"+node.filter);
        var res = JSON.stringify(message.content).match(regexp);
        node.log("Rainbow : Filter result:"+JSON.stringify(res))
        if (res == null) {
          filterOK = false;
          node.log("Rainbow : RegExp filter blocked !");
          return;
        }
      }

      // Filter with contact/company ?
      if ( ((node.filterContact != '') && (node.filterContact != undefined)) ||
        ((node.filterCompany != '') && (node.filterCompany != undefined)) ) {

          node.log("Rainbow : One filter needs to get contact informatopn from jId: " + message.fromJid);

        // Get contact information from server
        rainbowSDK[config.server]
//        ._core
//        ._contacts
        .contacts
        .getContactByJid(message.fromJid)
        .then((contact) => {
          if (contact) {

            // Contact filter ?
            if ( (node.filterContact != '') && (node.filterContact != undefined) ) {
              filterOK = false;
              if ( (node.filterContact === contact.loginEmail) || (node.filterContact === contact.jid_im) ) {
                filterOK = true;
                node.log("Rainbow : Contact filter OK !");
              } else {
                node.log("Rainbow : Contact filter blocked !");
                return;
              }
            }

            // Company filter ?
            if ( (node.filterCompany != '') && (node.filterCompany != undefined) ) {
              filterOK = false;
              if (node.filterCompany === contact.companyId) {
                filterOK = true;
                node.log("Rainbow : Company id filter OK !");
              } else {
                node.log("Rainbow : Company id filter blocked !");
                return;
              }
            }

            node.log("Rainbow : sending message.");

            var msg = { payload: message };
            node.send(msg);

          } else {
            node.warn("Rainbow : couldn't find user for jID : " + message.fromJid);
          }

        });      

      } else {
        if (!filterOK) {
          return;
        }
        node.log("Rainbow : sending message.");
        var msg = { payload: message };
        node.send(msg);
      }
    };

    var getRainbowSDKGetMessageGetMessage = function getRainbowSDKGetMessageGetMessage() {
      if ((rainbowSDK[config.server] === undefined) || (rainbowSDK[config.server] === null)) {
        node.log("Rainbow SDK not ready ("+config.server+")");
        cfgTimer = setTimeout (getRainbowSDKGetMessageGetMessage, 2000);
      } else {
        node.log("Rainbow SDK ("+config.server+") Registering rainbow_onmessagereceived");
        rainbowSDK[config.server].events.on ('rainbow_onmessagereceived',rainbow_onmessagereceivedGetMessage);
        rainbowSDKHandlers[config.server].push ({evt:'rainbow_onmessagereceived',fct:rainbow_onmessagereceivedGetMessage});
        node.log("Rainbow : getMessage register for event 'rainbow_onmessagereceived'");
      }
    }
    getRainbowSDKGetMessageGetMessage();

    this.on('close', function() {
      // tidy up any state
      clearTimeout (cfgTimer);
    });
  }

  function notifyMessageRead(config) {
    RED.nodes.createNode(this,config);
    this.server = RED.nodes.getNode(config.server);
    serverctx = this.server.context();
    this.filter = config.filter;

    var cfgTimer = null;
    var node = this;

    node.log("Rainbow : notifyMessageRead node initialized :"+this)

    var rainbow_onmessagereceiptreadreceived_notifyMessageRead = function (message) {
      node.log("Rainbow : onMessageReceiptReadReceived")
      if ((node.filter != '') && (node.filter != undefined)) {
        var regexp = new RegExp(node.filter, 'img');
        node.log("Rainbow : Apply filter :"+node.filter);
        node.log("Rainbow : on content :"+JSON.stringify(message));
        var res = JSON.stringify(contact).match(regexp);
        node.log("Rainbow : Filter result:"+JSON.stringify(res))
        if (res == null) return;
      }
      var msg = { payload: { ack:message }};
      node.send(msg);
    };

    var getRainbowSDKnotifyMessageRead = function getRainbowSDKnotifyMessageRead() {
      if ((rainbowSDK[config.server] === undefined) || (rainbowSDK[config.server] === null)) {
        node.log("Rainbow SDK not ready ("+config.server+")");
        cfgTimer = setTimeout (getRainbowSDK, 2000);
      } else {
        rainbowSDK[config.server].events.on('rainbow_onmessagereceiptreadreceived',rainbow_onmessagereceiptreadreceived_notifyMessageRead);
        rainbowSDKHandlers[config.server].push ({evt:'rainbow_onmessagereceiptreadreceived',fct:rainbow_onmessagereceiptreadreceived_notifyMessageRead});
        node.log("Rainbow : notifyMessageRead register for event 'rainbow_onmessagereceiptreadreceived'");
      }
    }
    getRainbowSDKnotifyMessageRead();

    this.on('close', function() {
      // tidy up any state
      clearTimeout (cfgTimer);
    });
  }


  function ackMessage(config) {
    RED.nodes.createNode(this,config);
    this.server = RED.nodes.getNode(config.server);
    serverctx = this.server.context();
    this.destJid = config.destJid;

    var cfgTimer = null;
    var node = this;

    node.log("Rainbow : ackMessage node initialized :"+this)

    var getRainbowSDKackMessage = function () {
      if ((rainbowSDK[config.server] === undefined) || (rainbowSDK[config.server] === null)) {
        node.log("Rainbow SDK not ready ("+config.server+")");
        cfgTimer = setTimeout (getRainbowSDKackMessage, 2000);
      }
    }
    getRainbowSDKackMessage();

    this.on('input', function(msg) {
      node.log ("Ack msg "+JSON.stringify(msg));
      if (serverctx.get('RBLoginState') === false) {
        node.log("Rainbow SDK not ready ("+config.server+")");
      } else {
        rainbowSDK[config.server].im.markMessageAsRead(msg.payload);
      }

      this.on('close', function() {
        // tidy up any state
        clearTimeout (cfgTimer);
      });
    });
  }

  function getContactsPresence(config) {
    RED.nodes.createNode(this,config);
    this.server = RED.nodes.getNode(config.server);
    serverctx = this.server.context();
    this.filter = config.filter;

    var cfgTimer = null;
    var node = this;

    node.log("Rainbow : getContactsPresence node initialized :"+this)

    var rainbow_oncontactpresencechanged_getContactsPresence = function rainbow_oncontactpresencechanged_getContactsPresence(contact) {
      node.log("Rainbow : onContactPresenceChanged");
      if ((node.filter != '') && (node.filter != undefined)) {
        var regexp = new RegExp(node.filter, 'img');
        node.log("Rainbow : Apply filter :"+node.filter);
        node.log("Rainbow : on content :"+JSON.stringify(contact));
        var res = JSON.stringify(contact).match(regexp);
        node.log("Rainbow : Filter result:"+JSON.stringify(res))
        if (res === null) return;
      }
      var msg = { payload: { loginemail:contact.loginEmail, displayname:contact.displayName, fromJid:contact.jid_im, presence:contact.presence, status:contact.status  }};
      node.send(msg);
    };

    this.on('close', function() {
      // tidy up any state
      clearTimeout (cfgTimer);
    });

    var getRainbowSDKgetContactsPresence = function getRainbowSDKgetContactsPresence() {
      if ((rainbowSDK[config.server] === undefined) || (rainbowSDK[config.server] === null)) {
        node.log("Rainbow SDK not ready ("+config.server+")");
        cfgTimer = setTimeout (getRainbowSDKgetContactsPresence, 2000);
      } else {
        rainbowSDK[config.server].events.on('rainbow_oncontactpresencechanged',rainbow_oncontactpresencechanged_getContactsPresence);
        rainbowSDKHandlers[config.server].push ({evt:'rainbow_oncontactpresencechanged',fct:rainbow_oncontactpresencechanged_getContactsPresence});
        node.log("Rainbow : getContactsPresence register for event 'rainbow_oncontactpresencechanged'");
      }
    }
    getRainbowSDKgetContactsPresence();
  }


  function setPresence(config) {
    RED.nodes.createNode(this,config);
    this.server = RED.nodes.getNode(config.server);
    serverctx = this.server.context();
    this.filter = config.filter;

    var cfgTimer = null;
    var node = this;

    node.log("Rainbow : setPresence node initialized :" + this.id);

    var getRainbowSDKsetPresence = function getRainbowSDKsetPresence() {
      if ((rainbowSDK[config.server] === undefined) || (rainbowSDK[config.server] === null)) {
        node.log("Rainbow SDK not ready ("+config.server+")");
        cfgTimer = setTimeout (getRainbowSDKsetPresence, 2000);
      } else {
      }
    }
    getRainbowSDKsetPresence();

    this.on('input', function(msg) {
      node.log ("Set presence "+JSON.stringify(msg));
      if (serverctx.get('RBLoginState') === false) {
        node.log("Rainbow SDK not ready ("+config.server+")");
      } else {
        var pres = rainbowSDK[config.server].presence.RAINBOW_PRESENCE_ONLINE;
        switch (msg.payload) {
          case 'online':
            pres = rainbowSDK[config.server].presence.RAINBOW_PRESENCE_ONLINE;
            break;
          case 'dnd':
            pres = rainbowSDK[config.server].presence.RAINBOW_PRESENCE_DONOTDISTURB;
            break;
          case 'away':
            pres = rainbowSDK[config.server].presence.RAINBOW_PRESENCE_AWAY;
            break;
          case 'invisible':
            pres = rainbowSDK[config.server].presence.RAINBOW_PRESENCE_INVISIBLE;
            break;
        }
        node.log("set presence to "+pres);
        rainbowSDK[config.server].presence.setPresenceTo(pres);
      }
    });

    this.on('close', function() {
      // tidy up any state
      clearTimeout (cfgTimer);
    });
  }

  RED.nodes.registerType("Send_IM",sendMessage);
  RED.nodes.registerType("Notified_IM",getMessage);
  RED.nodes.registerType("Notified_Presence",getContactsPresence);
  RED.nodes.registerType("Set_Presence",setPresence);
  RED.nodes.registerType("Notified_IM_Read",notifyMessageRead);
  RED.nodes.registerType("Ack_IM_Read",ackMessage);
  RED.nodes.registerType("CnxState",getCnxState);
  RED.nodes.registerType("Login",login,{
    credentials: {
        username: {type:"text"},
        password: {type:"password"}
    }
  });

}
