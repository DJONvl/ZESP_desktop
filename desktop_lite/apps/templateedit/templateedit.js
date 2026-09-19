// templateedit.js — редактор устройства (порт static/apps/templateEdit.app).
var te_node=null;
var te_bodyEl=null;
function teCloseWindow(){ if(window.WinEngine&&te_node){ try{WinEngine.close(te_node);}catch(e){} } }
function teSetTitle(a){ var t=te_node&&te_node.querySelector(".wtitle"); if(t&&a&&a.length){ t.textContent=a[0]; } }
function te_markSave(){} // intent: none needed in Lite UI
function teShowAbout(){}
var te_mock={show:function(){},hide:function(){},bringToFront:function(){},destroy:function(){},clickClose:function(){},render:function(){}};
var te_cm1={setItemState:function(){},setState:function(){}};
window.te_timers=[];
function te_reset(){ var v=["file","fileName","filePath","docChanged","ClassterAttr","tmpFile","dragItem","dragStartIndex","dragStartY","dragStartX","dragOffsetY","isDragging","placeholder","dragContainer","currentEditObj","currentCfgObj","currentYaObj","currentYaData","sniffSelected"]; v.forEach(function(v2){ try{ window["te_"+v2]=null; }catch(e){} }); }
function te_openFromManager(ieee){ if(window.WinEngine) WinEngine.open("templateedit",{params:"1#"+ieee}); }


te_tmpFile='';
te_file='';
te_ClassterAttr=[];
te_fileName='';
te_filePath='';
te_docChanged=false;
te_exiting=false;

// Глобальные переменные для перетаскивания
te_dragItem = null;
te_dragStartIndex = 0;
te_dragStartY = 0;
te_dragStartX = 0;
te_dragOffsetY = 0;
te_isDragging = false;
te_placeholder = null;
te_dragContainer = null;


te_DeviceWidgetHandler=function(event){
let obj=""
 const target = event.target;
  let switchFlexDiv = target.closest('.switch.flex');
  if (switchFlexDiv) {
    switchFlexDiv.querySelectorAll('span, input[type="checkbox"]').forEach(element => {
	  var o=(((element.className!='undefined') ? element.className: element.type).split("#")[1]+" ").split(" ")[0]
	  if(o !='undefined'){obj=o}
    });
  }
	  console.log(obj)
	  te_drawJson(te_file,obj)
}

te_wMain_cbResizeEnd=function(){ if(!window.te_body){return;} var t=window.te_body; var w=t.clientWidth; var h=t.clientHeight; t.style.width="100%"; t.style.height="100%"; var widget=document.getElementById("te_DeviceWidget"); var widgetW=(widget&&widget.offsetWidth)||258; var json=document.getElementById("te_DeviceJson"); if(json){json.style.width=(w-widgetW-6)+"px"; json.style.height=(h)+"px";} }

te_wMain_onDrop=function(dsktp,files,dsktpRcvr)
{
	var e=files.split('@@');
	for(var x=0;x<e.length;++x)
	{
		var j=e[x].split('@');
		teOpenFromManager(j[0]);
	}
}

te_parseFile=function(file)
{
	var src = deviceList.find(function (dev) { return dev.IEEE === file; });
	if (!src) {
		console.log("te: ожидание deviceList…");
		if (!window.te_retryOnce) {
			window.te_retryOnce = true;
			var hdl = function () {
				var src2 = deviceList.find(function (dev) { return dev.IEEE === file; });
				if (src2 && !window.te_fileLoaded) { window.te_fileLoaded = true; try { te_parseFile(file); } catch (e) { console.log("te retry", e); } }
			};
			if (window.eventE) { eventE.on("updateDeviceList", hdl); window.te_retryHdl = hdl; }
			var iv = setInterval(hdl, 800);
			if (window.te_retryIv) clearInterval(window.te_retryIv);
			window.te_retryIv = iv;
		}
		return;
	}
	window.te_fileLoaded = true;
	if (window.te_retryIv) { clearInterval(window.te_retryIv); window.te_retryIv = null; }
	if (window.te_retryHdl && window.eventE) { eventE.off("updateDeviceList", window.te_retryHdl); window.te_retryHdl = null; }
	te_file={ ...src };

	// Приводим все объекты Report к новому формату сразу после загрузки
	te_migrateRoleFormat(te_file);

	console.log(te_file)
	teSetTitle([`${file} - ${te_file.ModelId}`]);


	const arr = new Set();	  
	  for (const epId in te_file.EP) {
		if (te_file.EP.hasOwnProperty(epId)) {
		  const epData = te_file.EP[epId];
		  if (epData.ClI) {epData.ClI.forEach(value => arr.add(value));}
		  if (epData.ClO) {epData.ClO.forEach(value => arr.add(value));}     

		}
	  } 
	const arrc = Array.from(arr);
	//debugger

	// ИСПРАВЛЕНИЕ: используем глобальный объект clasters вместо запроса к серверу
	te_ClassterAttr = {};
	for (const clusterId of arrc) {
		let cl=parseInt(clusterId, 16)
		////debugger
		if (clusters && clusters[cl]) {
			te_ClassterAttr[clusterId] = clusters[cl];
		} else {
			console.warn(`Кластер ${clusterId} не найден в глобальном объекте clasters`);
			te_ClassterAttr[clusterId] = { n: `Cluster_${clusterId}`, i: parseInt(clusterId, 16), a: {} };
		}
	}
	console.log('Загружены данные кластеров:', te_ClassterAttr);

	var widget=getWidget(te_file)
	document.getElementById("te_DeviceWidget" ).innerHTML=widget
	document.getElementById("te_DeviceWidget" ).style.visibility = "visible"
	te_wMain_cbResizeEnd()


	te_drawJson(te_file)
}





te_mkReport=function() {
	const generatedReports = generateReportsFromEP(te_file);
	console.log(JSON.stringify(generatedReports, null, 2));
}	
te_reqAttr = function(id) {
  console.log(id);
//reqAtribute|0A2B|01|0006|0000|1037
  var manuf = "0000"
  if (id == null) {
    const text = te_newObj.innerText;
    if (text.length !== 10) {return;}
    const ep = text.substring(0, 2);
    const cluster = text.substring(2, 6);
    const attr = text.substring(6, 10);
    id = `${ep}|${cluster}|${attr}`;
	manuf = te_Manuf.innerText//=="0000" ? "00":"01"
  }

  WSsend(`reqAtribute|${te_file.Device}|${id}|${manuf}`);
};
te_wrAttr = function(id) {
	  console.log("wrATTR")
	      const text = te_newObj.innerText;
    if (text.length !== 10) {return;}
	const ep = text.substring(0, 2);
    const cluster = text.substring(2, 6);
    const attr = text.substring(6, 10);
 let json={
	 "u16ShortAddr": te_file.Device,
	 "u8SrcEndPoint":"01",
	 "u8DstEndPoint": ep,	//"01",
	 "u16ClusterID": cluster,//"0003",
	 "u8Direction":"00",
	 "u8ManuSpecific": te_Manuf.innerText=="0000" ? "00":"01",
	 "u16ManuID": te_Manuf.innerText,//"0000",
	 "u8AttribCount":"01",
	 "u16AttribID": attr,
	 "u8AttribType": DataType.value.split(":")[0],//"20",
	 "au8Data":	te_dataVal.innerText,//"03",
	 "u8DataLen":"01"
	 }
		let attrR=JSON.stringify(json)
WSsend(`writeAtribute|${attrR}`)	  
	  
}
te_setObjAttr=function(ep,id,atr) {
	te_newObj.innerText=`${ep}${id}${atr}`
	document.getElementById("te_prevDR").className = `${te_file.IEEE}#${ep}${id}${atr}`;
	console.log(clusters[parseInt(id,16)].a[parseInt(atr,16)])
	let type=clusters[parseInt(id,16)].a[parseInt(atr,16)].t.toString(16)
	document.getElementById('DataType').value = type;
}
te_drawJsonEp = function() {
      console.log("new obj");

      function listAttr(id,ep) {
		  //debugger 
        let html = `<table>`;
        let atl = te_ClassterAttr[id].a;
        for (let [key, value] of Object.entries(atl)) {
          //html+=`<div class="gr1"></div><div class="gr2">:</div><div class="gr3">.</div>`
		let atr=Number(key).toString(16).toUpperCase().padStart(4, '0')
		var objEnbl=""
		var obj=`${ep}${id}${atr}`
		if (te_file.Report[obj]) {objEnbl=`class="objEnbl"`}//
		
		html += `<tr ${objEnbl}>
		<td onclick="te_reqAttr('${ep}|${id}|${atr}')">🔄</td>		
		<td class="te_selAttr"onclick="te_setObjAttr('${ep}','${id}','${atr}')">${atr}</td>
		<td>${value.n}</td>
		
		<td><span class="${te_file.IEEE}#${ep}${id}${atr}">?</span></td>
		</tr>`;
        
		}
        html += `</table>`;
        return html;
      }

      document.getElementById("te_DeviceJson").innerHTML = '';
      jsonData = te_file;
      let html = `<div id='obj_mnu'>
  <div class="obj-mnu-section">
    <div class="obj-mnu-row">
      <label class="obj-mnu-label">Object</label>
      <div class="obj-mnu-field-wrap">
        <div class="obj-mnu-editable" contenteditable="true" id="te_newObj" placeholder="EEPPCCCCAAAA"></div>
        <button class="obj-mnu-btn obj-mnu-btn-primary" onclick="te_Add_obj(te_newObj.innerText)" title="Добавить объект">+ Add</button>
        <button class="obj-mnu-btn obj-mnu-btn-sniff" id="te_sniffBtn" onclick="te_toggleSniff()" title="Слушать входящие репорты и собирать неизвестные объекты">🎧 Sniff</button>
      </div>
    </div>
  </div>

  <div class="obj-mnu-divider"></div>

  <div class="obj-mnu-section">
    <div class="obj-mnu-row">
      <label class="obj-mnu-label">Manuf</label>
      <div class="obj-mnu-field-wrap">
        <div class="obj-mnu-editable obj-mnu-small" contenteditable="true" id="te_Manuf">0000</div>
        <span class="obj-mnu-prev" id="te_prevDR" contenteditable="true" title="EP|Cluster|Attr"></span>
        <button class="obj-mnu-btn" onclick="te_reqAttr(null)" title="Запросить атрибут">🔄 Req</button>
      </div>
    </div>
    <div class="obj-mnu-row">
      <label class="obj-mnu-label">DataType</label>
      <div class="obj-mnu-field-wrap">
        <input list="lDTL" id="DataType" class="obj-mnu-dt-input" onclick="this.value=''" placeholder="тип...">
        <datalist id="lDTL"><option value="10: BOOLEAN"></option><option value="18: BITMAP8"></option><option value="19: BITMAP16"></option><option value="20: UINT8"></option><option value="21: UINT16"></option><option value="22: UINT24"></option><option value="23: UINT32"></option><option value="24: UINT40"></option><option value="25: UINT48"></option><option value="26: UINT56"></option><option value="27: UINT64"></option><option value="28: INT8"></option><option value="29: INT16"></option><option value="30: ENUM8"></option><option value="31: ENUM16"></option><option value="38: SEMI_PREC"></option><option value="39: SINGLE_PREC"></option><option value="41: OCTET_STR"></option><option value="42: CHAR_STR"></option><option value="43: LONG_OCTET_STR"></option><option value="44: LONG_CHAR_STR"></option><option value="48: ARRAY"></option><option value="50: SET"></option><option value="51: BAG"></option><option value="00: NO_DATA"></option><option value="08: DATA8"></option><option value="09: DATA16"></option><option value="0A: DATA24"></option><option value="0B: DATA32"></option><option value="0C: DATA40"></option><option value="0D: DATA48"></option><option value="0E: DATA56"></option><option value="0F: DATA64"></option><option value="1A: BITMAP24"></option><option value="1B: BITMAP32"></option><option value="1C: BITMAP40"></option><option value="1D: BITMAP48"></option><option value="1E: BITMAP56"></option><option value="1F: BITMAP64"></option><option value="2A: INT24"></option><option value="2B: INT32"></option><option value="2C: INT40"></option><option value="2D: INT48"></option><option value="2E: INT56"></option><option value="2F: INT64"></option><option value="3A: DOUBLE_PREC"></option><option value="4C: STRUCT"></option><option value="E0: TOD"></option><option value="E1: DATE"></option><option value="E2: UTC"></option><option value="E8: CLUSTER_ID"></option><option value="E9: ATTR_ID"></option><option value="EA: BAC_OID"></option><option value="F0: IEEE_ADDR"></option><option value="F1: 128_BIT_SEC_KEY"></option><option value="FF: UNKNOWN"></option></datalist>
        <div class="obj-mnu-editable obj-mnu-val" contenteditable="true" id="te_dataVal" placeholder="значение..."></div>
        <button class="obj-mnu-btn obj-mnu-btn-write" onclick="te_wrAttr()" type="button" title="Записать атрибут">✏️ Write</button>
      </div>
    </div>
  </div>

  <div class="obj-mnu-divider"></div>
</div>

`;

/*
  <div class="icon-menu-bar">
    <button class="icon-btn" title="Обновить" onclick="te_mkReport()">🔄</button>
  </div>

        <button class="icon-btn" title="Настройки">⚙️</button>
        <button class="icon-btn" title="Графики">📊</button>
        <button class="icon-btn" title="Журнал">📝</button>
        <button class="icon-btn" title="Экспорт">⏬</button>
        <button class="icon-btn" title="Назад">❓</button>

*/	
	
	
	

      for (const epId in jsonData.EP) {
        if (jsonData.EP.hasOwnProperty(epId)) {
          const epData = jsonData.EP[epId];
          const arr = new Set();
          if (epData.ClI) { epData.ClI.forEach(value => arr.add(value)); }
          if (epData.ClO) { epData.ClO.forEach(value => arr.add(value)); }     
          const arrc = Array.from(arr);

          arrc.forEach(value =>
            html += `<div class="te_edObj"><div class="ep">${epId}</div><div class="cl">${value}</div><div>-${te_ClassterAttr[value].n}</div></div>
                      <div class="te_edAttr ${epId}${value}">${listAttr(value,epId)}</div>`
          );
        }
      }

      document.getElementById("te_DeviceJson").innerHTML = html;
      const edObjs = document.querySelectorAll('.te_edObj');
      
      edObjs.forEach(edObj => {
        edObj.addEventListener('click', function() {
          let edAttr = this.nextElementSibling;      
          if (edAttr && edAttr.classList.contains('te_edAttr')) {
            const allEdAttrs = document.querySelectorAll('.te_edAttr');
            if (edAttr.classList.contains('show')) {
              allEdAttrs.forEach(attr => attr.classList.remove('show'));
              edObjs.forEach(obj => obj.style.display = 'flex');
            } else {
              allEdAttrs.forEach(attr => attr.classList.remove('show'));
              edObj.style.display = 'flex';
              edAttr.classList.add('show');
              edObjs.forEach(obj => {if (obj !== this) {obj.style.display = 'none';}});
            }
          }
        });
      });
	};
	
	
	
	
	

