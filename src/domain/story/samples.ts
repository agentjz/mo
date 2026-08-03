import type { StoryDocument } from './document.ts';
import type { StoryEditorState } from './editorState.ts';

export const SURVIVAL_SAMPLE: StoryDocument = {
  "format": "mo.story",
  "version": 2,
  "id": "sample-survival",
  "meta": {
    "title": "墨水编辑器开发实例：survive!",
    "author": "墨水官方",
    "description": "叙事游戏开发实例，展示纯节点流的剧情分支和选择系统。40个节点，多个结局。改编自《书虫》"
  },
  "entrySceneId": "1",
  "scenes": [
    {
      "id": "1",
      "type": "start",
      "content": {
        "text": "你名叫爱丽丝，是一名冒险家，正驾驶热气球飞越落基山脉进行探险考察。突然，燃烧器发出了奇怪的响声然后熄灭，热气球开始快速下降。你的通讯设备失灵了，没有人知道你所在的位置。[[继续]]"
      },
      "choices": [
        {
          "id": "c1_1",
          "text": "继续",
          "targetSceneId": "20"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "2",
      "type": "normal",
      "content": {
        "text": "你穿着外套，拿着威士忌和地图，走了大约二十分钟。积雪很厚，你感到很冷。[[回到吊篮，拿一些其他物品]] [[为了暖和一点儿，喝威士忌]]"
      },
      "choices": [
        {
          "id": "c2_1",
          "text": "回到吊篮，拿一些其他物品",
          "targetSceneId": "29"
        },
        {
          "id": "c2_2",
          "text": "为了暖和一点儿，喝威士忌",
          "targetSceneId": "34"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "3",
      "type": "normal",
      "content": {
        "text": "你回去睡觉，再也没听到直升机的声音。第二天，你继续沿着河边走。[[继续]]"
      },
      "choices": [
        {
          "id": "c3_1",
          "text": "继续",
          "targetSceneId": "21"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "4",
      "type": "normal",
      "content": {
        "text": "你原路返回，出了隧道，走进乱石丛生的山谷。[[继续]]"
      },
      "choices": [
        {
          "id": "c4_1",
          "text": "继续",
          "targetSceneId": "16"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "5",
      "type": "normal",
      "content": {
        "text": "你吃了果子。虽然味道不好，但是你太饿了，还是吃了不少。你带了些果子在身上，过后可以吃。[[继续]]"
      },
      "choices": [
        {
          "id": "c5_1",
          "text": "继续",
          "targetSceneId": "10"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "6",
      "type": "normal",
      "content": {
        "text": "你穿着外套，拿着香蕉和打火机，走了大约二十分钟。积雪很厚，你感到很冷。你走到树林里，生起一堆火。[[继续]]"
      },
      "choices": [
        {
          "id": "c6_1",
          "text": "继续",
          "targetSceneId": "36"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "7",
      "type": "normal",
      "content": {
        "text": "又到了晚上，但因为之前吃了鱼，你并没有觉得饿。你在树下搭了一座小棚子。早上醒来后，你听到了一阵响声。你跑出棚子往天上看，发现有一架直升机。虽然你看得见直升机，但因为树木的遮挡，直升机上的人看不到你。直升机就要飞走了。[[追着直升机跑]] [[回棚子睡觉]] [[生起一大堆火]] [[冲着直升机大声呼喊并挥动双臂]]"
      },
      "choices": [
        {
          "id": "c7_1",
          "text": "追着直升机跑",
          "targetSceneId": "31"
        },
        {
          "id": "c7_2",
          "text": "回棚子睡觉",
          "targetSceneId": "3"
        },
        {
          "id": "c7_3",
          "text": "生起一大堆火",
          "targetSceneId": "35"
        },
        {
          "id": "c7_4",
          "text": "冲着直升机大声呼喊并挥动双臂",
          "targetSceneId": "37"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "8",
      "type": "normal",
      "content": {
        "text": "你顺着山谷走出很远，夜晚又要来临了。你在树林里生起了火，吃了香蕉。第二天早上，你感到很饿，必须找些东西吃。你在雪地上发现了动物的脚印，也许你可以猎杀这只动物作食物。[[沿着脚印追踪而去]] [[你很害怕大型动物，向山下走去]]"
      },
      "choices": [
        {
          "id": "c8_1",
          "text": "沿着脚印追踪而去",
          "targetSceneId": "39"
        },
        {
          "id": "c8_2",
          "text": "你很害怕大型动物，向山下走去",
          "targetSceneId": "17"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "9",
      "type": "normal",
      "content": {
        "text": "你带着香蕉、打火机和地图走了几分钟，感到非常寒冷。[[生起一堆火]] [[回到吊篮去取威士忌]]"
      },
      "choices": [
        {
          "id": "c9_1",
          "text": "生起一堆火",
          "targetSceneId": "36"
        },
        {
          "id": "c9_2",
          "text": "回到吊篮去取威士忌",
          "targetSceneId": "34"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "10",
      "type": "ending",
      "content": {
        "text": "时间到了下午。你开始觉得很不舒服。也许那些果子有毒。你走不动了，坐在雪地上，觉得越来越冷。"
      },
      "choices": [],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "11",
      "type": "ending",
      "content": {
        "text": "热气球向右飘去，吊篮重重地撞到了树上。"
      },
      "choices": [],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "12",
      "type": "ending",
      "content": {
        "text": "你横穿湖面，在冰上走。几分钟后，冰裂开了，你掉进了冰水里。"
      },
      "choices": [],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "13",
      "type": "normal",
      "content": {
        "text": "你带着威士忌、打火机和香蕉走了几分钟，感到非常寒冷。[[喝威士忌]] [[回到吊篮，放下威士忌，带上外套]]"
      },
      "choices": [
        {
          "id": "c13_1",
          "text": "喝威士忌",
          "targetSceneId": "34"
        },
        {
          "id": "c13_2",
          "text": "回到吊篮，放下威士忌，带上外套",
          "targetSceneId": "6"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "14",
      "type": "normal",
      "content": {
        "text": "河面上结了冰，但中间有洞隙。你看到河里有鱼。也许你可以抓一条鱼吃。[[试着从冰隙间捉一条鱼]] [[在河里捉鱼很危险，继续往前走]]"
      },
      "choices": [
        {
          "id": "c14_1",
          "text": "试着从冰隙间捉一条鱼",
          "targetSceneId": "26"
        },
        {
          "id": "c14_2",
          "text": "在河里捉鱼很危险，继续往前走",
          "targetSceneId": "21"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "15",
      "type": "normal",
      "content": {
        "text": "热气球向左飘去，吊篮缓缓降落在雪地上。你虽然安全了，但却身处山顶，天气非常寒冷。天黑了下来。[[待在吊篮里]] [[向山下走去]]"
      },
      "choices": [
        {
          "id": "c15_1",
          "text": "待在吊篮里",
          "targetSceneId": "24"
        },
        {
          "id": "c15_2",
          "text": "向山下走去",
          "targetSceneId": "29"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "16",
      "type": "normal",
      "content": {
        "text": "山谷中的岩石很难攀爬，几分钟之后你就疲惫不堪了。[[继续沿着山谷走]] [[往回走，出山谷，进隧道]]"
      },
      "choices": [
        {
          "id": "c16_1",
          "text": "继续沿着山谷走",
          "targetSceneId": "8"
        },
        {
          "id": "c16_2",
          "text": "往回走，出山谷，进隧道",
          "targetSceneId": "33"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "17",
      "type": "normal",
      "content": {
        "text": "你穿过树林向山下走，感觉饥肠辘辘。你看到有一棵树上结着没见过的果子。[[吃果子]] [[不吃果子]]"
      },
      "choices": [
        {
          "id": "c17_1",
          "text": "吃果子",
          "targetSceneId": "5"
        },
        {
          "id": "c17_2",
          "text": "不吃果子",
          "targetSceneId": "23"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "18",
      "type": "normal",
      "content": {
        "text": "你小心地走上湖面。走了几百米后，脚下的冰开始晃动。[[继续在湖面上穿行]] [[退回去，然后绕着湖走]]"
      },
      "choices": [
        {
          "id": "c18_1",
          "text": "继续在湖面上穿行",
          "targetSceneId": "12"
        },
        {
          "id": "c18_2",
          "text": "退回去，然后绕着湖走",
          "targetSceneId": "28"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "19",
      "type": "ending",
      "content": {
        "text": "你重新生起一堆火。大概两个小时后，你又听到了直升机的声音。这一次，直升机看到了烟，停在了你旁边的雪地上。这下你安全了。你乘直升机前往医院，可以在那里吃饭和休息。"
      },
      "choices": [],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "20",
      "type": "normal",
      "content": {
        "text": "热气球极快地向山中坠去，你可以拉动控制绳让热气球向左或向右飘移。右边是一片树木，左边是厚厚的积雪。[[向右飘]] [[向左飘]]"
      },
      "choices": [
        {
          "id": "c20_1",
          "text": "向右飘",
          "targetSceneId": "11"
        },
        {
          "id": "c20_2",
          "text": "向左飘",
          "targetSceneId": "15"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "21",
      "type": "normal",
      "content": {
        "text": "你继续沿着河走，感觉非常饥饿，必须找东西吃。树上有果子，河中有鱼。[[尝试着抓一条鱼]] [[吃一些果子]]"
      },
      "choices": [
        {
          "id": "c21_1",
          "text": "尝试着抓一条鱼",
          "targetSceneId": "26"
        },
        {
          "id": "c21_2",
          "text": "吃一些果子",
          "targetSceneId": "5"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "22",
      "type": "ending",
      "content": {
        "text": "绳子断了。"
      },
      "choices": [],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "23",
      "type": "normal",
      "content": {
        "text": "你继续在雪中跋涉。没有吃的东西，但你可以生火，还可以喝雪水。突然，你发现前面有一片结了冰的湖。[[横穿湖面，这样会快一些]] [[绕着湖走，去寻找一条河]]"
      },
      "choices": [
        {
          "id": "c23_1",
          "text": "横穿湖面，这样会快一些",
          "targetSceneId": "18"
        },
        {
          "id": "c23_2",
          "text": "绕着湖走，去寻找一条河",
          "targetSceneId": "28"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "24",
      "type": "normal",
      "content": {
        "text": "你待在吊篮里，但感到非常寒冷。你真的不想活了吗？[[继续]]"
      },
      "choices": [
        {
          "id": "c24_1",
          "text": "继续",
          "targetSceneId": "29"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "25",
      "type": "normal",
      "content": {
        "text": "你在吊篮里待了四天，什么也看不到，什么也听不到。你必须下山。[[继续]]"
      },
      "choices": [
        {
          "id": "c25_1",
          "text": "继续",
          "targetSceneId": "27"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "26",
      "type": "normal",
      "content": {
        "text": "经过二十分钟的努力，你终于捉到了一条鱼。你又多捉了几条。你感到很冷，于是生起了一堆火，烤了一条鱼吃。味道好极了。[[继续]]"
      },
      "choices": [
        {
          "id": "c26_1",
          "text": "继续",
          "targetSceneId": "7"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "27",
      "type": "normal",
      "content": {
        "text": "你朝山下走去。几分钟后看到前面有一条隧道。你的左侧还有一个布满岩石的小山谷。[[沿着山谷走去]] [[走进隧道]]"
      },
      "choices": [
        {
          "id": "c27_1",
          "text": "沿着山谷走去",
          "targetSceneId": "16"
        },
        {
          "id": "c27_2",
          "text": "走进隧道",
          "targetSceneId": "33"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "28",
      "type": "normal",
      "content": {
        "text": "你绕着湖走。大约走了五公里，你发现了一条河。河水从湖中流出，向山谷流去。[[继续绕着湖走]] [[沿着河走去]]"
      },
      "choices": [
        {
          "id": "c28_1",
          "text": "继续绕着湖走",
          "targetSceneId": "38"
        },
        {
          "id": "c28_2",
          "text": "沿着河走去",
          "targetSceneId": "14"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "29",
      "type": "normal",
      "content": {
        "text": "你想下山。吊篮里有一些物品，你可以随身带上几样。你会带哪些呢？[[外套、威士忌和地图]] [[外套、香蕉和打火机]] [[香蕉、打火机和地图]] [[威士忌、打火机和香蕉]]"
      },
      "choices": [
        {
          "id": "c29_1",
          "text": "外套、威士忌和地图",
          "targetSceneId": "2"
        },
        {
          "id": "c29_2",
          "text": "外套、香蕉和打火机",
          "targetSceneId": "6"
        },
        {
          "id": "c29_3",
          "text": "香蕉、打火机和地图",
          "targetSceneId": "9"
        },
        {
          "id": "c29_4",
          "text": "威士忌、打火机和香蕉",
          "targetSceneId": "13"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "30",
      "type": "normal",
      "content": {
        "text": "一整天，烟不停地升上天空，但是直升机没有出现。你等了一整天。第二天，你又一大早就醒来了。[[重新生起一堆火]] [[沿着河走去]]"
      },
      "choices": [
        {
          "id": "c30_1",
          "text": "重新生起一堆火",
          "targetSceneId": "19"
        },
        {
          "id": "c30_2",
          "text": "沿着河走去",
          "targetSceneId": "21"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "31",
      "type": "normal",
      "content": {
        "text": "你追着直升机跑，但它飞得很快。你不得不往山上爬，在厚厚的雪中跋涉了一整天，但再也没见到那架直升机。[[继续]]"
      },
      "choices": [
        {
          "id": "c31_1",
          "text": "继续",
          "targetSceneId": "23"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "32",
      "type": "normal",
      "content": {
        "text": "你待在吊篮附近。坐在火边，看着天，就这样过了两天。什么也没有发生。[[待在吊篮附近]] [[试着向山下走去]]"
      },
      "choices": [
        {
          "id": "c32_1",
          "text": "待在吊篮附近",
          "targetSceneId": "25"
        },
        {
          "id": "c32_2",
          "text": "试着向山下走去",
          "targetSceneId": "27"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "33",
      "type": "normal",
      "content": {
        "text": "你走进隧道。里面漆黑一片。你看到有一盏灯，便点上了。[[继续]]"
      },
      "choices": [
        {
          "id": "c33_1",
          "text": "继续",
          "targetSceneId": "40"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "34",
      "type": "ending",
      "content": {
        "text": "为了暖和一点儿，你喝了威士忌，但并没有觉得暖和起来。你只是感到很累，筋疲力尽。"
      },
      "choices": [],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "35",
      "type": "normal",
      "content": {
        "text": "你生起一大堆火，火堆冒出很多烟。你看着冲天的烟柱。[[继续]]"
      },
      "choices": [
        {
          "id": "c35_1",
          "text": "继续",
          "targetSceneId": "30"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "36",
      "type": "normal",
      "content": {
        "text": "你整晚都坐在树林里的火堆前。虽然天很冷，但火烧得很旺，你可以稍微睡一会儿。你需要想想天亮以后你可以做些什么。[[燃着火堆，待在吊篮附近]] [[向山下走去]]"
      },
      "choices": [
        {
          "id": "c36_1",
          "text": "燃着火堆，待在吊篮附近",
          "targetSceneId": "32"
        },
        {
          "id": "c36_2",
          "text": "向山下走去",
          "targetSceneId": "27"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "37",
      "type": "normal",
      "content": {
        "text": "你冲着直升机一边大声呼喊，一边挥动双臂。直升机掉头往回飞了一会儿，然后向山上飞去。[[追着直升机跑]] [[回去睡觉]] [[生起一大堆火]]"
      },
      "choices": [
        {
          "id": "c37_1",
          "text": "追着直升机跑",
          "targetSceneId": "31"
        },
        {
          "id": "c37_2",
          "text": "回去睡觉",
          "targetSceneId": "3"
        },
        {
          "id": "c37_3",
          "text": "生起一大堆火",
          "targetSceneId": "35"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "38",
      "type": "normal",
      "content": {
        "text": "你绕着湖走了一整圈，筋疲力尽，没有找到任何食物。你只能沿着河走。[[继续]]"
      },
      "choices": [
        {
          "id": "c38_1",
          "text": "继续",
          "targetSceneId": "14"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "39",
      "type": "normal",
      "content": {
        "text": "你沿着脚印在树林中走了很远。脚印延伸到一棵大树的后面。你朝树后看去，看到了一只大熊。这肯定不是能吃的。你悄悄地离开了。[[继续]]"
      },
      "choices": [
        {
          "id": "c39_1",
          "text": "继续",
          "targetSceneId": "17"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "40",
      "type": "normal",
      "content": {
        "text": "你向山的深处走，大约走了十分钟，发现地上有一个很大的洞。一条很旧的绳子一直延伸到洞中。[[顺着绳子下到洞中]] [[退回到隧道口]]"
      },
      "choices": [
        {
          "id": "c40_1",
          "text": "顺着绳子下到洞中",
          "targetSceneId": "22"
        },
        {
          "id": "c40_2",
          "text": "退回到隧道口",
          "targetSceneId": "4"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    }
  ],
  "variables": [],
  "rules": [],
  "presentation": {
    "templateId": "builtin.visual-novel",
    "settings": {},
    "sceneVariants": {}
  },
  "extensionData": {},
  "createdAt": "2026-08-02T00:00:00.000Z",
  "updatedAt": "2026-08-02T00:00:00.000Z"
};

export const SURVIVAL_SAMPLE_EDITOR_STATE: StoryEditorState = {
  "scenePositions": {
    "1": {
      "x": 100,
      "y": 500
    },
    "2": {
      "x": 1200,
      "y": 300
    },
    "3": {
      "x": 2400,
      "y": 600
    },
    "4": {
      "x": 1800,
      "y": 100
    },
    "5": {
      "x": 2100,
      "y": 900
    },
    "6": {
      "x": 1500,
      "y": 450
    },
    "7": {
      "x": 2700,
      "y": 500
    },
    "8": {
      "x": 2100,
      "y": 200
    },
    "9": {
      "x": 1500,
      "y": 200
    },
    "10": {
      "x": 2400,
      "y": 1000
    },
    "11": {
      "x": 900,
      "y": 300
    },
    "12": {
      "x": 2700,
      "y": 850
    },
    "13": {
      "x": 1500,
      "y": 350
    },
    "14": {
      "x": 3000,
      "y": 750
    },
    "15": {
      "x": 900,
      "y": 600
    },
    "16": {
      "x": 2100,
      "y": 50
    },
    "17": {
      "x": 2400,
      "y": 800
    },
    "18": {
      "x": 2700,
      "y": 750
    },
    "19": {
      "x": 3900,
      "y": 400
    },
    "20": {
      "x": 600,
      "y": 500
    },
    "21": {
      "x": 2700,
      "y": 700
    },
    "22": {
      "x": 2100,
      "y": 0
    },
    "23": {
      "x": 2700,
      "y": 650
    },
    "24": {
      "x": 1200,
      "y": 700
    },
    "25": {
      "x": 1500,
      "y": 800
    },
    "26": {
      "x": 3300,
      "y": 600
    },
    "27": {
      "x": 1800,
      "y": 600
    },
    "28": {
      "x": 3300,
      "y": 800
    },
    "29": {
      "x": 1200,
      "y": 500
    },
    "30": {
      "x": 3600,
      "y": 500
    },
    "31": {
      "x": 3000,
      "y": 550
    },
    "32": {
      "x": 1800,
      "y": 700
    },
    "33": {
      "x": 1800,
      "y": 300
    },
    "34": {
      "x": 1500,
      "y": 100
    },
    "35": {
      "x": 3300,
      "y": 450
    },
    "36": {
      "x": 1800,
      "y": 500
    },
    "37": {
      "x": 3000,
      "y": 450
    },
    "38": {
      "x": 3600,
      "y": 850
    },
    "39": {
      "x": 2400,
      "y": 300
    },
    "40": {
      "x": 1800,
      "y": 200
    }
  },
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  },
  "selectedSceneId": null,
  "selectedChoiceId": null
};

export const MYSTERY_SAMPLE: StoryDocument = {
  "format": "mo.story",
  "version": 2,
  "id": "sample-mystery",
  "meta": {
    "title": "墨水编辑器开发实例：雾都疑案",
    "author": "墨水官方",
    "description": "1898年伦敦，你是著名侦探米克罗夫特·庞德。一名女子遭到攻击，警方怀疑是'白教堂杀手'所为。你能抓住真凶吗？35个节点的侦探推理互动小说。"
  },
  "entrySceneId": "1",
  "scenes": [
    {
      "id": "1",
      "type": "start",
      "content": {
        "text": "故事发生在1898年，你是著名的侦探米克罗夫特·庞德。11月一个寒冷的夜晚，你正坐在伦敦的家里。有人敲门。来者是伦敦警察局的弗利威尔巡官。『您能来一趟白教堂吗，庞德先生？我们需要您的帮助。有个女人倒在街上。她没死，但浑身是血。我们认为这次又是'白教堂杀手'干的。』\n\n[[你穿上外套]]"
      },
      "choices": [
        {
          "id": "c1_1",
          "text": "你穿上外套",
          "targetSceneId": "18"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "2",
      "type": "normal",
      "content": {
        "text": "你在安妮家中。一个女人走了进来。『你是谁？你在这儿干什么？』她问道。你给她说了安妮的事。『太可怕了。』她说。『您认识她的朋友吗？』你问。女人想了想。『她最好的朋友是个叫罗茜的女人，住在莱姆豪斯街。不过她有个男朋友。就是那张照片里的那个。我不喜欢他。』\n\n[[回到玫瑰与王冠酒吧，询问其他人]]\n[[去莱姆豪斯街找罗茜]]"
      },
      "choices": [
        {
          "id": "c2_1",
          "text": "回到玫瑰与王冠酒吧，询问其他人",
          "targetSceneId": "10"
        },
        {
          "id": "c2_2",
          "text": "去莱姆豪斯街找罗茜",
          "targetSceneId": "35"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "3",
      "type": "normal",
      "content": {
        "text": "你想上加利福尼亚人号找杰克谈谈。\n\n[[你跳进水中，游着去追船]]\n[[你不会游泳。你考虑着怎么上船]]"
      },
      "choices": [
        {
          "id": "c3_1",
          "text": "你跳进水中，游着去追船",
          "targetSceneId": "8"
        },
        {
          "id": "c3_2",
          "text": "你不会游泳。你考虑着怎么上船",
          "targetSceneId": "13"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "4",
      "type": "normal",
      "content": {
        "text": "『您知道街上那个女人叫什么吗？』你问老人。他听不见你的话，没有回答。\n\n[[继续询问]]"
      },
      "choices": [
        {
          "id": "c4_1",
          "text": "继续询问",
          "targetSceneId": "10"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "5",
      "type": "normal",
      "content": {
        "text": "你过了桥，但看不到加利福尼亚人号。一条小船上有个水手。有位老人在钓鱼。\n\n[[你请水手帮忙]]\n[[你请老人帮忙]]"
      },
      "choices": [
        {
          "id": "c5_1",
          "text": "你请水手帮忙",
          "targetSceneId": "24"
        },
        {
          "id": "c5_2",
          "text": "你请老人帮忙",
          "targetSceneId": "34"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "6",
      "type": "normal",
      "content": {
        "text": "你询问小伙子。他走到街上，看了看那个女人。『我想她叫安妮。』他说。『你知道她住哪儿吗？』『知道。我想她住在缆绳街。』\n\n[[回到玫瑰与王冠酒吧，询问其他人]]\n[[去缆绳街]]"
      },
      "choices": [
        {
          "id": "c6_1",
          "text": "回到玫瑰与王冠酒吧，询问其他人",
          "targetSceneId": "10"
        },
        {
          "id": "c6_2",
          "text": "去缆绳街",
          "targetSceneId": "30"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "7",
      "type": "normal",
      "content": {
        "text": "加利福尼亚人号的船长叫来了三个叫杰克的人。你想询问哪个杰克？\n\n[[左边的杰克]]\n[[中间的杰克]]\n[[右边的杰克]]"
      },
      "choices": [
        {
          "id": "c7_1",
          "text": "左边的杰克",
          "targetSceneId": "17"
        },
        {
          "id": "c7_2",
          "text": "中间的杰克",
          "targetSceneId": "23"
        },
        {
          "id": "c7_3",
          "text": "右边的杰克",
          "targetSceneId": "31"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "8",
      "type": "normal",
      "content": {
        "text": "你跳进水中，游着去追船。但船开得很快。五分钟后，加利福尼亚人号驶出了伦敦码头，驶向印度。这时你觉得非常冷。\n\n[[继续]]"
      },
      "choices": [
        {
          "id": "c8_1",
          "text": "继续",
          "targetSceneId": "22"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "9",
      "type": "normal",
      "content": {
        "text": "你告诉罗茜安妮的事。『我是安妮最好的朋友。』她说着哭了起来。『不过她有个男朋友。』『他是谁？』你问。『一个水手。他叫杰克。他经常去她缆绳街的家里。我想他的船现在就在伦敦码头。』\n\n[[你想找到杰克，于是去了码头]]\n[[你想多了解一些安妮的情况，于是去了她在缆绳街的家]]"
      },
      "choices": [
        {
          "id": "c9_1",
          "text": "你想找到杰克，于是去了码头",
          "targetSceneId": "14"
        },
        {
          "id": "c9_2",
          "text": "你想多了解一些安妮的情况，于是去了她在缆绳街的家",
          "targetSceneId": "19"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "10",
      "type": "normal",
      "content": {
        "text": "玫瑰与王冠酒吧里有四个人。你想问问有关街上那个女人的事。你要先问谁？\n\n[[你询问老人]]\n[[你询问小伙子]]\n[[你询问老妇人]]\n[[你询问年轻姑娘]]"
      },
      "choices": [
        {
          "id": "c10_1",
          "text": "你询问老人",
          "targetSceneId": "4"
        },
        {
          "id": "c10_2",
          "text": "你询问小伙子",
          "targetSceneId": "6"
        },
        {
          "id": "c10_3",
          "text": "你询问老妇人",
          "targetSceneId": "15"
        },
        {
          "id": "c10_4",
          "text": "你询问年轻姑娘",
          "targetSceneId": "28"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "11",
      "type": "normal",
      "content": {
        "text": "水手看着你。『杰克？』他说，『叫杰克的水手有几百个。每条船上都有个杰克。』你必须找出杰克所在的船的名字。你去安妮的房间寻找更多信息。\n\n[[去安妮的房间]]"
      },
      "choices": [
        {
          "id": "c11_1",
          "text": "去安妮的房间",
          "targetSceneId": "19"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "12",
      "type": "normal",
      "content": {
        "text": "你到了伦敦码头。那里有几百条船。你想找到加利福尼亚人号，抓住杰克。\n\n[[你走过桥]]\n[[你去右边]]\n[[你去左边]]"
      },
      "choices": [
        {
          "id": "c12_1",
          "text": "你走过桥",
          "targetSceneId": "5"
        },
        {
          "id": "c12_2",
          "text": "你去右边",
          "targetSceneId": "20"
        },
        {
          "id": "c12_3",
          "text": "你去左边",
          "targetSceneId": "29"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "13",
      "type": "normal",
      "content": {
        "text": "水面上有座桥。你上了桥，跳上加利福尼亚人号。你去找船长。『我必须和您船上的一个人谈谈，』你说，『他叫杰克。』『您为什么要和他谈？』他问道。『我认为他是白教堂杀手。』『我这条船上有三个杰克。』船长说。『我能都见见吗？』你问。\n\n[[继续]]"
      },
      "choices": [
        {
          "id": "c13_1",
          "text": "继续",
          "targetSceneId": "7"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "14",
      "type": "normal",
      "content": {
        "text": "你去伦敦码头找安妮的朋友杰克。那儿有几百条船，几千名水手。你和一名水手搭上了话。『你认识一名叫杰克的水手吗？』你问道。\n\n[[继续]]"
      },
      "choices": [
        {
          "id": "c14_1",
          "text": "继续",
          "targetSceneId": "11"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "15",
      "type": "normal",
      "content": {
        "text": "你询问老妇人。她走到街上，看了看那个女人。『她叫安妮。』她说。『您知道她住哪儿吗？』你问。『知道。她住在缆绳街。我不知道门牌号。』她答道。\n\n[[回到玫瑰与王冠酒吧，询问其他人]]\n[[去缆绳街]]"
      },
      "choices": [
        {
          "id": "c15_1",
          "text": "回到玫瑰与王冠酒吧，询问其他人",
          "targetSceneId": "10"
        },
        {
          "id": "c15_2",
          "text": "去缆绳街",
          "targetSceneId": "30"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "16",
      "type": "normal",
      "content": {
        "text": "你敲了敲白色的门。一个年轻女人开了门。『你是罗茜吗？』你问。『是的。』『你是安妮的朋友吗？』『是的。』她说道。『我有个坏消息告诉你，』你说，『恐怕她快不行了。』『不。』罗茜哭了起来。\n\n[[继续]]"
      },
      "choices": [
        {
          "id": "c16_1",
          "text": "继续",
          "targetSceneId": "9"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "17",
      "type": "normal",
      "content": {
        "text": "你询问左边的杰克。他不是白教堂杀手。\n\n[[继续询问]]"
      },
      "choices": [
        {
          "id": "c17_1",
          "text": "继续询问",
          "targetSceneId": "7"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "18",
      "type": "normal",
      "content": {
        "text": "白教堂杀手用一把长刀伤人。他杀了6个女人。你来到白教堂，警察在那里等你。那个女人倒在玫瑰与王冠酒吧附近的街上。她伤得很重，所以无法开口和你说话。你看到路上有一些自行车轮印。\n\n[[你沿着自行车轮印追踪]]\n[[你走进玫瑰与王冠酒吧。你想与里面的人谈谈]]"
      },
      "choices": [
        {
          "id": "c18_1",
          "text": "你沿着自行车轮印追踪",
          "targetSceneId": "25"
        },
        {
          "id": "c18_2",
          "text": "你走进玫瑰与王冠酒吧。你想与里面的人谈谈",
          "targetSceneId": "10"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "19",
      "type": "normal",
      "content": {
        "text": "你在安妮的家中查看，找到一封信。加利福尼亚人号，星期六。安妮，明天我们的船要去印度了。请今晚来玫瑰与王冠酒吧见个面吧。我有非常重要的东西给你。杰克。这样看来，杰克的船叫加利福尼亚人号。杰克是你要找的人吗？杰克是白教堂杀手吗？你去伦敦码头找加利福尼亚人号上的杰克。\n\n[[继续]]"
      },
      "choices": [
        {
          "id": "c19_1",
          "text": "继续",
          "targetSceneId": "12"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "20",
      "type": "normal",
      "content": {
        "text": "那儿有很多船，但你看不到加利福尼亚人号。\n\n[[返回]]"
      },
      "choices": [
        {
          "id": "c20_1",
          "text": "返回",
          "targetSceneId": "12"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "21",
      "type": "normal",
      "content": {
        "text": "你敲了敲蓝色的门。一位老人开了门。『我找罗茜。』你说。『她不住这儿，』他说，『我想她住在那个白房子里。』\n\n[[继续]]"
      },
      "choices": [
        {
          "id": "c21_1",
          "text": "继续",
          "targetSceneId": "16"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "22",
      "type": "ending",
      "content": {
        "text": "白教堂杀手逍遥法外了。你下次能成为高明一点的侦探吗？再试一次吧。"
      },
      "choices": [],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "23",
      "type": "normal",
      "content": {
        "text": "你和中间的杰克交谈。他不是白教堂杀手。\n\n[[继续询问]]"
      },
      "choices": [
        {
          "id": "c23_1",
          "text": "继续询问",
          "targetSceneId": "7"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "24",
      "type": "normal",
      "content": {
        "text": "你和水手交谈。『你知道叫加利福尼亚人号的船吗？』你问他。水手看着你。『我是俄国人，』他说，『我不会讲英语。』\n\n[[返回]]"
      },
      "choices": [
        {
          "id": "c24_1",
          "text": "返回",
          "targetSceneId": "5"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "25",
      "type": "normal",
      "content": {
        "text": "你跟着自行车轮印来到了一条大路，轮印不见了。\n\n[[返回]]"
      },
      "choices": [
        {
          "id": "c25_1",
          "text": "返回",
          "targetSceneId": "18"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "26",
      "type": "normal",
      "content": {
        "text": "你敲了敲红色的门。家里没人。\n\n[[继续寻找]]"
      },
      "choices": [
        {
          "id": "c26_1",
          "text": "继续寻找",
          "targetSceneId": "35"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "27",
      "type": "normal",
      "content": {
        "text": "他口袋里有把刀。刀上有血。这个杰克正是白教堂杀手。\n\n[[继续]]"
      },
      "choices": [
        {
          "id": "c27_1",
          "text": "继续",
          "targetSceneId": "33"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "28",
      "type": "normal",
      "content": {
        "text": "『您知道街上那个女人叫什么吗？』你问玫瑰与王冠酒吧里那名年轻姑娘。她走到街上，看了看她。『我不知道她的名字，不过她有个朋友叫罗茜。问问她吧！』『罗茜住在哪儿？』你问。『她住在莱姆豪斯街。』\n\n[[回到玫瑰与王冠酒吧，询问其他人]]\n[[去莱姆豪斯街找罗茜]]"
      },
      "choices": [
        {
          "id": "c28_1",
          "text": "回到玫瑰与王冠酒吧，询问其他人",
          "targetSceneId": "10"
        },
        {
          "id": "c28_2",
          "text": "去莱姆豪斯街找罗茜",
          "targetSceneId": "35"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "29",
      "type": "normal",
      "content": {
        "text": "你去东印度码头。你看到了加利福尼亚人号，但它正在驶出码头。\n\n[[你看到了杰克，于是你想办法上船]]\n[[船上看不到杰克的踪影。你可以去医院和安妮谈谈，你也可以给印度警察写信，告诉他们杰克的事]]"
      },
      "choices": [
        {
          "id": "c29_1",
          "text": "你看到了杰克，于是你想办法上船",
          "targetSceneId": "3"
        },
        {
          "id": "c29_2",
          "text": "船上看不到杰克的踪影。你可以去医院和安妮谈谈，你也可以给印度警察写信，告诉他们杰克的事",
          "targetSceneId": "22"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "30",
      "type": "normal",
      "content": {
        "text": "你去缆绳街，走访了那里的人。几分钟后，你找到了安妮的家。你仔细查看每样东西。\n\n[[继续]]"
      },
      "choices": [
        {
          "id": "c30_1",
          "text": "继续",
          "targetSceneId": "2"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "31",
      "type": "normal",
      "content": {
        "text": "你询问右边的杰克。『你认识一个叫安妮的女人吗？』你问。『不认识。』他说。但这个杰克戴了一只耳环。他口袋里藏着什么东西。是一把刀吗？也许这个杰克就是白教堂杀手。\n\n[[继续]]"
      },
      "choices": [
        {
          "id": "c31_1",
          "text": "继续",
          "targetSceneId": "27"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "32",
      "type": "ending",
      "content": {
        "text": "大侦探米克罗夫特·庞德又漂亮地完成了一天的工作。你回到家里。大侦探米克罗夫特一出手，伦敦的罪犯就危险了。"
      },
      "choices": [],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "33",
      "type": "normal",
      "content": {
        "text": "船长协助你逮捕了白教堂杀手。你把他带下船，交给了警察。\n\n[[继续]]"
      },
      "choices": [
        {
          "id": "c33_1",
          "text": "继续",
          "targetSceneId": "32"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "34",
      "type": "normal",
      "content": {
        "text": "你上前和老人搭话。『您知道一艘叫加利福尼亚人号的船吗？』你问他。『知道，』他说，『它今天去印度，所以现在正在东印度码头。』你必须找到东印度码头。\n\n[[继续]]"
      },
      "choices": [
        {
          "id": "c34_1",
          "text": "继续",
          "targetSceneId": "12"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    },
    {
      "id": "35",
      "type": "normal",
      "content": {
        "text": "你前往莱姆豪斯街。你要找安妮的朋友罗茜。你想先拜访哪所房子？\n\n[[有白色门的房子]]\n[[有蓝色门的房子]]\n[[有红色门的房子]]"
      },
      "choices": [
        {
          "id": "c35_1",
          "text": "有白色门的房子",
          "targetSceneId": "16"
        },
        {
          "id": "c35_2",
          "text": "有蓝色门的房子",
          "targetSceneId": "21"
        },
        {
          "id": "c35_3",
          "text": "有红色门的房子",
          "targetSceneId": "26"
        }
      ],
      "media": {},
      "tags": [],
      "ruleIds": {
        "onEnter": [],
        "onLeave": []
      },
      "extensionData": {}
    }
  ],
  "variables": [],
  "rules": [],
  "presentation": {
    "templateId": "builtin.visual-novel",
    "settings": {},
    "sceneVariants": {}
  },
  "extensionData": {},
  "createdAt": "2026-08-02T00:00:00.000Z",
  "updatedAt": "2026-08-02T00:00:00.000Z"
};

export const MYSTERY_SAMPLE_EDITOR_STATE: StoryEditorState = {
  "scenePositions": {
    "1": {
      "x": 100,
      "y": 500
    },
    "2": {
      "x": 1500,
      "y": 800
    },
    "3": {
      "x": 3000,
      "y": 1100
    },
    "4": {
      "x": 1200,
      "y": 200
    },
    "5": {
      "x": 2400,
      "y": 1300
    },
    "6": {
      "x": 1200,
      "y": 300
    },
    "7": {
      "x": 3600,
      "y": 900
    },
    "8": {
      "x": 3300,
      "y": 1200
    },
    "9": {
      "x": 2400,
      "y": 700
    },
    "10": {
      "x": 900,
      "y": 400
    },
    "11": {
      "x": 2700,
      "y": 950
    },
    "12": {
      "x": 2100,
      "y": 1100
    },
    "13": {
      "x": 3300,
      "y": 1000
    },
    "14": {
      "x": 2700,
      "y": 800
    },
    "15": {
      "x": 1200,
      "y": 400
    },
    "16": {
      "x": 2100,
      "y": 600
    },
    "17": {
      "x": 3900,
      "y": 850
    },
    "18": {
      "x": 600,
      "y": 500
    },
    "19": {
      "x": 1800,
      "y": 900
    },
    "20": {
      "x": 2100,
      "y": 1300
    },
    "21": {
      "x": 2100,
      "y": 500
    },
    "22": {
      "x": 3600,
      "y": 1300
    },
    "23": {
      "x": 3900,
      "y": 950
    },
    "24": {
      "x": 2700,
      "y": 1300
    },
    "25": {
      "x": 600,
      "y": 300
    },
    "26": {
      "x": 1800,
      "y": 400
    },
    "27": {
      "x": 4200,
      "y": 1050
    },
    "28": {
      "x": 1200,
      "y": 500
    },
    "29": {
      "x": 2700,
      "y": 1100
    },
    "30": {
      "x": 1500,
      "y": 700
    },
    "31": {
      "x": 3900,
      "y": 1050
    },
    "32": {
      "x": 4800,
      "y": 900
    },
    "33": {
      "x": 4500,
      "y": 950
    },
    "34": {
      "x": 2400,
      "y": 1400
    },
    "35": {
      "x": 1800,
      "y": 600
    }
  },
  "viewport": {
    "x": 0,
    "y": 0,
    "zoom": 1
  },
  "selectedSceneId": null,
  "selectedChoiceId": null
};
