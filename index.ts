import express from 'express'
import bodyParser from "body-parser"
import { isBase64, isISO8601 } from 'validator'
import { checkReadingExists, extractValueFromImage, generateTemporaryUrl, getTemporaryImage } from './utils'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
const port = 3000


app.get('/', (req, res) => {
    res.json({ message: `Server is running on http://localhost:${port}`})
})

//upload
app.use(bodyParser.json({ limit: '10mb'}))

app.post('/upload', async (req, res) => {
    const { image, customer_code, measure_datetime, measure_type } = req.body

    // Validations
    if (!isBase64(image)) {
        return res.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "'image' não é um base64 string válido"
        })
    }

    if (!isISO8601(measure_datetime)) {
        return res.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "'measure_datetime' não é uma data válida"
        })
    }

    if (measure_type !== 'WATER' && measure_type !== 'GAS') {
        return res.status(400).json({
            error_code: "INVALID_DATA",
            error_description: "'measure_type' não é um valor válido"
        })
    }

    const readingExists = await checkReadingExists(customer_code, measure_datetime, measure_type)
    if (readingExists) {
        return res.status(409).json({
            error_code: "DOUBLE_REPORT",
            error_description: "Leitura do mês já realizada"
        })
    }

    // Gemini integration
    try {
        const extractedValue = await extractValueFromImage(image, measure_type)
        const { tempUrl, uniqueId } = generateTemporaryUrl(image)
        res.status(200).json({
            image_url: tempUrl,
            measure_value: extractedValue,
            measure_uuid: uniqueId
        })
    } catch (error) {
        res.status(500).json({
            error_code: "INTERNAL_ERROR",
            error_description: `Ocorreu um erro ao processar a imagem: ${error}`
        })
    }

})

// Temp images
app.get('/temp/:id', (req, res) => {
    const image = getTemporaryImage(req.params.id)
    if (image) {
        const imgBuffer = Buffer.from(image, 'base64')
        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': imgBuffer.length
        })
        res.end(imgBuffer)
    } else {
        res.status(404).json({ error: 'Image not found.' })
    }
})


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})

export { app }