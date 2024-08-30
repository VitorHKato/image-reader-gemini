import type { Config } from 'jest'

const config: Config = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)']
}

export default config