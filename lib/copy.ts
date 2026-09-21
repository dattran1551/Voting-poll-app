export const copy = {
  display: {
    qrHint: 'Quét mã để đặt câu hỏi / Scan to ask a question',
    empty: 'Chưa có câu hỏi nào / No questions yet',
  },
  employee: {
    waiting: 'Hệ thống đang quá tải, vui lòng chờ giây lát... / System is busy, please wait a moment...',
    empty: 'Chưa có câu hỏi nào, hãy là người đặt câu hỏi đầu tiên! / No questions yet — be the first to ask!',
    submitPlaceholder: 'Nhập câu hỏi của bạn... / Type your question...',
    submitButton: 'Gửi câu hỏi / Submit',
    moderationNotice:
      'Để đảm bảo tinh thần chuyên nghiệp của sự kiện, câu hỏi của bạn sẽ được kiểm duyệt trước bởi Ban tổ chức trước khi được thể hiện lên màn hình. / To keep the event professional, your question will be reviewed by the organizers before it appears on screen.',
    submitSuccess: 'Đã gửi thành công! / Sent successfully!',
    submitFailure: 'Gửi thất bại, thử lại / Failed to send, please retry',
  },
  admin: {
    pendingTab: 'Chờ duyệt / Pending',
    approvedTab: 'Đã duyệt / Approved',
    approve: 'Duyệt / Approve',
    reject: 'Không duyệt / Reject',
    markAnswered: 'Đánh dấu đã trả lời / Mark as answered',
    exportButton: 'Xuất Excel / Export to Excel',
    exportGenerating: 'Đang tạo file... / Generating file...',
    exportFailure: 'Xuất file thất bại, thử lại / Export failed, please retry',
    pendingEmpty: 'Không có câu hỏi mới / No new questions',
    approvedEmpty: 'Chưa có câu hỏi nào được duyệt / No approved questions yet',
    actionFailure: 'Thao tác thất bại, thử lại / Action failed, please retry',
    loadFailure: 'Không tải được câu hỏi, thử lại / Failed to load questions, please retry',
  },
  shared: {
    loading: 'Đang tải... / Loading...',
    headerTitleVi: 'Q&A CÙNG GMT',
    headerTitleEn: 'ASK YOUR QUESTIONS FOR GMT',
    logoAlt: 'VNGGames ON',
  },
} as const
