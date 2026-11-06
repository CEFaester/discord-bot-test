const { Client, GatewayIntentBits } = require('discord.js');

// Opsæt klienten
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Kør dette når botten starter
client.on('ready', () => {
    console.log(`Logget ind som ${client.user.tag}!`);
});

// Lyt efter beskeder i serveren
client.on('messageCreate', async (message) => { 
    if (message.author.bot) return;

    // Opdel beskeden i selve kommandoen og argumenterne efter
    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. KOMMANDO: Søg efter en specifik snippet (!snippet knap)
    if (command === '!snippet') {
        const searchTerm = args.join(' ').toLowerCase();

        if (!searchTerm) {
            return message.reply('Husk at skrive, hvad du leder efter! F.eks. `!snippet knap`');
        }

        try {
            const response = await fetch('https://programmerings-hjaelper-default-rtdb.europe-west1.firebasedatabase.app/snippets.json');
            const data = await response.json();

            if (!data) {
                return message.reply('Databasen er tom.');
            }

            const snippetsArray = Object.values(data);

            // Tjek for 100% præcist match
            let matchendeSnippets = snippetsArray.filter(s => 
                s.title.toLowerCase() === searchTerm
            );

            // Hvis ikke præcist match, find dem der indeholder søgeordet
            if (matchendeSnippets.length === 0) {
                matchendeSnippets = snippetsArray.filter(s => 
                    s.title.toLowerCase().includes(searchTerm)
                );
            }

            // Håndter resultaterne
            if (matchendeSnippets.length === 1) {
                const snippet = matchendeSnippets[0];
                const reply = `**${snippet.title}**\n${snippet.description}\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``;
                message.reply(reply);
            } 
            else if (matchendeSnippets.length > 1) {
                const titleListe = matchendeSnippets.map(s => `- ${s.title}`).join('\n');
                message.reply(`Jeg fandt flere snippets der matcher. Prøv at søge mere specifikt på en af disse:\n${titleListe}`);
            } 
            else {
                message.reply(`Jeg kunne desværre ikke finde nogen snippet med "${searchTerm}".`);
            }
            
        } catch (error) {
            console.error(error);
            message.reply('Der opstod en fejl ved hentning fra databasen.');
        }
    }

    // 2. KOMMANDO: Vis alle snippets for et sprog (!snippets css)
    if (command === '!snippets') {
        const selectedLang = args[0]?.toLowerCase();

        if (!selectedLang) {
            return message.reply('Skriv hvilket sprog du vil se, f.eks: `!snippets css` eller `!snippets vue`');
        }

        try {
            const response = await fetch('https://programmerings-hjaelper-default-rtdb.europe-west1.firebasedatabase.app/snippets.json');
            const data = await response.json();

            if (!data) {
                return message.reply('Databasen er tom.');
            }

            // Filtrér snippets der matcher det valgte sprog
            const matchingSnippets = Object.values(data).filter(snippet => 
                snippet.language && snippet.language.toLowerCase() === selectedLang
            );

            if (matchingSnippets.length === 0) {
                return message.reply(`Der blev ikke fundet nogen snippets til sproget **${selectedLang}**.`);
            }

            // Saml titlerne i en pæn liste
            const titles = matchingSnippets.map(snippet => `• **${snippet.title}**`).join('\n');
            message.reply(`Her er alle snippets for **${selectedLang.toUpperCase()}**:\n${titles}`);

        } catch (error) {
            console.error('Fejl ved hentning af snippets:', error);
            message.reply('Der skete en fejl under hentningen fra databasen.');
        }
    }
});

// Indsæt dit nye token her
client.login('MTU2MzI2MzM5MDA5NTM4NDY4OQ.GViYi3.KpTl6jIMsemj6WDfIWpO1bSFzxpDVQf7wMnZDU');