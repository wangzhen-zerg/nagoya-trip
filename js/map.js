/**
 * 地图模块 - 地图初始化、标记、路线规划相关
 */

// ===== 全局变量 =====

// 地图实例
let map = null;

// 标记数组
let markers = [];

// 路线图层数组
let routeLayers = [];

// 路线规划模式（driving/walking/bus）
let currentMode = 'driving';

// ===== 地图初始化 =====
function initMap() {
    map = L.map('map', {
        center: NAGOYA_CENTER,
        zoom: 12,
        zoomControl: true
    });

    // 添加OpenStreetMap图层
    L.tileLayer('https://tile.openstreetmap.jp/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // 点击地图关闭搜索结果
    map.on('click', () => {
        if (typeof closeSearch === 'function') {
            closeSearch();
        }
    });

    return map;
}

// ===== 添加标记 =====
function addMarker(p, idx) {
    // 创建自定义图标
    const icon = L.divIcon({
        className: 'mi',
        html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:#BC002D;border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 4px rgba(0,0,0,0.3);"><span style="transform:rotate(45deg);color:white;font-weight:bold;font-size:11px;">${idx}</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
    });

    // 添加标记
    const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${p.name}</strong>`);

    markers.push(marker);
    return marker;
}

// ===== 更新所有标记 =====
function updateMarkers() {
    markers.forEach((m, i) => {
        const p = markersData[i];
        if (!p) return;

        // 更新位置
        m.setLatLng([p.lat, p.lng]);
        m.setPopupContent(`<strong>${p.name}</strong>`);

        // 更新图标序号
        const icon = L.divIcon({
            className: 'mi',
            html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:#BC002D;border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 4px rgba(0,0,0,0.3);"><span style="transform:rotate(45deg);color:white;font-weight:bold;font-size:11px;">${i + 1}</span></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -28]
        });
        m.setIcon(icon);
    });
}

// ===== 调整视图以显示所有标记 =====
function fitBounds() {
    if (markersData.length > 0) {
        const bounds = L.latLngBounds(markersData.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// ===== 删除标记 =====
function removeMarker(idx) {
    if (markers[idx]) {
        map.removeLayer(markers[idx]);
        markers.splice(idx, 1);
    }
}

// ===== 清空所有标记 =====
function clearAllMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
}

// ===== 规划路线 =====
function planRoute() {
    if (markersData.length < 2) {
        showToast('至少需要2个地点才能规划路线');
        return;
    }

    planBtn.classList.add('loading');
    clearRoutes();

    if (currentMode === 'bus') {
        handleBus();
        return;
    }

    // 构建OSRM路由请求
    const pts = markersData.map(p => [p.lng, p.lat]).join(';');
    const profile = currentMode === 'driving' ? 'driving' : 'foot';
    const url = `https://router.project-osrm.org/route/v1/${profile}/${pts}?overview=full&geometries=geojson`;

    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (data.routes && data.routes[0]) {
                displayRoute(data.routes[0]);
            } else {
                showToast('未找到路线');
            }
        })
        .catch(() => showToast('路线规划失败'))
        .finally(() => planBtn.classList.remove('loading'));
}

