
/**
 * Cập nhật mới nhất: 07/01/2026
 * Bổ sung chi tiết các bước tính toán thống kê
 */
function showCalculation(statId, datasetIndex) {
    const result = lastResults[datasetIndex];
    const groups = lastGroups;
    let content = '';
    let title = '';

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
        default:
            content = 'Tính năng đang được cập nhật...';
    }

    const modal = document.getElementById('calcModal');
    document.getElementById('calcModalTitle').innerText = title;
    document.getElementById('calcModalBody').innerHTML = content;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCalcModal() {
    const modal = document.getElementById('calcModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
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
                <td class="border border-slate-300 p-1 text-center">[${fmt(g.lower)}; ${fmt(g.upper)})</td>
                <td class="border border-slate-300 p-1 text-center">${fmt(x)}</td>
                <td class="border border-slate-300 p-1 text-center">${m}</td>
                <td class="border border-slate-300 p-1 text-center">${fmt(mx)}</td>
              </tr>`;
    });
    h += `<tr class="font-bold bg-slate-50">
            <td colspan="2" class="border border-slate-300 p-1 text-right">Tổng</td>
            <td class="border border-slate-300 p-1 text-center">${r.s.N}</td>
            <td class="border border-slate-300 p-1 text-center">${fmt(sumMX)}</td>
          </tr></table>`;
    
    h += `<p class="font-medium">Thay vào công thức:</p>`;
    h += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">x̄ = ${fmt(sumMX)} / ${r.s.N} = <span class="text-indigo-700 font-bold">${fmt(r.s.mean)}</span></div>`;
    return h;
}

function generateMedianCalc(r, groups) {
    const n = r.s.N;
    const p = r.s.q2Loc; // Nhóm chứa trung vị
    const groupIdx = groups.findIndex(g => `[${fmt(g.lower)}; ${fmt(g.upper)})` === p);
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
    html += `<li>aₚ = ${fmt(L)} (đầu mút trái của nhóm chứa trung vị)</li>`;
    html += `<li>n = ${n} (cỡ mẫu)</li>`;
    html += `<li>m₁+...+mₚ₋₁ = ${cf_prev} (tổng tần số các nhóm trước nhóm chứa trung vị)</li>`;
    html += `<li>mₚ = ${m_p} (tần số nhóm chứa trung vị)</li>`;
    html += `<li>aₚ₊₁ - aₚ = ${fmt(h)} (độ rộng của nhóm)</li></ul>`;
    
    html += `<p class="font-medium">Thay vào công thức:</p>`;
    html += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">Me = ${fmt(L)} + [ (${n}/2 - ${cf_prev}) / ${m_p} ] * ${fmt(h)}</div>`;
    html += `<div class="mt-2 text-center font-serif">Me = ${fmt(L)} + [ (${n/2 - cf_prev}) / ${m_p} ] * ${fmt(h)}</div>`;
    html += `<div class="mt-2 text-center font-serif font-bold text-indigo-700">Me = ${fmt(r.s.q2)}</div>`;
    return html;
}

function generateQ1Calc(r, groups) {
    const n = r.s.N;
    const p = r.s.q1Loc;
    const groupIdx = groups.findIndex(g => `[${fmt(g.lower)}; ${fmt(g.upper)})` === p);
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
    html += `<li>aₚ = ${fmt(L)}</li><li>n = ${n}</li><li>m₁+...+mₚ₋₁ = ${cf_prev}</li><li>mₚ = ${m_p}</li><li>aₚ₊₁ - aₚ = ${fmt(h)}</li></ul>`;
    
    html += `<p class="font-medium">Thay vào công thức:</p>`;
    html += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">Q₁ = ${fmt(L)} + [ (${n}/4 - ${cf_prev}) / ${m_p} ] * ${fmt(h)}</div>`;
    html += `<div class="mt-2 text-center font-serif font-bold text-indigo-700">Q₁ = ${fmt(r.s.q1)}</div>`;
    return html;
}

function generateQ3Calc(r, groups) {
    const n = r.s.N;
    const p = r.s.q3Loc;
    const groupIdx = groups.findIndex(g => `[${fmt(g.lower)}; ${fmt(g.upper)})` === p);
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
    html += `<li>aₚ = ${fmt(L)}</li><li>n = ${n}</li><li>m₁+...+mₚ₋₁ = ${cf_prev}</li><li>mₚ = ${m_p}</li><li>aₚ₊₁ - aₚ = ${fmt(h)}</li></ul>`;
    
    html += `<p class="font-medium">Thay vào công thức:</p>`;
    html += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">Q₃ = ${fmt(L)} + [ (3*${n}/4 - ${cf_prev}) / ${m_p} ] * ${fmt(h)}</div>`;
    html += `<div class="mt-2 text-center font-serif font-bold text-indigo-700">Q₃ = ${fmt(r.s.q3)}</div>`;
    return html;
}

function generateModeCalc(r, groups) {
    // Tìm nhóm có tần số lớn nhất
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

    let html = `<p class="mb-2">Nhóm có tần số lớn nhất là nhóm thứ ${j+1}: <span class="font-bold">[${fmt(g.lower)}; ${fmt(g.upper)})</span> với tần số mⱼ = ${m_j}.</p>`;
    html += `<p class="mb-2">Công thức tính Mốt (Mo):</p>`;
    html += `<div class="bg-slate-50 p-3 rounded mb-4 text-center font-serif italic">Mo = aⱼ + [ (mⱼ - mⱼ₋₁) / ((mⱼ - mⱼ₋₁) + (mⱼ - mⱼ₊₁)) ] * (aⱼ₊₁ - aⱼ)</div>`;
    html += `<p class="mb-2">Trong đó:</p><ul class="list-disc ml-6 mb-4">`;
    html += `<li>aⱼ = ${fmt(L)}</li><li>mⱼ = ${m_j}</li><li>mⱼ₋₁ = ${m_prev}</li><li>mⱼ₊₁ = ${m_next}</li><li>aⱼ₊₁ - aⱼ = ${fmt(h)}</li></ul>`;
    
    html += `<p class="font-medium">Thay vào công thức:</p>`;
    html += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">Mo = ${fmt(L)} + [ (${m_j} - ${m_prev}) / ((${m_j} - ${m_prev}) + (${m_j} - ${m_next})) ] * ${fmt(h)}</div>`;
    html += `<div class="mt-2 text-center font-serif font-bold text-indigo-700">Mo = ${fmt(r.s.mode)}</div>`;
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
                <td class="border border-slate-300 p-1 text-center">${fmt(x)}</td>
                <td class="border border-slate-300 p-1 text-center">${m}</td>
                <td class="border border-slate-300 p-1 text-center">${fmt(diff)}</td>
                <td class="border border-slate-300 p-1 text-center">${fmt(diffSq)}</td>
                <td class="border border-slate-300 p-1 text-center">${fmt(mDiffSq)}</td>
              </tr>`;
    });
    h += `<tr class="font-bold bg-slate-50">
            <td colspan="4" class="border border-slate-300 p-1 text-right">Tổng</td>
            <td class="border border-slate-300 p-1 text-center">${fmt(sumMXX)}</td>
          </tr></table>`;
    
    h += `<p class="font-medium">Thay vào công thức:</p>`;
    h += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">s² = ${fmt(sumMXX)} / ${n} = <span class="text-indigo-700 font-bold">${fmt(r.s.variance)}</span></div>`;
    return h;
}

function generateSDCalc(r, groups) {
    let h = `<p class="mb-2">Độ lệch chuẩn (s) là căn bậc hai của phương sai (s²):</p>`;
    h += `<div class="bg-slate-50 p-3 rounded mb-4 text-center font-serif italic">s = √s²</div>`;
    h += `<p class="mb-2">Ta đã tính được phương sai s² = ${fmt(r.s.variance)}.</p>`;
    h += `<p class="font-medium">Thay vào công thức:</p>`;
    h += `<div class="bg-indigo-50 p-3 rounded text-center font-serif">s = √${fmt(r.s.variance)} = <span class="text-indigo-700 font-bold">${fmt(r.s.sd)}</span></div>`;
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
