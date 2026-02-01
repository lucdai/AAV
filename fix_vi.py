import json

with open('translations.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

vi = data['vi']
vi['backup_mgmt'] = "Quản lý sao lưu"
vi['copy_link_btn'] = "Sao chép liên kết chia sẻ"
vi['backup_cleared'] = "Dữ liệu sao lưu đã được xóa thành công"
vi['import_success'] = "Dữ liệu sao lưu đã được nhập thành công. Vui lòng tải lại trang để áp dụng."
vi['sample_a'] = "Mẫu A"
vi['share_link_copied'] = "Link chia sẻ đã được sao chép vào bộ nhớ tạm!"
vi['copy_share_link_here'] = "Sao chép link chia sẻ tại đây:"
vi['freq_analysis_title'] = "Phân Tích Bảng Phân Bố Tần Số Thống Kê"
vi['desc_stats_title'] = "Các Chỉ Số Thống Kê Mô Tả Chi Tiết"
vi['copy'] = "Sao chép"
vi['backup'] = "Sao Lưu"
vi['share'] = "Chia sẻ"
vi['add_group'] = "+ Nhóm"
vi['clear_backup'] = "Xóa sao lưu"
vi['density'] = "Mật độ"
vi['distribution'] = "Phân bố"

with open('translations.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