// ===== 显示路线 =====
function displayRoute(route) {
    const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);

    // 根据出行方式设置路线颜色
    const lineColor = currentMode === 'driving' ? '#3B82F6' : '#10B981';

    // 绘制路线
    const polyline = L.polyline(coords, {
        color: lineColor,
        weight: 5,
        opacity: 0.8
    }).addTo(map);
    routeLayers.push(polyline);

    // 计算距离和时间
    const dist = route.distance;
    const dur = route.duration;
    const distKm = (dist / 1000).toFixed(1);
    const h = Math.floor(dur / 3600);
    const m = Math.floor((dur % 3600) / 60);
    const timeStr = h > 0 ? `${h}小时${m}分钟` : `${m}分钟`;

    // 计算费用
    let fee = 0;
    let feeDetail = '';
    if (currentMode === 'driving') {
        const highwayFee = Math.round(distKm * JP_COSTS.highwayRate);
        const gasFee = Math.round(distKm * JP_COSTS.fuelConsumption * JP_COSTS.gasPrice);
        fee = highwayFee + gasFee;
        feeDetail = `<div class="fee-item"><span>高速费</span><span>¥${highwayFee} (约¥${(highwayFee * JPY_TO_CNY).toFixed(1)})</span></div>
                     <div class="fee-item"><span>油费</span><span>¥${gasFee} (约¥${(gasFee * JPY_TO_CNY).toFixed(1)})</span></div>`;
    }

    // 更新UI
    routePanel.classList.add('expanded');
    totalFee.textContent = fee > 0 ? `¥${fee}` : '¥0';
    totalFeeRmb.textContent = fee > 0 ? `约¥${(fee * JPY_TO_CNY).toFixed(1)}人民币` : '';
    totalTime.textContent = timeStr;

    // 渲染路线段
    routeSegments.innerHTML = `
        <div class="route-segment">
            <span class="segment-icon">📍</span>
            <div class="segment-info">
                <div class="segment-route">${markersData[0].name} → ${markersData[markersData.length - 1].name}</div>
                <div class="segment-detail">⏱️ ${timeStr} · 📏 ${distKm}km</div>
            </div>
            ${fee > 0 ? `<span class="segment-fee">¥${fee}</span>` : ''}
        </div>
        ${markersData.length > 2 ? `<div class="route-segment" style="background:rgba(59,130,246,0.1);">
            <span class="segment-icon">🚏</span>
            <div class="segment-info">
                <div class="segment-route">途经 ${markersData.length - 2} 个地点</div>
                <div class="segment-detail">${markersData.slice(1, -1).map(p => `• ${p.name}`).join(' ')}</div>
            </div>
        </div>` : ''}
    `;

    // 渲染费用明细
    feeBreakdown.innerHTML = fee > 0 ? `
        <div class="fee-breakdown-title">💰 费用明细</div>
        ${feeDetail}
        <div class="fee-item" style="border-top:1px dashed rgba(5,150,105,0.3);padding-top:6px;margin-top:4px;font-weight:600;">
            <span>合计</span><span>¥${fee} (约¥${(fee * JPY_TO_CNY).toFixed(1)})</span>
        </div>
    ` : '';

    // 调整视图
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
}

