
var helpJson = {
  "Settings_APP": "Здесь ты <br>можешь изменить основные настройки программы:<br> язык,<br>помощника,<br>проверить обновление.",
  "SettingsAPPLang": "Выбери язык интерфейса программы.<br>Доступные: английский (en), русский (ru).",
  "SettingsAPPagent": "Выбери помощника,<br>который будет взаимодействовать с тобой.<br>Доступные: Bonzi, Clippy, F1, Genie, Genius и другие.",
  "SettingsAPPversion": "Здесь отображается<br>текущая версия программы (если доступна).",

  "Settings_ZIGBEE": "Настройки для работы с устройствами Zigbee:<br> адаптер,<br>канал,<br>ключи и другие параметры.",
  "SettingsZIGBEEAdapter": "Выбери адаптер Zigbee.<br>Например: zigate, znp, zboss и другие.",
  "SettingsZIGBEETransport": "Укажи интерфейс подключения Zigbee.<br>Например: COMX или /dev/ttymxc1.",
  "SettingsZIGBEESpeed": "Укажи скорость соединения<br>с Zigbee (в бодах).",
  "SettingsZIGBEEChanel": "Выбери канал Zigbee<br>(должен соответствовать настройкам сети).",
  "SettingsZIGBEEPanID": "Укажи идентификатор сети Zigbee<br>(PAN ID).",
  "SettingsZIGBEEExtPanID": "Укажи расширенный идентификатор сети Zigbee<br>(Ext PAN ID).",
  "SettingsZIGBEEKey": "Укажи сетевой ключ Zigbee<br>для обеспечения безопасности.",
  "SettingsZIGBEEmodeRouter": "Выбери режим работы устройства:<br>0 — выключено,<br>1 — включено.",

  "Settings_MQTT": "Настройки подключения MQTT:<br>сервер,<br>порт,<br>авторизация и интеграция с Home Assistant.",
  "SettingsMQTTmqttEnable": "Включи или отключи использование MQTT<br>(0 — выключено,<br>1 — включено).",
  "SettingsMQTTmqttup": "Укажи тему<br>для публикаций в MQTT.",
  "SettingsMQTTmqtt": "Укажи адрес MQTT-сервера<br>(например: 192.168.1.100).",
  "SettingsMQTTmqttPort": "Укажи порт подключения к MQTT<br>(обычно 1883).",
  "SettingsMQTTmqttLogin": "Укажи логин<br>для подключения к MQTT (если требуется).",
  "SettingsMQTTmqttPassw": "Укажи пароль<br>для подключения к MQTT (если требуется).",
  "SettingsMQTTHome_Assistant": "Включи или отключи экспорт<br>в Home Assistant.",
  "SettingsMQTTmqttDiscowery": "Включи автоматическое<br>обнаружение устройств в MQTT.<br>для импорта устройств",
  "SettingsMQTTDiscoweryAdr": "Укажи адрес<br>для автоматического обнаружения устройств.",
  "SettingsMQTTDiscoweryPort": "Укажи порт<br>для автоматического обнаружения устройств.",
  "SettingsMQTTDiscoweryPrefix": "Укажи префикс<br>для тем автоматического обнаружения устройств.",

  "Settings_Telegram_Bot": "Настройки для Telegram-бота:<br>токен,<br>пароль и идентификатор чата.",
  "SettingsTelegram_BotEnable": "Включи или отключи Telegram-бота<br>(0 — выключено,<br>1 — включено).",
  "SettingsTelegram_Botbot_token": "Укажи токен Telegram-бота<br>для связи.",
  "SettingsTelegram_Botpassword": "Укажи пароль<br>для авторизации в боте.",
  "SettingsTelegram_Botchat_id": "Укажи идентификатор чата Telegram<br>для взаимодействия.",

  "Settings_ZIGBEE2MQTT": "Настройки для интеграции<br>с Zigbee2MQTT.",
  "SettingsZIGBEE2MQTTz2m_Enable": "Включи или отключи Zigbee2MQTT<br>(0 — выключено,<br>1 — включено).",
  "SettingsZIGBEE2MQTTinternal": "Выбери внутренний режим<br>работы Zigbee2MQTT<br>(1 — включено,<br>0 — выключено).",
  "SettingsZIGBEE2MQTTz2m_ip": "Укажи IP-адрес сервера<br>Zigbee2MQTT.",
  "SettingsZIGBEE2MQTTz2m_port": "Укажи порт сервера<br>Zigbee2MQTT<br>(обычно 8090).",

  "Settings_Ya": "Настройки для интеграции<br>с сервисами Яндекса.",
  "SettingsYaya_Enable": "Включи или отключи интеграцию<br>с Яндексом<br>(0 — выключено,<br>1 — включено).",
  "SettingsYaac_id": "Укажи ID аккаунта<br>Яндекса.",
  "SettingsYaac_login": "Укажи логин аккаунта<br>Яндекса.",
  "SettingsYaac_pass": "Укажи пароль аккаунта<br>Яндекса.",
  "SettingsYaya_Import": "Включи импорт данных<br>из Яндекса<br>(0 — выключено,<br>1 — включено).",
  "SettingsYaya_Sid": "Укажи SID<br>для работы с Яндексом.",
  "SettingsYaya_Token": "Укажи токен доступа<br>для Яндекса.",

  "Settings_Weather": "Настройки для получения данных<br>о погоде.",
  "SettingsWeatherWeather_ApiKey": "Укажи API-ключ для доступа<br>к данным о погоде:<br><a target='_blank' href='https://www.weatherapi.com/'>weatherapi.com</a>.",
  "SettingsWeatherWeather_City": "Укажи город<br>для отображения прогноза погоды.",

  "Settings_HomeAssistant": "Настройки интеграции<br>с Home Assistant.",
  "SettingsHomeAssistantha_Enable": "Включи или отключи интеграцию<br>с Home Assistant.",
  "SettingsHomeAssistantha_ip": "Укажи IP-адрес и порт<br>сервера Home Assistant.",
  "SettingsHomeAssistantha_authToken": "Укажи токен авторизации<br>для Home Assistant."
};






// Поколение загрузки: каждый новый loadAgent отменяет предыдущий незавершённый.
// Без этого повторный jsconfig или смена персонажа во время загрузки вставляли
// второго агента в тот же #assistagent — два div.clippy накладывались друг на друга.
var _agentGen=0;
var _agentWait=null;

function _dropAgent(){
 if(!window.agent)return;
 try{if(window.agent.stop)window.agent.stop()}catch(e){}
 try{if(window.agent._balloon&&window.agent._balloon._balloon)window.agent._balloon._balloon.remove()}catch(e){}
 try{if(window.agent._el)window.agent._el.remove()}catch(e){}
 window.agent=null;
}

