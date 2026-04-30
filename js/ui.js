/**
 * UI模块 - UI渲染、事件绑定相关
 */

// ===== 全局变量 =====

// 已添加地点的ID集合
let addedIds = new Set();

// 拖拽源索引
let dragSrcIdx = null;

// 美食ID计数器
let globalFoodId = 1000;

// ===== DOM元素 =====
const placesList = document.getElementById('placesList');
const emptyState = document.getElementById('emptyState');
const clearAllBtn = document.getElementById('clearAllBtn');
const planBtn = document.getElementById('planBtn');
const routePanel = document.getElementById('routePanel');
const routeSegments = document.getElementById('routeSegments');
const totalFee = document.getElementById('totalFee');
const totalFeeRmb = document.getElementById('totalFeeRmb');
const totalTime = document.getElementById('totalTime');
const feeBreakdown = document.getElementById('feeBreakdown');
const toast = document.getElementById('toast');
const recommendedTags = document.getElementById('recommendedTags');
const addAllBtn = document.getElementById('addAllBtn');
const memoTextarea = document.getElementById('memoTextarea');

// ===== Toast提示 =====
function showToast(msg, dur = 2500) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), dur);
}

// ===== 渲染推荐地点标签 =====
function renderRecommendedTags() {
    recommendedTags.innerHTML = '';

    RECOMMENDED_PLACES.forEach(p => {
        const tag = document.createElement('div');
        tag.className = 'recommended-tag' + (addedIds.has(p.id) ? ' added' : '');
        tag.innerHTML = `<span>${p.icon}</span><span>${p.name}</span>${p.star ? '<span class="star">⭐</span>' : ''}`;

        tag.onclick = () => {
            if (addedIds.has(p.id)) {
                showToast(`${p.name} 已添加`);
                return;
            }
            if (p.transportTip) {
                showToast(p.transportTip, 4000);
            }
            addRecommendedPlace(p);
        };

        recommendedTags.appendChild(tag);
    });
}

// ===== 逛吃推荐收起/展开 =====
function initRecToggle() {
    const recToggle = document.getElementById('recToggle');
    const tags = document.getElementById('recommendedTags');

    recToggle.onclick = () => {
        recToggle.classList.toggle('collapsed');
        tags.classList.toggle('collapsed');
    };
}

// ===== 添加推荐地点 =====
function addRecommendedPlace(p) {
    const data = {
        id: Date.now(),
        placeId: p.id,
        name: p.name,
        nameJp: p.nameJp,
        lat: p.lat,
        lng: p.lng,
        notes: '',
        foods: PRESET_FOOD[p.id] ? JSON.parse(JSON.stringify(PRESET_FOOD[p.id])) : []
    };

    markersData.push(data);
    addedIds.add(p.id);
    addMarker(data, markersData.length);
    saveToStorage();
    renderPlacesList();
    renderRecommendedTags();
    updateButtons();
    fitBounds();
    showToast(`已添加：${p.name}`);
}

// ===== 一键添加全部 =====
function initAddAllBtn() {
    addAllBtn.onclick = () => {
        let cnt = 0;
        RECOMMENDED_PLACES.forEach(p => {
            if (!addedIds.has(p.id)) {
                const data = {
                    id: Date.now() + cnt,
                    placeId: p.id,
                    name: p.name,
                    nameJp: p.nameJp,
                    lat: p.lat,
                    lng: p.lng,
                    notes: '',
                    foods: PRESET_FOOD[p.id] ? JSON.parse(JSON.stringify(PRESET_FOOD[p.id])) : []
                };
                markersData.push(data);
                addedIds.add(p.id);
                addMarker(data, markersData.length);
                cnt++;
            }
        });

        if (cnt > 0) {
            saveToStorage();
            renderPlacesList();
            renderRecommendedTags();
            updateButtons();
            fitBounds();
            showToast(`已添加 ${cnt} 个地点！`);
        } else {
            showToast('全部已添加');
        }
    };
}

// ===== 渲染地点列表 =====
function renderPlacesList() {
    if (markersData.length === 0) {
        emptyState.style.display = 'block';
        clearAllBtn.style.display = 'none';
        placesList.querySelectorAll('.place-card').forEach(el => el.remove());
        return;
    }

    emptyState.style.display = 'none';
    clearAllBtn.style.display = 'block';
    placesList.querySelectorAll('.place-card').forEach(el => el.remove());

    markersData.forEach((p, i) => {
        const card = createPlaceCard(p, i);
        placesList.appendChild(card);
    });
}

