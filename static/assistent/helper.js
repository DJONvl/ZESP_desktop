
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






loadAgent=function(aname,cb){
 if(typeof window.clippy==='undefined'){var iv=setInterval(function(){if(window.clippy){clearInterval(iv);loadAgent(aname,cb)}},50);return}
 var trig=document.getElementById('clippyTrigger');if(trig)trig.style.display='none';
 document.querySelector('.assistagent').innerHTML = ''
 clippy.load({
    name: aname,
    selector: 'assistagent',
  	successCb: (loadedAgent) => {
    	console.log("Loaded!");
		agent = loadedAgent;
    	agent.show();
      agent.animate();
      setTimeout(function(){agent.play('Wave')},600);
      var _el=agent._el;if(_el){_el.style.position='fixed';_el.style.bottom='';_el.style.right='';var _zz=(window.getZoom?window.getZoom():1),_w=_el.offsetWidth||124,_h=_el.offsetHeight||124;_el.style.left=(window.innerWidth/_zz-_w-20)+'px';_el.style.top=(window.innerHeight/_zz-_h-20)+'px'};
      // --- zoom-фикс clippy: библиотека считает позицию/drag в viewport-px ---
      (function(){
        var gz=function(){return (window.getZoom?window.getZoom():1)};
        var vw=function(){return window.innerWidth/gz()};
        var vh=function(){return window.innerHeight/gz()};
        function fixAgent(){var el=agent._el,w=el.offsetWidth||124,h=el.offsetHeight||124,l=parseFloat(el.style.left),t=parseFloat(el.style.top);if(!isFinite(l)||!isFinite(t)||l<-w||t<-h||l>vw()||t>vh()){el.style.left=(vw()-w-20)+'px';el.style.top=(vh()-h-20)+'px'}}
        var origShow=agent.show.bind(agent);
        agent.show=function(t){var r=origShow(t);fixAgent();return r};
        var origRepos=agent.reposition.bind(agent);
        agent.reposition=function(){if(gz()===1)return origRepos();var el=agent._el,w=el.offsetWidth||124,h=el.offsetHeight||124,l=parseFloat(el.style.left)||0,t=parseFloat(el.style.top)||0;el.style.left=Math.max(0,Math.min(l,vw()-w))+'px';el.style.top=Math.max(0,Math.min(t,vh()-h))+'px';if(agent._balloon)agent._balloon.reposition()};
        agent._startDrag=function(e){this.pause();this._balloon.hide(true);this._zoff={sx:(e.pageX!==undefined?e.pageX:e.clientX),sy:(e.pageY!==undefined?e.pageY:e.clientY),bx:parseFloat(this._el.style.left)||this._el.offsetLeft||0,by:parseFloat(this._el.style.top)||this._el.offsetTop||0};this._offset={left:0,top:0};this._targetX=this._zoff.bx;this._targetY=this._zoff.by;this._moveHandle=this._dragMove.bind(this);this._upHandle=this._finishDrag.bind(this);window.addEventListener('mousemove',this._moveHandle);window.addEventListener('mouseup',this._upHandle);this._dragUpdateLoop=window.setTimeout(this._updateLocation.bind(this),10)};
        agent._dragMove=function(t){try{t.preventDefault()}catch(e){}if(!this._zoff)return;var z=gz(),cx=(t.clientX!==undefined?t.clientX:t.pageX),cy=(t.clientY!==undefined?t.clientY:t.pageY);this._targetX=this._zoff.bx+(cx-this._zoff.sx)/z;this._targetY=this._zoff.by+(cy-this._zoff.sy)/z};
        var origFinish=agent._finishDrag.bind(agent);
        agent._finishDrag=function(){this._zoff=null;return origFinish()};
        if(agent._balloon){var bal=agent._balloon,origBalR=bal.reposition.bind(bal);bal.reposition=function(){origBalR();var z=gz();if(z!==1&&bal._balloon){var b=bal._balloon;if(b.style.left)b.style.left=(parseFloat(b.style.left)/z)+'px';if(b.style.top)b.style.top=(parseFloat(b.style.top)/z)+'px'}}}
      })();
      // ── встройка чата в балун ──
      var bal=agent._balloon._balloon, cnt=agent._balloon._content;
      if(bal&&cnt){
       bal.style.minWidth='300px';bal.style.maxWidth='360px';bal.style.background='#1a1a2e';bal.style.color='#e0e0e0';bal.style.border='1px solid #2a2a3a';bal.style.borderRadius='12px';bal.style.padding='0';bal.style.boxShadow='0 4px 20px rgba(0,0,0,0.5)';
       bal.style.marginTop='40px';bal.style.marginLeft='10px';
       bal.style.fontFamily="'Segoe UI',Tahoma,sans-serif";bal.style.fontSize='13px';bal.style.cursor='default';
       cnt.style.maxWidth='none';cnt.style.minWidth='auto';cnt.style.padding='0';cnt.style.lineHeight='1.4';
       cnt.innerHTML='<div id="zcMsgs" style="overflow-y:auto;padding:8px;min-height:60px;max-height:200px;scrollbar-width:thin;scrollbar-color:#2a2a3a #0f0f1a;"></div><div id="zcRow" style="display:flex;padding:6px 8px;border-top:1px solid #2a2a3a;gap:4px;"><input id="zcIn" placeholder="Напишите..." autocomplete="off" x-webkit-speech style="flex:1;background:#0f0f1a;border:1px solid #2a2a3a;padding:6px 10px;border-radius:8px;color:#fff;font-size:13px;outline:none;"><button id="zcSpk" style="background:#2a2a3a;border:none;padding:6px 8px;border-radius:8px;color:#aaa;cursor:pointer;font-size:13px;">🔊</button><button id="zcMic" style="background:#2a2a3a;border:none;padding:6px 8px;border-radius:8px;color:#aaa;cursor:pointer;font-size:13px;">🎤</button><button id="zcSend" style="background:#2a2a3a;border:none;padding:6px 8px;border-radius:8px;color:#aaa;cursor:pointer;font-size:13px;">➤</button></div>';
       // стили для скроллбара в zcMsgs
       var st=document.createElement('style');st.textContent='#zcMsgs::-webkit-scrollbar{width:4px}#zcMsgs::-webkit-scrollbar-track{background:#0f0f1a}#zcMsgs::-webkit-scrollbar-thumb{background:#2a2a3a;border-radius:4px}#zcMsgs>div{padding:4px 8px;margin:2px 0;border-radius:8px;font-size:12px;white-space:pre-wrap;word-break:break-word;user-select:text;cursor:pointer;transition:opacity.15s}#zcMsgs>div.zc-user{background:#0d4a5c;color:#e0f0ff}#zcMsgs>div.zc-asst{background:#2a2a3a;color:#e0e0e0;border:1px solid #3a3a4a}#zcMsgs>div.zc-err{background:#3a1a1a;color:#f66;border:1px solid #5a2a2a}#zcMsgs>div.zc-wait{color:#888;font-style:italic}';bal.appendChild(st);
       // обработчики
       document.getElementById('zcSend').addEventListener('click',zc_sendInBalloon);
       document.getElementById('zcSpk').addEventListener('click',function(){zc_ttsOn=!zc_ttsOn;this.textContent=zc_ttsOn?'🔊':'🔇'});
       var input=document.getElementById('zcIn');
       input.addEventListener('keydown',function(e){if(e.key==='Enter')zc_sendInBalloon()});
       input.addEventListener('webkitspeechchange',function(){setTimeout(zc_sendInBalloon,300)});
       input.addEventListener('focus',function(){if(window.agent)window.agent.play('CheckingSomething')});
      var zsr=zc_initSR(),isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if(zsr&&!isMobile){zsr.onresult=function(e){input.value=e.results[e.results.length-1][0].transcript;zc_sendInBalloon()};document.getElementById('zcMic').addEventListener('click',function(){if(window.agent)window.agent.play('CheckingSomething');input.focus();try{zsr.start()}catch(e){}})}else{document.getElementById('zcMic').addEventListener('click',function(){if(window.agent)window.agent.play('CheckingSomething');input.focus()});document.getElementById('zcMic').style.display=''}
       // двойной клик/тап — показать/скрыть балун
        function toggleBal(){if(bal.hasAttribute('hidden')){bal.removeAttribute('hidden');requestAnimationFrame(function(){var zm=(window.getZoom?window.getZoom():1),vW=window.innerWidth/zm,vH=window.innerHeight/zm,bH=bal.offsetHeight||280;bal.style.left=Math.max(4,(vW-320)/2)+'px';bal.style.top=Math.max(4,(vH-bH)/2)+'px';input.focus()})}else bal.setAttribute('hidden','true')}
       _el.addEventListener('dblclick',toggleBal);
       var _lt=0,_lx=0,_ly=0;
       _el.addEventListener('touchstart',function(e){_lx=e.touches[0].clientX;_ly=e.touches[0].clientY},true);
       _el.addEventListener('touchend',function(e){var c=e.changedTouches[0],dx=Math.abs(c.clientX-_lx),dy=Math.abs(c.clientY-_ly);if(dx>15||dy>15)return;var n=Date.now();if(n-_lt<400){_lt=0;toggleBal()}else _lt=n},true);
       // клик по сообщению — копировать
       document.getElementById('zcMsgs').addEventListener('click',function(e){var d=e.target.closest('.zc-user,.zc-asst');if(d){navigator.clipboard.writeText(d.textContent);d.style.opacity='0.5';setTimeout(function(){d.style.opacity='1'},200)}});
      }
      // скрыть старый оверлей
      var ov=document.getElementById('clippyOverlay');if(ov)ov.style.display='none';
      // перехват speak — рендерить в чат вместо балуна
      agent.speak=function(t){if(t!=null&&document.getElementById('zcMsgs')){var m=document.getElementById('zcMsgs'),d=document.createElement('div');d.className='zc-asst';d.textContent=String(t);m.appendChild(d);m.scrollTop=m.scrollHeight}};
      if(typeof cb==='function')cb(agent);
    },
    failCb: (e) => {
    	console.error(e)
    }
  })
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

// === Clippy LLM Integration ===
var zc_autoAddr='http://'+location.hostname+':8765/mcp';
var ZC={mcpUrl:zc_autoAddr};
var zc_ocSession=null;
var zc_ttsOn=true;

// defaults если jsconfig.Brain отсутствует
var zc_defaults={
 provider:{val:'none',list:['none','opencode','openai','deepseek','ollama']},
 opencode_url:'http://'+location.hostname+':4096',opencode_model:'opencode-go/qwen3.7-plus',
 openai_url:'https://api.openai.com/v1/chat/completions',openai_model:'gpt-4o',openai_key:'',
 deepseek_url:'https://api.deepseek.com/v1/chat/completions',deepseek_model:'deepseek-chat',deepseek_key:'',
 ollama_url:'http://localhost:11434/v1/chat/completions',ollama_model:'llama3',
 system_prompt:'Ты — ассистент умного дома. Отвечай ТОЛЬКО итоговой фразой без объяснений. Не говори "хорошо, я понял", не перечисляй шаги. Инструменты ZESP доступны.'
};

function zc_load(){
 var b=window.jsconfig&&window.jsconfig.Brain?window.jsconfig.Brain:zc_defaults;
 var oldP=zc_provider(),oldM=zc_cfg().model;
 for(var k in b)ZC[k]=b[k];
 ZC.mcpUrl=zc_autoAddr;
 // сброс сессии при смене провайдера или модели
 if(zc_ocSession&&(oldP!==zc_provider()||oldM!==zc_cfg().model))zc_ocSession=null;
}
function zc_provider(){var p=ZC.provider;return(typeof p==='object'?p.val:p)||'opencode'}

function zc_cfg(){
 var p=zc_provider();
 return{provider:p,url:ZC[p+'_url']||'',model:ZC[p+'_model']||'',key:ZC[p+'_key']||''};
}

async function zc_mcp(m,p){
 var r=await fetch(ZC.mcpUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:Date.now(),method:m,params:p})});
 return await r.json();
}