loadAgent=function(aname,cb){
 var gen=++_agentGen;
 if(typeof window.clippy==='undefined'){
  // один общий таймер ожидания модуля clippy (раньше каждый вызов создавал свой)
  if(_agentWait)clearInterval(_agentWait);
  _agentWait=setInterval(function(){
   if(window.clippy){clearInterval(_agentWait);_agentWait=null;loadAgent(aname,cb)}
  },50);
  return;
 }
 _dropAgent();
 // Круглая 🤖 — фолбек на случай, если спрайт не загрузился: пока идёт
 // загрузка видна, после успеха прячется (см. successCb).
 var trig=document.getElementById('clippyTrigger');if(trig)trig.style.display='flex';
 var _cont=document.querySelector('.assistagent');
 if(_cont)_cont.innerHTML=''
 try{
 clippy.load({
    name: aname,
    selector: 'assistagent',
  	successCb: (loadedAgent) => {
    	if(gen!==_agentGen){ // эту загрузку уже перекрыл следующий loadAgent
    		try{if(loadedAgent&&loadedAgent.stop)loadedAgent.stop()}catch(e){}
    		try{if(loadedAgent&&loadedAgent._balloon&&loadedAgent._balloon._balloon)loadedAgent._balloon._balloon.remove()}catch(e){}
    		try{if(loadedAgent&&loadedAgent._el)loadedAgent._el.remove()}catch(e){}
    		return;
    	}
    	console.log("Loaded!");
		agent = loadedAgent;
		// спрайт на месте — фолбек-кнопка больше не нужна
		var _t=document.getElementById('clippyTrigger');if(_t)_t.style.display='none';
    	agent.show();
      agent.animate();
      setTimeout(function(){agent.play('Wave')},600);
      // Каждая анимация доигрывает весь цикл: новый play() во время неё не обрывает
      // середину, а встаёт в очередь (один слот). Фоновую стойку (Stand/Idle) прерывать можно.
      (function(){
        var origPlay=agent.play.bind(agent);
        var busyUntil=0,pendingName=null,pendingTimer=null;
        agent.play=function(name){
          var an=agent._animator||{};
          var anims=(an._data&&an._data.animations)||{};
          // Клик по спрайту: не одна фиксированная анимация, а случайная из выразительных.
          if(name==='ClickedOn'){
            var pool=['Wave','Shy','Pose','Emote','Explain','Congratulate','Listen','Thinking','Alert','Dance','Acknowledge'];
            var avail=[];for(var k=0;k<pool.length;k++){if(anims[pool[k]])avail.push(pool[k])}
            if(avail.length)name=avail[Math.floor(Math.random()*avail.length)];
          }
          if(!anims[name])return origPlay(name);
          var now=Date.now(),cur=an.currentAnimationName;
          var isIdle=(!cur||/^(Stand|Idle|Show|Hide)/i.test(cur));
          if(!isIdle&&now<busyUntil){
            pendingName=name;
            if(pendingTimer)clearTimeout(pendingTimer);
            pendingTimer=setTimeout(function(){
              var n=pendingName;pendingName=null;pendingTimer=null;
              if(n&&agent)agent.play(n);
            },Math.max(0,busyUntil-now)+15);
            return true;
          }
          var fr=(anims[name]&&anims[name].frames)||[];
          var dur=0;for(var i=0;i<fr.length;i++)dur+=(fr[i].duration||0);
          busyUntil=isIdle?0:(now+(dur||400));
          return origPlay(name);
        };
        // Случайное поведение (двойной клик, если нет ClickedOn) — только из выразительных,
        // без Hide/Move/Idle, иначе агент прячется или просто стоит.
        agent.animate=function(){
          var an=agent._animator||{};
          var anims=(an._data&&an._data.animations)||{};
          var pool=['Wave','Shy','Pose','Emote','Explain','Congratulate','Listen','Thinking','Alert','Dance','Acknowledge'];
          var avail=[];for(var k=0;k<pool.length;k++){if(anims[pool[k]])avail.push(pool[k])}
          if(!avail.length)return false;
          return agent.play(avail[Math.floor(Math.random()*avail.length)]);
        };
      })();
      var _el=agent._el;if(_el){_el.style.position='fixed';_el.style.bottom='';_el.style.right='';var _zz=(window.getZoom?window.getZoom():1),_w=_el.offsetWidth||124,_h=_el.offsetHeight||124;_el.style.left=(window.innerWidth/_zz-_w-20)+'px';_el.style.top=(window.innerHeight/_zz-_h-20)+'px'};
      // --- zoom fix for clippy: the library computes position/drag in viewport px ---
      (function(){
        var gz=function(){return (window.getZoom?window.getZoom():1)};
        var vw=function(){return window.innerWidth/gz()};
        var vh=function(){return window.innerHeight/gz()};
        function fixAgent(){var el=agent._el,w=el.offsetWidth||124,h=el.offsetHeight||124,l=parseFloat(el.style.left),t=parseFloat(el.style.top);if(!isFinite(l)||!isFinite(t)||l<-w||t<-h||l>vw()||t>vh()){el.style.left=(vw()-w-20)+'px';el.style.top=(vh()-h-20)+'px'}}
        var origShow=agent.show.bind(agent);
        agent.show=function(t){var r=origShow(t);fixAgent();return r};
        var origRepos=agent.reposition.bind(agent);
        agent.reposition=function(){if(gz()===1)return origRepos();var el=agent._el,w=el.offsetWidth||124,h=el.offsetHeight||124,l=parseFloat(el.style.left)||0,t=parseFloat(el.style.top)||0;el.style.left=Math.max(0,Math.min(l,vw()-w))+'px';el.style.top=Math.max(0,Math.min(t,vh()-h))+'px';if(agent._balloon)agent._balloon.reposition()};
        agent._startDrag=function(e){this.pause();this._zoff={sx:(e.pageX!==undefined?e.pageX:e.clientX),sy:(e.pageY!==undefined?e.pageY:e.clientY),bx:parseFloat(this._el.style.left)||this._el.offsetLeft||0,by:parseFloat(this._el.style.top)||this._el.offsetTop||0};this._offset={left:0,top:0};this._targetX=this._zoff.bx;this._targetY=this._zoff.by;this._moveHandle=this._dragMove.bind(this);this._upHandle=this._finishDrag.bind(this);window.addEventListener('mousemove',this._moveHandle);window.addEventListener('mouseup',this._upHandle);this._dragUpdateLoop=window.setTimeout(this._updateLocation.bind(this),10)};
        agent._dragMove=function(t){try{t.preventDefault()}catch(e){}if(!this._zoff)return;var z=gz(),cx=(t.clientX!==undefined?t.clientX:t.pageX),cy=(t.clientY!==undefined?t.clientY:t.pageY);this._targetX=this._zoff.bx+(cx-this._zoff.sx)/z;this._targetY=this._zoff.by+(cy-this._zoff.sy)/z};
        var origFinish=agent._finishDrag.bind(agent);
        agent._finishDrag=function(){this._zoff=null;return origFinish()};
      })();
      // ── embed the chat into the balloon ──
      var bal=agent._balloon._balloon, cnt=agent._balloon._content;
      if(bal&&cnt){
       bal.style.minWidth='0';bal.style.maxWidth='360px';bal.style.background='#1a1a2e';bal.style.color='#e0e0e0';bal.style.border='1px solid #2a2a3a';bal.style.borderRadius='12px';bal.style.padding='0';bal.style.boxShadow='0 4px 20px rgba(0,0,0,0.5)';
       // Поля запрещены: библиотечные _position/_isOut их не учитывают и
       // объявляют «за экраном» все позиции (D-F65).
       bal.style.margin='0';
       bal.style.fontFamily="'Segoe UI',Tahoma,sans-serif";bal.style.fontSize='13px';bal.style.cursor='default';
       cnt.style.maxWidth='none';cnt.style.minWidth='auto';cnt.style.padding='0';cnt.style.lineHeight='1.4';
       cnt.innerHTML='<div id="zcMsgs" style="overflow-y:auto;padding:8px;min-height:60px;max-height:200px;scrollbar-width:thin;scrollbar-color:#2a2a3a #0f0f1a;"></div><div id="zcMicBar"><div class="zc-bar-track"><i class="zc-bar-fill"></i></div><span class="zc-bar-db">—</span></div><div id="zcRow" style="display:flex;padding:6px 8px;border-top:1px solid #2a2a3a;gap:4px;"><button id="zcMic" style="background:#2a2a3a;border:none;padding:6px 8px;border-radius:8px;color:#aaa;cursor:pointer;font-size:13px;" title="Сказать голосом">🎤</button><input id="zcIn" placeholder="Напишите..." autocomplete="off" x-webkit-speech style="flex:1;min-width:0;background:#0f0f1a;border:1px solid #2a2a3a;padding:6px 10px;border-radius:8px;color:#fff;font-size:13px;outline:none;"><button id="zcSend" style="background:#2a2a3a;border:none;padding:6px 8px;border-radius:8px;color:#aaa;cursor:pointer;font-size:13px;" title="Отправить">➤</button><button id="zcSpk" style="background:#2a2a3a;border:none;padding:6px 8px;border-radius:8px;color:#aaa;cursor:pointer;font-size:13px;" title="Озвучка ответов">🔊</button></div>';
       // ── геометрия панели: считаем сами, всегда внутри вьюпорта ──
       // ClippyJS ставит balloon через _position/_isOut: они не знают про
       // CSS-zoom и поля, а при узком окне объявляют «за экраном» все четыре
       // позиции — панель уходит под нижнюю границу (D-F65). Плюс центр
       // экрана при открытии давал скачок после первого сообщения (D-F66).
       var zcPanel={open:false,dismissed:false};
       var zcZoom=function(){return (window.getZoom?window.getZoom():1)||1};
       var zcPlace=function(){
         if(!bal||bal.hasAttribute('hidden'))return; // у скрытой мерять нечего
         var z=zcZoom(),pad=8,vw=(window.innerWidth||0)/z,vh=(window.innerHeight||0)/z;
         // ширину задаём явно: shrink-to-fit зависит от left и кламп не держится
         var w=Math.min(360,Math.max(220,vw-pad*2));
         bal.style.width=w+'px';
         var h=bal.offsetHeight||0;
         var r=_el.getBoundingClientRect();
         var sx=r.left/z,sy=r.top/z,sw=r.width/z,sh=r.height/z;
         var left=sx+sw-w, top=sy-h-12;       // над головой, право по правому краю
         if(top<pad){                          // сверху не влезает — вбок
           top=Math.max(pad,Math.min(vh-h-pad,sy+(sh-h)/2));
           left=sx-w-10;
           if(left<pad)left=sx+sw+10;
         }
         left=Math.max(pad,Math.min(vw-w-pad,left));
         top=Math.max(pad,Math.min(vh-h-pad,top));
         bal.style.left=left+'px';bal.style.top=top+'px';
       };
       var zcShow=function(focus){
         if(!bal)return;
         agent._balloon._hidden=false;        // этим флагом библиотека гасит показ
         bal.removeAttribute('hidden');
         zcPanel.open=true;zcPanel.dismissed=false;
         zcPlace();
         if(focus){var i=document.getElementById('zcIn');if(i)i.focus()}
         // Микрофон недоступен — сразу предлагаем скрипт политики, а не
         // «ошибку сети» после нажатия на 🎤 (D-F79).
         if(focus&&zcMicState()!=='ok')zcMicHelp();
       };
       var zcHide=function(){
         if(!bal||bal.hasAttribute('hidden'))return;
         bal.setAttribute('hidden','true');
         zcPanel.open=false;zcPanel.dismissed=true;
       };
       var zcIsOpen=function(){return !!bal&&!bal.hasAttribute('hidden')};
       var zcToggle=function(focus){if(!bal)return;if(zcIsOpen())zcHide();else zcShow(focus)};
       window.zcToggleBalloon=function(){zcToggle(true)};
       // библиотечные вызовы reposition (resize, drag, speak) ведут сюда
       agent._balloon.reposition=function(){zcPlace()};
       // клик по спрайту не открывает панель сам — только двойной клик
       agent._balloon.show=function(){};
       var _zcAgentRepos=agent.reposition.bind(agent);
       agent.reposition=function(){var r=_zcAgentRepos();if(zcPanel.open)zcPlace();return r};
       window.addEventListener('resize',function(){if(zcPanel.open)zcPlace()});
       if(typeof window.setZoom==='function'){var _zcSetZoom=window.setZoom;window.setZoom=function(v){var r=_zcSetZoom(v);if(zcPanel.open)setTimeout(zcPlace,0);return r}}
       // Сообщения добавляются не только из чат-флоу (ошибка микрофона, ошибка
       // LLM) — панель растёт, и её надо возвращать к голове спрайта.
       if(window.MutationObserver){new MutationObserver(function(){if(zcPanel.open)zcPlace()}).observe(document.getElementById('zcMsgs'),{childList:true})}
       // styles for the scrollbar in zcMsgs
       var st=document.createElement('style');st.textContent='#zcMsgs::-webkit-scrollbar{width:4px}#zcMsgs::-webkit-scrollbar-track{background:#0f0f1a}#zcMsgs::-webkit-scrollbar-thumb{background:#2a2a3a;border-radius:4px}#zcMsgs>div{padding:4px 8px;margin:2px 0;border-radius:8px;font-size:12px;white-space:pre-wrap;word-break:break-word;user-select:text;cursor:pointer;transition:opacity.15s}#zcMsgs>div.zc-user{background:#0d4a5c;color:#e0f0ff}#zcMsgs>div.zc-asst{background:#2a2a3a;color:#e0e0e0;border:1px solid #3a3a4a}#zcMsgs>div.zc-err{background:#3a1a1a;color:#f66;border:1px solid #5a2a2a}#zcMsgs>div.zc-wait{color:#888;font-style:italic}#zcMsgs>div.zc-mic-fix{background:#16202c;border:1px solid #2f4a66;color:#cfe0f5;cursor:default;line-height:1.45}#zcMsgs>div.zc-mic-fix .zc-mic-head{color:#ff9b9b;font-weight:600;margin-bottom:3px}#zcMsgs>div.zc-mic-fix .zc-mic-btn{display:inline-block;margin:8px 0 4px;padding:6px 11px;border-radius:7px;background:#12395c;border:1px solid #2a5d8f;color:#8fc6ff;text-decoration:none;font-size:12px;cursor:pointer}#zcMsgs>div.zc-mic-fix .zc-mic-btn:hover{border-color:#4c9aff;color:#cfe6ff}#zcMsgs>div.zc-mic-fix .zc-mic-btn:disabled{opacity:.55;cursor:default}#zcMsgs>div.zc-mic-fix .zc-mic-status{color:#8fc6ff;font-size:11px;margin-top:2px}#zcMsgs>div.zc-mic-fix .zc-mic-hint{color:#8b96a5;font-size:11px;margin-top:5px;white-space:normal}#zcMsgs>div.zc-mic-level{display:none}#zcMicBar{display:none;align-items:center;gap:6px;padding:6px 8px 0}#zcMicBar.on{display:flex}#zcMicBar .zc-bar-track{flex:1;height:6px;border-radius:4px;background:#0f0f1a;border:1px solid #2a2a3a;overflow:hidden}#zcMicBar .zc-bar-fill{display:block;height:100%;width:0;background:linear-gradient(90deg,#2f81f7,#7ee787);transition:width .08s linear}#zcMicBar.low .zc-bar-fill{background:linear-gradient(90deg,#8a6d1f,#e3b341)}#zcMicBar.low .zc-bar-track{border-color:#8a6d1f}#zcMicBar .zc-bar-db{min-width:56px;text-align:right;color:#8b96a5;font-size:11px;font-variant-numeric:tabular-nums}';bal.appendChild(st);
       // handlers
       document.getElementById('zcSend').addEventListener('click',zc_sendInBalloon);
       document.getElementById('zcSpk').addEventListener('click',function(){zc_ttsOn=!zc_ttsOn;this.textContent=zc_ttsOn?'🔊':'🔇'});
       var input=document.getElementById('zcIn');
       input.addEventListener('keydown',function(e){if(e.key==='Enter')zc_sendInBalloon()});
       // webkitspeechchange (x-webkit-speech) в современных Chrome не приходит;
       input.addEventListener('focus',function(){if(window.agent)window.agent.play('CheckingSomething')});
       // Микрофон: браузер отдаёт речь только в secure context (https,
       // localhost или origin из политики OverrideSecurityRestrictionsOnInsecureOrigin).
       // На http://<нода>:8081 вместо «ошибки сети» показываем блок с
       // генератором политики — сеть тут ни при чём (D-F79).
       var zsr=zc_initSR();
       window.zc_sr=zsr;   // для отладки/тестов: window.zc_sr.onresult({results:[…]})
       if(zsr){
         zsr.onresult=zc_srResult;
         zsr.onstart=function(){console.log('SR start');zcFinalBuf='';if(zcFinalTimer){clearTimeout(zcFinalTimer);zcFinalTimer=0}zcMicMeterStart()};
         zsr.onend=function(){console.log('SR end');zcMicMeterSummary();zcMicMeterStop();if(zcFinalBuf)zc_flushFinal()};
         zsr.onerror=zc_srError;
       }
       document.getElementById('zcMic').addEventListener('click',function(){
         if(zcMicState()!=='ok'){if(window.agent)window.agent.play('Alert');zcMicHelp();return}
         if(window.agent)window.agent.play('CheckingSomething');
         input.focus();
         try{zsr.start()}catch(e){console.error('SR start exception',e);zcMicHelp()}
       });
       // двойной клик по персонажу — открыть/закрыть панель (одинарный не
       // открывает: библиотека на mouseup сама показывала balloon — show()
       // заглушен выше). Закрыть можно ещё кликом мимо и Esc.
       _el.addEventListener('dblclick',function(){zcToggle(true)});
       var _lt=0,_lx=0,_ly=0;
       _el.addEventListener('touchstart',function(e){_lx=e.touches[0].clientX;_ly=e.touches[0].clientY},true);
       _el.addEventListener('touchend',function(e){var c=e.changedTouches[0],dx=Math.abs(c.clientX-_lx),dy=Math.abs(c.clientY-_ly);if(dx>15||dy>15)return;var n=Date.now();if(n-_lt<400){_lt=0;zcToggle(true)}else _lt=n},true);
       document.addEventListener('mousedown',function(e){
         if(!zcPanel.open)return;
         if(bal.contains(e.target)||_el.contains(e.target))return;
         var t=document.getElementById('clippyTrigger');if(t&&t.contains(e.target))return;
         zcHide();
       });
       document.addEventListener('keydown',function(e){if(e.key==='Escape'&&zcPanel.open)zcHide()});
       // click on a message — copy it
       document.getElementById('zcMsgs').addEventListener('click',function(e){var d=e.target.closest('.zc-user,.zc-asst');if(d){navigator.clipboard.writeText(d.textContent);d.style.opacity='0.5';setTimeout(function(){d.style.opacity='1'},200)}});
      }
      // hide the old overlay
      var ov=document.getElementById('clippyOverlay');if(ov)ov.style.display='none';
      // intercept speak — render into the chat instead of the balloon.
      // Панель при этом НЕ показываем: после загрузки она скрыта, пока её не
      // вызовут двойным кликом. Приветствие просто ждёт внутри.
      agent.speak=function(t){
        if(t==null)return;
        var m=document.getElementById('zcMsgs');if(!m)return;
        var d=document.createElement('div');d.className='zc-asst';d.textContent=String(t);
        m.appendChild(d);m.scrollTop=m.scrollHeight;
      };
      if(typeof cb==='function')cb(agent);
    },
    failCb: (e) => {
    	if(gen===_agentGen){
    		window._agentReady=false; // разрешаем повторный запуск (кнопка 🤖)
    		var t=document.getElementById('clippyTrigger');if(t)t.style.display='flex'; // спрайта нет — показать фолбек
    	}
    	console.error(e)
    }
  })
 }catch(e){
  // clippy.load бросает синхронно на неизвестном имени персонажа — failCb
  // в этом случае не вызывается, поэтому фолбек включаем здесь же.
  if(gen===_agentGen){
   window._agentReady=false;
   var tf=document.getElementById('clippyTrigger');if(tf)tf.style.display='flex';
  }
  console.error('loadAgent:',e);
 }
}
togglAgent=function(){
	if(!window.agent)return;
	if(window.agent._hidden){ 
	window.agent.show();
		window.agent.speak("Я здесь")
		window.agent.animate();	
	}else{
		window.agent.hide()
		}

}
agentHelp=function(key){
	if(!window.agent)return;
	console.log(key)
	window.agent.speak(helpJson[key])
}

