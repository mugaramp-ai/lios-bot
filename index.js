const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const express = require('express')
const app = express()
const port = process.env.PORT || 10000

app.get('/', (req, res) => res.send('मुकेश भाई, आपका बॉट ज़िंदा है!'))
app.listen(port)

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_lios')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    })

    if (!sock.authState.creds.registered) {
        const phoneNumber = '+919001749912' // मुकेश भाई, आपका नंबर सेट है
        console.log("कनेक्शन बन रहा है, 20 सेकंड रुकिए...")
        await delay(20000) // यहाँ हमने इंतज़ार बढ़ा दिया है ताकि एरर न आए
        try {
            const code = await sock.requestPairingCode(phoneNumber)
            console.log(`\n\n************************************`)
            console.log(`मुकेश भाई, कोड मिल गया: ${code}`)
            console.log(`************************************\n\n`)
        } catch (err) {
            console.log("कोड मिलने में देरी हो रही है, रिस्टार्ट हो रहा है...")
            startBot()
        }
    }

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('बॉट ऑनलाइन है! अब आराम कीजिये।')
        }
    })
}

startBot()
