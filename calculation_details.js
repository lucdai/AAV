
/**
 * Cập nhật mới nhất: 08/01/2026
 * Tích hợp hiển thị chi tiết Trung vị, Q1, Q3 với định dạng toán học chuyên nghiệp
 * Các chỉ số Mean, Mode, Variance, SD, Range, IQR, CV được khôi phục về định dạng hiển thị cũ.
 * Cập nhật: Phương sai và Độ lệch chuẩn không sử dụng ký hiệu Σ.
 */

// Hàm định dạng số nội bộ
function fmtInternal(n) { 
    const d = (document.getElementById('decimalPlaces') ? parseInt(document.getElementById('decimalPlaces').value) : 2) || 2; 
    return (n === undefined || n === null) ? "-" : new Intl.NumberFormat('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n); 
}

// Hàm tạo phân số HTML
function frac(top, bot) {
    return `<div class="fraction"><span class="numerator">${top}</span><span class="denominator">${bot}</span></div>`;
}

function showCalculation(statId, resultData, groupsData) {
    const result = typeof resultData === 'string' ? JSON.parse(decodeURIComponent(resultData)) : resultData;
    const groups = typeof groupsData === 'string' ? JSON.parse(decodeURIComponent(groupsData)) : groupsData;
    
    let content = '';
    let title = '';

    if (!result) { console.error('Result data not provided'); return; }
    if (!groups) { console.error('Groups data not provided'); return; }

    const metricNames = {
        'mean': 'Số trung bình (x̄)',
        'q2': 'Trung vị (Me)',
        'q1': 'Tứ phân vị 1 (Q1)',
        'q3': 'Tứ phân vị 3 (Q3)',
        'mode': 'Mốt (Mo)',
        'variance': 'Phương sai (s²)',
        'sd': 'Độ lệch chuẩn (s)',
        'range': 'Khoảng biến thiên (R)',
        'iqr': 'Khoảng tứ phân vị (ΔQ)',
        'cv': 'Hệ số biến thiên (CV)'
    };

    title = `Chi tiết tính ${metricNames[statId] || statId} - ${result.name}`;

    switch(statId) {
        case 'mean':
            content = generateMeanCalcOld(result, groups);
            break;
        case 'q2':
        case 'q1':
        case 'q3':
            content = generateQuartileCalcNew(statId, result, groups);
            break;
        case 'mode':
            content = generateModeCalcOld(result, groups);
            break;
        case 'variance':
        case 'sd':
            content = generateVarianceSDCalcOld(statId, result, groups);
            break;
        case 'range':
            content = generateRangeCalcOld(result, groups);
            break;
        case 'iqr':
            content = generateIQRCalcOld(result, groups);
            break;
        case 'cv':
            content = generateCVCalcOld(result, groups);
            break;
        default:
            content = 'Tính năng đang được cập nhật cho chỉ số: ' + statId;
    }

    const modal = document.getElementById('calcModal');
    if (modal) {
        document.getElementById('calcModalTitle').innerText = title;
        document.getElementById('calcModalBody').innerHTML = `<div class="math-text">${content}</div>`;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeCalcModal() {
    const modal = document.getElementById('calcModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// --- ĐỊNH DẠNG MỚI CHO TRUNG VỊ, Q1, Q3 (GIỮ NGUYÊN) ---
function generateQuartileCalcNew(id, r, groups) {
    const k = id==='q1'?1:(id==='q3'?3:2);
    const pos = r.s.N * k / 4;
    const label = id==='q2'?'M<span class="sub">e</span>':(id==='q1'?'Q<span class="sub">1</span>':'Q<span class="sub">3</span>');
    
    let idx = r.s[id + 'Idx'];
    let isFallback = false;

    if (idx === undefined || idx === -1 || !groups[idx]) {
        idx = groups.length - 1;
        isFallback = true;
    }
    
    const g = groups[idx];
    const prevCf = idx > 0 ? r.gStats[idx-1].cf : 0;
    const n_m = r.gStats[idx].freq;
    const h_val = g.upper - g.lower;

    let h = `<div><strong>1. Xác định nhóm chứa ${label}:</strong></div>`;
    if (isFallback) h += `<p class="text-amber-600 text-sm mb-2 italic">Lưu ý: Vị trí vượt quá tổng tần số, mặc định chọn nhóm cuối.</p>`;
    h += `<ul class="list-disc ml-8 mb-4 text-sm">
            <li>Tổng tần số N = ${r.s.N}</li>
            <li>Vị trí: ${k}N/4 = ${pos}</li>
            <li>Nhóm chứa ${label} là nhóm thứ ${idx+1}: [${fmtInternal(g.lower)}; ${fmtInternal(g.upper)})</li>
          </ul>`;
    h += `<div><strong>2. Công thức tính:</strong></div>`;
    h += `<div class="formula-container">${label} = u<span class="sub">m</span> + ${frac(`${k}N/4 - C`, 'n<span class="sub">m</span>')} &times; h</div>`;
    h += `<div><strong>3. Thay số:</strong></div>`;
    h += `<div class="formula-container">${label} = ${fmtInternal(g.lower)} + ${frac(`${pos} - ${prevCf}`, n_m)} &times; ${fmtInternal(h_val)} = <strong>${fmtInternal(r.s[id])}</strong></div>`;
    return h;
}

// --- KHÔI PHỤC ĐỊNH DẠNG HIỂN THỊ CŨ CHO CÁC CHỈ SỐ KHÁC ---
function generateMeanCalcOld(r, groups) {
    let h = `<p>Số trung bình cộng được tính bằng tổng tích của tần số và giá trị đại diện (trung điểm) của mỗi nhóm, chia cho tổng số đơn vị điều tra.</p>`;
    h += `<p class="font-bold mt-4">Công thức:</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
            x̄ = (n₁c₁ + n₂c₂ + ... + nₖcₖ) / N
          </div>`;
    h += `<p class="font-bold mt-4">Thay số:</p>`;
    let sumStr = r.gStats.map((g, i) => `(${g.freq} × ${fmtInternal(groups[i].midpoint)})`).join(' + ');
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
            x̄ = (${sumStr}) / ${r.s.N}
          </div>`;
    h += `<p class="text-xl mt-4">Kết quả: <strong>x̄ = ${fmtInternal(r.s.mean)}</strong></p>`;
    return h;
}

function generateModeCalcOld(r, groups) {
    let maxF = -1, idx = -1;
    r.gStats.forEach((g, i) => { if(g.freq > maxF) { maxF = g.freq; idx = i; } });
    const g = groups[idx];
    const np = idx > 0 ? r.gStats[idx-1].freq : 0;
    const nn = idx < r.gStats.length - 1 ? r.gStats[idx+1].freq : 0;
    const h_val = g.upper - g.lower;
    
    let h = `<p>Mốt (Mo) là giá trị có tần số xuất hiện lớn nhất. Đối với dữ liệu ghép nhóm, Mo được ước lượng dựa trên nhóm có tần số lớn nhất.</p>`;
    h += `<p class="mt-2">Nhóm chứa Mốt là nhóm thứ ${idx+1}: <strong>[${fmtInternal(g.lower)}; ${fmtInternal(g.upper)})</strong> với tần số f = ${maxF}.</p>`;
    h += `<p class="font-bold mt-4">Công thức:</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
            Mo = uₒ + [ (nₒ - nₒ₋₁) / ((nₒ - nₒ₋₁) + (nₒ - nₒ₊₁)) ] × h
          </div>`;
    h += `<p class="font-bold mt-4">Thay số:</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
            Mo = ${fmtInternal(g.lower)} + [ (${maxF} - ${np}) / ((${maxF} - ${np}) + (${maxF} - ${nn})) ] × ${fmtInternal(h_val)}
          </div>`;
    h += `<p class="text-xl mt-4">Kết quả: <strong>Mo = ${fmtInternal(r.s.mode)}</strong></p>`;
    return h;
}

function generateVarianceSDCalcOld(id, r, groups) {
    let h = `<p>Phương sai (s²) đo lường mức độ phân tán của các giá trị so với số trung bình cộng.</p>`;
    h += `<p class="font-bold mt-4">Công thức Phương sai:</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
            s² = [ n₁(c₁ - x̄)² + n₂(c₂ - x̄)² + ... + nₖ(cₖ - x̄)² ] / N
          </div>`;
    h += `<p class="mt-4">Với x̄ = ${fmtInternal(r.s.mean)} và N = ${r.s.N}.</p>`;
    h += `<p class="font-bold mt-4">Thay số:</p>`;
    let sumStr = r.gStats.map((g, i) => `(${g.freq} × (${fmtInternal(groups[i].midpoint)} - ${fmtInternal(r.s.mean)})²)`).join(' + ');
    if (sumStr.length > 300) sumStr = sumStr.substring(0, 300) + "...";
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
            s² = [ ${sumStr} ] / ${r.s.N}
          </div>`;
    h += `<p class="text-xl mt-4">Kết quả Phương sai: <strong>s² = ${fmtInternal(r.s.variance)}</strong></p>`;
    
    if(id === 'sd') {
        h += `<div class="mt-6 pt-6 border-t border-slate-100">`;
        h += `<p>Độ lệch chuẩn (s) là căn bậc hai của phương sai, giúp đưa đơn vị đo về cùng bậc với dữ liệu gốc.</p>`;
        h += `<p class="font-bold mt-4">Công thức:</p>`;
        h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
                s = √s²
              </div>`;
        h += `<p class="text-xl mt-4">Kết quả Độ lệch chuẩn: <strong>s = √${fmtInternal(r.s.variance)} = ${fmtInternal(r.s.sd)}</strong></p>`;
        h += `</div>`;
    }
    return h;
}

function generateRangeCalcOld(r, groups) {
    let h = `<p>Khoảng biến thiên (R) là hiệu số giữa giá trị lớn nhất và giá trị nhỏ nhất trong tập dữ liệu.</p>`;
    h += `<p class="font-bold mt-4">Công thức:</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
            R = xₘₐₓ - xₘᵢₙ
          </div>`;
    
    if(r.rawData && r.rawData.length){
        const min = Math.min(...r.rawData), max = Math.max(...r.rawData);
        h += `<p class="font-bold mt-4">Thay số:</p>`;
        h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
                R = ${fmtInternal(max)} - ${fmtInternal(min)}
              </div>`;
    } else {
        h += `<p class="mt-4 italic text-slate-500">Dữ liệu ghép nhóm: Ước lượng bằng hiệu giữa cận trên nhóm cuối và cận dưới nhóm đầu.</p>`;
        h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
                R ≈ ${fmtInternal(groups[groups.length-1].upper)} - ${fmtInternal(groups[0].lower)}
              </div>`;
    }
    h += `<p class="text-xl mt-4">Kết quả: <strong>R = ${fmtInternal(r.s.range)}</strong></p>`;
    return h;
}

function generateIQRCalcOld(r, groups) {
    let h = `<p>Khoảng tứ phân vị (IQR) là hiệu số giữa tứ phân vị thứ ba (Q3) và tứ phân vị thứ nhất (Q1), đại diện cho phạm vi của 50% dữ liệu ở giữa.</p>`;
    h += `<p class="font-bold mt-4">Công thức:</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
            IQR = Q₃ - Q₁
          </div>`;
    h += `<p class="font-bold mt-4">Thay số:</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
            IQR = ${fmtInternal(r.s.q3)} - ${fmtInternal(r.s.q1)}
          </div>`;
    h += `<p class="text-xl mt-4">Kết quả: <strong>IQR = ${fmtInternal(r.s.iqr)}</strong></p>`;
    return h;
}

function generateCVCalcOld(r, groups) {
    let h = `<p>Hệ số biến thiên (CV) đo lường mức độ phân tán tương đối của dữ liệu so với số trung bình, thường được biểu diễn dưới dạng phần trăm.</p>`;
    h += `<p class="font-bold mt-4">Công thức:</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
            CV = (s / |x̄|) × 100%
          </div>`;
    h += `<p class="font-bold mt-4">Thay số:</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
            CV = (${fmtInternal(r.s.sd)} / ${fmtInternal(Math.abs(r.s.mean))}) × 100%
          </div>`;
    h += `<p class="text-xl mt-4">Kết quả: <strong>CV = ${fmtInternal(r.s.cv)}%</strong></p>`;
    return h;
}