// === Clippy LLM Integration: единый мозг на сервере (/api/brain/*) ===
// Браузер не знает ни провайдера, ни ключей: один POST на сервер, где живёт
// общий сервис internal/brain — тот же, что отвечает голосовой Алисе.
// Контекст диалога держит сервер (у каждой вкладки свой client-id).
var zc_ttsOn=true;
var ZC={};
var zc_clientId=(function(){try{var k='zc_client',v=localStorage.getItem(k);if(!v){v=Math.random().toString(36).slice(2,10);localStorage.setItem(k,v)}return v}catch(e){return'default'}})();

// defaults if jsconfig.Brain is missing (нужны только для показа модели)
var zc_defaults={
 provider:{val:'none',list:['none','opencode','openai','deepseek','ollama']},
 opencode_url:'http://'+location.hostname+':4096',opencode_model:'opencode-go/qwen3.7-plus',opencode_password:'',
 openai_url:'https://api.openai.com/v1/chat/completions',openai_model:'gpt-4o',openai_key:'',
 deepseek_url:'https://api.deepseek.com/v1/chat/completions',deepseek_model:'deepseek-chat',deepseek_key:'',
 ollama_url:'http://localhost:11434/v1/chat/completions',ollama_model:'llama3',
 system_prompt:'Ты — ассистент умного дома. Отвечай ТОЛЬКО итоговой фразой без объяснений.'
};

