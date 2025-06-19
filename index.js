const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash'
}); 

const upload = multer({ dest: 'uploads/' });

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Gemini API Server is running on http://localhost:${PORT}`);
}); 


// endpoint to generate text based on a prompt
app.post('/generate-text', async (req, res) => {
    const { prompt } = req.body;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;

        res.json({ output: response.text() });
    } catch (error) {
        console.error('Error generating text:', error);
        res.status(500).json({ error: error.message });
    }
});

// endpoint to generate text based on a prompt and an image
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    const imageToGenerativePart = (filePath) => ({
        inlineData: {
            data: fs.readFileSync(filePath).toString('base64'),
            mimeType: 'image/png',
        }    
    });
    
    const prompt = req.body.prompt || 'Describe the image';
    const image = imageToGenerativePart(req.file.path);

    try {
        const result = await model.generateContent([ prompt, image ]);
        const response = result.response;

        res.json({ output: response.text() });
    } catch (error) {
        console.error('Error generating from image:', error);
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up the uploaded file
        console.log('Uploaded file deleted:', req.file.path);
    }
});

// endpoint to generate text based on a prompt and a document
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    const prompt = 'Analize this document:';
    const documentPath = req.file.path;
    const buffer = fs.readFileSync(documentPath);
    const base64Document = buffer.toString('base64');
    const mimeType = req.file.mimetype || 'application/pdf'; // Default to PDF if not specified

    try {
        const documentContent = {
            inlineData: {
                data: base64Document,
                mimeType: mimeType,
            }
        };

        const result = await model.generateContent([ prompt, documentContent ]);
        const response = result.response;

        res.json({ output: response.text() });
    } catch (error) {
        console.error('Error generating from document:', error);
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlinkSync(documentPath); // Clean up the uploaded file
        console.log('Uploaded file deleted:', documentPath);
    }
});

// endpoint to generate text based on a prompt and an audio file
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    const prompt = 'Transcribe this audio:';
    const audioPath = req.file.path;
    const buffer = fs.readFileSync(audioPath);
    const base64Audio = buffer.toString('base64');
    const mimeType = req.file.mimetype || 'audio/mpeg'; // Default to MP3 if not specified

    try {
        const audioContent = {
            inlineData: {
                data: base64Audio,
                mimeType: mimeType,
            }
        };

        const result = await model.generateContent([ prompt, audioContent ]);
        const response = result.response;

        res.json({ output: response.text() });
    } catch (error) {
        console.error('Error generating from audio:', error);
        res.status(500).json({ error: error.message });
    } finally {
        fs.unlinkSync(audioPath); // Clean up the uploaded file
        console.log('Uploaded file deleted:', audioPath);
    }
});