// ===== 创建地点卡片 =====
function createPlaceCard(p, idx) {
    const card = document.createElement('div');
    card.className = 'place-card';
    card.dataset.index = idx;
    card.draggable = true;

    const foodsHtml = (p.foods || []).map(f => createFoodCardHtml(f)).join('');
    const hasFoods = (p.foods || []).length > 0;

    card.innerHTML = `
        <div class="place-card-header">
            <div class="place-number">${idx + 1}</div>
            <div class="place-info">
                <input type="text" class="place-name-input" value="${p.name}" data-field="name">
                <div class="place-address">${p.nameJp || ''}</div>
            </div>
            <div class="place-actions">
                <button class="place-action-btn expand-btn" title="展开/收起">▼</button>
                <button class="place-action-btn delete" title="删除">✕</button>
            </div>
        </div>
        <div class="place-details">
            <div class="place-notes">
                <label>📝 备注文本</label>
                <textarea placeholder="记录这个地点的备注信息..." data-field="notes">${p.notes || ''}</textarea>
            </div>
            <div class="nearby-food">
                <div class="nearby-food-title">
                    <span>🍜 附近美食推荐</span>
                    <button class="add-food-btn" data-action="add-food">➕ 添加美食</button>
                </div>
                <div class="food-list">
                    ${hasFoods ? foodsHtml : '<div class="food-placeholder">暂无美食推荐，点击添加</div>'}
                </div>
            </div>
        </div>
    `;

    // 展开/收起
    card.querySelector('.expand-btn').onclick = () => {
        card.classList.toggle('expanded');
    };

    // 删除
    card.querySelector('.delete').onclick = () => {
        removeMarker(idx);
        if (p.placeId) addedIds.delete(p.placeId);
        markersData.splice(idx, 1);
        updateMarkers();
        saveToStorage();
        renderPlacesList();
        renderRecommendedTags();
        updateButtons();
        clearRoutes();
        showToast(`已删除：${p.name}`);
    };

    // 输入事件
    card.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('change', () => {
            const field = el.dataset.field;
            if (field === 'lat' || field === 'lng') {
                p[field] = parseFloat(el.value);
            } else {
                p[field] = el.value;
            }
            updateMarkers();
            saveToStorage();
        });
    });

    // 添加美食
    card.querySelector('[data-action="add-food"]').onclick = () => addFood(p, card);

    // 美食卡片事件
    card.querySelectorAll('.food-card').forEach(fc => {
        const fid = fc.dataset.foodId;
        const food = p.foods.find(f => f.id === fid);
        if (!food) return;

        fc.querySelector('.food-action-btn.delete').onclick = () => {
            p.foods = p.foods.filter(f => f.id !== fid);
            saveToStorage();
            renderPlacesList();
        };

        fc.querySelectorAll('input, textarea, select').forEach(el => {
            el.addEventListener('change', () => {
                if (el.dataset.f === 'reservation') food.reservation = el.checked;
                else if (el.dataset.f === 'resDays') food.resDays = el.value;
                else food[el.dataset.f] = el.value;
                saveToStorage();
            });
        });
    });

    // 拖拽事件
    initDragEvents(card, idx);

    return card;
}

// ===== 初始化拖拽事件 =====
function initDragEvents(card, idx) {
    card.addEventListener('dragstart', e => {
        dragSrcIdx = idx;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => card.classList.remove('dragging'));

    card.addEventListener('dragover', e => {
        e.preventDefault();
        const target = e.target.closest('.place-card');
        if (target && target !== card) target.classList.add('drag-over');
    });

    card.addEventListener('dragleave', e => {
        const target = e.target.closest('.place-card');
        if (target) target.classList.remove('drag-over');
    });

    card.addEventListener('drop', e => {
        e.preventDefault();
        const target = e.target.closest('.place-card');
        if (!target || target === card) return;

        const dstIdx = parseInt(target.dataset.index);
        const tmp = markersData[dragSrcIdx];
        markersData[dragSrcIdx] = markersData[dstIdx];
        markersData[dstIdx] = tmp;

        updateMarkers();
        saveToStorage();
        renderPlacesList();
        target.classList.remove('drag-over');
    });
}

// ===== 添加美食 =====
function addFood(place, card) {
    const food = {
        id: 'f' + (globalFoodId++),
        name: '',
        dish: '',
        hours: '',
        closed: '',
        reservation: false,
        resDays: 0,
        price: '',
        notes: '',
        isPreset: false
    };

    place.foods.push(food);
    saveToStorage();

    const list = card.querySelector('.food-list');
    list.innerHTML = place.foods.map(f => createFoodCardHtml(f)).join('');
    list.querySelector('.food-placeholder')?.remove();

    // 绑定新美食事件
    const fc = list.querySelector(`[data-food-id="${food.id}"]`);
    fc.querySelector('.food-action-btn.delete').onclick = () => {
        place.foods = place.foods.filter(f => f.id !== food.id);
        saveToStorage();
        renderPlacesList();
    };

    fc.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('change', () => {
            if (el.dataset.f === 'reservation') food.reservation = el.checked;
            else if (el.dataset.f === 'resDays') food.resDays = el.value;
            else food[el.dataset.f] = el.value;
            saveToStorage();
        });
    });

    saveToStorage();
}

