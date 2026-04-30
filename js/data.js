/**
 * 数据文件 - 预置地点数据和常量
 * 在其他JS模块之前加载
 */

// 预置推荐地点数据
const RECOMMENDED_PLACES = [
    { id: 1, name: '名古屋城', nameJp: '名古屋城', lat: 35.1852, lng: 136.8999, desc: '地标必去', icon: '🏯', star: false },
    { id: 2, name: '大须商店街', nameJp: '大須商店街', lat: 35.1574, lng: 136.8973, desc: '逛吃天堂', icon: '🛍️', star: false },
    { id: 3, name: '荣商圈/绿洲21', nameJp: '栄オアシス21', lat: 35.1649, lng: 136.9078, desc: '购物夜景', icon: '✨', star: false },
    { id: 4, name: '热田神宫', nameJp: '熱田神宮', lat: 35.1265, lng: 136.9093, desc: '散步参拜', icon: '⛩️', star: false },
    { id: 5, name: '丰田产业技术纪念馆', nameJp: 'トヨタ産業技術記念館', lat: 35.0824, lng: 136.8864, desc: '主人必去', icon: '🔧', star: true },
    { id: 6, name: '丰田会馆/丰田博物馆', nameJp: 'トヨタ博物館', lat: 35.0833, lng: 137.0803, desc: '主人必去', icon: '🚗', star: true, transportTip: '🚃 丰田博物馆位于长久手市，地铁东山线藤が丘站转Linimo线，芸大通り站下，步行约7分钟，用时约50分钟' },
    { id: 7, name: '常滑招财猫街道', nameJp: '常滑招き猫通り', lat: 34.8833, lng: 136.8420, desc: '主人必去', icon: '🐱', star: true, transportTip: '🚃 常滑：名铁名古屋站乘常滑线直达，约30分钟' },
    { id: 8, name: '常滑烧陶器街', nameJp: '常滑焼通り', lat: 34.8815, lng: 136.8398, desc: '陶瓷艺术', icon: '🏺', star: false },
    { id: 9, name: '矢场町味噌猪排', nameJp: '矢場とん', lat: 35.1598, lng: 136.9032, desc: '名古屋名物', icon: '🍱', star: false },
    { id: 10, name: '山本屋总本家', nameJp: '山本屋総本店', lat: 35.1685, lng: 136.9085, desc: '味噌煮乌冬', icon: '🍜', star: false },
    { id: 11, name: '中部国际机场', nameJp: '中部国際空港', lat: 34.8583, lng: 136.8053, desc: '名古屋机场', icon: '✈️', star: false, transportTip: '🚃 名铁机场线名古屋站直达，约28分钟' },
    { id: 12, name: '名古屋站', nameJp: '名古屋駅', lat: 35.1709, lng: 136.8825, desc: '交通枢纽', icon: '🚉', star: false },
    { id: 13, name: '乐高乐园', nameJp: 'レゴランド・ジャパン', lat: 35.0513, lng: 136.8840, desc: '主题乐园', icon: '🎢', star: false, transportTip: '🚃 青波线从名古屋站到金城ふ頭站，步行3分钟' },
    { id: 14, name: '名古屋港水族馆', nameJp: '名古屋港水族館', lat: 35.0937, lng: 136.8844, desc: '海洋世界', icon: '🐬', star: false, transportTip: '🚃 名港线名古屋港站步行3分钟' },
    { id: 15, name: '吉卜力公园', nameJp: 'ジブリパーク', lat: 35.1774, lng: 137.0834, desc: '宫崎骏动画世界', icon: '🎠', star: false, transportTip: '🚃 东山线藤が丘站转Linimo，愛・地球博記念公園站下，约1小时' },
    { id: 16, name: '东山动植物园', nameJp: '東山動植物園', lat: 35.1548, lng: 136.9753, desc: '日本第二大动物园', icon: '🦁', star: false, transportTip: '🚃 东山线东山公园站步行3分钟' },
    { id: 17, name: '名古屋电视塔', nameJp: '中部電力ミライタワー', lat: 35.1705, lng: 136.9078, desc: '名古屋地标夜景', icon: '🗼', star: false },
    { id: 18, name: '大须观音', nameJp: '大須観音', lat: 35.1558, lng: 136.8964, desc: '日本三大观音', icon: '🏯', star: false },
    { id: 19, name: '德川美术馆/德川园', nameJp: '徳川美術館・徳川園', lat: 35.1870, lng: 136.9355, desc: '武士文化庭园', icon: '🏛️', star: false },
    { id: 20, name: '磁浮铁道馆', nameJp: 'リニア・鉄道館', lat: 35.0880, lng: 136.8784, desc: '新干线磁浮列车', icon: '🚄', star: false, transportTip: '🚃 青波线金城ふ頭站步行2分钟' },
    { id: 21, name: '广州市科学馆', nameJp: '名古屋市科学館', lat: 35.1635, lng: 136.9000, desc: '全球最大天象仪', icon: '🔬', star: false, transportTip: '🚃 东山线/鹤舞线伏见站步行5分钟' },
    { id: 22, name: '白鸟庭园', nameJp: '白鳥庭園', lat: 35.1316, lng: 136.9105, desc: '日式庭园品茶', icon: '🦢', star: false, transportTip: '🚃 热田神宫西站步行7分钟，可和热田神宫同游' },
    { id: 23, name: '则武之森', nameJp: 'ノリタケの森', lat: 35.0888, lng: 136.8788, desc: '百年陶瓷艺术', icon: '🍶', star: false, transportTip: '🚃 临近丰田产业技术纪念馆，可同日游览' },
    { id: 24, name: '名花之里', nameJp: 'なばなの里', lat: 35.0183, lng: 136.7050, desc: '花卉灯光秀', icon: '🌸', star: false, transportTip: '🚃 名铁近铁长岛站转巴士约10分钟，冬季灯光秀必看' },
    { id: 25, name: '有松老街', nameJp: '有松・鳴海絞りの町', lat: 35.0610, lng: 136.9490, desc: '江户绞染之乡', icon: '👘', star: false, transportTip: '🚃 名铁有松站步行5分钟' }
];