te_drawJson = function(js, obj) {
    // Helper function to clear the input field
    clearField = function(fieldId) { 
        document.getElementById(fieldId).value = ''; 
    }

    const locations = ["Зал", "Дом", "Кухня", "Детская", "Спальня", "Ванная", "Коридор"];
    
    const container = document.createDocumentFragment();
    const deviceDiv = document.createElement("div");
    deviceDiv.id = "Device_objects";
    const btnAdd = (!obj) ? "<tr><td><button onclick='te_drawJsonEp()'> + object</button></td><td></td><td></td></tr>" : "";
    
    // Создаем таблицу с deviceDiv
    deviceDiv.innerHTML = `
        <table>
            <tr><td>Type:</td><td colspan="2" id="te_typePickerCell"></td></tr>
			<tr><td>Name:</td><td><input type="text" id="te_set_Name" value="${js.Name}" onchange="te_updateDeviceField('Name', this.value)"></td><td></td></tr>
            <tr>
                <td>Location:</td>
                <td>
                    <input type="text" id="te_setLocation" value="${js.Location}" list="location" onchange="te_updateDeviceField('Location', this.value)">
                    <datalist id="location">
                        ${locations.map(loc => `<option value="${loc}"></option>`).join('')}
                    </datalist>
                </td>
                <td><span onclick='clearField("te_setLocation")' style="cursor:pointer;color:var(--red);font-size:14px;line-height:1">×</span></td>
            </tr>
            ${btnAdd}
        </table>
    `;

    container.appendChild(deviceDiv);

    // Append object-specific details if present
    if (obj) {
        const objectHeader = document.createElement("div");
        objectHeader.className = "icon-menu-bar";

        const objectSpan = document.createElement("span");
        objectSpan.className = "objsp";
        objectSpan.textContent = `Obj: ${obj}`;

        const button1 = document.createElement("button");
        button1.textContent = "✅";
        button1.className = "icon-btn";
        button1.title = "Применить";
        button1.onclick = function() {
            console.log("Кнопка 1 нажата для объекта", obj);
            te_syncLive(true);
        };

        const button2 = document.createElement("button");
        button2.textContent = "🗑️";
        button2.title = "Удалить";
        button2.className = "icon-btn";
        button2.onclick = function() {
            console.log("Кнопка 2 нажата для объекта", obj);
            if (te_file.Report && te_file.Report[obj]) {
                delete te_file.Report[obj];
                te_syncLive(true);
            }		
            te_drawJson(te_file);		
        };
        
        const button3 = document.createElement("button");
        button3.textContent = "⬅️";
        button3.title = "Выйти";
        button3.className = "icon-btn";
        button3.onclick = function() {
            console.log("Кнопка 3 нажата для объекта", obj);
            te_drawJson(te_file);
        };
        
        objectHeader.appendChild(button2);
        objectHeader.appendChild(button1);
        objectHeader.appendChild(button3);   
        objectHeader.appendChild(objectSpan);
        container.appendChild(objectHeader);

        const ro = js.Report[obj];
        const objectTable = document.createElement("table");
        const ep = obj.substring(0, 2);
        const cluster = obj.substring(2, 6);
        const attr = obj.substring(6, 10);
        
        // Create function for generating input rows
        const createInputRow = (label, id, value, disabled = false, btn = "") => `
            <tr><td>${label}</td>
                <td><input type="text" id="${obj}_${id}" ${disabled ? 'disabled' : `oninput="te_devObjEd(this.id,this.value)"`} value="${value || 0}">${btn}</td>
                <td></td></tr>`;
        
        objectTable.innerHTML = `
            ${createInputRow("Label", "te_label", ro.label)}
            ${createInputRow("Val.raw.Hex", "te_val", ro.val)}
            ${createInputRow("Mat", "te_mat", ro.mat)}
            ${createInputRow("Val.parsed", "te_parsed", ro.parsed, true)}
            ${createInputRow("Polling", "te_polling", ro.polling)}
            ${createInputRow("Debounce", "te_debounce", ro.debounce)}
            ${createInputRow("Retain", "te_retain", ro.retain)}
            <tr>
                <td>Role</td>
                <td>
                    <input type="text" id="${obj}_te_role" onchange="te_devObjEd(this.id,this.value)" value="${ro.role.split("&")[0]}" list="r_types">
                    <datalist id="r_types">
                        ${Object.keys(device_type).map(key => `<option value="${key}"></option>`).join('')}
                    </datalist>
                </td>
                <td><span onclick='clearField("${obj}_te_role")' style="cursor:pointer;color:var(--red);font-size:14px;line-height:1">×</span></td>
            </tr>
            <tr>
                <td>Dev_class</td>
                <td colspan="2">
                    <div class="class-editor-row">
                        <span class="class-preview" id="${obj}_te_classname_view">${getDeviceClass(ro)}</span>
                        <button class="obj-mnu-btn" onclick="te_openClassEditor('${obj}')">✏️ Edit</button>
                        <button class="obj-mnu-btn" onclick="te_clearClass('${obj}')">✖</button>
                    </div>
                </td>
            </tr>
            <tr>
                <td>Class_prop</td>
                <td colspan="2">
                    <div class="class-prop-preview" id="${obj}_te_classprop_view">${(()=>{try{let c=ro.class||{};delete c._dc;return Object.entries(c).map(([k,v])=>`${k}: ${v}`).join(', ')}catch(e){return ''}})()}</div>
                </td>
            </tr>
            <tr>
                <td>cfg_report</td>
                <td colspan="2">
                    <div style="display:flex;align-items:center;gap:3px;">
                        <div class="cfg-rpt-preview" id="${obj}_te_cfg_report_view">${(()=>{try{if(!ro.cfg_report)return '<span style=\"color:#bbb\">—</span>';const c=(typeof ro.cfg_report==='object')?ro.cfg_report:JSON.parse(ro.cfg_report);return `Dt:<b>${c.DataType}</b> ${parseInt(c.MinInterval,16)}..${parseInt(c.MaxInterval,16)}s Δ${parseInt(c.Change,16)}`}catch(e){return '<span style=\"color:#bbb\">—</span>'}})()}</div>
                        <button class="obj-mnu-btn" style="padding:1px 5px" onclick="te_openCfgReportEditor('${obj}')">✏️</button>
                        <button class="obj-mnu-btn" style="padding:1px 5px" onclick="te_clearCfgReport('${obj}')">✖</button>
                    </div>
                </td>
            </tr>
            <tr>
                <td>Location</td>
                <td colspan="2">
                    <input type="text"
                        id="${obj}_te_location"
                        value="${ro.location || ''}"
                        placeholder="${js.Location || 'как у устройства'}"
                        list="location"
                        oninput="te_devObjEd(this.id, this.value)">
                </td>
                <td><span onclick='clearField("${obj}_te_location")' style="cursor:pointer;color:var(--red);font-size:14px;line-height:1">×</span></td>
            </tr>
            <tr>
                <td>Ya_rep</td>
                <td colspan="2">
                    <div style="display:flex;align-items:center;gap:3px;">
                        <div class="ya-rep-preview" id="${obj}_te_ya_rep_view">${(()=>{
                            const v=ro.ya_rep;
                            if(!v||v==='none')return '<span style="color:#bbb">none</span>';
                            try{
                                const o=(typeof v==='object')?v:JSON.parse(v);
                                if(o.capabilities)return '⚡ '+o.capabilities.map(c=>{
                                    const t=c.type.replace('devices.capabilities.','');
                                    const inst=(c.parameters&&c.parameters.instance)||'';
                                    return inst?t+':'+inst:t;
                                }).join(', ');
                                if(o.properties)return '📊 '+o.properties.map(p=>p.parameters&&p.parameters.instance||p.type.replace('devices.properties.','')).join(', ');
                            }catch(e){}
                            return String(v).substring(0,40);
                        })()}</div>
                        <button class="obj-mnu-btn" style="padding:1px 5px" onclick="te_openYaRepEditor('${obj}')">✏️</button>
                        <button class="obj-mnu-btn" style="padding:1px 5px" onclick="te_clearYaRep('${obj}')">✖</button>
                    </div>
                </td>
                <td><span onclick='clearField("${obj}_te_ya_rep")' style="cursor:pointer;color:var(--red);font-size:14px;line-height:1">×</span></td>
            </tr>
        `;
        container.appendChild(objectTable);
    } else {
        // Создаем контейнер для перетаскиваемых элементов
        const dragContainer = document.createElement("div");
        dragContainer.id = "te_dragContainer";
        dragContainer.style.position = "relative";
        dragContainer.style.minHeight = "200px";
        
        for (let [key, value] of Object.entries(js.Report)) {
            const object = document.createElement("div");
            object.id = key;
            object.className = "objsp";
            object.setAttribute("onclick", "te_objEd(this.id)");
            object.setAttribute("ontouchend", "te_objEd(this.id)");
            object.textContent = `${key} - ${value.label}`;
            
            object.addEventListener('mousedown', te_startDrag);
            object.addEventListener('touchstart', te_startDrag, {passive: false});
            
            dragContainer.appendChild(object);
        }
        container.appendChild(dragContainer);
    }
    
    // Очищаем и заполняем DeviceJson
    const deviceJson = document.getElementById("te_DeviceJson");
    deviceJson.innerHTML = '';
    deviceJson.appendChild(container);

    // ========== ИСПРАВЛЕНИЕ: СОЗДАЕМ ПИКЕР ПОСЛЕ ДОБАВЛЕНИЯ В DOM ==========
    // Небольшая задержка для гарантии, что DOM обновился
    setTimeout(function() {
        const typePickerCell = document.getElementById('te_typePickerCell');
        
        if (typePickerCell) {
            console.log('typePickerCell найден, создаем пикер');
            
            // Очищаем ячейку
            typePickerCell.innerHTML = '';
            
            if (window.DeviceTypePicker) {
                try {
                    // Уничтожаем старый пикер если есть
                    if (window.te_typePicker) {
                        try { window.te_typePicker.destroy(); } catch(e) {}
                    }
                    
                    // Создаем новый пикер
                    window.te_typePicker = new DeviceTypePicker({
                        value: js.type || '',
                        onChange: function(val) {
                            te_updateDeviceField('type', val);
                        }
                    });
                    
                    // Добавляем в DOM
                    if (window.te_typePicker && window.te_typePicker.el) {
                        typePickerCell.appendChild(window.te_typePicker.el);
                        console.log('Пикер успешно добавлен');
                    } else {
                        console.error('Пикер создан, но нет el');
                        typePickerCell.innerHTML = '<input type="text" value="' + (js.type || '') + '" onchange="te_updateDeviceField(\'type\', this.value)" style="width:100%">';
                    }
                } catch (e) {
                    console.error('Ошибка создания пикера:', e);
                    typePickerCell.innerHTML = '<input type="text" value="' + (js.type || '') + '" onchange="te_updateDeviceField(\'type\', this.value)" style="width:100%">';
                }
            } else {
                console.warn('DeviceTypePicker не найден, используем запасной вариант');
                typePickerCell.innerHTML = '<input type="text" value="' + (js.type || '') + '" onchange="te_updateDeviceField(\'type\', this.value)" style="width:100%">';
            }
        } else {
            console.error('typePickerCell не найден в DOM');
        }
    }, 50); // Небольшая задержка для гарантии
}
// Функции для обработки перетаскивания
te_startDrag = function(e) {
    // Не вызываем preventDefault здесь — иначе click не сработает никогда
    te_dragItem = this;
    te_isDragging = false; // Пока не началось реальное движение — не драг

    te_dragStartY = e.clientY || (e.touches && e.touches[0].clientY);
    te_dragStartX = e.clientX || (e.touches && e.touches[0].clientX);
    te_dragStartIndex = Array.from(te_dragItem.parentNode.children).indexOf(te_dragItem);
    te_dragOffsetY = te_dragStartY - te_dragItem.getBoundingClientRect().top;

    document.addEventListener('mousemove', te_onDrag);
    document.addEventListener('touchmove', te_onDrag, {passive: false});
    document.addEventListener('mouseup', te_stopDrag);
    document.addEventListener('touchend', te_stopDrag);
};

te_onDrag = function(e) {
    if (!te_dragItem) return;

    const y = e.clientY || (e.touches && e.touches[0].clientY);
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    if (!y) return;

    // Активируем drag только после реального движения (порог 5px)
    if (!te_isDragging) {
        const dy = Math.abs(y - te_dragStartY);
        const dx = Math.abs(x - te_dragStartX);
        if (dy < 5 && dx < 5) return;

        // Теперь реально начинаем drag
        te_isDragging = true;

        te_placeholder = document.createElement("div");
        te_placeholder.className = "objsp-placeholder";
        te_placeholder.style.height = te_dragItem.offsetHeight + "px";
        te_placeholder.style.marginBottom = "4px";

        te_dragItem.parentNode.insertBefore(te_placeholder, te_dragItem);
        te_dragContainer = te_placeholder.parentNode;
        te_dragItem.parentNode.removeChild(te_dragItem);

        document.body.appendChild(te_dragItem);
        te_dragItem.style.position = 'absolute';
        te_dragItem.style.zIndex = '1000';
        te_dragItem.style.opacity = '0.8';
        te_dragItem.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        te_dragItem.style.cursor = 'grabbing';
        te_dragItem.style.width = te_placeholder.offsetWidth + 'px';
        te_dragItem.style.left = te_placeholder.getBoundingClientRect().left + 'px';
    }

    e.preventDefault();

    // Перемещаем элемент
    te_dragItem.style.top = (y - te_dragOffsetY) + 'px';
    
    // Определяем новый индекс для элемента
    const items = Array.from(te_dragContainer.children);
    const dragRect = te_dragItem.getBoundingClientRect();
    const dragCenterY = dragRect.top + dragRect.height / 2;
    
    let newIndex = -1;
    
    for (let i = 0; i < items.length; i++) {
        if (items[i] === te_placeholder) continue;
        
        const itemRect = items[i].getBoundingClientRect();
        const itemCenterY = itemRect.top + itemRect.height / 2;
        
        if (dragCenterY < itemCenterY) {
            newIndex = i;
            break;
        }
    }
    
    // Если элемент переместили в конец
    if (newIndex === -1) {
        newIndex = items.length;
    }
    
    // Перемещаем плейсхолдер в новую позицию
    const currentIndex = Array.from(te_dragContainer.children).indexOf(te_placeholder);
    if (newIndex !== currentIndex) {
        if (newIndex === te_dragContainer.children.length) {
            te_dragContainer.appendChild(te_placeholder);
        } else {
            const targetElement = te_dragContainer.children[newIndex];
            if (targetElement !== te_placeholder) {
                te_dragContainer.insertBefore(te_placeholder, targetElement);
            }
        }
    }
};

te_stopDrag = function(e) {
    if (!te_dragItem) return;

    // Убираем обработчики в любом случае
    document.removeEventListener('mousemove', te_onDrag);
    document.removeEventListener('touchmove', te_onDrag);
    document.removeEventListener('mouseup', te_stopDrag);
    document.removeEventListener('touchend', te_stopDrag);

    if (!te_isDragging) {
        // Движения не было — это был обычный клик, не мешаем
        te_dragItem = null;
        return;
    }

    // Был реальный drag — завершаем его
    te_isDragging = false;

    // Возвращаем элемент на место плейсхолдера
    te_placeholder.parentNode.insertBefore(te_dragItem, te_placeholder);
    te_placeholder.parentNode.removeChild(te_placeholder);
    te_placeholder = null;

    // Восстанавливаем стили
    te_dragItem.style.position = '';
    te_dragItem.style.top = '';
    te_dragItem.style.left = '';
    te_dragItem.style.zIndex = '';
    te_dragItem.style.opacity = '';
    te_dragItem.style.boxShadow = '';
    te_dragItem.style.cursor = '';
    te_dragItem.style.width = '';

    // Обновляем порядок в данных
    te_updateReportOrder();

    te_dragItem = null;
    te_dragContainer = null;
};

te_updateReportOrder = function() {
    // Получаем новый порядок элементов
    const newOrder = Array.from(te_dragContainer.children).map(item => item.id);
    
    // Создаем новый объект Report с обновленным порядком
    const newReport = {};
    for (const key of newOrder) {
        if (te_file.Report[key]) {
            newReport[key] = te_file.Report[key];
        }
    }
    
    // Обновляем файл
    te_file.Report = newReport;
    te_docChanged = true;
	var widget=getWidget(te_file)
	document.getElementById("te_DeviceWidget" ).innerHTML=widget
    console.log('Порядок обновлен:', newOrder);
	te_markSave(0);
	let ind=deviceList.findIndex(d => d.IEEE === te_file.IEEE)
	if(ind>=0){deviceList[ind]=te_file}
	try{redrawDevice(te_file.IEEE)}catch{}
};

te_liveTmr = null;
// ponytail: один синк вместо копипасты в каждом редакторе; десктоп-пуш с дебаунсом чтобы oninput не дёргал грид на каждую букву
te_syncLive = function(immediate) {
    try {
        var w = document.getElementById("te_DeviceWidget");
        if (w) w.innerHTML = getWidget(te_file);
    } catch(e) {}
    te_docChanged = true;
    try { te_markSave(0); } catch(e) {}
    var push = function() {
        try {
            var ind = deviceList.findIndex(function(d){ return d.IEEE === te_file.IEEE; });
            if (ind >= 0) deviceList[ind] = te_file;
        } catch(e) {}
        try { if (typeof redrawDevice === "function") redrawDevice(te_file.IEEE); } catch(e) {}
        try { if (window.eventE) eventE.emit("updateDeviceList", deviceList); } catch(e) {}
    };
    if (immediate) { push(); return; }
    if (te_liveTmr) clearTimeout(te_liveTmr);
    te_liveTmr = setTimeout(push, 300);
};

