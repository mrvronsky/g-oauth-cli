'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const querystring = require('querystring');

const {google} = require('googleapis');


const scopes = [
'https://www.googleapis.com/auth/youtube',
];

/**
 * Open an http server to accept the oauth callback. In this simple example, the only request to our webserver is to /callback?code=<code>
 */
async function authenticate ({scopes, tokensFile}) {
  return new Promise((resolve, reject) => {
    // grab the url that will be used for authorization
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
      include_granted_scopes : true,
    });
    const server = http.createServer(async (req, res) => {
      try {
        if (req.url.indexOf('/') > -1) {
          const qs = querystring.parse(url.parse(req.url).query);
          res.end('Authentication successful! Please return to the console.');
          const {tokens} = await oauth2Client.getToken(qs.code);
          fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2))
          oauth2Client.credentials = tokens;
          resolve(oauth2Client);
          server.close();
        }
      } catch (e) {
        reject(e);
      }
    }).listen(3005, () => {
      console.log("authorizeUrl:"+ authorizeUrl) 
    });
  });
}

let oauth2Client
let init = async function ({keyFile, tokensFile}) { 
  try {
    let keys = { redirect_uris: [''] };
    if (fs.existsSync(keyFile)) {
      keys = require(keyFile);
    }

    /**
     * Create a new OAuth2 client with the configured keys.
     */
    oauth2Client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      keys.redirect_uris[0]
    );

    /**
     * This is one of the many ways you can configure googleapis to use authentication credentials.  
     * In this method, we're setting a global reference for all APIs.  Any other API you use here, 
     * like google.drive('v3'), will now use this auth client. 
     * You can also override the auth client at the service and method call levels.
     */
    google.options({ auth: oauth2Client });
       
    //call authenticate if tokensFile doesn't exist
    if (!fs.existsSync(tokensFile)) { 
      await authenticate({scopes, tokensFile})
    } else { 
      let tokens = fs.readJsonSync(tokensFile)
      oauth2Client.credentials = tokens
    }

    oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        try { 
          // store the refresh_token in my database!
          fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2))
        } catch(e) { 
          console.log(e)
        }
      }
    });

  } catch (e) {
    console.error(e)
  }
}

module.exports.init = init
module.exports.client = oauth2Client
init({keyFile:'./credentials.json', tokensFile:'./tokens.json'})
