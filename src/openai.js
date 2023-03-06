// import axios from 'axios'
import config from '../config.js'
import { ChatGPTAPI, ChatGPTError } from 'chatgpt'


// 2023.3.6 更新
// //请求实例
// const req_instance = axios.create({
//     baseURL: 'https://api.openai.com',
//     timeout: 60 * 1000,
//     headers: {
//         'Accept-Encoding': 'gzip, deflate, compress'
//     }
// })

// req_instance.interceptors.request.use((cfg) => {
//     cfg.headers.Authorization = `Bearer ${config.OPENAI_API_KEY}`
//     cfg.headers['content-type'] = 'application/json;charset=UTF-8'
//     return cfg
// })

// const MAX = 3000
// const MAXTOKEN = 500

// //请求函数
// const req = async (prompt) => await req_instance.post('v1/engines/text-davinci-003/completions', {
//     prompt: prompt,
//     temperature: 0.9,
//     max_tokens: MAXTOKEN,
//     top_p: 1,
//     frequency_penalty: 0,
//     presence_penalty: 0.6,
//     best_of: 1,
//     stop: [
//         ' Human:',
//         ' AI:'
//     ]
// })


// const template
//     = 'The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\n'
//     + 'Human: Hello, who are you?\n'
//     + 'AI: I am an AI created by OpenAI. How can I help you today?\n'

// //构建一个对话类
// class Conversation {
//     id = NaN
//     is_asking = false//锁
//     prompt = template

//     constructor(id) {
//         this.id = id
//     }

//     async ask(questions) {
//         this.is_asking = true
//         this.check()
//         let reply = ''
//         try {
//             let tmp_prompt = this.prompt + 'Human: ' + questions + '\n'
//             while (1) {
//                 let now_prompt = tmp_prompt + 'AI: ' + reply
//                 if (now_prompt.length >= MAX - MAXTOKEN) now_prompt = now_prompt.slice(now_prompt.length - (MAX - MAXTOKEN))
//                 const { data } = await req(now_prompt)
//                 const [choice] = data.choices
//                 reply += choice.text
//                 if (choice.finish_reason === 'stop') break;
//             }
//             this.prompt = tmp_prompt
//             this.prompt += 'AI: ' + reply + '\n'
//         } catch (e) {
//             reply = '错误,稍后再试：'
//             if (e.response && e.response.data && e.response.data.error) {
//                 reply += e.response.data.error.message
//                 console.log(e.response.data.error.message)
//             } else if (e.message) {
//                 reply += e.message
//                 console.log(e.message)
//             }
//             else {
//                 reply += '未知错误！'
//                 console.log(e)
//             }
//         }
//         this.is_asking = false
//         this.check()
//         return reply
//     }

//     check() {
//         if (this.prompt.length >= MAX - MAXTOKEN) this.prompt = this.prompt.slice(this.prompt.length - (MAX - MAXTOKEN))
//     }
// }


//构建一个对话类
class Conversation {
    id = NaN
    res = NaN
    is_asking = false//锁
    api = new ChatGPTAPI({ apiKey: config.OPENAI_API_KEY })
    history = ''

    constructor(id) {
        this.id = id
    }

    async ask(questions) {
        this.is_asking = true
        let reply = ''


        try {
            if (this.res === NaN) {
                this.res = await this.api.sendMessage(questions)
            } else {
                this.res = await this.api.sendMessage(questions, {
                    parentMessageId: this.res.id
                })
            }
            reply = this.res.text
            this.history += 'Human: ' + questions + '\nAI: ' + reply
        } catch (error) {
            reply = error instanceof ChatGPTError
                ? error.message
                : error instanceof Error ? error.message : error
        }



        this.is_asking = false
        return reply
    }
}


//对话池
const conversation_map = new Map()


export const reply = async (id, questions) => {
    console.log("ID: ", id, "\tQ:", questions)
    const is_exist_conversation = conversation_map.has(id)
    if (is_exist_conversation && await conversation_map.get(id).is_asking) {
        return '你的上一个问题我正在思考，稍等！'
    }

    if (questions === config.RESET) {//reset
        if (!is_exist_conversation) return '未开始对话无需重置!'
        conversation_map.delete(id)
        return '对话已重置！'
    } else if (questions === config.HISTORY) {//history
        if (!is_exist_conversation) return '无历史记录！'
        return await conversation_map.get(id).history
    }


    if (!is_exist_conversation) {
        conversation_map.set(id, new Conversation(id))
    }

    const conversation = await conversation_map.get(id)
    return conversation.ask(questions)
}


