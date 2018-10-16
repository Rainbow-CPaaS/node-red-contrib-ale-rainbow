# Alcatel Lucent Enterprise Rainbow nodes for node-red.

Here is the list of the changes and features provided by the **node-red-contrib-ale-rainbow**


## [1.3.5] - 2018-09-07
Update documentation

## [1.3.4] - 2018-09-03
- Login node: add appID and secret which will be mandatory soon in production
- Send_IM node: allow to also modify Bubble's customData (only for Bubble owner)
Thanks to loloj
- Send_Channel and Notified_Channel nodes added
- Add some icons for Rainbow Nodes...

## [1.3.3] - 2018-07-00
- Add new node Rainbow_function to allow to call a specific API in Rainbow Node.js SDK
Thanks to Christian Foricher

## [1.3.2] - 2018-05-30
- Remove JSON.stringify also for Notify IM
- Add counter also for IM messages got

## [1.3.1] - 2018-04-11
- Remove JSON.stringify logs which crashed (circular)
- Add counter to Send_IM node

## [1.3.0] - 2018-04-11
- Jump to 1.3 version: multi user supported (needs also dependency rainbow-node-sdk v1.39.0)
- thanks to Loic Jehanno for his help !
- git issues/4 corrected also (Error while Deploy (stop/start) with Contacts._onRosterPresenceChanged in dependency)

## [1.2.8] - 2018-03-28
- issues/7 on git: correction for receiving msg from room
- Notified_IM: 2 options ignorechat and ignoregroupchat to allow to filter one to one chat, and/or group chat
- Notified_IM: add some documentation about "fromBubbleUserJid" and "type" in the message
- Notified_IM: in case od "groupchat" type, also send the bubble in the payload

## [1.2.7] - 2018-03-05
- Notified_IM now also give payload.contact which contains sender informations
- Dependency update: SDK Node.js

## [1.2.6] - 2018-02-03
- Add some documentation on usable parameters got from Notified_IM
- Add Markdown support (alternative content)

## [1.2.5] - 2018-01-24
- Not reproductible: closing issue onRainbowError() : XMPPERROR #5
- Rewite some docs in nodes to match new node-red format, update the README.md
- Refactor code
- There are "Error while Deploy (stop/start)" which should be corrected with next dependency version (Rainbow Node.js SDK)
- Added in Notified_IM node 2 filters: filterContact and filterCompany to only accept message from a user of from a company
- Corrected issue: RegExp Filter typo #6

## [1.2.4] - 2018-01-19
- Corrections for https://github.com/Rainbow-CPaaS/node-red-contrib-ale-rainbow/issues/3 to allow msg in a bubble
- Code refactoring: add missing state events, add started/stopped states
- implement also new on "close" from node-red

## [1.2.2] - [1.2.3] - 2018-01-18
- Do some corrections in package.json

## [1.2.1] - 2018-01-16
- Add this Changelog
- Improve cleanup: stop node.js SDK also to close event socket
- Correction for issue 'Error stopping node #2'
  https://github.com/Rainbow-CPaaS/node-red-contrib-ale-rainbow/issues/2
  now event cleanup no more returns an error (and is done).