te_devObjEd=function(id,value){
	console.log(id,value)
	// id формата "<obj>_te_<key>", obj сам может содержать "_" (s_illuminance):
	// key — последний кусок, перед ним "te", остальное — obj.
	let parts=id.split("_");
	let key=parts.pop();
	parts.pop();
	let obj=parts.join("_");
	// ya_rep и cfg_report хранятся как объекты — парсим если пришла JSON-строка
	if((key==='ya_rep'||key==='cfg_report') && typeof value==='string'
	   && value!=='none' && value!==''){
		try{ value=JSON.parse(value); }catch(e){}
	}
	// Числовые поля — конвертируем в int
	if(key==='polling'||key==='debounce'){
		value=parseInt(value)||0;
	}
	if(key==='retain'){
		value=String(parseInt(value))||"0";
	}
	// location пустое — удаляем чтобы наследовать от устройства
	if(key==='location'){
		if(!value || value.trim()===''){
			delete te_file.Report[obj][key];
			te_syncLive();
			return;
		}
		value = value.trim();
	}
	te_file.Report[obj][key]=value

	if(key==='role') te_setClassOptions(value)

	te_syncLive();
}

te_saveDeviceChanges=function(){
	te_cmSave_click();
}


te_objEd=function(obj,value){
	console.log(obj,value)
	te_drawJson(te_file,obj)
}



// Функция для установки класса на основе выбранной роли
te_setClassOptions = function(role) {
		const roleInput = document.getElementById("te_role");
		const classInput = document.getElementById("te_class");
	console.log(device_type[role])
	  return  
	if (!roleInput || !classInput) return;
    const [device_class, jsonString] = roleInput.value.split("&");
    const device = JSON.parse(jsonString);

    if (device && device.device_class) {
        classInput.textContent = device.device_class;
    } else {
        classInput.textContent = '';
    }
	
	
	
	
};



te_getClass=function(json)
{
  if (json.class && json.class.device_class) {
    return json.class;
  } else if (json.role && json.role.includes("&")) {
    try {
      const parsedRole = JSON.parse(json.role.split("&")[1]);
      if (parsedRole) {
        return parsedRole;
      }
    } catch (e) {}
  }



  return {};

}



te_loadFile=function(file)
{
	te_parseFile(file);
}
	

te_cmExit_click=function()
{
	teCloseWindow();
}

te_cbSaveAs=function(file)
{
	te_parseFile(file);
	te_docChanged=true;
	te_cmSave_click();
}
// Приводит все объекты Report к новому формату:
// - role: только базовая строка (без &json), class — отдельный объект
// - cfg_report: объект, не строка
function te_migrateRoleFormat(file) {
	if (!file || !file.Report) return;
	for (const key of Object.keys(file.Report)) {
		const ro = file.Report[key];
		if (!ro) continue;
		// role: убираем &json
		if (typeof ro.role === 'string') {
			const ampIdx = ro.role.indexOf('&');
			if (ampIdx !== -1) {
				const roleBase = ro.role.substring(0, ampIdx).trim();
				if (!ro.class || !Object.keys(ro.class).length) {
					try { ro.class = JSON.parse(ro.role.substring(ampIdx + 1)); } catch { ro.class = {}; }
				}
				ro.role = roleBase;
			}
			if (!ro.class) ro.class = {};
		}
		// cfg_report: строку → объект
		if (typeof ro.cfg_report === 'string' && ro.cfg_report !== '') {
			try { ro.cfg_report = JSON.parse(ro.cfg_report); } catch {}
		}
		// Числовые поля — добавляем если нет, конвертируем строки в int
		if (ro.polling === undefined || ro.polling === null) ro.polling = 0;
		else ro.polling = parseInt(ro.polling) || 0;

		if (ro.debounce === undefined || ro.debounce === null) ro.debounce = 0;
		else ro.debounce = parseInt(ro.debounce) || 0;

		if (ro.retain === undefined || ro.retain === null) ro.retain = "0";
		else ro.retain = String(parseInt(ro.retain)) || "0";
	}
}

te_cmSave_click=function()
{
	te_fileName
	if(!te_docChanged &&te_file!='')
		return;

	te_migrateRoleFormat(te_file);
	//SaveJson(`/Devices/${te_fileName}`, JSON.stringify(te_file))
	WSsend(`SaveJson|/Devices/${te_fileName}|` + JSON.stringify(te_file));
	te_markSave(1);	
	let ind=deviceList.findIndex(d => d.IEEE === te_file.IEEE)
	if(ind>=0){deviceList[ind]=te_file}
	// Живое обновление десктопа: плитки подтянутся по alldev-бродкасту с бэка,
	// открытый попап устройства перерисовываем сразу
	try{ if(typeof redrawDevice==="function") redrawDevice(te_file.IEEE); }catch(e){}
	try{ if(window.eventE) eventE.emit("updateDeviceList", deviceList); }catch(e){}
	try{
		var dw=document.getElementById("DeviceWidget");
		if(dw && dw.style.visibility==="visible") dw.innerHTML=getWidget(te_file.IEEE);
	}catch(e){}
}

te_cmSaveTmpl_click=function()
{
	if(!te_file || te_file===''){
		alert('Нет открытого устройства');
		return;
	}
	const sanitize = s => (s||'').trim().replace(/[\/\\:*?"<>|]/g,'_');
	const mid = sanitize(te_file.ModelId);
	const mf  = sanitize(te_file.ManufName);
	const tplName = (mid && mf) ? `${mid}_${mf}` : (mid || mf || 'unknown');
	const confirmed = confirm(`Сохранить шаблон?\n\nФайл: Devtemplates/${tplName}\n\nModelId:   ${te_file.ModelId||'—'}\nManufName: ${te_file.ManufName||'—'}`);
	if(!confirmed) return;
const templateData = JSON.parse(JSON.stringify(te_file));
te_migrateRoleFormat(templateData);
templateData.IEEE = "";
templateData.Device = "";
templateData.Location = "Дом";
templateData.leave = 0;
templateData.sh3d = "";
SaveJson(`/Devtemplates/${tplName}`, JSON.stringify(templateData));	
	alert(`✅ Шаблон сохранён:\nDevtemplates/${tplName}`);
}

te_resIconDesktop=function(xmlDoc){ /* not-needed */ }
te_docChange=function()
{
	te_markSave(0);
	te_docChanged=true;
	if(te_fileName)
		teSetTitle(['*'+te_fileName+" ("+te_filePath.substring(0,te_filePath.length-1)+") - Text editor"]);
}
te_wMain_destroy = function() {
    // Очищаем все таймеры
    const timers = te_timers || [];
    timers.forEach(timer => clearTimeout(timer));
    
    // Удаляем обработчики событий
    const cleanUpElement = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.removeEventListener(event, handler);
    };
    
    cleanUpElement("te_DeviceWidget", "click", te_DeviceWidgetHandler);
    cleanUpElement("te_DeviceWidget", "touchend", te_DeviceWidgetHandler);
    
    // Очищаем контейнеры
    const cleanContainer = (id) => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = '';
    };
    
    cleanContainer("te_DeviceJson");
    cleanContainer("te_DeviceWidget");
    
    // Закрываем дочерние окна
    [te_wConfirmExit, te_wAbout].forEach(w => {
        if (w && typeof w.destroy === 'function') w.destroy();
    });
    
    // Очищаем глобальные переменные
    const vars = ['file', 'fileName', 'filePath', 'docChanged', 'ClassterAttr', 'tmpFile'];
    vars.forEach(function(v){ try{ window["te_"+v]=null; }catch(e){} });
    
    // Выгружаем приложение
    ;
    return true;
};	

te_wConfirmExit_destroy=function()
{
	if(!te_exiting)
	{
		;
		;
		te_mock.hide();
		return false;
	}
	return true;
}
te_wAbout_destroy=function()
{
	if(!te_exiting)
	{
		;
		;
		te_mock.hide();
		return false;
	}
	return true;
}
te_exitNoSave=function()
{
	te_exiting=true;
	teCloseWindow();
}
te_cancelExit=function()
{
	setTimeout("te_wConfirmExit.clickClose()",100);
}
te_saveFile=function()
{
	te_exiting=true;
	te_mock.hide();
	te_cmSave_click();
}
te_cmAbout_click=function()
{
	teShowAbout();
	te_mock.show();
	te_mock.bringToFront();
}
te_wMain_about=function()
{
	te_cmAbout_click();
}

    // Маппинг кластеров на их роли и метки
    const te_clusterMappings = {
        '0000': { label: 'Basic', role: 'system' },
        '0003': { label: 'Identify', role: 'system' },
        '0004': { label: 'Groups', role: 'system' },
        '0005': { label: 'Scenes', role: 'system' },
        '0006': { label: 'On_Off', role: 'switch' },
        '0008': { label: 'Level', role: 'light' },
        '000A': { label: 'Time', role: 'system' },
        '0013': { label: 'Multistate', role: 'sensor' },
        '0021': { label: 'Diagnostics', role: 'system' },
        '0300': { label: 'Color', role: 'light' },
        '0402': { label: 'Temperature', role: 'sensor' },
        '0403': { label: 'Pressure', role: 'sensor' },
        '0405': { label: 'Humidity', role: 'sensor' },
        '0406': { label: 'Occupancy', role: 'sensor' },
        'E000': { label: 'Custom1', role: 'sensor' },
        'E001': { label: 'Custom2', role: 'sensor' }
    };
function generateReportsFromEP(epData) {
    const reports = {};
    


    // Маппинг типов данных для конфигурации репортинга
    const dataTypeMappings = {
        'switch': '10',    // Boolean
        'light': '20',     // 8-bit unsigned (для Level)
        'color': '19',     // Структура для Color
        'temperature': '29', // 16-bit signed
        'humidity': '21',  // 16-bit unsigned
        'default': '20'    // По умолчанию
    };

    // Перебираем все EndPoints
    for (const [endpoint, epConfig] of Object.entries(epData.EP)) {
        // Перебираем все входные кластеры (ClI)
        for (const cluster of epConfig.ClI) {
            const mapping = te_clusterMappings[cluster] || { label: `Cluster_${cluster}`, role: 'sensor' };
            const reportKey = `${endpoint}${cluster}0000`;
            
            // Определяем тип данных для cfg_report
            let dataType = dataTypeMappings[mapping.role] || dataTypeMappings['default'];
            if (cluster === '0300') dataType = dataTypeMappings['color'];
            if (cluster === '0402') dataType = dataTypeMappings['temperature'];
            if (cluster === '0405') dataType = dataTypeMappings['humidity'];
            
            reports[reportKey] = {
                label: mapping.label,
                val: "",
                mat: "1",
                role: mapping.role,
                parsed: "",
                polling: 0,
                debounce: 0,
                cfg_report: {
                    DataType: dataType,
                    MinInterval: "0001",
                    MaxInterval: "012C",
                    TimeOut: "0000",
                    Change: mapping.role === 'sensor' ? "0001" : "0000"
                },
                retain: "0",
                ya_rep: "none"
            };
        }
    }

    return reports;
}


te_Add_obj=function(id) {
	console.log(id)	
if (te_file.Report[id]) {alert("Уже существует");return}//objEnbl
    const cluster=id.substring(2, 6);
	const attr=id.substring(6, 10);
	const mapping = te_clusterMappings[cluster] || { label: `Cluster_${cluster}`, role: 'sensor' };
    const dataTypeMappings = {
        'switch': '10',    // Boolean
        'light': '20',     // 8-bit unsigned (для Level)
        'color': '19',     // Структура для Color
        'temperature': '29', // 16-bit signed
        'humidity': '21',  // 16-bit unsigned
        'default': '20'    // По умолчанию
    };	
            // Определяем тип данных для cfg_report
            let dataType = dataTypeMappings[mapping.role] || dataTypeMappings['default'];
            if (cluster === '0300') dataType = dataTypeMappings['color'];
            if (cluster === '0402') dataType = dataTypeMappings['temperature'];
            if (cluster === '0405') dataType = dataTypeMappings['humidity'];	
	
	te_file.Report[id] = {
                label: mapping.label,
                val: "",
                mat: "1",
                role: mapping.role,
                parsed: "",
                polling: 0,
                debounce: 0,
                cfg_report: {
                    DataType: dataType,
                    MinInterval: "0001",
                    MaxInterval: "012C",
                    TimeOut: "0000",
                    Change: mapping.role === 'sensor' ? "0001" : "0000"
                },
                retain: "0",
                ya_rep: "none"
            };
	te_syncLive(true);

const rows = document.querySelectorAll('.te_edAttr.show table tbody tr');	
rows.forEach(row => {
  const firstCell = row.querySelector('td:first-child');
  if (firstCell && firstCell.textContent.trim() === attr) {
    row.classList.add('objEnbl');
  }
});	
	
	
	
	

}







// ============================================================
// SNIFF / LISTEN — сбор неизвестных репортов
// ============================================================

te_sniffActive  = false;   // флаг активности
te_sniffBuf     = {};      // { objKey: [rep, rep, ...] } max 8 на ключ
te_sniffHandler = null;    // ссылка на обработчик eventE

te_toggleSniff = function() {
    if (te_sniffActive) {
        te_stopSniff();
    } else {
        te_startSniff();
    }
};

te_startSniff = function() {
    te_sniffActive = true;
    te_sniffBuf    = {};

    // Меняем кнопку
    var btn = document.getElementById('te_sniffBtn');
    if (btn) {
        btn.textContent  = '⏹ Stop';
        btn.title        = 'Остановить прослушивание';
        btn.style.background = '#c0392b';
        btn.style.color      = '#fff';
    }

    // Показываем панель
    var panel = document.getElementById('te_sniffPanel');
    if (panel) panel.style.display = 'block';

    // Подписываемся на все репорты через eventE
    te_sniffHandler = function(args) {
        var rep  = args[0];
        var ieee = args[1];

        // Только наше устройство
        if (ieee !== te_file.IEEE) return;

        // Ключ объекта
        var objKey = rep.Obj || (rep.EndPoint + rep.ClusterId + rep.AttribId);
        if (!objKey || objKey === 'undefinedundefinedundefined') return;

        // Пропускаем уже прописанные объекты
        if (te_file.Report && te_file.Report[objKey]) return;

        // Накапливаем, не более 8 на объект
        if (!te_sniffBuf[objKey]) te_sniffBuf[objKey] = [];
        var buf = te_sniffBuf[objKey];
        buf.push({
            parsed : rep.parsed,
            Data   : rep.Data,
            Dtype  : rep.Dtype,
            time   : rep.time || Date.now()
        });
        if (buf.length > 8) buf.shift();

        te_renderSniffList();
    };

    eventE.on('report',      te_sniffHandler);
    eventE.on('reportUndef', te_sniffHandler);
};

te_stopSniff = function() {
    te_sniffActive = false;

    if (te_sniffHandler) {
        eventE.off('report',      te_sniffHandler);
        eventE.off('reportUndef', te_sniffHandler);
        te_sniffHandler = null;
    }

    // Возвращаем кнопку
    var btn = document.getElementById('te_sniffBtn');
    if (btn) {
        btn.textContent  = '🎧 Sniff';
        btn.title        = 'Слушать входящие репорты';
        btn.style.background = '';
        btn.style.color      = '';
    }
};

te_clearSniff = function() {
    te_sniffBuf = {};
    te_renderSniffList();
};

// Текущий выделенный объект в sniff-панели
te_sniffSelected = null;

