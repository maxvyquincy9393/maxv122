
const { handleHelp } = require('../../handlers/help');

describe('Help Handler', () => {
    it('should return the help message', async () => {
        const helpMessage = await handleHelp();
        expect(helpMessage).toContain('MAXVY JARVIS AI COMMANDS');
    });
});
