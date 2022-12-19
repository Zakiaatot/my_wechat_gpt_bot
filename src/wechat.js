
import { WechatyBuilder } from 'wechaty'
import config from '../config.js'
import { reply } from './openai.js'
import qrcodeTerminal from 'qrcode-terminal'

const wechaty = WechatyBuilder.build() // get a Wechaty instance


const message_handler = async (message) => {
    try {
        const room = message.room()
        if (room && !message.self() && message.text().includes(config.BOT_NAME)) {
            const topic = await room.topic()
            if (config.WHITE_LIST.includes(topic) && message.type() === wechaty.Message.Type.Text) {
                const alias = (await message.talker().alias()) || (await message.talker().name())
                const text = message.text().replace(config.BOT_NAME, "")
                const res = await reply(text)
                await room.say("@" + alias + " \n" + res)
            }
        }
    } catch (error) {
        await room.say("Error:", error)
    }

}


function onScan(qrcode) {
    qrcodeTerminal.generate(qrcode); // 在console端显示二维码
}

wechaty
    .on('scan', onScan)
    .on('login', user => console.log(`User ${user} logged in`))
    .on('message', message_handler)

wechaty.start().catch((e) => console.error(e))