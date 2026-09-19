var ZESPip
var jsconfig;
var lng = "en"
var eventE = new EventEmitter();
var websocket

function testWebSocket() {
	if (ZESPip == undefined) { ZESPip = window.location.hostname }
	if (websocket) { websocket = null }
	websocket = new WebSocket('ws://' + ZESPip + ':8181');
	websocket.onopen = function (evt) { onOpen(evt) };
	websocket.onmessage = function (evt) { onMessage(evt) };
	websocket.onerror = function (evt) { onError(evt) };


}



var configRetry = null;
function onOpen(evt) {
	WSsend("getDeviceList");
	WSsend('loadConfig')
	if (configRetry) clearInterval(configRetry);
	configRetry = setInterval(function () {
		if (window.jsconfig) { clearInterval(configRetry); configRetry = null; return; }
		WSsend('loadConfig');
	}, 3000);
	eventE.once('jsconfig', function (data) {
		console.log(data);
		jsconfig = data
		lng = jsconfig.APP.Lang.val
	});
}
function onMessage(evt) { parseSocket(evt); }
function onError(evt) { console.log("socket error"); }
function WSsend(message) { websocket.send(message); }
var checkWS = setInterval(function () { if (websocket.readyState != 1) { testWebSocket(); } }, 10000);
testWebSocket();
function SaveJson(path, data) { WSsend('SaveJson|' + path + '|' + data); }
//function SaveFile(path,data){WSsend('SaveFile|'+path+'|'+data);}
function SaveFile(path, data) { WSsend(JSON.stringify({ "SaveFile": { "path": path, "data": data } })) }



