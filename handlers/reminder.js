const { parseTime } = require("../utils/helpers");
const { reminders, saveData } = require("../storage");
const moment = require("moment");

// Parse recurring pattern from text
const parseRecurring = (text) => {
  const lowerText = text.toLowerCase();

  // Every X minutes
  const minuteMatch = lowerText.match(/setiap (\d+) menit|every (\d+) minute/i);
  if (minuteMatch) {
    const minutes = parseInt(minuteMatch[1] || minuteMatch[2]);
    return { type: "minutes", interval: minutes, cron: `*/${minutes} * * * *` };
  }

  // Every X hours
  const hourMatch = lowerText.match(/setiap (\d+) jam|every (\d+) hour/i);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1] || hourMatch[2]);
    return { type: "hours", interval: hours, cron: `0 */${hours} * * *` };
  }

  // Every day at specific time
  const dailyMatch = lowerText.match(/setiap hari|every day|harian|daily/i);
  if (dailyMatch) {
    return { type: "daily", interval: 1, cron: null }; // Will set time separately
  }

  // Every X days
  const daysMatch = lowerText.match(/setiap (\d+) hari|every (\d+) day/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1] || daysMatch[2]);
    return { type: "days", interval: days, cron: null }; // Will calculate cron with time
  }

  // Weekly on specific day
  const weeklyMatch = lowerText.match(
    /setiap (senin|selasa|rabu|kamis|jumat|sabtu|minggu)|every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  );
  if (weeklyMatch) {
    const days = {
      senin: 1,
      monday: 1,
      selasa: 2,
      tuesday: 2,
      rabu: 3,
      wednesday: 3,
      kamis: 4,
      thursday: 4,
      jumat: 5,
      friday: 5,
      sabtu: 6,
      saturday: 6,
      minggu: 0,
      sunday: 0,
    };
    const day = (weeklyMatch[1] || weeklyMatch[2]).toLowerCase();
    return { type: "weekly", day: days[day], cron: null };
  }

  return null;
};

async function handleNewReminder(sock, msg, sender, text) {
  try {
    const match = text.match(/^\/newreminder\s+"([^"]+)"/);
    if (!match) {
      return `⚡ *Maxvy Reminder System*

Format yang tersedia:

*📌 One-time Reminder:*
/newreminder "Task jam HH:MM"
Contoh: /newreminder "Meeting jam 14:30"

*🔄 Recurring Reminders:*
• Setiap X menit:
  /newreminder "Minum air setiap 30 menit"

• Setiap X jam:
  /newreminder "Istirahat setiap 2 jam"

• Setiap hari:
  /newreminder "Olahraga setiap hari jam 06:00"

• Setiap X hari:
  /newreminder "Check email setiap 3 hari jam 09:00"

• Setiap minggu:
  /newreminder "Meeting setiap Senin jam 10:00"

Siap membantu!`;
    }

    const taskText = match[1];
    const recurring = parseRecurring(taskText);

    if (recurring) {
      // Handle recurring reminder
      let cronTime;
      let description;

      if (recurring.type === "minutes") {
        cronTime = recurring.cron;
        description = `setiap ${recurring.interval} menit`;
      } else if (recurring.type === "hours") {
        cronTime = recurring.cron;
        description = `setiap ${recurring.interval} jam`;
      } else if (recurring.type === "daily") {
        const time = parseTime(taskText);
        if (!time) {
          return '⚠️ Format waktu tidak valid untuk reminder harian. Gunakan format: "Task setiap hari jam HH:MM"';
        }
        cronTime = `${time.minute()} ${time.hour()} * * *`;
        description = `setiap hari jam ${time.format("HH:mm")}`;
      } else if (recurring.type === "days") {
        const time = parseTime(taskText);
        if (!time) {
          return '⚠️ Format waktu tidak valid. Gunakan format: "Task setiap X hari jam HH:MM"';
        }
        // For every X days, we'll store last_triggered and check manually
        cronTime = `${time.minute()} ${time.hour()} * * *`;
        description = `setiap ${recurring.interval} hari jam ${time.format("HH:mm")}`;
      } else if (recurring.type === "weekly") {
        const time = parseTime(taskText);
        if (!time) {
          return '⚠️ Format waktu tidak valid. Gunakan format: "Task setiap [Hari] jam HH:MM"';
        }
        cronTime = `${time.minute()} ${time.hour()} * * ${recurring.day}`;
        const dayNames = [
          "Minggu",
          "Senin",
          "Selasa",
          "Rabu",
          "Kamis",
          "Jumat",
          "Sabtu",
        ];
        description = `setiap ${dayNames[recurring.day]} jam ${time.format("HH:mm")}`;
      }

      const reminder = {
        sender,
        task: taskText,
        cronTime,
        recurring: true,
        recurringType: recurring.type,
        recurringInterval: recurring.interval,
        description,
        lastTriggered: null,
        createdAt: new Date().toISOString(),
      };

      reminders.push(reminder);
      await saveData("reminders", reminders);

      return `✅ *Recurring reminder set, Sir.*

📋 Task: ${taskText}
🔄 Pattern: ${description}

I will remind you accordingly. Consider it done.`;
    } else {
      // Handle one-time reminder
      const time = parseTime(taskText);
      if (!time) {
        return "⚠️ Format waktu tidak valid, Sir. Coba format:\n• 7 atau 07\n• 7:30 atau 7.30\n• jam 7 atau pukul 07.30";
      }

      const cronTime = `${time.minute()} ${time.hour()} * * *`;
      const reminder = {
        sender,
        task: taskText,
        cronTime,
        recurring: false,
        createdAt: new Date().toISOString(),
      };

      reminders.push(reminder);
      await saveData("reminders", reminders);

      return `✅ *Reminder confirmed, Sir.*

⏰ Time: ${time.format("HH:mm")}
📋 Task: ${taskText}

I shall remind you at the designated time.`;
    }
  } catch (err) {
    console.error("Error in handleNewReminder:", err.message);
    return "❌ I encountered an error setting up the reminder, Sir. Please try again.";
  }
}

