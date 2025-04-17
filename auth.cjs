const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const CREDENTIALS = JSON.parse(fs.readFileSync('credentials.json'));
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets'
];

const oAuth2Client = new google.auth.OAuth2(
  CREDENTIALS.installed?.client_id || CREDENTIALS.web.client_id,
  CREDENTIALS.installed?.client_secret || CREDENTIALS.web.client_secret,
  CREDENTIALS.installed?.redirect_uris[0] || CREDENTIALS.web.redirect_uris[0]
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES
});

console.log('🔗 Visita esta URL y pega el código:\n');
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n🔐 Código: ', async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync('token.json', JSON.stringify(tokens));
    console.log('\n✅ Nuevo token generado y guardado como token.json');
  } catch (err) {
    console.error('❌ Error al obtener token:', err.message);
  } finally {
    rl.close();
  }
});
