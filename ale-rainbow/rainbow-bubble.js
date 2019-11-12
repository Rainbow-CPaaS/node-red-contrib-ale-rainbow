const {isEqual} = require( "lodash");

module.exports = function(RED) {
  const createBubble = (  sdk, name, description, customData, history   ) => {
    return sdk.bubbles.createBubble( name, description, history )
    .then( bubble => customData ? sdk.bubbles.setBubbleCustomData( bubble, customData ): bubble )
    .then(  bubble => bubble );
  }

  const restPost = (sdk, url, data) => {
    return new Promise((resolve, reject) => {
      sdk.rest.http.post(url, sdk.rest.getRequestHeader(), data)
      .then( res=> {
        // console.info('restPost result', {restPost: res});
        let ret;
        try {
          ret=JSON.parse(res)
        }catch (e) {
          ret= res;
        }
        resolve( ret);
      })
      .catch( (err) => {
        reject(err);
      });
    })
  }

  const inviteGuests = ( sdk, emails, bubble ) => {
    const url ="/api/rainbow/enduser/v1.0/rooms/" + bubble.id + "/invitations";
    const data = { 
      scenario: "chat",
      emails: emails 
    };
    // console.warn( "inviteGuests ", url, data  );
    restPost( sdk, url, data).then( x =>{
      // console.warn( x );
      return x;
    })
    .catch( x => {       
      console.warn( "inviteGuests FAILED",url, data, x );
    } )
    // console.warn( "done");
  }

  


  // utilitary function that processes the result of a call to findloginEmails
  // and returns the list of missing / resolved contacts
  // invitations contains the list of people expected to be found
  // foundUsers contains the list of resolved contacts (array of contcact)
  // return.found: the list of contacts matching the invitation
  // return.notFound the list of loginEmails not found
  const computeListOfContactsToInvite = ( (invitations, foundUsers ) =>{
    let result = { 
      found: [], 
      notFound: [] 
    };

    invitations.forEach(( x ) => {
      let contact;
      if( typeof x === "string" ){
        contact = foundUsers.find( (invitation) => (invitation && invitation.loginEmail === x ) );
        if( contact ){
          // need to invite this contact
          result.found.push( contact );
        }
        // else this contact was not found
        else {
          result.notFound.push( x );
        }
      } 
      else if( typeof x === "object" ) {        
        if( x.hasOwnProperty( "loginEmail" )){ 
          contact = foundUsers.find( (invitation) => { return ((invitation && invitation.loginEmail ) === x.loginEmail) });
        }
        else if( x.hasOwnProperty( "id") ) {
          contact = foundUsers.find( (invitation) => (invitation && invitation.id )  === x.id );          
        }
        else if( x.hasOwnProperty( "jid") ) {
          contact = foundUsers.find( (invitation) => (invitation && invitation.jid === x.jid ) );
        }

        if( contact ){
          result.found.push( contact );
        }
        else {
          result.notFound.push( x );
        }
      }
    });
    return result;    
  });

      
  // computes the list of invitations to send and the list privilege changes to send.
  // usersInBubble: list of contacts already in the bubble
  // privilege: privilege we expect those members to have
  // resolvedContacts: list of contacts resolved
  // returns: { usersToInvite, usersToUpdate }
  // where usersToInvite is the list of contacts to invite, 
  // and usersToUpdgrade: the list of contacts that are members but not with the expected privilege
  const findMissingMembers = ( usersInBubble, privilege, resolvedContacts ) => {
    let usersToInvite = [];
    let usersToUpdate = [];
      resolvedContacts.forEach( ( contact ) => {
        if( !contact ) {
          // console.warn( "findMissing Members : contact null" );
        }
        else {
          let alreadyPresentMember = 
            usersInBubble.find ( (member) => ( member.userId === contact.id &&  member.status != "deleted" ) );
          
          if( !alreadyPresentMember ){
            usersToInvite.push( contact );
          }
          else if( privilege !== alreadyPresentMember.privilege ){
            usersToUpdate.push( contact );              
          }
          else { 
            console.warn( "user " + contact.loginEmail + " already in the bubble with privilege " + alreadyPresentMember.privilege + '('+privilege+')' );
          }
      }
    });
    return { usersToInvite, usersToUpdate };
  }

  const resolveContacts = async (sdk, listOfContacts) => {
    const promises = [];
    // console.warn( "resolveContact ", listOfContacts );
    // search the users in users  and moderator 
    listOfContacts.forEach( x => {
      // if those are array of strings, they are to be found loginEmails.
      if( typeof x === "string" ) {
        
        promises.push(  sdk.contacts.getContactByLoginEmail( x ) );
      } 
      else if( typeof x  === "object" ) {
        if( x.hasOwnProperty( "loginEmail" ) ){
          promises.push( sdk.contacts.getContactByLoginEmail( x.loginEmail ) );
        }
        else if( x.hasOwnProperty( "id" )) {
          promises.push( sdk.contacts.getContactById( x.id ) );
        }
        else if( x.hasOwnProperty( "jid" )) {          
          promises.push( sdk.contacts.getContactByJid( x.jid ) );
        }
      }
    });
    if( promises.length ){
      return await Promise.all( promises );
    }
    else {
      return [];
    }
  }

  const removeMembers = async ( sdk, bubble, contacts ) => {
    const promises = [];
    contacts.forEach( contact => {
      if( bubble.users.find( member => (contact.userId === member.id) ) ){
        promises.push( sdk.bubbles.removeContactFromBubble( contact, bubble ) );
      }
    });

    if( promises.length ) {
      try {
        await Promise.all( promises );
      }
      catch( e ){
        console.error( "Rainbow_Manage_Bubble: failed to remove users ", e )
      }
      finally {
        return await sdk.bubbles.getBubbleById( bubble.id );
      }
    } else {
      return bubble;
    }
  }

  // makes sure the list of members contains at least "users" with the role user, and "moderators" with the role moderator
  // sdk: instance of the connected rainbow sdk
  // users: array of the loginEmails of users as specified in the node
  // moderators: list of users as specified in the node
  // bubble: bubble to check / modify
  // forceInvite: if true, invitation is not sent, users/moderators are directly added into the bubble
  // returns a promise containing the bubble with the updated list of members
  const updateBubbleMembers = ( sdk, users, moderators, bubble, forceInvite ) => {
    const promises = [];
    const contactsNotResolved = [];
    const addContactifNeeded = ( contact, email ) => {
      if( contact ) return contact;
      // console.warn( "didn't find contact " + email);
      contactsNotResolved.push( email );
      return null;
    }

    // search the users in users  and moderator 
    (users.concat(moderators)).forEach( (x) => {
      // if those are array of strings, they are to be found loginEmails.
      if( typeof x === "string" ) {        
        promises.push(  sdk.contacts.getContactByLoginEmail( x )
          .then( result => addContactifNeeded( result, x ) )
          .catch( x => addContactifNeeded( null, x ) ));
      } 
      else if( typeof x  === "object" ) {
        if( x.hasOwnProperty( "loginEmail" ) ){
          promises.push( sdk.contacts.getContactByLoginEmail( x.loginEmail ).then( result => addContactifNeeded( result, x.loginEmail ) ));
        }
        else if( x.hasOwnProperty( "id" )) {
          promises.push( sdk.contacts.getContactById( x.id ) );
        }
        else if( x.hasOwnProperty( "jid" )) {          
          promises.push( sdk.contacts.getContactByJid( x.jid ) );
        }
      }
    });

    // resolve users.
    if( promises.length ){
      return Promise.all( promises ).then( 
        resolvedUsers => {
        // if some contacts are not found contact, invite those are guests
        if( contactsNotResolved.length ){
          // console.warn( "INVITE GUESTS: ", contactsNotResolved );
          inviteGuests( sdk, contactsNotResolved, bubble );
        }

        // find out wich ones are resolved for guest, moderators and users
        let usersInvitations = computeListOfContactsToInvite( users, resolvedUsers );
        let moderatorsInvitations = computeListOfContactsToInvite( moderators, resolvedUsers );
        
        // find out which users are already in the buble with correct privilege
        let missingUsers = findMissingMembers(bubble.users || [], "user", usersInvitations.found );
        let missingModerators = findMissingMembers(bubble.users || [], "moderator", moderatorsInvitations.found );
 
        const promises  = [];
        missingUsers.usersToInvite.forEach( ( contact ) => { 
          promises.push( sdk.bubbles.inviteContactToBubble( contact, bubble, false, !forceInvite, "" ));
        } );
        missingModerators.usersToInvite.forEach( ( contact ) => { 
          promises.push( sdk.bubbles.inviteContactToBubble( contact, bubble, true, !forceInvite, "" ));
        } );

        // if the users were found but with a different privilege, change it 
        missingUsers.usersToUpdate.forEach( ( contact ) => { 
          promises.push( sdk.bubbles.promoteContactInBubble(contact, bubble, false ));
        } );
        missingModerators.usersToUpdate.forEach( ( contact ) => { 
          promises.push( sdk.bubbles.promoteContactInBubble(contact, bubble, true ));
        } ); 
        
        // TODO: would need to split promises if list is too long
        if( promises.length ){                  
          return Promise.all( promises )
          .then( () => sdk.bubbles.getBubbleById( bubble.id ) );
        }
        else {
          return bubble; 
        }
         
      })            
    }
    else return Promise.resolve( bubble );
  }

  const stringToJson = ( str ) => {
    let result = undefined;
    if( typeof str === "string" ) {
        try {
          result = JSON.parse( str );
        }
        catch( e ){
          result = null;
        }
      }
    return result;
  }

  function RainbowBubble(config) {
      RED.nodes.createNode(this,config);
      var node = this;

      this.server = RED.nodes.getNode(config.server);

      node.on('input', async function(msg) {
        try {
          const sdk = this.server.rainbow.sdk;
          let name = msg.payload.hasOwnProperty("name") ? msg.payload.name: config.bubbleName;
          let description = ( msg.payload.hasOwnProperty("description") ? msg.payload.description:config.bubbleDescription )|| name;
          let history = msg.payload.hasOwnProperty("history") ? msg.payload.history : config.history;
          let forceInvite = msg.payload.hasOwnProperty("forceInvite")?msg.payload.forceInvite :config.forceInvite;
          let customData = msg.payload.hasOwnProperty("customData")?msg.payload.customData:stringToJson( config.customData );        
          let users = msg.payload.hasOwnProperty( "users" ) ?  msg.payload.users : (stringToJson(config.users )||[]);
          let moderators = msg.payload.hasOwnProperty( "moderators" ) ?  msg.payload.moderators : (stringToJson(config.moderators )||[]);
          let bubble;
          let create = msg.payload.hasOwnProperty( "create" ) ? msg.payload.create : config.bubbleCreate;
          let contactsToRemove;
          
          if( !this.server ){
            node.error("RainbowBubble: missing Rainbow Broker");
            return;
          }

          // if( !this.server.rainbow.logged ){
          //   node.error("RainbowBubble: not connected.");
          //   return;
          // }
          
          if( !sdk ){
            node.error("RainbowBubble: sdk not ready");
            return;
          }

          if( sdk.state !== "ready"){
            node.error("RainbowBubble: sdk not ready ( "+sdk.state+" )");
            return;
          }
          
          if( !name ){
            node.error("RainbowBubble: missing bubble name");
            return;
          }         

          // check users and moderators 
          if( typeof users === "string" ){
            users = [ users ];
          }

          contactsToRemove = msg.payload ? msg.payload.remove : null;
          if( contactsToRemove && !Array.isArray( contactsToRemove )) {
            contactsToRemove = [contactsToRemove];
          }

          if( users && !Array.isArray( users ) ){
              node.warn("RainbowBubble: malformed parameter users (ignored)", users );
              users = [];
          }
          if( !users ) users = [];
          
          if( typeof moderators === "string" ){
            moderators = [ moderators ];
          }

          if( moderators && !Array.isArray( moderators ) ){
            node.warn("RainbowBubble: malformed parameter moderators (ignored)", moderators );
            moderators = [];
          }
          if( !moderators ) moderators = [];

          // check parameters, if not good do sthg.. (throw ?)
          bubble = sdk.bubbles.getAll( ).find( bubble => {            
            if( bubble.name === name ) {
              if( customData ) {
                return isEqual( customData, bubble.customData );
              }
              else {                
                return !bubble.customData || isEqual( {}, bubble.customData );
              }
            }
            return false;
          });
          
          if( bubble || create ) {
            try {
              if( !bubble ) {    
                bubble = await createBubble( sdk, name, description, customData, history  );
              }

              msg.bubble = bubble;
              node.send( msg );
                            
              bubble = await updateBubbleMembers( sdk, users, moderators, bubble, forceInvite );
              
              if( contactsToRemove ){
                const toRemove = await resolveContacts( sdk, contactsToRemove );
                if( toRemove.length ) {                 
                  bubble = await removeMembers( sdk, bubble, toRemove );
                }
              }

            }
            catch( error ) { 
              node.error("RainbowBubble : failed");
              node.warn( error );
            }
          }
          else {
            node.send( msg );
            return null;
          }

        }
        catch( err ){
          node.error("RainbowBubble: failed");
          node.warn( error );
        }
 
      });
  }
  RED.nodes.registerType("Rainbow_Manage_Bubble",RainbowBubble);
}
