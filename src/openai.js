import { markdownToTxt } from 'markdown-to-txt'
import { Configuration, OpenAIApi } from "openai"
import config from '../config.js'

const configuration = new Configuration({
    apiKey: config.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)


const reply = async (prompt) => {
    console.log('👀 👀 👀 / prompt: ', prompt)
    try {
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            temperature: 0.9,
            max_tokens: 4000,
            frequency_penalty: 0.0,
            presence_penalty: 0.6,
            stop: [' Human:', ' AI:'],
        })
        const reply = markdownToTxt(response.data.choices[0].text)
        console.log('✅ ✅ ✅ / reply: ', reply)
        return reply
    } catch (error) {
        console.log('❌ ❌ ❌ / error: ')
        if (error.response) {
            console.log(error.response.status)
            return error.response.status
        } else {
            console.log(error.message)
            return error.message
        }
    }
}



export {
    reply
}