function zc_load(){
 var b=window.jsconfig&&window.jsconfig.Brain?window.jsconfig.Brain:zc_defaults;
 for(var k in b)ZC[k]=b[k];
}
function zc_provider(){var p=ZC.provider;return(typeof p==='object'?p.val:p)||'none'}
function zc_cfg(){var p=zc_provider();return{provider:p,model:ZC[p+'_model']||''}}

// zc_brain — единственная точка общения с мозгом.
async function zc_brainAsk(text){
 var r=await fetch('/api/brain/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text,client:zc_clientId})});
 var d=await r.json().catch(function(){return{}});
 if(!r.ok||d.error)throw new Error(d.error||('HTTP '+r.status));
 return d.text||'Нет ответа';
}

async function zc_brainReset(){
 try{await fetch('/api/brain/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client:zc_clientId})})}catch(e){}
 return'Готово, начинаем с чистого листа.';
}

async function zc_askBrain(text){
 try{return await zc_brainAsk(text)}catch(e){return zc_fb(text,[])}
}

var ttsQueue = Promise.resolve();
// zcSpeaking — пока ассистент говорит, микрофон не принимаем: на виртуальном
// устройстве ввода (Steam Streaming Microphone) браузер слышит собственную
// озвучку и уходит в петлю «ответ → распознан → ответ» (D-F81).
var zcSpeaking = false;
function zc_tts(txt){
  ttsQueue = ttsQueue.then(async () => {
    zcSpeaking = true;
    try{
      const r = await fetch('/api/alice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: txt })
      });
      if (!r.ok) throw new Error(await r.text());
      const url = URL.createObjectURL(await r.blob());
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
      console.log('TTS played:', txt);
    } catch (e) {
      console.error('tts error:', e);
      // фолбек — браузерная озвучка
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(txt.replace(/[^\p{L}\p{N}\s,.!?:;-]/gu, '').substring(0, 300));
        u.lang = 'ru-RU'; u.rate = 0.9;
        window.speechSynthesis.speak(u);
      }
    } finally {
      zcSpeaking = false;
    }
  }).catch(e => console.error('tts queue:', e));
  return ttsQueue;
}

async function zc_switchModel(idx){
 try{
  var r=await fetch('/api/brain/models');
  var d=await r.json();
  if(!r.ok||d.error)throw new Error(d.error||('HTTP '+r.status));
  var pick=(d.models||[])[idx-1];
  if(!pick)return'Модель №'+idx+' не найдена';
  // конфиг один: пишем в Brain.<provider>_model
  var key=zc_provider()+'_model';
  ZC[key]=pick.id;
  if(window.jsconfig&&window.jsconfig.Brain)window.jsconfig.Brain[key]=pick.id;
  try{if(typeof WSsend!=='undefined')WSsend('SaveJson|/jsconfig.txt|'+JSON.stringify(window.jsconfig))}catch(e){}
  return'✅ Модель: '+pick.id;
 }catch(e){return'Ошибка: '+e.message}
}

async function zc_models(){
 try{
  var r=await fetch('/api/brain/models');
  var d=await r.json();
  if(!r.ok||d.error)throw new Error(d.error||('HTTP '+r.status));
  var all=[],_cm=String(zc_cfg().model||''),_ci=_cm.indexOf('#');
  if(_ci>=0)_cm=_cm.slice(0,_ci);
  (d.models||[]).forEach(function(m,i){all.push((i+1)+'. '+m.id+' - '+(m.name||'')+(m.id===_cm?' ★':''))});
  return'Модели:\n'+all.join('\n');
 }catch(e){return'Ошибка: '+e.message}
}


function zc_fb(txt,devs){
 var l=txt.toLowerCase();
 if(/привет|здравств|хай/.test(l))return'Привет! Я твой помощник умного дома.';
 if(/время|час/.test(l)){var n=new Date();return'Сейчас '+n.getHours()+':'+String(n.getMinutes()).padStart(2,'0');}
 if(/список|покажи|устройств/.test(l)&&devs.length){
  return'Устройства:\n'+devs.map(function(d){return'• '+d.n+(d.r?' ('+d.r+')':'')}).join('\n');
 }
 return'Не понял. Попробуйте "включи свет" или "покажи устройства".';
}

var zc_sr=null;
function zc_initSR(){
  var R = (window.webkitSpeechRecognition || window.SpeechRecognition);
  if(!R)return null;
  var sr=new R(); sr.lang='ru-RU';
  // Одна фраза на нажатие. С continuous=true микрофон оставался открытым и
  // после финала, а Chrome дробил одну фразу на несколько финалов
  // («как дела» → «дела»), каждый уходил в чат отдельным сообщением (D-F81).
  sr.continuous=false;
  sr.interimResults=true;
  return sr;
}

// ── Отправка фразы: только финал, партиалы — в поле ввода ──────────────────
// Раньше zsr.onresult отправлял КАЖДОЕ событие, включая interim, поэтому одна
// фраза давала 4–6 сообщений и 4–6 ответов («привет» → «привет как» →
// «привет как дела»). Теперь промежуточный текст только накапливается в
// #zcIn, а в чат/бэк уходит единственный финальный результат.
//
// Склейка финалов: Chrome может финализировать фразу кусками («включи свет
// в спальне» → «включи свет» + «в спальне»). Финалы собираются в буфер и
// уходят одним сообщением, если между ними меньше ZC_FINAL_WAIT мс. Если
// человек делает паузу дольше — это уже отдельная команда и отдельное
// сообщение. На onend буфер отправляется сразу, не дожидаясь окна.
var zc_srLast={text:'',at:0};
var ZC_FINAL_WAIT=800;
var zcFinalBuf='',zcFinalTimer=0;

function zc_flushFinal(){
  if(zcFinalTimer){clearTimeout(zcFinalTimer);zcFinalTimer=0}
  var text=zcFinalBuf.trim();zcFinalBuf='';
  if(!text)return;
  if(zcSpeaking){           // идёт озвучка ответа — не слушаем сами себя
    var ip=document.getElementById('zcIn');if(ip)ip.value='';
    return;
  }
  var now=Date.now();
  if(text===zc_srLast.text&&now-zc_srLast.at<3000)return;  // тот же финал ещё раз
  zc_srLast.text=text;zc_srLast.at=now;
  var inp=document.getElementById('zcIn');if(inp)inp.value='';
  try{if(window.zc_sr)window.zc_sr.stop()}catch(err){}
  window.processClippyMessage(text);
}

function zc_srResult(e){
  var rs=(e&&e.results)||[],finals=[],interims=[];
  for(var i=0;i<rs.length;i++){
    var r=rs[i],t=(r&&r[0]&&r[0].transcript)||'';
    t=t.trim();if(!t)continue;
    if(r.isFinal)finals.push(t);else interims.push(t);
  }
  var inp=document.getElementById('zcIn');
  // партиал копится в строке ввода — человек видит, что его слышат
  if(inp)inp.value=finals.concat(interims).join(' ');
  if(!finals.length)return;
  zcFinalBuf=(zcFinalBuf?zcFinalBuf+' ':'')+finals.join(' ');
  if(zcFinalTimer)clearTimeout(zcFinalTimer);
  zcFinalTimer=setTimeout(zc_flushFinal,ZC_FINAL_WAIT);
}

// ── Микрофон: secure context, подсказка и генератор политики браузера ──────
// Речь браузер отдаёт только в secure context: https, localhost или origin из
// политики OverrideSecurityRestrictionsOnInsecureOrigin. ZESP работает по http,
// поэтому на http://<нода>:8081 без политики микрофон недоступен. Скрипт для
// политики собирается здесь же — адреса нод берутся из /api/cluster/info, так
// что новая нода попадает в файл без пересборки (D-F79).
function zcMicState(){
  if(/[?&]micblocked=1/.test(location.search))return'insecure'; // предпросмотр блока без снятия политики
  if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))return'mobile';
  if(!window.isSecureContext)return'insecure';
  if(!(window.webkitSpeechRecognition||window.SpeechRecognition))return'unsupported';
  return'ok';
}

