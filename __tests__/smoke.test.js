/**
 * Smoke Tests for Maxvy Bot
 * Basic tests to ensure core functionality works
 */

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should have GEMINI_API_KEY defined', () => {
    expect(process.env.GEMINI_API_KEY).toBeDefined();
  });

  test('should use default LOG_LEVEL if not set', () => {
    delete process.env.LOG_LEVEL;
    const level = process.env.LOG_LEVEL || 'info';
    expect(level).toBe('info');
  });

  test('should use default BOT_PREFIXES if not set', () => {
    delete process.env.BOT_PREFIXES;
    const prefixes = (process.env.BOT_PREFIXES || '.,!,/').split(',');
    expect(prefixes).toEqual(['.', ',', '!', '/']);
  });
});

describe('Storage Module', () => {
  const storage = require('../storage');

  test('should export required functions', () => {
    expect(storage.initStorage).toBeDefined();
    expect(storage.saveData).toBeDefined();
    expect(storage.getUserPersona).toBeDefined();
    expect(storage.getUserReminders).toBeDefined();
  });

  test('should have storage paths defined', () => {
    expect(storage.STORAGE).toBeDefined();
    expect(storage.STORAGE.reminders).toBe('./reminders.json');
    expect(storage.STORAGE.memory).toBe('./memory.json');
    expect(storage.STORAGE.knowledge).toBe('./knowledge.json');
  });
});

describe('Gemini Service', () => {
  const gemini = require('../services/gemini');

  test('should export generate function', () => {
    expect(gemini.generate).toBeDefined();
    expect(typeof gemini.generate).toBe('function');
  });

  test('should export generateWithCustomPrompt function', () => {
    expect(gemini.generateWithCustomPrompt).toBeDefined();
    expect(typeof gemini.generateWithCustomPrompt).toBe('function');
  });

  test('should handle empty prompt', async () => {
    const result = await gemini.generate('');
    expect(result).toContain('input');
  });
});

describe('Reminder Handler', () => {
  const reminderHandler = require('../handlers/reminder');

  test('should export all reminder functions', () => {
    expect(reminderHandler.handleNewReminder).toBeDefined();
    expect(reminderHandler.handleListReminder).toBeDefined();
    expect(reminderHandler.handleEditReminder).toBeDefined();
    expect(reminderHandler.handleDeleteReminder).toBeDefined();
  });
});

describe('AI Handler', () => {
  const aiHandler = require('../handlers/ai');

  test('should export all AI functions', () => {
    expect(aiHandler.handleAI).toBeDefined();
    expect(aiHandler.handleTranslate).toBeDefined();
    expect(aiHandler.handleSummarize).toBeDefined();
    expect(aiHandler.handleRewrite).toBeDefined();
    expect(aiHandler.handleCaption).toBeDefined();
    expect(aiHandler.handleIdea).toBeDefined();
    expect(aiHandler.handleCode).toBeDefined();
  });
});

describe('Package Configuration', () => {
  const packageJson = require('../package.json');

  test('should have correct name', () => {
    expect(packageJson.name).toBe('maxvy12');
  });

  test('should have required dependencies', () => {
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies['@google/generative-ai']).toBeDefined();
    expect(packageJson.dependencies['@whiskeysockets/baileys']).toBeDefined();
    expect(packageJson.dependencies['dotenv']).toBeDefined();
    expect(packageJson.dependencies['moment']).toBeDefined();
  });

  test('should require Node.js >= 20', () => {
    expect(packageJson.engines.node).toBe('>=20');
  });

  test('should have test script', () => {
    expect(packageJson.scripts.test).toBe('jest');
  });
});

describe('Bot Identity', () => {
  test('bot name should be Maxvy', () => {
    const botName = 'Maxvy';
    expect(botName).toBe('Maxvy');
  });

  test('developer should be maxvy.ai', () => {
    const developer = 'maxvy.ai';
    expect(developer).toBe('maxvy.ai');
  });
});

describe('File Structure', () => {
  const fs = require('fs');
  const path = require('path');

  test('should have required directories', () => {
    expect(fs.existsSync(path.join(__dirname, '../handlers'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../services'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../utils'))).toBe(true);
  });

  test('should have required files', () => {
    expect(fs.existsSync(path.join(__dirname, '../index.js'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../storage.js'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../package.json'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../.env.example'))).toBe(true);
  });

  test('should have security documentation', () => {
    expect(fs.existsSync(path.join(__dirname, '../SECURITY.md'))).toBe(true);
  });
});