async function handleListReminder(sock, msg, sender) {
  try {
    const userReminders = reminders.filter((r) => r.sender === sender);
    if (!userReminders.length) {
      return `📋 *No active reminders, Sir.*

You currently have no reminders scheduled.

Shall I set one up for you? Use:
/newreminder "Task jam HH:MM"

At your service.`;
    }

    const list = userReminders
      .map((r, i) => {
        if (r.recurring) {
          return `${i + 1}. 🔄 ${r.task}\n   ⏱️ ${r.description}`;
        } else {
          const time = moment()
            .hour(r.cronTime.split(" ")[1])
            .minute(r.cronTime.split(" ")[0]);
          return `${i + 1}. ⏰ Jam ${time.format("HH:mm")} - ${r.task}`;
        }
      })
      .join("\n\n");

    return `📋 *Your active reminders, Sir:*

${list}

Total: ${userReminders.length} reminder${userReminders.length > 1 ? "s" : ""}

To modify: /editreminder <nomor> "new task"
To remove: /delreminder <nomor>`;
  } catch (err) {
    console.error("Error in handleListReminder:", err.message);
    return "❌ Error retrieving reminders, Sir. Please try again.";
  }
}

async function handleEditReminder(sock, msg, sender, text) {
  try {
    const match = text.match(/^\/editreminder\s+(\d+)\s+"([^"]+)"/);
    if (!match) {
      return `⚡ *Edit Reminder Format:*

/editreminder <nomor> "Task baru"

Example:
/editreminder 1 "Study jam 19:00"
/editreminder 2 "Workout setiap hari jam 06:00"

Check your reminders: /listreminder`;
    }

    const index = parseInt(match[1]) - 1;
    const newTask = match[2];
    const userReminders = reminders.filter((r) => r.sender === sender);

    if (index < 0 || index >= userReminders.length) {
      return `⚠️ Invalid reminder number, Sir. You have ${userReminders.length} reminder${userReminders.length > 1 ? "s" : ""}.\n\nCheck with: /listreminder`;
    }

    const recurring = parseRecurring(newTask);
    const reminderIndex = reminders.findIndex(
      (r) => r.sender === sender && r.task === userReminders[index].task,
    );

    if (recurring) {
      let cronTime, description;

      if (recurring.type === "minutes") {
        cronTime = recurring.cron;
        description = `setiap ${recurring.interval} menit`;
      } else if (recurring.type === "hours") {
        cronTime = recurring.cron;
        description = `setiap ${recurring.interval} jam`;
      } else if (recurring.type === "daily") {
        const time = parseTime(newTask);
        if (!time) {
          return '⚠️ Invalid time format. Use: "Task setiap hari jam HH:MM"';
        }
        cronTime = `${time.minute()} ${time.hour()} * * *`;
        description = `setiap hari jam ${time.format("HH:mm")}`;
      } else if (recurring.type === "days") {
        const time = parseTime(newTask);
        if (!time) {
          return '⚠️ Invalid time format. Use: "Task setiap X hari jam HH:MM"';
        }
        cronTime = `${time.minute()} ${time.hour()} * * *`;
        description = `setiap ${recurring.interval} hari jam ${time.format("HH:mm")}`;
      } else if (recurring.type === "weekly") {
        const time = parseTime(newTask);
        if (!time) {
          return '⚠️ Invalid time format. Use: "Task setiap [Day] jam HH:MM"';
        }
        cronTime = `${time.minute()} ${time.hour()} * * ${recurring.day}`;
        const dayNames = [
          "Minggu",
          "Senin",
          "Selasa",
          "Rabu",
          "Kamis",
          "Jumat",
          "Sabtu",
        ];
        description = `setiap ${dayNames[recurring.day]} jam ${time.format("HH:mm")}`;
      }

      reminders[reminderIndex] = {
        sender,
        task: newTask,
        cronTime,
        recurring: true,
        recurringType: recurring.type,
        recurringInterval: recurring.interval,
        description,
        lastTriggered: null,
        updatedAt: new Date().toISOString(),
      };

      await saveData("reminders", reminders);
      return `✅ *Reminder updated, Sir.*

🔄 ${description}
📋 ${newTask}

The modification has been recorded.`;
    } else {
      const time = parseTime(newTask);
      if (!time) {
        return "⚠️ Invalid time format, Sir. Try: 7, 07, 7:30, jam 7, pukul 07.30";
      }

      reminders[reminderIndex] = {
        sender,
        task: newTask,
        cronTime: `${time.minute()} ${time.hour()} * * *`,
        recurring: false,
        updatedAt: new Date().toISOString(),
      };

      await saveData("reminders", reminders);
      return `✅ *Reminder updated, Sir.*

⏰ ${time.format("HH:mm")}
📋 ${newTask}

I shall remind you at the new time.`;
    }
  } catch (err) {
    console.error("Error in handleEditReminder:", err.message);
    return "❌ Error updating reminder, Sir. Please try again.";
  }
}

