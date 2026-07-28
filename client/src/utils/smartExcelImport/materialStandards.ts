/**
 * 材质标准库 - 用于智能材质识别和标准化
 */
import type { MaterialStandard, ProcessStandard } from './types';

// 碳素结构钢
export const carbonSteels: MaterialStandard[] = [
  {
    standard: 'Q195',
    name: '碳素结构钢',
    category: 'carbon',
    aliases: ['Q195', '195', 'Q195A', 'Q195B'],
  },
  {
    standard: 'Q215',
    name: '碳素结构钢',
    category: 'carbon',
    aliases: ['Q215', '215', 'Q215A', 'Q215B'],
  },
  {
    standard: 'Q235',
    name: '碳素结构钢',
    category: 'carbon',
    aliases: ['Q235', '235', 'Q235A', 'Q235B', 'Q235C', 'Q235D', 'A3', 'A3钢'],
  },
  {
    standard: 'Q275',
    name: '碳素结构钢',
    category: 'carbon',
    aliases: ['Q275', '275'],
  },
];

// 优质碳素结构钢
export const qualityCarbonSteels: MaterialStandard[] = [
  {
    standard: '08#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['08#', '08', '08F', '08钢', '零八号钢'],
  },
  {
    standard: '10#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['10#', '10', '10F', '10钢', '十号钢'],
  },
  {
    standard: '15#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['15#', '15', '15F', '15钢', '十五号钢'],
  },
  {
    standard: '20#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['20#', '20', '20F', '20钢', '二十号钢'],
  },
  {
    standard: '25#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['25#', '25', '25钢', '二十五号钢'],
  },
  {
    standard: '30#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['30#', '30', '30钢', '三十号钢'],
  },
  {
    standard: '35#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['35#', '35', '35钢', '三十五号钢'],
  },
  {
    standard: '40#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['40#', '40', '40钢', '四十号钢'],
  },
  {
    standard: '45#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['45#', '45', '45钢', '四十五号钢', '45号钢', '45#钢'],
  },
  {
    standard: '50#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['50#', '50', '50钢', '五十号钢'],
  },
  {
    standard: '55#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['55#', '55', '55钢', '五十五号钢'],
  },
  {
    standard: '60#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['60#', '60', '60钢', '六十号钢'],
  },
  {
    standard: '65#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['65#', '65', '65钢', '六十五号钢'],
  },
  {
    standard: '70#',
    name: '优质碳素结构钢',
    category: 'carbon',
    aliases: ['70#', '70', '70钢', '七十号钢'],
  },
];

// 合金结构钢
export const alloySteels: MaterialStandard[] = [
  {
    standard: '20Cr',
    name: '合金结构钢',
    category: 'alloy',
    aliases: ['20Cr', '20铬', '20络'],
  },
  {
    standard: '40Cr',
    name: '合金结构钢',
    category: 'alloy',
    aliases: ['40Cr', '40铬', '40络'],
  },
  {
    standard: '20CrMnTi',
    name: '合金结构钢',
    category: 'alloy',
    aliases: ['20CrMnTi', '20铬锰钛', '20络锰钛'],
  },
  {
    standard: '20CrMnMo',
    name: '合金结构钢',
    category: 'alloy',
    aliases: ['20CrMnMo', '20铬锰钼'],
  },
  {
    standard: '20CrNiMo',
    name: '合金结构钢',
    category: 'alloy',
    aliases: ['20CrNiMo', '20铬镍钼'],
  },
  {
    standard: '40CrNiMo',
    name: '合金结构钢',
    category: 'alloy',
    aliases: ['40CrNiMo', '40铬镍钼'],
  },
  {
    standard: '42CrMo',
    name: '合金结构钢',
    category: 'alloy',
    aliases: ['42CrMo', '42铬钼'],
  },
  {
    standard: '35CrMo',
    name: '合金结构钢',
    category: 'alloy',
    aliases: ['35CrMo', '35铬钼'],
  },
  {
    standard: '38CrMoAl',
    name: '合金结构钢',
    category: 'alloy',
    aliases: ['38CrMoAl', '38铬钼铝'],
  },
  {
    standard: 'GCr15',
    name: '轴承钢',
    category: 'alloy',
    aliases: ['GCr15', '铬15'],
  },
  {
    standard: '65Mn',
    name: '弹簧钢',
    category: 'alloy',
    aliases: ['65Mn', '65锰'],
  },
  {
    standard: '60Si2Mn',
    name: '弹簧钢',
    category: 'alloy',
    aliases: ['60Si2Mn', '60硅2锰'],
  },
];

