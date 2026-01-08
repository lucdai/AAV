
/**
 * Cập nhật mới nhất: 08/01/2026
 * Tích hợp hiển thị chi tiết Trung vị, Q1, Q3 với định dạng toán học chuyên nghiệp
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

function showCalculation(statId, datasetIndex) {
    const result = lastResults[datasetIndex];
    const groups = lastGroups;
    let content = '';
    let title = '';

    if (!result) { console.error('Result not found for index:', datasetIndex); return; }
    if (!groups) { console.error('Groups not found'); return; }

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
            content = generateMeanCalc(result, groups);
            break;
        case 'q2':
        case 'q1':
        case 'q3':
            content = generateQuartileCalc(statId, result, groups);
            break;
        case 'mode':
            content = generateModeCalc(result, groups);
            break;
        case 'variance':
        case 'sd':
            content = generateVarianceSDCalc(statId, result, groups);
            break;
        case 'range':
            content = generateRangeCalc(result, groups);
            break;
        case 'iqr':
            content = generateIQRCalc(result, groups);
            break;
        case 'cv':
            content = generateCVCalc(result, groups);
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

function generateMeanCalc(r, groups) {
    let h = `<div><strong>1. Công thức số trung bình cộng (<span class="math-symbol">x̄</span>):</strong></div>`;
    h += `<div class="formula-container"><span class="math-symbol">x̄</span> = ${frac('1','N')} &sum; n<span class="sub">i</span>c<span class="sub">i</span></div>`;
    
    let sumStr = groups.map((g, i) => `${r.gStats[i].freq}&times;${fmtInternal(g.midpoint)}`).join(' + ');
    if(sumStr.length > 100) sumStr = sumStr.substring(0,100) + "...";
    
    h += `<div class="formula-container"><span class="math-symbol">x̄</span> = ${frac(sumStr, r.s.N)} = <strong>${fmtInternal(r.s.mean)}</strong></div>`;
    return h;
}

function generateQuartileCalc(id, r, groups) {
    const k = id==='q1'?1:(id==='q3'?3:2);
    const pos = r.s.N * k / 4;
    const label = id==='q2'?'M<span class="sub">e</span>':(id==='q1'?'Q<span class="sub">1</span>':'Q<span class="sub">3</span>');
    
    // Tìm nhóm chứa Qk
    let cf = 0;
    let idx = -1;
    for(let i=0; i<r.gStats.length; i++) {
        cf += r.gStats[i].freq;
        if(cf >= pos - 0.000001) { // Sử dụng epsilon để tránh lỗi làm tròn
            idx = i;
            break;
        }
    }
    
    // Fallback nếu không tìm thấy (thường là nhóm cuối)
    if (idx === -1) idx = r.gStats.length - 1;
    
    const g = groups[idx];
    if (!g) return `<p class="text-red-500">Lỗi: Không xác định được nhóm chứa dữ liệu. Vui lòng kiểm tra lại bảng tần số.</p>`;
    
    const prevCf = idx > 0 ? r.gStats[idx-1].cf : 0;
    const n_m = r.gStats[idx].freq;
    const h_val = g.upper - g.lower;

    let h = `<div><strong>1. Xác định nhóm chứa ${label}:</strong></div>`;
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

function generateModeCalc(r, groups) {
    let maxF = -1, idx = -1;
    r.gStats.forEach((g, i) => {
        if(g.freq > maxF) { maxF = g.freq; idx = i; }
    });
    
    const g = groups[idx];
    const np = idx > 0 ? r.gStats[idx-1].freq : 0;
    const nn = idx < r.gStats.length - 1 ? r.gStats[idx+1].freq : 0;
    const h_val = g.upper - g.lower;

    let h = `<div><strong>1. Nhóm chứa Mốt (M<span class="sub">o</span>):</strong></div>`;
    h += `<p class="ml-4 mb-4">Nhóm có tần số lớn nhất (${maxF}) là nhóm thứ ${idx+1}: [${fmtInternal(g.lower)}; ${fmtInternal(g.upper)})</p>`;
    h += `<div><strong>2. Công thức tính:</strong></div>`;
    h += `<div class="formula-container">M<span class="sub">o</span> = u<span class="sub">o</span> + ${frac('n<span class="sub">o</span> - n<span class="sub">o-1</span>', '(n<span class="sub">o</span> - n<span class="sub">o-1</span>) + (n<span class="sub">o</span> - n<span class="sub">o+1</span>)')} &times; h</div>`;
    h += `<div><strong>3. Thay số:</strong></div>`;
    h += `<div class="formula-container">M<span class="sub">o</span> = ${fmtInternal(g.lower)} + ${frac(`${r.gStats[idx].freq} - ${np}`, `(${r.gStats[idx].freq} - ${np}) + (${r.gStats[idx].freq} - ${nn})`)} &times; ${fmtInternal(h_val)} = <strong>${fmtInternal(r.s.mode)}</strong></div>`;
    return h;
}

function generateVarianceSDCalc(id, r, groups) {
    let h = `<div><strong>1. Công thức Phương sai (s<span class="sup">2</span>):</strong></div>`;
    h += `<div class="formula-container">s<span class="sup">2</span> = ${frac('1','N')} &sum; n<span class="sub">i</span>(c<span class="sub">i</span> - <span class="math-symbol">x̄</span>)<span class="sup">2</span></div>`;
    h += `<div class="formula-container">s<span class="sup">2</span> = <strong>${fmtInternal(r.s.variance)}</strong></div>`;
    
    if(id === 'sd') {
        h += `<div class="mt-4 border-t pt-4"><strong>2. Độ lệch chuẩn (s):</strong></div>`;
        h += `<div class="formula-container">s = &radic;<span style="border-top:1.5px solid #000">s<span class="sup">2</span></span> = &radic;<span style="border-top:1.5px solid #000">${fmtInternal(r.s.variance)}</span> = <strong>${fmtInternal(r.s.sd)}</strong></div>`;
    }
    return h;
}

function generateRangeCalc(r, groups) {
    let h = `<div><strong>1. Công thức Khoảng biến thiên (R):</strong></div>`;
    h += `<div class="formula-container">R = x<span class="sub">max</span> - x<span class="sub">min</span></div>`;
    
    if(r.rawData && r.rawData.length > 0 && !lastGroups.isManual) {
        const min = Math.min(...r.rawData);
        const max = Math.max(...r.rawData);
        h += `<div class="formula-container">R = ${fmtInternal(max)} - ${fmtInternal(min)} = <strong>${fmtInternal(r.s.range)}</strong></div>`;
    } else {
        const first = groups[0];
        const last = groups[groups.length-1];
        h += `<p class="text-sm italic text-indigo-600 mb-2 text-center">Ước lượng: Cận trên nhóm cuối - Cận dưới nhóm đầu</p>`;
        h += `<div class="formula-container">R &approx; ${fmtInternal(last.upper)} - ${fmtInternal(first.lower)} = <strong>${fmtInternal(r.s.range)}</strong></div>`;
    }
    return h;
}

function generateIQRCalc(r, groups) {
    let h = `<div><strong>1. Công thức Khoảng tứ phân vị (<span class="delta-symbol">&Delta;</span><span class="sub">Q</span>):</strong></div>`;
    h += `<div class="formula-container"><span class="delta-symbol">&Delta;</span><span class="sub">Q</span> = Q<span class="sub">3</span> - Q<span class="sub">1</span></div>`;
    h += `<div class="formula-container"><span class="delta-symbol">&Delta;</span><span class="sub">Q</span> = ${fmtInternal(r.s.q3)} - ${fmtInternal(r.s.q1)} = <strong>${fmtInternal(r.s.iqr)}</strong></div>`;
    return h;
}

function generateCVCalc(r, groups) {
    let h = `<div><strong>1. Công thức Hệ số biến thiên (CV):</strong></div>`;
    h += `<div class="formula-container">CV = ${frac('s', '|x̄|')} &times; 100%</div>`;
    h += `<div class="formula-container">CV = ${frac(fmtInternal(r.s.sd), fmtInternal(Math.abs(r.s.mean)))} &times; 100% = <strong>${fmtInternal(r.s.cv)}%</strong></div>`;
    return h;
}