// ===== 创建美食卡片HTML =====
function createFoodCardHtml(f) {
    return `
        <div class="food-card" data-food-id="${f.id}">
            <div class="food-card-header">
                <input type="text" class="food-name-input" value="${f.name}" data-f="name" placeholder="店名">
                <div class="food-tags">
                    ${f.reservation ? `<span class="food-tag reservation">⚠️ 需预约${f.resDays ? `·提前${f.resDays}天` : ''}</span>` : ''}
                    ${f.closed ? `<span class="food-tag closed">休:${f.closed}</span>` : ''}
                </div>
            </div>
            <div class="food-detail">
                <div class="food-detail-item">
                    <span class="food-detail-label">招牌:</span>
                    <input type="text" value="${f.dish}" data-f="dish" placeholder="推荐菜">
                </div>
                <div class="food-detail-item">
                    <span class="food-detail-label">人均:</span>
                    <input type="text" value="${f.price}" data-f="price" placeholder="¥0">
                </div>
                <div class="food-detail-item">
                    <span class="food-detail-label">营业:</span>
                    <input type="text" value="${f.hours}" data-f="hours" placeholder="时间">
                </div>
                <div class="food-detail-item">
                    <span class="food-detail-label">定休:</span>
                    <input type="text" value="${f.closed}" data-f="closed" placeholder="周几">
                </div>
                <div class="food-detail-item">
                    <label style="display:flex;align-items:center;gap:4px;font-size:0.72rem;">
                        <input type="checkbox" ${f.reservation ? 'checked' : ''} data-f="reservation">
                        需预约
                    </label>
                </div>
                <div class="food-detail-item">
                    <span class="food-detail-label">提前:</span>
                    <input type="text" value="${f.resDays}" data-f="resDays" placeholder="天数">
                </div>
            </div>
            <textarea class="food-notes" data-f="notes" placeholder="备注：排队很长、只收现金等...">${f.notes || ''}</textarea>
            <div class="food-actions">
                <button class="food-action-btn delete">删除</button>
            </div>
        </div>
    `;
}

// ===== 更新按钮状态 =====
function updateButtons() {
    planBtn.disabled = markersData.length < 2;
    planBtn.querySelector('.btn-text').textContent = markersData.length < 2 ? '🚗 添加至少2个地点' : '🚗 规划路线';
}

// ===== 清空全部 =====
function initClearAllBtn() {
    clearAllBtn.onclick = () => {
        clearAllMarkers();
        markersData = [];
        addedIds.clear();
        localStorage.removeItem('nagoya_places');
        renderPlacesList();
        renderRecommendedTags();
        updateButtons();
        clearRoutes();
        showToast('已清空');
    };
}

// ===== 备忘录初始化 =====
function initMemo() {
    memoTextarea.value = localStorage.getItem('nagoya_memo') || '';

    memoTextarea.addEventListener('input', () => {
        localStorage.setItem('nagoya_memo', memoTextarea.value);
    });
}

// ===== 出行方式切换 =====
function initTravelModeTabs() {
    document.querySelectorAll('.travel-mode-tab').forEach(tab => {
        tab.onclick = () => {
            switchTravelMode(tab.dataset.mode);
        };
    });
}

// ===== 规划按钮 =====
function initPlanBtn() {
    planBtn.onclick = planRoute;
}

// 挂载到window对象（供其他模块使用）
window.addedIds = addedIds;
window.globalFoodId = globalFoodId;
window.showToast = showToast;
window.renderRecommendedTags = renderRecommendedTags;
window.initRecToggle = initRecToggle;
window.addRecommendedPlace = addRecommendedPlace;
window.initAddAllBtn = initAddAllBtn;
window.renderPlacesList = renderPlacesList;
window.createPlaceCard = createPlaceCard;
window.addFood = addFood;
window.createFoodCardHtml = createFoodCardHtml;
window.updateButtons = updateButtons;
window.initClearAllBtn = initClearAllBtn;
window.initMemo = initMemo;
window.initTravelModeTabs = initTravelModeTabs;
window.initPlanBtn = initPlanBtn;
