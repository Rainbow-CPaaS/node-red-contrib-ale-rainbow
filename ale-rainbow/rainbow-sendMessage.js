const request = require( "request");
const uuid = require('uuidv4').default;
const fileApi = require( "file-api" );
const fs = require('fs');

module.exports = (RED) => { 
  function RainbowSendMessage(config) {
    RED.nodes.createNode(this, config);
    this.destJid = config.destJid;
    this.server = RED.nodes.getNode(config.server);
    const node = this;
    this.alreadyLogged = false;

    let msgSent = node.context().get( "msgSent" ) || 0;
    
    this.timerHealthCheck = setInterval( () => {
      if( this.server && this.server.rainbow && this.server.rainbow ) {
        if( this.alreadyLogged != this.server.rainbow.logged ){
          if( this.server.rainbow.logged  ){
            node.status({ fill: "green", shape: "ring", text: "connected "+ JSON.stringify(node.server.name) } ); 
          } 
          else {
            node.status({ fill: "red", shape: "ring", text: "not connected." } ); 
          }
          this.alreadyLogged = this.server.rainbow.logged;
        }
      }
      else {
        if( this.alreadyLogged ){
          node.status({ fill: "red", shape: "ring", text: "not connected." } ); 
          this.alreadyLogged = false;
        }
      }
    }, 1000 );

    node.log("Rainbow : sendMessage node initialized : cnx: " + JSON.stringify(node.server.name))
 
    const sendMessageToBubble = (content, bubbleJid, lang, alternateContent, subject) => {
      return node.server.rainbow.sdk.im.sendMessageToBubbleJid(content, bubbleJid, lang, alternateContent, subject)
      .then( () => {
        msgSent++;
        node.context().set( "msgSent", msgSent ) 
        node.status({ fill: "green", shape: "ring", text: "Nb sent: " + msgSent });
      })
      .catch( ()=> {
        node.status({ fill: "orange", shape: "ring", text: "send failed" });
      });
    }

    const sendMessageToContact = (content, destJid, lang, alternateContent, subject) => {
      return node.server.rainbow.sdk.im.sendMessageToJid(content, destJid, lang, alternateContent, subject)
      .then( () => {
        msgSent++;
        node.context().set( "msgSent", msgSent ) 
        node.status({ fill: "green", shape: "ring", text: "Nb sent: " + msgSent });
      })
      .catch( ()=> {
        node.status({ fill: "orange", shape: "ring", text: "send failed" });
      });
    }

    const dumpBufferToFile = ( path, buffer ) => {
      return new Promise( (resolve, reject )=>{ 
        // we need to pass through a temp file currently..
        fs.writeFile( path, buffer, 'binary', function( err ){
          if( !err ) {
            resolve( );
          }
          else {
            reject( err );
          }
        });
      });
    }

    const getUrl =  url => {
      return new Promise( ( resolve, reject ) => {
        request.get( url, {encoding: 'binary'}, function( error, response, body ) {
          console.log( "received url " + url );
          if(!error && body && body.length ){
            const fileName = uuid();
            const path = fileName;
            const size = body.length;
            const type = response.headers["content-type"];
            let receivedFileName = fileName;
            if( response.headers["content-disposition"] ) {
              let fnIndex = response.headers["content-disposition"].indexOf( "filename=\"" );
              if( fnIndex !== -1 ){
                receivedFileName = response.headers["content-disposition"].substr( fnIndex + 10 );
                receivedFileName = receivedFileName.substr( 0, receivedFileName.indexOf( "\"") );
              }
            }
            
            let fileInfos = new fileApi.File( {name: receivedFileName, type: type, path: path, size: size });
            dumpBufferToFile( path, body ).then( resolve( fileInfos )).catch( reject ( ));
          }
          else {
            reject( error );
          }
        });
      });
    }
  
    const postFileToBubble = ( fileInfos, bubble, message ) => {
      const result =  new Promise( (resolve,reject) => {
        node.server.rainbow.sdk.fileStorage.uploadFileToBubble(bubble, fileInfos, message)
        .then( (result) => {
          msgSent++;
          node.context().set( "msgSent", msgSent ) 
          node.status({ fill: "green", shape: "ring", text: "Nb sent: " + msgSent });

          if( fileInfos.isTemporary ) {
            fs.unlink( fileInfos.path, err => {
              if( err ) {
                node.warn( "RainbowSendMessage: failed to erase temp file: " + fileInfos.path );
              }
              resolve( result );
            });
          }
          else {
            resolve( result );
          }
        })
        .catch( () => {
          node.status({ fill: "orange", shape: "ring", text: "send failed" });
          
          if( fileInfos.isTemporary ) {
            fs.unlink( fileInfos.path, err => {
              if( err ) {
                node.warn( "RainbowSendMessage: failed to erase temp file: " + fileInfos.path );
              }
              reject( );
            });
          }
          else {
            reject( );
          }
        });
      });
      
      return result;
    }

    const postFileToConversation = ( fileInfos, conversation, message ) => {
      const result =  new Promise( (resolve,reject) => {
        node.server.rainbow.sdk.fileStorage.uploadFileToConversation(conversation, fileInfos, message)
        .then( result => {
          msgSent++;
          node.context().set( "msgSent", msgSent ) 
          node.status({ fill: "green", shape: "ring", text: "Nb sent: " + msgSent });

          if( fileInfos.isTemporary ) {
            fs.unlink( fileInfos.path, err => {
              if( err ) {
                node.warn( "RainbowSendMessage: failed to erase temp file: " + fileInfos.path );
              }
              resolve( result );
            });
          }
          else {
            resolve( result );
          }
        })
        .catch( () => {
          node.status({ fill: "orange", shape: "ring", text: "send failed" });
          
          if( fileInfos.isTemporary ) {            
            fs.unlink( fileInfos.path, err => {
              if( err ) {
                node.warn( "RainbowSendMessage: failed to erase temp file: " + fileInfos.path );
              }
              reject( );
            });
          }
          else {
            reject( );
          }
        });
      });
      
      return result;
    }

    const getFilesizeInBytes = (filename) => {
      return new Promise( (resolve, reject ) => {        
        fs.stat(filename, (err,stats) => {
          if( err ) {
            reject( 0 );    
          }
          else {
            resolve( stats["size"] );
          }
        })
      });
    }

    this.on('close', async () => {
      if( this.timerHealthCheck ){
        clearInterval( this.timerHealthCheck );
        this.timerHealthCheck = 0;
      }
    })

    this.on('input', async (msg, _send, done ) => {
      node.status({  fill: "orange", shape: "ring", text: "will send..." });

      node.log("RainbowSendMessage : sendMessage to cnx: " + JSON.stringify(node.server.name));
      
      if (node.server.rainbow.logged === false) {
        node.log("Rainbow SDK not ready (" + config.server + ")" + " cnx: " + JSON.stringify(node.server.name));
        node.status({ fill: "red", shape: "ring", text: "not connected" });
        if( done ) {
          done();
        }
        return;
      }
    
      if( !msg.payload ){
        node.log("RainbowSendMessage received a message without payload (" + config.server + " ) cnx: " + JSON.stringify(node.server.name));
        if( done ) {
          done();
        }
        return;
      }

      let destJid; 
      let lang = msg.payload.lang || null;
      let content = msg.payload.content;
      let alternateContent =  msg.payload.alternateContent || null;
      let subject = msg.payload.subject || null;
      let bubble = msg.payload.bubble || null;
      let destLoginEmail = msg.payload.loginEmail || null;
      let file = msg.payload.attachment ? msg.payload.attachment.file :  null;
      let url = msg.payload.attachment ? msg.payload.attachment.url :  null;
      let buffer = msg.payload.attachment  ? msg.payload.attachment.buffer  :  null;
      let hasAttachment = url || file || buffer;
      let fileInfos = null;
      let contact = null;

      if( bubble ) {
        destJid = bubble.jid;
      }
      else {
        destJid = msg.payload.destJid || node.destJid || msg.payload.fromJid;
      }
      
      // if the destJid we will use is the one configured in the node, check if it is a loginEmail
      if( !destLoginEmail && config.isLoginEmail && destJid && destJid === node.destJid ) {  // user put a login email instead
        destLoginEmail = node.destJid;
        destJid = null;
      }

      if (!destJid && !destLoginEmail ) {
        node.status({ fill: "red", shape: "ring", text: "no valid destination" });
        node.error("RainbowSendMessage: no destination (" + config.server + " ) cnx: " + JSON.stringify(node.server.name));
        if( done ) {
          done();
        }

        return;
      }

      if( destLoginEmail ){       
        contact = await node.server.rainbow.sdk.contacts.getContactByLoginEmail( destLoginEmail );
        destJid = contact.jid_im;
        destLoginEmail = null;
      }

      // prepare the fileInfos object to be able to upload attachemnt if any.
      // if the object to be attached can't be found, has Attachment will be set to false.
      try {      
        if( hasAttachment ){
          if( url ){
            let name = msg.payload.attachment.name;
            fileInfos = await getUrl( url );
            if( name ) {
              fileInfos.name = name;
            }
            fileInfos.isTemporary = true;
          }
          else if( file ){
            let size = await getFilesizeInBytes(file);
            fileInfos = null;
            if( size ){
              let type = msg.payload.attachment.type || 'application/octet-stream';
              let path = msg.payload.attachment.file;
              let name = msg.payload.attachment.name;
              if( !name && path && path.indexOf( "/")!== -1 ){
                name = path.slice( lastIndexOf( "/" ));
              }
              fileInfos = new fileApi.File( {name: name, type: type, path: path , size: size });
              fileInfos.isTemporary = false;
            }
            else {
              hasAttachment = false;
              node.error("RainbowSendMessage: couldn't open file " + file + " (" + config.server + " ) cnx: " + JSON.stringify(node.server.name));
            }
          }
          else if( buffer ) {          
            let size = buffer.length;
            let type = msg.payload.attachment.type || 'application/octet-stream';
            let name = msg.payload.attachment.name || uuid();
            let path = name;
            await dumpBufferToFile( path, buffer );
            fileInfos = new fileApi.File( {name: name, type: type, path: file.path, size: size });
            fileInfos.isTemporary = true;
          }
        }
      }
      catch( error ) {
        hasAttachment = false;
      }
      console.log( "fileinfos: ", fileInfos);

      node.log("Rainbow SDK (" + config.server + " " + content + " " + node.destJid + " " + JSON.stringify(alternateContent) + " cnx: " + JSON.stringify(node.server.name));

      // Are we sending a message to a bubble ?
      if( destJid.startsWith( "room_") ) {          
        let bubbleJid = destJid.split("/")[0]; 
        try {
          // If we send attachment to a bubble, we need the bubble, not the jid.
          if( hasAttachment ){
            if( !bubble ) {
              bubble = await node.server.rainbow.sdk.bubbles.getBubbleByJid( bubbleJid );
            }
            await postFileToBubble( fileInfos, bubble, content )
          }
          else {
            await sendMessageToBubble(content, bubbleJid, lang, alternateContent, subject);
          }
        }
        finally {
          if( done ) done();
        }
      }
      else {
        // we are sending a message to a user.
        try {
          if( hasAttachment ) {
            // if there is an attachment  to send , we need to pass a conversation ( so we need a contact )
            if( contact === null ) {
              contact = await node.server.rainbow.sdk.contacts.getContactByJid( destJid );
            }
            let conversation = await node.server.rainbow.sdk.conversations.openConversationForContact( contact );
  
            await postFileToConversation( fileInfos, conversation, content );
          }
          else {
            await sendMessageToContact(content, destJid, lang, alternateContent, subject);
          }

        }
        finally {
          if( done ) done();
        }
          
      }
    });
  }  
  
  RED.nodes.registerType("Rainbow_Send_IM_Attachments",RainbowSendMessage );
}