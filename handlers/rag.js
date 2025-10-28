const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { getEmbedding, extractPdfText, cosineSimilarity } = require('../utils/helpers')
const { knowledge, saveData, STORAGE } = require('../storage')

async function handleRagAdd(sock, msg, sender, text) {
    const match = text.match(/^\/rag\s+add\s+\"([^\"]+)\"/) 
    if (!match) return 'Format: /rag add "text content"'

    const content = match[1]
    const embedding = await getEmbedding(content)
    if (!embedding) return 'Error generating embedding'

    knowledge.push({
        sender,
        source: 'manual',
        content,
        embedding
    })

    saveData('knowledge', knowledge)
    return '✅ Content added to knowledge base'
}

async function handleRagPdf(sock, msg, sender, text) {
    const match = text.match(/^\/rag\s+pdf\s+(.+)/)
    if (!match) return 'Format: /rag pdf <url>'

    try {
        const { data } = await axios.get(match[1], { responseType: 'arraybuffer' })
        const content = await extractPdfText(data)
        if (!content) return 'Error extracting PDF text'

        // Split into chunks of ~500 words
        const chunks = content.split(/\s+/).reduce((acc, word) => {
            if (!acc.length || acc[acc.length - 1].split(/\s+/).length >= 500) {
                acc.push(word)
            } else {
                acc[acc.length - 1] += ' ' + word
            }
            return acc
        }, [])

        for (const chunk of chunks) {
            const embedding = await getEmbedding(chunk)
            if (embedding) {
                knowledge.push({
                    sender,
                    source: match[1],
                    content: chunk,
                    embedding
                })
            }
        }

        saveData('knowledge', knowledge)
        return `✅ Added ${chunks.length} chunks from PDF`
    } catch (err) {
        return 'Error processing PDF'
    }
}

async function handleRagLocal(sock, msg, sender, text) {
    const match = text.match(/^\/rag\s+local\s+(.+)/)
    if (!match) return 'Format: /rag local <path>'

    const filePath = path.join(STORAGE.docs, match[1])
    if (!fs.existsSync(filePath)) return 'File not found'

    try {
        let content
        if (filePath.endsWith('.pdf')) {
            const buffer = fs.readFileSync(filePath)
            content = await extractPdfText(buffer)
        } else {
            content = fs.readFileSync(filePath, 'utf8')
        }

        if (!content) return 'Error reading file'

        // Split into chunks
        const chunks = content.split(/\s+/).reduce((acc, word) => {
            if (!acc.length || acc[acc.length - 1].split(/\s+/).length >= 500) {
                acc.push(word)
            } else {
                acc[acc.length - 1] += ' ' + word
            }
            return acc
        }, [])

        for (const chunk of chunks) {
            const embedding = await getEmbedding(chunk)
            if (embedding) {
                knowledge.push({
                    sender,
                    source: match[1],
                    content: chunk,
                    embedding
                })
            }
        }

        saveData('knowledge', knowledge)
        return `✅ Added ${chunks.length} chunks from ${path.basename(filePath)}`
    } catch (err) {
        return 'Error processing file'
    }
}

async function handleRagIngest(sock, msg, sender, text) {
    const match = text.match(/^\/rag\s+ingest(?:\s+(.+))?/) 
    const dirPath = match?.[1] ? path.join(STORAGE.docs, match[1]) : STORAGE.docs

    if (!fs.existsSync(dirPath)) return 'Directory not found'

    try {
        const files = fs.readdirSync(dirPath)
        let totalChunks = 0

        for (const file of files) {
            const filePath = path.join(dirPath, file)
            if (!fs.statSync(filePath).isFile()) continue

            let content
            if (file.endsWith('.pdf')) {
                const buffer = fs.readFileSync(filePath)
                content = await extractPdfText(buffer)
            } else if (file.endsWith('.txt') || file.endsWith('.md')) {
                content = fs.readFileSync(filePath, 'utf8')
            } else {
                continue
            }

            if (!content) continue

            const chunks = content.split(/\s+/).reduce((acc, word) => {
                if (!acc.length || acc[acc.length - 1].split(/\s+/).length >= 500) {
                    acc.push(word)
                } else {
                    acc[acc.length - 1] += ' ' + word
                }
                return acc
            }, [])

            for (const chunk of chunks) {
                const embedding = await getEmbedding(chunk)
                if (embedding) {
                    knowledge.push({
                        sender,
                        source: file,
                        content: chunk,
                        embedding
                    })
                    totalChunks++
                }
            }
        }

        saveData('knowledge', knowledge)
        return `✅ Ingested ${totalChunks} chunks from ${files.length} files`
    } catch (err) {
        return 'Error ingesting files'
    }
}

async function handleRagAsk(sock, msg, sender, text) {
    const match = text.match(/^\/rag\s+ask\s+(.+)/)
    if (!match) return 'Format: /rag ask <question>'

    const question = match[1]
    const questionEmbedding = await getEmbedding(question)
    if (!questionEmbedding) return 'Error generating question embedding'

    // Find top 5 similar chunks
    const similarities = knowledge.map(k => ({
        ...k,
        similarity: cosineSimilarity(questionEmbedding, k.embedding)
    }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)

    if (!similarities.length) return 'No relevant knowledge found'

    const context = similarities.map(s => s.content).join('\n\n')
    const prompt = `Based on this context:\n\n${context}\n\nAnswer this question: ${question}`

    const model = gemini.getGenerativeModel({ model: 'gemini-pro' })
    try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text()
    } catch (err) {
        return 'Error generating answer'
    }
}

async function handleRagSources(sock, msg, sender) {
    const sources = [...new Set(knowledge.map(k => k.source))]
    if (!sources.length) return 'No sources in knowledge base'

    return 'Knowledge base sources:\n' + sources.map(s => `- ${s}`).join('\n')
}

async function handleRagClear(sock, msg, sender) {
    knowledge = knowledge.filter(k => k.sender !== sender)
    saveData('knowledge', knowledge)
    return '✅ Your knowledge base cleared'
}

module.exports = {
    handleRagAdd,
    handleRagPdf,
    handleRagLocal,
    handleRagIngest,
    handleRagAsk,
    handleRagSources,
    handleRagClear
}
