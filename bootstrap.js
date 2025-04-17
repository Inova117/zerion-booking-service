import fs from 'fs';

if (process.env.GOOGLE_CREDENTIALS_B64 && process.env.GOOGLE_TOKEN_B64) {
  fs.writeFileSync('credentials.json', Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, 'base64').toString());
  fs.writeFileSync('token.json', Buffer.from(process.env.GOOGLE_TOKEN_B64, 'base64').toString());
}
