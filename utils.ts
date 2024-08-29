import { GoogleGenerativeAI } from '@google/generative-ai'
const fs = require('fs')
import { v4 as uuidv4 } from 'uuid'

export function generateTemporaryUrl(base64Image: string) {
    const uniqueId = uuidv4()
    const tempUrl = `http://localhost:3000/temp/${uniqueId}`

    temporaryStorage[uniqueId] = base64Image
    return { tempUrl, uniqueId }
}

export function getTemporaryImage(uniqueId: string): string | null {
    return temporaryStorage[uniqueId] || null
}

const temporaryStorage: { [key: string]: string } = {}

export async function checkReadingExists(customer_code: string, measure_datetime: string,
    measure_type: string) : Promise<boolean> {

    return false
}

function base64toGenerativePart(base64: string, mimeType: string) {
    return {
        inlineData: {
            data: base64,
            mimeType
        },
    }
}

export async function extractValueFromImage(image: string, measure_type: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = measure_type === 'WATER'
        ? "Me retorne o valor da conta de água."
        : "Me retorne o total da conta de gás."

    const imageParts = [
        base64toGenerativePart(image, 'image/jpg')
    ]

    const result = await model.generateContent([prompt, ...imageParts])
    const response = await result.response
    console.log(response.text())

    return response.text()
}