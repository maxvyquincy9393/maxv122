

const { parseTime } = require('../utils/helpers')
const { reminders, saveData } = require('../storage')
const moment = require('moment')

async function handleNewReminder(sock, msg, sender, text) {
    try {
        const match = text.match(/^\/newreminder\s+\"([^\"]+)\"/);
        if (!match) return '❌ Format: /newreminder "Task jam HH:MM"\n\nExamples:\n/newreminder "Belajar AI jam 20:00"\n/newreminder "Meeting jam 14:30"'

        const task = match[1]
        const time = parseTime(task)
        if (!time) return '❌ Invalid time format.\n\nSupported formats:\n• 7 or 07\n• 7:30 or 7.30\n• jam 7 or pukul 07.30'

        const cronTime = `${time.minute()} ${time.hour()} * * *`
        const reminder = { sender, task, cronTime, createdAt: new Date().toISOString() }
        reminders.push(reminder)
        await saveData('reminders', reminders)

        return `✅ Reminder set for ${time.format('HH:mm')}:\n${task}`
    } catch (err) {
        console.error('Error in handleNewReminder:', err.message)
        return '❌ Error creating reminder. Please try again.'
    }
}

async function handleListReminder(sock, msg, sender) {
    try {
        const userReminders = reminders.filter(r => r.sender === sender)
        if (!userReminders.length) return '📭 No reminders set\n\nUse /newreminder "Task jam HH:MM" to create one'

        const list = userReminders.map((r, i) => {
            const time = moment().hour(r.cronTime.split(' ')[1])
                .minute(r.cronTime.split(' ')[0])
            return `${i + 1}. ${time.format('HH:mm')} - ${r.task}`
        }).join('\n')

        return `📋 Your reminders:\n\n${list}`
    } catch (err) {
        console.error('Error in handleListReminder:', err.message)
        return '❌ Error fetching reminders'
    }
}

async function handleEditReminder(sock, msg, sender, text) {
    try {
        const match = text.match(/^\/editreminder\s+(\d+)\s+\"([^\"]+)\"/);
        if (!match) return '❌ Format: /editreminder <number> "New task jam HH:MM"\n\nExample: /editreminder 1 "Study jam 19:00"'

        const index = parseInt(match[1]) - 1
        const newTask = match[2]
        const userReminders = reminders.filter(r => r.sender === sender)

        if (index < 0 || index >= userReminders.length) {
            return `❌ Invalid reminder number. You have ${userReminders.length} reminder(s)`
        }

        const time = parseTime(newTask)
        if (!time) return '❌ Invalid time format'

        const reminderIndex = reminders.findIndex(r =>
            r.sender === sender && r.task === userReminders[index].task
        )

        reminders[reminderIndex] = {
            sender,
            task: newTask,
            cronTime: `${time.minute()} ${time.hour()} * * *`,
            updatedAt: new Date().toISOString()
        }

        await saveData('reminders', reminders)
        return `✅ Reminder updated to ${time.format('HH:mm')}:\n${newTask}`
    } catch (err) {
        console.error('Error in handleEditReminder:', err.message)
        return '❌ Error editing reminder'
    }
}

async function handleDeleteReminder(sock, msg, sender, text) {
    try {
        const match = text.match(/^\/delreminder\s+(\d+)/);
        if (!match) return '❌ Format: /delreminder <number>\n\nExample: /delreminder 1'

        const index = parseInt(match[1]) - 1
        const userReminders = reminders.filter(r => r.sender === sender)

        if (index < 0 || index >= userReminders.length) {
            return `❌ Invalid reminder number. You have ${userReminders.length} reminder(s)`
        }

        const reminderIndex = reminders.findIndex(r =>
            r.sender === sender && r.task === userReminders[index].task
        )

        const deleted = reminders.splice(reminderIndex, 1)[0]
        await saveData('reminders', reminders)
        return `✅ Reminder deleted:\n${deleted.task}`
    } catch (err) {
        console.error('Error in handleDeleteReminder:', err.message)
        return '❌ Error deleting reminder'
    }
}

module.exports = {
    handleNewReminder,
    handleListReminder,
    handleEditReminder,
    handleDeleteReminder
}
