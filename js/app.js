/**
 * 应用入口 - 初始化、存储、主逻辑
 */

// ===== 全局状态变量 =====
let markersData = [];

// ===== 初始化函数 =====
function init() {
    // 初始化地图
    initMap();

    // 从本地存储加载数据
    loadFromStorage();

    // 渲染UI
    renderRecommendedTags();
    renderPlacesList();

    // 初始化备忘录
    initMemo();

    // 初始化事件绑定
    initRecToggle();
    initAddAllBtn();
    initClearAllBtn();
    initSearch();
    initTravelModeTabs();
    initPlanBtn();
}

// ===== 存储函数 =====

/**
 * 保存数据到本地存储
 */
function saveToStorage() {
    localStorage.setItem('nagoya_places', JSON.stringify(markersData));
}

/**
 * 从本地存储加载数据
 */
function loadFromStorage() {
    const saved = localStorage.getItem('nagoya_places');
    if (saved) {
        markersData = JSON.parse(saved);
        markersData.forEach((p, i) => {
            addedIds.add(p.placeId);
            addMarker(p, i + 1);
        });
    }
    updateButtons();
    if (markersData.length > 0) {
        fitBounds();
    }
}

// ===== 页面加载完成后初始化 =====
document.addEventListener('DOMContentLoaded', init);

// 挂载到window对象（供其他模块使用）
window.markersData = markersData;
window.init = init;
window.saveToStorage = saveToStorage;
window.loadFromStorage = loadFromStorage;
