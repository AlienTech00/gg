// Import the discord.js library
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
require('dotenv').config(); // Load environment variables from .env file

// Load environment variables
const { BOT_TOKEN, CLIENT_ID, GUILD_ID, PASS_RED } = process.env;

// Configuration: Centralized IDs and messages
const config = {
    channels: {
        NORMAL_CHAT_ID: '1310699635287003136', // Updated channel ID
        RULES_CHAT_ID: '1310699635287003136',
        REDDIT_UPLOAD_CHAT_ID: '1315079980132339843',
        YOUTUBE_UPLOAD_CHAT_ID: '1307706457051103252',
        WELCOME_CHAT_ID: '1307703760587587604',
        FILE_TICKET_CHANNEL_ID: '1314282618346536990',
    },
    messages: {
        BOT_ONLINE: 'BURGER BOT IS ONLINE :)',
        SUB_YOUTUBE: 'Sub to https://www.youtube.com/@VandalTecnoz', // Message for periodic posting
        INVALID_PASSWORD: 'Invalid password!',
        CHANNEL_NOT_FOUND: 'Channel not found.',
        RULES_MESSAGE: (id) => `READ THE RULES <#${id}>`,
        FILE_SHARE_INSTRUCTIONS: (id) => `
To share a file, please go to <#${id}> and create a ticket.

**File Specifications:**
- File size limit: 10 MB per file.
- Accepted file types: All types (e.g., image, HTML, etc.).
- The file will be verified once uploaded.

Once you have created the ticket, someone from the team will respond to you.
        `,
    },
};

// Helper function: Fetch and validate channels
const getChannel = (client, channelId) => client.channels.cache.get(channelId);

// Helper function: Send error-free messages
const sendChannelMessage = async (channel, content) => {
    if (!channel) {
        console.error(config.messages.CHANNEL_NOT_FOUND);
        return;
    }
    try {
        await channel.send(content);
    } catch (error) {
        console.error(`Error sending message to channel (${channel.id}):`, error);
    }
};

// Create a new Discord client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
    ],
});

// Bot ready event
client.once('ready', async () => {
    const normalChannel = getChannel(client, config.channels.NORMAL_CHAT_ID);

    // Log "BURGER BOT IS ONLINE :)" in the console
    console.log(config.messages.BOT_ONLINE);

    // Send the "BURGER BOT IS ONLINE :)" message to the channel
    await sendChannelMessage(normalChannel, config.messages.BOT_ONLINE);

    // Send the YouTube subscription message immediately as a test
    await sendChannelMessage(normalChannel, config.messages.SUB_YOUTUBE);

    // Start a 30-minute interval to send the subscription message
    setInterval(async () => {
        await sendChannelMessage(normalChannel, config.messages.SUB_YOUTUBE);
    }, 30 * 60 * 1000); // 30 minutes in milliseconds
});

// Define slash commands
const commands = [
    new SlashCommandBuilder().setName('rules').setDescription('Displays the rules message.'),
    new SlashCommandBuilder()
        .setName('redditupload')
        .setDescription('Uploads a new Reddit post.')
        .addStringOption((option) =>
            option.setName('link').setDescription('Link to the new Reddit post').setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('password').setDescription('Password to authorize the upload').setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('youtubeupload')
        .setDescription('Uploads a new YouTube video.')
        .addStringOption((option) =>
            option.setName('link').setDescription('Link to the new YouTube video').setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('password').setDescription('Password to authorize the upload').setRequired(true)
        ),
    new SlashCommandBuilder().setName('art').setDescription('Displays art with a special message.'),
    new SlashCommandBuilder().setName('help').setDescription('Displays this help message.'),
    new SlashCommandBuilder().setName('hi').setDescription('Replies with a friendly greeting.'),
    new SlashCommandBuilder()
        .setName('fileshare')
        .setDescription('Instructs users to create a file share ticket and provides file upload limitations.'),
].map((command) => command.toJSON());

// Register slash commands
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
    .then(() => console.log('Successfully registered commands.'))
    .catch(console.error);

// Interaction handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    try {
        switch (commandName) {
            case 'rules': {
                const message = config.messages.RULES_MESSAGE(config.channels.RULES_CHAT_ID);
                await interaction.reply({ content: message, ephemeral: false });
                break;
            }
            case 'redditupload':
            case 'youtubeupload': {
                const link = options.getString('link');
                const password = options.getString('password');
                const targetChannelId =
                    commandName === 'redditupload'
                        ? config.channels.REDDIT_UPLOAD_CHAT_ID
                        : config.channels.YOUTUBE_UPLOAD_CHAT_ID;

                if (password !== PASS_RED) {
                    return interaction.reply({ content: config.messages.INVALID_PASSWORD, ephemeral: true });
                }

                const targetChannel = getChannel(client, targetChannelId);
                await sendChannelMessage(targetChannel, `@everyone NEW UPLOAD: ${link}`);
                await interaction.reply({ content: `${commandName} upload successful!`, ephemeral: true });
                break;
            }
            case 'art': {
                await interaction.reply('ART!!!!!!!!\n\n∧,,,∧\n(  ̳• · • ̳)\n/    づ♡');
                break;
            }
            case 'help': {
                await interaction.reply({
                    content: `
**Available Commands:**
- /rules - Displays the rules.
- /redditupload - Uploads a new Reddit post (password required).
- /youtubeupload - Uploads a new YouTube video (password required).
- /art - Displays a fun art message.
- /help - Displays this help message.
- /hi - Replies with a friendly greeting.
- /fileshare - Explains how to share files in the server.
                    `,
                    ephemeral: true,
                });
                break;
            }
            case 'hi': {
                await interaction.reply({ content: 'Hello there! 👋', ephemeral: true });
                break;
            }
            case 'fileshare': {
                const instructions = config.messages.FILE_SHARE_INSTRUCTIONS(config.channels.FILE_TICKET_CHANNEL_ID);
                await interaction.reply({ content: instructions, ephemeral: true });
                break;
            }
        }
    } catch (error) {
        console.error(`Error handling command (${commandName}):`, error);
        await interaction.reply({ content: 'An error occurred while processing your command.', ephemeral: true });
    }
});

// Member join event
client.on('guildMemberAdd', async (member) => {
    const welcomeChannel = getChannel(client, config.channels.WELCOME_CHAT_ID);
    await sendChannelMessage(welcomeChannel, `@everyone ${member.user.username} JOINED`);
});

// Log in to Discord
client.login(BOT_TOKEN);
