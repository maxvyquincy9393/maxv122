
const { handleAI, handleTranslate, handleSummarize, handleRewrite, handleCaption, handleIdea, handleCode } = require('../../handlers/ai');
const { generate } = require('../../services/gemini');

jest.mock('../../services/gemini', () => ({
    generate: jest.fn(),
}));

describe('AI Handler', () => {
    beforeEach(() => {
        generate.mockClear();
    });

    describe('handleAI', () => {
        it('should call the generate function with the correct prompt', async () => {
            generate.mockResolvedValue('AI response');
            const text = '/ai What is the meaning of life?';
            const response = await handleAI(null, null, null, text);
            expect(generate).toHaveBeenCalledWith('What is the meaning of life?');
            expect(response).toBe('AI response');
        });
    });

    describe('handleTranslate', () => {
        it('should call the generate function with the correct prompt', async () => {
            generate.mockResolvedValue('Hello world');
            const text = '/translate en "Halo dunia"';
            const response = await handleTranslate(null, null, null, text);
            expect(generate).toHaveBeenCalledWith('Translate this text to en:\nHalo dunia');
            expect(response).toBe('Hello world');
        });
    });

    describe('handleSummarize', () => {
        it('should call the generate function with the correct prompt', async () => {
            generate.mockResolvedValue('This is a summary.');
            const text = '/summarize This is a long text to summarize.';
            const response = await handleSummarize(null, null, null, text);
            expect(generate).toHaveBeenCalledWith('Summarize this text concisely:\nThis is a long text to summarize.');
            expect(response).toBe('This is a summary.');
        });
    });

    describe('handleRewrite', () => {
        it('should call the generate function with the correct prompt', async () => {
            generate.mockResolvedValue('This is a rewritten text.');
            const text = '/rewrite formal "this is a text to rewrite"';
            const response = await handleRewrite(null, null, null, text);
            expect(generate).toHaveBeenCalledWith('Rewrite this text in a formal style:\nthis is a text to rewrite');
            expect(response).toBe('This is a rewritten text.');
        });
    });

    describe('handleCaption', () => {
        it('should call the generate function with the correct prompt', async () => {
            generate.mockResolvedValue('This is a caption.');
            const text = '/caption A beautiful sunset';
            const response = await handleCaption(null, null, null, text);
            expect(generate).toHaveBeenCalledWith('Generate a creative and engaging social media caption about: A beautiful sunset');
            expect(response).toBe('This is a caption.');
        });
    });

    describe('handleIdea', () => {
        it('should call the generate function with the correct prompt', async () => {
            generate.mockResolvedValue('This is an idea.');
            const text = '/idea A new business';
            const response = await handleIdea(null, null, null, text);
            expect(generate).toHaveBeenCalledWith('Generate 3-5 creative content ideas about: A new business');
            expect(response).toBe('This is an idea.');
        });
    });

    describe('handleCode', () => {
        it('should call the generate function with the correct prompt', async () => {
            generate.mockResolvedValue('This is a code snippet.');
            const text = '/code "Create a function in python"';
            const response = await handleCode(null, null, null, text);
            expect(generate).toHaveBeenCalledWith('Generate code for this task:\nCreate a function in python\nProvide a brief explanation.');
            expect(response).toBe('This is a code snippet.');
        });
    });
});
