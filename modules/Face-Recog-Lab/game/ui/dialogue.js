(function (global) {
  'use strict';

  var game = global.Act3DisguiseGame = global.Act3DisguiseGame || {};
  var constants = game.constants;
  var SCENE_WIDTH = constants.SCENE_WIDTH;
  var SCENE_HEIGHT = constants.SCENE_HEIGHT;
  var UI_DEPTH = constants.UI_DEPTH;

  function wait(scene, duration) {
    return new Promise(function (resolve) {
      scene.time.delayedCall(duration, resolve);
    });
  }

  async function showDialogueLines(scene, lines) {
    for (var i = 0; i < lines.length; i += 1) {
      await scene.dialogue.show(lines[i].speaker, lines[i].text, lines[i].duration);
    }
  }

  function waitForAdvance(scene, targets) {
    return new Promise(function (resolve) {
      var done = false;
      function handleKey(event) {
        if (!event || (event.code !== 'Space' && event.key !== ' ' && event.keyCode !== 32) || event.repeat) return;
        event.preventDefault();
        finish();
      }
      function finish() {
        if (done) return;
        done = true;
        scene.input.off('pointerdown', finish);
        (targets || []).forEach(function (target) {
          target.off('pointerdown', finish);
        });
        if (scene.input.keyboard) {
          scene.input.keyboard.off('keydown', handleKey);
        }
        resolve();
      }
      scene.input.on('pointerdown', finish);
      (targets || []).forEach(function (target) {
        target.on('pointerdown', finish);
      });
      if (scene.input.keyboard) {
        scene.input.keyboard.on('keydown', handleKey);
      }
    });
  }

  function speakerColor(speaker) {
    if (speaker === '林墨') return '#86b7d9';
    if (speaker === '晚宁') return '#8fc6a1';
    if (String(speaker || '').indexOf('日本') >= 0) return '#d3867c';
    return '#f7d68a';
  }

  function createDialogueBox(scene) {
    var box = scene.add.container(0, 0).setDepth(UI_DEPTH + 240).setVisible(false);
    var advanceZone = scene.add.zone(SCENE_WIDTH / 2, SCENE_HEIGHT / 2, SCENE_WIDTH, SCENE_HEIGHT)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    advanceZone.input.enabled = false;
    var panel = scene.add.rectangle(SCENE_WIDTH / 2, SCENE_HEIGHT - 118, SCENE_WIDTH - 144, 150, 0x17110b, 0.92);
    panel.setStrokeStyle(4, 0xd8a65c, 0.92);
    var nameText = scene.add.text(104, SCENE_HEIGHT - 176, '', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: '#f7d68a',
      fontStyle: 'bold'
    });
    var lineText = scene.add.text(104, SCENE_HEIGHT - 132, '', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '28px',
      color: '#fff4df',
      wordWrap: { width: SCENE_WIDTH - 208 }
    });
    var continueText = scene.add.text(SCENE_WIDTH - 198, SCENE_HEIGHT - 82, '点击 / 空格', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '18px',
      color: '#f7d68a'
    }).setOrigin(0.5).setVisible(false);
    box.add([advanceZone, panel, nameText, lineText, continueText]);

    return {
      show: function (speaker, line) {
        nameText.setText(speaker);
        nameText.setColor(speakerColor(speaker));
        lineText.setText('');
        continueText.setVisible(false);
        box.setVisible(true);
        var index = 0;
        return new Promise(function (resolve) {
          var typingComplete = false;
          function skipTyping(event) {
            if (typingComplete) return;
            if (event && event.repeat) return;
            if (event && event.preventDefault) event.preventDefault();
            index = line.length;
            lineText.setText(line);
          }
          function handleTypingKey(event) {
            if (!event || (event.code !== 'Space' && event.key !== ' ' && event.keyCode !== 32)) return;
            skipTyping(event);
          }
          advanceZone.input.enabled = true;
          advanceZone.once('pointerdown', skipTyping);
          if (scene.input.keyboard) scene.input.keyboard.on('keydown', handleTypingKey);
          var timer = scene.time.addEvent({
            delay: 22,
            loop: true,
            callback: function () {
              index = Math.min(line.length, index + 2);
              lineText.setText(line.slice(0, index));
              if (index >= line.length) {
                typingComplete = true;
                timer.remove(false);
                advanceZone.off('pointerdown', skipTyping);
                if (scene.input.keyboard) scene.input.keyboard.off('keydown', handleTypingKey);
                continueText.setVisible(true);
                scene.tweens.add({
                  targets: continueText,
                  alpha: 0.46,
                  duration: 520,
                  yoyo: true,
                  repeat: -1,
                  ease: 'Sine.easeInOut'
                });
                advanceZone.input.enabled = true;
                waitForAdvance(scene, [advanceZone]).then(function () {
                  advanceZone.input.enabled = false;
                  scene.tweens.killTweensOf(continueText);
                  continueText.setAlpha(1);
                  resolve();
                });
              }
            }
          });
        });
      },
      hide: function () {
        advanceZone.input.enabled = false;
        box.setVisible(false);
      }
    };
  }

  game.ui = game.ui || {};
  game.ui.dialogue = {
    wait: wait,
    showDialogueLines: showDialogueLines,
    waitForAdvance: waitForAdvance,
    createDialogueBox: createDialogueBox
  };
}(window));
