const { Client, GatewayIntentBits, ApplicationCommandOptionType } = require('discord.js');
const http = require('http');
require('dotenv').config();

// Mini HTTP-server til Render.com (forhindrer dvale/crashes)
http.createServer((req, res) => res.end('Discord bot is online!')).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// 1. Registrér Slash Commands hos Discord når botten starter
client.on('ready', async () => {
    console.log(`Logget ind som ${client.user.tag}!`);

    const commands = [
        {
            name: 'snippet',
            description: 'Søg efter en specifik snippet i databasen',
            options: [
                {
                    name: 'søgeord',
                    description: 'Titel eller emne (f.eks. knap eller flexbox)',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: 'snippets',
            description: 'Vis en liste med alle snippets inden for et kodesprog',
            options: [
                {
                    name: 'sprog',
                    description: 'Sproget du vil se (f.eks. css, html, js eller vue)',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    ];

    try {
        await client.application.commands.set(commands);
        console.log('Slash commands blev oprettet hos Discord!');
    } catch (error) {
        console.error('Kunne ikke registrere commands:', error);
    }
});

// 2. Lyt efter når nogen bruger en /command
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    // --- /snippet [søgeord] ---
    if (commandName === 'snippet') {
        const searchTerm = options.getString('søgeord').toLowerCase();

        try {
            const response = await fetch('https://programmerings-hjaelper-default-rtdb.europe-west1.firebasedatabase.app/snippets.json');
            const data = await response.json();

            if (!data) {
                return interaction.reply({ content: 'Databasen er tom.', ephemeral: true });
            }

            const snippetsArray = Object.values(data);

            // Tjek for præcist match
            let matchendeSnippets = snippetsArray.filter(s => 
                s.title && s.title.toLowerCase() === searchTerm
            );

            // Find delvise matches hvis ingen præcise fandtes
            if (matchendeSnippets.length === 0) {
                matchendeSnippets = snippetsArray.filter(s => 
                    s.title && s.title.toLowerCase().includes(searchTerm)
                );
            }

            if (matchendeSnippets.length === 1) {
                const snippet = matchendeSnippets[0];
                const reply = `**${snippet.title}**\n${snippet.description || ''}\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``;
                await interaction.reply({ content: reply, ephemeral: true });
            } 
            else if (matchendeSnippets.length > 1) {
                const titleListe = matchendeSnippets.map(s => `- ${s.title}`).join('\n');
                await interaction.reply({ 
                    content: `Jeg fandt flere snippets der matcher. Prøv at søge mere specifikt:\n${titleListe}`, 
                    ephemeral: true 
                });
            } 
            else {
                await interaction.reply({ 
                    content: `Jeg kunne desværre ikke finde nogen snippet med "${searchTerm}".`, 
                    ephemeral: true 
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Der opstod en fejl ved hentning fra databasen.', ephemeral: true });
        }
    }

    // --- /snippets [sprog] ---
    if (commandName === 'snippets') {
        const selectedLang = options.getString('sprog').toLowerCase();

        try {
            const response = await fetch('https://programmerings-hjaelper-default-rtdb.europe-west1.firebasedatabase.app/snippets.json');
            const data = await response.json();

            if (!data) {
                return interaction.reply({ content: 'Databasen er tom.', ephemeral: true });
            }

            const matchingSnippets = Object.values(data).filter(snippet => 
                snippet.language && snippet.language.toLowerCase() === selectedLang
            );

            if (matchingSnippets.length === 0) {
                return interaction.reply({ 
                    content: `Der blev ikke fundet nogen snippets til sproget **${selectedLang}**.`, 
                    ephemeral: true 
                });
            }

            const titles = matchingSnippets.map(snippet => `• **${snippet.title}**`).join('\n');
            await interaction.reply({ 
                content: `Her er alle snippets for **${selectedLang.toUpperCase()}**:\n${titles}`, 
                ephemeral: true 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Der skete en fejl under hentningen fra databasen.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);