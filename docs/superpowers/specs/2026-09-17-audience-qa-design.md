# Audience Q&A — VNGGames ON (07/10/2026)

## 1. Bối cảnh

Sự kiện họp toàn công ty **VNGGames ON**, diễn ra **07/10/2026**, khoảng **500 người tham dự**. Cần một web app cho phép nhân viên đặt câu hỏi ẩn danh và vote (like) cho câu hỏi mình thích, có kiểm duyệt của Ban tổ chức (Admin) trước khi hiển thị công khai. Câu hỏi nhiều like nhất được đẩy lên đầu danh sách.

Đây là công cụ dùng **một lần** cho sự kiện này (không phải nền tảng dùng lại cho nhiều sự kiện khác nhau).

## 2. Ba giao diện

| Giao diện | Người dùng | Thiết bị | Cách truy cập |
|---|---|---|---|
| **Display** | Chiếu lên sân khấu | Chỉ PC/TV, không có bản mobile | URL cố định, mở sẵn trên máy chiếu |
| **Employee** | Nhân viên tham dự | Chỉ mobile, không có bản PC | Quét mã QR hiện trên Display |
| **Admin** | Ban tổ chức | Chỉ mobile | Link bí mật, không public, **không cần mật khẩu** |

Không có đăng nhập ở bất kỳ giao diện nào. Toàn bộ ẩn danh.

## 3. Vòng đời một câu hỏi

```
Nhân viên gửi
      │
      ▼
 [Chờ duyệt] ──── Admin bấm "Không duyệt" ──▶ [Bị ẩn] (chỉ còn trong Excel xuất ra)
      │
      │ Admin bấm "Duyệt"
      ▼
 [Đã duyệt] (hiện công khai trên Display + Employee, nhận like)
      │
      │ Admin bấm "Đã trả lời"
      ▼
 [Đã trả lời] (ẩn khỏi Display + Employee, vẫn còn trong Admin/Excel)
```

Trạng thái của một câu hỏi: `pending` (chờ duyệt) → `approved` (đã duyệt) hoặc `rejected` (không duyệt) → `answered` (đã trả lời, chỉ áp dụng sau khi đã `approved`).

Chỉ câu hỏi ở trạng thái `approved` mới hiển thị công khai (Display + Employee) và nhận được like.

## 4. Cập nhật dữ liệu

Cả 3 giao diện tự làm mới dữ liệu theo chu kỳ vài giây (polling — app tự hỏi lại server "có gì mới không?" định kỳ), không cần bấm refresh tay, không cần kết nối tức thời kiểu real-time phức tạp. Đủ mượt cho mắt người xem ở quy mô 500 người.

## 5. Giao diện Display (chiếu sân khấu)

**Bố cục:** mã QR (kèm chữ "Quét mã để đặt câu hỏi / Scan to ask a question") + danh sách câu hỏi `approved`, sắp xếp **nhiều like nhất lên đầu**; bằng like nhau thì **câu gửi trước lên trên**. Mỗi câu hiện nội dung + số lượt thích.

**Trạng thái:**
- **Đang tải lần đầu:** icon đang tải, không để trắng trơn.
- **Chưa có câu hỏi nào được duyệt:** vẫn hiện đầy đủ QR, phần danh sách hiện "Chưa có câu hỏi nào / No questions yet".
- **Mất kết nối tạm thời khi tự làm mới:** giữ nguyên danh sách cũ đang hiện, âm thầm thử lại — không hiện thông báo lỗi (đây là màn hình không có ai thao tác, không nên gây chú ý xấu trên sân khấu).

## 6. Giao diện Employee (nhân viên)

### 6.1. Giới hạn 500 người truy cập đồng thời

