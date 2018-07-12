[{
    "id": "39952334.ceaee4",
    "type": "tab",
    "label": "Flow 1",
    "disabled": false,
    "info": ""
}, {
    "id": "b591749a.5ccbc8",
    "type": "Login",
    "z": "",
    "name": "vincent00",
    "autoLogin": false,
    "proxyHost": "192.168.254.49",
    "proxyPort": "8080",
    "proxyProto": "http",
    "ackIM": true
}, {
    "id": "bf0cc7a4.50435",
    "type": "Login",
    "z": "",
    "name": "Vincent01",
    "autoLogin": false,
    "proxyHost": "192.168.254.49",
    "proxyPort": "8080",
    "proxyProto": "http",
    "ackIM": true
}, {
    "id": "703c2aee.a704a4",
    "type": "Login",
    "z": "",
    "name": "vincent02",
    "autoLogin": false,
    "proxyHost": "192.168.254.49",
    "proxyPort": "8080",
    "proxyProto": "http",
    "ackIM": true
}, {
    "id": "9674ac71.bbb2f8",
    "type": "CnxState",
    "z": "39952334.ceaee4",
    "server": "b591749a.5ccbc8",
    "name": "vincent00",
    "x": 140,
    "y": 376,
    "wires": [[]]
}, {
    "id": "4cfcf213.9c165c",
    "type": "Notified_IM",
    "z": "39952334.ceaee4",
    "server": "b591749a.5ccbc8",
    "name": "",
    "filter": "",
    "filterContact": "",
    "filterCompany": "",
    "ignorechat": false,
    "ignoregroupchat": false,
    "x": 111,
    "y": 434,
    "wires": [["d410ae1.f2a705", "df453b11.d462d8", "1a3f0f1.5d9fbf1"]]
}, {
    "id": "d410ae1.f2a705",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "im received",
    "active": true,
    "tosidebar": true,
    "console": false,
    "tostatus": false,
    "complete": "payload",
    "x": 332,
    "y": 394,
    "wires": []
}, {
    "id": "206fc4b0.1e51b4",
    "type": "Send_IM",
    "z": "39952334.ceaee4",
    "server": "b591749a.5ccbc8",
    "name": "",
    "destJid": "",
    "x": 575,
    "y": 315,
    "wires": [],
    "inputLabels": ["\"hello guy\""]
}, {
    "id": "df453b11.d462d8",
    "type": "change",
    "z": "39952334.ceaee4",
    "name": "change FROM to TO",
    "rules": [{
        "t": "move",
        "p": "payload.fromJid",
        "pt": "msg",
        "to": "payload.destJid",
        "tot": "msg"
    }, {
        "t": "move",
        "p": "payload.toJid",
        "pt": "msg",
        "to": "payload.fromJid",
        "tot": "msg"
    }
    ],
    "action": "",
    "property": "",
    "from": "",
    "to": "",
    "reg": false,
    "x": 368,
    "y": 335,
    "wires": [["206fc4b0.1e51b4"]]
}, {
    "id": "42bfc42e.f375cc",
    "type": "Send_Makecall",
    "z": "39952334.ceaee4",
    "server": "b591749a.5ccbc8",
    "name": "makecall",
    "destNumber": "",
    "x": 1450,
    "y": 291,
    "wires": []
}, {
    "id": "9de04f86.bc8a78",
    "type": "function",
    "z": "39952334.ceaee4",
    "name": "dest number",
    "func": "node.log(\"Log build makecall\");\nnode.log(\"Log msg.payload.content : \" + msg.payload.content);\nlet contentSplitted = msg.payload.content.split(\" \");\nnode.log(\"Log contentSplitted : \" + contentSplitted);\n\nlet destnumber = contentSplitted[1];\nnode.log(\"Log destnumber : \" + destnumber);\nmsg.payload.destNumber=destnumber;\nreturn msg;",
    "outputs": 1,
    "noerr": 0,
    "x": 816,
    "y": 296,
    "wires": [["e80ff2bd.50fce8", "4a0aeafe.0fb46c"]]
}, {
    "id": "e80ff2bd.50fce8",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "makecall phonenumber",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 1276,
    "y": 362,
    "wires": []
}, {
    "id": "f4ac6739.ff774",
    "type": "Notified_CallUpdate",
    "z": "39952334.ceaee4",
    "server": "b591749a.5ccbc8",
    "name": "call update vincent00",
    "filter": "",
    "filterContact": "",
    "filterCompany": "",
    "ignorechat": false,
    "ignoregroupchat": false,
    "x": 266,
    "y": 861,
    "wires": [["121a25f4.46b0ba", "877796c3.bac74"]]
}, {
    "id": "121a25f4.46b0ba",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "vincent00 callupdate",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 546,
    "y": 822,
    "wires": []
}, {
    "id": "1eed4998.ab44be",
    "type": "Send_Releasecall",
    "z": "39952334.ceaee4",
    "server": "b591749a.5ccbc8",
    "name": "releasecall",
    "destNumber": "",
    "x": 1014,
    "y": 430,
    "wires": []
}, {
    "id": "1a3f0f1.5d9fbf1",
    "type": "switch",
    "z": "39952334.ceaee4",
    "name": "switch from im",
    "property": "payload.content",
    "propertyType": "msg",
    "rules": [{
        "t": "cont",
        "v": "makecall",
        "vt": "str"
    }, {
        "t": "cont",
        "v": "releasecall",
        "vt": "str"
    }, {
        "t": "cont",
        "v": "transfertcall",
        "vt": "str"
    }, {
        "t": "eq",
        "v": "holdcall",
        "vt": "str"
    }, {
        "t": "eq",
        "v": "retrievecall",
        "vt": "str"
    }, {
        "t": "cont",
        "v": "conferencecall",
        "vt": "str"
    }, {
        "t": "cont",
        "v": "forwardToDevice",
        "vt": "str"
    }, {
        "t": "cont",
        "v": "cancelForward",
        "vt": "str"
    }
    ],
    "checkall": "true",
    "repair": true,
    "outputs": 8,
    "x": 334,
    "y": 459,
    "wires": [["9de04f86.bc8a78"], ["16bd641d.6311d4", "c6ee1110.c9bb8"], ["eff0eb48.6e616"], ["e3d2f601.e1c3f8"], ["64609abe.737c2c"], ["fd569c88.5fe64"], ["b66dab27.60b5b"], ["1fb62e36.307b22", "7211420f.6be6ec"]]
}, {
    "id": "16bd641d.6311d4",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "switch im from road 2 releasecall",
    "active": true,
    "tosidebar": true,
    "console": false,
    "tostatus": false,
    "complete": "payload",
    "x": 810,
    "y": 372,
    "wires": []
}, {
    "id": "733174d3.629bec",
    "type": "CnxState",
    "z": "39952334.ceaee4",
    "server": "bf0cc7a4.50435",
    "name": "Vincent01",
    "x": 260,
    "y": 992,
    "wires": [[]]
}, {
    "id": "f4ecf804.70e1",
    "type": "Notified_CallUpdate",
    "z": "39952334.ceaee4",
    "server": "bf0cc7a4.50435",
    "name": "call update vincent 01",
    "filter": "",
    "filterContact": "",
    "filterCompany": "",
    "ignorechat": false,
    "ignoregroupchat": false,
    "x": 272,
    "y": 1056,
    "wires": [["c3cae9eb.9e75c8", "ed20fd0e.ef9908"]]
}, {
    "id": "c3cae9eb.9e75c8",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "vincent01 callupdate",
    "active": true,
    "tosidebar": true,
    "console": false,
    "tostatus": false,
    "complete": "payload",
    "x": 510,
    "y": 1002,
    "wires": []
}, {
    "id": "ed20fd0e.ef9908",
    "type": "switch",
    "z": "39952334.ceaee4",
    "name": "switch from callupdate event",
    "property": "payload.call.status.value",
    "propertyType": "msg",
    "rules": [{
        "t": "eq",
        "v": "incommingCall",
        "vt": "str"
    }
    ],
    "checkall": "true",
    "repair": false,
    "outputs": 1,
    "x": 790,
    "y": 1057,
    "wires": [["63b61c7c.ed0c04"]]
}, {
    "id": "63b61c7c.ed0c04",
    "type": "Send_Answercall",
    "z": "39952334.ceaee4",
    "server": "bf0cc7a4.50435",
    "name": "answercall",
    "destNumber": "",
    "x": 1105,
    "y": 1056,
    "wires": []
}, {
    "id": "877796c3.bac74",
    "type": "switch",
    "z": "39952334.ceaee4",
    "name": "switch status",
    "property": "payload.call.status.value",
    "propertyType": "msg",
    "rules": [{
        "t": "eq",
        "v": "held",
        "vt": "str"
    }, {
        "t": "eq",
        "v": "active",
        "vt": "str"
    }
    ],
    "checkall": "true",
    "repair": true,
    "outputs": 2,
    "x": 451,
    "y": 890,
    "wires": [["de87bba2.0268b"], ["564249b7.180808"]]
}, {
    "id": "41610407.34820c",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "transfertcall",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 1358,
    "y": 481,
    "wires": []
}, {
    "id": "c3141c50.efe758",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "save on hold",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload.call.status.value",
    "x": 863,
    "y": 879,
    "wires": []
}, {
    "id": "452b4ca1.b617d4",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "save active call",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload.call.status.value",
    "x": 870,
    "y": 938,
    "wires": []
}, {
    "id": "eff0eb48.6e616",
    "type": "function",
    "z": "39952334.ceaee4",
    "name": "test if active and held call are present to transfert",
    "func": "//node.log(\"Log message\");\nlet activecall = flow.get('activecall');\nlet heldcall = flow.get('heldcall');\nnode.log(\"Log activecall : \" + activecall);\nnode.log(\"Log heldcall : \" + heldcall);\nif (activecall && heldcall) {\n    msg.payload.okToTransfert = true;\n    msg.payload.activecall = activecall;\n    msg.payload.heldcall = heldcall;\n}\nreturn msg;",
    "outputs": 1,
    "noerr": 0,
    "x": 729,
    "y": 491,
    "wires": [["7b10d7d2.b023f8"]]
}, {
    "id": "7b10d7d2.b023f8",
    "type": "switch",
    "z": "39952334.ceaee4",
    "name": "transfert possible ?",
    "property": "payload.okToTransfert",
    "propertyType": "msg",
    "rules": [{
        "t": "eq",
        "v": "true",
        "vt": "jsonata"
    }, {
        "t": "eq",
        "v": "undefined",
        "vt": "jsonata"
    }, {
        "t": "eq",
        "v": "false",
        "vt": "jsonata"
    }
    ],
    "checkall": "true",
    "repair": true,
    "outputs": 3,
    "x": 1087,
    "y": 495,
    "wires": [["41610407.34820c", "50a55c2f.e27ddc"], ["6b15154f.d78124"], ["6b15154f.d78124"]]
}, {
    "id": "ff6e592a.fac93",
    "type": "inject",
    "z": "39952334.ceaee4",
    "name": "try transfert",
    "topic": "",
    "payload": "{}",
    "payloadType": "json",
    "repeat": "10",
    "crontab": "",
    "once": false,
    "onceDelay": 0.1,
    "x": 159,
    "y": 1262,
    "wires": [[]]
}, {
    "id": "6b15154f.d78124",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "No active and held call present",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 1404,
    "y": 527,
    "wires": []
}, {
    "id": "de87bba2.0268b",
    "type": "change",
    "z": "39952334.ceaee4",
    "name": "save heldcall",
    "rules": [{
        "t": "set",
        "p": "heldcall",
        "pt": "flow",
        "to": "payload.call",
        "tot": "msg"
    }
    ],
    "action": "",
    "property": "",
    "from": "",
    "to": "",
    "reg": false,
    "x": 644,
    "y": 879,
    "wires": [["c3141c50.efe758"]]
}, {
    "id": "564249b7.180808",
    "type": "change",
    "z": "39952334.ceaee4",
    "name": "save activecall",
    "rules": [{
        "t": "set",
        "p": "activecall",
        "pt": "flow",
        "to": "payload.call",
        "tot": "msg"
    }
    ],
    "action": "",
    "property": "",
    "from": "",
    "to": "",
    "reg": false,
    "x": 653,
    "y": 938,
    "wires": [["452b4ca1.b617d4"]]
}, {
    "id": "3a78727.af3ec8e",
    "type": "switch",
    "z": "39952334.ceaee4",
    "name": "held call ?",
    "property": "payload.heldcall",
    "propertyType": "msg",
    "rules": [{
        "t": "nnull"
    }, {
        "t": "null"
    }
    ],
    "checkall": "true",
    "repair": false,
    "outputs": 2,
    "x": 494,
    "y": 1357,
    "wires": [["219833cc.d33f8c", "b6433904.77adc"], ["dc561922.362538"]]
}, {
    "id": "219833cc.d33f8c",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "heldcall is not null",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 762,
    "y": 1353,
    "wires": []
}, {
    "id": "dc561922.362538",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "heldcall is null",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 746,
    "y": 1390,
    "wires": []
}, {
    "id": "4280cfb2.b4da8",
    "type": "change",
    "z": "39952334.ceaee4",
    "name": "retrieve heldcall",
    "rules": [{
        "t": "set",
        "p": "payload.heldcall",
        "pt": "msg",
        "to": "heldcall",
        "tot": "flow"
    }
    ],
    "action": "",
    "property": "",
    "from": "",
    "to": "",
    "reg": false,
    "x": 282,
    "y": 1366,
    "wires": [["3a78727.af3ec8e"]]
}, {
    "id": "e3eb4f61.a50d58",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "retrieve heldcall result",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 484,
    "y": 1420,
    "wires": []
}, {
    "id": "d75cfb4d.3b5d8",
    "type": "inject",
    "z": "39952334.ceaee4",
    "name": "clear data",
    "topic": "",
    "payload": "{}",
    "payloadType": "json",
    "repeat": "",
    "crontab": "",
    "once": true,
    "onceDelay": 0.1,
    "x": 109,
    "y": 31,
    "wires": [["77565ed8.81475"]]
}, {
    "id": "77565ed8.81475",
    "type": "function",
    "z": "39952334.ceaee4",
    "name": "clear data",
    "func": "flow.set('heldcall', undefined);\nflow.set('activecall', undefined);\n\nreturn msg;",
    "outputs": 1,
    "noerr": 0,
    "x": 276,
    "y": 31,
    "wires": [["5890a39a.8480bc"]]
}, {
    "id": "5890a39a.8480bc",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "retrieve clear data result",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 479,
    "y": 30,
    "wires": []
}, {
    "id": "3992bdf.6d9a2c2",
    "type": "switch",
    "z": "39952334.ceaee4",
    "name": "activecall call ?",
    "property": "payload.activecall",
    "propertyType": "msg",
    "rules": [{
        "t": "nnull"
    }, {
        "t": "null"
    }
    ],
    "checkall": "true",
    "repair": true,
    "outputs": 2,
    "x": 582,
    "y": 1160,
    "wires": [["5b00df6e.5c5cc8", "b6433904.77adc"], ["3a0c983f.7640c8"]]
}, {
    "id": "9ab4a4fd.ff78c8",
    "type": "change",
    "z": "39952334.ceaee4",
    "name": "retrieve activecall",
    "rules": [{
        "t": "set",
        "p": "payload.activecall",
        "pt": "msg",
        "to": "activecall",
        "tot": "flow"
    }
    ],
    "action": "",
    "property": "",
    "from": "",
    "to": "",
    "reg": false,
    "x": 358,
    "y": 1194,
    "wires": [["3992bdf.6d9a2c2"]]
}, {
    "id": "86fe94dd.c4a128",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "retrieve activecall result",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 602,
    "y": 1225,
    "wires": []
}, {
    "id": "5b00df6e.5c5cc8",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "activecall is not null",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 884,
    "y": 1165,
    "wires": []
}, {
    "id": "3a0c983f.7640c8",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "activecall is null",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 917,
    "y": 1208,
    "wires": []
}, {
    "id": "b6433904.77adc",
    "type": "join",
    "z": "39952334.ceaee4",
    "name": "If held and activecall present then transfert",
    "mode": "custom",
    "build": "array",
    "property": "payload",
    "propertyType": "msg",
    "key": "topic",
    "joiner": "\\n",
    "joinerType": "str",
    "accumulate": false,
    "timeout": "",
    "count": "2",
    "reduceRight": false,
    "reduceExp": "",
    "reduceInit": "",
    "reduceInitType": "",
    "reduceFixup": "",
    "x": 815,
    "y": 1263,
    "wires": [[]]
}, {
    "id": "c6ee1110.c9bb8",
    "type": "change",
    "z": "39952334.ceaee4",
    "name": "get activecall",
    "rules": [{
        "t": "set",
        "p": "payload.call",
        "pt": "msg",
        "to": "activecall",
        "tot": "flow"
    }
    ],
    "action": "",
    "property": "",
    "from": "",
    "to": "",
    "reg": false,
    "x": 671,
    "y": 431,
    "wires": [["1eed4998.ab44be"]]
}, {
    "id": "50a55c2f.e27ddc",
    "type": "Send_Transfertcall",
    "z": "39952334.ceaee4",
    "server": "b591749a.5ccbc8",
    "name": "transfertcall",
    "destNumber": "",
    "x": 1348.36669921875,
    "y": 435.25,
    "wires": []
}, {
    "id": "64609abe.737c2c",
    "type": "change",
    "z": "39952334.ceaee4",
    "name": "get heldcall",
    "rules": [{
        "t": "set",
        "p": "payload.call",
        "pt": "msg",
        "to": "heldcall",
        "tot": "flow"
    }
    ],
    "action": "",
    "property": "",
    "from": "",
    "to": "",
    "reg": false,
    "x": 610.75,
    "y": 635.75,
    "wires": [["38443502.4bdd1a"]]
}, {
    "id": "e3d2f601.e1c3f8",
    "type": "change",
    "z": "39952334.ceaee4",
    "name": "get activecall ",
    "rules": [{
        "t": "set",
        "p": "payload.call",
        "pt": "msg",
        "to": "activecall",
        "tot": "flow"
    }
    ],
    "action": "",
    "property": "",
    "from": "",
    "to": "",
    "reg": false,
    "x": 622.75,
    "y": 579.75,
    "wires": [["43ad1831.1999b"]]
}, {
    "id": "43ad1831.1999b",
    "type": "Send_Holdcall",
    "z": "39952334.ceaee4",
    "server": "b591749a.5ccbc8",
    "name": "",
    "destNumber": "",
    "x": 893.36669921875,
    "y": 582.5,
    "wires": []
}, {
    "id": "38443502.4bdd1a",
    "type": "Send_Retrievecall",
    "z": "39952334.ceaee4",
    "server": "b591749a.5ccbc8",
    "name": "",
    "destNumber": "",
    "x": 900.36669921875,
    "y": 636,
    "wires": []
}, {
    "id": "4a0aeafe.0fb46c",
    "type": "switch",
    "z": "39952334.ceaee4",
    "name": "is phonenumber defined",
    "property": "payload.destNumber",
    "propertyType": "msg",
    "rules": [{
        "t": "eq",
        "v": "undefined",
        "vt": "jsonata"
    }, {
        "t": "neq",
        "v": "undefined",
        "vt": "jsonata"
    }
    ],
    "checkall": "true",
    "repair": true,
    "outputs": 2,
    "x": 1172.36669921875,
    "y": 199,
    "wires": [["298f1e52.5ada1a"], ["42bfc42e.f375cc"]]
}, {
    "id": "298f1e52.5ada1a",
    "type": "change",
    "z": "39952334.ceaee4",
    "name": "set error message",
    "rules": [{
        "t": "set",
        "p": "payload.content",
        "pt": "msg",
        "to": "you have to define a fone number after the makecall",
        "tot": "str"
    }
    ],
    "action": "",
    "property": "",
    "from": "",
    "to": "",
    "reg": false,
    "x": 193.36669921875,
    "y": 283,
    "wires": [["df453b11.d462d8"]]
}, {
    "id": "2ef05d88.b2f4c2",
    "type": "CnxState",
    "z": "39952334.ceaee4",
    "server": "703c2aee.a704a4",
    "name": "Vincent02",
    "x": 280.75,
    "y": 1499.75,
    "wires": [[]]
}, {
    "id": "df5ed17e.5c1bb",
    "type": "Notified_CallUpdate",
    "z": "39952334.ceaee4",
    "server": "703c2aee.a704a4",
    "name": "call update vincent 02",
    "filter": "",
    "filterContact": "",
    "filterCompany": "",
    "ignorechat": false,
    "ignoregroupchat": false,
    "x": 292.75,
    "y": 1563.75,
    "wires": [["6ac62d53.879a8c", "cbbecc81.7cbd9"]]
}, {
    "id": "6ac62d53.879a8c",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "vincent01 callupdate",
    "active": true,
    "tosidebar": true,
    "console": false,
    "tostatus": false,
    "complete": "payload",
    "x": 530.75,
    "y": 1509.75,
    "wires": []
}, {
    "id": "cbbecc81.7cbd9",
    "type": "switch",
    "z": "39952334.ceaee4",
    "name": "switch from callupdate event",
    "property": "payload.call.status.value",
    "propertyType": "msg",
    "rules": [{
        "t": "eq",
        "v": "incommingCall",
        "vt": "str"
    }
    ],
    "checkall": "true",
    "repair": false,
    "outputs": 1,
    "x": 810.75,
    "y": 1564.75,
    "wires": [["977fa687.0e70c8"]]
}, {
    "id": "977fa687.0e70c8",
    "type": "Send_Answercall",
    "z": "39952334.ceaee4",
    "server": "703c2aee.a704a4",
    "name": "answercall",
    "destNumber": "",
    "x": 1125.75,
    "y": 1563.75,
    "wires": []
}, {
    "id": "fd569c88.5fe64",
    "type": "function",
    "z": "39952334.ceaee4",
    "name": "test if active and held call are present to transfert",
    "func": "//node.log(\"Log message\");\nlet activecall = flow.get('activecall');\nlet heldcall = flow.get('heldcall');\nnode.log(\"Log activecall : \" + activecall);\nnode.log(\"Log heldcall : \" + heldcall);\nif (activecall && heldcall) {\n    msg.payload.okToConference = true;\n    msg.payload.activecall = activecall;\n    msg.payload.heldcall = heldcall;\n}\nreturn msg;",
    "outputs": 1,
    "noerr": 0,
    "x": 695.75,
    "y": 692.25,
    "wires": [["44c7fd93.e0e02c"]]
}, {
    "id": "44c7fd93.e0e02c",
    "type": "switch",
    "z": "39952334.ceaee4",
    "name": "conference possible ?",
    "property": "payload.okToConference",
    "propertyType": "msg",
    "rules": [{
        "t": "eq",
        "v": "true",
        "vt": "jsonata"
    }, {
        "t": "eq",
        "v": "undefined",
        "vt": "jsonata"
    }, {
        "t": "eq",
        "v": "false",
        "vt": "jsonata"
    }
    ],
    "checkall": "true",
    "repair": true,
    "outputs": 3,
    "x": 1063.75,
    "y": 696.25,
    "wires": [["917e197c.f51b78", "2427301c.282b98"], ["9336091f.707958"], ["9336091f.707958"]]
}, {
    "id": "917e197c.f51b78",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "conferencecall",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 1334.75,
    "y": 682.25,
    "wires": []
}, {
    "id": "9336091f.707958",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "No active and held call present",
    "active": true,
    "tosidebar": true,
    "console": true,
    "tostatus": false,
    "complete": "payload",
    "x": 1370.75,
    "y": 728.25,
    "wires": []
}, {
    "id": "2427301c.282b98",
    "type": "Send_ConferenceCall",
    "z": "39952334.ceaee4",
    "server": "b591749a.5ccbc8",
    "name": "conferencecall",
    "destNumber": "",
    "x": 1360.36669921875,
    "y": 616.9166870117188,
    "wires": []
}, {
    "id": "c8ad0ba2.fae3c",
    "type": "Send_ForwardToDevice",
    "z": "39952334.ceaee4",
    "server": "b591749a.5ccbc8",
    "name": "forwardToDevice",
    "destNumber": "",
    "x": 1077.36669921875,
    "y": 781.75,
    "wires": []
}, {
    "id": "171e5fe9.cab538",
    "type": "change",
    "z": "39952334.ceaee4",
    "name": "get activecall",
    "rules": [{
        "t": "set",
        "p": "payload.activecall",
        "pt": "msg",
        "to": "activecall",
        "tot": "flow"
    }
    ],
    "action": "",
    "property": "",
    "from": "",
    "to": "",
    "reg": false,
    "x": 792.75,
    "y": 761.25,
    "wires": [["c8ad0ba2.fae3c"]]
}, {
    "id": "b66dab27.60b5b",
    "type": "function",
    "z": "39952334.ceaee4",
    "name": "phonenumber",
    "func": "node.log(\"Log build forwardToDevice\");\nnode.log(\"Log msg.payload.content : \" + msg.payload.content);\nlet contentSplitted = msg.payload.content.split(\" \");\nnode.log(\"Log contentSplitted : \" + contentSplitted);\n\nlet phonenumber = contentSplitted[1];\nnode.log(\"Log destnumber : \" + phonenumber);\nmsg.payload.phonenumber=phonenumber;\nreturn msg;",
    "outputs": 1,
    "noerr": 0,
    "x": 492.75,
    "y": 762.25,
    "wires": [["171e5fe9.cab538"]]
}, {
    "id": "1fb62e36.307b22",
    "type": "Send_CancelForward",
    "z": "39952334.ceaee4",
    "server": "b591749a.5ccbc8",
    "name": "cancelForward",
    "destNumber": "",
    "x": 281.36669921875,
    "y": 746.75,
    "wires": []
}, {
    "id": "7211420f.6be6ec",
    "type": "debug",
    "z": "39952334.ceaee4",
    "name": "",
    "active": true,
    "tosidebar": true,
    "console": false,
    "tostatus": false,
    "complete": "false",
    "x": 142.36666870117188,
    "y": 805.75,
    "wires": []
}
]
