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

1. Node.js  v8.10.0 and above
2. Node-RED v1.0.4 and above

## Run from sources
* Installation On windows platform.

Install node-red and start it:

```

npm install -g node-red
node-red

```

Open the flow in a browser on the url provided in start logs:  
`30 Mar 14:36:40 - [info] Server now running at` [http://127.0.0.1:1880/](http://127.0.0.1:1880/)   
Manage palette from right menu to install node-red-contrib-ale-rainbow.
---
**At this step ALE Rainbow's node are available from official distribution.  
So You must do a trick to spot on the a cloned sources retrieved from github.** 
---
Get sources from github.com:
```

git clone https://USERGITLOGIN:USERGITPASSWDURLENCODED@github.com/Rainbow-CPaaS/node-red-contrib-ale-rainbow

```

Once the repository is cloned, open a cmd and launch the following command in the **project's folder** to install depends and links it to generals npm lib:

```

npm install
npm update
npm link 

```


Go to node-red's installation folder and link to previous project:

```

cd %USERPROFILE%\.node-red
rmdir node_modules\node-red-contrib-ale-rainbow
npm link node-red-contrib-ale-rainbow

```

Start node red with the ALE Rainbow nodes custom are available:

```

node-red

```
