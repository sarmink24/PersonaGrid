import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function listAvailableModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    const modelsToTest = [
        'gemini-pro',
        'gemini-1.0-pro',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'models/gemini-pro',
        'models/gemini-1.5-flash'
    ];

    console.log('Testing available Gemini models...\n');

    for (const modelName of modelsToTest) {
        try {
            console.log(`Testing: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Say hello');
            console.log(`✅ SUCCESS: ${modelName}`);
            console.log(`Response: ${result.response.text()}\n`);
            break; // Stop after first success
        } catch (error: any) {
            console.log(`❌ FAILED: ${modelName}`);
            console.log(`Error: ${error.message}\n`);
        }
    }
}

listAvailableModels().catch(console.error);
