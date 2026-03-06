const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const express = require('express')
const app = express()
const port = process.env.PORT || 3000

// Render को जगाए रखने के लिए छोटा सर्वर
app.get('/', (req, res) => res.send('बॉट चालू है, मुकेश भाई!'))
app.listen(port, () => console.log(`Server running on port ${port}`))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_lios')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    })

    if (!sock.authState.creds.registered) {
        const phoneNumber = '919799282618' 
        await delay(8000) // थोड़ा इंतज़ार ताकि सर्वर सेट हो जाए
        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`\n\n************************************`)
        console.log(`मुकेश भाई, कोड है: ${code}`)
        console.log(`************************************\n\n`)
    }

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('बॉट ऑनलाइन हो गया है!')
        }
    })
}

startBot()
