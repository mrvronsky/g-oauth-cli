const {google} = require('googleapis');
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}




async function test() {
  let auth = await authorize({
    oAuth2: google.auth.OAuth2,
    credentialsFile: './credentials.json',
    tokenFile: './token.json',
    scopes: ['https://www.googleapis.com/auth/drive.metadata.readonly']
  })
  listFiles(auth)
}

test().catch(e => console.log(e))
*/
