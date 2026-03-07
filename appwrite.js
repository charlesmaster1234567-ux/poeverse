import { Client, Account, Databases } from "appwrite";

const client = new Client()
    .setEndpoint("https://nyc.cloud.appwrite.io/v1")
    .setProject("69abe2f5003b67f06aa9");

const account = new Account(client);
const databases = new Databases(client);

// Ping function to verify connection
async function verifyAppwriteConnection() {
    try {
        const health = await client.getHealth();
        console.log('✅ Appwrite connection verified:', health);
        return true;
    } catch (error) {
        console.error('❌ Appwrite connection failed:', error);
        return false;
    }
}

export { client, account, databases, verifyAppwriteConnection };