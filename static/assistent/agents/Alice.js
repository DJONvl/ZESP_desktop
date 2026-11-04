// Alice — ассистент ZESP в виде аниме-персонажа.
// Спрайт-лист собран из rpg-спрайт-листа (покадровая нарезка) инструментами
// tools/alicesprite: ccextract (компоненты) + compose (сборка 880x510, кадр 110x170).
// Сетка 8 колонок; координаты = [col*110, row*170].
var FW = 110, FH = 170;

function f(x, y, dur, opts) {
  var fr = { duration: dur || 120, images: [[x, y]] };
  if (opts && opts.exit !== undefined) fr.exitBranch = opts.exit;
  if (opts && opts.branch !== undefined) {
    fr.branching = { branches: [{ frameIndex: opts.branch, weight: opts.weight || 90 }] };
  }
  return fr;
}

// кадры
var C = {
  base: [0, 0],       // стоит
  idle2: [110, 0],    // стоит, вторая фаза
  walk1: [220, 0], walk2: [330, 0], walk3: [440, 0], walk4: [550, 0],
  idle3: [660, 0], idle4: [770, 0],
  emote1: [0, 170],   // руки к голове (удивление)
  emote2: [110, 170],
  pose1: [220, 170], pose2: [330, 170], pose3: [440, 170], pose4: [550, 170],
  pose5: [660, 170], pose6: [770, 170],
  pose7: [0, 340], pose8: [110, 340], pose9: [220, 340]
};

var A = {
  name: "Alice",
  image: "/static/assistent/agents/alice.png",
  config: {
    overlayCount: 1,
    framesize: [FW, FH],
    animations: {
      Show: { frames: [f(C.base[0], C.base[1], 250), f(C.base[0], C.base[1], 150)] },
      Hide: { frames: [f(C.base[0], C.base[1], 200)] },

      Wave: {
        frames: [
          f(C.base[0], C.base[1], 130),
          f(C.pose7[0], C.pose7[1], 160),
          f(C.base[0], C.base[1], 130),
          f(C.pose8[0], C.pose8[1], 160),
          f(C.base[0], C.base[1], 160)
        ]
      },
      GetAttention: {
        frames: [
          f(C.base[0], C.base[1], 110),
          f(C.emote1[0], C.emote1[1], 150),
          f(C.base[0], C.base[1], 110),
          f(C.emote1[0], C.emote1[1], 150),
          f(C.base[0], C.base[1], 150)
        ]
      },
      Congratulate: {
        frames: [
          f(C.pose1[0], C.pose1[1], 150),
          f(C.pose2[0], C.pose2[1], 150),
          f(C.pose4[0], C.pose4[1], 150),
          f(C.pose7[0], C.pose7[1], 150),
          f(C.pose1[0], C.pose1[1], 150),
          f(C.base[0], C.base[1], 200)
        ]
      },

      IdleStand: {
        frames: [
          f(C.base[0], C.base[1], 450, { branch: 0, weight: 92 }),
          f(C.idle2[0], C.idle2[1], 400),
          f(C.idle3[0], C.idle3[1], 450),
          f(C.idle4[0], C.idle4[1], 400)
        ]
      },
      IdleEmote: {
        frames: [
          f(C.base[0], C.base[1], 300, { branch: 0, weight: 92 }),
          f(C.emote1[0], C.emote1[1], 350),
          f(C.emote2[0], C.emote2[1], 400),
          f(C.pose3[0], C.pose3[1], 350)
        ]
      },

      MoveRight: { frames: [f(C.walk1[0], C.walk1[1], 130), f(C.walk2[0], C.walk2[1], 130), f(C.walk3[0], C.walk3[1], 130), f(C.walk4[0], C.walk4[1], 130)] },
      MoveLeft: { frames: [f(C.walk2[0], C.walk2[1], 130), f(C.walk1[0], C.walk1[1], 130), f(C.walk4[0], C.walk4[1], 130), f(C.walk3[0], C.walk3[1], 130)] },
      MoveUp: { frames: [f(C.walk1[0], C.walk1[1], 130), f(C.walk3[0], C.walk3[1], 130)] },
      MoveDown: { frames: [f(C.walk2[0], C.walk2[1], 130), f(C.walk4[0], C.walk4[1], 130)] },

      GestureRight: { frames: [f(C.pose5[0], C.pose5[1], 160), f(C.base[0], C.base[1], 150)] },
      GestureLeft: { frames: [f(C.pose6[0], C.pose6[1], 160), f(C.base[0], C.base[1], 150)] },
      GestureUp: { frames: [f(C.pose7[0], C.pose7[1], 170), f(C.base[0], C.base[1], 150)] },
      GestureDown: { frames: [f(C.pose9[0], C.pose9[1], 170), f(C.base[0], C.base[1], 150)] },

      ClickedOn: {
        frames: [
          f(C.emote1[0], C.emote1[1], 120),
          f(C.emote2[0], C.emote2[1], 140),
          f(C.emote1[0], C.emote1[1], 120),
          f(C.base[0], C.base[1], 150)
        ]
      },
      Processing: {
        frames: [
          f(C.base[0], C.base[1], 150, { branch: 0, weight: 85 }),
          f(C.walk1[0], C.walk1[1], 160),
          f(C.pose3[0], C.pose3[1], 160),
          f(C.walk3[0], C.walk3[1], 160)
        ]
      },
      Thinking: {
        frames: [
          f(C.base[0], C.base[1], 150, { branch: 0, weight: 85 }),
          f(C.emote2[0], C.emote2[1], 250),
          f(C.emote2[0], C.emote2[1], 300),
          f(C.pose4[0], C.pose4[1], 250)
        ]
      },

      LookUp: { frames: [f(C.pose7[0], C.pose7[1], 220), f(C.base[0], C.base[1], 150)] },
      LookDown: { frames: [f(C.pose9[0], C.pose9[1], 250), f(C.base[0], C.base[1], 150)] },
      LookLeft: { frames: [f(C.pose6[0], C.pose6[1], 250), f(C.base[0], C.base[1], 150)] },
      LookRight: { frames: [f(C.pose5[0], C.pose5[1], 250), f(C.base[0], C.base[1], 150)] }
    }
  }
};

export { A as default };