te_renderSniffList = function() {
    var list  = document.getElementById('te_sniffList');
    var count = document.getElementById('te_sniffCount');
    if (!list) return;

    var keys = Object.keys(te_sniffBuf);
    if (count) count.textContent = keys.length;

    if (keys.length === 0) {
        list.innerHTML = '<div class="sniff-empty">Ожидание репортов...</div>';
        return;
    }

    var html = '';
    keys.forEach(function(objKey) {
        var entries = te_sniffBuf[objKey];
        var last    = entries[entries.length - 1];

        var ep  = objKey.substring(0, 2);
        var cl  = objKey.substring(2, 6);
        var at  = objKey.substring(6, 10);
        var keyLabel = (objKey.length >= 10)
            ? '<span class="ep">' + ep + '</span><span class="cl">' + cl + '</span><b>' + at + '</b>'
            : '<b>' + objKey + '</b>';

        var vals = entries.map(function(e) {
            var v = (e.parsed !== undefined && e.parsed !== '') ? e.parsed : e.Data;
            return '<span class="sniff-val">' + v + '</span>';
        }).join('');

        var dtype = last.Dtype ? ('0x' + parseInt(last.Dtype, 10).toString(16).toUpperCase().padStart(2,'0')) : '?';
        var isSelected = (te_sniffSelected === objKey);
        var selectedClass = isSelected ? ' sniff-item-selected' : '';

        html += '<div class="sniff-item' + selectedClass + '" onclick="te_sniffSelect(&quot;' + objKey + '&quot;)">'
              + '  <div class="sniff-item-head">'
              + '    <span class="sniff-key">' + keyLabel + '</span>'
              + '    <span class="sniff-dtype">' + dtype + '</span>'
              + '    <span class="sniff-cnt">' + entries.length + 'р</span>'
              + '    <button class="sniff-add-btn" onclick="event.stopPropagation();te_sniffAddObj(&quot;' + objKey + '&quot;)" title="Добавить">+</button>'
              + '  </div>'
              + '  <div class="sniff-vals">' + vals + '</div>'
              + '</div>';
    });

    list.innerHTML = html;
};

// Клик по объекту — выделяем и вставляем в поле newObj
te_sniffSelect = function(objKey) {
    te_sniffSelected = objKey;

    // Вставляем в поле ввода объекта если оно есть
    var newObj = document.getElementById('te_newObj');
    if (newObj) newObj.innerText = objKey;

    // Обновляем визуальное выделение без перерисовки всего списка
    var items = document.querySelectorAll('#te_sniffList .sniff-item');
    items.forEach(function(el) { el.classList.remove('sniff-item-selected'); });
    var all = document.querySelectorAll('#te_sniffList .sniff-item');
    // Находим нужный по содержимому onclick
    all.forEach(function(el) {
        if (el.getAttribute('onclick') && el.getAttribute('onclick').indexOf(objKey) !== -1) {
            el.classList.add('sniff-item-selected');
        }
    });
};

// Добавить конкретный объект — вызывается кнопкой + у каждого объекта
te_sniffAddObj = function(objKey) {
    if (te_file.Report && te_file.Report[objKey]) {
        new Toast({ title: 'Sniff', text: objKey + ' уже существует', theme: 'light', autohide: true, interval: 2000 });
        return;
    }

    var entries = te_sniffBuf[objKey] || [];
    var last    = entries[entries.length - 1] || {};

    var cl = objKey.substring(2, 6).toUpperCase();
    var mapping = (te_clusterMappings && te_clusterMappings[cl])
        ? te_clusterMappings[cl]
        : { label: 'Attr_' + objKey, role: 'sensor' };

    var dtypeDec = last.Dtype ? parseInt(last.Dtype, 10) : 33;
    var dtypeHex = dtypeDec.toString(16).toUpperCase().padStart(2, '0');

    te_file.Report[objKey] = {
        label     : mapping.label,
        val       : (last.parsed !== undefined) ? last.parsed : '',
        mat       : '1',
        role      : mapping.role,
        parsed    : (last.parsed !== undefined) ? last.parsed : '',
        cfg_report: {
            DataType   : dtypeHex,
            MinInterval: '0001',
            MaxInterval: '012C',
            TimeOut    : '0000',
            Change     : '0001'
        },
        retain: '0',
        ya_rep: 'none'
    };

    // Объект добавлен — убираем из буфера, он больше не "неизвестный"
    delete te_sniffBuf[objKey];
    if (te_sniffSelected === objKey) te_sniffSelected = null;

    // Обновляем виджет + десктоп — панель sniff НЕ трогаем
    te_syncLive(true);

    // Если правая панель показывает список объектов — обновляем её тоже
    if (document.getElementById('obj_mnu')) {
        te_drawJsonEp();
    }

    te_renderSniffList();
    new Toast({ title: 'Sniff', text: '+ ' + objKey, theme: 'light', autohide: true, interval: 2000 });
};

// Добавить все перехваченные объекты сразу
te_sniffAddAll = function() {
    var keys = Object.keys(te_sniffBuf);
    if (keys.length === 0) return;
    keys.forEach(function(k) { te_sniffAddObj(k); });
    new Toast({ title: 'Sniff', text: 'Добавлено: ' + keys.length + ' объектов', theme: 'light', autohide: true, interval: 3000 });
};

// Останавливаем sniff при закрытии редактора
var _origCloseApp = (typeof te_closeApp !== 'undefined') ? te_closeApp : function(){};
te_closeApp = function() {
    te_stopSniff();
    _origCloseApp();
};

// ============================================================
// CLASS EDITOR
// ============================================================

// Полная база классов HA по ролям
te_HA_CLASSES = {
  sensor: {
    device_classes: [
      "apparent_power","aqi","atmospheric_pressure","battery","battery_charge_level",
      "blood_glucose_concentration","carbon_dioxide","carbon_monoxide","conductivity",
      "current","data_rate","data_size","date","distance","duration","energy",
      "energy_storage","frequency","gas","humidity","illuminance","irradiance",
      "moisture","monetary","nitrogen_dioxide","nitrogen_monoxide","nitrous_oxide",
      "ozone","ph","pm1","pm10","pm25","power","power_factor","precipitation",
      "precipitation_intensity","pressure","reactive_power","signal_strength",
      "sound_pressure","speed","sulphur_dioxide","temperature","timestamp",
      "uv","volatile_organic_compounds","volatile_organic_compounds_parts",
      "voltage","volume","volume_flow_rate","volume_storage","water","weight",
      "wind_speed","text","force_update"
    ],
    props: {
      "unit_of_measurement": {"type":"text","hint":"°C, %, V, A, W, lx, hPa, ppm ..."},
      "state_class":         {"type":"select","options":["measurement","total","total_increasing"]},
      "device_class":        {"type":"select","options":[]},
      "force_update":        {"type":"bool"},
      "suggested_display_precision": {"type":"number","hint":"0-4"},
      "icon":                {"type":"text","hint":"mdi:thermometer"}
    }
  },
  binary_sensor: {
    device_classes: [
      "battery","battery_charging","carbon_monoxide","cold","connectivity","door",
      "garage_door","gas","heat","light","lock","moisture","motion","moving",
      "occupancy","opening","plug","power","presence","problem","running","safety",
      "smoke","sound","tamper","update","vibration","window"
    ],
    props: {
      "device_class":  {"type":"select","options":[]},
      "payload_on":    {"type":"text","hint":"1 / true / ON"},
      "payload_off":   {"type":"text","hint":"0 / false / OFF"},
      "icon":          {"type":"text","hint":"mdi:door"},
      "off_delay":     {"type":"number","hint":"секунды"}
    }
  },
  switch: {
    device_classes: ["outlet","switch"],
    props: {
      "device_class":    {"type":"select","options":[]},
      "icon":            {"type":"text","hint":"mdi:power-socket"},
      "entity_category": {"type":"select","options":["config","diagnostic"]}
    }
  },
  light: {
    device_classes: [],
    props: {
      "color_mode":          {"type":"select","options":["onoff","brightness","color_temp","hs","xy","rgb","rgbw","rgbww","white"]},
      "icon":                {"type":"text","hint":"mdi:lightbulb"},
      "entity_category":     {"type":"select","options":["config","diagnostic"]}
    }
  },
  button: {
    device_classes: ["identify","restart","update"],
    props: {
      "device_class":    {"type":"select","options":[]},
      "icon":            {"type":"text","hint":"mdi:restart"},
      "entity_category": {"type":"select","options":["config","diagnostic"]}
    }
  },
  number: {
    device_classes: [],
    props: {
      "min":                  {"type":"number","hint":"0"},
      "max":                  {"type":"number","hint":"100"},
      "step":                 {"type":"number","hint":"1"},
      "unit_of_measurement":  {"type":"text","hint":"%"},
      "mode":                 {"type":"select","options":["auto","box","slider"]},
      "icon":                 {"type":"text","hint":"mdi:volume-high"},
      "entity_category":      {"type":"select","options":["config","diagnostic"]}
    }
  },
  select: {
    device_classes: [],
    props: {
      "options": {"type":"text","hint":"val1,val2,val3"},
      "icon":    {"type":"text","hint":"mdi:format-list-bulleted"},
      "entity_category": {"type":"select","options":["config","diagnostic"]}
    }
  },
  cover: {
    device_classes: ["awning","blind","curtain","damper","door","garage","gate","shade","shutter","window"],
    props: {
      "device_class":      {"type":"select","options":[]},
      "payload_open":      {"type":"text","hint":"1"},
      "payload_close":     {"type":"text","hint":"0"},
      "payload_stop":      {"type":"text","hint":"2"},
      "position_open":     {"type":"number","hint":"100"},
      "position_closed":   {"type":"number","hint":"0"},
      "icon":              {"type":"text","hint":"mdi:curtains"}
    }
  },
  climate: {
    device_classes: [],
    props: {
      "min_temp":   {"type":"number","hint":"5"},
      "max_temp":   {"type":"number","hint":"35"},
      "temp_step":  {"type":"number","hint":"0.5"},
      "modes":      {"type":"text","hint":"off,auto,heat,cool"},
      "icon":       {"type":"text","hint":"mdi:thermostat"}
    }
  },
  lock: {
    device_classes: [],
    props: {
      "payload_lock":   {"type":"text","hint":"1"},
      "payload_unlock": {"type":"text","hint":"0"},
      "icon":           {"type":"text","hint":"mdi:lock"}
    }
  },
  fan: {
    device_classes: [],
    props: {
      "preset_modes":   {"type":"text","hint":"auto,low,medium,high"},
      "speed_range_min":{"type":"number","hint":"1"},
      "speed_range_max":{"type":"number","hint":"100"},
      "icon":           {"type":"text","hint":"mdi:fan"}
    }
  }
};

te_currentEditObj = null;

te_openClassEditor = function(obj) {
  te_currentEditObj = obj;
  const ro = te_file.Report[obj];
  const role = (ro.role||'sensor').split('&')[0];
  const currentClass = ro.class || {};

  const wnd = document.getElementById('te_classEditorWnd');
  wnd.style.display = 'flex';

  te_renderClassEditor(role, currentClass);
};

te_renderClassEditor = function(role, currentClass) {
  const schema = te_HA_CLASSES[role] || te_HA_CLASSES['sensor'];
  const dc = schema.device_classes;

  // Выбор роли
  const roleSelHtml = Object.keys(te_HA_CLASSES).map(r =>
    `<option value="${r}" ${r===role?'selected':''}>${r}</option>`
  ).join('');

  // Выбор device_class
  const dcHtml = dc.length ? `
    <div class="ce-row">
      <label class="ce-label">device_class</label>
      <select class="ce-select" id="ce_dc" onchange="te_onDcChange(this.value)">
        <option value="">— нет —</option>
        ${dc.map(d=>`<option value="${d}" ${d===(currentClass.device_class||'')?'selected':''}>${d}</option>`).join('')}
      </select>
    </div>` : '';

  // Поля props (кроме device_class — он уже отдельно)
  let propsHtml = '';
  const props = schema.props || {};
  for (const [key, cfg] of Object.entries(props)) {
    if (key === 'device_class') continue;
    const val = currentClass[key] !== undefined ? currentClass[key] : '';
    if (cfg.type === 'select') {
      propsHtml += `<div class="ce-row">
        <label class="ce-label">${key}</label>
        <select class="ce-select" id="ce_${key}" data-key="${key}">
          <option value="">—</option>
          ${cfg.options.map(o=>`<option value="${o}" ${o===val?'selected':''}>${o}</option>`).join('')}
        </select>
      </div>`;
    } else if (cfg.type === 'bool') {
      propsHtml += `<div class="ce-row">
        <label class="ce-label">${key}</label>
        <input type="checkbox" class="ce-check" id="ce_${key}" data-key="${key}" ${val?'checked':''}>
      </div>`;
    } else {
      propsHtml += `<div class="ce-row">
        <label class="ce-label">${key}</label>
        <input type="text" class="ce-input" id="ce_${key}" data-key="${key}" value="${val}" placeholder="${cfg.hint||''}">
      </div>`;
    }
  }

  document.getElementById('ce_role_sel').innerHTML = roleSelHtml;
  document.getElementById('ce_dc_wrap').innerHTML = dcHtml;
  document.getElementById('ce_props').innerHTML = propsHtml;
};

te_onDcChange = function(val) {
  // просто обновляем превью
};

te_onCeRoleChange = function(val) {
  const obj = te_currentEditObj;
  const ro = te_file.Report[obj];
  const currentClass = ro.class || {};
  te_renderClassEditor(val, currentClass);
};

te_applyClassEditor = function() {
  const obj = te_currentEditObj;
  if (!obj) return;
  const ro = te_file.Report[obj];

  const roleEl = document.getElementById('ce_role_sel');
  const role = roleEl ? roleEl.value : (ro.role||'sensor').split('&')[0];

  // Собираем новый class объект
  const newClass = {};
  const dcEl = document.getElementById('ce_dc');
  if (dcEl && dcEl.value) newClass.device_class = dcEl.value;

  // Остальные props
  document.querySelectorAll('#ce_props [data-key]').forEach(el => {
    const key = el.dataset.key;
    if (el.type === 'checkbox') {
      if (el.checked) newClass[key] = true;
    } else if (el.value !== '') {
      if (key === 'options') {
        newClass[key] = el.value.split(',').map(function(s){ return s.trim(); });
      } else {
        newClass[key] = isNaN(el.value) ? el.value : Number(el.value);
      }
    }
  });

  // Обновляем role (базовая часть до &)
  const roleBase = role;
  const classJson = Object.keys(newClass).length ? JSON.stringify(newClass) : '';
  ro.role = classJson ? `${roleBase}&${classJson}` : roleBase;
  ro.class = newClass;

  // Обновляем превью в основной панели
  const dcView = document.getElementById(`${obj}_te_classname_view`);
  if (dcView) dcView.textContent = newClass.device_class || '';
  const propView = document.getElementById(`${obj}_te_classprop_view`);
  if (propView) propView.textContent = Object.entries(newClass).filter(([k])=>k!=='device_class').map(([k,v])=>`${k}: ${v}`).join(', ');

  // Обновляем виджет + десктоп
  te_syncLive(true);
  te_closeClassEditor();
};

te_clearClass = function(obj) {
  const ro = te_file.Report[obj];
  ro.class = {};
  ro.role = (ro.role||'').split('&')[0];
  const dcView = document.getElementById(`${obj}_te_classname_view`);
  if (dcView) dcView.textContent = '';
  const propView = document.getElementById(`${obj}_te_classprop_view`);
  if (propView) propView.textContent = '';
  te_syncLive(true);
};

te_closeClassEditor = function() {
  document.getElementById('te_classEditorWnd').style.display = 'none';
  te_currentEditObj = null;
};


// ===== CFG REPORT EDITOR =====
te_currentCfgObj = null;

// dec → hex 4-символа
te_toHex4 = function(dec) {
  const n = parseInt(dec, 10);
  if (isNaN(n) || n < 0) return '0000';
  return Math.min(n, 65535).toString(16).toUpperCase().padStart(4, '0');
};

// hex → dec (для отображения при открытии)
te_hexToDec = function(hex) {
  const n = parseInt(hex, 16);
  return isNaN(n) ? 0 : n;
};

// Синхронизация числового поля → hex-превью
te_cre_updatePreviews = function() {
  const fields = ['MinInterval','MaxInterval','TimeOut','Change'];
  fields.forEach(function(f) {
    const inp = document.getElementById('te_cre_' + f);
    const prv = document.getElementById('te_cre_' + f + '_hex');
    if (inp && prv) prv.textContent = te_toHex4(inp.value);
  });
};

// Синхронизация select DataType → hex input
te_cre_syncType = function() {
  const sel = document.getElementById('te_cre_DataType');
  const hex = document.getElementById('te_cre_DataType_hex');
  if (sel && hex && sel.value) hex.value = sel.value.toUpperCase().padStart(2,'0');
};

