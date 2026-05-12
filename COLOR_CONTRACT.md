# Color Contract

## Semantic tokens
- `surface-0/1/2`: lớp nền từ ngoài vào trong.
- `on-surface-0/1/2`: màu chữ/icon tương ứng từng lớp.
- `accent/on-accent`: màu nhấn cho CTA.
- `border`, `focus-ring`, `icon-*`: viền, focus, trạng thái icon.

## Nested inversion rule
Container dùng `surface-N` thì child card/control phải dùng `surface-(N+1)` (quay vòng 0->1->2), text/icon luôn dùng `on-surface-(N+1)`.

## Mapping
- Modal: header=`surface-0`, body=`surface-1`, footer=`surface-2`, formula card=`surface-2`.
- Toolbar controls: nền control dùng surface đối nghịch khu vực chứa; disabled dùng token chuyên dụng, không dùng opacity giảm mạnh.
- Table: header=`table-header-bg`; zebra rows=`table-row-odd/even`; hover=`table-row-hover`.
- Buttons: primary=`accent/on-accent`; secondary/outline/ghost dùng thuật toán chọn cặp từ surface.

## PR checklist
- Không hard-code màu trong component UI (ngoại trừ file token/theme).
- Có đủ state default/hover/active/disabled/focus.
- Có áp dụng đảo màu khi component lồng nhau.
- QA nhanh qua màn hình mẫu: modal/table/toolbar/button/icon.
