
const { handleNewReminder, handleListReminder, handleEditReminder, handleDeleteReminder } = require('../../handlers/reminder');
const { reminders, saveData } = require('../../storage');

jest.mock('../../storage', () => ({
    reminders: [],
    saveData: jest.fn(),
}));

describe('Reminder Handler', () => {
    beforeEach(() => {
        // Clear the mock reminders and saveData calls before each test
        reminders.length = 0;
        saveData.mockClear();
    });

    describe('handleNewReminder', () => {
        it('should add a new reminder', async () => {
            const sock = {};
            const msg = {};
            const sender = '1234567890@c.us';
            const text = '/newreminder "Test reminder at 10:00"';

            const response = await handleNewReminder(sock, msg, sender, text);

            expect(response).toContain('✅ Reminder set for 10:00');
            expect(reminders.length).toBe(1);
            expect(reminders[0].task).toBe('Test reminder at 10:00');
            expect(saveData).toHaveBeenCalledWith('reminders', reminders);
        });
    });

    describe('handleListReminder', () => {
        it('should list all reminders for a user', async () => {
            const sock = {};
            const msg = {};
            const sender = '1234567890@c.us';
            reminders.push({ sender, task: 'Test reminder 1', cronTime: '0 10 * * *' });
            reminders.push({ sender, task: 'Test reminder 2', cronTime: '30 12 * * *' });

            const response = await handleListReminder(sock, msg, sender);

            expect(response).toContain('1. 10:00 - Test reminder 1');
            expect(response).toContain('2. 12:30 - Test reminder 2');
        });

        it('should return a message if there are no reminders', async () => {
            const sock = {};
            const msg = {};
            const sender = '1234567890@c.us';

            const response = await handleListReminder(sock, msg, sender);

            expect(response).toBe('No reminders set');
        });
    });

    describe('handleEditReminder', () => {
        it('should edit an existing reminder', async () => {
            const sock = {};
            const msg = {};
            const sender = '1234567890@c.us';
            reminders.push({ sender, task: 'Test reminder', cronTime: '0 10 * * *' });

            const text = '/editreminder 1 "New reminder at 11:00"';
            const response = await handleEditReminder(sock, msg, sender, text);

            expect(response).toContain('✅ Reminder updated to 11:00');
            expect(reminders[0].task).toBe('New reminder at 11:00');
            expect(saveData).toHaveBeenCalledWith('reminders', reminders);
        });
    });

    describe('handleDeleteReminder', () => {
        it('should delete an existing reminder', async () => {
            const sock = {};
            const msg = {};
            const sender = '1234567890@c.us';
            reminders.push({ sender, task: 'Test reminder', cronTime: '0 10 * * *' });

            const text = '/delreminder 1';
            const response = await handleDeleteReminder(sock, msg, sender, text);

            expect(response).toBe('✅ Reminder deleted');
            expect(reminders.length).toBe(0);
            expect(saveData).toHaveBeenCalledWith('reminders', reminders);
        });
    });
});
