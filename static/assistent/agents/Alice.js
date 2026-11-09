// Alice — ассистент ZESP: управляющая/технический консультант.
// Все 8 строк — кадры из видео Gemini (10 с, 720×1280, 720p chibi-секретарь):
// зелёный chroma key вырезан, деспилл, единый масштаб 0.197, выравнивание по
// стопам и базовой линии 236, кадр 160x240.
// Сетка 24 колонки x 8 строк, кадр 160x240. Координаты = [col*160, row*240].
// Строки: 0 idle (24), 1 listen, 2 think, 3 success, 4 error, 5 wave, 6 shy, 7 pose.
// Error и Shy в источнике отсутствуют — временно дублируют Idle.
// Строка 6 (shy) — отдельное видео Gemini 920bd0e6 (застёгивает блузку),
// строка 4 (error) — b8517bde (пожимание плечами), строка 2 (think) — e2a7429a (палец у подбородка).
var FW = 160, FH = 240;
var R_IDLE = 0, R_LISTEN = 1, R_THINK = 2, R_SUCCESS = 3,
    R_ERROR = 4, R_WAVE = 5, R_SHY = 6, R_POSE = 7;
var IDLE_FRAMES = 24;

function f(c, r, dur, opts) {
  var fr = { duration: dur || 200, images: [[c * FW, r * FH]] };
  if (opts && opts.exit !== undefined) fr.exitBranch = opts.exit;
  if (opts && opts.branch !== undefined) {
    fr.branching = { branches: [{ frameIndex: opts.branch, weight: opts.weight || 90 }] };
  }
  return fr;
}

var A = {
  name: "Alice",
  image: "/static/assistent/agents/alice.png?v=11",
  config: {
    overlayCount: 1,
    framesize: [FW, FH],
    animations: {
      Show: { frames: [f(0, R_IDLE, 260), f(1, R_IDLE, 320), f(0, R_IDLE, 280)] },
      Hide: { frames: [f(0, R_IDLE, 260)] },

      // две близкие стойки (руки вниз) — переключение почти незаметно
      Stand: { frames: (function(){ var a=[]; for (var i=0;i<IDLE_FRAMES;i++) a.push(f(i, R_IDLE, 167)); return a; })() },
      Emote: { frames: [f(0, R_IDLE, 600), f(1, R_POSE, 900), f(2, R_POSE, 900), f(1, R_POSE, 900)] },

      // рука у уха — 4 близкие фазы
      Listen: { frames: [f(3, R_LISTEN, 550), f(4, R_LISTEN, 500), f(5, R_LISTEN, 500), f(6, R_LISTEN, 500), f(7, R_LISTEN, 450)] },
      CheckingSomething: { frames: [f(3, R_LISTEN, 420), f(4, R_LISTEN, 420), f(5, R_LISTEN, 420)] },

      // палец у подбородка — 4 близкие фазы
      Thinking: { frames: [f(1, R_THINK, 650), f(2, R_THINK, 600), f(3, R_THINK, 600), f(4, R_THINK, 550)] },
      Processing: { frames: [f(1, R_THINK, 420), f(2, R_THINK, 420), f(3, R_THINK, 420), f(4, R_THINK, 420)] },

      Explain: { frames: [f(4, R_SUCCESS, 450), f(5, R_SUCCESS, 500), f(6, R_SUCCESS, 500)] },
      Congratulate: { frames: [f(5, R_SUCCESS, 450), f(6, R_SUCCESS, 450), f(7, R_SUCCESS, 450), f(3, R_POSE, 700), f(0, R_IDLE, 300)] },
      Acknowledge: { frames: [f(0, R_SUCCESS, 300), f(1, R_SUCCESS, 450), f(0, R_IDLE, 260)] },

      Alert: { frames: [f(1, R_ERROR, 500), f(2, R_ERROR, 500), f(3, R_ERROR, 500)] },

      Wave: { frames: [f(1, R_WAVE, 240), f(2, R_WAVE, 260), f(3, R_WAVE, 260), f(4, R_WAVE, 260), f(5, R_WAVE, 260), f(6, R_WAVE, 260)] },

      // смущение: прикрылась → отвернулась → выглянула
      Shy: { frames: [f(2, R_SHY, 450), f(3, R_SHY, 550), f(4, R_SHY, 700), f(5, R_SHY, 700), f(6, R_SHY, 550), f(0, R_IDLE, 300)] },
      ClickedOn: { frames: [f(4, R_SHY, 140), f(5, R_SHY, 150), f(6, R_SHY, 160), f(7, R_SHY, 160),
                            f(8, R_SHY, 160), f(9, R_SHY, 160), f(10, R_SHY, 170), f(11, R_SHY, 170)] },

      Pose: { frames: [f(0, R_POSE, 900), f(1, R_POSE, 900), f(2, R_POSE, 900)] },
      Dance: { frames: [f(0, R_POSE, 500), f(1, R_POSE, 500), f(2, R_POSE, 500), f(1, R_POSE, 500)] },

      GestureRight: { frames: [f(5, R_SUCCESS, 380), f(0, R_IDLE, 240)] },
      GestureLeft: { frames: [f(2, R_ERROR, 380), f(0, R_IDLE, 240)] },
      GestureUp: { frames: [f(8, R_THINK, 380), f(0, R_IDLE, 240)] },
      GestureDown: { frames: [f(4, R_THINK, 380), f(0, R_IDLE, 240)] },

      LookUp: { frames: [f(8, R_THINK, 380), f(0, R_IDLE, 240)] },
      LookDown: { frames: [f(2, R_THINK, 380), f(0, R_IDLE, 240)] },
      LookLeft: { frames: [f(4, R_LISTEN, 380), f(0, R_IDLE, 240)] },
      LookRight: { frames: [f(6, R_LISTEN, 380), f(0, R_IDLE, 240)] },

      MoveRight: { frames: [f(0, R_IDLE, 420)] },
      MoveLeft: { frames: [f(0, R_IDLE, 420)] },
      MoveUp: { frames: [f(0, R_IDLE, 420)] },
      MoveDown: { frames: [f(0, R_IDLE, 420)] }
    }
  }
};

export { A as default };

