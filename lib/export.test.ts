import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import { buildQuestionsWorkbook } from './export'

describe('buildQuestionsWorkbook', () => {
  it('writes one row per question with the required columns', async () => {
    const buffer = await buildQuestionsWorkbook([
      { id: '1', content: 'Khi nào có bonus?', status: 'approved', likeCount: 5, createdAt: '2026-10-07T09:00:00.000Z' },
    ])

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0])
    const sheet = workbook.worksheets[0]

    expect(sheet.getRow(1).values).toContain('Nội dung / Content')
    expect(sheet.getRow(2).getCell(1).value).toBe('Khi nào có bonus?')
    expect(sheet.getRow(2).getCell(2).value).toBe(5)
    expect(sheet.getRow(2).getCell(3).value).toBe('approved')
  })
})
