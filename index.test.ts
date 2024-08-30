import request from 'supertest'
import { checkReadingExists, extractValueFromImage, generateTemporaryUrl } from './utils'
import dotenv from 'dotenv'
import { app } from './index'

dotenv.config()

jest.mock('./utils')

const mockedCheckReadingExists = checkReadingExists as jest.Mock
const mockedExtractValueFromImage = extractValueFromImage as jest.Mock
const mockedGenerateTemporaryUrl = generateTemporaryUrl as jest.Mock

describe('POST /upload', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('Should return 400 if image is not a valid base64 string', async() => {
        const response = await request(app)
            .post('/upload')
            .send({
                image: 'invalid_base64',
                customer_code: '123',
                measure_datetime: '2023-01-01T00:00:00Z',
                measure_type: 'WATER'
            })

        expect(response.status).toBe(400)
        expect(response.body).toEqual({
            error_code: 'INVALID_DATA',
            error_description: "'image' não é um base64 string válido"
        })
    })

    it('should return 400 if measure_datetime is not a valid ISO8601 date', async () => {
        const response = await request(app)
            .post('/upload')
            .send({
                image: 'valid_base64_string',
                customer_code: '123',
                measure_datetime: 'invalid_date',
                measure_type: 'WATER'
            })

        expect(response.status).toBe(400)
        expect(response.body).toEqual({
            error_code: 'INVALID_DATA',
            error_description: "'measure_datetime' não é uma data válida"
        })
    })

    it('should return 400 if measure_type is not valid', async () => {
        const response = await request(app)
            .post('/upload')
            .send({
                image: 'valid_base64_string',
                customer_code: '123',
                measure_datetime: '2023-01-01T00:00:00Z',
                measure_type: 'INVALID_TYPE'
            })

        expect(response.status).toBe(400)
        expect(response.body).toEqual({
            error_code: 'INVALID_DATA',
            error_description: "'measure_type' não é um valor válido"
        })
    })

    it('should return 409 if reading already exists', async () => {
        mockedCheckReadingExists.mockResolvedValue(true)

        const response = await request(app)
            .post('/upload')
            .send({
                image: 'valid_base64_string',
                customer_code: '123',
                measure_datetime: '2023-01-01T00:00:00Z',
                measure_type: 'WATER'
            })

        expect(response.status).toBe(409)
        expect(response.body).toEqual({
            error_code: 'DOUBLE_REPORT',
            error_description: 'Leitura do mês já realizada'
        })
    })

    it('should return 200 and the extracted value if all validations pass', async() => {
        mockedCheckReadingExists.mockResolvedValue(false)
        mockedExtractValueFromImage.mockResolvedValue('123')
        mockedGenerateTemporaryUrl.mockReturnValue({
            tempUrl: 'http://localhost:3000/temp/uniqueId',
            uniqueId: 'uniqueId'
        })

        const response = await request(app)
            .post('/upload')
            .send({
                image: 'valid_base64_string',
                customer_code: '123',
                measure_datetime: '2023-01-01T00:00:00Z',
                measure_type: 'WATER'
            })

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            image_url: 'http://localhost:3000/temp/uniqueId',
            measure_value: '123',
            measure_uuid: 'uniqueId'
        })
    })

    it('should return 500 if an error occurs during image processing', async () => {
        mockedCheckReadingExists.mockResolvedValue(false)
        mockedExtractValueFromImage.mockRejectedValue(new Error('Processing error'))

        const response = await request(app)
            .post('/upload')
            .send({
                image: 'valid_base64_string',
                customer_code: '123',
                measure_datetime: '2023-01-01T00:00:00Z',
                measure_type: 'WATER'
            })

        expect(response.status).toBe(500)
        expect(response.body).toEqual({
            error_code: 'INTERNAL_ERROR',
            error_description: 'Ocorreu um erro ao processar a imagem: Error: Processing error'
        })
    })
})