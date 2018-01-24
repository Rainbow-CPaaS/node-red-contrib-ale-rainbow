node-red-contrib-ale-rainbow
==========================
## Description
Alcatel Lucent Enterprise Rainbow nodes for node-red.

Welcome to the Alcatel-Lucent Enterprise Rainbow nodes for node-red!

The Alcatel-Lucent Enterprise (ALE) Rainbow nodes for node-red is a node-red package for connecting your flow to Rainbow, The FREE app to text, call, video and share instantly with your business community.
- About [Rainbow](https://www.openrainbow.com).
- Create your account for free [now](https://web.openrainbow.com/1.21.4/#/subscribe?utm_source=www.npmjs.com/package/node-red-contrib-ale-rainbow&utm_campaign=NodeRed&utm_content=README.md) !
- To connect your flow to Rainbow, contact by email [support@openrainbow.com](mailto:support@openrainbow.com?subject=#API : Get access to Rainbow Sandbox).

## Requirements

1. Node.js v4.5.0 and above
2. Node-RED v0.12.0 and above

## Install via NPM

From inside your node-red directory:
```
npm install node-red-contrib-ale-rainbow
```

## What's inside?
It includes seven nodes:

1. ```RBLogin``` : a unique CONFIG node that holds connection configuration for Rainbow. As a node-red 'config' node, it cannot be added to a graph, but it acts as a singleton object that gets created in the the background when you add any other 'ALE Rainbow' node and configure it accordingly. You must configure here credentials to be used to connect to Rainbow cloud services and optionnaly, an HTTP Proxy.
Note : for know, only a single connection to Rainbow is supported.

2. ```RBSend_IM``` : Output node to send IM to a Rainbow identity (User or Bubble).
You can configure a default recipient for outgoing IM in node parameters.
Accepted message format is:
```
{  
   "payload":{  
      "content":"Hello world",
      "destJid":"29487a323b00403297c1d2984b2f1d60@openrainbow.com",
   }
}
```
- ```content``` is: IM content (string).
- ```destJid``` is : Recipient JID (Jabber ID) for the IM. If not specified, Desintation JID configured at node level is used.


3. ```RBNotified_IM``` : Input node to listen for new incoming IM from a Rainbow user or Bubble.
You can add filters to select which message may pass through (by RegExp, user or company).
Delivered message format is:
```
{  
   "payload":{  
      "content":"Hello world",
      "fromJid":"29487a323b00403297c1d2984b2f1d60@openrainbow.com",
   }
}
```
- ```content``` is: IM content (string).
- ```fromJid``` is : Originator JID (Jabber ID) of the IM. Can be used to reply by coping this value for destJid.

4. ```RBNotified_IM_Read``` : Input node to listen for message acknowledge.

var msg = { payload: { loginemail:contact.loginEmail, displayname:contact.displayName, fromJid:contact.jid_im, presence:contact.presence, status:contact.status  }};

5. ```RBAck_IM_Read``` : Output node to Ack (mark as read) IM received.

⚠ msg.payload should contain the complete message received with Notified_IM node.
Race condition could occured. It is highly recommanded to add delay between IM reception and ack.

6. ```RBNotified_Presence``` : Input node to listen for presence update of contact list.
Delivered message format is:
```
{  
   "payload":{  
      "loginemail":"alice.paul@sample.com",
      "displayname":"Alice Paul",
      "fromJid":"29487a323b00403297c1d2984b2f1d60@openrainbow.com",
      "presence":"busy",
      "status":"audio";
   }
}
```
- ```loginemail``` is: Contact loginemail identifier.
- ```displayname``` is: Contact plain text display name.
- ```fromJid``` is : JID (Jabber ID) of the contact.
- ```presence``` is: presence (can be offline, online, busy, xa, away) xa means dnd, busy means on the phone.
- ```status``` is: presence sub status
  - ```When presence is online``` can be mobile
  - ```When presence is busy``` can be presentation, audio, video or sharing

  7. ```RBSet_Presence``` : Output node to set own presence .
  Accepted message format is:
  ```
  {  
     "payload":"busy"  
  }
  ```
  - ```payload``` is: presence (can be online, dnd, away or invisible).

  8. ```RBGet_CnxState``` : Input node to get connection state .
  Delivered message format is:
  ```
  {  
     "payload": "rainbow_onconnectionok"  
  }
  ```
  - ```payload``` is: connection status.

  Connection status can be :
  -  ```rainbow_onconnectionok``` :  Fired when the connection is successfull with Rainbow (signin complete)
  -  ```rainbow_onready``` : Fired when the SDK is connected to Rainbow and ready to be used
  -  ```rainbow_onconnectionerror``` : Fired when the connection can t be done with Rainbow (ie. issue on sign-in)
  -  ```rainbow_onerror``` :  Fired when something goes wrong (ie: bad 'configurations' parameter...)