// zcMicOrigins — список http-origin'ов: эта страница, localhost и все ноды
// кластера (addr — UDP-порт обнаружения, веб-порт лежит в p.http).
function zcMicOrigins(){
  var list=[],seen={};
  function add(o){
    if(!o)return;
    o=String(o);
    if(o.charAt(o.length-1)!=='/')o+='/';
    if(seen[o])return;
    seen[o]=1;list.push(o);
  }
  var port=location.port||'8081';
  add(location.origin);
  add('http://localhost:'+port);
  add('http://127.0.0.1:'+port);
  return fetch('/api/cluster/info',{cache:'no-store'}).then(function(r){
    return r.ok?r.json():null;
  }).then(function(d){
    var n=0;
    ((d&&d.peers)||[]).forEach(function(p){
      if(!p||!p.addr)return;
      var host=String(p.addr).split(':')[0];
      add('http://'+host+':'+(p.http||'8081'));
      n++;
    });
    return{origins:list,nodes:n};
  }).catch(function(e){
    console.warn('cluster info:',e);
    return{origins:list,nodes:0};
  });
}

// zcMicPolicyText — текст PowerShell-скрипта. Шапка объясняет, что это и
// зачем, чтобы файл не запускали вслепую.
function zcMicPolicyText(origins){
  var L=[];
  L.push('# zesp-mic-policy.ps1 — разрешить микрофон на http-страницах ZESP.');
  L.push('#');
  L.push('# ЧТО ЭТО. Скрипт прописывает адреса узлов ZESP в политику браузера');
  L.push('# OverrideSecurityRestrictionsOnInsecureOrigin (Chrome и Edge,');
  L.push('# HKLM\\SOFTWARE\\Policies). Политика объявляет эти адреса доверенными, и');
  L.push('# обычный http://<узел>:8081 работает как https — сертификат не нужен.');
  L.push('#');
  L.push('# ЗАЧЕМ. Микрофон (распознавание речи, getUserMedia) браузер отдаёт только');
  L.push('# в secure context: https, localhost или origin из этой политики. ZESP');
  L.push('# работает по http, поэтому без политики кнопка микрофона в диалоге');
  L.push('# ассистента не работает, а в чате появляется «ошибка сети» — на самом');
  L.push('# деле браузер вообще не даёт доступ к микрофону.');
  L.push('#');
  L.push('# КАК ЗАПУСТИТЬ.');
  L.push('#   1. Правой кнопкой по файлу -> «Выполнить с PowerShell».');
  L.push('#      Если Windows не даёт, откройте PowerShell от имени администратора и');
  L.push('#      выполните: powershell -NoProfile -ExecutionPolicy Bypass -File .\\zesp-mic-policy.ps1');
  L.push('#   2. Полностью закройте браузер (все окна) и откройте снова: политика');
  L.push('#      читается только при старте.');
  L.push('#   3. Откройте диалог ассистента и нажмите микрофон — браузер один раз');
  L.push('#      спросит доступ, нажмите «Разрешить».');
  L.push('#');
  L.push('# ПРОВЕРКА. chrome://policy -> OverrideSecurityRestrictionsOnInsecureOrigin');
  L.push('# Скрипт только добавляет адреса: уже прописанные остаются, поэтому');
  L.push('# вторая ручная правка (другой сетевой интерфейс ноды) не потеряется.');
  L.push('# ОТКАТ (PowerShell от администратора):');
  L.push("#   Remove-Item 'HKLM:\\SOFTWARE\\Policies\\Google\\Chrome\\OverrideSecurityRestrictionsOnInsecureOrigin' -Recurse");
  L.push("#   Remove-Item 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge\\OverrideSecurityRestrictionsOnInsecureOrigin' -Recurse");
  L.push('#');
  L.push('# Файл собран в диалоге ассистента ZESP '+new Date().toLocaleString('ru-RU')+'.');
  L.push('# Адресов в наборе: '+origins.length+'. Появится новая нода — скачайте файл заново.');
  L.push('');
  L.push("$ErrorActionPreference = 'Stop'");
  L.push('');
  L.push('$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)');
  L.push('if (-not $isAdmin) {');
  L.push("    Write-Host 'Нужны права администратора: правой кнопкой по файлу -> «Выполнить с PowerShell».' -ForegroundColor Red");
  L.push('    exit 1');
  L.push('}');
  L.push('');
  L.push('# Адреса узлов кластера ZESP (http-origin, порт веба).');
  L.push('$origins = @(');
  origins.forEach(function(o){L.push("    '"+o+"'")});
  L.push(')');
  L.push('');
  L.push('$roots = @(');
  L.push("    'HKLM:\\SOFTWARE\\Policies\\Google\\Chrome',");
  L.push("    'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge'");
  L.push(')');
  L.push('');
  L.push('foreach ($root in $roots) {');
  L.push("    $key = Join-Path $root 'OverrideSecurityRestrictionsOnInsecureOrigin'");
  L.push('    if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }');
  L.push('    $item = Get-Item $key');
  L.push('    # браузер видит только адрес, по которому открыта страница, а у ноды их');
  L.push('    # может быть несколько (LAN, Wi-Fi) — прежние значения не выбрасываем.');
  L.push('    $all = @($item.GetValueNames() | ForEach-Object { [string]$item.GetValue($_) }) + $origins');
  L.push('    $all = @($all | Where-Object { $_ } | Select-Object -Unique)');
  L.push('    $item.GetValueNames() | ForEach-Object {');
  L.push('        Remove-ItemProperty -Path $key -Name $_ -ErrorAction SilentlyContinue');
  L.push('    }');
  L.push('    $i = 1');
  L.push('    foreach ($o in $all) {');
  L.push('        New-ItemProperty -Path $key -Name "$i" -Value $o -PropertyType String -Force | Out-Null');
  L.push('        $i++');
  L.push('    }');
  L.push('    Write-Host "OK $key"');
  L.push('    $item = Get-Item $key');
  L.push('    $item.GetValueNames() | Sort-Object { [int]$_ } | ForEach-Object {');
  L.push('        Write-Host ("   " + $_ + " = " + $item.GetValue($_))');
  L.push('    }');
  L.push('}');
  L.push('');
  L.push("Write-Host ''");
  L.push('Write-Host \'Готово. Полностью закройте браузер и откройте снова.\'');
  L.push("Write-Host 'Проверка: chrome://policy -> OverrideSecurityRestrictionsOnInsecureOrigin'");
  return L.join('\r\n')+'\r\n';
}