- Giới hạn này **chỉ áp dụng cho giao diện Employee** (Display và Admin không giới hạn).
- Mỗi điện thoại khi mở Employee lần đầu được gán một **mã ẩn danh ngẫu nhiên**, lưu trên trình duyệt máy đó (không phải thông tin cá nhân).
- Một máy được tính là **"đang hoạt động"** khi app đang mở / màn hình đang sáng. Máy bị coi là **rời đi** (giải phóng 1 chỗ) khi đóng app hoặc tắt màn hình liên tục quá **30 giây** — không tính theo việc có bấm nút hay không, chỉ cần app còn mở là còn tính hoạt động.
- Khi đã đủ 500 máy đang hoạt động, người thứ 501 trở đi thấy **màn hình chờ**: thông báo chung chung "Hệ thống đang quá tải, vui lòng chờ giây lát... / System is busy, please wait a moment...", **không hiển thị thứ hạng trong hàng chờ**. App tự động kiểm tra ngầm định kỳ và **tự chuyển vào** ngay khi có chỗ trống, không cần người dùng bấm gì thêm.
- Nếu một máy đang trong app bị rời đi (đóng app/tắt màn hình >30s) rồi quay lại, xử lý như người mới vào (nếu hệ thống đang đầy thì gặp lại màn hình chờ).

### 6.2. Danh sách câu hỏi + like

- Hiện danh sách câu hỏi `approved`, sắp xếp giống Display (nhiều like lên đầu, bằng nhau thì cũ hơn lên trên).
- Mỗi câu có nút ❤️ + số lượt thích. Một máy (theo mã ẩn danh) chỉ like được **1 lần cho mỗi câu hỏi**. Sau khi bấm, nút chuyển trạng thái đã like (đổi màu, không bấm lại được) để người dùng biết đã vote.
- Giới hạn dựa trên mã ẩn danh lưu trình duyệt — nếu người dùng xoá dữ liệu trình duyệt hoặc dùng ẩn danh (incognito)/thiết bị khác thì có thể vote lại. Đây là rủi ro đã được chấp nhận cho sự kiện nội bộ quy mô này.

### 6.3. Gửi câu hỏi

- Khung cố định phía dưới màn hình: ô nhập chữ (giới hạn ~300 ký tự, có đếm ký tự còn lại) + nút "Gửi câu hỏi / Submit" + ghi chú: "Để đảm bảo tinh thần chuyên nghiệp của sự kiện, câu hỏi của bạn sẽ được kiểm duyệt trước bởi Ban tổ chức trước khi được thể hiện lên màn hình."
- Sau khi gửi, **không theo dõi trạng thái duyệt của câu hỏi mình đã gửi** — chỉ báo "đã gửi thành công", muốn biết câu hỏi có lên hay không thì tự nhìn danh sách công khai.

### 6.4. Trạng thái

- **Đang tải lần đầu:** icon đang tải.
- **Chưa có câu hỏi nào được duyệt:** "Chưa có câu hỏi nào, hãy là người đặt câu hỏi đầu tiên! / No questions yet — be the first to ask!"
- **Gửi thành công:** toast "Đã gửi thành công! / Sent successfully!", ô nhập tự xoá trắng.
- **Gửi thất bại** (lỗi mạng): toast lỗi "Gửi thất bại, thử lại / Failed to send, please retry", **giữ nguyên nội dung đã gõ**.
- **Mất mạng khi đang xem danh sách:** giữ nguyên danh sách hiện có, âm thầm thử tải lại.
- **Bị đá ra do không hoạt động >30s:** quay lại luồng vào app như người mới (có thể gặp màn hình chờ nếu hệ thống đang đầy).

## 7. Giao diện Admin

Truy cập bằng link bí mật, không mật khẩu. 2 tab:

### Tab "Chờ duyệt" (mặc định)
- Danh sách câu hỏi `pending`, sắp theo **gửi trước lên trên** (xử lý theo thứ tự nhận).
- Mỗi câu có nút **"Duyệt"** (→ `approved`) và **"Không duyệt"** (→ `rejected`). Bấm xong câu đó biến mất khỏi tab.

### Tab "Đã duyệt"
- Danh sách câu hỏi `approved`, sắp theo nhiều like lên đầu.
- Mỗi câu có nút **"Đánh dấu đã trả lời"** (→ `answered`). Bấm xong câu đó biến mất khỏi Display/Employee nhưng vẫn còn trong dữ liệu.

### Xuất Excel
- Nút cố định trên đầu màn hình, dùng được ở cả 2 tab.
- Xuất **toàn bộ câu hỏi, mọi trạng thái** (kể cả `rejected`), gồm các cột: **nội dung câu hỏi, số lượt thích, trạng thái, thời gian gửi**.

