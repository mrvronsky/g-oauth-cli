const fs = require('fs').promises;
const readline = require('readline');

async function createOAuthClient({oAuth2, credentialsFile, tokenFile, scopes}) {
  // Load client secrets from a local file.
  let credentials
  let token
  try {
    credentials = await fs.readFile(credentialsFile)
    credentials = JSON.parse(credentials)
  }
  catch (err){
    console.log('Error loading client secret file:', err);
    throw err
  }

  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new oAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.on('tokens', (tokens) => {
    fs.writeFile(tokenFile, JSON.stringify(tokens)).catch(e => console.log(e))
  });

  //Check if we have previously stored a token.
  try {
    token = JSON.parse(await fs.readFile(tokenFile))
  }
  catch (err) {
    if (err.code === 'ENOENT')  {
      token = (await getAccessToken({oAuth2Client, scopes})).tokens;
      // Store the token to disk for later program executions
      await fs.writeFile(tokenFile, JSON.stringify(token))
      console.log('Token stored to', tokenFile);
    }
  }
  oAuth2Client.setCredentials(token);
  return oAuth2Client
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
async function getAccessToken({oAuth2Client, scopes}) {
  let token

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });


  let code = await new Promise(resolve => {
    rl.question('Enter the code from that page here: ', (code) => {
      resolve(code)
    })
  })
  rl.close();
  try {
    token = await oAuth2Client.getToken(code)
  }
  catch (err) {
    console.error('Error retrieving access token', err);
    throw err
  }
  return token
}

module.exports = {
  createOAuthClient
}