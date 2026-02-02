
/**
 * Cập nhật mới nhất: 10/01/2026
 * Tích hợp đa ngôn ngữ hoàn toàn cho các chi tiết phép tính
 */

// Hàm định dạng số nội bộ
function fmtInternal(n) { 
    if (n === undefined || n === null) return "-";
    let d = (document.getElementById('decimalPlaces') ? parseInt(document.getElementById('decimalPlaces').value) : 2);
    if (isNaN(d)) d = 2;

    let val = n;
    let minFD = d > 0 ? d : 0;
    let maxFD = d > 0 ? d : 0;

    if (d < 0) {
        const factor = Math.pow(10, Math.abs(d));
        val = Math.round(n / factor) * factor;
        minFD = 0;
        maxFD = 0;
    }

    const lang = localStorage.getItem('aav_lang') || 'vi';
    const localeMap = {
        'vi': 'vi-VN', 'en': 'en-US', 'zh': 'zh-CN', 'hi': 'hi-IN', 'es': 'es-ES',
        'fr': 'fr-FR', 'ar': 'ar-SA', 'bn': 'bn-BD', 'pt': 'pt-PT', 'ru': 'ru-RU', 'ur': 'ur-PK'
    };
    return new Intl.NumberFormat(localeMap[lang] || 'en-US', { 
        minimumFractionDigits: minFD, 
        maximumFractionDigits: maxFD 
    }).format(val); 
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
        'mean': t('mean'),
        'q2': t('median'),
        'q1': t('q1'),
        'q3': t('q3'),
        'mode': t('mode'),
        'variance': t('variance'),
        'sd': t('sd'),
        'range': t('range'),
        'iqr': t('iqr'),
        'cv': t('cv')
    };

    title = t('calc_detail_for', {metric: metricNames[statId] || statId, name: result.name});

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
            content = t('updating_feature') + statId;
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

    let h = safeT('determine_group', {label: label});
    if (isFallback) h += `<p class="text-amber-600 text-sm mb-2 italic">${safeT('note_title')} ${safeT('fallback_note')}</p>`;
    h += `<ul class="list-disc ml-8 mb-4 text-sm">
            <li>${safeT('total_freq')}${r.s.N}</li>
            <li>${safeT('position')}${k}N/4 = ${pos}</li>
            <li>${safeT('group_contains', {label: label, idx: idx+1, lower: fmtInternal(g.lower), upper: fmtInternal(g.upper)})}</li>
          </ul>`;
    h += safeT('formula');
    h += `<div class="formula-container">${label} = u<span class="sub">m</span> + ${frac(`${k}N/4 - C`, 'n<span class="sub">m</span>')} &times; h</div>`;
    h += safeT('substitute');
    h += `<div class="formula-container">${label} = ${fmtInternal(g.lower)} + ${frac(`${pos} - ${prevCf}`, n_m)} &times; ${fmtInternal(h_val)} = <strong>${fmtInternal(r.s[id])}</strong></div>`;
    return h;
}

