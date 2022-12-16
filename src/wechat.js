
import { WechatyBuilder } from 'wechaty'
import config from '../config.js'
import { reply } from './openai.js'

const message_handler = async (message) => {
    const room = message.room()
    if (room && !message.self() && message.mentionSelf()) {
        const topic = await room.topic()
        if (config.WHITE_LIST.includes(topic)) {
            const alias = (await message.talker().alias()) || (await message.talker().name())
            const text = message.text().replace(config.BOT_NAME, "")
            const res = await reply(text)
            room.say("@" + alias + " \n" + res)
        }
    }

}

const wechaty = WechatyBuilder.build() // get a Wechaty instance
wechaty
    .on('scan', (qrcode, status) => console.log(`Scan QR Code to login: ${status}\nhttps://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`))
    .on('login', user => console.log(`User ${user} logged in`))
    .on('message', message_handler)
wechaty.start()