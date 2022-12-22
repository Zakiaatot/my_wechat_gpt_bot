import Wechat from 'wechat4u'
import qrcodeTerminal from 'qrcode-terminal'
import fs from 'fs'
import config from '../config.js'
import { reply } from './openai.js'

//存登录信息目录
const tmp_path = "./last_login.json"

let bot
//从之前保存的数据登录
try {
    const user_data = JSON.parse(fs.readFileSync(tmp_path).toString())
    bot = new Wechat(user_data)
} catch (e) {
    bot = new Wechat()
}

//启动
if (bot.PROP.uin) {
    bot.restart()
} else {
    bot.start()
}





/* 
事件监听
*/

//扫码登录
bot.on('uuid', uuid => {
    qrcodeTerminal.generate('https://login.weixin.qq.com/l/' + uuid, {
        small: true
    })
    console.log('二维码登录链接：', 'https://login.weixin.qq.com/qrcode/' + uuid)
})

//登录成功事件
bot.on('login', () => {
    console.log('登录成功')
    // 保存数据，将数据序列化之后保存到任意位置
    fs.writeFileSync(tmp_path, JSON.stringify(bot.botData))
})

//登出成功事件
bot.on('logout', () => {
    console.log('登出成功')
    // 清除数据
    fs.unlinkSync(tmp_path)
})

//错误事件
bot.on('error', err => {
    console.error('错误：', err)
})


//处理消息
bot.on('message', async msg => {
    if (msg.MsgType === bot.CONF.MSGTYPE_TEXT && !msg.isSendBySelf) { //文本消息且不是自己发送的
        const contact = bot.contacts[msg.FromUserName] //会话对象
        if (bot.Contact.isRoomContact(contact)) { //如果是群组会话
            if (config.WHITE_LIST.includes(contact.NickName) && msg.Content.includes(config.BOT_NAME)) {//如果是白名单群组且触发关键词
                const args = msg.Content.split(":\n")
                const from_id = args[0]
                args.shift()
                let txt = args.join('')
                txt = txt.split(config.BOT_NAME)
                txt = txt.join('').trim()


                const { EncryChatRoomId } = await bot.batchGetContact([{ UserName: msg.FromUserName }]) //获取EncryChatRoomId
                const [room_info] = await bot.batchGetContact([{ UserName: msg.FromUserName, EncryChatRoomId }]) //获取群员详细信息
                const member_info = room_info.MemberList

                let at_name
                for (let i = 0; i < member_info.length; ++i) {
                    if (member_info[i].UserName === from_id) { //如果为发送者
                        at_name = member_info[i].DisplayName || member_info[i].NickName
                    }
                }

                const res = await reply(txt)
                bot.sendMsg("@" + at_name + ":\n" + res, msg.FromUserName).catch(err => {
                    bot.emit('error', err)
                })


            }
        } else {    //个人消息
            const res = await reply(msg.Content)
            bot.sendMsg(res, msg.FromUserName).catch(err => {
                bot.emit('error', err)
            })
        }

    }
})