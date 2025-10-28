
const { userMemory, saveMemory, getUserPersona, upsertUserPersona, addUserNote } = require('../storage')
const moment = require('moment')

async function handleSetPersona(sock, msg, sender, text) {
    try {
        const match = text.match(/^\/setpersona\s+"([^"]+)"/);
        if (!match) return '❌ Format: /setpersona "your persona description"\n\nExample: /setpersona "I am a developer interested in AI"';

        await upsertUserPersona(sender, match[1]);
        return '✅ Persona updated successfully';
    } catch (err) {
        console.error('Error in handleSetPersona:', err.message);
        return '❌ Error updating persona. Please try again.';
    }
}

async function handleAddNote(sock, msg, sender, text) {
    try {
        const match = text.match(/^\/addnote\s+"([^"]+)"/);
        if (!match) return '❌ Format: /addnote "your note"\n\nExample: /addnote "Remember to study tomorrow"';

        await addUserNote(sender, match[1]);
        return '✅ Note added successfully';
    } catch (err) {
        console.error('Error in handleAddNote:', err.message);
        return '❌ Error adding note. Please try again.';
    }
}

async function handleMyNotes(sock, msg, sender) {
    try {
        const userData = getUserPersona(sender);
        
        if (!userData.notes || userData.notes.length === 0) {
            return '📭 No notes found\n\nUse /addnote "text" to create one';
        }

        let response = '📝 Your Profile:\n\n';
        
        if (userData.persona) {
            response += `👤 Persona: ${userData.persona}\n\n`;
        }
        
        response += '📌 Notes:\n';
        response += userData.notes.map((n, i) => {
            const date = moment(n).format('DD/MM/YY HH:mm');
            return `${i + 1}. ${n}`;
        }).join('\n');

        return response;
    } catch (err) {
        console.error('Error in handleMyNotes:', err.message);
        return '❌ Error fetching notes. Please try again.';
    }
}

module.exports = {
    handleSetPersona,
    handleAddNote,
    handleMyNotes
}