// 不锈钢
export const stainlessSteels: MaterialStandard[] = [
  {
    standard: '304',
    name: '奥氏体不锈钢',
    category: 'stainless',
    aliases: ['304', '304钢', '304不锈钢', '0Cr18Ni9', '06Cr19Ni10'],
  },
  {
    standard: '304L',
    name: '奥氏体不锈钢',
    category: 'stainless',
    aliases: ['304L', '304L钢', '304L不锈钢'],
  },
  {
    standard: '316',
    name: '奥氏体不锈钢',
    category: 'stainless',
    aliases: ['316', '316钢', '316不锈钢', '0Cr17Ni12Mo2'],
  },
  {
    standard: '316L',
    name: '奥氏体不锈钢',
    category: 'stainless',
    aliases: ['316L', '316L钢', '316L不锈钢'],
  },
  {
    standard: '201',
    name: '奥氏体不锈钢',
    category: 'stainless',
    aliases: ['201', '201钢', '201不锈钢'],
  },
  {
    standard: '202',
    name: '奥氏体不锈钢',
    category: 'stainless',
    aliases: ['202', '202钢', '202不锈钢'],
  },
  {
    standard: '321',
    name: '奥氏体不锈钢',
    category: 'stainless',
    aliases: ['321', '321钢', '321不锈钢'],
  },
  {
    standard: '310S',
    name: '奥氏体不锈钢',
    category: 'stainless',
    aliases: ['310S', '310S钢', '310S不锈钢'],
  },
  {
    standard: '430',
    name: '铁素体不锈钢',
    category: 'stainless',
    aliases: ['430', '430钢', '430不锈钢'],
  },
  {
    standard: '410',
    name: '马氏体不锈钢',
    category: 'stainless',
    aliases: ['410', '410钢', '410不锈钢'],
  },
  {
    standard: '420',
    name: '马氏体不锈钢',
    category: 'stainless',
    aliases: ['420', '420钢', '420不锈钢'],
  },
];

// 工具钢
export const toolSteels: MaterialStandard[] = [
  {
    standard: 'T7',
    name: '碳素工具钢',
    category: 'tool',
    aliases: ['T7', 'T7A', '碳7'],
  },
  {
    standard: 'T8',
    name: '碳素工具钢',
    category: 'tool',
    aliases: ['T8', 'T8A', '碳8'],
  },
  {
    standard: 'T10',
    name: '碳素工具钢',
    category: 'tool',
    aliases: ['T10', 'T10A', '碳10'],
  },
  {
    standard: 'T12',
    name: '碳素工具钢',
    category: 'tool',
    aliases: ['T12', 'T12A', '碳12'],
  },
  {
    standard: 'Cr12',
    name: '冷作模具钢',
    category: 'tool',
    aliases: ['Cr12', '铬12'],
  },
  {
    standard: 'Cr12MoV',
    name: '冷作模具钢',
    category: 'tool',
    aliases: ['Cr12MoV', '铬12钼钒'],
  },
  {
    standard: 'H13',
    name: '热作模具钢',
    category: 'tool',
    aliases: ['H13', '4Cr5MoSiV1'],
  },
  {
    standard: 'W18Cr4V',
    name: '高速工具钢',
    category: 'tool',
    aliases: ['W18Cr4V', '钨18铬4钒'],
  },
];