// ===== 公交模式处理 =====
function handleBus() {
    planBtn.classList.remove('loading');
    routePanel.classList.add('expanded');

    // 生成Google Maps公交路线链接
    const mapsUrl = generateGoogleMapsTransitUrl();
    
    // 生成Yahoo乗換案内链接
    const yahooUrl = generateYahooTransitUrl();
    
    // 计算预估费用
    const feeInfo = calculateBusFee();
    
    totalFee.textContent = feeInfo.total > 0 ? `¥${feeInfo.total}` : '¥--';
    totalFeeRmb.textContent = feeInfo.total > 0 ? `约¥${(feeInfo.total * JPY_TO_CNY).toFixed(0)}人民币` : '含多段换乘';
    totalTime.textContent = feeInfo.estimatedTime || '--';

    // 渲染路线段
    routeSegments.innerHTML = `
        <div class="route-segment" style="background:rgba(234,88,12,0.1);">
            <span class="segment-icon">🚌</span>
            <div class="segment-info">
                <div class="segment-route">${markersData[0].name} → ${markersData[markersData.length - 1].name}</div>
                <div class="segment-detail">${markersData.length > 2 ? `途经 ${markersData.length - 2} 个地点 · ` : ''}公交/地铁换乘</div>
            </div>
        </div>
        ${feeInfo.segments.length > 0 ? feeInfo.segments.map(seg => `
            <div class="route-segment" style="background:rgba(234,88,12,0.05);">
                <span class="segment-icon">${seg.icon}</span>
                <div class="segment-info">
                    <div class="segment-route">${seg.route}</div>
                    <div class="segment-detail">${seg.detail}</div>
                </div>
                <span class="segment-fee">¥${seg.fee}</span>
            </div>
        `).join('') : ''}
    `;

    // 费用明细区显示Google Maps按钮
    feeBreakdown.innerHTML = `
        <div class="fee-breakdown-title">🚇 公交路线查询</div>
        <div class="bus-fee-summary">
            <div class="fee-item"><span>地铁/电车</span><span>¥${feeInfo.subway || 0}</span></div>
            ${feeInfo.meitetsu > 0 ? `<div class="fee-item"><span>名铁线</span><span>¥${feeInfo.meitetsu}</span></div>` : ''}
            ${feeInfo.linimo > 0 ? `<div class="fee-item"><span>Linimo线</span><span>¥${feeInfo.linimo}</span></div>` : ''}
            <div class="fee-item" style="border-top:1px dashed rgba(234,88,12,0.3);padding-top:6px;margin-top:4px;font-weight:600;">
                <span>预估合计</span><span>¥${feeInfo.total}</span>
            </div>
        </div>
        <div class="transit-links">
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="transit-link-btn google-maps">
                <span>📱</span> 在 Google Maps 查看
            </a>
            <a href="${yahooUrl}" target="_blank" rel="noopener noreferrer" class="transit-link-btn yahoo-transit">
                <span>🗾</span> Yahoo乗換案内
            </a>
        </div>
    `;

    // 绘制简单连线
    if (markersData.length >= 2) {
        const pts = markersData.map(p => [p.lat, p.lng]);
        const polyline = L.polyline(pts, {
            color: '#EA580C',
            weight: 3,
            opacity: 0.6,
            dashArray: '8,8'
        }).addTo(map);
        routeLayers.push(polyline);
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
}

// ===== 生成Google Maps公交路线URL =====
function generateGoogleMapsTransitUrl() {
    if (markersData.length === 0) return 'https://www.google.com/maps';
    
    // 格式: https://www.google.com/maps/dir/lat1,lng1/lat2,lng2/.../@zoom,data=!3e3
    const waypoints = markersData.map(p => `${p.lat},${p.lng}`).join('/');
    // !3e3 = 公共交通模式
    return `https://www.google.com/maps/dir/${waypoints}/@35.1,136.9,10z/data=!3e3`;
}

// ===== 生成Yahoo乗換案内URL =====
function generateYahooTransitUrl() {
    if (markersData.length < 2) return 'https://transit.yahoo.co.jp';
    
    // 搜索起点和终点的换乘方案
    const from = encodeURIComponent(markersData[0].name);
    const to = encodeURIComponent(markersData[markersData.length - 1].name);
    return `https://transit.yahoo.co.jp/search/result?from=${from}&to=${to}`;
}

// ===== 计算公交预估费用 =====
function calculateBusFee() {
    const result = {
        segments: [],
        subway: 0,
        meitetsu: 0,
        linimo: 0,
        total: 0,
        estimatedTime: ''
    };
    
    if (markersData.length < 2) return result;
    
    let totalTime = 0;
    
    // 分析每段路线的交通类型和费用
    for (let i = 0; i < markersData.length - 1; i++) {
        const from = markersData[i];
        const to = markersData[i + 1];
        const segResult = analyzeSegment(from, to);
        
        result.segments.push(segResult.segment);
        
        // 累计费用
        if (segResult.type === 'meitetsu') {
            result.meitetsu += segResult.fee;
        } else if (segResult.type === 'linimo') {
            result.linimo += segResult.fee;
        } else {
            result.subway += segResult.fee;
        }
        
        totalTime += segResult.duration;
    }
    
    // 计算总费用（名古屋地铁按段计费，其他累加）
    result.subway = result.subway > 0 ? Math.max(230, result.subway) : 0;
    result.total = result.subway + result.meitetsu + result.linimo;
    
    // 估算总时间
    const h = Math.floor(totalTime / 60);
    const m = Math.round(totalTime % 60);
    result.estimatedTime = h > 0 ? `约${h}小时${m}分钟` : `约${m}分钟`;
    
    return result;
}

// ===== 分析单段路线的交通类型 =====
function analyzeSegment(from, to) {
    const lat1 = from.lat, lng1 = from.lng;
    const lat2 = to.lat, lng2 = to.lng;
    
    // 计算直线距离（km）
    const dist = getDistance(lat1, lng1, lat2, lng2);
    const duration = Math.round(dist / 30 * 60); // 按30km/h估算
    
    // 检测是否是名铁常滑线区域（从名古屋往南到常滑）
    const isMeitetsuTokoname = (
        (lat1 > 35.1 && lat2 < 35.0 && lng1 > 136.85 && lng2 < 136.85) ||
        (from.name.includes('常滑') || to.name.includes('常滑') || from.name.includes('中部国際空港') || to.name.includes('中部国際空港'))
    );
    
    // 检测是否是Linimo线（东山线藤が丘到吉卜力公园/丰田博物馆）
    const isLinimo = (
        (from.name.includes('藤') || to.name.includes('藤')) &&
        (from.name.includes('ジブリ') || to.name.includes('ジブリ') || 
         from.name.includes('トヨタ') || to.name.includes('トヨタ') ||
         from.name.includes('愛・地球博') || to.name.includes('愛・地球博'))
    );
    
    // 名铁机场线检测
    const isAirportLine = (
        (from.name.includes('中部国際空港') || to.name.includes('中部国際空港') || 
         from.name.includes('中部国際空港') || to.name.includes('中部国際空港')) &&
        (from.name.includes('名古屋') || to.name.includes('名古屋'))
    );
    
    if (isMeitetsuTokoname || isAirportLine) {
        // 名铁线路
        let fee = 740; // 常滑线基础
        if (isAirportLine) fee = 870; // 机场线
        
        return {
            type: 'meitetsu',
            fee: fee,
            duration: isAirportLine ? 30 : 35,
            segment: {
                icon: '🚃',
                route: `${from.name} → ${to.name}`,
                detail: '名铁电车',
                fee: fee
            }
        };
    }
    
    if (isLinimo) {
        // Linimo磁悬浮线
        return {
            type: 'linimo',
            fee: 400,
            duration: 25,
            segment: {
                icon: '🚝',
                route: `${from.name} → ${to.name}`,
                detail: 'Linimo磁悬浮线',
                fee: 400
            }
        };
    }
    
    // 普通地铁/步行换乘
    let subwayFee = 230;
    if (dist > 15) subwayFee = 370;
    else if (dist > 8) subwayFee = 300;
    
    return {
        type: 'subway',
        fee: subwayFee,
        duration: duration + 5,
        segment: {
            icon: '🚇',
            route: `${from.name} → ${to.name}`,
            detail: '地铁/步行换乘',
            fee: subwayFee
        }
    };
}

// ===== 计算两点间距离（km）=====
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球半径
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ===== 清空路线 =====
function clearRoutes() {
    routeLayers.forEach(l => map.removeLayer(l));
    routeLayers = [];
    routePanel.classList.remove('expanded');
}

// ===== 切换出行方式 =====
function switchTravelMode(mode) {
    document.querySelectorAll('.travel-mode-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.travel-mode-tab[data-mode="${mode}"]`).classList.add('active');
    currentMode = mode;

    // 如果已有路线，重新规划
    if (markersData.length >= 2) {
        planRoute();
    }
}

// 挂载到window对象
window.initMap = initMap;
window.addMarker = addMarker;
window.updateMarkers = updateMarkers;
window.fitBounds = fitBounds;
window.removeMarker = removeMarker;
window.clearAllMarkers = clearAllMarkers;
window.planRoute = planRoute;
window.displayRoute = displayRoute;
window.handleBus = handleBus;
window.clearRoutes = clearRoutes;
window.switchTravelMode = switchTravelMode;
