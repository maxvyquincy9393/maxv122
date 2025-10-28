
const fs = require('fs')
const path = require('path')

function loadCommands() {
    const commandMap = new Map()
    const handlersPath = path.join(__dirname, '../handlers')

    const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'))

    for (const file of handlerFiles) {
        const handler = require(path.join(handlersPath, file))
        const commandName = file.split('.')[0]

        if (commandName === 'help') {
            commandMap.set('/help', handler.handleHelp)
        } else if (commandName === 'memory') {
            commandMap.set('/setpersona', handler.handleSetPersona)
            commandMap.set('/addnote', handler.handleAddNote)
            commandMap.set('/mynotes', handler.handleMyNotes)
        } else if (commandName === 'media') {
            commandMap.set('/img', handler.handleImage)
        } else if (commandName === 'rag') {
            commandMap.set('/rag', {
                'add': handler.handleRagAdd,
                'pdf': handler.handleRagPdf,
                'local': handler.handleRagLocal,
                'ingest': handler.handleRagIngest,
                'ask': handler.handleRagAsk,
                'sources': handler.handleRagSources,
                'clear': handler.handleRagClear
            })
        } else if (commandName === 'reminder') {
            commandMap.set('/newreminder', handler.handleNewReminder)
            commandMap.set('/listreminder', handler.handleListReminder)
            commandMap.set('/editreminder', handler.handleEditReminder)
            commandMap.set('/delreminder', handler.handleDeleteReminder)
        } else if (commandName === 'ai') {
            commandMap.set('/ai', handler.handleAI)
            commandMap.set('/translate', handler.handleTranslate)
            commandMap.set('/summarize', handler.handleSummarize)
            commandMap.set('/rewrite', handler.handleRewrite)
            commandMap.set('/caption', handler.handleCaption)
            commandMap.set('/idea', handler.handleIdea)
            commandMap.set('/code', handler.handleCode)
        }
    }

    return commandMap
}

module.exports = { loadCommands }
