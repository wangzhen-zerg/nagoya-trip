/**
 * 搜索模块 - 本地搜索和在线搜索功能
 */

// ===== DOM元素 =====
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// ===== 搜索定时器 =====
let searchTimer = null;

// ===== 搜索输入事件 =====
function initSearch() {
    searchInput.addEventListener('input', () => {
        const keyword = searchInput.value.trim();

        if (searchTimer) clearTimeout(searchTimer);

        if (keyword.length < 1) {
            closeSearch();
            return;
        }

        // 先展示本地匹配结果
        const localResults = searchLocal(keyword);
        if (localResults.length > 0) {
            renderSearchResults(localResults, true);
            searchResults.classList.add('active');
        }

        // 再异步请求在线搜索
        searchTimer = setTimeout(() => searchOnline(keyword), 600);
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 1 && searchResults.children.length > 0) {
            searchResults.classList.add('active');
        }
    });
}

// ===== 本地搜索：匹配预设地点 =====
function searchLocal(keyword) {
    const lower = keyword.toLowerCase();
    return RECOMMENDED_PLACES.filter(p => {
        return p.name.toLowerCase().includes(lower) ||
               p.nameJp.toLowerCase().includes(lower) ||
               p.desc.toLowerCase().includes(lower);
    }).map(p => ({
        lat: p.lat,
        lon: p.lng,
        name: p.name,
        address: p.nameJp + ' · ' + p.desc,
        placeId: p.id,
        isLocal: true
    }));
}

// ===== 在线搜索：使用 Photon API 和 Nominatim =====
async function searchOnline(keyword) {
    const localResults = searchLocal(keyword);
    let onlineResults = [];

    // 尝试 Photon API (komoot)
    try {
        const response = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(keyword)}&limit=6&lang=ja`,
            { signal: AbortSignal.timeout(5000) }
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            onlineResults = data.features.map(f => ({
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                name: (f.properties.name || f.properties.street || '').split(',')[0],
                address: [f.properties.city, f.properties.state, f.properties.country].filter(Boolean).join(', '),
                isLocal: false
            })).filter(r => r.name);
        }
    } catch (e) {
        console.warn('Photon search failed, trying Nominatim...', e);

        // 尝试 Nominatim 作为备选
        try {
            const response2 = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword)}&format=json&limit=6&accept-language=ja,en,zh`,
                {
                    headers: { 'User-Agent': 'NagoyaTripPlanner/1.0' },
                    signal: AbortSignal.timeout(5000)
                }
            );
            const data2 = await response2.json();

            if (data2.length > 0) {
                onlineResults = data2.map(p => ({
                    lat: p.lat,
                    lon: p.lon,
                    name: p.display_name.split(',')[0],
                    address: p.display_name.replace(/^[^,]+,/, '').slice(0, 60),
                    isLocal: false
                }));
            }
        } catch (e2) {
            console.warn('Nominatim also failed', e2);
        }
    }

    // 合并结果：本地在前，去重
    const allResults = [...localResults];
    const localNames = new Set(localResults.map(r => r.name));
    onlineResults.forEach(r => {
        if (!localNames.has(r.name)) allResults.push(r);
    });

    if (allResults.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item"><div class="search-result-name">未找到结果，试试日语或英语关键词</div></div>';
    } else {
        renderSearchResults(allResults, false);
    }
    searchResults.classList.add('active');
}

// ===== 渲染搜索结果 =====
function renderSearchResults(results, isLocalOnly) {
    searchResults.innerHTML = '';

    results.forEach(r => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `<div class="search-result-name">${r.isLocal ? '⭐ ' : ''}${r.name}</div><div class="search-result-address">${r.address || ''}</div>`;

        item.addEventListener('click', () => {
            if (r.isLocal && r.placeId && !addedIds.has(r.placeId)) {
                // 从预设添加
                const place = RECOMMENDED_PLACES.find(p => p.id === r.placeId);
                if (place) addRecommendedPlace(place);
            } else if (!r.isLocal) {
                addSearchResult(r.lat, r.lon, r.name, r.address);
            } else {
                showToast('该地点已添加');
            }
            closeSearch();
            searchInput.value = '';
        });

        searchResults.appendChild(item);
    });

    if (!isLocalOnly) searchResults.classList.add('active');
}

// ===== 添加搜索结果地点 =====
function addSearchResult(lat, lng, name, address) {
    const data = {
        id: Date.now(),
        name: name,
        nameJp: name,
        address: address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        notes: '',
        foods: [],
        placeId: null
    };

    markersData.push(data);
    addMarker(data, markersData.length);
    saveToStorage();
    renderPlacesList();
    updateButtons();
    fitBounds();
    closeSearch();
    searchInput.value = '';
    showToast(`已添加：${name}`);
}

// ===== 关闭搜索结果 =====
function closeSearch() {
    searchResults.classList.remove('active');
}

// 挂载到window对象
window.initSearch = initSearch;
window.searchLocal = searchLocal;
window.searchOnline = searchOnline;
window.renderSearchResults = renderSearchResults;
window.addSearchResult = addSearchResult;
window.closeSearch = closeSearch;
