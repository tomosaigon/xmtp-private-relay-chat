import { botConfig, XmtpBot, IContext } from "xmtp-bot-cli";
import { Client, DecodedMessage } from "@xmtp/xmtp-js";
import { getAllRegistrations, getAddresses, getAddressesExceptSender, isAuthorizedSender, getSenderName, register } from "./dbqueries";

const COPY_SENDER = true;

if (process.env.PRC_XMTP_KEY === undefined) {
    console.log("PRC_XMTP_KEY is not set, creating a new wallet");
    botConfig.key = '';
} else {
    botConfig.key = process.env.PRC_XMTP_KEY;
}
if (process.env.PRC_XMTP_ENV !== undefined) {
    botConfig.env = process.env.PRC_XMTP_ENV as typeof botConfig.env;
}

async function handleCommand(ctx: IContext, line: string) {
    if (line === '/exit') {
        return false;
    } else if (line === '/info') {
        const registrations = await getAllRegistrations();
        if (registrations.length === 0) {
            console.log('No registrations found.');
        } else {
            console.log('Registrations:');
            for (const { name, address } of registrations) {
                console.log(`${name}: ${address}`);
            }
        }
    } else if (line.startsWith('/register ')) {
        const [, name, address] = line.split(' ');
        if (await register(name, address)) {
            console.log(`Registered: name:address = ${name}:${address}`);
        } else {
            console.log('Invalid registration format. Usage: register <name> <address>');
        }
    } else {
        console.log('Invalid command.');
    }
    return true;
}

async function handleMessage(ctx: IContext, message: DecodedMessage) {
    if (ctx.client !== undefined && message.senderAddress === (ctx.client as Client).address) {
        return true;
    }

    console.log(`Incoming message`, message.content, 'from', message.senderAddress);
    const senderAddress = message.senderAddress;

    if (await isAuthorizedSender(senderAddress)) {
        const senderName = await getSenderName(senderAddress);
        const broadcastMessage = `<${senderName}> ${message.content}`;
        const client = ctx.client as Client;
        const conversations = await client.conversations.list();
        const addresses = COPY_SENDER ? await getAddresses() : await getAddressesExceptSender(senderAddress);
        for (const address of addresses) {
            const matchingConversation = conversations.find((c) => c.peerAddress === address);
            console.log(`${matchingConversation ? 'Replying matched convo' : 'Creating new convo'}: ${address}`);
            if (matchingConversation) {
                await matchingConversation.send(broadcastMessage);
            } else {
                // Conversation not found, create a new one and send the message
                const newConversation = await client.conversations.newConversation(address);
                await newConversation.send(broadcastMessage);
            }
        }
    } else {
        if (message.content.startsWith('/register ') && message.content.split(' ').length === 2) {
            const [, name, address] = message.content.split(' ');
            if (await register(name, address)) {
                await message.conversation.send(`Registered: name:address = ${name}:${address}`);
            } else {
                await message.conversation.send('Invalid registration format. Usage: register <name> <address>');
            }
        } else {
            const replyMessage = "You are not authorized to send messages or the message format is invalid.";
            await message.conversation.send(replyMessage);
        }
    }
    return true;
}

console.log('Starting bot.');
const bot = new XmtpBot(
    handleCommand,
    handleMessage,
);

bot.run().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error(`bot.run() error: ${err}`);
    process.exit(1);
});
