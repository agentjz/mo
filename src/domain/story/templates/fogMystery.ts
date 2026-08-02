/**
 * 雾都疑案模板
 * 职责：提供侦探推理类互动小说示例
 */

import type { Story } from '../../../types/index.js';

/**
 * 雾都疑案模板 - 互动侦探小说
 * 35个节点的侦探推理剧情
 * 展示：复杂分支、多结局、推理元素
 */
export const FOG_MYSTERY_TEMPLATE = {
  "id": "template_fog_mystery",
  "meta": {
    "title": "墨水编辑器开发实例：雾都疑案",
    "author": "墨水官方",
    "description": "1898年伦敦，你是著名侦探米克罗夫特·庞德。一名女子遭到攻击，警方怀疑是'白教堂杀手'所为。你能抓住真凶吗？35个节点的侦探推理互动小说。",
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
        "text": "故事发生在1898年，你是著名的侦探米克罗夫特·庞德。11月一个寒冷的夜晚，你正坐在伦敦的家里。有人敲门。来者是伦敦警察局的弗利威尔巡官。『您能来一趟白教堂吗，庞德先生？我们需要您的帮助。有个女人倒在街上。她没死，但浑身是血。我们认为这次又是'白教堂杀手'干的。』\n\n[[你穿上外套]]",
        "choices": [
          { "id": "c1_1", "text": "你穿上外套" }
        ],
        "nodeType": "start"
      }
    },
    {
      "id": "2",
      "type": "storyNode",
      "position": { "x": 1500, "y": 800 },
      "data": {
        "nodeId": 2,
        "text": "你在安妮家中。一个女人走了进来。『你是谁？你在这儿干什么？』她问道。你给她说了安妮的事。『太可怕了。』她说。『您认识她的朋友吗？』你问。女人想了想。『她最好的朋友是个叫罗茜的女人，住在莱姆豪斯街。不过她有个男朋友。就是那张照片里的那个。我不喜欢他。』\n\n[[回到玫瑰与王冠酒吧，询问其他人]]\n[[去莱姆豪斯街找罗茜]]",
        "choices": [
          { "id": "c2_1", "text": "回到玫瑰与王冠酒吧，询问其他人" },
          { "id": "c2_2", "text": "去莱姆豪斯街找罗茜" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "3",
      "type": "storyNode",
      "position": { "x": 3000, "y": 1100 },
      "data": {
        "nodeId": 3,
        "text": "你想上加利福尼亚人号找杰克谈谈。\n\n[[你跳进水中，游着去追船]]\n[[你不会游泳。你考虑着怎么上船]]",
        "choices": [
          { "id": "c3_1", "text": "你跳进水中，游着去追船" },
          { "id": "c3_2", "text": "你不会游泳。你考虑着怎么上船" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "4",
      "type": "storyNode",
      "position": { "x": 1200, "y": 200 },
      "data": {
        "nodeId": 4,
        "text": "『您知道街上那个女人叫什么吗？』你问老人。他听不见你的话，没有回答。\n\n[[继续询问]]",
        "choices": [
          { "id": "c4_1", "text": "继续询问" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "5",
      "type": "storyNode",
      "position": { "x": 2400, "y": 1300 },
      "data": {
        "nodeId": 5,
        "text": "你过了桥，但看不到加利福尼亚人号。一条小船上有个水手。有位老人在钓鱼。\n\n[[你请水手帮忙]]\n[[你请老人帮忙]]",
        "choices": [
          { "id": "c5_1", "text": "你请水手帮忙" },
          { "id": "c5_2", "text": "你请老人帮忙" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "6",
      "type": "storyNode",
      "position": { "x": 1200, "y": 300 },
      "data": {
        "nodeId": 6,
        "text": "你询问小伙子。他走到街上，看了看那个女人。『我想她叫安妮。』他说。『你知道她住哪儿吗？』『知道。我想她住在缆绳街。』\n\n[[回到玫瑰与王冠酒吧，询问其他人]]\n[[去缆绳街]]",
        "choices": [
          { "id": "c6_1", "text": "回到玫瑰与王冠酒吧，询问其他人" },
          { "id": "c6_2", "text": "去缆绳街" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "7",
      "type": "storyNode",
      "position": { "x": 3600, "y": 900 },
      "data": {
        "nodeId": 7,
        "text": "加利福尼亚人号的船长叫来了三个叫杰克的人。你想询问哪个杰克？\n\n[[左边的杰克]]\n[[中间的杰克]]\n[[右边的杰克]]",
        "choices": [
          { "id": "c7_1", "text": "左边的杰克" },
          { "id": "c7_2", "text": "中间的杰克" },
          { "id": "c7_3", "text": "右边的杰克" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "8",
      "type": "storyNode",
      "position": { "x": 3300, "y": 1200 },
      "data": {
        "nodeId": 8,
        "text": "你跳进水中，游着去追船。但船开得很快。五分钟后，加利福尼亚人号驶出了伦敦码头，驶向印度。这时你觉得非常冷。\n\n[[继续]]",
        "choices": [
          { "id": "c8_1", "text": "继续" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "9",
      "type": "storyNode",
      "position": { "x": 2400, "y": 700 },
      "data": {
        "nodeId": 9,
        "text": "你告诉罗茜安妮的事。『我是安妮最好的朋友。』她说着哭了起来。『不过她有个男朋友。』『他是谁？』你问。『一个水手。他叫杰克。他经常去她缆绳街的家里。我想他的船现在就在伦敦码头。』\n\n[[你想找到杰克，于是去了码头]]\n[[你想多了解一些安妮的情况，于是去了她在缆绳街的家]]",
        "choices": [
          { "id": "c9_1", "text": "你想找到杰克，于是去了码头" },
          { "id": "c9_2", "text": "你想多了解一些安妮的情况，于是去了她在缆绳街的家" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "10",
      "type": "storyNode",
      "position": { "x": 900, "y": 400 },
      "data": {
        "nodeId": 10,
        "text": "玫瑰与王冠酒吧里有四个人。你想问问有关街上那个女人的事。你要先问谁？\n\n[[你询问老人]]\n[[你询问小伙子]]\n[[你询问老妇人]]\n[[你询问年轻姑娘]]",
        "choices": [
          { "id": "c10_1", "text": "你询问老人" },
          { "id": "c10_2", "text": "你询问小伙子" },
          { "id": "c10_3", "text": "你询问老妇人" },
          { "id": "c10_4", "text": "你询问年轻姑娘" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "11",
      "type": "storyNode",
      "position": { "x": 2700, "y": 950 },
      "data": {
        "nodeId": 11,
        "text": "水手看着你。『杰克？』他说，『叫杰克的水手有几百个。每条船上都有个杰克。』你必须找出杰克所在的船的名字。你去安妮的房间寻找更多信息。\n\n[[去安妮的房间]]",
        "choices": [
          { "id": "c11_1", "text": "去安妮的房间" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "12",
      "type": "storyNode",
      "position": { "x": 2100, "y": 1100 },
      "data": {
        "nodeId": 12,
        "text": "你到了伦敦码头。那里有几百条船。你想找到加利福尼亚人号，抓住杰克。\n\n[[你走过桥]]\n[[你去右边]]\n[[你去左边]]",
        "choices": [
          { "id": "c12_1", "text": "你走过桥" },
          { "id": "c12_2", "text": "你去右边" },
          { "id": "c12_3", "text": "你去左边" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "13",
      "type": "storyNode",
      "position": { "x": 3300, "y": 1000 },
      "data": {
        "nodeId": 13,
        "text": "水面上有座桥。你上了桥，跳上加利福尼亚人号。你去找船长。『我必须和您船上的一个人谈谈，』你说，『他叫杰克。』『您为什么要和他谈？』他问道。『我认为他是白教堂杀手。』『我这条船上有三个杰克。』船长说。『我能都见见吗？』你问。\n\n[[继续]]",
        "choices": [
          { "id": "c13_1", "text": "继续" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "14",
      "type": "storyNode",
      "position": { "x": 2700, "y": 800 },
      "data": {
        "nodeId": 14,
        "text": "你去伦敦码头找安妮的朋友杰克。那儿有几百条船，几千名水手。你和一名水手搭上了话。『你认识一名叫杰克的水手吗？』你问道。\n\n[[继续]]",
        "choices": [
          { "id": "c14_1", "text": "继续" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "15",
      "type": "storyNode",
      "position": { "x": 1200, "y": 400 },
      "data": {
        "nodeId": 15,
        "text": "你询问老妇人。她走到街上，看了看那个女人。『她叫安妮。』她说。『您知道她住哪儿吗？』你问。『知道。她住在缆绳街。我不知道门牌号。』她答道。\n\n[[回到玫瑰与王冠酒吧，询问其他人]]\n[[去缆绳街]]",
        "choices": [
          { "id": "c15_1", "text": "回到玫瑰与王冠酒吧，询问其他人" },
          { "id": "c15_2", "text": "去缆绳街" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "16",
      "type": "storyNode",
      "position": { "x": 2100, "y": 600 },
      "data": {
        "nodeId": 16,
        "text": "你敲了敲白色的门。一个年轻女人开了门。『你是罗茜吗？』你问。『是的。』『你是安妮的朋友吗？』『是的。』她说道。『我有个坏消息告诉你，』你说，『恐怕她快不行了。』『不。』罗茜哭了起来。\n\n[[继续]]",
        "choices": [
          { "id": "c16_1", "text": "继续" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "17",
      "type": "storyNode",
      "position": { "x": 3900, "y": 850 },
      "data": {
        "nodeId": 17,
        "text": "你询问左边的杰克。他不是白教堂杀手。\n\n[[继续询问]]",
        "choices": [
          { "id": "c17_1", "text": "继续询问" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "18",
      "type": "storyNode",
      "position": { "x": 600, "y": 500 },
      "data": {
        "nodeId": 18,
        "text": "白教堂杀手用一把长刀伤人。他杀了6个女人。你来到白教堂，警察在那里等你。那个女人倒在玫瑰与王冠酒吧附近的街上。她伤得很重，所以无法开口和你说话。你看到路上有一些自行车轮印。\n\n[[你沿着自行车轮印追踪]]\n[[你走进玫瑰与王冠酒吧。你想与里面的人谈谈]]",
        "choices": [
          { "id": "c18_1", "text": "你沿着自行车轮印追踪" },
          { "id": "c18_2", "text": "你走进玫瑰与王冠酒吧。你想与里面的人谈谈" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "19",
      "type": "storyNode",
      "position": { "x": 1800, "y": 900 },
      "data": {
        "nodeId": 19,
        "text": "你在安妮的家中查看，找到一封信。加利福尼亚人号，星期六。安妮，明天我们的船要去印度了。请今晚来玫瑰与王冠酒吧见个面吧。我有非常重要的东西给你。杰克。这样看来，杰克的船叫加利福尼亚人号。杰克是你要找的人吗？杰克是白教堂杀手吗？你去伦敦码头找加利福尼亚人号上的杰克。\n\n[[继续]]",
        "choices": [
          { "id": "c19_1", "text": "继续" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "20",
      "type": "storyNode",
      "position": { "x": 2100, "y": 1300 },
      "data": {
        "nodeId": 20,
        "text": "那儿有很多船，但你看不到加利福尼亚人号。\n\n[[返回]]",
        "choices": [
          { "id": "c20_1", "text": "返回" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "21",
      "type": "storyNode",
      "position": { "x": 2100, "y": 500 },
      "data": {
        "nodeId": 21,
        "text": "你敲了敲蓝色的门。一位老人开了门。『我找罗茜。』你说。『她不住这儿，』他说，『我想她住在那个白房子里。』\n\n[[继续]]",
        "choices": [
          { "id": "c21_1", "text": "继续" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "22",
      "type": "storyNode",
      "position": { "x": 3600, "y": 1300 },
      "data": {
        "nodeId": 22,
        "text": "白教堂杀手逍遥法外了。你下次能成为高明一点的侦探吗？再试一次吧。",
        "choices": [],
        "nodeType": "ending"
      }
    },
    {
      "id": "23",
      "type": "storyNode",
      "position": { "x": 3900, "y": 950 },
      "data": {
        "nodeId": 23,
        "text": "你和中间的杰克交谈。他不是白教堂杀手。\n\n[[继续询问]]",
        "choices": [
          { "id": "c23_1", "text": "继续询问" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "24",
      "type": "storyNode",
      "position": { "x": 2700, "y": 1300 },
      "data": {
        "nodeId": 24,
        "text": "你和水手交谈。『你知道叫加利福尼亚人号的船吗？』你问他。水手看着你。『我是俄国人，』他说，『我不会讲英语。』\n\n[[返回]]",
        "choices": [
          { "id": "c24_1", "text": "返回" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "25",
      "type": "storyNode",
      "position": { "x": 600, "y": 300 },
      "data": {
        "nodeId": 25,
        "text": "你跟着自行车轮印来到了一条大路，轮印不见了。\n\n[[返回]]",
        "choices": [
          { "id": "c25_1", "text": "返回" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "26",
      "type": "storyNode",
      "position": { "x": 1800, "y": 400 },
      "data": {
        "nodeId": 26,
        "text": "你敲了敲红色的门。家里没人。\n\n[[继续寻找]]",
        "choices": [
          { "id": "c26_1", "text": "继续寻找" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "27",
      "type": "storyNode",
      "position": { "x": 4200, "y": 1050 },
      "data": {
        "nodeId": 27,
        "text": "他口袋里有把刀。刀上有血。这个杰克正是白教堂杀手。\n\n[[继续]]",
        "choices": [
          { "id": "c27_1", "text": "继续" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "28",
      "type": "storyNode",
      "position": { "x": 1200, "y": 500 },
      "data": {
        "nodeId": 28,
        "text": "『您知道街上那个女人叫什么吗？』你问玫瑰与王冠酒吧里那名年轻姑娘。她走到街上，看了看她。『我不知道她的名字，不过她有个朋友叫罗茜。问问她吧！』『罗茜住在哪儿？』你问。『她住在莱姆豪斯街。』\n\n[[回到玫瑰与王冠酒吧，询问其他人]]\n[[去莱姆豪斯街找罗茜]]",
        "choices": [
          { "id": "c28_1", "text": "回到玫瑰与王冠酒吧，询问其他人" },
          { "id": "c28_2", "text": "去莱姆豪斯街找罗茜" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "29",
      "type": "storyNode",
      "position": { "x": 2700, "y": 1100 },
      "data": {
        "nodeId": 29,
        "text": "你去东印度码头。你看到了加利福尼亚人号，但它正在驶出码头。\n\n[[你看到了杰克，于是你想办法上船]]\n[[船上看不到杰克的踪影。你可以去医院和安妮谈谈，你也可以给印度警察写信，告诉他们杰克的事]]",
        "choices": [
          { "id": "c29_1", "text": "你看到了杰克，于是你想办法上船" },
          { "id": "c29_2", "text": "船上看不到杰克的踪影。你可以去医院和安妮谈谈，你也可以给印度警察写信，告诉他们杰克的事" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "30",
      "type": "storyNode",
      "position": { "x": 1500, "y": 700 },
      "data": {
        "nodeId": 30,
        "text": "你去缆绳街，走访了那里的人。几分钟后，你找到了安妮的家。你仔细查看每样东西。\n\n[[继续]]",
        "choices": [
          { "id": "c30_1", "text": "继续" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "31",
      "type": "storyNode",
      "position": { "x": 3900, "y": 1050 },
      "data": {
        "nodeId": 31,
        "text": "你询问右边的杰克。『你认识一个叫安妮的女人吗？』你问。『不认识。』他说。但这个杰克戴了一只耳环。他口袋里藏着什么东西。是一把刀吗？也许这个杰克就是白教堂杀手。\n\n[[继续]]",
        "choices": [
          { "id": "c31_1", "text": "继续" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "32",
      "type": "storyNode",
      "position": { "x": 4800, "y": 900 },
      "data": {
        "nodeId": 32,
        "text": "大侦探米克罗夫特·庞德又漂亮地完成了一天的工作。你回到家里。大侦探米克罗夫特一出手，伦敦的罪犯就危险了。",
        "choices": [],
        "nodeType": "ending"
      }
    },
    {
      "id": "33",
      "type": "storyNode",
      "position": { "x": 4500, "y": 950 },
      "data": {
        "nodeId": 33,
        "text": "船长协助你逮捕了白教堂杀手。你把他带下船，交给了警察。\n\n[[继续]]",
        "choices": [
          { "id": "c33_1", "text": "继续" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "34",
      "type": "storyNode",
      "position": { "x": 2400, "y": 1400 },
      "data": {
        "nodeId": 34,
        "text": "你上前和老人搭话。『您知道一艘叫加利福尼亚人号的船吗？』你问他。『知道，』他说，『它今天去印度，所以现在正在东印度码头。』你必须找到东印度码头。\n\n[[继续]]",
        "choices": [
          { "id": "c34_1", "text": "继续" }
        ],
        "nodeType": "normal"
      }
    },
    {
      "id": "35",
      "type": "storyNode",
      "position": { "x": 1800, "y": 600 },
      "data": {
        "nodeId": 35,
        "text": "你前往莱姆豪斯街。你要找安妮的朋友罗茜。你想先拜访哪所房子？\n\n[[有白色门的房子]]\n[[有蓝色门的房子]]\n[[有红色门的房子]]",
        "choices": [
          { "id": "c35_1", "text": "有白色门的房子" },
          { "id": "c35_2", "text": "有蓝色门的房子" },
          { "id": "c35_3", "text": "有红色门的房子" }
        ],
        "nodeType": "normal"
      }
    }
  ],
  "edges": [
    { "id": "e1-18", "source": "1", "target": "18", "sourceHandle": "c1_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 }, "type": "default", "animated": false },
    { "id": "e2-10", "source": "2", "target": "10", "sourceHandle": "c2_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e2-35", "source": "2", "target": "35", "sourceHandle": "c2_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e3-8", "source": "3", "target": "8", "sourceHandle": "c3_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e3-13", "source": "3", "target": "13", "sourceHandle": "c3_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e4-10", "source": "4", "target": "10", "sourceHandle": "c4_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e5-24", "source": "5", "target": "24", "sourceHandle": "c5_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e5-34", "source": "5", "target": "34", "sourceHandle": "c5_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e6-10", "source": "6", "target": "10", "sourceHandle": "c6_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e6-30", "source": "6", "target": "30", "sourceHandle": "c6_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e7-17", "source": "7", "target": "17", "sourceHandle": "c7_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e7-23", "source": "7", "target": "23", "sourceHandle": "c7_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e7-31", "source": "7", "target": "31", "sourceHandle": "c7_3", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e8-22", "source": "8", "target": "22", "sourceHandle": "c8_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e9-14", "source": "9", "target": "14", "sourceHandle": "c9_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e9-19", "source": "9", "target": "19", "sourceHandle": "c9_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e10-4", "source": "10", "target": "4", "sourceHandle": "c10_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e10-6", "source": "10", "target": "6", "sourceHandle": "c10_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e10-15", "source": "10", "target": "15", "sourceHandle": "c10_3", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e10-28", "source": "10", "target": "28", "sourceHandle": "c10_4", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e11-19", "source": "11", "target": "19", "sourceHandle": "c11_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e12-5", "source": "12", "target": "5", "sourceHandle": "c12_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e12-20", "source": "12", "target": "20", "sourceHandle": "c12_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e12-29", "source": "12", "target": "29", "sourceHandle": "c12_3", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e13-7", "source": "13", "target": "7", "sourceHandle": "c13_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e14-11", "source": "14", "target": "11", "sourceHandle": "c14_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e15-10", "source": "15", "target": "10", "sourceHandle": "c15_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e15-30", "source": "15", "target": "30", "sourceHandle": "c15_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e16-9", "source": "16", "target": "9", "sourceHandle": "c16_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e17-7", "source": "17", "target": "7", "sourceHandle": "c17_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e18-25", "source": "18", "target": "25", "sourceHandle": "c18_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e18-10", "source": "18", "target": "10", "sourceHandle": "c18_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e19-12", "source": "19", "target": "12", "sourceHandle": "c19_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e20-12", "source": "20", "target": "12", "sourceHandle": "c20_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e21-16", "source": "21", "target": "16", "sourceHandle": "c21_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e23-7", "source": "23", "target": "7", "sourceHandle": "c23_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e24-5", "source": "24", "target": "5", "sourceHandle": "c24_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e25-18", "source": "25", "target": "18", "sourceHandle": "c25_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e26-35", "source": "26", "target": "35", "sourceHandle": "c26_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e27-33", "source": "27", "target": "33", "sourceHandle": "c27_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e28-10", "source": "28", "target": "10", "sourceHandle": "c28_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e28-35", "source": "28", "target": "35", "sourceHandle": "c28_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e29-3", "source": "29", "target": "3", "sourceHandle": "c29_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e29-22", "source": "29", "target": "22", "sourceHandle": "c29_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e30-2", "source": "30", "target": "2", "sourceHandle": "c30_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e31-27", "source": "31", "target": "27", "sourceHandle": "c31_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e33-32", "source": "33", "target": "32", "sourceHandle": "c33_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e34-12", "source": "34", "target": "12", "sourceHandle": "c34_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e35-16", "source": "35", "target": "16", "sourceHandle": "c35_1", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e35-21", "source": "35", "target": "21", "sourceHandle": "c35_2", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } },
    { "id": "e35-26", "source": "35", "target": "26", "sourceHandle": "c35_3", "markerEnd": { "type": "ArrowClosed", "width": 20, "height": 20, "color": "#6366f1" }, "type": "default", "animated": false, "style": { "stroke": "#6366f1", "strokeWidth": 2.5 } }
  ],
  "variables": [],
  "createdAt": new Date().toISOString(),
  "updatedAt": new Date().toISOString()
} as unknown as Story;
