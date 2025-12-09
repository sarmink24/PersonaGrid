import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    try {
        console.log('Testing gemini-1.5-flash-latest...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        const result = await model.generateContent('Hello');
        console.log('Success with gemini-1.5-flash-latest:', result.response.text());
    } catch (error: any) {
        console.error('Error with gemini-1.5-flash-latest:', error.message);
    }

    try {
        console.log('\nTesting gemini-1.0-pro...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
        const result = await model.generateContent('Hello');
        console.log('Success with gemini-1.0-pro:', result.response.text());
    } catch (error: any) {
        console.error('Error with gemini-1.0-pro:', error.message);
    }

    try {
        console.log('\nTesting gemini-pro...');
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('Hello');
        console.log('Success with gemini-pro:', result.response.text());
    } catch (error: any) {
        console.error('Error with gemini-pro:', error.message);
    }
}

listModels();
