/**
 * Helper script to generate a YouTube API refresh token
 * 
 * Usage:
 *   1. Make sure your .env file has YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET
 *   2. Run: node scripts/get-refresh-token.js
 *   3. A browser will open - authorize the application
 *   4. Copy the refresh token from the console output
 */

require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');
const http = require('http');
const url = require('url');
const open = require('open');

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const SCOPES = ['https://www.googleapis.com/auth/youtube'];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET must be set in .env file');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate the authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Required to get refresh token
  scope: SCOPES,
  prompt: 'consent' // Force consent screen to ensure refresh token is returned
});

console.log('Opening browser for authorization...');
console.log('If browser does not open, visit this URL manually:');
console.log(authUrl);
console.log('\nWaiting for authorization...\n');

// Start local server to receive callback
const server = http.createServer(async (req, res) => {
  try {
    const queryObject = url.parse(req.url, true).query;

    if (queryObject.error) {
      console.error('Authorization error:', queryObject.error);
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body>
            <h1>Authorization Failed</h1>
            <p>Error: ${queryObject.error}</p>
            <p>You can close this window.</p>
          </body>
        </html>
      `);
      server.close();
      process.exit(1);
    }

    if (queryObject.code) {
      const { tokens } = await oauth2Client.getToken(queryObject.code);
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body>
            <h1>Authorization Successful!</h1>
            <p>You can close this window.</p>
            <p>Check the console for your refresh token.</p>
          </body>
        </html>
      `);

      server.close();

      if (tokens.refresh_token) {
        console.log('\n✅ Success! Here is your refresh token:');
        console.log('─'.repeat(60));
        console.log(tokens.refresh_token);
        console.log('─'.repeat(60));
        console.log('\nAdd this to your .env file as YOUTUBE_REFRESH_TOKEN');
      } else {
        console.log('\n⚠️  Warning: No refresh token received.');
        console.log('This might happen if you\'ve already authorized this app before.');
        console.log('Try revoking access at: https://myaccount.google.com/permissions');
        console.log('Then run this script again.');
        if (tokens.access_token) {
          console.log('\nAccess token received (but not refresh token):', tokens.access_token.substring(0, 20) + '...');
        }
      }

      process.exit(0);
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body>
          <h1>Error</h1>
          <p>${error.message}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
    server.close();
    process.exit(1);
  }
});

server.listen(3000, () => {
  // Try to open browser automatically
  open(authUrl).catch(() => {
    // If open fails, just continue - user can open manually
  });
});