// Синхронизация ручного hex input → select
te_cre_syncSel = function() {
  const hex = document.getElementById('te_cre_DataType_hex');
  const sel = document.getElementById('te_cre_DataType');
  if (!hex || !sel) return;
  const v = hex.value.toLowerCase().replace(/^0+/, '') || '0';
  // Пробуем найти в select
  let found = false;
  for (let i = 0; i < sel.options.length; i++) {
    if (sel.options[i].value === v || sel.options[i].value === '0x'+v) {
      sel.value = sel.options[i].value; found = true; break;
    }
  }
  if (!found) sel.value = '';
};

te_openCfgReportEditor = function(obj) {
  te_currentCfgObj = obj;
  const ro = te_file.Report[obj];
  let cfg = {};
  try {
    if (ro.cfg_report) {
      cfg = (typeof ro.cfg_report === 'object') ? ro.cfg_report : JSON.parse(ro.cfg_report);
    }
  } catch(e) {}

  // DataType — hex в select и hex-input
  const dtHex = (cfg.DataType || '').toLowerCase();
  const sel   = document.getElementById('te_cre_DataType');
  const hexIn = document.getElementById('te_cre_DataType_hex');
  hexIn.value = dtHex ? dtHex.toUpperCase().padStart(2,'0') : '';
  sel.value   = dtHex || '';

  // Интервалы — из hex в decimal для удобного ввода
  document.getElementById('te_cre_MinInterval').value = cfg.MinInterval ? te_hexToDec(cfg.MinInterval) : 1;
  document.getElementById('te_cre_MaxInterval').value = cfg.MaxInterval ? te_hexToDec(cfg.MaxInterval) : 300;
  document.getElementById('te_cre_TimeOut').value     = cfg.TimeOut     ? te_hexToDec(cfg.TimeOut)     : 0;
  document.getElementById('te_cre_Change').value      = cfg.Change      ? te_hexToDec(cfg.Change)      : 1;

  te_cre_updatePreviews();

  // Навешиваем oninput на числовые поля
  ['MinInterval','MaxInterval','TimeOut','Change'].forEach(function(f) {
    const el = document.getElementById('te_cre_' + f);
    if (el) el.oninput = te_cre_updatePreviews;
  });

  document.getElementById('te_cfgReportEditorWnd').style.display = 'flex';
};

te_closeCfgReportEditor = function() {
  document.getElementById('te_cfgReportEditorWnd').style.display = 'none';
  te_currentCfgObj = null;
};

// ===== YA REP EDITOR =====
te_YA_JSON = {"capability": [{"on_off": {"desc": "Включение/выключение", "tpl": {"type": "devices.capabilities.on_off", "retrievable": true, "reportable": false, "state": {"instance": "on", "value": false}}}}, {"color_setting": {"desc": "Цвет (температура K)", "tpl": {"type": "devices.capabilities.color_setting", "retrievable": true, "reportable": false, "parameters": {"temperature_k": {"max": 6500, "min": 1000}}, "state": {"instance": "temperature_k", "value": 4000}}}}, {"range": {"desc": "Диапазон — выбери instance ▼", "tpl": {"type": "devices.capabilities.range", "retrievable": true, "reportable": false, "parameters": {}, "arparameter": [{"instance": "brightness", "random_access": true, "range": {"max": 100, "min": 1, "precision": 1}, "unit": "unit.percent"}, {"instance": "volume", "random_access": true, "range": {"max": 100, "min": 0, "precision": 1}, "unit": "unit.percent"}, {"instance": "open", "random_access": true, "range": {"max": 100, "min": 0, "precision": 10}, "unit": "unit.percent"}, {"instance": "humidity", "random_access": true, "range": {"max": 100, "min": 10, "precision": 10}, "unit": "unit.percent"}, {"instance": "temperature", "random_access": true, "range": {"max": 40, "min": 18, "precision": 1}, "unit": "unit.temperature.celsius"}, {"instance": "channel", "random_access": true, "range": {"min": 0, "max": 999, "precision": 1}}], "state": {"instance": "brightness", "value": 50}}}}, {"toggle": {"desc": "Переключатель — выбери instance ▼", "tpl": {"type": "devices.capabilities.toggle", "retrievable": true, "reportable": false, "parameters": {}, "arparameter": [{"instance": "backlight"}, {"instance": "controls_locked"}, {"instance": "ionization"}, {"instance": "keep_warm"}, {"instance": "mute"}, {"instance": "oscillation"}, {"instance": "pause"}]}}}, {"mode": {"desc": "Режим работы — выбери instance ▼", "tpl": {"type": "devices.capabilities.mode", "retrievable": true, "reportable": false, "parameters": {}, "arparameter": [{"instance": "fan_speed", "modes": [{"value": "auto"}, {"value": "high"}, {"value": "medium"}, {"value": "low"}, {"value": "quiet"}, {"value": "turbo"}]}, {"instance": "thermostat", "modes": [{"value": "auto"}, {"value": "fan_only"}, {"value": "heat"}, {"value": "cool"}, {"value": "dry"}, {"value": "preheat"}]}, {"instance": "work_speed", "modes": [{"value": "auto"}, {"value": "fast"}, {"value": "max"}, {"value": "medium"}, {"value": "min"}, {"value": "slow"}, {"value": "turbo"}]}, {"instance": "swing", "modes": [{"value": "vertical"}, {"value": "horizontal"}, {"value": "stationary"}, {"value": "auto"}]}, {"instance": "program", "modes": [{"value": "auto"}, {"value": "eco"}, {"value": "express"}, {"value": "normal"}, {"value": "quiet"}]}, {"instance": "input_source", "modes": [{"value": "one"}, {"value": "two"}, {"value": "three"}, {"value": "four"}, {"value": "five"}, {"value": "hdmi"}, {"value": "hdmi1"}, {"value": "hdmi2"}]}, {"instance": "cleanup_mode", "modes": [{"value": "auto"}, {"value": "eco"}, {"value": "express"}, {"value": "normal"}, {"value": "quiet"}]}, {"instance": "tea_mode", "modes": [{"value": "black_tea"}, {"value": "green_tea"}, {"value": "oolong_tea"}, {"value": "express"}]}]}}}], "float": [{"amperage": {"desc": "Ток (А)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "amperage", "unit": "unit.ampere"}, "state": {"instance": "amperage", "value": 0}}}}, {"battery_level": {"desc": "Заряд батареи (%)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "battery_level", "unit": "unit.percent"}, "state": {"instance": "battery_level", "value": 0}}}}, {"co2_level": {"desc": "CO₂ (ppm)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "co2_level", "unit": "unit.ppm"}, "state": {"instance": "co2_level", "value": 0}}}}, {"humidity": {"desc": "Влажность (%)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "humidity", "unit": "unit.percent"}, "state": {"instance": "humidity", "value": 0}}}}, {"illumination": {"desc": "Освещённость (лк)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "illumination", "unit": "unit.illumination.lux"}, "state": {"instance": "illumination", "value": 0}}}}, {"pm1_density": {"desc": "PM1 (мкг/м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "pm1_density", "unit": "unit.density.mcg_m3"}, "state": {"instance": "pm1_density", "value": 0}}}}, {"pm2_5_density": {"desc": "PM2.5 (мкг/м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "pm2.5_density", "unit": "unit.density.mcg_m3"}, "state": {"instance": "pm2.5_density", "value": 0}}}}, {"pm10_density": {"desc": "PM10 (мкг/м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "pm10_density", "unit": "unit.density.mcg_m3"}, "state": {"instance": "pm10_density", "value": 0}}}}, {"power": {"desc": "Мощность (Вт)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "power", "unit": "unit.watt"}, "state": {"instance": "power", "value": 0}}}}, {"pressure": {"desc": "Давление (мм рт.ст.)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "pressure", "unit": "unit.pressure.mmhg"}, "state": {"instance": "pressure", "value": 0}}}}, {"temperature": {"desc": "Температура (°C)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "temperature", "unit": "unit.temperature.celsius"}, "state": {"instance": "temperature", "value": 0}}}}, {"tvoc": {"desc": "TVOC органика (мкг/м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "tvoc", "unit": "unit.density.mcg_m3"}, "state": {"instance": "tvoc", "value": 0}}}}, {"voltage": {"desc": "Напряжение (В)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "voltage", "unit": "unit.volt"}, "state": {"instance": "voltage", "value": 0}}}}, {"water_level": {"desc": "Уровень воды (%)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "water_level", "unit": "unit.percent"}, "state": {"instance": "water_level", "value": 0}}}}, {"electricity_meter": {"desc": "Счётчик эл.энергии (кВт·ч)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "electricity_meter", "unit": "unit.kilowatt_hour"}, "state": {"instance": "electricity_meter", "value": 0}}}}, {"water_meter": {"desc": "Счётчик воды (м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "water_meter", "unit": "unit.cubic_meter"}, "state": {"instance": "water_meter", "value": 0}}}}], "event": [{"vibration": {"desc": "Вибрация / наклон / падение", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "vibration", "events": [{"value": "tilt"}, {"value": "fall"}, {"value": "vibration"}]}, "state": {"instance": "vibration", "value": "vibration"}}}}, {"open": {"desc": "Открытие / закрытие", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "open", "events": [{"value": "opened"}, {"value": "closed"}]}, "state": {"instance": "open", "value": "opened"}}}}, {"button": {"desc": "Кнопка (клик / двойной / удержание)", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "button", "events": [{"value": "click"}, {"value": "double_click"}, {"value": "long_press"}]}, "state": {"instance": "button", "value": "click"}}}}, {"motion": {"desc": "Движение / покой", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "motion", "events": [{"value": "detected"}, {"value": "not_detected"}]}, "state": {"instance": "motion", "value": "not_detected"}}}}, {"smoke": {"desc": "Дым", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "smoke", "events": [{"value": "detected"}, {"value": "not_detected"}]}, "state": {"instance": "smoke", "value": "not_detected"}}}}, {"gas": {"desc": "Газ", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "gas", "events": [{"value": "detected"}, {"value": "not_detected"}]}, "state": {"instance": "gas", "value": "not_detected"}}}}, {"water_leak": {"desc": "Протечка", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "water_leak", "events": [{"value": "dry"}, {"value": "leak"}]}, "state": {"instance": "water_leak", "value": "dry"}}}}, {"battery_level": {"desc": "Заряд батареи (событие low/normal)", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "battery_level", "events": [{"value": "low"}, {"value": "normal"}]}, "state": {"instance": "battery_level", "value": "normal"}}}}, {"water_level": {"desc": "Уровень воды (событие low/normal)", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "water_level", "events": [{"value": "low"}, {"value": "normal"}]}, "state": {"instance": "water_level", "value": "normal"}}}}, {"food_level": {"desc": "Уровень корма (empty/normal)", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "food_level", "events": [{"value": "empty"}, {"value": "normal"}]}, "state": {"instance": "food_level", "value": "normal"}}}}]};

te_currentYaObj = null;
te_currentYaData = null; // рабочий объект редактора

te_yre_getObj = function() {
  return te_currentYaData;
};

te_yre_setObj = function(obj) {
  te_currentYaData = JSON.parse(JSON.stringify(obj)); // deep copy
  te_yre_refreshPreview();
};

// ─── Превью JSON ───
te_yre_refreshPreview = function() {
  const pre = document.getElementById('te_yre_preview');
  if (!pre) return;
  const d = te_currentYaData;
  if (!d) { pre.textContent = '—'; return; }
  pre.textContent = JSON.stringify(d, null, 2);
};

// ─── Рендер списка шаблонов ───
te_yre_renderList = function() {
  const container = document.getElementById('te_yre_list');
  if (!container) return;
  const Ya = te_YA_JSON;
  const catLabels = { capability: '⚡ Capability', float: '📊 Float', event: '🔔 Event' };
  let html = '';
  for (const cat of ['capability', 'float', 'event']) {
    html += `<div style="padding:3px 8px;font-weight:bold;font-size:11px;color:#fff;background:#5a4a7a;margin-bottom:1px;">${catLabels[cat]}</div>`;
    for (let i = 0; i < Ya[cat].length; i++) {
      const key   = Object.keys(Ya[cat][i])[0];
      const desc  = Ya[cat][i][key].desc;
      html += `<div class="yre-item" title="${desc}" onclick="te_yre_selectTpl('${cat}',${i})">${key}</div>`;
    }
  }
  container.innerHTML = html;
};

// ─── Выбор шаблона из списка ───
te_yre_selectTpl = function(cat, i) {
  document.querySelectorAll('.yre-item').forEach(el => el.classList.remove('yre-active'));
  for (const el of document.querySelectorAll('.yre-item')) {
    const oc = el.getAttribute('onclick') || '';
    if (oc.includes(`'${cat}',${i}`) && !oc.includes('_arp')) { el.classList.add('yre-active'); break; }
  }

  const Ya  = te_YA_JSON;
  const key = Object.keys(Ya[cat][i])[0];
  const tpl = JSON.parse(JSON.stringify(Ya[cat][i][key].tpl));

  // Если есть arparameter — рендерим подсписок вместо превью
  if (tpl.arparameter) {
    const pre = document.getElementById('te_yre_preview');
    let html = '<div style="font-size:11px;color:#555;margin-bottom:4px;">Выберите вариант:</div>';
    tpl.arparameter.forEach((arp, j) => {
      html += `<div class="yre-item" style="padding:3px 8px;" onclick="te_yre_selectTpl_arp('${cat}',${i},${j})">${arp.instance || JSON.stringify(arp)}</div>`;
    });
    pre.innerHTML = html;
    return;
  }

  let tt = cat === 'capability' ? { capabilities: [tpl] } : { properties: [tpl] };
  if (te_currentYaData && te_currentYaData.multi_id)
    tt.multi_id = te_currentYaData.multi_id;

  te_yre_setObj(tt);
  te_yre_syncFlags();
};

// Применить выбранный arparameter
te_yre_selectTpl_arp = function(cat, i, j) {
  const Ya  = te_YA_JSON;
  const key = Object.keys(Ya[cat][i])[0];
  const tpl = JSON.parse(JSON.stringify(Ya[cat][i][key].tpl));
  const arp = tpl.arparameter[j];

  // Собираем итоговый параметр
  if (tpl.type === 'devices.capabilities.range') {
    tpl.parameters = { instance: arp.instance, random_access: arp.random_access || true };
    if (arp.range)  tpl.parameters.range = arp.range;
    if (arp.unit)   tpl.parameters.unit  = arp.unit;
    tpl.state = { instance: arp.instance, value: arp.range ? arp.range.min : 0 };
  } else if (tpl.type === 'devices.capabilities.mode') {
    tpl.parameters = { instance: arp.instance, modes: arp.modes || [] };
    tpl.state = { instance: arp.instance, value: (arp.modes && arp.modes[0]) ? arp.modes[0].value : '' };
  } else if (tpl.type === 'devices.capabilities.toggle') {
    tpl.parameters = { instance: arp.instance };
    tpl.state = { instance: arp.instance, value: false };
  }
  delete tpl.arparameter;

  let tt = cat === 'capability' ? { capabilities: [tpl] } : { properties: [tpl] };
  if (te_currentYaData && te_currentYaData.multi_id)
    tt.multi_id = te_currentYaData.multi_id;

  te_yre_setObj(tt);
  te_yre_syncFlags();
};

// ─── Синхронизация флагов retrievable/reportable с текущим объектом ───
te_yre_syncFlags = function() {
  const d = te_currentYaData;
  if (!d) return;
  let retr = false, repo = false;
  try {
    const arr = d.capabilities || d.properties || [];
    retr = arr[0].retrievable === true;
    repo = arr[0].reportable  === true;
  } catch(e) {}
  document.getElementById('te_yre_retrievable').checked = retr;
  document.getElementById('te_yre_reportable').checked  = repo;
};

// ─── Обновление флагов в объекте при клике чекбокса ───
te_yre_updateFlags = function() {
  const d = te_currentYaData;
  if (!d) return;
  const retr = document.getElementById('te_yre_retrievable').checked;
  const repo = document.getElementById('te_yre_reportable').checked;
  const arr = d.capabilities || d.properties;
  if (arr && arr[0]) {
    if (arr[0].hasOwnProperty('retrievable')) arr[0].retrievable = retr;
    if (arr[0].hasOwnProperty('reportable'))  arr[0].reportable  = repo;
  }
  te_yre_refreshPreview();
};