### Trạng thái
- **Đang tải lần đầu:** icon đang tải.
- **Tab "Chờ duyệt" trống:** "Không có câu hỏi mới / No new questions".
- **Tab "Đã duyệt" trống:** "Chưa có câu hỏi nào được duyệt / No approved questions yet".
- **Bấm Duyệt/Không duyệt/Đã trả lời mà lỗi mạng:** toast lỗi "Thao tác thất bại, thử lại / Action failed, please retry", câu hỏi đó **vẫn còn nguyên trong danh sách** cho tới khi thao tác thành công thật sự.
- **Bấm Xuất Excel:** hiện "Đang tạo file... / Generating file..." trong lúc chờ, xong tự tải file về máy. Lỗi thì báo "Xuất file thất bại, thử lại / Export failed, please retry".

## 8. Song ngữ

Mọi chữ cố định trên giao diện (nút, nhãn, thông báo, ghi chú) hiển thị **cả tiếng Việt và tiếng Anh cùng lúc** trên cùng màn hình, dạng "Tiếng Việt / English" — không có nút chuyển đổi ngôn ngữ. Nội dung câu hỏi do nhân viên tự gõ giữ nguyên văn, không dịch.

## 9. Lưu trữ dữ liệu (giải thích ở mức khái niệm)

Một cơ sở dữ liệu nhỏ dùng chung cho cả 3 giao diện, lưu mỗi câu hỏi: nội dung, trạng thái, số lượt thích, thời gian gửi, và danh sách mã máy đã like câu đó (để chặn like trùng). Toàn bộ app host trên một dịch vụ web thông thường, truy cập được qua internet, không cần VPN.

Việc chọn công cụ/dịch vụ cụ thể (ngôn ngữ lập trình, nơi host, cơ sở dữ liệu) sẽ được quyết định ở bước lập kế hoạch triển khai (implementation plan), không nằm trong spec này.

## 10. Thiết kế hình ảnh

Chưa có sẵn thiết kế Figma riêng cho Q&A app. Sẽ tự thiết kế mới, nhưng **bám theo màu sắc/font/phong cách thương hiệu VNGGames ON** lấy từ file Figma đã có: `https://www.figma.com/design/KprMCUGsAJYHAl5Dpd81ov/GamesOn`. Khi build UI, lấy đúng giá trị thật từ Figma (màu, font, khoảng cách...), không tự đoán/tự chế — theo đúng tiêu chuẩn đã áp dụng cho trang landing page VNGGames ON trước đó.

## 11. Kiểm thử trước sự kiện

Vì đây là sự kiện diễn ra 1 lần, không có cơ hội sửa giữa chừng nếu lỗi:
- Test toàn bộ luồng: gửi câu hỏi → duyệt → hiện lên Display → like → đánh dấu đã trả lời → xuất Excel.
- Test bằng nhiều điện thoại thật để xác nhận chặn like trùng và đếm người hoạt động (giới hạn 500) chạy đúng.
- Có một buổi "chạy thử" (rehearsal) 1-2 ngày trước sự kiện, dùng đúng mã QR thật, để phát hiện lỗi kịp sửa.

## 12. Ngoài phạm vi (không làm ở lần này)

- Sửa/xoá câu hỏi sau khi đã gửi.
- Nút "không thích"/dislike.
- Tìm kiếm/lọc câu hỏi.
- Đa ngôn ngữ có thể chuyển đổi qua lại (chỉ hiển thị song ngữ cố định, không có nút chuyển).
- Theo dõi trạng thái duyệt của câu hỏi mình đã gửi (từ phía nhân viên).
- Đăng nhập/xác thực danh tính người dùng ở bất kỳ giao diện nào.
- Hiển thị thứ hạng trong hàng chờ khi hệ thống quá tải.
- Dùng lại cho các sự kiện khác sau này (đây là công cụ dùng 1 lần cho VNGGames ON 07/10/2026).

## 13. Thông tin dự án

- Repo: `https://github.com/dattran1551/Voting-poll-app/`
- Thư mục làm việc local: `C:\Users\VNG\Voting-poll-app`
- Sự kiện: VNGGames ON, 07/10/2026, ~500 người tham dự.