async function zc_devs(){
 var r=await zc_mcp('tools/call',{name:'list_devices',arguments:{}});
 var t=r&&r.result&&r.result.content&&r.result.content[0]?r.result.content[0].text:'';
 var m=t.match(/\[\s*\{[\s\S]*\}\s*\]/);
 return m?JSON.parse(m[0]):[];
}

// тупой прокси через бекенд
async function zc_proxy(url,method,body,headers){
 var r=await fetch('/brain/proxy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url,method:method||'GET',body:body,headers:headers})});
 if(!r.ok)throw new Error(r.status+' '+r.statusText);
 return await r.json();
}

async function zc_askBrain(text){
 var cfg=zc_cfg();
 if(cfg.provider==='opencode')return await zc_askOpenCode(text,cfg);
 if(cfg.provider!=='none')return await zc_askOpenAI(text,cfg);
 return zc_fb(text,[]);
}

async function zc_askOpenCode(text,cfg){
 if(!zc_ocSession){
  try{await zc_proxy(cfg.url+'/mcp','POST',{name:'zesp',config:{type:'remote',url:ZC.mcpUrl}})}catch(e){}
  var sd=await zc_proxy(cfg.url+'/session','POST');
  zc_ocSession=sd.id;
 }
 var mp=cfg.model.split('/'),mobj={providerID:mp[0],modelID:mp[1]};
 var system=ZC.system_prompt;
 try{
  var d=await zc_mcp('tools/call',{name:'list_devices',arguments:{}});
  var t=d&&d.result&&d.result.content&&d.result.content[0]?d.result.content[0].text:'';
  if(t)system+='\n\nУстройства:\n'+t;
 }catch(e){}
 var rd=await zc_proxy(cfg.url+'/session/'+zc_ocSession+'/message','POST',{model:mobj,system:system,parts:[{type:'text',text:text}]});
 if(rd.parts)return rd.parts.filter(function(p){return p.type==='text'&&p.text}).map(function(p){return p.text}).join('\n');
 return rd.error||'Нет ответа';
}

async function zc_askOpenAI(text,cfg){
 var system=ZC.system_prompt;
 try{
  var d=await zc_mcp('tools/call',{name:'list_devices',arguments:{}});
  var t=d&&d.result&&d.result.content&&d.result.content[0]?d.result.content[0].text:'';
  if(t)system+='\n\nУстройства:\n'+t;
 }catch(e){}
 var h={};if(cfg.key)h['Authorization']='Bearer '+cfg.key;
 var rd=await zc_proxy(cfg.url,'POST',{model:cfg.model,messages:[{role:'system',content:system},{role:'user',content:text}],max_tokens:500,temperature:0.3},h);
 return rd.choices&&rd.choices[0]&&rd.choices[0].message?rd.choices[0].message.content:'Нет ответа';
}

function zc_tts(txt){
 if(!zc_ttsOn||!window.speechSynthesis)return;
 window.speechSynthesis.cancel();
 var u=new SpeechSynthesisUtterance(txt.replace(/[^\p{L}\p{N}\s,.!?:;-]/gu,'').substring(0,300));
  u.lang='ru-RU'; u.rate=0.9;
 window.speechSynthesis.speak(u);
}

async function zc_switchModel(idx){
 if(zc_provider()!=='opencode')return'Смена моделей только для OpenCode';
 try{
  var d=await zc_proxy(zc_cfg().url+'/config/providers','GET');
  var cur=0,pick=null;
  (d.providers||[]).forEach(function(p){for(var k in p.models){cur++;if(cur===idx)pick=p.id+'/'+k}});
  if(!pick)return'Модель №'+idx+' не найдена';
  ZC.opencode_model=pick;
  if(window.jsconfig&&window.jsconfig.Brain)window.jsconfig.Brain.opencode_model=pick;
  try{if(typeof WSsend!=='undefined')WSsend('SaveJson|/jsconfig.txt|'+JSON.stringify(window.jsconfig))}catch(e){}
  return'✅ Модель: '+pick;
 }catch(e){return'Ошибка: '+e.message}
}

async function zc_models(){
 if(zc_provider()!=='opencode')return'Список моделей только для OpenCode. Текущая: '+zc_cfg().model;
 try{
  var d=await zc_proxy(zc_cfg().url+'/config/providers','GET');
  var all=[],idx=0,curModel=zc_cfg().model.split('/')[1];
  (d.providers||[]).forEach(function(p){for(var k in p.models){idx++;var m=p.models[k];all.push(idx+'. '+p.id+'/'+k+' - '+m.name+(k===curModel?' ★':''))}});
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
 if(!('webkitSpeechRecognition' in window))return null;
 var R=window.webkitSpeechRecognition;
 var sr=new R(); sr.lang='ru-RU'; sr.continuous=false; sr.interimResults=false;
 return sr;
}

function zc_sendInBalloon(){
 var inp=document.getElementById('zcIn');if(!inp)return;
 var t=inp.value.trim();if(!t)return;
 inp.value='';
 window.processClippyMessage(t);
}

window.processClippyMessage=async function(text){
 var m=document.getElementById('zcMsgs');
 if(!m)return;
 // user message
 var ud=document.createElement('div'); ud.className='zc-user'; ud.textContent=text;
 m.appendChild(ud); m.scrollTop=m.scrollHeight;
 // typing
 var wd=document.createElement('div'); wd.className='zc-wait'; wd.textContent='...'; m.appendChild(wd);
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