// ─── Multi-device ───
te_yre_toggleMulti = function() {
  const on  = document.getElementById('te_yre_multi').checked;
  const fld = document.getElementById('te_yre_multi_fields');
  fld.style.display = on ? 'block' : 'none';
  const d = te_currentYaData;
  if (!d) return;
  if (on) {
    if (!d.multi_id) d.multi_id = { name: '', room: '', type: 'devices.types.other' };
    document.getElementById('te_yre_mname').value = d.multi_id.name || '';
    document.getElementById('te_yre_mroom').value = d.multi_id.room || '';
    document.getElementById('te_yre_mtype').value = d.multi_id.type || 'devices.types.other';
  } else {
    delete d.multi_id;
  }
  te_yre_refreshPreview();
};

te_yre_updateMulti = function() {
  const d = te_currentYaData;
  if (!d || !d.multi_id) return;
  d.multi_id.name = document.getElementById('te_yre_mname').value;
  d.multi_id.room = document.getElementById('te_yre_mroom').value;
  d.multi_id.type = document.getElementById('te_yre_mtype').value;
  te_yre_refreshPreview();
};

// ─── Открытие редактора ───
te_openYaRepEditor = function(obj) {
  te_currentYaObj = obj;
  const ro = te_file.Report[obj];
  let val = ro.ya_rep;

  // Нормализуем в объект
  if (!val || val === 'none') {
    te_currentYaData = null;
  } else {
    try {
      te_currentYaData = (typeof val === 'object') ? JSON.parse(JSON.stringify(val)) : JSON.parse(val);
    } catch(e) { te_currentYaData = null; }
  }

  te_yre_renderList();
  te_yre_refreshPreview();
  te_yre_syncFlags();

  // Multi-id
  const hasMulti = te_currentYaData && te_currentYaData.multi_id;
  document.getElementById('te_yre_multi').checked = !!hasMulti;
  document.getElementById('te_yre_multi_fields').style.display = hasMulti ? 'block' : 'none';
  if (hasMulti) {
    document.getElementById('te_yre_mname').value = te_currentYaData.multi_id.name || '';
    document.getElementById('te_yre_mroom').value = te_currentYaData.multi_id.room || '';
    document.getElementById('te_yre_mtype').value = te_currentYaData.multi_id.type || 'devices.types.other';
  }

  document.getElementById('te_yaRepEditorWnd').style.display = 'flex';
};

// ─── Закрытие ───
te_closeYaRepEditor = function() {
  document.getElementById('te_yaRepEditorWnd').style.display = 'none';
  te_currentYaObj  = null;
  te_currentYaData = null;
};

// ─── Установить none ───
te_setYaRepNone = function() {
  const obj = te_currentYaObj;
  if (!obj) return;
  te_file.Report[obj].ya_rep = 'none';
  te_yre_updateView(obj, null);
  te_syncLive(true);
  te_closeYaRepEditor();
};

// ─── Очистить (кнопка ✖ в таблице) ───
te_clearYaRep = function(obj) {
  if (!obj) return;
  te_file.Report[obj].ya_rep = 'none';
  te_yre_updateView(obj, null);
  te_syncLive(true);
};

// ─── Применить ───
te_applyYaRepEditor = function() {
  const obj = te_currentYaObj;
  if (!obj) return;
  const d = te_currentYaData;
  if (!d) {
    te_setYaRepNone();
    return;
  }
  te_file.Report[obj].ya_rep = d;
  te_yre_updateView(obj, d);
  te_syncLive(true);
  te_closeYaRepEditor();
};

// ─── Обновление превью в строке таблицы ───
te_yre_updateView = function(obj, d) {
  const el = document.getElementById(obj + '_te_ya_rep_view');
  if (!el) return;
  if (!d) { el.innerHTML = '<span style="color:#bbb">none</span>'; return; }
  try {
    if (d.capabilities) {
      el.textContent = '⚡ ' + d.capabilities.map(c => c.type.replace('devices.capabilities.','')).join(', ');
    } else if (d.properties) {
      el.textContent = '📊 ' + d.properties.map(p => (p.parameters && p.parameters.instance) || p.type).join(', ');
    } else {
      el.textContent = JSON.stringify(d).substring(0, 50);
    }
  } catch(e) { el.textContent = '?'; }
};

te_applyCfgReportEditor = function() {
  const obj = te_currentCfgObj;
  if (!obj) return;

  // DataType — берём из hex-input (приоритет), иначе из select
  const hexIn = document.getElementById('te_cre_DataType_hex');
  const sel   = document.getElementById('te_cre_DataType');
  let dtRaw = (hexIn.value.trim() || sel.value || '').replace(/^0x/i,'');
  const dataType = dtRaw ? dtRaw.toUpperCase().padStart(2,'0') : '';

  // Интервалы — десятичный → hex 4 символа
  const minI = te_toHex4(document.getElementById('te_cre_MinInterval').value);
  const maxI = te_toHex4(document.getElementById('te_cre_MaxInterval').value);
  const tmO  = te_toHex4(document.getElementById('te_cre_TimeOut').value);
  const chg  = te_toHex4(document.getElementById('te_cre_Change').value);

  // Если DataType не задан — очищаем
  if (!dataType) {
    te_clearCfgReport(obj);
    te_closeCfgReportEditor();
    return;
  }

  // Формируем объект в точном нужном формате
  const cfg = {
    DataType:    dataType,
    MinInterval: minI,
    MaxInterval: maxI,
    TimeOut:     tmO,
    Change:      chg
  };

  te_file.Report[obj].cfg_report = cfg;

  // Обновляем превью в строке таблицы
  const view = document.getElementById(obj + '_te_cfg_report_view');
  if (view) {
    const decMin = te_hexToDec(minI);
    const decMax = te_hexToDec(maxI);
    const decChg = te_hexToDec(chg);
    view.innerHTML = 'Dt:<b>' + dataType + '</b> ' + decMin + '..' + decMax + 's \u0394' + decChg;
  }

  te_syncLive(true);
  te_closeCfgReportEditor();
};

te_clearCfgReport = function(obj) {
  if (!obj) return;
  te_file.Report[obj].cfg_report = '';
  const view = document.getElementById(obj + '_te_cfg_report_view');
  if (view) view.innerHTML = '<span style="color:#bbb">—</span>';
  te_syncLive(true);
};
te_updateDeviceField = function(field, value) {
    if (!te_file) return;
    
    // Обновляем соответствующее поле
    if (field === 'Name') {
        te_file.Name = value;
    } else if (field === 'type') {
        te_file.type = value;
    } else if (field === 'Location') {
        te_file.Location = value;
    }
    
    // Обновляем заголовок окна
    if (field === 'Name') {
        teSetTitle([`${te_fileName} - ${te_file.ModelId}`]);
    }

    // Живой синк: макет редактора + deviceList + десктоп
    te_syncLive(true);

    console.log(`Поле ${field} обновлено на:`, value);
};

