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
It includes nine nodes:

1. **```RBLogin```** : a unique CONFIG node that holds connection configuration for Rainbow. As a node-red 'config' node, it cannot be added to a graph, but it acts as a singleton object that gets created in the background when you add any other 'ALE Rainbow' node and configure it accordingly. You must configure here the sandbox or official system, and the credentials to be used to connect to Rainbow cloud services and optionnaly, an HTTP Proxy.  
Since v1.3.0 and it's dependency rainbow-node-sdk v1.39.0 connection to Rainbow is well supported. Thanks to Loic Jehanno for his work.  
**End of september 2018, a valid AppID/secret will be mandatory**.  Please check the HUB to create one: [HUB](https://hub.openrainbow.com)

2. **```RBSend_IM```** : Output node to send IM to a Rainbow identity (User or Bubble).  
You can configure a default recipient for outgoing IM in node parameters.  
Bubble only: **and only if user is Bubble owner** :
`msg.payload.customData` if given (and if user is the Bubble owner), will also set the Bubble's customData.  
Accepted message format is:
```
{  
   "payload":{  
      "content":"Hello world",
      "destJid":"29487a323b00403297c1d2984b2f1d60@openrainbow.com",
      ...
   }
}
```
- ```content``` is: IM content (string).
- ```destJid``` is : Recipient JID (Jabber ID) for the IM. If not specified, Destination JID configured at node level is used.


3. **```RBNotified_IM```** : Input node to listen for new incoming IM from a Rainbow user or Bubble.  
You can add filters to select which message may pass through (by type, RegExp, user or company).  
Delivered message format is:
```
{  
   "payload":{  
      "content":"Hello world",
      "fromJid":"29487a323b00403297c1d2984b2f1d60@openrainbow.com",
      ...
   },
   "contact": {...},
   "bubble": {}
}
```
- ```content``` is: IM content (string).
- ```fromJid``` is : Originator JID (Jabber ID) of the IM. Can be used to reply by copying this value for destJid.  
Others are described in the node and here [Message](https://hub.openrainbow.com/#/documentation/doc/sdk/node/api/message).

4. **```RBNotified_IM_Read```** : Input node to listen for message acknowledge.  
Delivered message format is:

```
{
  payload: {
    ack: message
};
```
with `message` described here [Message](https://hub.openrainbow.com/#/documentation/doc/sdk/node/api/message)

5. **```RBAck_IM_Read```** : Output node to Ack (mark as read) IM received.

⚠ msg.payload should contain the complete `message` received with Notified_IM node.  
Race condition could occur. It is highly recommended to add delay between IM reception and ack.

6. **```RBNotified_Presence```** : Input node to listen for presence update of contact list.
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

7. **```RBSet_Presence```** : Output node to set own presence .
  Accepted message format is:
  ```
  {  
     "payload":"away"  
  }
  ```
  - ```payload``` is: presence (can be online, dnd, away or invisible).

8. **```RBGet_CnxState```** : Input node to get connection state .
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

9. **```Rainbow_function```** : A JavaScript function rainbow to run against <a target="_blank" href="https://www.npmjs.com/package/rainbow-node-sdk">Rainbow Sdk</a> by the node.</p>

10. **```RBSend_Channel```** : Output node to send a message to a Rainbow channel.  
You can configure a default channel for outgoing message in node parameters.  
Accepted message format is:
```
{  
   "payload":{  
      "message":"this is a message",
      "channel":{
        "id":"29487a323b00403297c1d2984b2f1d60",
        ...
      },
      "title":"For you to know, this is the HUB",
      "url":"https://hub.openrainbow.com"
      ...
   }
}
```
- ```message``` is: message content (string).
- ```channel``` is : channel (Channel). See [Channel](https://hub.openrainbow.com/#/documentation/doc/sdk/node/api/channel) for the structure. If not specified, id configured at node level is used.
- ```title``` is: message title (string, optional).
- ```url``` is: url (string, optional).


11. **```RBNotified_Channel```** : Input node to listen for new incoming message from a Rainbow Channel.  
You can configure a default channel for incoming message in node parameters.  
Delivered message format is:
```
{  
   "payload":{
      "messageId":"60034F1B3CF20",
      "fromJid":"01234a323b00403297c1d2984b2f1d60@openrainbow.com",
      "message":"Hello world",
      "title":"HUB news",
      "url":"https://hub.openrainbow.com",
      "channel":{
        "name": "The HUB",
        "id": '5b1541d01578105ad113f9d1',
        "visibility": 'company',
        ...
      }
      ...
   }
}
```
- ```messageId``` is: Id of the message (string).
- ```fromJid``` is : Originator JID (Jabber ID) of the Message.
- ```message``` is: message content (string).
- ```title``` is: message title (string, optional).
- ```url``` is: url (string, optional).
- ```date``` is: published Date (Date).
- ```channel``` is : channel which got the message (Channel). See [Channel](https://hub.openrainbow.com/#/documentation/doc/sdk/node/api/channel) for the structure.