// 铸铁
export const castIrons: MaterialStandard[] = [
  {
    standard: 'HT150',
    name: '灰铸铁',
    category: 'other',
    aliases: ['HT150', '灰口150', '灰铁150'],
  },
  {
    standard: 'HT200',
    name: '灰铸铁',
    category: 'other',
    aliases: ['HT200', '灰口200', '灰铁200'],
  },
  {
    standard: 'HT250',
    name: '灰铸铁',
    category: 'other',
    aliases: ['HT250', '灰口250', '灰铁250'],
  },
  {
    standard: 'HT300',
    name: '灰铸铁',
    category: 'other',
    aliases: ['HT300', '灰口300', '灰铁300'],
  },
  {
    standard: 'QT400',
    name: '球墨铸铁',
    category: 'other',
    aliases: ['QT400', '球铁400'],
  },
  {
    standard: 'QT500',
    name: '球墨铸铁',
    category: 'other',
    aliases: ['QT500', '球铁500'],
  },
  {
    standard: 'QT600',
    name: '球墨铸铁',
    category: 'other',
    aliases: ['QT600', '球铁600'],
  },
];

// 所有材质标准库
export const allMaterialStandards: MaterialStandard[] = [
  ...carbonSteels,
  ...qualityCarbonSteels,
  ...alloySteels,
  ...stainlessSteels,
  ...toolSteels,
  ...castIrons,
];

// 工艺标准库
export const processStandards: ProcessStandard[] = [
  {
    standard: '淬火',
    name: '淬火处理',
    category: 'heat',
    aliases: ['淬火', '淬', '蘸火', '油淬', '水淬'],
  },
  {
    standard: '回火',
    name: '回火处理',
    category: 'heat',
    aliases: ['回火', '低温回火', '中温回火', '高温回火'],
  },
  {
    standard: '正火',
    name: '正火处理',
    category: 'heat',
    aliases: ['正火', '常化'],
  },
  {
    standard: '退火',
    name: '退火处理',
    category: 'heat',
    aliases: ['退火', '完全退火', '球化退火', '去应力退火'],
  },
  {
    standard: '调质',
    name: '调质处理',
    category: 'heat',
    aliases: ['调质', '调质处理', '淬火+高温回火', '淬火加高温回火'],
  },
  {
    standard: '渗碳',
    name: '渗碳处理',
    category: 'heat',
    aliases: ['渗碳', '渗碳淬火', '碳氮共渗'],
  },
  {
    standard: '氮化',
    name: '氮化处理',
    category: 'heat',
    aliases: ['氮化', '气体氮化', '离子氮化', '软氮化'],
  },
  {
    standard: '高频淬火',
    name: '感应加热淬火',
    category: 'heat',
    aliases: ['高频淬火', '高频', '表面淬火', '感应淬火'],
  },
  {
    standard: '喷砂',
    name: '喷砂处理',
    category: 'surface',
    aliases: ['喷砂', '喷丸', '抛丸'],
  },
  {
    standard: '抛光',
    name: '抛光处理',
    category: 'surface',
    aliases: ['抛光', '研磨', '精磨'],
  },
  {
    standard: '镀铬',
    name: '镀铬处理',
    category: 'surface',
    aliases: ['镀铬', '硬铬', '装饰铬'],
  },
  {
    standard: '镀锌',
    name: '镀锌处理',
    category: 'surface',
    aliases: ['镀锌', '热镀锌', '电镀锌'],
  },
  {
    standard: '发黑',
    name: '发黑处理',
    category: 'surface',
    aliases: ['发黑', '发蓝', '氧化处理'],
  },
  {
    standard: '磷化',
    name: '磷化处理',
    category: 'surface',
    aliases: ['磷化', '磷化处理'],
  },
];
