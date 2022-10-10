# Alcatel Lucent Enterprise Rainbow nodes for node-red.

Here is the list of the changes and features provided by the **node-red-contrib-ale-rainbow**

## [1.82.4] - 2022-10-10

- Update Rainbow SDK dependency (2.16.0-lts.0)

## [1.82.3] - 2022-09-06

- Fixing Rainbow SDK dependency (2.10.0-lts.10)
- Implementation of a new option : sendRetryOnReconnect
  Keep message to send in a buffer when the connection is down and re-send it when connection is up again.
  The buffer length is limited to 500 entries.
  The resent message content can be prefixed with a configurable text. The keywork :DATE: can be used inside and will be
  replaced by the date of initial message.

## [1.82.1] - 2022-06-15

- Update for jenkins.

## [1.82.0] - 2022-06-15

- Add logs when a `rainbow_onxmpperror` event is received.

## [1.81.0] - 2021-11-24

- Add sdkLogInternals boolean to manage the option "internals" provided to Rainbow Node SDK (only with earlier SDK LTS
  2.1.0 and STS 2.6)
- Add sdkLogHttp boolean to manage the option "internals" provided to Rainbow Node SDK (only with earlier SDK LTS 2.1.0
  and STS 2.6)
- Add urgency parameter to sendMessage component (only with earlier SDK LTS 2.1.0 and STS 2.6).
- Add a new node to listen every rainbow SDK public event. It needs Rainbow Node SDK 2.6.2 or earlier.

## [1.80.0] - 2020-11-30

- Add in node CnxState a second output with the log of the law layer Rainbow Node SDK (The logs are retrieved from an
  event publisher).
- Split the log's options in console, file, event.

## [1.69.11] - 2020-04-01

- Same as version 1.69.1 (work on build process)

## [1.69.1] - 2020-03-31

- update documentation
- update cnx node to allow the configuration of the rainbow-node-sdk from the flow :
    * sdkLog to activate the log on console and also in a file `YYYY-MM-DD-rainbowsdk.log` in `%TEMP%` folder.
    * messageMaxLength to set the max size of a message sent in XMPP engine (Note: there is a limitation to 1024 on
      server side)
    * sendMessageToConnectedUser to allow the connected user to be the destination of a sent message. When setted to
      false, it avoid a bot to discuss with himself and deadlock.
    * conversationsRetrievedFormat to allow to set the quantity of datas retrieved when SDK get conversations from
      server. Value can be "small" of "full"
    * storeMessages Define a server side behaviour with the messages sent. When true, the messages are stored, else
      messages are only available on the fly. They can not be retrieved later.
    * nbMaxConversations parameter to set the maximum number of conversations to keep (defaut value to 15). Old ones are
      removed from XMPP server. They are not destroyed. The can be activated again with a send to the conversation
      again.
    * rateLimitPerHour to set the maximum count of stanza messages of type `message` sent during one hour. The counter
      is started at startup, and reseted every hour.

## [1.4.2] - 2019-02-12

update to rainbow-node-sdk 1.52.0

## [1.4.1] - 2019-02-12

## [1.3.6] - 2018-11-06

Login node: add host selection to choose between sandbox and official rainbow systems.

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
- There are "Error while Deploy (stop/start)" which should be corrected with next dependency version (Rainbow Node.js
  SDK)
- Added in Notified_IM node 2 filters: filterContact and filterCompany to only accept message from a user of from a
  company
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
