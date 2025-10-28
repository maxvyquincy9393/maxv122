# 🤝 Contributing Guide

Thank you for your interest in improving MAXVY JARVIS AI!

## 📋 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Report issues responsibly

## 🚀 Getting Started

### 1. Fork and Clone
```bash
git clone <your-fork-url>
cd maxvy12
npm install
```

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes
- Follow the existing code style
- Add error handling
- Write clear comments
- Test your changes

### 4. Commit
```bash
git commit -m "feat: add your feature description"
```

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```

## 📝 Code Style

### JavaScript Standards
```javascript
// Use const/let, not var
const myVar = 'value'

// Use async/await
async function myFunction() {
    try {
        const result = await someAsync()
        return result
    } catch (err) {
        console.error('Error:', err.message)
        return null
    }
}

// Use arrow functions
const handler = (msg) => {
    return msg.text
}

// Use template literals
const message = `Hello ${name}!`
```

### Error Handling
```javascript
// Always wrap in try-catch
async function handleCommand(sock, msg, sender, text) {
    try {
        // Your code here
        return 'Success message'
    } catch (err) {
        console.error('Error in handleCommand:', err.message)
        return '❌ Error message'
    }
}
```

### Logging
```javascript
// Use emoji indicators
console.log('✅ Success message')
console.error('❌ Error message')
console.log('⚠️ Warning message')
console.log('🔄 Processing...')
```

## 🏗️ Project Structure

```
handlers/          # Command handlers
├── ai.js         # AI features
├── reminder.js   # Reminders
├── media.js      # Images & voice
├── memory.js     # User memory
├── rag.js        # Knowledge base
└── help.js       # Help menu

services/         # External APIs
├── gemini.js     # Gemini API
└── huggingface.js # HF API

utils/            # Utilities
├── helpers.js    # Helper functions
└── commandLoader.js # Command loading

storage.js        # Data storage
index.js          # Main bot file
```

## 🎯 Adding a New Handler

### 1. Create Handler File
```javascript
// handlers/myfeature.js
async function handleMyFeature(sock, msg, sender, text) {
    try {
        // Parse input
        const match = text.match(/^\/mycommand\s+"([^"]+)"/);
        if (!match) return '❌ Format: /mycommand "text"';
        
        // Process
        const result = await processData(match[1]);
        
        // Return
        return `✅ Result: ${result}`;
    } catch (err) {
        console.error('Error in handleMyFeature:', err.message);
        return '❌ Error processing request';
    }
}

module.exports = { handleMyFeature };
```

### 2. Register in commandLoader.js
```javascript
// In loadCommands() function
else if (commandName === 'myfeature') {
    commandMap.set('/mycommand', handler.handleMyFeature)
}
```

### 3. Import in index.js
```javascript
const { handleMyFeature } = require('./handlers/myfeature')
```

## 🧪 Testing

### Manual Testing
```bash
npm start
# Send commands in WhatsApp
```

### Adding Unit Tests
```javascript
// __tests__/handlers/myfeature.test.js
const { handleMyFeature } = require('../../handlers/myfeature');

describe('handleMyFeature', () => {
    test('should handle valid input', async () => {
        const result = await handleMyFeature(null, null, 'user', '/mycommand "test"');
        expect(result).toContain('✅');
    });

    test('should handle invalid input', async () => {
        const result = await handleMyFeature(null, null, 'user', '/mycommand');
        expect(result).toContain('❌');
    });
});
```

Run tests:
```bash
npm test
```

## 📚 Documentation

### Update README.md
- Add command to command list
- Add examples
- Update features section

### Update SETUP.md
- Add troubleshooting if needed
- Update configuration section

### Update Help Handler
- Add to help menu
- Include examples
- Add to tips if relevant

## 🔍 Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guide
- [ ] Error handling is complete
- [ ] Console logs use emoji indicators
- [ ] Comments are clear
- [ ] No console.log() left in code
- [ ] No hardcoded values
- [ ] Tests pass (if applicable)
- [ ] Documentation is updated
- [ ] No breaking changes
- [ ] Commit messages are clear

## 🐛 Reporting Bugs

### Create Issue with:
1. **Title**: Clear description
2. **Description**: What happened
3. **Steps**: How to reproduce
4. **Expected**: What should happen
5. **Actual**: What actually happened
6. **Environment**: Node version, OS, etc.

### Example:
```
Title: Bot crashes on invalid reminder time

Description:
When I try to create a reminder with an invalid time format, 
the bot crashes instead of showing an error message.

Steps:
1. Send /newreminder "test jam 99:99"
2. Bot crashes

Expected:
Should show error message about invalid time format

Actual:
Bot process exits with error

Environment:
- Node.js 18.0.0
- Windows 11
```

## 💡 Feature Requests

### Create Issue with:
1. **Title**: Feature name
2. **Description**: What it does
3. **Use Case**: Why it's needed
4. **Example**: How it would work

### Example:
```
Title: Add weather command

Description:
Add a /weather command to get current weather

Use Case:
Users want to check weather without leaving WhatsApp

Example:
/weather "Jakarta"
→ Current weather in Jakarta: 28°C, Sunny
```

## 🚀 Performance Tips

### Do's
- ✅ Use async/await
- ✅ Cache repeated requests
- ✅ Validate input early
- ✅ Use efficient algorithms
- ✅ Log important events

### Don'ts
- ❌ Use synchronous file I/O
- ❌ Make unnecessary API calls
- ❌ Store large data in memory
- ❌ Use console.log() for debugging
- ❌ Ignore errors

## 🔐 Security Tips

### Do's
- ✅ Validate all inputs
- ✅ Sanitize user data
- ✅ Use environment variables for secrets
- ✅ Handle errors gracefully
- ✅ Rate limit API calls

### Don'ts
- ❌ Hardcode API keys
- ❌ Trust user input
- ❌ Log sensitive data
- ❌ Expose error details
- ❌ Ignore security warnings

## 📞 Getting Help

- 📖 Read existing code
- 💬 Ask in issues
- 🔍 Check documentation
- 🧪 Look at tests
- 👥 Ask the community

## 🎓 Learning Resources

- [Node.js Best Practices](https://nodejs.org/en/docs/)
- [Async/Await Guide](https://javascript.info/async-await)
- [Error Handling](https://nodejs.org/en/docs/guides/nodejs-error-handling/)
- [Testing with Jest](https://jestjs.io/docs/getting-started)

## 🎉 Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in releases
- Credited in commits

## 📄 License

By contributing, you agree that your contributions will be licensed under the ISC license.

---

**Thank you for contributing! 🙏**

Happy coding! 💻
