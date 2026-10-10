var ZESPip
var jsconfig;
var lng = "en"
var eventE = new EventEmitter();
var websocket

function testWebSocket() {
	if (ZESPip == undefined) { ZESPip = window.location.hostname }
	if (websocket) { try { websocket.onclose = null; websocket.close(); } catch (e) {} websocket = null; }
	websocket = new WebSocket('ws://' + ZESPip + ':8181');
	websocket.onopen = function (evt) { onOpen(evt) };
	websocket.onmessage = function (evt) { onMessage(evt) };
	websocket.onerror = function (evt) { onError(evt) };
	websocket.onclose = function (evt) { onClose(evt) };


}



var configRetry = null;
function onOpen(evt) {
	// flush messages queued while the socket was down (clicks during reconnect)
	if (wsQueue.length) {
		var q = wsQueue; wsQueue = [];
		for (var i = 0; i < q.length; i++) { try { websocket.send(q[i]); } catch (e) { console.log("socket error", e); } }
	}
	WSsend("getDeviceList");
	WSsend('loadConfig')
	// wsopen: resubscribe personal feeds (logviewer etc.) after a break.
	eventE.emit('wsopen');
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
function onClose(evt) {
	console.log("socket closed, reconnecting");
	scheduleReconnect();
}
var reconnectTimer = null;
function scheduleReconnect() {
	if (reconnectTimer) return;
	reconnectTimer = setTimeout(function () { reconnectTimer = null; testWebSocket(); }, 1000);
}
// messages sent while the socket is down wait in the queue instead of
// throwing "WebSocket is already in CLOSING or CLOSED state"
var wsQueue = [];
function WSsend(message) {
	if (websocket && websocket.readyState === 1) { websocket.send(message); return; }
	wsQueue.push(message);
	if (wsQueue.length > 100) wsQueue.shift();
	if (!websocket || websocket.readyState === 3) testWebSocket();
}
var checkWS = setInterval(function () { if (websocket.readyState != 1) { testWebSocket(); } }, 10000);
testWebSocket();
function SaveJson(path, data) { WSsend('SaveJson|' + path + '|' + data); }
//function SaveFile(path,data){WSsend('SaveFile|'+path+'|'+data);}
function SaveFile(path, data) { WSsend(JSON.stringify({ "SaveFile": { "path": path, "data": data } })) }

// grpRemoveMember(groupIeee, memberIeee) — remove a listener from the group Members.
window.grpRemoveMember = function (groupIeee, memberIeee) {
	try {
		eventE.once('deviceFile:/Devices/' + groupIeee, function (data) {
			try {
				if (!data || data === 'NULL') return;
				var g = JSON.parse(data);
				g.Members = (g.Members || []).filter(function (m) { return m !== memberIeee; });
				SaveJson('/Devices/' + groupIeee, JSON.stringify(g));
			} catch (e) {}
		});
		WSsend('LoadJson|/Devices/' + groupIeee);
	} catch (e) {}
};
// groups = merged listener clusters: pulls missing ClI into EP 01,
// synthesizes Report controls (optimistic, no polling) and appends Members.
// Called by the manager (quick-add) and templateedit when adding membership.
window.grpExtendSurface = function (groupIeee, memberIeee, epClusters) {
	try {
		eventE.once('deviceFile:/Devices/' + groupIeee, function (data) {
			try {
				if (!data || data === 'NULL') return;
				var g = JSON.parse(data);
				g.EP = g.EP || {}; g.EP['01'] = g.EP['01'] || { PrfId: '0104', ClI: [], ClO: [] };
				g.EP['01'].ClI = g.EP['01'].ClI || [];
				g.Report = g.Report || {}; g.Members = g.Members || [];
				var ctlMap = {
					'0006': [{ key: '0100060000', label: 'On_Off', role: 'switch', dataType: '10', cls: { optimistic: true, icon: 'mdi:lightbulb' } }],
				'0008': [{ key: '0100080000', label: 'Level', role: 'light', dataType: '20', cls: { light_part: 'level', brightness_min: 0, brightness_max: 254 } }],
				'0300': [{ key: '0103000000', label: 'Color', role: 'light', dataType: '20', cls: { light_part: 'color', color_modes: 'rgb' } },
				          { key: '0103000007', label: 'ColorTemp', role: 'light', dataType: '21', cls: { light_part: 'color_temp', min_mireds: 153, max_mireds: 500 } }]
				};
				(epClusters || []).forEach(function (cl) {
					cl = String(cl || '').toUpperCase();
					var ms = ctlMap[cl];
					if (!ms) return;
					if (g.EP['01'].ClI.indexOf(cl) === -1) g.EP['01'].ClI.push(cl);
					ms.forEach(function (m) {
						if (!g.Report[m.key]) {
							g.Report[m.key] = { label: m.label, val: '', mat: '1', role: m.role, parsed: '', retain: '0', ya_rep: 'none', class: m.cls, polling: 0, debounce: 0, dataType: m.dataType };
						}
					});
				});
				if (memberIeee && g.Members.indexOf(memberIeee) === -1) g.Members.push(memberIeee);
				SaveJson('/Devices/' + groupIeee, JSON.stringify(g));
			} catch (e) { console.warn('grpExtendSurface', e); }
		});
		WSsend('LoadJson|/Devices/' + groupIeee);
	} catch (e) {}
};



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
		if (z[0] === "haddisc") {
			try { eventE.emit('haddisc', JSON.parse(z.slice(1).join("|"))); } catch (e) {}
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
		// Full device/template file (JoinSetup etc.): deviceFile:/Devices/XXX
		if (z[0].indexOf('/Devices/')===0 || z[0].indexOf('/Devtemplates/')===0) { eventE.emit('deviceFile:'+z[0], z.slice(1).join('|')); }

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

		// Live log feed (logviewer widget): log|<logfmt>, history
		// logHist|<json-array>, service logCtl|<text>.
		if (z[0] === "log") { eventE.emit('log', z.slice(1).join('|')); }
		if (z[0] === "logHist") { try { eventE.emit('logHist', JSON.parse(z.slice(1).join('|'))); } catch (e) {} }
		if (z[0] === "logCtl") { eventE.emit('logCtl', z.slice(1).join('|')); }

		if (z[0] === "join") {
			var jsbox = document.getElementById("joinstatus");
			if (!jsbox) return;
			jsbox.innerHTML += z[1];
			jsbox.scrollIntoView({ behavior: 'smooth', block: 'end' });
		}
		// No template for the model — a structured generation offer.
		// joinNoTemplate|IEEE|ModelId|ManufName
		if (z[0] === "joinNoTemplate") {
			try {
				eventE.emit('joinNoTemplate', { ieee: z[1] || '', model: z[2] || '', manuf: z.slice(3).join('|') || '' });
			} catch (e) {}
		}
		// Generation: full JSON — open in the editor without saving.
		// genTemplateResult|IEEE|base64(json)
		if (z[0] === "genTemplateResult") {
			try {
				var raw = atob(z.slice(2).join('|'));
				var obj = JSON.parse(decodeURIComponent(escape(raw)));
				eventE.emit('genTemplateResult', { ieee: z[1] || '', json: obj });
			} catch (e) { console.warn('genTemplateResult', e); }
		}
		// Generation: several candidates — a list to choose from.
		// genTemplateCandidates|IEEE|base64([{model,vendor}])
		if (z[0] === "genTemplateCandidates") {
			try {
				var craw = atob(z.slice(2).join('|'));
				var cands = JSON.parse(decodeURIComponent(escape(craw)));
				eventE.emit('genTemplateCandidates', { ieee: z[1] || '', candidates: cands });
			} catch (e) { console.warn('genTemplateCandidates', e); }
		}
		// Generation progress for the device editor panel (join window may be closed).
		// teGenLog|IEEE|base64(html)
		if (z[0] === "teGenLog") {
			try {
				var traw = atob(z.slice(2).join('|'));
				var thtml = decodeURIComponent(escape(traw));
				eventE.emit('teGenLog', { ieee: z[1] || '', html: thtml });
			} catch (e) { console.warn('teGenLog', e); }
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
			// Хаб шлёт regYandex|ok|user_created (3 части), старый формат
			// regYandex|mak|regYandex|ok|user_updated (5 частей) — показываем хвост.
			var txt = z.length >= 5 ? z[4] : z.slice(1).join("|");
			new Toast({
				title: 'Yandex',
				text: txt || 'ok',
				theme: 'light',
				autohide: true,
				interval: 3500
			});
			try { eventE.emit('yaReg', txt); } catch (e) {}
		}
		if (z[0] === "yaState") {
			try { eventE.emit('yaState', z[1] || ''); } catch (e) {}
		}

		if (z[0] === "status") {
			new Toast({ title: 'success', text: z[1], theme: 'light', autohide: true, interval: 3500 });
			eventE.emit('bindStatus', z[1]);
		}
		
		if (z[0] === "notify") {
			const notifyText = z[1] || '';
			// Detect the type from the ZESP reply contents
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
			// Add to NotificationCenter (if connected)
			if (window.NC) {
				NC.add(notifyTitle, notifyText, notifyType);
			} else {
				// fallback — plain Toast if NC is not connected
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
		// debug|text — log from the automation console_log block
		if (z[0] === "debug") {
			console.log("[Automation]", z[1]);
			eventE.emit('automationLog', { level: 'debug', text: z[1] });
		}
		// error|text — automation error
		if (z[0] === "error") {
			console.error("[Automation Error]", z[1]);
			eventE.emit('automationLog', { level: 'error', text: z[1] });
		}
		// scripterror|text — script load error
		if (z[0] === "scripterror") {
			console.error("[Script Error]", z[1]);
			new Toast({ title: 'Automation Error', text: z[1], theme: 'dark', autohide: false, interval: 0 });
			eventE.emit('scripterror', z[1]);
		}
		// highlight|blockId — highlight a specific block (optional, via block ID)
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
		const ind = deviceList.findIndex(device => (rep.IEEE && device.IEEE === rep.IEEE) || (rep.ShortAddr && device.Device === rep.ShortAddr));
		if (ind === -1) return;
		const dev = deviceList[ind];

		// Report key: rep.Obj takes priority (virtual/BLE/Tuya), otherwise assemble from parts
		const attrID = rep.Obj || rep.Object || `${rep.EndPoint}${rep.ClusterId}${rep.AttribId}`;

		// Update the in-memory deviceList
		try {
			if (dev.Report[attrID]) {
				dev.Report[attrID].parsed = rep.parsed;
				dev.Report[attrID].Data   = rep.Data;
			}
			dev.lastSeen = rep.time;
		} catch {}

		// Detect role and cluster for correct scaling
		const report   = dev.Report && dev.Report[attrID];
		const role     = report ? report.role.split("&")[0] : "";
		const cluster  = rep.ClusterId || attrID.substring(2, 6);
		const val      = rep.parsed;

		// CSS class of this object's elements
		const cls = rep.IEEE + "#" + attrID;

		// Boolean-state (on/off) flag
		const isOn = [1, "1", true, "on", "ON", "true", "ON"].includes(val);
		const isOff = [0, "0", false, "off", "OFF", "false"].includes(val);

		// --- refresh the tile in the device list (if present) ---
		const tileEl = document.getElementById(dev.IEEE);
		if (tileEl) {
			try {
				const newTile = get_tile(dev);
				tileEl.innerHTML = '';
				while (newTile.firstChild) tileEl.appendChild(newTile.firstChild);
			} catch {}
		}

		// --- walk all DOM elements with this class ---
		const ea = document.getElementsByClassName(cls);
		for (let i = 0; i < ea.length; i++) {
			const el = ea[i];
			switch (el.tagName.toUpperCase()) {

				case "SELECT":
					el.value = val;
					break;

				case "SPAN":
					// Flash red → gray
					el.style.color = "red";
					el.textContent = (val !== undefined && val !== null && val !== "") ? val : (rep.Data || "?");
					const spanEl = el;
					setTimeout(() => { spanEl.style.color = "#777"; }, 1500);
					break;

				case "INPUT":
					switch (el.type) {

						case "checkbox": {
							// Refresh the checkbox
							if (isOn)  el.checked = true;
							if (isOff) el.checked = false;

							// Refresh the visual toggle-switch (span inside label[for=id])
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

							// Refresh the bulb (lamp onoff: role light + onoff part, or legacy light_onoff)
							if (role === "light_onoff" || role === "light") {
								try {
									const bulb = el.closest(".ac")?.querySelector("[id^='bulb_'], [id^='z']");
									if (bulb) {
										bulb.style.webkitFilter = el.checked
											? "brightness(150%)"
											: "brightness(30%)";
									}
								} catch {}
							}
							break;
						}

						case "number": {
							let numVal = parseFloat(val);
							if (!isNaN(numVal)) el.value = numVal;
							break;
						}
						case "range": {
							let rangeVal = parseFloat(val) || 0;

						// Scale by cluster/role.
						// 0008→0-100 — light brightness only (role light):
						// number/range have their own scale from the class (e.g. Volume 0300080000, max 254),
						// mapping wrote ~100 into a slider with max=254 and dragged the thumb to the middle.
						if (cluster === "0008" && role !== "number" && role !== "range") {
								// ZigBee brightness: 0-255 → 0-100
								rangeVal = map_range(rangeVal, 0, 255, 0, 100);
							} else if (cluster === "0300" && attrID.endsWith("0007")) {
								// Color temperature (mireds): 153-500 → 0-100
								rangeVal = map_range(rangeVal, 153, 500, 0, 100);
							} else if (cluster === "0300" && attrID.endsWith("0000")) {
								// Hex color — don't update rangeVal (leave NaN)
								rangeVal = NaN;
							} else if (role === "cover") {
								// Curtain position is already 0-100
								rangeVal = Math.min(100, Math.max(0, rangeVal));
							} else if (role === "climate" || role === "range") {
								// Temperature — value as-is
								// rangeVal = rangeVal (unchanged)
							} else if (role === "fan") {
								// Speed 0-100
								rangeVal = Math.min(100, Math.max(0, rangeVal));
							}
							// For number — as-is
							if (!isNaN(rangeVal)) el.value = rangeVal;

							// Refresh the neighbor span with the current value
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

							// Refresh the bulb brightness
							if (cluster === "0008" || role === "light_level") {
								try {
									const ac = el.closest(".ac");
									const bulb = ac && ac.querySelector("[id^='bulb_'], [id^='z']");
									if (bulb) bulb.style.webkitFilter = `brightness(${rangeVal}%)`;
								} catch {}
							}
							// Refresh the bulb color from the color-temperature report
							if (cluster === "0300" && attrID.endsWith("0007") && (role === "light_color_temp" || role === "light")) {
								try {
									const ac = el.closest(".ac");
									const bulb = ac && ac.querySelector("[id^='bulb_'], [id^='z']");
									if (bulb) {
										var t = rangeVal / 100, h = t < 0.5 ? 185 : 35;
										var s = Math.round(Math.abs(t - 0.5) * 2 * 85);
										var l = Math.round(60 + (1 - s / 85) * 28);
										var c2 = hsl2Hex(h, s, l);
										bulb.style.background = 'radial-gradient(circle 150px,' + c2 + ', rgb(82,89,81))';
										bulb.style['box-shadow'] = c2 + ' 0px 1px 50px 8px';
									}
								} catch {}
							}
							break;
						}
					}
					break;
			}
			// Refresh the bulb color from the hex-color report (regardless of element type)
			if (cluster === "0300" && attrID.endsWith("0000") && (role === "light_color" || role === "light")) {
				console.log('[color] hex bulb update val=', val);
				try {
					const ac = el.closest(".ac");
					const bulb = ac && ac.querySelector("[id^='bulb_'], [id^='z']");
					if (bulb && val && val.length >= 6) {
						var hex = val.replace('#','');
						if (hex.length >= 6) {
							bulb.style.background = 'radial-gradient(circle 150px,#' + hex + ', rgb(82,89,81))';
							bulb.style['box-shadow'] = '#' + hex + ' 0px 1px 50px 8px';
						}
					}
				} catch {}
			}
		}

		// --- refresh the climate target-temp span (id="clt_...") separately ---
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

		// --- refresh the range slider (id="level|...") ---
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

		// --- refresh the lock icon ---
		if (role === "lock") {
			try {
				document.querySelectorAll(`span.${CSS.escape(cls)}[style*="cursor:pointer"]`).forEach(el => {
					const locked = ["locked", "LOCKED", "1", 1, true].includes(val);
					el.textContent = locked ? "🔒" : "🔓";
					el.style.color  = locked ? "#ef5350" : "#66bb6a";
				});
			} catch {}
		}

		// --- refresh the climate-mode buttons ---
		if (role === "climate" && report && typeof val === "string") {
			try {
				const sysKey = Object.keys(dev.Report || {}).find(k => /^01\d{4}001C$/.test(k));
				const sysMap = {0:'off', 1:'auto', 3:'cool', 4:'heat', 7:'fan_only', 8:'dry'};
				const modeVal = sysKey ? (sysMap[parseInt(val,10)] || val) : val;
				const modeColors = {heat:"#ff7043",cool:"#42a5f5",auto:"#ab47bc","fan_only":"#29b6f6",dry:"#ffca28",eco:"#66bb6a",off:"#616161"};
				document.querySelectorAll(`span[onclick*="climate_mode|${cls}"]`).forEach(btn => {
					const m = btn.getAttribute("onclick")?.match(/'([^']+)'\)$/)?.[1];
					if (!m) return;
					const active = m === modeVal;
					btn.style.background = active ? (modeColors[m] || "#888") : "#444";
					btn.style.border = `${active ? "2" : "1"}px solid ${modeColors[m] || "#888"}`;
				});
			} catch {}
		}

		// --- refresh the fan preset buttons ---
		if (role === "fan" && typeof val === "string") {
			try {
				const cur = String(val).toLowerCase().trim();
				document.querySelectorAll(`span[onclick*="fan_speed|${cls}"]`).forEach(btn => {
					const m = btn.getAttribute("onclick")?.match(/'([^']+)'\)$/)?.[1];
					if (!m) return;
					const active = m.toLowerCase() === cur;
					btn.style.background = active ? "#29b6f6" : "#444";
					btn.style.border = `${active ? "2" : "1"}px solid #29b6f6`;
				});
			} catch {}
		}

	} catch (e) { console.log("widgetReport err:", e); }
}

function map_range(value, low1, high1, low2, high2) {
	return Math.floor(low2 + (high2 - low2) * (value - low1) / (high1 - low1));
}