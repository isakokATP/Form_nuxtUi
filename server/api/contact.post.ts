import { promises as fs } from 'fs'
import { join } from 'path'
import { readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const dataDir = join(process.cwd(), 'server', 'data')
  const filePath = join(dataDir, 'contacts.json')

  await fs.mkdir(dataDir, { recursive: true })

  let entries: any[] = []
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    entries = JSON.parse(content)
    if (!Array.isArray(entries)) entries = []
  } catch (e) {
    entries = []
  }

  const entry = {
    ...body,
    createdAt: new Date().toISOString()
  }

  entries.push(entry)

  await fs.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8')

  return { ok: true }
})