function parseSocket(msg) {
	try {
		//			 console.log(msg.data)
		var z = msg.data.split("|");
		//;
		if (z[0] == "zcl") {
			eventE.emit('zcl', JSON.parse(z[1]));
		}
		
		if (z[0] == "ClassterAttr") {
			eventE.emit('ClassterAttr', JSON.parse(z[1])); }
		if (z[0] == "ls_dir") { eventE.emit('ls_dir', JSON.parse(z[1])); }
		if (z[0] === "jsconfig") {
			try { jsconfig = JSON.parse(z[1]); window.jsconfig = jsconfig; } catch (e) {}
			eventE.emit('jsconfig', jsconfig);
		}
		if (z[0] === "yaLogin") {
			var data = z.slice(1).join("|");
			eventE.emit('yaLogin', JSON.parse(data));
			}
		if (z[0] === "ArBle") {
			eventE.emit('ArBle', JSON.parse(z[1]));
			console.log(JSON.parse(z[1]))
		}
		if (z[0] === "RESP_ZCL_CLUSTER") {
			//eventE.emit('ArBle', JSON.parse(z[1]));

			console.log(JSON.parse(z[1]))
		}
		if (z[0] === "alldev") {
			try {
				//eventE.emit('jsconfig', JSON.parse(z[1]));
				deviceList = JSON.parse(z[1]);
				CURVERSION = z[2];
				eventE.emit('updateDeviceList', JSON.parse(z[1]));
			} catch { }
		}
		if (z[0] == "load_file") {
			console.log(z)
			eventE.emit('load_file', z[1]);

		}
		if (z[0] == "LoadJson") { 
		eventE.emit('LoadJson', z[1]);
		}
		if (z[0] == "/Devtemplates/BLE") { 
		eventE.emit('templatesBLE', z[1]);
		}		
		
		
		
		if (z[0] === "/groups.json") { groups = JSON.parse(z[1]); eventE.emit('groups', groups); }

		if (z[0] === "LQI_RSP") { eventE.emit('LQI_RSP', JSON.parse(z[1])); console.log(z); }
		if (z[0] === "rep") {
			widgetReport(JSON.parse(z[1]))
			eventE.emit('report', [JSON.parse(z[1]), z[2]])
			console.log('report', [JSON.parse(z[1]), z[2]])
		}

		if (z[0] === "repUndef") {
			eventE.emit(`reportUndef${z[2]}`, [JSON.parse(z[1]), z[2]])
			widgetReport(JSON.parse(z[1]))
			eventE.emit('report', [JSON.parse(z[1]), z[2]])		
		}


		if (z[0] === "join") {
			document.getElementById("joinstatus").innerHTML += z[1];
			document.getElementById("joinstatus").scrollIntoView({ behavior: 'smooth', block: 'end' });
		}
		//var htmlj=$('#joinstatus').append(z[1]);
		if (z[0] === "removedDevice") {
			new Toast({
				title: 'Device',
				text: z[1] + ' removed',
				theme: 'light',
				autohide: true,
				interval: 3500
			});
		}
		if (z[0] === "regYandex") {
			//regYandex|mak|regYandex|ok|user_updated
			new Toast({
				title: 'Yandex',
				text: z[4] ,
				theme: 'light',
				autohide: true,
				interval: 3500
			});
		}

		if (z[0] === "status") {
			new Toast({ title: 'success', text: z[1], theme: 'light', autohide: true, interval: 3500 });
			eventE.emit('bindStatus', z[1]);
		}
		
		if (z[0] === "notify") {
			const notifyText = z[1] || '';
			// Определяем тип по содержимому ответа от ZESP
			let notifyType  = 'info';
			let notifyTitle = 'Уведомление';
			if (/up-to-date/i.test(notifyText)) {
				notifyType  = 'success';
				notifyTitle = '✅ Прошивка актуальна';
			} else if (/updated version|current version|обновл|новая версия/i.test(notifyText)) {
				notifyType  = 'update';
				notifyTitle = '🆕 Доступно обновление';
			} else if (/error|err|ошибк/i.test(notifyText)) {
				notifyType  = 'error';
				notifyTitle = '❌ Ошибка';
			} else if (/warn|внимани/i.test(notifyText)) {
				notifyType  = 'warning';
				notifyTitle = '⚠️ Внимание';
			}
			// Добавляем в NotificationCenter (если подключён)
			if (window.NC) {
				NC.add(notifyTitle, notifyText, notifyType);
			} else {
				// fallback — обычный Toast если NC не подключён
				new Toast({ title: notifyTitle, text: notifyText, theme: 'light', autohide: true, interval: 0 });
			}
		}
		if (z[0] === "updateProgress") {
			switch (z[1]) {
				case "downStart":
					updateProgress.show();
					updateProgress.setText('Скачивание...');
					updateProgress.updateProgress(0);
					break
				case "downPercent":
					updateProgress.updateProgress(z[2]);
					break
				case "downComplete":
					updateProgress.setText('Распаковка...');
					updateProgress.updateProgress(40);
					break
				case "file":
					updateProgress.setFileText(z[2]);
					break
				case "step":
					switch (z[2]) {
						case "install":
							updateProgress.setText('Замена бинарника...');
							updateProgress.updateProgress(70);
							break
						case "restartNeeded":
							updateProgress.setText('Обновление завершено. Перезапустите сервер.');
							updateProgress.updateProgress(100);
							setTimeout(() => updateProgress.hide(), 4000);
							break
						case "replaceDone":
							updateProgress.setText('Обновление завершено');
							updateProgress.updateProgress(100);
							setTimeout(() => updateProgress.hide(), 2000);
							break
						case "error":
						case "replaceError":
							updateProgress.setText('Ошибка обновления');
							updateProgress.updateProgress(0);
							setTimeout(() => updateProgress.hide(), 3000);
							break
					}
					break
			}
		}
		
		
		
		
		
		// ── Automation engine messages ────────────────────────────────────────────
		// debug|text — лог из console_log блока автоматизации
		if (z[0] === "debug") {
			console.log("[Automation]", z[1]);
			eventE.emit('automationLog', { level: 'debug', text: z[1] });
		}
		// error|text — ошибка в автоматизации
		if (z[0] === "error") {
			console.error("[Automation Error]", z[1]);
			eventE.emit('automationLog', { level: 'error', text: z[1] });
		}
		// scripterror|text — ошибка загрузки скрипта
		if (z[0] === "scripterror") {
			console.error("[Script Error]", z[1]);
			new Toast({ title: 'Automation Error', text: z[1], theme: 'dark', autohide: false, interval: 0 });
			eventE.emit('scripterror', z[1]);
		}
		// highlight|blockId — подсветка конкретного блока (опционально, через block ID)
		if (z[0] === "highlight") {
			try {
				const workspace = Blockly.getMainWorkspace();
				if (workspace) {
					workspace.highlightBlock(z[1]);
					setTimeout(() => workspace.highlightBlock(null), 1500);
				}
			} catch(e) {}
		}

		// ── Speaker / YAM messages ──────────────────────────────────────────────
		if (z[0] === "speakerList") { eventE.emit('speakerList', JSON.parse(z.slice(1).join('|'))); }
		if (z[0] === "speakerDiscover") { eventE.emit('speakerDiscover', JSON.parse(z.slice(1).join('|'))); }
		if (z[0] === "speakerCloudLoad") { eventE.emit('speakerCloudLoad', JSON.parse(z.slice(1).join('|'))); }
		if (z[0] === "speakerConnect") { eventE.emit('speakerConnect', JSON.parse(z.slice(1).join('|'))); }
		if (z[0] === "speakerDisconnect") { eventE.emit('speakerDisconnect', JSON.parse(z.slice(1).join('|'))); }
		if (z[0] === "speakerRemove") { eventE.emit('speakerRemove', JSON.parse(z.slice(1).join('|'))); }
		if (z[0] === "speakerSetIP") { eventE.emit('speakerSetIP', JSON.parse(z.slice(1).join('|'))); }
		if (z[0] === "speakerState") { eventE.emit('speakerState', JSON.parse(z.slice(1).join('|'))); }
		if (z[0] === "ZD_RSP") {
			if (z[2] == "00" || z[2] == "Ok") {
				//toastr["success"]("<div>"+z[3]+"</div><div>"+z[1]+" Status: "+z[2]+"</div>");
				new Toast({ title: 'success', text: "\n" + z[3] + "\n" + z[1] + "\n Status: " + z[2] + "", theme: 'light', autohide: true, interval: 3500 })
			} else {
				//toastr["error"]("<div>"+z[3]+"</div><div>"+z[1]+" Status: "+z[2]+"</div>");			 
				new Toast({ title: 'error', text: "\n" + z[3] + "\n" + z[1] + "\n Status: " + z[2] + "", theme: 'light', autohide: true, interval: 3500 })
			}


		}




		if (z[0] == "VoiceCmd") {
			eventE.emit('VoiceCmd', z[1]);
			console.log(z[1])
			new Toast({
				title: 'Команда',
				text: z[1],
				theme: 'light',
				autohide: true,
				interval: 3500
			});

		}






	} catch (e) { console.log(e) }
}
var updateProgress={}
function getUpdate() {
	updateProgress = new ProgressBarWidget();
	WSsend('cmdUpdatefw')
}

