require('dotenv').config();
const { App } = require('@slack/bolt');
const { initializeServices } = require('./services');

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

// Start the app
(async () => {
  try {
    // Initialize all services
    await initializeServices();
    
    // Start the Slack app in Socket Mode
    await app.start();
    console.log('⚡️ Bolt app is running!');

    // Check bot info and permissions
    const client = app.client;
    try {
      const botInfo = await client.auth.test();
      console.log('Bot info:', {
        botId: botInfo.bot_id,
        userId: botInfo.user_id,
        team: botInfo.team,
        user: botInfo.user
      });
    } catch (error) {
      console.error('Error getting bot info:', error.message);
    }

    // Check channel connections
    const channels = [
      process.env.SLACK_MUSIC_CHANNEL_ID,
      process.env.SLACK_MAIN_CHANNEL_ID
    ].filter(Boolean);

    for (const channel of channels) {
      try {
        // First try to get channel info
        const result = await client.conversations.info({ channel });
        console.log(`Channel info:`, {
          id: result.channel.id,
          name: result.channel.name,
          is_member: result.channel.is_member,
          is_private: result.channel.is_private
        });

        // If bot is not a member, try to join
        if (!result.channel.is_member) {
          try {
            await client.conversations.join({ channel });
            console.log(`Bot joined channel: ${result.channel.name}`);
          } catch (joinError) {
            console.error(`Error joining channel ${channel}:`, joinError.message);
          }
        }
      } catch (error) {
        console.error(`Error connecting to channel ${channel}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error starting app:', error.message);
    process.exit(1);
  }
})(); 