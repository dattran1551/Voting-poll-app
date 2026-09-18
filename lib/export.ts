import ExcelJS from 'exceljs'
import type { Question } from './types'

export async function buildQuestionsWorkbook(questions: Question[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Questions')

  sheet.columns = [
    { header: 'Nội dung / Content', key: 'content', width: 60 },
    { header: 'Số lượt thích / Likes', key: 'likeCount', width: 20 },
    { header: 'Trạng thái / Status', key: 'status', width: 20 },
    { header: 'Thời gian gửi / Submitted at', key: 'createdAt', width: 24 },
  ]

  for (const question of questions) {
    sheet.addRow({
      content: question.content,
      likeCount: question.likeCount,
      status: question.status,
      createdAt: question.createdAt,
    })
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
