
const { handleImage, handleVoiceNote } = require('../../handlers/media');
const { hf } = require('../../services/huggingface');
const { downloadMedia } = require('../../utils/helpers');

jest.mock('../../services/huggingface', () => ({
    __esModule: true,
    hf: {
        textToImage: jest.fn(() => Promise.resolve({ arrayBuffer: () => Promise.resolve(Buffer.from('image data')) })),
        automaticSpeechRecognition: jest.fn(),
    },
}));

jest.mock('../../utils/helpers', () => ({
    ...jest.requireActual('../../utils/helpers'),
    downloadMedia: jest.fn(),
    checkRateLimit: jest.fn(() => null),
}));

describe('Media Handler', () => {
    beforeEach(() => {
        hf.textToImage.mockClear();
        hf.automaticSpeechRecognition.mockClear();
        downloadMedia.mockClear();
    });

    describe('handleImage', () => {
        it('should generate an image and send it', async () => {
            const sock = {
                sendMessage: jest.fn(),
            };
            const msg = { key: { remoteJid: '123@c.us' } };
            const text = '/img a cat';

            hf.textToImage.mockResolvedValue(new Blob());

            const response = await handleImage(sock, msg, 'user', text);

            expect(hf.textToImage).toHaveBeenCalledWith({
                model: expect.any(String),
                inputs: 'a cat',
                parameters: {
                    negative_prompt: 'nsfw, nude, explicit content',
                },
            });
            expect(sock.sendMessage).toHaveBeenCalledWith('123@c.us', {
                image: expect.any(Buffer),
                caption: 'a cat',
            });
            expect(response).toBeNull();
        });
    });

    describe('handleVoiceNote', () => {
        it('should transcribe a voice note', async () => {
            const sock = {};
            const msg = { message: { audioMessage: { ptt: true } } };

            downloadMedia.mockResolvedValue(Buffer.from('audio data'));
            hf.automaticSpeechRecognition.mockResolvedValue({ text: 'This is a transcription.' });

            const response = await handleVoiceNote(sock, msg, 'user');

            expect(downloadMedia).toHaveBeenCalledWith(msg, 'audioMessage');
            expect(hf.automaticSpeechRecognition).toHaveBeenCalledWith({
                model: expect.any(String),
                data: expect.any(Buffer),
            });
            expect(response).toBe('🎙️ Transcription:\nThis is a transcription.');
        });
    });
});