// --- KHÔI PHỤC ĐỊNH DẠNG HIỂN THỊ CŨ CHO CÁC CHỈ SỐ KHÁC ---
function generateMeanCalcOld(r, groups) {
    let h = `<p>${safeT('mean_formula_desc')}</p>`;
    h += `<p class="font-bold mt-4">${safeT('formula_title')}</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
            x̄ = (n₁c₁ + n₂c₂ + ... + nₖcₖ) / N
          </div>`;
    h += `<p class="font-bold mt-4">${safeT('substitute_title')}</p>`;
    let sumStr = r.gStats.map((g, i) => `(${g.freq} × ${fmtInternal(groups[i].midpoint)})`).join(' + ');
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
            x̄ = (${sumStr}) / ${r.s.N}
          </div>`;
    h += `<p class="text-xl mt-4">${safeT('result_title')} <strong>x̄ = ${fmtInternal(r.s.mean)}</strong></p>`;
    return h;
}

// Ensure t() is available even if translations are not yet loaded
const originalT = typeof t === 'function' ? t : (k) => k;
function safeT(key, vars = {}) {
    if (typeof t === 'function') return t(key, vars);
    return key;
}

function generateModeCalcOld(r, groups) {
    let maxF = -1, idx = -1;
    r.gStats.forEach((g, i) => { if(g.freq > maxF) { maxF = g.freq; idx = i; } });
    const g = groups[idx];
    const np = idx > 0 ? r.gStats[idx-1].freq : 0;
    const nn = idx < r.gStats.length - 1 ? r.gStats[idx+1].freq : 0;
    const h_val = g.upper - g.lower;
    
    let h = `<p>${safeT('mode_desc')}</p>`;
    h += `<p class="mt-2">${safeT('mode_group_desc', {idx: idx+1, lower: fmtInternal(g.lower), upper: fmtInternal(g.upper), freq: maxF})}</p>`;
    h += `<p class="font-bold mt-4">${safeT('formula_title')}</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
            Mo = uₒ + [ (nₒ - nₒ₋₁) / ((nₒ - nₒ₋₁) + (nₒ - nₒ₊₁)) ] × h
          </div>`;
    h += `<p class="font-bold mt-4">${safeT('substitute_title')}</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
            Mo = ${fmtInternal(g.lower)} + [ (${maxF} - ${np}) / ((${maxF} - ${np}) + (${maxF} - ${nn})) ] × ${fmtInternal(h_val)}
          </div>`;
    h += `<p class="text-xl mt-4">${safeT('result_title')} <strong>Mo = ${fmtInternal(r.s.mode)}</strong></p>`;
    return h;
}

function generateVarianceSDCalcOld(id, r, groups) {
    let h = `<p>${safeT('variance_desc')}</p>`;
    h += `<p class="font-bold mt-4">${safeT('formula_title')} ${safeT('variance')}:</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
            s² = [ n₁(c₁ - x̄)² + n₂(c₂ - x̄)² + ... + nₖ(cₖ - x̄)² ] / N
          </div>`;
    h += `<p class="mt-4">${safeT('variance_sd_desc', {mean: fmtInternal(r.s.mean), n: r.s.N})}</p>`;
    h += `<p class="font-bold mt-4">${safeT('substitute_title')}</p>`;
    let sumStr = r.gStats.map((g, i) => `(${g.freq} × (${fmtInternal(groups[i].midpoint)} - ${fmtInternal(r.s.mean)})²)`).join(' + ');
    if (sumStr.length > 300) sumStr = sumStr.substring(0, 300) + "...";
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
            s² = [ ${sumStr} ] / ${r.s.N}
          </div>`;
    h += `<p class="text-xl mt-4">${safeT('result_title')} ${safeT('variance')}: <strong>s² = ${fmtInternal(r.s.variance)}</strong></p>`;
    
    if(id === 'sd') {
        h += `<div class="mt-6 pt-6 border-t border-slate-100">`;
        h += `<p>${safeT('sd_desc')}</p>`;
        h += `<p class="font-bold mt-4">${safeT('formula_title')}</p>`;
        h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
                s = √s²
              </div>`;
        h += `<p class="text-xl mt-4">${safeT('result_title')} ${safeT('sd')}: <strong>s = √${fmtInternal(r.s.variance)} = ${fmtInternal(r.s.sd)}</strong></p>`;
        h += `</div>`;
    }
    return h;
}

function generateRangeCalcOld(r, groups) {
    let h = `<p>${safeT('range_raw_desc')}</p>`;
    h += `<p class="font-bold mt-4">${safeT('formula_title')}</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
            R = xₘₐₓ - xₘᵢₙ
          </div>`;
    
    if(r.rawData && r.rawData.length){
        const min = Math.min(...r.rawData), max = Math.max(...r.rawData);
        h += `<p class="font-bold mt-4">${safeT('substitute_title')}</p>`;
        h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
                R = ${fmtInternal(max)} - ${fmtInternal(min)}
              </div>`;
    } else {
        h += `<p class="mt-4 italic text-slate-500">${safeT('range_grouped_desc')}</p>`;
        h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
                R ≈ ${fmtInternal(groups[groups.length-1].upper)} - ${fmtInternal(groups[0].lower)}
              </div>`;
    }
    h += `<p class="text-xl mt-4">${safeT('result_title')} <strong>R = ${fmtInternal(r.s.range)}</strong></p>`;
    return h;
}

function generateIQRCalcOld(r, groups) {
    let h = `<p>${safeT('iqr_desc')}</p>`;
    h += `<p class="font-bold mt-4">${safeT('formula_title')}</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
            IQR = Q₃ - Q₁
          </div>`;
    h += `<p class="font-bold mt-4">${safeT('substitute_title')}</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
            IQR = ${fmtInternal(r.s.q3)} - ${fmtInternal(r.s.q1)}
          </div>`;
    h += `<p class="text-xl mt-4">${safeT('result_title')} <strong>IQR = ${fmtInternal(r.s.iqr)}</strong></p>`;
    return h;
}

function generateCVCalcOld(r, groups) {
    let h = `<p>${safeT('cv_desc')}</p>`;
    h += `<p class="font-bold mt-4">${safeT('formula_title')}</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif text-xl">
            CV = (s / |x̄|) × 100%
          </div>`;
    h += `<p class="font-bold mt-4">${safeT('substitute_title')}</p>`;
    h += `<div class="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 text-center font-serif">
            CV = (${fmtInternal(r.s.sd)} / ${fmtInternal(Math.abs(r.s.mean))}) × 100%
          </div>`;
    h += `<p class="text-xl mt-4">${safeT('result_title')} <strong>CV = ${fmtInternal(r.s.cv)}%</strong></p>`;
    return h;
}