// 预置美食数据（按地点ID关联）
const PRESET_FOOD = {
    2: [ // 大须
        { id: 'f1', name: '鳗鱼饭三定', dish: '蓬莱鳗鱼饭', hours: '11:00-14:00/16:30-20:30', closed: '周一', reservation: false, resDays: 0, price: '¥2000-3000', notes: '大须名物，午餐排队较多', isPreset: true },
        { id: 'f2', name: '味味屋', dish: '味噌猪排', hours: '11:00-21:00', closed: '不定休', reservation: false, resDays: 0, price: '¥1500-2000', notes: '大须商店街内，随时可进', isPreset: true }
    ],
    3: [ // 荣
        { id: 'f3', name: '山本屋总本家', dish: '味噌煮乌冬', hours: '11:00-21:00', closed: '无', reservation: false, resDays: 0, price: '¥1500-2500', notes: '名古屋味噌乌冬元祖，1800年创业', isPreset: true },
        { id: 'f4', name: '矢场猪排', dish: '味噌猪排', hours: '10:30-21:00', closed: '无', reservation: false, resDays: 0, price: '¥1500-2000', notes: '名古屋必吃，排队常态建议避开饭点', isPreset: true }
    ],
    7: [ // 常滑
        { id: 'f5', name: '常滑海鲜市场', dish: '新鲜海鲜丼', hours: '10:00-17:00', closed: '周三', reservation: false, resDays: 0, price: '¥1500-2500', notes: '靠近常滑站，适合午餐', isPreset: true },
        { id: 'f6', name: '招财猫咖啡馆', dish: '猫爪咖啡拉花', hours: '9:00-18:00', closed: '无', reservation: false, resDays: 0, price: '¥800-1200', notes: '打卡必去，招财猫主题', isPreset: true }
    ],
    1: [ // 名古屋城
        { id: 'f7', name: '蓬莱轩 本店', dish: '鳗鱼饭（ひつまぶし）', hours: '11:00-14:00/16:30-20:30', closed: '周三', reservation: true, resDays: '3-7', price: '¥3000-5000', notes: '名古屋鳗鱼饭天花板！非常热门，强烈建议预约', isPreset: true },
        { id: 'f8', name: '宮きしめん 緒川', dish: '棊子面', hours: '10:00-20:00', closed: '无', reservation: false, resDays: 0, price: '¥1000-1500', notes: '名古屋当地棊子面名店', isPreset: true }
    ],
    4: [ // 热田神宫
        { id: 'f9', name: 'どんどん庵', dish: '手打乌冬', hours: '10:30-18:00', closed: '周一', reservation: false, resDays: 0, price: '¥800-1200', notes: '热田神宫参道旁，参拜后正好吃', isPreset: true }
    ],
    6: [ // 丰田博物馆
        { id: 'f10', name: '长久手花园餐厅', dish: '洋食套餐', hours: '11:00-15:00/17:00-21:00', closed: '周二', reservation: false, resDays: 0, price: '¥1500-2000', notes: '博物馆附近选择不多，这家比较靠谱', isPreset: true }
    ],
    5: [ // 丰田产业技术纪念馆
        { id: 'f11', name: '名古屋站周边美食', dish: '推荐绿洲21地下街', hours: '各店不同', closed: '无', reservation: false, resDays: 0, price: '¥1000-3000', notes: '名古屋站内美食众多，推荐绿区地下街探索', isPreset: true }
    ]
};

// ===== 常量定义 =====

// 名古屋市中心坐标
const NAGOYA_CENTER = [35.1815, 136.9066];

// 日元兑人民币汇率
const JPY_TO_CNY = 0.05;

// 日本交通费用参数
const JP_COSTS = {
    highwayRate: 24.6,    // 高速费（元/公里）
    gasPrice: 175,         // 汽油价格（日元/升）
    fuelConsumption: 0.08 // 油耗（升/公里）
};

// 将常量挂载到window对象，供其他模块使用
window.RECOMMENDED_PLACES = RECOMMENDED_PLACES;
window.PRESET_FOOD = PRESET_FOOD;
window.NAGOYA_CENTER = NAGOYA_CENTER;
window.JPY_TO_CNY = JPY_TO_CNY;
window.JP_COSTS = JP_COSTS;