async function handleDeleteReminder(sock, msg, sender, text) {
  try {
    const match = text.match(/^\/delreminder\s+(\d+)/);
    if (!match) {
      return `⚡ *Delete Reminder Format:*

/delreminder <nomor>

Example: /delreminder 1

Check your reminders: /listreminder`;
    }

    const index = parseInt(match[1]) - 1;
    const userReminders = reminders.filter((r) => r.sender === sender);

    if (index < 0 || index >= userReminders.length) {
      return `⚠️ Invalid number, Sir. You have ${userReminders.length} reminder${userReminders.length > 1 ? "s" : ""}.\n\nCheck with: /listreminder`;
    }

    const reminderIndex = reminders.findIndex(
      (r) => r.sender === sender && r.task === userReminders[index].task,
    );

    const deleted = reminders.splice(reminderIndex, 1)[0];
    await saveData("reminders", reminders);

    return `✅ *Reminder deleted, Sir.*

🗑️ Removed: ${deleted.task}

The reminder has been cleared from the system.`;
  } catch (err) {
    console.error("Error in handleDeleteReminder:", err.message);
    return "❌ Error deleting reminder, Sir. Please try again.";
  }
}

module.exports = {
  handleNewReminder,
  handleListReminder,
  handleEditReminder,
  handleDeleteReminder,
};
