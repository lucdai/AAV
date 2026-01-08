
/**
 * Cập nhật mới nhất: 08/01/2026
 * Tích hợp hiển thị chi tiết Trung vị, Q1, Q3 với định dạng toán học chuyên nghiệp
 * Các chỉ số khác giữ nguyên định dạng cũ theo yêu cầu.
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

// --- ĐỊNH DẠNG MỚI CHO TRUNG VỊ, Q1, Q3 ---
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

// --- ĐỊNH DẠNG CŨ CHO CÁC CHỈ SỐ KHÁC ---
function generateMeanCalcOld(r, groups) {
    let h = `<div><strong>1. Công thức số trung bình cộng (<span class="math-symbol">x&#772;</span>):</strong></div>`;
    h += `<div class="formula-container"><span class="math-symbol">x&#772;</span> = ${frac('1','N')} &sum; n<span class="sub">i</span>c<span class="sub">i</span></div>`;
    let sumStr = r.gStats.map((g, i) => `${g.freq}&times;${groups[i].midpoint}`).join(' + ');
    if(sumStr.length > 60) sumStr = sumStr.substring(0,60) + "...";
    h += `<div class="formula-container"><span class="math-symbol">x&#772;</span> = ${frac(sumStr, r.s.N)} = <strong>${fmtInternal(r.s.mean)}</strong></div>`;
    return h;
}

function generateModeCalcOld(r, groups) {
    let maxF = -1, idx = -1;
    r.gStats.forEach((g, i) => { if(g.freq > maxF) { maxF = g.freq; idx = i; } });
    const g = groups[idx];
    const np = idx > 0 ? r.gStats[idx-1].freq : 0;
    const nn = idx < r.gStats.length - 1 ? r.gStats[idx+1].freq : 0;
    let h = `<div><strong>1. Nhóm chứa Mốt (M<span class="sub">o</span>):</strong></div>`;
    h += `<p class="ml-4 mb-4">Nhóm có tần số lớn nhất (${maxF}) là [${g.lower}; ${g.upper})</p>`;
    h += `<div><strong>2. Công thức tính:</strong></div>`;
    h += `<div class="formula-container">M<span class="sub">o</span> = u<span class="sub">o</span> + ${frac('n<span class="sub">o</span> - n<span class="sub">o-1</span>', '(n<span class="sub">o</span> - n<span class="sub">o-1</span>) + (n<span class="sub">o</span> - n<span class="sub">o+1</span>)')} &times; h</div>`;
    h += `<div><strong>3. Thay số:</strong></div>`;
    h += `<div class="formula-container">M<span class="sub">o</span> = ${g.lower} + ${frac(`${g.freq} - ${np}`, `(${g.freq} - ${np}) + (${g.freq} - ${nn})`)} &times; ${g.upper-g.lower} = <strong>${fmtInternal(r.s.mode)}</strong></div>`;
    return h;
}

function generateVarianceSDCalcOld(id, r, groups) {
    let h = `<div><strong>1. Công thức Phương sai (s<span class="sup">2</span>):</strong></div>`;
    h += `<div class="formula-container">s<span class="sup">2</span> = ${frac('1','N')} &sum; n<span class="sub">i</span>(c<span class="sub">i</span> - <span class="math-symbol">x&#772;</span>)<span class="sup">2</span></div>`;
    h += `<div class="formula-container">s<span class="sup">2</span> = <strong>${fmtInternal(r.s.variance)}</strong></div>`;
    if(id === 'sd') {
        h += `<div class="mt-4 border-t pt-4"><strong>2. Độ lệch chuẩn (s):</strong></div>`;
        h += `<div class="formula-container">s = &radic;<span style="border-top:1.5px solid #000">s<span class="sup">2</span></span> = &radic;<span style="border-top:1.5px solid #000">${fmtInternal(r.s.variance)}</span> = <strong>${fmtInternal(r.s.sd)}</strong></div>`;
    }
    return h;
}

function generateRangeCalcOld(r, groups) {
    let h = `<div><strong>1. Công thức Khoảng biến thiên (R):</strong></div>`;
    h += `<div class="formula-container">R = x<span class="sub">max</span> - x<span class="sub">min</span></div>`;
    if(r.rawData && r.rawData.length){
        const min = Math.min(...r.rawData), max = Math.max(...r.rawData);
        h += `<div class="formula-container">R = ${max} - ${min} = <strong>${fmtInternal(r.s.range)}</strong></div>`;
    } else {
        h += `<p class="text-sm italic text-indigo-600 mb-2">Ước lượng: Cận trên nhóm cuối - Cận dưới nhóm đầu</p>`;
        h += `<div class="formula-container">R &approx; ${groups[groups.length-1].upper} - ${groups[0].lower} = <strong>${fmtInternal(r.s.range)}</strong></div>`;
    }
    return h;
}

function generateIQRCalcOld(r, groups) {
    let h = `<div><strong>1. Công thức Khoảng tứ phân vị (<span class="delta-symbol">&Delta;</span><span class="sub">Q</span>):</strong></div>`;
    h += `<div class="formula-container"><span class="delta-symbol">&Delta;</span><span class="sub">Q</span> = Q<span class="sub">3</span> - Q<span class="sub">1</span></div>`;
    h += `<div class="formula-container"><span class="delta-symbol">&Delta;</span><span class="sub">Q</span> = ${fmtInternal(r.s.q3)} - ${fmtInternal(r.s.q1)} = <strong>${fmtInternal(r.s.iqr)}</strong></div>`;
    return h;
}

function generateCVCalcOld(r, groups) {
    let h = `<div><strong>1. Công thức Hệ số biến thiên (CV):</strong></div>`;
    h += `<div class="formula-container">CV = ${frac('s', '|x&#772;|')} &times; 100%</div>`;
    h += `<div class="formula-container">CV = ${frac(fmtInternal(r.s.sd), fmtInternal(Math.abs(r.s.mean)))} &times; 100% = <strong>${fmtInternal(r.s.cv)}%</strong></div>`;
    return h;
}
