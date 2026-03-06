const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_lios')
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    })

    if (!sock.authState.creds.registered) {
        // मुकेश भाई, यहाँ अपना नंबर 91 के साथ चेक करें
        const phoneNumber = '919799282618' 
        await delay(5000)
        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`\n\n************************************`)
        console.log(`मुकेश भाई, आपका व्हाट्सएप पेयरिंग कोड है: ${code}`)
        console.log(`************************************\n\n`)
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('मुकेश भाई, बॉट अब ऑनलाइन है! गेमिंग हब तैयार है।')
        }
    })

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text
        const from = msg.key.remoteJid
        if (text === '.greencard') {
            await sock.sendMessage(from, { text: '✅ Green Card टाइमर शुरू! (10 Min)' })
        }
    })
}

startBot()
