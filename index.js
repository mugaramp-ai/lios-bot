const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const express = require('express')
const QRCode = require('qrcode')
const app = express()
const port = process.env.PORT || 8080

let qrCodeImage = ''

// यह हिस्सा आपके Preview पेज पर QR कोड दिखाएगा
app.get('/', (req, res) => {
    if (qrCodeImage) {
        res.send(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#f0f2f5;font-family:sans-serif;">
            <div style="background:white;padding:30px;border-radius:20px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.1);">
                <h2 style="color:#075e54;">मुकेश भाई, इसे व्हाट्सएप से स्कैन करें</h2>
                <img src="${qrCodeImage}" style="width:300px;margin:20px 0;">
                <p style="color:#666;">स्कैन करते ही आपका बॉट ऑनलाइन हो जाएगा!</p>
            </div></body></html>`)
    } else {
        res.send('<h2 style="text-align:center;margin-top:50px;">बॉट तैयार हो रहा है... कृपया 10 सेकंड बाद रिफ्रेश करें।</h2>')
    }
})

app.listen(port)

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_lios')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // टर्मिनल की वार्निंग से बचने के लिए
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    })

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) qrCodeImage = await QRCode.toDataURL(qr)
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            qrCodeImage = ''
            console.log('मुकेश भाई, बॉट ऑनलाइन हो गया है!')
        }
    })
}
startBot()