var TE_CSS="\n\
/* ============================================================ */\n\
/* ГЛОБАЛЬНЫЕ СТИЛИ ДЛЯ РЕДАКТОРА (АДАПТИВНЫЕ К ТЕМАМ)          */\n\
/* ============================================================ */\n\
\n\
#obj_mnu .icon-menu-bar {\n\
    display: flex;\n\
    justify-content: flex-end;\n\
    gap: 4px;\n\
    padding: 4px;\n\
    background: var(--bg3);\n\
    border-radius: 4px;\n\
    margin-bottom: 8px;\n\
    line-height: 0;\n\
}\n\
\n\
#obj_mnu .icon-btn {\n\
    width: 25px !important;\n\
    height: 25px !important;\n\
    min-width: 25px !important;\n\
    min-height: 25px !important;\n\
    padding: 0 !important;\n\
    margin: 0 !important;\n\
    border: none !important;\n\
    background: var(--hover);\n\
    border-radius: 3px !important;\n\
    cursor: pointer;\n\
    font-size: 14px;\n\
    display: inline-flex;\n\
    align-items: center;\n\
    justify-content: center;\n\
    box-sizing: border-box !important;\n\
    overflow: hidden;\n\
    color: var(--text);\n\
    transition: background 0.2s;\n\
}\n\
#obj_mnu .icon-btn:hover { background: var(--border2); }\n\
#obj_mnu .icon-btn:active { background: var(--accent); color: #fff; }\n\
\n\
/* ========== OBJECT MNU PANEL ========== */\n\
#obj_mnu {\n\
    background: var(--bg2);\n\
    border-radius: 6px;\n\
    padding: 6px;\n\
    margin-bottom: 6px;\n\
    font-size: 12px;\n\
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);\n\
}\n\
\n\
.obj-mnu-section { display: flex; flex-direction: column; gap: 4px; }\n\
.obj-mnu-row { display: flex; align-items: center; gap: 4px; }\n\
\n\
.obj-mnu-label {\n\
    min-width: 50px;\n\
    font-size: 11px;\n\
    color: var(--text);\n\
    font-weight: 600;\n\
}\n\
\n\
.obj-mnu-field-wrap {\n\
    display: flex;\n\
    align-items: center;\n\
    gap: 3px;\n\
    flex: 1;\n\
    flex-wrap: wrap;\n\
}\n\
\n\
.obj-mnu-editable {\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    padding: 2px 6px;\n\
    font-size: 13px;\n\
    min-height: 22px;\n\
    background: var(--bg1);\n\
    flex: 1;\n\
    min-width: 60px;\n\
    outline: none;\n\
    color: var(--text);\n\
    transition: border-color 0.2s;\n\
}\n\
.obj-mnu-editable:focus {\n\
    border-color: var(--accent);\n\
    box-shadow: 0 0 0 2px rgba(80,160,120,0.25);\n\
}\n\
.obj-mnu-editable.obj-mnu-small { max-width: 52px; flex: 0 0 52px; text-align: center; }\n\
.obj-mnu-editable.obj-mnu-val { max-width: 80px; flex: 0 0 80px; }\n\
\n\
.obj-mnu-prev {\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    padding: 2px 6px;\n\
    font-size: 11px;\n\
    background: var(--bg1);\n\
    flex: 1;\n\
    min-width: 40px;\n\
    min-height: 22px;\n\
    outline: none;\n\
    cursor: text;\n\
    color: var(--accent);\n\
    font-family: monospace;\n\
}\n\
\n\
.obj-mnu-dt-input {\n\
    font-size: 11px;\n\
    width: 52px;\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    padding: 2px 4px;\n\
    background: var(--bg1);\n\
    color: var(--text);\n\
}\n\
\n\
.obj-mnu-btn {\n\
    padding: 2px 8px;\n\
    font-size: 11px;\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    background: var(--bg3);\n\
    cursor: pointer;\n\
    white-space: nowrap;\n\
    color: var(--text);\n\
    transition: all 0.2s;\n\
}\n\
.obj-mnu-btn:hover { background: var(--hover); }\n\
.obj-mnu-btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }\n\
.obj-mnu-btn-primary:hover { background: var(--accent-dark, #5a9); color: #fff; }\n\
.obj-mnu-btn-write { background: var(--bg2); border-color: var(--border2); }\n\
.obj-mnu-btn-write:hover { background: var(--hover); }\n\
\n\
.obj-mnu-divider { height: 1px; background: var(--border2); margin: 5px 0; }\n\
\n\
/* ========== OBJECT EDIT TABLE ========== */\n\
#te_DeviceJson table {\n\
    width: 100%;\n\
    border-collapse: collapse;\n\
}\n\
#te_DeviceJson td {\n\
    padding: 3px 6px;\n\
    vertical-align: middle;\n\
}\n\
#te_DeviceJson tr:nth-child(even) { background: var(--bg3); }\n\
#te_DeviceJson tr:nth-child(odd) { background: var(--bg2); }\n\
#te_DeviceJson tr:hover { background: var(--hover); }\n\
\n\
#te_DeviceJson input[type=\"text\"] {\n\
    width: 100%;\n\
    box-sizing: border-box;\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    padding: 2px 6px;\n\
    font-size: 12px;\n\
    background: var(--bg1);\n\
    color: var(--text);\n\
    transition: border-color 0.2s;\n\
}\n\
#te_DeviceJson input[type=\"text\"]:focus {\n\
    border-color: var(--accent);\n\
    outline: none;\n\
    box-shadow: 0 0 0 2px rgba(80,160,120,0.15);\n\
}\n\
#te_DeviceJson input[disabled] {\n\
    background: var(--bg3);\n\
    color: var(--text-muted);\n\
    opacity: 0.7;\n\
}\n\
\n\
#Device_objects > table td:first-child {\n\
    font-size: 11px;\n\
    color: var(--text);\n\
    font-weight: 600;\n\
    width: 60px;\n\
    white-space: nowrap;\n\
}\n\
\n\
.M2PC_cfg_report_edit {\n\
    font-family: monospace;\n\
    font-size: 11px;\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    padding: 3px 6px;\n\
    background: var(--bg1);\n\
    color: var(--text);\n\
    min-height: 30px;\n\
    max-height: 80px;\n\
    overflow-y: auto;\n\
    word-break: break-all;\n\
    outline: none;\n\
    width: 100%;\n\
    box-sizing: border-box;\n\
}\n\
.M2PC_cfg_report_edit:focus { border-color: var(--accent); }\n\
\n\
/* === YA REP EDITOR LIST === */\n\
.yre-item {\n\
    padding: 4px 10px;\n\
    font-size: 12px;\n\
    color: var(--text);\n\
    cursor: pointer;\n\
    border-bottom: 1px solid var(--border2);\n\
    white-space: nowrap;\n\
    overflow: hidden;\n\
    text-overflow: ellipsis;\n\
    transition: background 0.2s;\n\
}\n\
.yre-item:hover { background: var(--hover); }\n\
.yre-active {\n\
    background: var(--accent) !important;\n\
    color: #fff !important;\n\
    font-weight: bold;\n\
}\n\
\n\
/* === CFG REPORT EDITOR MODAL === */\n\
.cre-modal { width: 340px !important; }\n\
.cre-body { padding: 8px 14px; }\n\
\n\
.cre-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }\n\
.cre-label {\n\
    min-width: 90px;\n\
    font-size: 11px;\n\
    color: var(--text);\n\
    font-weight: 600;\n\
    flex-shrink: 0;\n\
}\n\
.cre-select {\n\
    flex: 1;\n\
    font-size: 11px;\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    padding: 3px 5px;\n\
    background: var(--bg1);\n\
    color: var(--text);\n\
    outline: none;\n\
    min-width: 0;\n\
}\n\
.cre-input {\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    padding: 3px 6px;\n\
    font-size: 12px;\n\
    background: var(--bg1);\n\
    color: var(--text);\n\
    outline: none;\n\
}\n\
.cre-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(80,160,120,0.2); }\n\
.cre-dec { flex: 1; min-width: 0; }\n\
.cre-hex { width: 44px; flex: 0 0 44px; font-family: monospace; font-size: 11px; text-align: center; }\n\
.cre-hex-preview {\n\
    min-width: 38px;\n\
    font-family: monospace;\n\
    font-size: 11px;\n\
    color: var(--accent);\n\
    background: var(--bg1);\n\
    border-radius: 4px;\n\
    padding: 2px 4px;\n\
    text-align: center;\n\
    flex-shrink: 0;\n\
    border: 1px solid transparent;\n\
}\n\
.cre-divider { height: 1px; background: var(--border2); margin: 6px 0; }\n\
.cre-hint { font-size: 10px; color: var(--text-muted); margin-top: 4px; text-align: center; }\n\
\n\
/* ya_rep preview в строке таблицы */\n\
.ya-rep-preview {\n\
    font-family: monospace;\n\
    font-size: 11px;\n\
    color: var(--text);\n\
    flex: 1;\n\
    overflow: hidden;\n\
    text-overflow: ellipsis;\n\
    white-space: nowrap;\n\
    background: var(--bg1);\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    padding: 2px 6px;\n\
}\n\
\n\
/* cfg_report preview в строке таблицы */\n\
.cfg-rpt-preview {\n\
    font-family: monospace;\n\
    font-size: 10px;\n\
    color: var(--text);\n\
    flex: 1;\n\
    overflow: hidden;\n\
    text-overflow: ellipsis;\n\
    white-space: nowrap;\n\
}\n\
\n\
/* ========== DEVICE INFO PANEL ========== */\n\
#te_d {\n\
    overflow: auto;\n\
    display: flex;\n\
    align-items: flex-start;\n\
}\n\
\n\
#te_DeviceWidget {\n\
    width: 258px;\n\
    flex-shrink: 0;\n\
    align-self: flex-start;\n\
    overflow: hidden;\n\
    background-color: var(--bg2);\n\
    padding: 4px;\n\
    border-radius: 8px;\n\
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n\
    margin: 5px;\n\
    border: 1px solid var(--border2);\n\
}\n\
\n\
#te_DeviceJson {\n\
    background-color: var(--bg2);\n\
    padding: 8px;\n\
    overflow-y: auto;\n\
    box-sizing: border-box;\n\
    border-left: 1px solid var(--border2);\n\
}\n\
\n\
/* Общие стили виджета */\n\
.flex { display: flex; align-items: center; justify-content: space-between; }\n\
.flex-c { flex-direction: column; }\n\
.input { display: none; }\n\
.control-pannel { width: 100%; height: auto; margin-top: 20px; }\n\
\n\
.ac, .lamp {\n\
    width: 100%;\n\
    height: auto;\n\
    min-height: 100px;\n\
    border-radius: 8px;\n\
    padding: 15px 10px;\n\
    text-align: center;\n\
    background: var(--bg3);\n\
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);\n\
}\n\
\n\
.lampPreview {\n\
    width: 85px;\n\
    height: 85px;\n\
    background-color: var(--yellow, #e2d606);\n\
    border-radius: 50px;\n\
    box-shadow: 0 0 15px rgba(226, 214, 6, 0.3);\n\
}\n\
\n\
.icon {\n\
    width: 20px;\n\
    height: 30px;\n\
    background: transparent;\n\
    justify-content: center;\n\
    font-size: 20px;\n\
    color: var(--text);\n\
    cursor: pointer;\n\
}\n\
.icon:hover { color: var(--accent); }\n\
\n\
.bulbw { width: 84px; height: 75px; margin-top: 8px; margin-left: -9px; }\n\
\n\
.plus, .minus {\n\
    width: 25%;\n\
    height: 22px;\n\
    color: var(--text);\n\
    font-weight: 400;\n\
    background: var(--bg1);\n\
    justify-content: center;\n\
    border-radius: 20px;\n\
    cursor: pointer;\n\
    border: 1px solid var(--border2);\n\
    transition: background 0.2s;\n\
}\n\
.plus:hover, .minus:hover { background: var(--hover); }\n\
\n\
.switch { width: 100%; cursor: pointer; border-radius: 6px; transition: background 0.2s; padding: 2px; }\n\
#te_DeviceWidget .switch:hover { background-color: var(--hover); }\n\
\n\
.toggle-switch {\n\
    width: 40px;\n\
    height: 20px;\n\
    border-radius: 15px;\n\
    border: 2px solid var(--border2);\n\
    position: relative;\n\
    background: var(--bg1);\n\
    transition: background 0.3s, border-color 0.3s;\n\
}\n\
.toggle-switch span {\n\
    width: 15px;\n\
    height: 15px;\n\
    background: var(--text-muted);\n\
    position: absolute;\n\
    border-radius: 50%;\n\
    top: 1.5px;\n\
    left: 2.5px;\n\
    cursor: pointer;\n\
    transition: all 0.3s;\n\
}\n\
.toggle-input:checked ~ label .toggle-switch {\n\
    border-color: var(--accent);\n\
    background: var(--accent);\n\
}\n\
.toggle-input:checked ~ label .toggle-switch span {\n\
    right: 2.5px;\n\
    left: unset;\n\
    background: #fff;\n\
}\n\
\n\
.labelObj { text-align: left; width: 100%; color: var(--text); font-weight: bold; }\n\
.device-name {\n\
    margin-top: -10px;\n\
    text-align: center;\n\
    width: 100%;\n\
    color: var(--yellow);\n\
    font-size: 18px;\n\
    margin-bottom: 15px;\n\
    overflow: hidden;\n\
    text-overflow: ellipsis;\n\
    white-space: nowrap;\n\
}\n\
\n\
/* Слайдеры */\n\
.color-range, .color-temp, .level {\n\
    appearance: none;\n\
    border-radius: 0.5em;\n\
    border: 1px solid var(--border2);\n\
    height: 0.7em;\n\
    width: 66%;\n\
    outline: none;\n\
    background: linear-gradient(to right, rgb(255,0,0), rgb(255,255,0), rgb(0,255,0), rgb(0,255,255), rgb(0,0,255), rgb(255,0,255), rgb(255,0,0));\n\
}\n\
.color-temp { background: linear-gradient(to right, rgb(105 234 255), rgb(238 218 42 / 91%)); }\n\
.level { background: linear-gradient(to right, var(--bg1), var(--text)); }\n\
\n\
/* Списки объектов (перетаскиваемые) */\n\
.objsp {\n\
    border-radius: 4px;\n\
    font-size: 13px;\n\
    background: var(--bg3);\n\
    border: 1px solid var(--border2);\n\
    cursor: grab;\n\
    user-select: none;\n\
    margin-bottom: 3px;\n\
    padding: 4px 8px;\n\
    transition: all 0.2s;\n\
    display: flex;\n\
    align-items: center;\n\
    gap: 4px;\n\
    color: var(--text);\n\
}\n\
.objsp:hover {\n\
    background: var(--hover);\n\
    border-color: var(--accent);\n\
}\n\
.objsp:active { cursor: grabbing; }\n\
.objsp.dragging {\n\
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);\n\
    opacity: 0.8;\n\
    background: var(--accent);\n\
    color: #fff;\n\
}\n\
\n\
.objsp-placeholder {\n\
    background: transparent;\n\
    border: 2px dashed var(--border2);\n\
    border-radius: 4px;\n\
    margin-bottom: 3px;\n\
    height: 30px;\n\
}\n\
\n\
/* Дерево кластеров (левая часть правой панели) */\n\
.te_edObj {\n\
    display: flex;\n\
    font-size: 13px;\n\
    background: var(--bg3);\n\
    border: 1px solid transparent;\n\
    border-radius: 4px;\n\
    margin-bottom: 2px;\n\
    padding: 4px 6px;\n\
    cursor: pointer;\n\
    gap: 6px;\n\
    align-items: center;\n\
    transition: all 0.2s;\n\
    color: var(--text);\n\
}\n\
.te_edObj:hover {\n\
    background: var(--hover);\n\
    border-color: var(--border2);\n\
}\n\
\n\
.te_edAttr {\n\
    display: flex;\n\
    flex-wrap: wrap;\n\
    font-size: 12px;\n\
    background: var(--bg2);\n\
    display: none;\n\
    border-radius: 0 0 6px 6px;\n\
    border: 1px solid var(--border2);\n\
    margin-bottom: 4px;\n\
    border-top: none;\n\
}\n\
.te_edAttr tr:hover {\n\
    background: var(--hover);\n\
    cursor: pointer;\n\
}\n\
.te_selAttr:hover {\n\
    color: var(--accent);\n\
    font-weight: bold;\n\
}\n\
\n\
.objEnbl {\n\
    background: var(--accent-light);\n\
    border-left: 3px solid var(--accent);\n\
}\n\
.ep {\n\
    background: var(--accent);\n\
    color: #fff;\n\
    border-radius: 3px;\n\
    padding: 1px 6px;\n\
    font-size: 11px;\n\
    font-weight: bold;\n\
}\n\
.cl {\n\
    background: var(--border2);\n\
    color: var(--text);\n\
    border-radius: 3px;\n\
    padding: 1px 6px;\n\
    font-size: 11px;\n\
}\n\
.show { display: block; }\n\
\n\
/* ========== SNIFF PANEL ========== */\n\
.obj-mnu-btn-sniff {\n\
    background: var(--accent);\n\
    color: #fff;\n\
    border: none;\n\
    border-radius: 4px;\n\
    padding: 3px 10px;\n\
    font-size: 12px;\n\
    cursor: pointer;\n\
    transition: background 0.2s;\n\
    white-space: nowrap;\n\
}\n\
.obj-mnu-btn-sniff:hover { background: var(--accent-dark, #1a6a9a); }\n\
.obj-mnu-btn-sniff:active { transform: scale(0.95); }\n\
\n\
#te_sniffPanel {\n\
    width: 258px;\n\
    border-top: 2px solid var(--border2);\n\
    background: var(--bg2);\n\
    font-size: 12px;\n\
    overflow: hidden;\n\
    flex-shrink: 0;\n\
    border-radius: 0 0 8px 8px;\n\
}\n\
\n\
.sniff-header {\n\
    display: flex;\n\
    justify-content: space-between;\n\
    align-items: center;\n\
    background: var(--accent);\n\
    color: #fff;\n\
    padding: 4px 10px;\n\
    font-weight: bold;\n\
    font-size: 12px;\n\
    gap: 4px;\n\
}\n\
\n\
.sniff-count {\n\
    background: rgba(255,255,255,0.2);\n\
    color: #fff;\n\
    border-radius: 10px;\n\
    padding: 0px 6px;\n\
    font-weight: bold;\n\
    font-size: 11px;\n\
    min-width: 18px;\n\
    text-align: center;\n\
}\n\
\n\
.sniff-clear-btn {\n\
    background: rgba(255,255,255,0.2);\n\
    border: none;\n\
    color: #fff;\n\
    cursor: pointer;\n\
    border-radius: 3px;\n\
    padding: 1px 6px;\n\
    font-size: 12px;\n\
    line-height: 1.4;\n\
    transition: background 0.2s;\n\
}\n\
.sniff-clear-btn:hover { background: rgba(255,255,255,0.4); }\n\
\n\
.sniff-add-all-btn {\n\
    background: rgba(255,255,255,0.25);\n\
    border: 1px solid rgba(255,255,255,0.5);\n\
    color: #fff;\n\
    cursor: pointer;\n\
    border-radius: 3px;\n\
    padding: 1px 8px;\n\
    font-size: 11px;\n\
    font-weight: bold;\n\
    line-height: 1.4;\n\
    transition: background 0.2s;\n\
}\n\
.sniff-add-all-btn:hover { background: rgba(255,255,255,0.45); }\n\
\n\
.sniff-list {\n\
    max-height: 300px;\n\
    overflow-y: auto;\n\
    padding: 4px;\n\
}\n\
\n\
.sniff-empty {\n\
    color: var(--text-muted);\n\
    text-align: center;\n\
    padding: 10px;\n\
    font-style: italic;\n\
    font-size: 11px;\n\
}\n\
\n\
.sniff-item {\n\
    background: var(--bg1);\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    padding: 4px 8px;\n\
    margin-bottom: 3px;\n\
    cursor: pointer;\n\
    transition: all 0.15s;\n\
    user-select: none;\n\
}\n\
.sniff-item:hover {\n\
    background: var(--hover);\n\
    border-color: var(--accent);\n\
}\n\
.sniff-item-selected {\n\
    background: var(--accent-light) !important;\n\
    border-color: var(--accent) !important;\n\
    border-width: 2px !important;\n\
}\n\
\n\
.sniff-item-head {\n\
    display: flex;\n\
    align-items: center;\n\
    gap: 4px;\n\
    margin-bottom: 3px;\n\
}\n\
.sniff-key {\n\
    flex: 1;\n\
    font-size: 11px;\n\
    display: flex;\n\
    align-items: center;\n\
    gap: 2px;\n\
    color: var(--text);\n\
}\n\
.sniff-dtype {\n\
    font-size: 10px;\n\
    color: var(--text-muted);\n\
    background: var(--bg2);\n\
    border-radius: 3px;\n\
    padding: 0px 4px;\n\
    font-family: monospace;\n\
}\n\
.sniff-cnt {\n\
    font-size: 10px;\n\
    color: var(--accent);\n\
    font-weight: bold;\n\
    min-width: 16px;\n\
    text-align: right;\n\
}\n\
.sniff-add-btn {\n\
    background: var(--success, #27ae60);\n\
    border: none;\n\
    color: #fff;\n\
    cursor: pointer;\n\
    border-radius: 3px;\n\
    padding: 1px 8px;\n\
    font-size: 13px;\n\
    font-weight: bold;\n\
    line-height: 1.3;\n\
    flex-shrink: 0;\n\
    transition: background 0.15s;\n\
}\n\
.sniff-add-btn:hover { background: var(--success-dark, #1e8449); }\n\
\n\
.sniff-vals {\n\
    display: flex;\n\
    flex-wrap: wrap;\n\
    gap: 2px;\n\
}\n\
.sniff-val {\n\
    background: var(--bg2);\n\
    border: 1px solid var(--border2);\n\
    border-radius: 3px;\n\
    padding: 0px 5px;\n\
    font-size: 10px;\n\
    color: var(--accent);\n\
    font-family: monospace;\n\
    max-width: 70px;\n\
    overflow: hidden;\n\
    text-overflow: ellipsis;\n\
    white-space: nowrap;\n\
}\n\
\n\
/* ========== CLASS EDITOR MODAL ========== */\n\
.ce-modal {\n\
    background: var(--bg2);\n\
    border-radius: 12px;\n\
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);\n\
    width: 380px;\n\
    max-height: 85vh;\n\
    display: flex;\n\
    flex-direction: column;\n\
    overflow: hidden;\n\
    font-size: 13px;\n\
    border: 1px solid var(--border2);\n\
}\n\
\n\
.ce-header {\n\
    display: flex;\n\
    justify-content: space-between;\n\
    align-items: center;\n\
    padding: 12px 16px;\n\
    background: var(--accent);\n\
    color: #fff;\n\
    font-weight: bold;\n\
    font-size: 14px;\n\
}\n\
\n\
.ce-close {\n\
    background: none;\n\
    border: none;\n\
    color: #fff;\n\
    font-size: 18px;\n\
    cursor: pointer;\n\
    padding: 0 4px;\n\
    line-height: 1;\n\
    opacity: 0.8;\n\
    transition: opacity 0.2s;\n\
}\n\
.ce-close:hover { opacity: 1; color: #ffdddd; }\n\
\n\
.ce-body {\n\
    padding: 12px 16px;\n\
    overflow-y: auto;\n\
    flex: 1;\n\
}\n\
\n\
.ce-row {\n\
    display: flex;\n\
    align-items: center;\n\
    gap: 8px;\n\
    margin-bottom: 6px;\n\
}\n\
.ce-label {\n\
    min-width: 110px;\n\
    font-size: 12px;\n\
    color: var(--text);\n\
    font-weight: 600;\n\
    flex-shrink: 0;\n\
}\n\
.ce-select, .ce-input {\n\
    flex: 1;\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    padding: 4px 8px;\n\
    font-size: 12px;\n\
    background: var(--bg1);\n\
    color: var(--text);\n\
    outline: none;\n\
}\n\
.ce-select:focus, .ce-input:focus {\n\
    border-color: var(--accent);\n\
    box-shadow: 0 0 0 2px rgba(80,160,120,0.15);\n\
}\n\
.ce-select-role { font-weight: bold; }\n\
.ce-check { width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent); }\n\
.ce-divider { height: 1px; background: var(--border2); margin: 8px 0; }\n\
.ce-section-title {\n\
    font-size: 11px;\n\
    color: var(--text-muted);\n\
    text-transform: uppercase;\n\
    letter-spacing: 0.5px;\n\
    margin-bottom: 6px;\n\
    font-weight: bold;\n\
}\n\
\n\
.ce-footer {\n\
    display: flex;\n\
    justify-content: flex-end;\n\
    gap: 8px;\n\
    padding: 10px 16px;\n\
    background: var(--bg3);\n\
    border-top: 1px solid var(--border2);\n\
}\n\
.ce-btn-cancel {\n\
    padding: 6px 14px;\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    background: var(--bg1);\n\
    cursor: pointer;\n\
    font-size: 13px;\n\
    color: var(--text);\n\
    transition: background 0.2s;\n\
}\n\
.ce-btn-cancel:hover { background: var(--hover); }\n\
.ce-btn-apply {\n\
    padding: 6px 14px;\n\
    border: none;\n\
    border-radius: 4px;\n\
    background: var(--accent);\n\
    color: #fff;\n\
    cursor: pointer;\n\
    font-size: 13px;\n\
    font-weight: bold;\n\
    transition: background 0.2s;\n\
}\n\
.ce-btn-apply:hover { background: var(--accent-dark, #3a7a5a); }\n\
\n\
/* Class preview в основной панели */\n\
.class-editor-row {\n\
    display: flex;\n\
    align-items: center;\n\
    gap: 4px;\n\
}\n\
.class-preview {\n\
    flex: 1;\n\
    font-size: 12px;\n\
    font-weight: bold;\n\
    color: var(--text);\n\
    background: var(--bg1);\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    padding: 2px 6px;\n\
    min-height: 22px;\n\
}\n\
.class-prop-preview {\n\
    font-size: 11px;\n\
    color: var(--text);\n\
    background: var(--bg1);\n\
    border: 1px solid var(--border2);\n\
    border-radius: 4px;\n\
    padding: 3px 6px;\n\
    min-height: 18px;\n\
    font-family: monospace;\n\
    word-break: break-all;\n\
}\n\
";
var TE_BODY="\n\n\n<div style='position:absolute;display:flex; align-items: flex-start;' id='te_d'>\n<div style=\"flex-shrink:0; display:flex; flex-direction:column; overflow:hidden;\">\n  <div id=\"te_DeviceWidget\" style=\"flex-shrink:0;\"></div>\n  <!-- SNIFF PANEL — постоянная левая колонка, не пропадает при навигации -->\n  <div id=\"te_sniffPanel\" style=\"display:none; flex-shrink:0;\">\n    <div class=\"sniff-header\">\n      <span>🎧 Sniff</span>\n      <div style=\"display:flex;gap:5px;align-items:center;\">\n        <span id=\"te_sniffCount\" class=\"sniff-count\">0</span>\n        <button class=\"sniff-add-all-btn\" onclick=\"te_sniffAddAll()\" title=\"Добавить все объекты\">+ All</button>\n        <button class=\"sniff-clear-btn\" onclick=\"te_clearSniff()\" title=\"Очистить\">🗑</button>\n      </div>\n    </div>\n    <div id=\"te_sniffList\" class=\"sniff-list\"></div>\n  </div>\n</div>\n<div id=\"te_DeviceJson\"></div>\t\n</div>\n\n<!-- CFG REPORT EDITOR MODAL -->\n<div id=\"te_cfgReportEditorWnd\" style=\"display:none;position:absolute!important;top:0;left:0;width:100%;height:100%;z-index:9999;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);\">\n  <div class=\"ce-modal cre-modal\">\n    <div class=\"ce-header\" style=\"background:var(--accent);\">\n      <span>⚙️ Конфигурация репорта</span>\n      <button class=\"ce-close\" onclick=\"te_closeCfgReportEditor()\">✕</button>\n    </div>\n    <div class=\"ce-body cre-body\">\n      <div class=\"cre-row\">\n        <label class=\"cre-label\">DataType</label>\n        <select class=\"cre-select\" id=\"te_cre_DataType\" onchange=\"te_cre_syncType()\">\n          <option value=\"\">— выбрать —</option>\n          <option value=\"10\">10h · BOOLEAN</option>\n          <option value=\"18\">18h · BITMAP8</option>\n          <option value=\"19\">19h · BITMAP16</option>\n          <option value=\"20\">20h · UINT8</option>\n          <option value=\"21\">21h · UINT16</option>\n          <option value=\"22\">22h · UINT24</option>\n          <option value=\"23\">23h · UINT32</option>\n          <option value=\"28\">28h · INT8</option>\n          <option value=\"29\">29h · INT16</option>\n          <option value=\"2a\">2Ah · INT24</option>\n          <option value=\"30\">30h · ENUM8</option>\n          <option value=\"31\">31h · ENUM16</option>\n          <option value=\"41\">41h · OCTSTR</option>\n          <option value=\"42\">42h · STRING</option>\n        </select>\n        <input class=\"cre-input cre-hex\" id=\"te_cre_DataType_hex\" placeholder=\"hex\" maxlength=\"4\" title=\"hex вручную\" oninput=\"te_cre_syncSel()\">\n      </div>\n      <div class=\"cre-divider\"></div>\n      <div class=\"cre-row\">\n        <label class=\"cre-label\">MinInterval</label>\n        <input class=\"cre-input cre-dec\" id=\"te_cre_MinInterval\" type=\"number\" min=\"0\" max=\"65535\" placeholder=\"сек (дес)\" value=\"1\">\n        <span class=\"cre-hex-preview\" id=\"te_cre_MinInterval_hex\">0001</span>\n      </div>\n      <div class=\"cre-row\">\n        <label class=\"cre-label\">MaxInterval</label>\n        <input class=\"cre-input cre-dec\" id=\"te_cre_MaxInterval\" type=\"number\" min=\"0\" max=\"65535\" placeholder=\"сек (дес)\" value=\"300\">\n        <span class=\"cre-hex-preview\" id=\"te_cre_MaxInterval_hex\">012C</span>\n      </div>\n      <div class=\"cre-row\">\n        <label class=\"cre-label\">TimeOut</label>\n        <input class=\"cre-input cre-dec\" id=\"te_cre_TimeOut\" type=\"number\" min=\"0\" max=\"65535\" placeholder=\"сек (дес)\" value=\"0\">\n        <span class=\"cre-hex-preview\" id=\"te_cre_TimeOut_hex\">0000</span>\n      </div>\n      <div class=\"cre-row\">\n        <label class=\"cre-label\">Change</label>\n        <input class=\"cre-input cre-dec\" id=\"te_cre_Change\" type=\"number\" min=\"0\" max=\"65535\" placeholder=\"порог (дес)\" value=\"1\">\n        <span class=\"cre-hex-preview\" id=\"te_cre_Change_hex\">0001</span>\n      </div>\n      <div class=\"cre-hint\">Ввод в десятичных · hex рассчитывается автоматически</div>\n    </div>\n    <div class=\"ce-footer\">\n      <button class=\"ce-btn-cancel\" onclick=\"te_closeCfgReportEditor()\">Отмена</button>\n      <button class=\"ce-btn-cancel\" onclick=\"te_clearCfgReport(te_currentCfgObj);te_closeCfgReportEditor();\" style=\"background:#f8d8d8;border-color:var(--red);\">✖ Очистить</button>\n      <button class=\"ce-btn-apply\" onclick=\"te_applyCfgReportEditor()\">✅ Применить</button>\n    </div>\n  </div>\n</div>\n\n<!-- YA REP EDITOR MODAL -->\n<div id=\"te_yaRepEditorWnd\" style=\"display:none;position:absolute!important;top:0;left:0;width:100%;height:100%;z-index:9999;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);\">\n  <div class=\"ce-modal\" style=\"width:500px;max-height:85vh;\">\n    <div class=\"ce-header\" style=\"background:var(--accent);\">\n      <span>🏠 Редактор Яндекс</span>\n      <button class=\"ce-close\" onclick=\"te_closeYaRepEditor()\">✕</button>\n    </div>\n    <div class=\"ce-body\" style=\"padding:0;display:flex;flex-direction:column;gap:0;\">\n\n      <!-- Список шаблонов -->\n      <div style=\"display:flex;height:260px;border-bottom:1px solid var(--border);\">\n        <!-- Левая панель: категории + элементы -->\n        <div id=\"te_yre_list\" style=\"width:200px;flex-shrink:0;overflow-y:auto;border-right:1px solid var(--border);padding:4px 0;font-size:12px;\"></div>\n        <!-- Правая панель: описание выбранного -->\n        <div style=\"flex:1;padding:8px;overflow-y:auto;font-size:11px;color:var(--muted);\">\n          <div class=\"ce-section-title\">Предпросмотр</div>\n          <pre id=\"te_yre_preview\" style=\"font-size:10px;color:var(--text);white-space:pre-wrap;word-break:break-all;margin:0;background:var(--bg2);border-radius:4px;padding:6px;min-height:60px;\"></pre>\n          <div class=\"ce-divider\"></div>\n          <div class=\"ce-section-title\">Опции</div>\n          <div class=\"ce-row\" style=\"margin-bottom:4px;\">\n            <label class=\"ce-label\" style=\"min-width:90px;\">Retrievable</label>\n            <input type=\"checkbox\" id=\"te_yre_retrievable\" class=\"ce-check\" onchange=\"te_yre_updateFlags()\">\n          </div>\n          <div class=\"ce-row\" style=\"margin-bottom:4px;\">\n            <label class=\"ce-label\" style=\"min-width:90px;\">Reportable</label>\n            <input type=\"checkbox\" id=\"te_yre_reportable\" class=\"ce-check\" onchange=\"te_yre_updateFlags()\">\n          </div>\n          <div class=\"ce-divider\"></div>\n          <div class=\"ce-section-title\">Multi-device</div>\n          <div class=\"ce-row\" style=\"margin-bottom:4px;\">\n            <label class=\"ce-label\" style=\"min-width:90px;\">Включить</label>\n            <input type=\"checkbox\" id=\"te_yre_multi\" class=\"ce-check\" onchange=\"te_yre_toggleMulti()\">\n          </div>\n          <div id=\"te_yre_multi_fields\" style=\"display:none;\">\n            <div class=\"ce-row\" style=\"margin-bottom:4px;\">\n              <label class=\"ce-label\" style=\"min-width:90px;\">Name</label>\n              <input type=\"text\" class=\"ce-input\" id=\"te_yre_mname\" oninput=\"te_yre_updateMulti()\">\n            </div>\n            <div class=\"ce-row\" style=\"margin-bottom:4px;\">\n              <label class=\"ce-label\" style=\"min-width:90px;\">Room</label>\n              <input type=\"text\" class=\"ce-input\" id=\"te_yre_mroom\" oninput=\"te_yre_updateMulti()\">\n            </div>\n            <div class=\"ce-row\" style=\"margin-bottom:4px;\">\n              <label class=\"ce-label\" style=\"min-width:90px;\">Type</label>\n              <input type=\"text\" class=\"ce-input\" id=\"te_yre_mtype\" list=\"te_yre_types\" oninput=\"te_yre_updateMulti()\">\n              <datalist id=\"te_yre_types\">\n                <option value=\"devices.types.light\">\n                <option value=\"devices.types.socket\">\n                <option value=\"devices.types.switch\">\n                <option value=\"devices.types.thermostat\">\n                <option value=\"devices.types.thermostat.ac\">\n                <option value=\"devices.types.media_device\">\n                <option value=\"devices.types.media_device.tv\">\n                <option value=\"devices.types.media_device.tv_box\">\n                <option value=\"devices.types.media_device.receiver\">\n                <option value=\"devices.types.openable\">\n                <option value=\"devices.types.openable.curtain\">\n                <option value=\"devices.types.humidifier\">\n                <option value=\"devices.types.purifier\">\n                <option value=\"devices.types.vacuum_cleaner\">\n                <option value=\"devices.types.cooking.kettle\">\n                <option value=\"devices.types.cooking.coffee_maker\">\n                <option value=\"devices.types.cooking.multicooker\">\n                <option value=\"devices.types.sensor\">\n                <option value=\"devices.types.sensor.motion\">\n                <option value=\"devices.types.sensor.door\">\n                <option value=\"devices.types.sensor.water_leak\">\n                <option value=\"devices.types.sensor.smoke\">\n                <option value=\"devices.types.sensor.gas\">\n                <option value=\"devices.types.sensor.vibration\">\n                <option value=\"devices.types.sensor.button\">\n                <option value=\"devices.types.other\">\n              </datalist>\n            </div>\n          </div>\n        </div>\n      </div>\n\n      <!-- none режим -->\n      <div style=\"padding:6px 12px;background:var(--bg3);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;\">\n        <span style=\"font-size:11px;color:var(--muted);\">Установить none (отключить репортинг):</span>\n        <button class=\"ce-btn-cancel\" style=\"font-size:11px;padding:2px 10px;\" onclick=\"te_setYaRepNone()\">none</button>\n      </div>\n\n    </div>\n    <div class=\"ce-footer\">\n      <button class=\"ce-btn-cancel\" onclick=\"te_closeYaRepEditor()\">Отмена</button>\n      <button class=\"ce-btn-apply\" onclick=\"te_applyYaRepEditor()\">✅ Применить</button>\n    </div>\n  </div>\n</div>\n\n<!-- CLASS EDITOR MODAL -->\n<div id=\"te_classEditorWnd\" style=\"display:none; position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999; align-items:center; justify-content:center; background:rgba(0,0,0,0.45);\">\n  <div class=\"ce-modal\">\n    <div class=\"ce-header\">\n      <span>🏷️ Редактор класса</span>\n      <button class=\"ce-close\" onclick=\"te_closeClassEditor()\">✕</button>\n    </div>\n    <div class=\"ce-body\">\n      <div class=\"ce-row\">\n        <label class=\"ce-label\">Role</label>\n        <select class=\"ce-select ce-select-role\" id=\"ce_role_sel\" onchange=\"te_onCeRoleChange(this.value)\"></select>\n      </div>\n      <div class=\"ce-divider\"></div>\n      <div id=\"ce_dc_wrap\"></div>\n      <div class=\"ce-section-title\">Свойства</div>\n      <div id=\"ce_props\"></div>\n    </div>\n    <div class=\"ce-footer\">\n      <button class=\"ce-btn-cancel\" onclick=\"te_closeClassEditor()\">Отмена</button>\n      <button class=\"ce-btn-apply\" onclick=\"te_applyClassEditor()\">✅ Применить</button>\n    </div>\n  </div>\n</div>\n";

