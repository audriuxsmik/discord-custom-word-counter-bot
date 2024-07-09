const { Client, Intents, Collection, GatewayIntentBits, Interaction, ActivityType, ApplicationCommandOptionType } = require('discord.js');
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require("./config.js");
const client = new Client({
	intents: [
    GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});


client.once('ready', () => {
  console.log('The bot is ready!');
  client.user.setActivity(`${config.activity}`, { type: ActivityType.Watching });

});
let wordCounts = {};
const saveWordCounts = () => {
  fs.writeFileSync('data.json', JSON.stringify(wordCounts, null, 2), 'utf8');
};

const loadWordCounts = () => {
  try {
    wordCounts = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  } catch (err) {
    console.error("Error loading word counts:", err);
  }
};

loadWordCounts();

client.on('messageCreate', (message) => {
  if (message.author.bot) return; 
  const customWord = config.customWord;
  if (message.content.toLowerCase().includes(customWord)) {
    const userId = message.author.id;
    wordCounts[userId] = (wordCounts[userId] || 0) + 1;
    saveWordCounts();
  }
});
const commands = [
  {
    name: 'stats',
    description: 'Look how many times someone has said a custom word.',
    options: [
      {
        name: 'user',
        description: 'The user',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
];
const rest = new REST({ version: '9' }).setToken(config.token);

(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(config.appid, config.guildid), { 
      body: commands,
    });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'stats') {
    const userOption = options.get('user');

    if (!userOption.value.includes('<@')) {
      return interaction.reply("Username not found. Write with @!");
    }
    const user = userOption.value;
    const userId = userOption.value.replace(/[<@!>]/g, ''); 
    const wordCount = wordCounts[userId] || 0;
    interaction.reply(`${user} has said the ${wordCount} time/s!`);
  }
});


client.login(config.token);