// zcMicDownload — собрать текст и отдать файл через Blob (бэкенд не нужен).
function zcMicDownload(){
  return zcMicOrigins().then(function(info){
    // BOM: без него PowerShell 5.1 читает UTF-8 как ANSI и ломает русский текст.
    var txt='\ufeff'+zcMicPolicyText(info.origins);
    var blob=new Blob([txt],{type:'text/plain;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='zesp-mic-policy.ps1';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},20000);
    info.origins=info.origins;
    return info;
  });
}

// zcMicHelp — блок в чате вместо «ошибки сети»: почему микрофон недоступен и
// кнопка скачивания скрипта. Показывается при открытии панели и по клику 🎤.
function zcMicHelp(){
  var m=document.getElementById('zcMsgs');if(!m)return;
  if(document.getElementById('zcMicHelp')){m.scrollTop=m.scrollHeight;return}
  var st=zcMicState();
  if(st==='ok')return;
  function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
  var d=el('div');d.id='zcMicHelp';d.className='zc-mic-fix';
  if(st==='insecure'){
    d.appendChild(el('div','zc-mic-head','Микрофон заблокирован: страница открыта по http ('+location.host+').'));
    d.appendChild(el('div','','Браузер разрешает микрофон только на https или localhost. Скрипт ниже добавит адреса всех узлов вашего кластера в политику браузера — https и сертификат не нужны.'));
    var btn=el('button','zc-mic-btn','⬇ Скачать zesp-mic-policy.ps1');
    btn.type='button';
    var status=el('div','zc-mic-status','');
    btn.addEventListener('click',function(){
      btn.disabled=true;status.textContent='Собираю адреса узлов из кластера…';
      zcMicDownload().then(function(info){
        status.textContent='Файл сохранён: адресов '+info.origins.length+(info.nodes?' (узлов кластера: '+info.nodes+')':'')+'.';
        btn.disabled=false;
      }).catch(function(e){
        console.error('mic policy:',e);
        status.textContent='Не удалось собрать файл: '+e.message;
        btn.disabled=false;
      });
    });
    d.appendChild(btn);d.appendChild(status);
    d.appendChild(el('div','zc-mic-hint','1) По скачанному файлу: правой кнопкой → «Выполнить с PowerShell» (нужен администратор; если Windows блокирует запуск — Свойства файла → «Разблокировать»). 2) Полностью закройте браузер и откройте снова. 3) Нажмите 🎤 — браузер один раз спросит доступ.'));
  }else if(st==='unsupported'){
    d.appendChild(el('div','zc-mic-head','Этот браузер не умеет распознавать речь.'));
    d.appendChild(el('div','','Кнопка микрофона работает только в Chrome и Edge: движок распознавания есть только у Chromium.'));
  }else{
    d.appendChild(el('div','zc-mic-head','Микрофон в диалоге на мобильных отключён.'));
    d.appendChild(el('div','','Введите команду текстом или скажите её колонке: «Алиса, …».'));
  }
  m.appendChild(d);
  // Блок выше окна сообщений (200 px): показываем его начало, а не хвост,
  // иначе первая строка «Микрофон заблокирован…» остаётся за кадром.
  m.style.maxHeight='320px';
  m.scrollTop=Math.max(0,m.scrollHeight-d.offsetHeight-4);
}

// zc_srError — разные причины молчания микрофона звучат по-разному. Раньше
// любая ошибка показывалась как «ошибка сети», из-за чего блокировку
// микрофона на http принимали за отсутствие интернета.
function zc_srError(e){
  console.error('SR error',e);
  zcMicMeterSummary();zcMicMeterStop();
  var code=(e&&e.error)||'',txt='';
  if(code==='not-allowed'||code==='service-not-allowed')txt='Доступ к микрофону запрещён. Разрешите его: значок замка/настроек в адресной строке → Микрофон → «Разрешить» (или chrome://settings/content/microphone).';
  else if(code==='network')txt='Сервис распознавания не отвечает: браузер отправляет звук в облако Google, нужен доступ в интернет именно к нему.';
  else if(code==='no-speech')txt='Ничего не услышал. Смотрите полосу уровня над полем ввода: если она стоит пустой и справа «—», микрофон молчит — дело в устройстве ввода, а не в распознавании.';
  else if(code==='audio-capture')txt='Микрофон не найден или занят другим приложением.';
  else if(code==='aborted')return;
  else txt='Ошибка распознавания: '+(code||'неизвестно');
  var msg=document.getElementById('zcMsgs');
  if(msg&&!msg.querySelector('.zc-sr-err')){
    var d=document.createElement('div');d.className='zc-err zc-sr-err';d.textContent=txt;
    msg.appendChild(d);msg.scrollTop=msg.scrollHeight;
  }
  if(code==='not-allowed'||code==='service-not-allowed')zcMicHelp();
}

// ── Индикатор уровня микрофона ─────────────────────────────────────────────
// «Ничего не услышал» не объясняет причину: устройство ввода может быть не тем
// (веб-камера вместо гарнитуры), выключенным или занятым. Пока идёт
// распознавание, над строкой ввода показываем горизонтальную полосу уровня
// (RMS из getUserMedia) и цифру справа. Если за 3 с не было ни одного кадра
// громче −55 дБ — подсказываем про устройство ввода, а не про интернет (D-F80).
var zcMicMeter={stream:null,ac:null,timer:0,startedAt:0,peak:-160,warned:false,hideTimer:0};

function zcMicBar(){
  var el=document.getElementById('zcMicBar');
  if(!el)return null;
  return {el:el,fill:el.querySelector('.zc-bar-fill'),db:el.querySelector('.zc-bar-db')};
}

// −60…0 дБ → 0…100 % ширины; тише −60 — полоса пустая.
function zcMicLevelSet(db,peak){
  var b=zcMicBar();if(!b)return;
  var pct=Math.max(0,Math.min(100,(db+60)/60*100));
  b.fill.style.width=pct.toFixed(1)+'%';
  b.db.textContent=(db<-60?'тишина':Math.round(db)+' дБ');
  var was=b.el.className;
  b.el.className='on'+(peak<-55?' low':'');
  // полоса появляется — панель стала выше на её высоту, переставляем к спрайту
  if(was!=='on'&&was!=='on low'&&window.agent&&agent._balloon)agent._balloon.reposition();
}

function zcMicMeterStop(){
  var m=zcMicMeter;
  if(m.timer){clearInterval(m.timer);m.timer=0}
  if(m.stream){m.stream.getTracks().forEach(function(t){try{t.stop()}catch(e){}});m.stream=null}
  if(m.ac){try{m.ac.close()}catch(e){};m.ac=null}
  m.startedAt=0;
  var b=zcMicBar();if(!b)return;
  if(m.hideTimer)clearTimeout(m.hideTimer);
  // короткая задержка, чтобы полоса не мигала между фразами
  m.hideTimer=setTimeout(function(){
    var bb=zcMicBar();if(!bb)return;
    bb.el.className='';bb.fill.style.width='0';bb.db.textContent='—';
    if(window.agent&&agent._balloon)agent._balloon.reposition();
  },700);
}

function zcMicMeterStart(){
  var m=zcMicMeter;
  if(m.stream||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return;
  if(!zcMicBar())return;                       // панель ещё не построена
  var AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return;
  if(m.hideTimer){clearTimeout(m.hideTimer);m.hideTimer=0}
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(st){
    m.stream=st;m.startedAt=Date.now();m.peak=-160;m.warned=false;
    var ac=new AC();m.ac=ac;
    var src=ac.createMediaStreamSource(st);
    var an=ac.createAnalyser();an.fftSize=2048;
    src.connect(an);
    var buf=new Float32Array(an.fftSize);
    zcMicLevelSet(-160,m.peak);
    m.timer=setInterval(function(){
      an.getFloatTimeDomainData(buf);
      var sum=0;
      for(var i=0;i<buf.length;i++)sum+=buf[i]*buf[i];
      var rms=Math.sqrt(sum/buf.length);
      var db=rms>0?20*Math.log10(rms):-160;
      if(db>m.peak)m.peak=db;
      zcMicLevelSet(db,m.peak);
      if(!m.warned&&Date.now()-m.startedAt>3000&&m.peak<-55){
        m.warned=true;
        var msg=document.getElementById('zcMsgs');
        if(msg){
          var w=document.createElement('div');
          w.className='zc-err zc-mic-silent';
          w.textContent='Микрофон молчит: за 3 секунды уровень ниже −55 дБ (полоса над полем ввода пустая). Проверьте устройство ввода: Windows → Параметры → Звук → Ввод (и «Устройство ввода по умолчанию»), затем chrome://settings/content/microphone для этого сайта.';
          msg.appendChild(w);msg.scrollTop=msg.scrollHeight;
        }
      }
    },120);
  }).catch(function(e){
    console.warn('mic meter:',e);
  });
}

// Итоговый максимум за попытку — цифрой справа, полосу гасим.
function zcMicMeterSummary(){
  var m=zcMicMeter,peak=m.peak;
  var b=zcMicBar();
  if(b&&peak>-160){
    b.db.textContent=Math.round(peak)+' дБ';
    b.fill.style.width=Math.max(0,Math.min(100,(peak+60)/60*100)).toFixed(1)+'%';
  }
  return peak;
}


function zc_sendInBalloon(){
 var inp=document.getElementById('zcIn');if(!inp)return;
 var t=inp.value.trim();if(!t)return;
 inp.value='';
 window.processClippyMessage(t);
}

// zc_voice — парсер команд дома на сервере (`voicecmd`, без LLM):
// POST /api/voice {text} -> {ok, reply}. ok=true — фраза разобрана как
// команда/вопрос по устройствам, reply уже готов; ok=false — не наша фраза.
async function zc_voice(text){
  var ctl=typeof AbortController!=='undefined'?new AbortController():null;
  var timer=ctl?setTimeout(function(){ctl.abort()},8000):0;
  try{
    var r=await fetch('/api/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text}),signal:ctl?ctl.signal:undefined});
    if(!r.ok)throw new Error(r.status+' '+r.statusText);
    return await r.json();
  }finally{
    if(timer)clearTimeout(timer);
  }
}

window.processClippyMessage=async function(text){
 var m=document.getElementById('zcMsgs');
 if(!m)return;
 // user message
 var ud=document.createElement('div'); ud.className='zc-user'; ud.textContent=text;
 m.appendChild(ud); m.scrollTop=m.scrollHeight;
 // typing
 var wd=document.createElement('div'); wd.className='zc-wait'; wd.textContent='...'; m.appendChild(wd);
 // пасхалка: «покажи сиськи» и родственные фразы — перехват до LLM
 if(/покаж[а-яё]*\s+(сиськи|грудь|груди|титьки|буфера)|раздева[а-яё]*|раздень[а-яё]*|оголис[а-яё]*/i.test(text)){
  wd.remove();
  if(window.agent)window.agent.play('Shy');
  var pd=document.createElement('div'); pd.className='zc-asst'; pd.textContent='Сначала сценарий «вечер», потом посмотрим 😏';
  m.appendChild(pd); m.scrollTop=m.scrollHeight;
  zc_tts('Сначала сценарий «вечер», потом посмотрим.');
  if(agent&&agent._balloon)agent._balloon.reposition();
  return;
 }
 if(window.agent)window.agent.play('Thinking');
 if(window.agent&&window.agent._balloon)window.agent._balloon.reposition();
 // special commands
 if(/какая\s+модел|текущ|активн/i.test(text)){
  var mn=zc_cfg().model;wd.remove();
  var sd2=document.createElement('div');sd2.className='zc-asst';sd2.textContent=mn;
  m.appendChild(sd2);m.scrollTop=m.scrollHeight;return;
 }
 if(/модел|model/i.test(text)){
    var mm=text.match(/модель\s*(\d+)/i);
    if(mm){
     var idx=parseInt(mm[1]),rn=await zc_switchModel(idx);
     wd.remove();
      zc_tts(rn.substring(0,200));
      var sd=document.createElement('div');sd.className='zc-asst';sd.textContent=rn;
      m.appendChild(sd);m.scrollTop=m.scrollHeight;return;
     }
     var mr=await zc_models();
    wd.remove();
    zc_tts(mr.substring(0,200));
    var md=document.createElement('div');md.className='zc-asst';md.textContent=mr;
    m.appendChild(md);m.scrollTop=m.scrollHeight;return;
   }
    // команды дома разбирает серверный парсер voicecmd — до LLM и без сети.
    // ok=false значит «фраза не про дом»: уходим в LLM/фолбек ниже.
    try{
      var vc=await zc_voice(text);
      if(vc&&vc.ok){
        wd.remove();
        if(window.agent)window.agent.play(window.agent.hasAnimation('Explain')?'Explain':'Wave');
        var vd=document.createElement('div');vd.className='zc-asst';vd.textContent=vc.reply;
        m.appendChild(vd);m.scrollTop=m.scrollHeight;
        if(vc.reply)zc_tts(vc.reply);
        if(agent&&agent._balloon)agent._balloon.reposition();
        return;
      }
    }catch(e){console.warn('voice parser:',e)}
    try{
     var resp;
     try{resp=await zc_askBrain(text)}catch(e){resp=zc_fb(text,[])}
    wd.remove();
     if(window.agent)window.agent.play(window.agent.hasAnimation('Explain')?'Explain':'Wave');
   zc_tts(resp);
   var rd=document.createElement('div'); rd.className='zc-asst'; rd.textContent=resp;
  m.appendChild(rd); m.scrollTop=m.scrollHeight;
  if(agent&&agent._balloon)agent._balloon.reposition();
  }catch(e){
    wd.remove();
    if(window.agent)window.agent.play('Alert');
    var ed=document.createElement('div'); ed.className='zc-err';
   ed.textContent='Ошибка: '+e.message; m.appendChild(ed);
 }
};

window.setupClippyEvents=function(){
  zc_load();
  if(typeof eventE!=='undefined')eventE.once('jsconfig',function(){zc_load()});
};