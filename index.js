const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const qrcode = require('qrcode-terminal')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_lios')
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        if(qr) {
            qrcode.generate(qr, { small: true })
            console.log('मुकेश भाई, व्हाट्सएप से इस QR कोड को स्कैन करें!')
        }
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('बॉट ऑनलाइन है! मुकेश गेमिंग हब तैयार है।')
        }
    })

    // मुकेश भाई, यहाँ बटन से आने वाले मैसेज हैंडल होंगे
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text
        const from = msg.key.remoteJid

        if (text === '.greencard') {
            await sock.sendMessage(from, { text: '✅ Green Card टाइमर शुरू! (10 Min)' })
        } else if (text === '.tank') {
            await sock.sendMessage(from, { text: '🚀 TANK बॉस का टाइमर शुरू! (6 HR)' })
        }
        // आप यहाँ और भी कमांड्स जोड़ सकते हैं
    })
}

startBot()
