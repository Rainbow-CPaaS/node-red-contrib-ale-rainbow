/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var util = require("util");
    var vm = require("vm");



    function sendResults(node,_msgid,msgs) {
        if (msgs == null) {
            return;
        } else if (!util.isArray(msgs)) {
            msgs = [msgs];
        }
        var msgCount = 0;
        for (var m=0; m<msgs.length; m++) {
            if (msgs[m]) {
                if (!util.isArray(msgs[m])) {
                    msgs[m] = [msgs[m]];
                }
                for (var n=0; n < msgs[m].length; n++) {
                    var msg = msgs[m][n];
                    if (msg !== null && msg !== undefined) {
                        if (typeof msg === 'object' && !Buffer.isBuffer(msg) && !util.isArray(msg)) {
                            msg._msgid = _msgid;
                            msgCount++;
                        } else {
                            var type = typeof msg;
                            if (type === 'object') {
                                type = Buffer.isBuffer(msg)?'Buffer':(util.isArray(msg)?'Array':'Date');
                            }
                            node.error(RED._("function.error.non-message-returned",{ type: type }))
                        }
                    }
                }
            }
        }
        if (msgCount>0) {
            node.send(msgs);
        }
    }

    function FunctionNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.name = config.name;
        this.func = config.func;
        var functionText = "var results = null;"+
                           "results = (function(msg){ "+
                              "var __msgid__ = msg._msgid;"+
                              "var node = {"+
                                 "log:__node__.log,"+
                                 "error:__node__.error,"+
                                 "warn:__node__.warn,"+
                                 "debug:__node__.debug,"+
                                 "trace:__node__.trace,"+
                                 "on:__node__.on,"+
                                 "status:__node__.status,"+
								 "sdk:__node__.sdk," +
                                 "send:function(msgs){ __node__.send(__msgid__,msgs);}"+
                              "};\n"+
                              this.func+"\n"+
                           "})(msg);";
        this.topic = config.topic;
        this.outstandingTimers = [];
        this.outstandingIntervals = [];
		this.server = RED.nodes.getNode(config.server);

        var sandbox = {
            console:console,
            util:util,
            Buffer:Buffer,
            Date: Date,
            RED: {
                util: RED.util
            },
            __node__: {
                log: function() {
                    node.log.apply(node, arguments);
                },
                error: function() {
                    node.error.apply(node, arguments);
                },
                warn: function() {
                    node.warn.apply(node, arguments);
                },
                debug: function() {
                    node.debug.apply(node, arguments);
                },
                trace: function() {
                    node.trace.apply(node, arguments);
                },
                send: function(id, msgs) {
                    sendResults(node, id, msgs);
                },
                on: function() {
                    if (arguments[0] === "input") {
                        throw new Error(RED._("function.error.inputListener"));
                    }
                    node.on.apply(node, arguments);
                },
                status: function() {
                    node.status.apply(node, arguments);
                },
				get sdk()  {
                    return node.server.rainbow.sdk ;
                }
            },
            context: {
                set: function() {
                    node.context().set.apply(node,arguments);
                },
                get: function() {
                    return node.context().get.apply(node,arguments);
                },
                keys: function() {
                    return node.context().keys.apply(node,arguments);
                },
                get global() {
                    return node.context().global;
                },
                get flow() {
                    return node.context().flow;
                }
            },
            flow: {
                set: function() {
                    node.context().flow.set.apply(node,arguments);
                },
                get: function() {
                    return node.context().flow.get.apply(node,arguments);
                },
                keys: function() {
                    return node.context().flow.keys.apply(node,arguments);
                }
            },
            global: {
                set: function() {
                    node.context().global.set.apply(node,arguments);
                },
                get: function() {
                    return node.context().global.get.apply(node,arguments);
                },
                keys: function() {
                    return node.context().global.keys.apply(node,arguments);
                }
            },
            setTimeout: function () {
                var func = arguments[0];
                var timerId;
                arguments[0] = function() {
                    sandbox.clearTimeout(timerId);
                    try {
                        func.apply(this,arguments);
                    } catch(err) {
                        node.error(err,{});
                    }
                };
                timerId = setTimeout.apply(this,arguments);
                node.outstandingTimers.push(timerId);
                return timerId;
            },
            clearTimeout: function(id) {
                clearTimeout(id);
                var index = node.outstandingTimers.indexOf(id);
                if (index > -1) {
                    node.outstandingTimers.splice(index,1);
                }
            },
            setInterval: function() {
                var func = arguments[0];
                var timerId;
                arguments[0] = function() {
                    try {
                        func.apply(this,arguments);
                    } catch(err) {
                        node.error(err,{});
                    }
                };
                timerId = setInterval.apply(this,arguments);
                node.outstandingIntervals.push(timerId);
                return timerId;
            },
            clearInterval: function(id) {
                clearInterval(id);
                var index = node.outstandingIntervals.indexOf(id);
                if (index > -1) {
                    node.outstandingIntervals.splice(index,1);
                }
            }
        };
        if (util.hasOwnProperty('promisify')) {
            sandbox.setTimeout[util.promisify.custom] = function(after, value) {
                return new Promise(function(resolve, reject) {
                    sandbox.setTimeout(function(){ resolve(value) }, after);
                });
            }
        }
        var context = vm.createContext(sandbox);
        try {
            this.script = vm.createScript(functionText, {
                filename: 'Function node:'+this.id+(this.name?' ['+this.name+']':''), // filename for stack traces
                displayErrors: true
                // Using the following options causes node 4/6 to not include the line number
                // in the stack output. So don't use them.
                // lineOffset: -11, // line number offset to be used for stack traces
                // columnOffset: 0, // column number offset to be used for stack traces
            });
            this.on("input", function(msg) {
                try {
                    var start = process.hrtime();
                    context.msg = msg;
                    this.script.runInContext(context);
                    sendResults(this,msg._msgid,context.results);

                    var duration = process.hrtime(start);
                    var converted = Math.floor((duration[0] * 1e9 + duration[1])/10000)/100;
                    this.metric("duration", msg, converted);
                    if (process.env.NODE_RED_FUNCTION_TIME) {
                        this.status({fill:"yellow",shape:"dot",text:""+converted});
                    }
                } catch(err) {
                    let index = 0;
                    let stack = [];
                    let errorMessage;
                    //remove unwanted part
                    if (err && err.stack) {
                        index = err.stack.search(/\n\s*at ContextifyScript.Script.runInContext/);
                        err.stack = err.stack.slice(0, index).split('\n').slice(0, -1).join('\n');
                        stack = err.stack.split(/\r?\n/);
                        //store the error in msg to be used in flows
                        msg.error = err;

                        let line = 0;
                        stack = err.stack.split(/\r?\n/);
                        if (stack.length > 0) {
                            while (line < stack.length && stack[line].indexOf("ReferenceError") !== 0) {
                                line++;
                            }

                            if (line < stack.length) {
                                errorMessage = stack[line];
                                var m = /:(\d+):(\d+)$/.exec(stack[line + 1]);
                                if (m) {
                                    var lineno = Number(m[1]) - 1;
                                    var cha = m[2];
                                    errorMessage += " (line " + lineno + ", col " + cha + ")";
                                }
                            }
                        }
                    } else {
                        msg.error = err;
                    }
                    if (!errorMessage) {
                        errorMessage = err.toString();
                    }
                    this.error(errorMessage, msg);
                }
            });
            this.on("close", function() {
                while (node.outstandingTimers.length > 0) {
                    clearTimeout(node.outstandingTimers.pop())
                }
                while (node.outstandingIntervals.length > 0) {
                    clearInterval(node.outstandingIntervals.pop())
                }
                this.status({});
            })
        } catch(err) {
            // eg SyntaxError - which v8 doesn't include line number information
            // so we can't do better than this
            this.error(err);
        }
    }
    
    RED.nodes.registerType("Rainbow_function",FunctionNode);
    RED.library.register("Rainbow_function");
    
}
