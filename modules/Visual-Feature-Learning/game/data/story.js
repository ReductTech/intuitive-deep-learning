(function (global) {
  'use strict';
  var game = global.Act3DisguiseGame;
  game.cutscene = game.cutscene || {};
  // Text and legacy duration metadata; dialogue advances by click/space as before.
  game.cutscene.story = {
    password: [
      { speaker: '？？？', text: '谁呀，店打烊了...', duration: 1200 },
      { speaker: '林墨', text: '我走错路了', duration: 1300 },
      { speaker: '？？？', text: '先生去哪？', duration: 1200 },
      { speaker: '林墨', text: '三槐巷', duration: 1100 },
      { speaker: '？？？', text: '三槐巷里没有路', duration: 1400 },
      { speaker: '林墨', text: '后院井中没有水', duration: 1400 },
      { speaker: '门内', text: '……门栓轻响', duration: 1500 },
      { speaker: '？？？', text: '同志，快进来吧！', duration: 1800 }
    ],
    introduction: [
      { speaker: '？？？', text: '我是雨花弄交通员，晚宁', duration: 1700 },
      { speaker: '林墨', text: '城东交通员，林墨', duration: 1500 },
      { speaker: '晚宁', text: '通缉令上见过你，后面没人吧？', duration: 1300 },
      { speaker: '林墨', text: '甩掉了~', duration: 1500 },
    ],
    inspectionGreeting: [
      { speaker: '军官', text: '就你们两个人？', duration: 1300 },
      { speaker: '晚宁', text: '是的', duration: 1000 },
      { speaker: '军官', text: '见过这个人吗？', duration: 1400 }
    ],
    inspectionPassed: [
        { speaker: '军官', text: '明早之前，不准出门', duration: 1600 },
        { speaker: '晚宁', text: '是，长官', duration: 1000 }
      ],
    farewell: [
        { speaker: '晚宁', text: '天亮前从西门出城，那边的岗最松', duration: 1800 },
        { speaker: '林墨', text: '这张脸真能骗过去？', duration: 1500 },
        { speaker: '晚宁', text: '只要关键特征变了，他们就认不出你了', duration: 1700 },
        { speaker: '林墨', text: '那你呢？', duration: 1000 },
        { speaker: '晚宁', text: '总得有人继续开这扇门，后会有期！', duration: 2200 },
        { speaker: '林墨', text: '保重！', duration: 1200 }
      ],
    dresserInvitation: { speaker: '晚宁', text: '那你不能再这样出去，去梳妆台等我，我有办法让他们认不出你', duration: 2900 },
    dresserReady: { speaker: '晚宁', text: '事不宜迟，我们开始吧', duration: 1600 },
    notSeen: { speaker: '晚宁', text: '没见过', duration: 1100 },
    questionPlayer: { speaker: '军官', text: '你呢？', duration: 1000 },
    playerReply: { speaker: '林墨', text: '看着像个麻烦人', duration: 1500 },
    officerChallenge: { speaker: '军官', text: '你倒干净？', duration: 1200 },
    playerDefense: { speaker: '林墨', text: '我胆小，不惹麻烦', duration: 1500 },
    turnCivil: { speaker: '军官', text: '都站好，先查她，转一圈', duration: 1700 },
    turnPlayer: { speaker: '军官', text: '胆小的人……到你了转一圈', duration: 1700 },
    arrest: { speaker: '军官', text: '你装得挺像，可惜不像别人，带走！', duration: 2100 },
  };
}(window));
