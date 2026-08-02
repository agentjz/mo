/**
 * 生存游戏模板
 * 职责：提供节点流示例，展示基础的剧情分支系统
 */

import type { Story } from '../../../types/index.js';

/**
 * 生存游戏模板 - 改编自经典互动小说
 * 40个节点的复杂剧情分支
 * 展示：节点流、选择系统、多结局（不包含编程功能）
 */
export const SURVIVAL_GAME_TEMPLATE = {
  "id": "template_survival_game",
  "meta": {
    "title": "墨水编辑器开发实例：survive!",
    "author": "墨水官方",
    "description": "叙事游戏开发实例，展示纯节点流的剧情分支和选择系统。40个节点，多个结局。改编自《书虫》",
    "start_node": 1,
    "displayMode": "visual-novel"
  },
  "nodes": [
    {
      "id": "1",
      "type": "storyNode",
      "position": { "x": 100, "y": 500 },
      "data": {
        "nodeId": 1,
        "text": "你名叫爱丽丝，是一名冒险家，正驾驶热气球飞越落基山脉进行探险考察。突然，燃烧器发出了奇怪的响声然后熄灭，热气球开始快速下降。你的通讯设备失灵了，没有人知道你所在的位置。[[继续]]",
        "choices": [{ "id": "c1_1", "text": "继续" }],
        "nodeType": "start"
      }
    },
    {
      "id": "2",
      "type": "storyNode",
      "position": { "x": 1200, "y": 300 },
      "data": {
        "nodeId": 2,
        "text": "你穿着外套，拿着威士忌和地图，走了大约二十分钟。积雪很厚，你感到很冷。[[回到吊篮，拿一些其他物品]] [[为了暖和一点儿，喝威士忌]]",
        "choices": [
          { "id": "c2_1", "text": "回到吊篮，拿一些其他物品" },
          { "id": "c2_2", "text": "为了暖和一点儿，喝威士忌" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "3",
      "type": "storyNode",
      "position": { "x": 2400, "y": 600 },
      "data": {
        "nodeId": 3,
        "text": "你回去睡觉，再也没听到直升机的声音。第二天，你继续沿着河边走。[[继续]]",
        "choices": [{ "id": "c3_1", "text": "继续" }],
        "nodeType": "normal"
      }
    },
    {
      "id": "4",
      "type": "storyNode",
      "position": { "x": 1800, "y": 100 },
      "data": {
        "nodeId": 4,
        "text": "你原路返回，出了隧道，走进乱石丛生的山谷。[[继续]]",
        "choices": [{ "id": "c4_1", "text": "继续" }],
        "nodeType": "normal"
      }
    },
    {
      "id": "5",
      "type": "storyNode",
      "position": { "x": 2100, "y": 900 },
      "data": {
        "nodeId": 5,
        "text": "你吃了果子。虽然味道不好，但是你太饿了，还是吃了不少。你带了些果子在身上，过后可以吃。[[继续]]",
        "choices": [{ "id": "c5_1", "text": "继续" }],
        "nodeType": "normal"
      }
    },
    {
      "id": "6",
      "type": "storyNode",
      "position": { "x": 1500, "y": 450 },
      "data": {
        "nodeId": 6,
        "text": "你穿着外套，拿着香蕉和打火机，走了大约二十分钟。积雪很厚，你感到很冷。你走到树林里，生起一堆火。[[继续]]",
        "choices": [{ "id": "c6_1", "text": "继续" }],
        "nodeType": "normal"
      }
    },
    {
      "id": "7",
      "type": "storyNode",
      "position": { "x": 2700, "y": 500 },
      "data": {
        "nodeId": 7,
        "text": "又到了晚上，但因为之前吃了鱼，你并没有觉得饿。你在树下搭了一座小棚子。早上醒来后，你听到了一阵响声。你跑出棚子往天上看，发现有一架直升机。虽然你看得见直升机，但因为树木的遮挡，直升机上的人看不到你。直升机就要飞走了。[[追着直升机跑]] [[回棚子睡觉]] [[生起一大堆火]] [[冲着直升机大声呼喊并挥动双臂]]",
        "choices": [
          { "id": "c7_1", "text": "追着直升机跑" },
          { "id": "c7_2", "text": "回棚子睡觉" },
          { "id": "c7_3", "text": "生起一大堆火" },
          { "id": "c7_4", "text": "冲着直升机大声呼喊并挥动双臂" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "8",
      "type": "storyNode",
      "position": { "x": 2100, "y": 200 },
      "data": {
        "nodeId": 8,
        "text": "你顺着山谷走出很远，夜晚又要来临了。你在树林里生起了火，吃了香蕉。第二天早上，你感到很饿，必须找些东西吃。你在雪地上发现了动物的脚印，也许你可以猎杀这只动物作食物。[[沿着脚印追踪而去]] [[你很害怕大型动物，向山下走去]]",
        "choices": [
          { "id": "c8_1", "text": "沿着脚印追踪而去" },
          { "id": "c8_2", "text": "你很害怕大型动物，向山下走去" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "9",
      "type": "storyNode",
      "position": { "x": 1500, "y": 200 },
      "data": {
        "nodeId": 9,
        "text": "你带着香蕉、打火机和地图走了几分钟，感到非常寒冷。[[生起一堆火]] [[回到吊篮去取威士忌]]",
        "choices": [
          { "id": "c9_1", "text": "生起一堆火" },
          { "id": "c9_2", "text": "回到吊篮去取威士忌" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "10",
      "type": "storyNode",
      "position": { "x": 2400, "y": 1000 },
      "data": {
        "nodeId": 10,
        "text": "时间到了下午。你开始觉得很不舒服。也许那些果子有毒。你走不动了，坐在雪地上，觉得越来越冷。",
        "choices": [],
        "nodeType": "ending"
      }
    },
    {
      "id": "11",
      "type": "storyNode",
      "position": { "x": 900, "y": 300 },
      "data": {
        "nodeId": 11,
        "text": "热气球向右飘去，吊篮重重地撞到了树上。",
        "choices": [],
        "nodeType": "ending"
      }
    },
    {
      "id": "12",
      "type": "storyNode",
      "position": { "x": 2700, "y": 850 },
      "data": {
        "nodeId": 12,
        "text": "你横穿湖面，在冰上走。几分钟后，冰裂开了，你掉进了冰水里。",
        "choices": [],
        "nodeType": "ending"
      }
    },
    {
      "id": "13",
      "type": "storyNode",
      "position": { "x": 1500, "y": 350 },
      "data": {
        "nodeId": 13,
        "text": "你带着威士忌、打火机和香蕉走了几分钟，感到非常寒冷。[[喝威士忌]] [[回到吊篮，放下威士忌，带上外套]]",
        "choices": [
          { "id": "c13_1", "text": "喝威士忌" },
          { "id": "c13_2", "text": "回到吊篮，放下威士忌，带上外套" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "14",
      "type": "storyNode",
      "position": { "x": 3000, "y": 750 },
      "data": {
        "nodeId": 14,
        "text": "河面上结了冰，但中间有洞隙。你看到河里有鱼。也许你可以抓一条鱼吃。[[试着从冰隙间捉一条鱼]] [[在河里捉鱼很危险，继续往前走]]",
        "choices": [
          { "id": "c14_1", "text": "试着从冰隙间捉一条鱼" },
          { "id": "c14_2", "text": "在河里捉鱼很危险，继续往前走" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "15",
      "type": "storyNode",
      "position": { "x": 900, "y": 600 },
      "data": {
        "nodeId": 15,
        "text": "热气球向左飘去，吊篮缓缓降落在雪地上。你虽然安全了，但却身处山顶，天气非常寒冷。天黑了下来。[[待在吊篮里]] [[向山下走去]]",
        "choices": [
          { "id": "c15_1", "text": "待在吊篮里" },
          { "id": "c15_2", "text": "向山下走去" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "16",
      "type": "storyNode",
      "position": { "x": 2100, "y": 50 },
      "data": {
        "nodeId": 16,
        "text": "山谷中的岩石很难攀爬，几分钟之后你就疲惫不堪了。[[继续沿着山谷走]] [[往回走，出山谷，进隧道]]",
        "choices": [
          { "id": "c16_1", "text": "继续沿着山谷走" },
          { "id": "c16_2", "text": "往回走，出山谷，进隧道" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "17",
      "type": "storyNode",
      "position": { "x": 2400, "y": 800 },
      "data": {
        "nodeId": 17,
        "text": "你穿过树林向山下走，感觉饥肠辘辘。你看到有一棵树上结着没见过的果子。[[吃果子]] [[不吃果子]]",
        "choices": [
          { "id": "c17_1", "text": "吃果子" },
          { "id": "c17_2", "text": "不吃果子" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "18",
      "type": "storyNode",
      "position": { "x": 2700, "y": 750 },
      "data": {
        "nodeId": 18,
        "text": "你小心地走上湖面。走了几百米后，脚下的冰开始晃动。[[继续在湖面上穿行]] [[退回去，然后绕着湖走]]",
        "choices": [
          { "id": "c18_1", "text": "继续在湖面上穿行" },
          { "id": "c18_2", "text": "退回去，然后绕着湖走" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "19",
      "type": "storyNode",
      "position": { "x": 3900, "y": 400 },
      "data": {
        "nodeId": 19,
        "text": "你重新生起一堆火。大概两个小时后，你又听到了直升机的声音。这一次，直升机看到了烟，停在了你旁边的雪地上。这下你安全了。你乘直升机前往医院，可以在那里吃饭和休息。",
        "choices": [],
        "nodeType": "ending"
      }
    },
    {
      "id": "20",
      "type": "storyNode",
      "position": { "x": 600, "y": 500 },
      "data": {
        "nodeId": 20,
        "text": "热气球极快地向山中坠去，你可以拉动控制绳让热气球向左或向右飘移。右边是一片树木，左边是厚厚的积雪。[[向右飘]] [[向左飘]]",
        "choices": [
          { "id": "c20_1", "text": "向右飘" },
          { "id": "c20_2", "text": "向左飘" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "21",
      "type": "storyNode",
      "position": { "x": 2700, "y": 700 },
      "data": {
        "nodeId": 21,
        "text": "你继续沿着河走，感觉非常饥饿，必须找东西吃。树上有果子，河中有鱼。[[尝试着抓一条鱼]] [[吃一些果子]]",
        "choices": [
          { "id": "c21_1", "text": "尝试着抓一条鱼" },
          { "id": "c21_2", "text": "吃一些果子" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "22",
      "type": "storyNode",
      "position": { "x": 2100, "y": 0 },
      "data": {
        "nodeId": 22,
        "text": "绳子断了。",
        "choices": [],
        "nodeType": "ending"
      }
    },
    {
      "id": "23",
      "type": "storyNode",
      "position": { "x": 2700, "y": 650 },
      "data": {
        "nodeId": 23,
        "text": "你继续在雪中跋涉。没有吃的东西，但你可以生火，还可以喝雪水。突然，你发现前面有一片结了冰的湖。[[横穿湖面，这样会快一些]] [[绕着湖走，去寻找一条河]]",
        "choices": [
          { "id": "c23_1", "text": "横穿湖面，这样会快一些" },
          { "id": "c23_2", "text": "绕着湖走，去寻找一条河" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "24",
      "type": "storyNode",
      "position": { "x": 1200, "y": 700 },
      "data": {
        "nodeId": 24,
        "text": "你待在吊篮里，但感到非常寒冷。你真的不想活了吗？[[继续]]",
        "choices": [{ "id": "c24_1", "text": "继续" }],
        "nodeType": "normal"
      }
    },
    {
      "id": "25",
      "type": "storyNode",
      "position": { "x": 1500, "y": 800 },
      "data": {
        "nodeId": 25,
        "text": "你在吊篮里待了四天，什么也看不到，什么也听不到。你必须下山。[[继续]]",
        "choices": [{ "id": "c25_1", "text": "继续" }],
        "nodeType": "normal"
      }
    },
    {
      "id": "26",
      "type": "storyNode",
      "position": { "x": 3300, "y": 600 },
      "data": {
        "nodeId": 26,
        "text": "经过二十分钟的努力，你终于捉到了一条鱼。你又多捉了几条。你感到很冷，于是生起了一堆火，烤了一条鱼吃。味道好极了。[[继续]]",
        "choices": [{ "id": "c26_1", "text": "继续" }],
        "nodeType": "normal"
      }
    },
    {
      "id": "27",
      "type": "storyNode",
      "position": { "x": 1800, "y": 600 },
      "data": {
        "nodeId": 27,
        "text": "你朝山下走去。几分钟后看到前面有一条隧道。你的左侧还有一个布满岩石的小山谷。[[沿着山谷走去]] [[走进隧道]]",
        "choices": [
          { "id": "c27_1", "text": "沿着山谷走去" },
          { "id": "c27_2", "text": "走进隧道" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "28",
      "type": "storyNode",
      "position": { "x": 3300, "y": 800 },
      "data": {
        "nodeId": 28,
        "text": "你绕着湖走。大约走了五公里，你发现了一条河。河水从湖中流出，向山谷流去。[[继续绕着湖走]] [[沿着河走去]]",
        "choices": [
          { "id": "c28_1", "text": "继续绕着湖走" },
          { "id": "c28_2", "text": "沿着河走去" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "29",
      "type": "storyNode",
      "position": { "x": 1200, "y": 500 },
      "data": {
        "nodeId": 29,
        "text": "你想下山。吊篮里有一些物品，你可以随身带上几样。你会带哪些呢？[[外套、威士忌和地图]] [[外套、香蕉和打火机]] [[香蕉、打火机和地图]] [[威士忌、打火机和香蕉]]",
        "choices": [
          { "id": "c29_1", "text": "外套、威士忌和地图" },
          { "id": "c29_2", "text": "外套、香蕉和打火机" },
          { "id": "c29_3", "text": "香蕉、打火机和地图" },
          { "id": "c29_4", "text": "威士忌、打火机和香蕉" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "30",
      "type": "storyNode",
      "position": { "x": 3600, "y": 500 },
      "data": {
        "nodeId": 30,
        "text": "一整天，烟不停地升上天空，但是直升机没有出现。你等了一整天。第二天，你又一大早就醒来了。[[重新生起一堆火]] [[沿着河走去]]",
        "choices": [
          { "id": "c30_1", "text": "重新生起一堆火" },
          { "id": "c30_2", "text": "沿着河走去" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "31",
      "type": "storyNode",
      "position": { "x": 3000, "y": 550 },
      "data": {
        "nodeId": 31,
        "text": "你追着直升机跑，但它飞得很快。你不得不往山上爬，在厚厚的雪中跋涉了一整天，但再也没见到那架直升机。[[继续]]",
        "choices": [{ "id": "c31_1", "text": "继续" }],
        "nodeType": "normal"
      }
    },
    {
      "id": "32",
      "type": "storyNode",
      "position": { "x": 1800, "y": 700 },
      "data": {
        "nodeId": 32,
        "text": "你待在吊篮附近。坐在火边，看着天，就这样过了两天。什么也没有发生。[[待在吊篮附近]] [[试着向山下走去]]",
        "choices": [
          { "id": "c32_1", "text": "待在吊篮附近" },
          { "id": "c32_2", "text": "试着向山下走去" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "33",
      "type": "storyNode",
      "position": { "x": 1800, "y": 300 },
      "data": {
        "nodeId": 33,
        "text": "你走进隧道。里面漆黑一片。你看到有一盏灯，便点上了。[[继续]]",
        "choices": [{ "id": "c33_1", "text": "继续" }],
        "nodeType": "normal"
      }
    },
    {
      "id": "34",
      "type": "storyNode",
      "position": { "x": 1500, "y": 100 },
      "data": {
        "nodeId": 34,
        "text": "为了暖和一点儿，你喝了威士忌，但并没有觉得暖和起来。你只是感到很累，筋疲力尽。",
        "choices": [],
        "nodeType": "ending"
      }
    },
    {
      "id": "35",
      "type": "storyNode",
      "position": { "x": 3300, "y": 450 },
      "data": {
        "nodeId": 35,
        "text": "你生起一大堆火，火堆冒出很多烟。你看着冲天的烟柱。[[继续]]",
        "choices": [{ "id": "c35_1", "text": "继续" }],
        "nodeType": "normal"
      }
    },
    {
      "id": "36",
      "type": "storyNode",
      "position": { "x": 1800, "y": 500 },
      "data": {
        "nodeId": 36,
        "text": "你整晚都坐在树林里的火堆前。虽然天很冷，但火烧得很旺，你可以稍微睡一会儿。你需要想想天亮以后你可以做些什么。[[燃着火堆，待在吊篮附近]] [[向山下走去]]",
        "choices": [
          { "id": "c36_1", "text": "燃着火堆，待在吊篮附近" },
          { "id": "c36_2", "text": "向山下走去" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "37",
      "type": "storyNode",
      "position": { "x": 3000, "y": 450 },
      "data": {
        "nodeId": 37,
        "text": "你冲着直升机一边大声呼喊，一边挥动双臂。直升机掉头往回飞了一会儿，然后向山上飞去。[[追着直升机跑]] [[回去睡觉]] [[生起一大堆火]]",
        "choices": [
          { "id": "c37_1", "text": "追着直升机跑" },
          { "id": "c37_2", "text": "回去睡觉" },
          { "id": "c37_3", "text": "生起一大堆火" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "38",
      "type": "storyNode",
      "position": { "x": 3600, "y": 850 },
      "data": {
        "nodeId": 38,
        "text": "你绕着湖走了一整圈，筋疲力尽，没有找到任何食物。你只能沿着河走。[[继续]]",
        "choices": [{ "id": "c38_1", "text": "继续" }],
        "nodeType": "normal"
      }
    },
    {
      "id": "39",
      "type": "storyNode",
      "position": { "x": 2400, "y": 300 },
      "data": {
        "nodeId": 39,
        "text": "你沿着脚印在树林中走了很远。脚印延伸到一棵大树的后面。你朝树后看去，看到了一只大熊。这肯定不是能吃的。你悄悄地离开了。[[继续]]",
        "choices": [{ "id": "c39_1", "text": "继续" }],
        "nodeType": "normal"
      }
    },
    {
      "id": "40",
      "type": "storyNode",
      "position": { "x": 1800, "y": 200 },
      "data": {
        "nodeId": 40,
        "text": "你向山的深处走，大约走了十分钟，发现地上有一个很大的洞。一条很旧的绳子一直延伸到洞中。[[顺着绳子下到洞中]] [[退回到隧道口]]",
        "choices": [
          { "id": "c40_1", "text": "顺着绳子下到洞中" },
          { "id": "c40_2", "text": "退回到隧道口" }
        ],
        "nodeType": "normal"
      }
    }
  ],
  "edges": [
    { "id": "e1-20", "source": "1", "target": "20", "sourceHandle": "c1_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 }, "type": "default", "animated": false },
    { "id": "e20-11", "source": "20", "target": "11", "sourceHandle": "c20_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e20-15", "source": "20", "target": "15", "sourceHandle": "c20_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e15-24", "source": "15", "target": "24", "sourceHandle": "c15_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e15-29", "source": "15", "target": "29", "sourceHandle": "c15_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e24-29", "source": "24", "target": "29", "sourceHandle": "c24_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e29-2", "source": "29", "target": "2", "sourceHandle": "c29_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e29-6", "source": "29", "target": "6", "sourceHandle": "c29_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e29-9", "source": "29", "target": "9", "sourceHandle": "c29_3", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e29-13", "source": "29", "target": "13", "sourceHandle": "c29_4", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e2-29b", "source": "2", "target": "29", "sourceHandle": "c2_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e2-34", "source": "2", "target": "34", "sourceHandle": "c2_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e6-36", "source": "6", "target": "36", "sourceHandle": "c6_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e9-36", "source": "9", "target": "36", "sourceHandle": "c9_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e9-34", "source": "9", "target": "34", "sourceHandle": "c9_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e13-34", "source": "13", "target": "34", "sourceHandle": "c13_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e13-6", "source": "13", "target": "6", "sourceHandle": "c13_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e36-32", "source": "36", "target": "32", "sourceHandle": "c36_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e36-27", "source": "36", "target": "27", "sourceHandle": "c36_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e32-25", "source": "32", "target": "25", "sourceHandle": "c32_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e32-27", "source": "32", "target": "27", "sourceHandle": "c32_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e25-27", "source": "25", "target": "27", "sourceHandle": "c25_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e27-16", "source": "27", "target": "16", "sourceHandle": "c27_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e27-33", "source": "27", "target": "33", "sourceHandle": "c27_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e16-8", "source": "16", "target": "8", "sourceHandle": "c16_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e16-33", "source": "16", "target": "33", "sourceHandle": "c16_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e33-40", "source": "33", "target": "40", "sourceHandle": "c33_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e40-22", "source": "40", "target": "22", "sourceHandle": "c40_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e40-4", "source": "40", "target": "4", "sourceHandle": "c40_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e4-16", "source": "4", "target": "16", "sourceHandle": "c4_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e8-39", "source": "8", "target": "39", "sourceHandle": "c8_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e8-17", "source": "8", "target": "17", "sourceHandle": "c8_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e39-17", "source": "39", "target": "17", "sourceHandle": "c39_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e17-5", "source": "17", "target": "5", "sourceHandle": "c17_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e17-23", "source": "17", "target": "23", "sourceHandle": "c17_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e5-10", "source": "5", "target": "10", "sourceHandle": "c5_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e23-18", "source": "23", "target": "18", "sourceHandle": "c23_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e23-28", "source": "23", "target": "28", "sourceHandle": "c23_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e18-12", "source": "18", "target": "12", "sourceHandle": "c18_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e18-28", "source": "18", "target": "28", "sourceHandle": "c18_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e28-38", "source": "28", "target": "38", "sourceHandle": "c28_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e28-14", "source": "28", "target": "14", "sourceHandle": "c28_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e38-14", "source": "38", "target": "14", "sourceHandle": "c38_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e14-26", "source": "14", "target": "26", "sourceHandle": "c14_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e14-21", "source": "14", "target": "21", "sourceHandle": "c14_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e21-26", "source": "21", "target": "26", "sourceHandle": "c21_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e21-5", "source": "21", "target": "5", "sourceHandle": "c21_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e26-7", "source": "26", "target": "7", "sourceHandle": "c26_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e7-31", "source": "7", "target": "31", "sourceHandle": "c7_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e7-3", "source": "7", "target": "3", "sourceHandle": "c7_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e7-35", "source": "7", "target": "35", "sourceHandle": "c7_3", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e7-37", "source": "7", "target": "37", "sourceHandle": "c7_4", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e37-31", "source": "37", "target": "31", "sourceHandle": "c37_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e37-3", "source": "37", "target": "3", "sourceHandle": "c37_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e37-35", "source": "37", "target": "35", "sourceHandle": "c37_3", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e31-23", "source": "31", "target": "23", "sourceHandle": "c31_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e3-21", "source": "3", "target": "21", "sourceHandle": "c3_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e35-30", "source": "35", "target": "30", "sourceHandle": "c35_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e30-19", "source": "30", "target": "19", "sourceHandle": "c30_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e30-21", "source": "30", "target": "21", "sourceHandle": "c30_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } }
  ],
  "variables": [],
  "createdAt": new Date().toISOString(),
  "updatedAt": new Date().toISOString()
} as unknown as Story;