window.WinEngine && window.WinEngine.register({
  id:"templateedit",
  title:"Device editor",
  label:"Device editor",
  icon:'<img src="/static/icons/templateedit.svg" alt="">',
  single:true,
  template:    "<div class=\"window hidden\" data-x=\"80\" data-y=\"40\" data-w=\"920\" data-h=\"660\">" +
    "<style>"+TE_CSS+"</style>" +
    "<div class=\"window-head\"><span class=\"wtitle title\">Device editor</span>" +
    "<div class=\"c-tools\">" +
      "<button class=\"cbtn\" onclick=\"te_cmSave_click()\" title=\"Сохранить\">💾 Save</button>" +
      "<button class=\"cbtn\" onclick=\"te_cmSaveTmpl_click()\" title=\"Сохранить как шаблон\">📦 Tpl</button>" +
    "</div>" +
    "<div class=\"wbtns\"><button class=\"wbtn min\" data-waction=\"min\">–</button>" +
    "<button class=\"wbtn max\" data-waction=\"max\">▢</button>" +
    "<button class=\"wbtn\" data-waction=\"close\">✕</button></div></div>" +
    "<div class=\"window-body\" style=\"padding:0\">"+TE_BODY+"</div>" +
  "</div>",
  setup:function(node,opts){
    te_node=node; window.te_body=node.querySelector(".window-body");
    node._state={};
    te_file=null; te_docChanged=false; te_fileName="";
    var p=(opts&&opts.params)||"";
    var parts=p.split("#");
    var IEEE = parts.length>1 ? parts[1] : "";
    if(IEEE){ te_fileName=IEEE; window.te_fileLoaded=false; window.te_retryOnce=false; try{te_parseFile(IEEE);}catch(e){console.log("te parse",e);} if(window.WSsend) WSsend("getDeviceList"); }
    else { te_file={Name:"",Location:"",IEEE:"",Report:{}}; try{te_drawJson(te_file);}catch(e){} }
    try{ te_wMain_cbResizeEnd(); }catch(e){}
    var dw0=document.getElementById("te_DeviceWidget");
    if(dw0){ dw0.addEventListener("touchend",te_DeviceWidgetHandler); dw0.addEventListener("click",te_DeviceWidgetHandler); }
    if(window.ResizeObserver){ var ro=new ResizeObserver(function(){ try{te_wMain_cbResizeEnd();}catch(e){} }); ro.observe(node.querySelector(".window-body")); node._state.ro=ro; }
  },
  destroy:function(node){
    if(node._state&&node._state.ro) node._state.ro.disconnect();
    if(window.te_retryIv){ clearInterval(window.te_retryIv); window.te_retryIv=null; }
    if(window.te_retryHdl && window.eventE){ try{window.eventE.off("updateDeviceList", window.te_retryHdl);}catch(e){} window.te_retryHdl=null; }
    window.te_fileLoaded=false; window.te_retryOnce=false;
    te_reset();
  }
});