function Hex(d, padding) {
	var hex = Number(d).toString(16);
	padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
	while (hex.length < padding) { hex = "0" + hex; }
	return hex;
}
function widgetReport(rep) {
	try {
		const ind = deviceList.findIndex(device => device.Device === rep.ShortAddr);
		if (ind === -1) return;
		const dev = deviceList[ind];

		// Ключ репорта: приоритет rep.Obj (виртуальные/BLE/Tuya), иначе собираем из частей
		const attrID = rep.Obj || `${rep.EndPoint}${rep.ClusterId}${rep.AttribId}`;

		// Обновляем deviceList в памяти
		try {
			if (dev.Report[attrID]) {
				dev.Report[attrID].parsed = rep.parsed;
				dev.Report[attrID].Data   = rep.Data;
			}
			dev.lastSeen = rep.time;
		} catch {}

		// Определяем роль и кластер для правильного масштабирования
		const report   = dev.Report && dev.Report[attrID];
		const role     = report ? report.role.split("&")[0] : "";
		const cluster  = rep.ClusterId || attrID.substring(2, 6);
		const val      = rep.parsed;

		// CSS-класс элементов этого объекта
		const cls = rep.IEEE + "#" + attrID;

		// Признак boolean-состояния (on/off)
		const isOn = [1, "1", true, "on", "ON", "true", "ON"].includes(val);
		const isOff = [0, "0", false, "off", "OFF", "false"].includes(val);

		// --- обновляем tile в списке устройств (если есть) ---
		const tileEl = document.getElementById(dev.IEEE);
		if (tileEl) {
			try {
				const newTile = get_tile(dev);
				tileEl.innerHTML = '';
				while (newTile.firstChild) tileEl.appendChild(newTile.firstChild);
			} catch {}
		}

		// --- обходим все DOM-элементы с этим классом ---
		const ea = document.getElementsByClassName(cls);
		for (let i = 0; i < ea.length; i++) {
			const el = ea[i];
			switch (el.tagName.toUpperCase()) {

				case "SELECT":
					el.value = val;
					break;

				case "SPAN":
					// Вспышка красным → серый
					el.style.color = "red";
					el.textContent = (val !== undefined && val !== null && val !== "") ? val : (rep.Data || "?");
					const spanEl = el;
					setTimeout(() => { spanEl.style.color = "#777"; }, 1500);
					break;

				case "INPUT":
					switch (el.type) {

						case "checkbox": {
							// Обновляем чекбокс
							if (isOn)  el.checked = true;
							if (isOff) el.checked = false;

							// Обновляем визуальный toggle-switch (span внутри label[for=id])
							try {
								const label = document.querySelector(`label[for="${el.id}"]`);
								const sw = label && label.querySelector(".toggle-switch");
								if (sw) {
									sw.style.borderColor = el.checked ? "#e20617" : "#c9cfd4";
									const dot = sw.querySelector("span");
									if (dot) {
										dot.style.left  = el.checked ? "unset" : "2px";
										dot.style.right = el.checked ? "2px"   : "unset";
										dot.style.background = el.checked ? "#fff" : "#c9cfd4";
									}
								}
							} catch {}

							// Обновляем лампочку (для light on_off)
							if (role === "light") {
								try {
									const bulb = el.closest(".ac")?.querySelector("[id^='z']");
									if (bulb) {
										bulb.style.webkitFilter = el.checked
											? "brightness(150%)"
											: "brightness(30%)";
									}
								} catch {}
							}
							break;
						}

						case "range": {
							let rangeVal = parseFloat(val) || 0;

							// Масштабируем по кластеру/роли
							if (cluster === "0008") {
								// Яркость ZigBee: 0-255 → 0-100
								rangeVal = map_range(rangeVal, 0, 255, 0, 100);
							} else if (cluster === "0300" && attrID.endsWith("0007")) {
								// Цветовая температура (mireds): 153-500 → 0-100
								rangeVal = map_range(rangeVal, 153, 500, 0, 100);
							} else if (cluster === "0300" && attrID.endsWith("0000")) {
								// Цвет hex — rangeVal не обновляем (оставляем NaN)
								rangeVal = NaN;
							} else if (role === "cover") {
								// Позиция шторы уже 0-100
								rangeVal = Math.min(100, Math.max(0, rangeVal));
							} else if (role === "climate" || role === "range") {
								// Температура — значение напрямую
								// rangeVal = rangeVal (без изменений)
							} else if (role === "fan") {
								// Скорость 0-100
								rangeVal = Math.min(100, Math.max(0, rangeVal));
							}
							// Для number — напрямую
							if (!isNaN(rangeVal)) el.value = rangeVal;

							// Обновляем соседний span с текущим значением
							try {
								const parent = el.parentElement;
								if (parent) {
									const valSpan = parent.querySelector(`span.${CSS.escape(cls)}, span[id^="clt_"], span[id^="rng_"]`);
									if (valSpan) {
									if (role === "climate") {
										valSpan.textContent = rangeVal + "°";
									} else if (role === "range") {
										valSpan.textContent = rangeVal;
									} else if (role === "cover") {
											valSpan.textContent = rangeVal + "%";
										} else {
											valSpan.textContent = rangeVal;
										}
									}
								}
							} catch {}

							// Обновляем лампочку brightness
							if (cluster === "0008" || (role === "light" && report && report.label === "Level")) {
								try {
									const ac = el.closest(".ac");
									const bulb = ac && ac.querySelector("[id^='z']");
									if (bulb) bulb.style.webkitFilter = `brightness(${rangeVal}%)`;
								} catch {}
							}
							// Обновляем цвет лампочки по репорту цветовой температуры
							if (cluster === "0300" && role === "light" && report && (report.label === "Color_Control" || report.label === "ColorT")) {
								try {
									const ac = el.closest(".ac");
									const bulb = ac && ac.querySelector("[id^='z']");
									if (bulb) {
										var hue2 = Math.floor(50 + (170 - 50) * (rangeVal - 1) / (100 - 1));
										bulb.style.background = 'radial-gradient(circle 150px,' + hsl2Hex(hue2, 100, 50) + ', rgb(82,89,81))';
									}
								} catch {}
							}
							break;
						}
					}
					break;
			}
			// Обновляем цвет лампочки по репорту hex цвета (вне зависимости от типа элемента)
			if (cluster === "0300" && attrID.endsWith("0000") && role === "light") {
				console.log('[color] hex bulb update val=', val);
				try {
					const ac = el.closest(".ac");
					const bulb = ac && ac.querySelector("[id^='z']");
					if (bulb && val && val.length >= 6) {
						var hex = val.replace('#','');
						if (hex.length >= 6) {
							bulb.style.background = 'radial-gradient(circle 150px,#' + hex + ', rgb(82,89,81))';
						}
					}
				} catch {}
			}
		}

		// --- обновляем climate target temp span (id="clt_...") отдельно ---
		if (role === "climate") {
			try {
				const tempInput = document.getElementById(`climate_temp|${cls}`);
				if (tempInput) {
					const sysKey = Object.keys(dev.Report || {}).find(k => /^01\d{4}001C$/.test(k));
					let setVal = val;
					if (sysKey) {
						const setKey = Object.keys(dev.Report).find(k => /^01\d{4}0012$/.test(k));
						if (setKey && dev.Report[setKey].parsed !== undefined) setVal = dev.Report[setKey].parsed;
					}
					tempInput.value = setVal;
					const cltSpan = document.getElementById(`clt_${tempInput.id.replace("climate_temp|", "").replace(/[^a-zA-Z0-9]/g, "")}`);
					if (cltSpan) cltSpan.textContent = setVal + "°";
				}
			} catch {}
		}

		// --- обновляем range слайдер (id="level|...") ---
		if (role === "range") {
			try {
				const rngInput = document.getElementById(`level|${cls}`);
				if (rngInput) {
					rngInput.value = val;
					const rngSpan = document.getElementById(`rng_${rngInput.id.replace("level|", "").replace(/[^a-zA-Z0-9]/g, "")}`);
					if (rngSpan) rngSpan.textContent = val;
				}
			} catch {}
		}

		// --- обновляем lock иконку ---
		if (role === "lock") {
			try {
				document.querySelectorAll(`span.${CSS.escape(cls)}[style*="cursor:pointer"]`).forEach(el => {
					const locked = ["locked", "LOCKED", "1", 1, true].includes(val);
					el.textContent = locked ? "🔒" : "🔓";
					el.style.color  = locked ? "#ef5350" : "#66bb6a";
				});
			} catch {}
		}

		// --- обновляем climate mode кнопки ---
		if (role === "climate" && report && typeof val === "string") {
			try {
				const sysKey = Object.keys(dev.Report || {}).find(k => /^01\d{4}001C$/.test(k));
				const sysMap = {0:'off', 1:'auto', 3:'cool', 4:'heat', 7:'fan_only', 8:'dry'};
				const modeVal = sysKey ? (sysMap[parseInt(val,10)] || val) : val;
				const modeColors = {heat:"#ff7043",cool:"#42a5f5",auto:"#ab47bc","fan_only":"#29b6f6",dry:"#ffca28",off:"#616161"};
				document.querySelectorAll(`span[onclick*="climate_mode|${cls}"]`).forEach(btn => {
					const m = btn.getAttribute("onclick")?.match(/'([^']+)'\)$/)?.[1];
					if (!m) return;
					const active = m === modeVal;
					btn.style.background = active ? (modeColors[m] || "#888") : "#444";
					btn.style.border = `${active ? "2" : "1"}px solid ${modeColors[m] || "#888"}`;
				});
			} catch {}
		}

	} catch (e) { console.log("widgetReport err:", e); }
}

function map_range(value, low1, high1, low2, high2) {
	return Math.floor(low2 + (high2 - low2) * (value - low1) / (high1 - low1));
}