
# Hệ thống Thống kê TTCM Pro (v2.0)

Bản nâng cấp chuyên sâu dành cho Tổ chuyên môn với khả năng phân tích thống kê học thuật.

## Tính năng mới:
1. **Thống kê mô tả (Descriptive Stats):**
   - Tự động tính Tứ phân vị (Q1, Median/Q2, Q3).
   - Tính độ lệch chuẩn (Sample Standard Deviation).
   - Tính IQR để xác định độ phân tán.
2. **Biểu đồ Plotly Chuyên nghiệp:**
   - **Boxplot:** Xem sự phân bố điểm số và các điểm ngoại lệ (outliers) của từng lớp.
   - **Histogram:** Xem phổ điểm (Bell curve) để đánh giá chất lượng đề thi.
   - **Stacked Bar:** So sánh cơ cấu học lực giữa các lớp.
3. **Bộ lọc thông minh:**
   - Tự động tách Khối từ tên lớp (ví dụ: Lớp "10A1" -> Khối "10").
   - Lọc theo cột điểm: ĐTB, Cuối Kỳ, hoặc Thường Xuyên.
4. **Báo cáo chuyên sâu:**
   - Excel xuất ra nhiều sheet: Mô tả, Phân phối, Tổng hợp.

## Lưu ý kỹ thuật:
- Sử dụng `plotly.js-dist-min` để giảm nhẹ kích thước bundle nhưng vẫn đủ tính năng.
- Toàn bộ tính toán diễn ra tại Client (trình duyệt), đảm bảo bảo mật dữ liệu học sinh.
