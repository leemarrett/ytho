require('dotenv').config();
const { App } = require('@slack/bolt');
const { initializeServices } = require('./services');

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  // Add explicit event subscriptions
  events: {
    message: true,
    message_changed: true,
    message_deleted: true
  }
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

    if (channels.length === 0) {
      console.error('No channel IDs found in environment variables. Please set SLACK_MUSIC_CHANNEL_ID and/or SLACK_MAIN_CHANNEL_ID');
      return;
    }

    console.log('Attempting to connect to channels:', channels);

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
        } else {
          console.log(`Bot is already a member of channel: ${result.channel.name}`);
        }

        // Test channel access by getting recent messages
        const messages = await client.conversations.history({ channel, limit: 1 });
        console.log(`Successfully accessed channel ${result.channel.name}, found ${messages.messages?.length || 0} messages`);
      } catch (error) {
        console.error(`Error connecting to channel ${channel}:`, error.message);
        if (error.data?.error === 'not_in_channel') {
          console.log('Bot needs to be invited to the channel. Please use /invite @ytho in the channel.');
        }
      }
    }

  } catch (error) {
    console.error('Error starting app:', error.message);
    process.exit(1);
  }
})(); 