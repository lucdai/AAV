
/**
 * Cập nhật mới nhất: 07/01/2026
 * Sửa lỗi ID cho Trung vị, Q1, Q3 và bổ sung hàm định dạng số nội bộ
 */

// Hàm định dạng số nội bộ để đảm bảo không phụ thuộc vào index.html
function fmtInternal(n) { 
    const d = (document.getElementById('decimalPlaces') ? parseInt(document.getElementById('decimalPlaces').value) : 2) || 2; 
    return (n === undefined || n === null) ? "-" : new Intl.NumberFormat('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n); 
}

function showCalculation(statId, datasetIndex) {
    const result = lastResults[datasetIndex];
    const groups = lastGroups;
    let content = '';
    let title = '';

    // Log để debug
    console.log('Showing calculation for:', statId);
    if (!result) { console.error('Result not found for index:', datasetIndex); return; }
    if (!groups) { console.error('Groups not found'); return; }

    switch(statId) {
        case 'mean':
            title = 'Chi tiết tính Số trung bình (x̄)';
            content = generateMeanCalc(result, groups);
            break;
        case 'q2':
            title = 'Chi tiết tính Trung vị (Me)';
            content = generateMedianCalc(result, groups);
            break;
        case 'q1':
            title = 'Chi tiết tính Tứ phân vị thứ nhất (Q1)';
            content = generateQ1Calc(result, groups);
            break;
        case 'q3':
            title = 'Chi tiết tính Tứ phân vị thứ ba (Q3)';
            content = generateQ3Calc(result, groups);
            break;
        case 'mode':
            title = 'Chi tiết tính Mốt (Mo)';
            content = generateModeCalc(result, groups);
            break;
        case 'variance':
            title = 'Chi tiết tính Phương sai (s²)';
            content = generateVarianceCalc(result, groups);
            break;
        case 'sd':
            title = 'Chi tiết tính Độ lệch chuẩn (s)';
            content = generateSDCalc(result, groups);
            break;
        case 'range':
            title = 'Chi tiết tính Khoảng biến thiên (R)';
            content = generateRangeCalc(result, groups);
            break;
        case 'iqr':
            title = 'Chi tiết tính Khoảng tứ phân vị (IQR)';
            content = generateIQRCalc(result, groups);
            break;
        case 'cv':
            title = 'Chi tiết tính Hệ số biến thiên (CV)';
            content = generateCVCalc(result, groups);
            break;
        default:
            content = 'Tính năng đang được cập nhật cho chỉ số: ' + statId;
    }

    const modal = document.getElementById('calcModal');
    if (modal) {
        document.getElementById('calcModalTitle').innerText = title;
        document.getElementById('calcModalBody').innerHTML = content;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        console.error('Modal element not found');
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
    let h = `<p class="mb-2">Công thức tính số trung bình của mẫu số liệu ghép nhóm:</p>`;
    h += `<div class="bg-slate-50 p-3 rounded mb-4 text-center font-serif italic">x̄ = (m₁x₁ + m₂x₂ + ... + mₖxₖ) / n</div>`;
    h += `<p class="mb-2">Trong đó:</p><ul class="list-disc ml-6 mb-4">`;
    h += `<li>n = ${r.s.N} (cỡ mẫu)</li>`;
    h += `<li>xᵢ là giá trị đại diện của nhóm i</li><li>mᵢ là tần số của nhóm i</li></ul>`;
    
    h += `<table class="w-full text-sm border-collapse border border-slate-300 mb-4">`;
    h += `<tr class="bg-slate-100">
            <th class="border border-slate-300 p-1">Nhóm</th>
            <th class="border border-slate-300 p-1">Giá trị đại diện (xᵢ)</th>
            <th class="border border-slate-300 p-1">Tần số (mᵢ)</th>
            <th class="border border-slate-300 p-1">mᵢxᵢ</th>
          </tr>`;
    
    let sumMX = 0;
    groups.forEach((g, i) => {
        const m = r.gStats[i].freq;
        const x = g.midpoint;
        const mx = m * x;
        sumMX += mx;
        h += `<tr>
                <td class="border border-slate-300 p-1 text-center">[${fmtInternal(g.lower)}; ${fmtInternal(g.upper)})</td>
                <td class="border border-slate-300 p-1 text-center">${fmtInternal(x)}</td>
                <td class="border border-slate-300 p-1 text-center">${m}</td>
                <td class="border border-slate-300 p-1 text-center">${fmtInternal(mx)}</td>
              </tr>`;
    });
    h += `<tr class="font-bold bg-slate-50">
            <td colspan="2" class="border border-slate-300 p-1 text-right">Tổng</td>
            <td class="border border-slate-300 p-1 text-center">${r.s.N}</td>
            <td class="border border-slate-300 p-1 text-center">${fmtInternal(sumMX)}</td>
          </tr></table>`;
    
    h += `<p class="font-medium">Thay vào công thức:</p>`;
    h += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">x̄ = ${fmtInternal(sumMX)} / ${r.s.N} = <span class="text-indigo-700 font-bold">${fmtInternal(r.s.mean)}</span></div>`;
    return h;
}

function generateMedianCalc(r, groups) {
    const n = r.s.N;
    const p = r.s.q2Loc; // Nhóm chứa trung vị
    const groupIdx = groups.findIndex(g => `[${fmtInternal(g.lower)}; ${fmtInternal(g.upper)})` === p);
    if (groupIdx === -1) return "Không tìm thấy nhóm chứa trung vị.";
    
    const g = groups[groupIdx];
    const L = g.lower;
    const h = g.upper - g.lower;
    const m_p = r.gStats[groupIdx].freq;
    let cf_prev = 0;
    for(let i=0; i<groupIdx; i++) cf_prev += r.gStats[i].freq;

    let html = `<p class="mb-2">Cỡ mẫu n = ${n}. Ta có n/2 = ${n/2}.</p>`;
    html += `<p class="mb-2">Nhóm chứa trung vị là nhóm thứ ${groupIdx + 1}: <span class="font-bold">${p}</span> (vì đây là nhóm đầu tiên có tần số tích lũy ≥ ${n/2}).</p>`;
    html += `<p class="mb-2">Công thức tính trung vị:</p>`;
    html += `<div class="bg-slate-50 p-3 rounded mb-4 text-center font-serif italic">Me = aₚ + [ (n/2 - (m₁+...+mₚ₋₁)) / mₚ ] * (aₚ₊₁ - aₚ)</div>`;
    html += `<p class="mb-2">Trong đó:</p><ul class="list-disc ml-6 mb-4">`;
    html += `<li>aₚ = ${fmtInternal(L)} (đầu mút trái của nhóm chứa trung vị)</li>`;
    html += `<li>n = ${n} (cỡ mẫu)</li>`;
    html += `<li>m₁+...+mₚ₋₁ = ${cf_prev} (tổng tần số các nhóm trước nhóm chứa trung vị)</li>`;
    html += `<li>mₚ = ${m_p} (tần số nhóm chứa trung vị)</li>`;
    html += `<li>aₚ₊₁ - aₚ = ${fmtInternal(h)} (độ rộng của nhóm)</li></ul>`;
    
    html += `<p class="font-medium">Thay vào công thức:</p>`;
    html += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">Me = ${fmtInternal(L)} + [ (${n}/2 - ${cf_prev}) / ${m_p} ] * ${fmtInternal(h)}</div>`;
    html += `<div class="mt-2 text-center font-serif">Me = ${fmtInternal(L)} + [ (${n/2 - cf_prev}) / ${m_p} ] * ${fmtInternal(h)}</div>`;
    html += `<div class="mt-2 text-center font-serif font-bold text-indigo-700">Me = ${fmtInternal(r.s.q2)}</div>`;
    return html;
}

function generateQ1Calc(r, groups) {
    const n = r.s.N;
    const p = r.s.q1Loc;
    const groupIdx = groups.findIndex(g => `[${fmtInternal(g.lower)}; ${fmtInternal(g.upper)})` === p);
    if (groupIdx === -1) return "Không tìm thấy nhóm chứa Q1.";

    const g = groups[groupIdx];
    const L = g.lower;
    const h = g.upper - g.lower;
    const m_p = r.gStats[groupIdx].freq;
    let cf_prev = 0;
    for(let i=0; i<groupIdx; i++) cf_prev += r.gStats[i].freq;

    let html = `<p class="mb-2">Cỡ mẫu n = ${n}. Ta có n/4 = ${n/4}.</p>`;
    html += `<p class="mb-2">Nhóm chứa Q₁ là nhóm thứ ${groupIdx + 1}: <span class="font-bold">${p}</span> (vì đây là nhóm đầu tiên có tần số tích lũy ≥ ${n/4}).</p>`;
    html += `<p class="mb-2">Công thức tính tứ phân vị thứ nhất:</p>`;
    html += `<div class="bg-slate-50 p-3 rounded mb-4 text-center font-serif italic">Q₁ = aₚ + [ (n/4 - (m₁+...+mₚ₋₁)) / mₚ ] * (aₚ₊₁ - aₚ)</div>`;
    html += `<p class="mb-2">Trong đó:</p><ul class="list-disc ml-6 mb-4">`;
    html += `<li>aₚ = ${fmtInternal(L)}</li><li>n = ${n}</li><li>m₁+...+mₚ₋₁ = ${cf_prev}</li><li>mₚ = ${m_p}</li><li>aₚ₊₁ - aₚ = ${fmtInternal(h)}</li></ul>`;
    
    html += `<p class="font-medium">Thay vào công thức:</p>`;
    html += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">Q₁ = ${fmtInternal(L)} + [ (${n}/4 - ${cf_prev}) / ${m_p} ] * ${fmtInternal(h)}</div>`;
    html += `<div class="mt-2 text-center font-serif font-bold text-indigo-700">Q₁ = ${fmtInternal(r.s.q1)}</div>`;
    return html;
}

function generateQ3Calc(r, groups) {
    const n = r.s.N;
    const p = r.s.q3Loc;
    const groupIdx = groups.findIndex(g => `[${fmtInternal(g.lower)}; ${fmtInternal(g.upper)})` === p);
    if (groupIdx === -1) return "Không tìm thấy nhóm chứa Q3.";

    const g = groups[groupIdx];
    const L = g.lower;
    const h = g.upper - g.lower;
    const m_p = r.gStats[groupIdx].freq;
    let cf_prev = 0;
    for(let i=0; i<groupIdx; i++) cf_prev += r.gStats[i].freq;

    let html = `<p class="mb-2">Cỡ mẫu n = ${n}. Ta có 3n/4 = ${3*n/4}.</p>`;
    html += `<p class="mb-2">Nhóm chứa Q₃ là nhóm thứ ${groupIdx + 1}: <span class="font-bold">${p}</span> (vì đây là nhóm đầu tiên có tần số tích lũy ≥ ${3*n/4}).</p>`;
    html += `<p class="mb-2">Công thức tính tứ phân vị thứ ba:</p>`;
    html += `<div class="bg-slate-50 p-3 rounded mb-4 text-center font-serif italic">Q₃ = aₚ + [ (3n/4 - (m₁+...+mₚ₋₁)) / mₚ ] * (aₚ₊₁ - aₚ)</div>`;
    html += `<p class="mb-2">Trong đó:</p><ul class="list-disc ml-6 mb-4">`;
    html += `<li>aₚ = ${fmtInternal(L)}</li><li>n = ${n}</li><li>m₁+...+mₚ₋₁ = ${cf_prev}</li><li>mₚ = ${m_p}</li><li>aₚ₊₁ - aₚ = ${fmtInternal(h)}</li></ul>`;
    
    html += `<p class="font-medium">Thay vào công thức:</p>`;
    html += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">Q₃ = ${fmtInternal(L)} + [ (3*${n}/4 - ${cf_prev}) / ${m_p} ] * ${fmtInternal(h)}</div>`;
    html += `<div class="mt-2 text-center font-serif font-bold text-indigo-700">Q₃ = ${fmtInternal(r.s.q3)}</div>`;
    return html;
}

function generateModeCalc(r, groups) {
    let maxF = -1, j = -1;
    r.gStats.forEach((g, i) => {
        if(g.freq > maxF) { maxF = g.freq; j = i; }
    });
    
    const g = groups[j];
    const L = g.lower;
    const h = g.upper - g.lower;
    const m_j = r.gStats[j].freq;
    const m_prev = j > 0 ? r.gStats[j-1].freq : 0;
    const m_next = j < r.gStats.length - 1 ? r.gStats[j+1].freq : 0;

    let html = `<p class="mb-2">Nhóm có tần số lớn nhất là nhóm thứ ${j+1}: <span class="font-bold">[${fmtInternal(g.lower)}; ${fmtInternal(g.upper)})</span> với tần số mⱼ = ${m_j}.</p>`;
    html += `<p class="mb-2">Công thức tính Mốt (Mo):</p>`;
    html += `<div class="bg-slate-50 p-3 rounded mb-4 text-center font-serif italic">Mo = aⱼ + [ (mⱼ - mⱼ₋₁) / ((mⱼ - mⱼ₋₁) + (mⱼ - mⱼ₊₁)) ] * (aⱼ₊₁ - aⱼ)</div>`;
    html += `<p class="mb-2">Trong đó:</p><ul class="list-disc ml-6 mb-4">`;
    html += `<li>aⱼ = ${fmtInternal(L)}</li><li>mⱼ = ${m_j}</li><li>mⱼ₋₁ = ${m_prev}</li><li>mⱼ₊₁ = ${m_next}</li><li>aⱼ₊₁ - aⱼ = ${fmtInternal(h)}</li></ul>`;
    
    html += `<p class="font-medium">Thay vào công thức:</p>`;
    html += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">Mo = ${fmtInternal(L)} + [ (${m_j} - ${m_prev}) / ((${m_j} - ${m_prev}) + (${m_j} - ${m_next})) ] * ${fmtInternal(h)}</div>`;
    html += `<div class="mt-2 text-center font-serif font-bold text-indigo-700">Mo = ${fmtInternal(r.s.mode)}</div>`;
    return html;
}

function generateVarianceCalc(r, groups) {
    const mean = r.s.mean;
    const n = r.s.N;
    let h = `<p class="mb-2">Công thức tính phương sai (s²):</p>`;
    h += `<div class="bg-slate-50 p-3 rounded mb-4 text-center font-serif italic">s² = [ Σ mᵢ(xᵢ - x̄)² ] / n</div>`;
    
    h += `<table class="w-full text-xs border-collapse border border-slate-300 mb-4">`;
    h += `<tr class="bg-slate-100">
            <th class="border border-slate-300 p-1">xᵢ</th>
            <th class="border border-slate-300 p-1">mᵢ</th>
            <th class="border border-slate-300 p-1">xᵢ - x̄</th>
            <th class="border border-slate-300 p-1">(xᵢ - x̄)²</th>
            <th class="border border-slate-300 p-1">mᵢ(xᵢ - x̄)²</th>
          </tr>`;
    
    let sumMXX = 0;
    groups.forEach((g, i) => {
        const m = r.gStats[i].freq;
        const x = g.midpoint;
        const diff = x - mean;
        const diffSq = diff * diff;
        const mDiffSq = m * diffSq;
        sumMXX += mDiffSq;
        h += `<tr>
                <td class="border border-slate-300 p-1 text-center">${fmtInternal(x)}</td>
                <td class="border border-slate-300 p-1 text-center">${m}</td>
                <td class="border border-slate-300 p-1 text-center">${fmtInternal(diff)}</td>
                <td class="border border-slate-300 p-1 text-center">${fmtInternal(diffSq)}</td>
                <td class="border border-slate-300 p-1 text-center">${fmtInternal(mDiffSq)}</td>
              </tr>`;
    });
    h += `<tr class="font-bold bg-slate-50">
            <td colspan="4" class="border border-slate-300 p-1 text-right">Tổng</td>
            <td class="border border-slate-300 p-1 text-center">${fmtInternal(sumMXX)}</td>
          </tr></table>`;
    
    h += `<p class="font-medium">Thay vào công thức:</p>`;
    h += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">s² = ${fmtInternal(sumMXX)} / ${n} = <span class="text-indigo-700 font-bold">${fmtInternal(r.s.variance)}</span></div>`;
    return h;
}

function generateSDCalc(r, groups) {
    let h = `<p class="mb-2">Độ lệch chuẩn (s) là căn bậc hai của phương sai (s²):</p>`;
    h += `<div class="bg-slate-50 p-3 rounded mb-4 text-center font-serif italic">s = √s²</div>`;
    h += `<p class="mb-2">Ta đã tính được phương sai s² = ${fmtInternal(r.s.variance)}.</p>`;
    h += `<p class="font-medium">Thay vào công thức:</p>`;
    h += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">s = √${fmtInternal(r.s.variance)} = <span class="text-indigo-700 font-bold">${fmtInternal(r.s.sd)}</span></div>`;
    return h;
}

function generateRangeCalc(r, groups) {
    let h = `<p class="mb-2">Khoảng biến thiên (R) là hiệu số giữa giá trị lớn nhất và giá trị nhỏ nhất của mẫu số liệu:</p>`;
    h += `<div class="bg-slate-50 p-3 rounded mb-4 text-center font-serif italic">R = xₘₐₓ - xₘᵢₙ</div>`;
    
    let minVal, maxVal;
    if (r.rawData && r.rawData.length > 0) {
        minVal = r.rawData[0];
        maxVal = r.rawData[r.rawData.length - 1];
        h += `<p class="mb-2">Dựa trên dữ liệu thô:</p>`;
        h += `<ul class="list-disc ml-6 mb-4"><li>xₘₐₓ = ${fmtInternal(maxVal)}</li><li>xₘᵢₙ = ${fmtInternal(minVal)}</li></ul>`;
    } else {
        const activeGroups = groups.filter((g, i) => r.gStats[i].freq > 0);
        minVal = activeGroups[0].lower;
        maxVal = activeGroups[activeGroups.length - 1].upper;
        h += `<p class="mb-2">Dựa trên các nhóm có dữ liệu:</p>`;
        h += `<ul class="list-disc ml-6 mb-4"><li>Đầu mút trên của nhóm cuối cùng: ${fmtInternal(maxVal)}</li><li>Đầu mút dưới của nhóm đầu tiên: ${fmtInternal(minVal)}</li></ul>`;
    }
    
    h += `<p class="font-medium">Thay vào công thức:</p>`;
    h += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">R = ${fmtInternal(maxVal)} - ${fmtInternal(minVal)} = <span class="text-indigo-700 font-bold">${fmtInternal(r.s.range)}</span></div>`;
    return h;
}

function generateIQRCalc(r, groups) {
    let h = `<p class="mb-2">Khoảng tứ phân vị (IQR) là hiệu số giữa tứ phân vị thứ ba (Q₃) và tứ phân vị thứ nhất (Q₁):</p>`;
    h += `<div class="bg-slate-50 p-3 rounded mb-4 text-center font-serif italic">IQR = Q₃ - Q₁</div>`;
    h += `<p class="mb-2">Ta đã tính được:</p><ul class="list-disc ml-6 mb-4">`;
    h += `<li>Q₃ = ${fmtInternal(r.s.q3)}</li><li>Q₁ = ${fmtInternal(r.s.q1)}</li></ul>`;
    h += `<p class="font-medium">Thay vào công thức:</p>`;
    h += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">IQR = ${fmtInternal(r.s.q3)} - ${fmtInternal(r.s.q1)} = <span class="text-indigo-700 font-bold">${fmtInternal(r.s.iqr)}</span></div>`;
    return h;
}

function generateCVCalc(r, groups) {
    let h = `<p class="mb-2">Hệ số biến thiên (CV) được tính bằng tỉ số giữa độ lệch chuẩn (s) và trị tuyệt đối của số trung bình (x̄), tính theo đơn vị phần trăm:</p>`;
    h += `<div class="bg-slate-50 p-3 rounded mb-4 text-center font-serif italic">CV = (s / |x̄|) * 100%</div>`;
    h += `<p class="mb-2">Ta đã tính được:</p><ul class="list-disc ml-6 mb-4">`;
    h += `<li>s = ${fmtInternal(r.s.sd)}</li><li>x̄ = ${fmtInternal(r.s.mean)}</li></ul>`;
    h += `<p class="font-medium">Thay vào công thức:</p>`;
    h += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">CV = (${fmtInternal(r.s.sd)} / |${fmtInternal(r.s.mean)}|) * 100% = <span class="text-indigo-700 font-bold">${fmtInternal(r.s.cv)}%</span></div>`;
    return h;
}

function downloadCalcImage() {
    const element = document.getElementById('calcModalContent');
    const randomId = generateRandomFilename();
    const format = 'png';
    const fileName = `${randomId}.${format}`;

    html2canvas(element, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL(`image/${format}`);
        link.download = fileName;
        link.click();
    });
}
