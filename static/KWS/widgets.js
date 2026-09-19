//📶 ▶️ 🔄 🔙 ✔️ ⚙️ 📷 🔋 🎚️ ☢🛡⚠︎🚬🌟💨📳☣️☔🔊🎧🔥
function getDeviceClass(json) {
  if (json.class && json.class.device_class) {
    return json.class.device_class;
  } else if (json.role && json.role.includes("&")) {
    try {
      const parsedRole = JSON.parse(json.role.split("&")[1]);
      if (parsedRole.device_class) {
        return parsedRole.device_class;
      }
    } catch (e) {}
  }

  if (json.role === "light" && json.label) {
    return json.label;
  }

  return json.role.split("&")[0] || "";
}

function geticon(device_class) {
	//   console.log("geticon(" + device_class + ")")
	var ico = "🔹";
	if (!device_class) return ico
	switch (device_class.toLocaleLowerCase()) {
		case "battery": ico = "🔋"; break;
		case "battery_charging": ico = "🔋"; break;
		case "door": ico = "🚪"; break;
		case "light": ico = "💡"; break;
		case "moving": ico = "🚶🏿"; break;
		case "plug": ico = "🔌"; break;
		case "problem": ico = "⚠️"; break;
		case "smoke": ico = "💨"; break;
		case "switch": ico = "🔘"; break;
		case "sensor": ico = "📟"; break;
		case "vibration": ico = "📳"; break;
		case "window": ico = "🪟"; break;
		case "illuminance": ico = "🔆"; break;
		case "signal_strength": ico = "📶"; break;
		case "cover": ico = "🎚"; break;
		case "humidity": ico = "💧"; break;
		case "pressure": ico = "🗜"; break;
		case "gas": ico = "☢️"; break;
		case "lamp": ico = "💡️"; break;
		case "pir": ico = "👣"; break;
		case "motion": ico = "🏃🏿"; break;
		case "temperature": ico = "🌡️"; break;
		case "occupancy": ico = "🏄"; break;
		case "voltage": ico = "🔋"; break; 
		case "battery_level": ico = "🔋"; break;
		case "current": ico = "🔋"; break; 
		case "wind": ico = "🌬"; break;
		case "uv": ico = "☀️"; break;
		case "garage_door": ico = "🚪"; break;		
		case "safety": ico = "🛡"; break;
		case "connectivity": ico = "🌐"; break;
		case "lock": ico = "🔒"; break;
		case "moisture": ico = "💧"; break;
		case "sound": ico = "🎵"; break;
		case "heat": ico = "♨️"; break;
		case "opening": ico = "🚪"; break;
		case "power": ico = "⚡"; break;
		case "presence": ico = "👤"; break;
		case "timestamp": ico = "🕓"; break;
		case "energy": ico = "🔋"; break;
		case "power_factor": ico = "⚡"; break;
		case "brightness": ico = "🔆"; break;
		case "color": ico = "🌈"; break;
	}
	return ico;
}

function getIconSvg(device_class,size=28,color="silver", value) {
  let svgPath = `M3 3v18h18V3H3zm16 16H5V5h14v14z`; // Значение по умолчанию (пустой путь)

  //if (!device_class) return svgPath; // Или можно вернуть какой-то дефолтный SVG

  switch (device_class.toLocaleLowerCase()) {
    
	case "pressure":
      svgPath = `M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,14.4 19,16.5 17.3,18C15.9,16.7 14,16 12,16C10,16 8.2,16.7 6.7,18C5,16.5 4,14.4 4,12A8,8 0 0,1 12,4M14,5.89C13.62,5.9 13.26,6.15 13.1,6.54L11.81,9.77L11.71,10C11,10.13 10.41,10.6 10.14,11.26C9.73,12.29 10.23,13.45 11.26,13.86C12.29,14.27 13.45,13.77 13.86,12.74C14.12,12.08 14,11.32 13.57,10.76L13.67,10.5L14.96,7.29L14.97,7.26C15.17,6.75 14.92,6.17 14.41,5.96C14.28,5.91 14.15,5.89 14,5.89M10,6A1,1 0 0,0 9,7A1,1 0 0,0 10,8A1,1 0 0,0 11,7A1,1 0 0,0 10,6M7,9A1,1 0 0,0 6,10A1,1 0 0,0 7,11A1,1 0 0,0 8,10A1,1 0 0,0 7,9M17,9A1,1 0 0,0 16,10A1,1 0 0,0 17,11A1,1 0 0,0 18,10A1,1 0 0,0 17,9Z`;
      color = value > 50 ? "green" : "red";
	  break;	
	case "humidity":
      svgPath = `M12,3.25C12,3.25 6,10 6,14C6,17.32 8.69,20 12,20A6,6 0 0,0 18,14C18,10 12,3.25 12,3.25M14.47,9.97L15.53,11.03L9.53,17.03L8.47,15.97M9.75,10A1.25,1.25 0 0,1 11,11.25A1.25,1.25 0 0,1 9.75,12.5A1.25,1.25 0 0,1 8.5,11.25A1.25,1.25 0 0,1 9.75,10M14.25,14.5A1.25,1.25 0 0,1 15.5,15.75A1.25,1.25 0 0,1 14.25,17A1.25,1.25 0 0,1 13,15.75A1.25,1.25 0 0,1 14.25,14.5Z`;
      if (value < 20) {
        color = "red";
      } else if (value < 50) {
        color = "green";
      } else if (value < 80) {
        color = "green";
      } else {
        color = "blue";
      }	  
	  break;	
	case "battery":
      svgPath = `M15.07,12.25L14.17,13.17C13.63,13.71 13.25,14.18 13.09,15H11.05C11.16,14.1 11.56,13.28 12.17,12.67L13.41,11.41C13.78,11.05 14,10.55 14,10C14,8.89 13.1,8 12,8A2,2 0 0,0 10,10H8A4,4 0 0,1 12,6A4,4 0 0,1 16,10C16,10.88 15.64,11.68 15.07,12.25M13,19H11V17H13M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.66C6,21.4 6.6,22 7.33,22H16.67C17.4,22 18,21.4 18,20.66V5.33C18,4.59 17.4,4 16.67,4Z`;
      
	  if (value < 5) {
        color = "silver";
      } else if (value < 20) {
        color = "#ff6800";
      } else if (value < 50) {
      svgPath = `M16,15H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z`;        
		color = "gold";
      } else if (value < 80) {
      svgPath = `M16,12H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z`;        
		color = "green";
      } else {
      svgPath = `M16,8H8V6H16M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z`; 		  
        color = "#4caf50";
      }
	  
	  
	  
	  
	  break;
	case "temperature":
      svgPath = `M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z`;
      if (value < 0) {
        color = "blue";
      } else if (value < 25) {
        color = "lightblue";
      } else if (value < 30) {
        color = "orange";
      } else {
        color = "red";
      }
	  break;	  
    case "illuminance":
      svgPath = `M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,15.31L23.31,12L20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31Z`;
      break;	  
    case "level": 
	case "brightness":
      svgPath = `M12,18V6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,15.31L23.31,12L20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31Z`;
      break;	  
    case "gear":
      svgPath = `M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z`;
      break;
    case "toggle":
      svgPath = `M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13`;
      break;
    case "info":
      svgPath = `M7 8C6.44772 8 6 8.44772 6 9C6 9.55228 6.44772 10 7 10H17C17.5523 10 18 9.55228 18 9C18 8.44772 17.5523 8 17 8H7ZM7 11C6.44772 11 6 11.4477 6 12C6 12.5523 6.44772 13 7 13H13C13.5523 13 14 12.5523 14 12C14 11.4477 13.5523 11 13 11H7ZM6.93417 2C6.95604 2 6.97799 2 7 2L17.0658 2C17.9523 1.99995 18.7161 1.99991 19.3278 2.08215C19.9833 2.17028 20.6117 2.36902 21.1213 2.87868C21.631 3.38835 21.8297 4.0167 21.9179 4.67221C22.0001 5.28388 22.0001 6.0477 22 6.9342V13.0658C22.0001 13.9523 22.0001 14.7161 21.9179 15.3278C21.8297 15.9833 21.631 16.6117 21.1213 17.1213C20.6117 17.631 19.9833 17.8297 19.3278 17.9179C18.7161 18.0001 17.9523 18.0001 17.0658 18L15.0543 18L12.984 21.3124C12.5295 22.0396 11.4705 22.0396 11.016 21.3124L8.94576 18L6.9342 18C6.0477 18.0001 5.28388 18.0001 4.67221 17.9179C4.0167 17.8297 3.38835 17.631 2.87868 17.1213C2.36902 16.6117 2.17028 15.9833 2.08215 15.3278C1.99991 14.7161 1.99995 13.9523 2 13.0658L2 7C2 6.97799 2 6.95604 2 6.93417C1.99995 6.04769 1.99991 5.28387 2.08215 4.67221C2.17028 4.0167 2.36902 3.38835 2.87868 2.87868C3.38835 2.36902 4.0167 2.17028 4.67221 2.08215C5.28387 1.99991 6.04769 1.99995 6.93417 2Z`;
      break;
    case "current":
      svgPath = `M12.43 11C12.28 10.84 10 7 7 7S2.32 10.18 2 11V13H11.57C11.72 13.16 14 17 17 17S21.68 13.82 22 13V11H12.43M7 9C8.17 9 9.18 9.85 10 11H4.31C4.78 10.17 5.54 9 7 9M17 15C15.83 15 14.82 14.15 14 13H19.69C19.22 13.83 18.46 15 17 15Z`;
      break;
    case "voltage":
      svgPath = `M16.5,21C13.5,21 12.31,16.76 11.05,12.28C10.14,9.04 9,5 7.5,5C4.11,5 4,11.93 4,12H2C2,11.63 2.06,3 7.5,3C10.5,3 11.71,7.25 12.97,11.74C13.83,14.8 15,19 16.5,19C19.94,19 20.03,12.07 20.03,12H22.03C22.03,12.37 21.97,21 16.5,21Z`;
      break;
    case "energy":
      svgPath = `M11 15H6L13 1V9H18L11 23V15Z`;
      break;	  
    case "number":
      svgPath = `M2,11H9.17C9.58,9.83 10.69,9 12,9C13.31,9 14.42,9.83 14.83,11H22V13H14.83C14.42,14.17 13.31,15 12,15C10.69,15 9.58,14.17 9.17,13H2V11Z`;
      break;	  
    case "sun_temp":
      svgPath = `M10 2L7.6 5.4C8.4 5.2 9.2 5 10 5C10.8 5 11.6 5.2 12.4 5.4M19 5C17.89 5 17 5.89 17 7V13.76C16.36 14.33 16 15.15 16 16C16 17.66 17.34 19 19 19C20.66 19 22 17.66 22 16C22 15.15 21.64 14.33 21 13.77V7C21 5.89 20.11 5 19 5M19 6C19.55 6 20 6.45 20 7V8H18V7C18 6.45 18.45 6 19 6M5.5 6.7L1.3 7L3.1 10.8C3.2 10 3.5 9.2 3.9 8.5C4.4 7.8 4.9 7.2 5.5 6.7M10 7C7.2 7 5 9.2 5 12C5 14.8 7.2 17 10 17C12.8 17 15 14.8 15 12C15 9.2 12.8 7 10 7M3.2 13.2L1.4 17L5.5 17.4C5 16.9 4.4 16.2 4 15.5C3.5 14.8 3.3 14 3.2 13.2M7.6 18.6L10 22L12.4 18.6C11.6 18.8 10.8 19 10 19C9.1 19 8.3 18.8 7.6 18.6Z`;
      break;	  
	case "color":    
	case "palette":
      svgPath = `M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z`;
      break;	  
    case "light_bulb":
      svgPath = `M8 19H14V21H8V19M8 18V14H7V13H6V12H5V11H4V5H5V4H6V3H7V2H8V1H14V2L15 2V3H16V4H17V5H18V11H17V12H16V13H15V14H14V18H8M13 12H14V11H15V10H16V6H15V5H14V4L13 4V3H9V4H8V5H7V6H6V10H7V11H8V12H9V13H10V16H12V13H13V12Z`;
      break;	  
	  
    case "on_off":
      svgPath = `M18.4 1.6C18 1.2 17.5 1 17 1H7C6.5 1 6 1.2 5.6 1.6C5.2 2 5 2.5 5 3V21C5 21.5 5.2 22 5.6 22.4C6 22.8 6.5 23 7 23H17C17.5 23 18 22.8 18.4 22.4C18.8 22 19 21.5 19 21V3C19 2.5 18.8 2 18.4 1.6M16 7C16 7.6 15.6 8 15 8H9C8.4 8 8 7.6 8 7V5C8 4.4 8.4 4 9 4H15C15.6 4 16 4.4 16 5V7Z`;
      break;	
	case "speaker":
      svgPath = `M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z`;
      break;	
	  
    case "battery_charging":
      svgPath = `M11 20v-3H7v3h4zm5-14v3H18L13 13l-2-2 1.41-1.41L11 10.17V7H8L13 2l3 3-1.41 1.41L13 5.83V9h3z`;
      break;
    case "door":
      svgPath = `M15 19H9V5H3v14H1v2h2v1h16v-1h2v-2h-2zm-6-2h4v-3h-4v3zm0-4h4V8H9v5zm0-6h4V5H9v2zm-4 14v-5H5v5h4zm0-7v-5H5v5h4z`;
      break;
    case "light":
      svgPath = `M12 2C8.13 2 5 5.13 5 9c0 3.07 1.64 5.64 4 8.28V19h6v-1.72c2.36-2.64 4-5.21 4-8.28 0-3.87-3.13-7-7-7zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z`;
      break;
    case "moving":
      svgPath = `M13.5 5.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM9.8 8.9L7 23h2.1l1.1-5.5h2.6l1.1 5.5h2.1L14.2 8.9H9.8zM18 9l-1.7 1.7c2.1 2.1 2.1 5.6 0 7.7L18 18c2.9-2.9 2.9-7.7 0-10.6zM6 9L4.3 10.7c-2.1 2.1-2.1 5.6 0 7.7L6 18c-2.9-2.9-2.9-7.7 0-10.6z`;
      break;
    case "plug":
      svgPath = `M12 3c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 5c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z`;
      break;
    case "problem":
      svgPath = `M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2V7h2v7z`;
      break;
    case "smoke":
      svgPath = `M6 16c0 2.76 2.24 5 5 5s5-2.24 5-5-2.24-5-5-5-5 2.24-5 5zm8.5-3c0-1.93-1.57-3.5-3.5-3.5s-3.5 1.57-3.5 3.5 1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5zm2.5-3c0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5zm-7-2c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5z`;
      break;
    case "switch":
      svgPath = `M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8H7c-1.66 0-3-1.34-3-3s1.34-3 3-3h10c1.66 0 3 1.34 3 3s-1.34 3-3 3z`;
      break;
    case "sensor":
      svgPath = `M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z`;
      break;
    case "vibration":
      svgPath = `M18 12.36V14c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-1.64c0-.35.18-.68.49-.86l3.5-2.08c.64-.38 1.42-.38 2.06 0l3.5 2.08c.3.18.49.51.49.86zm-7.28-4.56c-.83-.5-1.93-.5-2.76 0L4.73 14.47c-.83.5 0 1.9.5 2.73l.77.77c.83.5 1.93.5 2.76 0l3.77-2.24c.83-.5 0-1.9-.5-2.73l-.77-.77zm10.56 0L19.27 14.47c.83.5 0 1.9-.5 2.73l-.77.77c-.83.5-1.93.5-2.76 0l-3.77-2.24c-.83-.5 0-1.9.5-2.73l.77-.77z`;
      break;
    case "window":
      svgPath = `M3 3v18h18V3H3zm16 16H5V5h14v14z`;
      break;

    case "fan":
      svgPath = `M12 11C10.9 11 10 11.9 10 13S10.9 15 12 15 14 14.1 14 13 13.1 11 12 11M12.5 2C11.7 2 11 2.7 11 3.5V7.05C8.5 7.55 6.5 9.47 5.96 12H2.5C1.7 12 1 12.7 1 13.5S1.7 15 2.5 15H5.96C6.5 17.53 8.5 19.45 11 19.95V22.5C11 23.3 11.7 24 12.5 24H13.5C14.3 24 15 23.3 15 22.5V19.95C17.5 19.45 19.5 17.53 20.04 15H22.5C23.3 15 24 14.3 24 13.5S23.3 12 22.5 12H20.04C19.5 9.47 17.5 7.55 15 7.05V3.5C15 2.7 14.3 2 13.5 2H12.5M13 9C15.2 9 17 10.8 17 13S15.2 17 13 17 9 15.2 9 13 10.8 9 13 9Z`;
      color = "lightblue";
      break;
    case "cover":
    case "curtain":
    case "shade":
    case "blind":
      svgPath = `M3 3V21H21V3H3M19 19H5V5H19V19M7 7V17H9V7H7M11 7V17H13V7H11M15 7V17H17V7H15Z`;
      break;
    case "awning":
    case "gate":
      svgPath = `M5 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3M5 5V19H19V5H5M7 7H17V9H7V7M7 11H17V13H7V11M7 15H17V17H7V15Z`;
      break;
    case "garage":
    case "garage_door":
      svgPath = `M12 3L2 8V9H22V8L12 3M2 10V21H22V10H2M4 12H20V19H4V12M5 13V18H11V13H5M13 13V18H19V13H13Z`;
      break;
    case "lock":
      svgPath = `M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8M12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17M15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z`;
      color = value == "locked" ? "#ff6b6b" : "#4caf50";
      break;
    case "climate":
    case "thermostat":
      svgPath = `M17 12H12.5V7H11.5V12H7L12 17L17 12M6 2H18C19.1 2 20 2.9 20 4V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2M6 4V8H18V4H6M6 20H18V10H6V20Z`;
      color = "#ff9800";
      break;
    case "alarm_control_panel":
      svgPath = `M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19H12V22C16.86 19.66 20 15 20 10.5C20 5.81 16.19 2 11.5 2M12.5 17H10.5V15H12.5V17M12.5 13H10.5C10.5 9.75 13.5 10 13.5 8C13.5 6.9 12.6 6 11.5 6S9.5 6.9 9.5 8H7.5C7.5 5.79 9.29 4 11.5 4S15.5 5.79 15.5 8C15.5 10.5 12.5 10.75 12.5 13Z`;
      color = "#e53935";
      break;

    default:
      svgPath =`M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z`; 
  }

   return `<svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 28 28" width="${size}" height="${size}"><path class="primary-path" fill="${color}" d="${svgPath}"></path></svg>`;
}






function widgetEvnt(id, val) {
	var cmd = id.split("|")[0]
	var obj = id.split("|")[1]
	var json = { "DEVICE_CMD": { "cmd": cmd, "obj": obj, "value": val } }
	WSsend(JSON.stringify(json))	
	console.log(json)
}

function cfgDev(IEEE) {
	if (IEEE && IEEE != '[object Object]') {
		if (typeof WinEngine !== 'undefined') { WinEngine.open('templateedit', { params: '1#' + IEEE }); }
	}
}
function redrawWidget(IEEE) {
	let w=getWidget(IEEE)
	
	
}
function getWidget(IEEE) {
	var dev
	if (typeof IEEE === 'string') { dev = deviceList.find(function (dev) { return dev.IEEE == IEEE }) } else { dev = IEEE }

	//function sortObjectByRole(obj) {const sortedEntries = Object.entries(obj).sort((a, b) => {const roleA = a[1].role;const roleB = b[1].role;return roleA.localeCompare(roleB);});return Object.//fromEntries(sortedEntries);}
//	dev.Report = sortObjectByRole(dev.Report);


	
	var tpl = `<div class="ac flex flex-c">`
	tpl += `<div class="device-name flex "><div></div>${dev.Name}<div onclick="cfgDev('${IEEE}')"    class="icon flex">${getIconSvg("gear")}</div></div>`

	var _speakerWidgetRendered = false

	for (let [key, value] of Object.entries(dev.Report)) {
		try {var device_class = dev.Report[key].class.device_class 
		} catch { 
		 try { var device_class = JSON.parse(dev.Report[key].role.split("&")[1]).device_class } catch { var device_class = "" }
		
		}
		//
		if (device_class == undefined) device_class = dev.Report[key].role.split("&")[0]
		
		
		var role = dev.Report[key].role.split("&")[0]
		try { var attr = JSON.parse(dev.Report[key].role.split("&")[1]) } catch { try{var attr = dev.Report[key].class }catch{var attr =null}}
		var id = dev.IEEE + "#" + key
		var idh = Date.now()
		var idw = idh + ""
		switch (role) {
			case 'light':
				if (dev.DevType === "DIS") {			
						var rval=( parseInt(value.parsed)===true)? 1:0
						var state = ( rval== 1) ? "checked" : ""
						tpl += `<div id="z${idw}"  style="margin-bottom: 25px; width: 65px; height: 65px; background:silver; border-radius: 54px; filter: brightness(100%); "><img class="bulbw" src='./static/icons/bulb.png'/></div>`

						tpl += `<div class="switch flex">`
						tpl += `<div class="icon flex">💡</div>`
						tpl += `<div class="plus flex" onclick="widgetEvnt('on_off|${id}',2)">Tog</div>`
						tpl += `<input type="checkbox" class="${id} input toggle-input" id="ac-toggle" ${state}
						 onclick="widgetEvnt('on_off|${id}',this.checked ? 1:0)" />`
						tpl += `<label for="ac-toggle"><div class="toggle-switch ${id}"><span></span></div></label>`
						
//						tpl += `<span class="${id} ${dev.IEEE+"#"+dev.IEEE+"_status"}" style="color:white;" >${value.parsed||0}</span>`
						tpl += `<span class="${id}" style="color:white;" ></span>`						
						tpl += `</div>`

						tpl += `<div class="switch flex">`
						tpl += `<div class="icon flex">🔆</div>`
						tpl += `<input class="${id} level" type="range" id="level|${id}" style="width: 66%;" 
					onchange="widgetEvnt(this.id,this.value)" '
					oninput="console.log(this.value);document.getElementById('z${idw}').style.webkitFilter = 'brightness(\'+this.value+\'%)';"
					min="0" max="100" value="${value.parsed||"?"}" step="2">`
						
//						tpl += `<span  "type="label" class="${id} ${dev.IEEE+"#"+dev.IEEE+"_level"}" style="color:white;" >${value.parsed||0}</span>`
						tpl += `<span  "type="label" class="${id}" style="color:white;" ></span>`
						
						tpl += `</div>`

						tpl += `<div class="switch flex">`
						tpl += `<div class="icon flex">❄️</div>`
						tpl += `<input class="${id} color-temp"  style="width: 66%;" type="range" id="colorT|${id}" onchange="widgetEvnt(this.id,this.value)"
					 oninput="var hue=Math.floor(50 + (170 - 50) * (this.value - 1) / (100 - 1)).toFixed(0);console.log(hue,hsl(hue),hsl2Hex(hue,100,50));
					document.getElementById('z${idw}').style.background='radial-gradient(circle 150px,\'+hsl2Hex(hue,100,50)+\', rgb(82, 89, 81))'"
					 min="0" max="100" value="${value.parsed||"?"}" step="2">`
						
//						tpl += `<span type="label" class="z${id} ${dev.IEEE+"#"+dev.IEEE+"_colorTemperature"} style="color:white;" >${value.parsed||0}</span>`
						tpl += `<span type="label" class="z${id}" style="color:white;" > </span>`
						
						tpl += `</div>`

						tpl += `<div class="switch flex">`
						tpl += `<div class="icon flex">🌈</div>`
						tpl += `<input class="color-range" type="range" min="0" max="100" value="75"
					oninput="var hue=((this.value/100)*360).toFixed(0);var el=document.getElementById('z${idw}');if(el){el.style.background='radial-gradient(circle 230px,'+hsl2Hex(hue,100,50)+', rgb(82,89,81))';el.style['box-shadow']=hsl2Hex(hue,100,50)+' 0px 1px 50px 8px'}"
					onchange="var hue=((this.value/100)*360).toFixed(0);widgetEvnt('color|${id}', hsl2Hex(hue,100,50))">`

//						tpl += `<span type="label" class="сz${id} сz${id}" style="color:white;" >${value.parsed||0}</span>`
						tpl += `<span type="label" class="сz${id} сz${id}" style="color:white;" > </span>`				
				
				}
				if (dev.DevType === "HAD") {
					var supportedFeatures = attr.supported_features
					const SUPPORT_BRIGHTNESS = 1;
					const SUPPORT_COLOR_TEMP = 2;
					const SUPPORT_EFFECT = 4;
					const SUPPORT_FLASH = 8;
					const SUPPORT_COLOR = 16;
					const SUPPORT_TRANSITION = 32;
					const SUPPORT_WHITE_VALUE = 128;

					if (supportedFeatures & SUPPORT_BRIGHTNESS) {
						console.log("Brightness is supported");
						// Действия для поддержки яркости
					}
					if (supportedFeatures & SUPPORT_COLOR_TEMP) {
						console.log("Color temperature is supported");
						// Действия для поддержки цветовой температуры
					}
					if (supportedFeatures & SUPPORT_EFFECT) {
						console.log("Effect is supported");
						// Действия для поддержки эффектов
					}
					if (supportedFeatures & SUPPORT_FLASH) {
						console.log("Flash is supported");
						// Действия для поддержки мигания
					}
					if (supportedFeatures & SUPPORT_COLOR) {
						console.log("Color is supported");
						// Действия для поддержки цвета
					}
					if (supportedFeatures & SUPPORT_TRANSITION) {
						console.log("Transition is supported");
						// Действия для поддержки переходов
					}
					if (supportedFeatures & SUPPORT_WHITE_VALUE) {
						console.log("White value is supported");
						// Действия для поддержки белого цвета
					}
//					if (value.label == "00158D0007503DF3_bulb") {
						var state = (parseInt(value.parsed) == 1) ? "checked" : ""
						tpl += `<div id="z${idw}"  style="margin-bottom: 25px; width: 65px; height: 65px; background:silver; border-radius: 54px; filter: brightness(100%); "><img class="bulbw" src='./static/icons/bulb.png'/></div>`

						tpl += `<div class="switch flex">`
						tpl += `<div class="icon flex">💡</div>`
						tpl += `<div class="plus flex" onclick="widgetEvnt('on_off|${id}',2)">Tog</div>`

						tpl += `<input type="checkbox" class="${id} input toggle-input" id="ac-toggle" ${state}
						 onclick="widgetEvnt('on_off|${id}',this.checked ? 1:0)" />`
						tpl += `<label for="ac-toggle"><div class="toggle-switch ${id}"><span></span></div></label>`
						tpl += `<span class="${id}" style="color:white;" >${value.parsed}</span>`
						tpl += `</div>`




						tpl += `<div class="switch flex">`
						tpl += `<div class="icon flex">🔆</div>`
						tpl += `<input class="${id} level" type="range" id="level|${id}" style="width: 66%;" 
					onchange="widgetEvnt(this.id,this.value)" '
					oninput="console.log(this.value);document.getElementById('z${idw}').style.webkitFilter = 'brightness(\'+this.value+\'%)';"
					min="0" max="100" value="${value.parsed}" step="2">`
						tpl += `<span  "type="label" class="${id}" style="color:white;" >${value.parsed}</span>`
						tpl += `</div>`

						tpl += `<div class="switch flex">`
						tpl += `<div class="icon flex">❄️</div>`
						tpl += `<input class="${id} color-temp"  style="width: 66%;" type="range" id="colorT|${id}" onchange="widgetEvnt(this.id,this.value)"
					 oninput="var hue=Math.floor(50 + (170 - 50) * (this.value - 1) / (100 - 1)).toFixed(0);console.log(hue,hsl(hue),hsl2Hex(hue,100,50));
					document.getElementById('z${idw}').style.background='radial-gradient(circle 150px,\'+hsl2Hex(hue,100,50)+\', rgb(82, 89, 81))'"
					 min="0" max="100" value="${value.parsed}" step="2">`
						tpl += `<span type="label" class="z${id}" style="color:white;" >${value.parsed}</span>`
						tpl += `</div>`

						tpl += `<div class="switch flex">`
						tpl += `<div class="icon flex">🌈</div>`
						tpl += `<input class="color-range" type="range" min="0" max="100" value="75"
					oninput="var hue=((this.value/100)*360).toFixed(0);var el=document.getElementById('z${idw}');if(el){el.style.background='radial-gradient(circle 230px,'+hsl2Hex(hue,100,50)+', rgb(82,89,81))';el.style['box-shadow']=hsl2Hex(hue,100,50)+' 0px 1px 50px 8px'}"
					onchange="var hue=((this.value/100)*360).toFixed(0);widgetEvnt('color|${id}', hsl2Hex(hue,100,50))">`

						tpl += `<span type="label" class="сz${id}" style="color:white;" >${value.parsed}</span>`
						tpl += `</div>`
//					}
					break
				}


				if (value.label == "On_Off") {
					var state = (parseInt(value.parsed) == 1) ? "checked" : ""
					tpl += `<div id="z${idw}" style="margin-bottom:25px;width:65px;height:65px;background:silver;border-radius:54px;filter:brightness(100%);"><img class="bulbw" src='./static/icons/bulb.png'/></div>`
					tpl += `<div class="switch flex">`
					tpl += `<div class="icon flex">${getIconSvg("light_bulb")}</div>`
					tpl += `<div class="plus flex" onclick="widgetEvnt('on_off|${id}',2)">Tog</div>`
					tpl += `<input type="checkbox" class="${id} input toggle-input" id="ac-toggle${id}" ${state}
						onclick="widgetEvnt('on_off|${id}',this.checked ? 1:0)" />`
					tpl += `<label for="ac-toggle${id}"><div class="toggle-switch ${id}"><span></span></div></label>`
					tpl += `<span class="${id}" style="color:white;">${value.parsed||"?"}</span>`
					tpl += `</div>`
					tpl += `<div>`
				}
				if (value.label == "Level") {
					var lvl = Math.round((parseFloat(value.parsed)||0)*100/255);
					tpl += `<div class="switch flex">`
					tpl += `<div class="icon flex">${getIconSvg("brightness")}</div>`
					tpl += `<input class="${id} level" type="range" id="level|${id}" style="width:66%;"
					onchange="widgetEvnt(this.id,this.value)"
					oninput="document.getElementById('z${idw}').style.webkitFilter='brightness('+this.value+'%)';"
					min="0" max="100" value="${lvl}" step="2">`
					tpl += `<span class="${id}" style="color:white;">${lvl}</span>`
					tpl += `</div>`
					tpl += `<div>`
				}
				if (value.label == "Color_Control" || value.label == "ColorT") {
					var ct = Math.round(((parseFloat(value.parsed)||153)-153)*100/347);
					tpl += `<div class="switch flex">`
					tpl += `<div class="icon flex">${getIconSvg("sun_temp")}</div>`
					tpl += `<input class="${id} color-temp" style="width:66%;" type="range" id="colorT|${id}"
					onchange="widgetEvnt(this.id,this.value)"
					oninput="var hue=Math.floor(50+(170-50)*(this.value-1)/(100-1));document.getElementById('z${idw}').style.background='radial-gradient(circle 150px,'+hsl2Hex(hue,100,50)+', rgb(82,89,81))'"
					min="0" max="100" value="${ct}" step="2">`
					tpl += `<span type="label" class="${id}" style="color:white;">${ct}</span>`
					tpl += `</div>`
					tpl += `<div>`
				}
				if (value.label == "Color") {
					tpl += `<div class="switch flex">`
					tpl += `<div class="icon flex">${getIconSvg("palette")}</div>`
					tpl += `<input class="color-range" type="range" min="0" max="100" value="75"
					oninput="var hue=((this.value/100)*360).toFixed(0);var el=document.getElementById('z${idw}');if(el){el.style.background='radial-gradient(circle 230px,'+hsl2Hex(hue,100,50)+', rgb(82,89,81))';el.style['box-shadow']=hsl2Hex(hue,100,50)+' 0px 1px 50px 8px'}"
					onchange="var hue=((this.value/100)*360).toFixed(0);widgetEvnt('color|${id}', hsl2Hex(hue,100,50))">`
					tpl += `<span type="label" class="${id}" style="color:white;font-size:10px;">${value.parsed||"?"}</span>`
					//tpl += `<span type="label" class="" style="color:white;"> . </span>`					
					tpl += `</div>`
					tpl += `<div>`
				}

				break;
			case "switch":
			let states = {"on": [1,"1", true, "on", "вкл"],"off": [0,"0", false, "off", "выкл"]};
			let stateValue = Object.entries(states).find(([key, values]) => values.includes(value.parsed))?.[0];
			    state = stateValue === "on" ? "checked" : "";
									
				tpl += `<div class="switch flex">`
				tpl += `<div class="icon flex">${getIconSvg(device_class)}</div>`;
				tpl += `<div class="labelObj">${value.label}</div>
						 <input type="checkbox" class="${id} input toggle-input" id="ac-toggle${id}"${state} 
						 onclick="widgetEvnt('on_off|${id}',this.checked ? 1:0)"/>
						  <label for="ac-toggle${id}"><div class="toggle-switch ${dev.IEEE + "#" + key}"><span></span></div></label>`

				break;
			case "button":
				tpl += `<div class="switch flex">`
				tpl += `<div class="icon flex">${getIconSvg(device_class)}</div>`; 
				tpl += `<div class="labelObj">${value.label}</div>`
				
				tpl += `<input type="button" class="${id} button-input" id="btn-toggle${id}" 
							onclick="widgetEvnt('button_press|${id}', 1)" />`
				break;			
            case 'select':
                tpl += `<div class="switch flex">`;
                tpl += `<div class="icon flex">${getIconSvg(device_class)}</div>`;
				tpl += `<div class="labelObj">${value.label}</div>`			   
                tpl += `<select id="${id}" class="select ${dev.IEEE + "#" + key}" onchange="widgetEvnt('select|${id}', this.value)" style="width: 150px;">`;

                var opts = [];
                if (attr && attr.options != null) {
                    if (Array.isArray(attr.options)) {
                        opts = attr.options;
                    } else if (typeof attr.options === 'object' && !Array.isArray(attr.options)) {
                        opts = Object.values(attr.options);
                    } else {
                        opts = String(attr.options).split(',').map(function(s){ return s.trim(); });
                    }
                }
                opts.forEach(option => {
                    var selected = (option === value.parsed) ? "selected" : "";
                    tpl += `<option value="${option}" ${selected}>${option}</option>`;
                });
                tpl += `</select>`;
                break;	
            case 'number':
					tpl += `<div class="switch flex">`
					tpl += `<div class="icon flex">${getIconSvg(device_class)}</div>`;
					tpl += `<div class="labelObj">${value.label}</div>`
					tpl += `<input class="${id} level" type="range" id="number|${id}" style="width: 66%;" 
					onchange="widgetEvnt(this.id,this.value)" '
					oninput="console.log(this.value);document.getElementById('z${idw}').style.webkitFilter = 'brightness(\'${this.value}\'%)';"
					min="0" max="100" value="${value.parsed}" step="2">`
					tpl += `<span  "type="label" class="${id}" style="color:white;" >${value.parsed||"?"}</span>`

                break;

            case 'range': {
                const rMin  = (attr && attr.min  != null) ? Number(attr.min)  : 0;
                const rMax  = (attr && attr.max  != null) ? Number(attr.max)  : 100;
                const rStep = (attr && attr.precision != null) ? Number(attr.precision) : 1;
                const rVal  = value.parsed || 0;
                tpl += `<div class="switch flex">`;
                tpl += `<div class="icon flex">${getIconSvg(device_class)}</div>`;
                tpl += `<div class="labelObj">${value.label}</div>`;
                tpl += `<input class="${id} level" type="range" id="level|${id}" style="width:55%;margin:0 6px;"
                    min="${rMin}" max="${rMax}" step="${rStep}" value="${rVal}"
                    onchange="widgetEvnt(this.id,this.value)"
                    oninput="document.getElementById('rng_${idw}').textContent=this.value">`;
                tpl += `<span id="rng_${idw}" style="color:#ff9800;font-size:14px;min-width:36px;text-align:right;">${rVal}</span>`;
                tpl += `</div>`;
                break;
            }

			case 'climate': {
				const sysKey = Object.keys(dev.Report || {}).find(k => /^01\d{4}001C$/.test(k));
				const isThermostat = !!sysKey;
				let curTemp   = value.parsed || '—';
				let setTemp   = (attr && attr.target_temp != null) ? attr.target_temp : (value.set_temp || '—');
				let hvacMode  = (attr && attr.hvac_mode) ? attr.hvac_mode : (value.mode || 'off');
				let hvacModes = (attr && attr.modes) ? (Array.isArray(attr.modes) ? attr.modes : String(attr.modes).split(',').map(function(s){ return s.trim(); })) : ['off','auto','heat','cool','fan_only','dry'];
				const minTemp   = (attr && attr.min_temp) ? Number(attr.min_temp) : 5;
				const maxTemp   = (attr && attr.max_temp) ? Number(attr.max_temp) : 35;
				const tempStep  = (attr && attr.temp_step) ? Number(attr.temp_step) : 0.5;

				// Термостат: режим из SystemMode (001C), темп/уставка из 0000/0012
				if (isThermostat) {
					const sysMap = {0:'off', 1:'auto', 3:'cool', 4:'heat', 7:'fan_only', 8:'dry'};
					const sysVal = parseInt(dev.Report[sysKey].parsed, 10);
					if (sysMap[sysVal]) hvacMode = sysMap[sysVal];
					const curKey = Object.keys(dev.Report).find(k => /^01\d{4}0000$/.test(k));
					const setKey = Object.keys(dev.Report).find(k => /^01\d{4}0012$/.test(k));
					if (curKey && dev.Report[curKey].parsed !== undefined) curTemp = dev.Report[curKey].parsed;
					if (setKey && dev.Report[setKey].parsed !== undefined) setTemp = dev.Report[setKey].parsed;
					try {
						const caps = (dev.Report[sysKey].ya_rep && dev.Report[sysKey].ya_rep.capabilities) || [];
						const mc = caps.find(c => c.parameters && c.parameters.modes);
						if (mc) hvacModes = mc.parameters.modes;
					} catch {}
				}

				const modeColors = {heat:'#ff7043', cool:'#42a5f5', auto:'#ab47bc', 'fan_only':'#29b6f6', dry:'#ffca28', off:'#616161'};
				const modeIcons  = {heat:'🔥', cool:'❄️', auto:'♻️', 'fan_only':'💨', dry:'💧', off:'⏸'};
				const modeColor  = modeColors[hvacMode] || '#888';

				// Текущая температура
				tpl += `<div class="switch flex" style="margin-bottom:4px;">`;
				tpl += `<div class="icon flex">${getIconSvg('climate', 28, modeColor)}</div>`;
				tpl += `<div class="labelObj">${value.label}</div>`;
				tpl += `<span class="${id}" style="color:${modeColor};font-size:18px;font-weight:bold;">${curTemp}°</span>`;
				tpl += `</div>`;

				// Кнопки режимов
				tpl += `<div class="switch flex" style="gap:2px;flex-wrap:wrap;justify-content:center;margin-bottom:4px;">`;
				hvacModes.forEach(mode => {
					const active = mode === hvacMode;
					const bg = active ? (modeColors[mode]||'#888') : '#444';
					tpl += `<span onclick="widgetEvnt('climate_mode|${id}','${mode}')"
						style="cursor:pointer;border-radius:10px;padding:2px 7px;font-size:11px;color:#fff;background:${bg};border:${active?'2px':'1px'} solid ${modeColors[mode]||'#888'};">
						${modeIcons[mode]||''}${mode}</span>`;
				});
				tpl += `</div>`;

				// Слайдер целевой температуры
				tpl += `<div class="switch flex" style="margin-bottom:2px;">`;
				tpl += `<span style="color:#aaa;font-size:12px;">🎯</span>`;
				tpl += `<input class="${id} level" type="range" style="width:60%;margin:0 6px;"
					id="climate_temp|${id}"
					min="${minTemp}" max="${maxTemp}" step="${tempStep}" value="${setTemp!=='—'?setTemp:20}"
					onchange="widgetEvnt(this.id,this.value)"
					oninput="document.getElementById('clt_${idw}').textContent=this.value+'°'">`;
				tpl += `<span id="clt_${idw}" style="color:#ff9800;font-size:14px;min-width:36px;text-align:right;">${setTemp!=='—'?setTemp:'20'}°</span>`;
				tpl += `</div>`;

				// Пустой div — будет закрыт общим </div> после switch
				tpl += `<div>`;
				break;
			}

			case 'cover': {
				const pos     = parseInt(value.parsed) || 0;
				const isOpen  = pos > 0;
				const coverDC = device_class || 'curtain';
				tpl += `<div class="switch flex">`;
				tpl += `<div class="icon flex">${getIconSvg(coverDC, 28, isOpen ? '#90caf9' : '#607d8b')}</div>`;
				tpl += `<div class="labelObj">${value.label}</div>`;
				tpl += `<span class="${id}" style="color:#90caf9;">${pos}%</span>`;
				tpl += `</div>`;
				tpl += `<div class="switch flex" style="gap:4px;justify-content:center;">`;
				tpl += `<span class="plus flex" onclick="widgetEvnt('cover_open|${id}',1)"  style="font-size:13px;padding:0 8px;">▲</span>`;
				tpl += `<span class="plus flex" onclick="widgetEvnt('cover_stop|${id}',1)"  style="font-size:13px;padding:0 8px;">⏹</span>`;
				tpl += `<span class="plus flex" onclick="widgetEvnt('cover_close|${id}',0)" style="font-size:13px;padding:0 8px;">▼</span>`;
				tpl += `</div>`;
				tpl += `<div class="switch flex">`;
				tpl += `<span style="color:#aaa;font-size:12px;margin-right:4px;">🎚</span>`;
				tpl += `<input class="${id} level" type="range" style="width:70%;"
					id="cover_pos|${id}" min="0" max="100" value="${pos}"
					onchange="widgetEvnt(this.id,this.value)"
					oninput="document.querySelector('.${CSS.escape(id)}.cover-pos-val').textContent=this.value+'%'">`;
				tpl += `<span class="${id} cover-pos-val" style="color:#90caf9;min-width:30px;text-align:right;">${pos}%</span>`;
				tpl += `</div>`;
				tpl += `<div>`;
				break;
			}

			case 'fan': {
				const fanOn    = [1,'1',true,'on','ON'].includes(value.parsed);
				const fanState = fanOn ? 'checked' : '';
				const speed    = (attr && value.speed != null) ? value.speed : 0;
				tpl += `<div class="switch flex">`;
				tpl += `<div class="icon flex" style="animation:${fanOn?'fanSpin 1.5s linear infinite':'none'}">${getIconSvg('fan', 28, fanOn ? '#29b6f6' : '#607d8b')}</div>`;
				tpl += `<div class="labelObj">${value.label}</div>`;
				tpl += `<input type="checkbox" class="${id} input toggle-input" id="fan-toggle${id}" ${fanState}
					onclick="widgetEvnt('on_off|${id}',this.checked?1:0)"/>`;
				tpl += `<label for="fan-toggle${id}"><div class="toggle-switch ${id}"><span></span></div></label>`;
				tpl += `</div>`;
				tpl += `<div class="switch flex">`;
				tpl += `<span style="color:#aaa;font-size:12px;">💨</span>`;
				tpl += `<input class="${id} level" type="range" style="width:66%;margin:0 4px;"
					id="fan_speed|${id}" min="0" max="100" step="10" value="${speed}"
					onchange="widgetEvnt(this.id,this.value)">`;
				tpl += `<span class="${id}" style="color:#29b6f6;">${speed}%</span>`;
				tpl += `</div>`;
				tpl += `<div>`;
				break;
			}

			case 'lock': {
				const isLocked = ['locked','1',1,true].includes(value.parsed);
				const lockIcon = isLocked ? '🔒' : '🔓';
				const lockColor = isLocked ? '#ef5350' : '#66bb6a';
				tpl += `<div class="switch flex">`;
				tpl += `<div class="icon flex">${getIconSvg('lock', 28, lockColor, value.parsed)}</div>`;
				tpl += `<div class="labelObj">${value.label}</div>`;
				tpl += `<span onclick="widgetEvnt('lock_toggle|${id}',isLocked?'unlock':'lock')"
					style="cursor:pointer;font-size:22px;color:${lockColor};">${lockIcon}</span>`;
				tpl += `</div>`;
				break;
			}

			case 'alarm_control_panel': {
				const alarmState = value.parsed || 'disarmed';
				const alarmColors = {disarmed:'#66bb6a', armed_home:'#ff9800', armed_away:'#ef5350', triggered:'#e53935', arming:'#ffca28'};
				const alarmLabels = {disarmed:'Снято', armed_home:'Дома', armed_away:'Вне дома', triggered:'⚠️ ТРЕВОГА', arming:'Взводится...'};
				const aColor = alarmColors[alarmState] || '#888';
				tpl += `<div class="switch flex">`;
				tpl += `<div class="icon flex">${getIconSvg('alarm_control_panel', 28, aColor)}</div>`;
				tpl += `<div class="labelObj">${value.label}</div>`;
				tpl += `<span style="color:${aColor};font-weight:bold;font-size:13px;">${alarmLabels[alarmState]||alarmState}</span>`;
				tpl += `</div>`;
				tpl += `<div class="switch flex" style="gap:4px;justify-content:center;">`;
				[['disarm','Снять','#66bb6a'],['arm_home','Дома','#ff9800'],['arm_away','Уйти','#ef5350']].forEach(([cmd,label,bg])=>{
					tpl += `<span onclick="widgetEvnt('alarm|${id}','${cmd}')"
						style="cursor:pointer;border-radius:8px;padding:2px 8px;font-size:11px;color:#fff;background:${bg};">${label}</span>`;
				});
				tpl += `</div>`;
				tpl += `<div>`;
				break;
			}

			case 'speaker': {
				if (!_speakerWidgetRendered) {
					_speakerWidgetRendered = true;
					const rp = dev.Report || {};
					const spState = (rp.playing ? (rp.playing.parsed || '').toString() : 'idle');
					const isPlaying = spState === 'playing' || spState === '1';
					let raw = rp.volume ? rp.volume.parsed : '';
					let vol = raw !== '' ? parseInt(raw) : null;
					if (vol === null || isNaN(vol)) vol = null;
					const ieee = dev.IEEE;
					const pid = ieee + '#playing';
					const vid = ieee + '#volume';
					const track = rp.track ? rp.track.parsed || '—' : '—';
					const state = rp.state ? rp.state.parsed || '—' : '—';
					tpl += `<div class="switch flex" style="margin-bottom:4px;">`;
					tpl += `<div class="icon flex" style="animation:${isPlaying?'fanSpin 2s linear infinite':'none'}">🎵</div>`;
					tpl += `<marquee style="flex:1;min-width:0;color:#fff;" scrollamount="3" onmouseover="this.stop()" onmouseout="this.start()">${track}</marquee>`;
					tpl += `<span class="plus flex" onclick="widgetEvnt('play|${pid}',1)" style="padding:4px 10px;border-radius:8px;border:1px solid #4caf50;background:#1a3a1a;cursor:pointer;font-size:16px;transition:background .15s;" onmouseenter="this.style.background='#2a5a2a'" onmouseleave="this.style.background='#1a3a1a'">▶️</span>`;
					tpl += `</div>`;
					tpl += `<div class="switch flex" style="gap:4px;justify-content:center;margin-bottom:4px;">`;
					tpl += `<span class="plus flex" onclick="widgetEvnt('prev|${pid}',1)" style="padding:4px 10px;border-radius:8px;border:1px solid #555;background:#2a2a35;cursor:pointer;font-size:14px;transition:background .15s;" onmouseenter="this.style.background='#3a3a48'" onmouseleave="this.style.background='#2a2a35'">⏮</span>`;
					tpl += `<span class="plus flex" onclick="widgetEvnt('stop|${pid}',1)" style="padding:4px 10px;border-radius:8px;border:1px solid #555;background:#2a2a35;cursor:pointer;font-size:14px;transition:background .15s;" onmouseenter="this.style.background='#3a3a48'" onmouseleave="this.style.background='#2a2a35'">⏹</span>`;
					tpl += `<span class="plus flex" onclick="widgetEvnt('next|${pid}',1)" style="padding:4px 10px;border-radius:8px;border:1px solid #555;background:#2a2a35;cursor:pointer;font-size:14px;transition:background .15s;" onmouseenter="this.style.background='#3a3a48'" onmouseleave="this.style.background='#2a2a35'">⏭</span>`;
					tpl += `</div>`;
					tpl += `<div class="switch flex">`;
					tpl += `<span style="color:#aaa;font-size:12px;">🔊</span>`;
					const volDisplay = vol !== null ? vol : '—';
					const volValue = vol !== null ? vol : 0;
					tpl += `<input class="${vid} level" type="range" style="width:60%;margin:0 4px;" id="volume|${vid}" min="0" max="100" value="${volValue}" onchange="widgetEvnt(this.id,this.value)">`;
					tpl += `<span class="${vid}" style="color:#29b6f6;min-width:30px;">${volDisplay}${vol !== null ? '%' : ''}</span>`;
					tpl += `</div>`;
					tpl += `<div class="switch flex" style="gap:2px;">`;
					tpl += `<span style="color:#aaa;font-size:12px;">💬</span>`;
					tpl += `<input class="${ieee} tts-input" type="text" id="tts|${ieee}#tts" style="flex:1;min-width:0;padding:2px 6px;border-radius:4px;border:1px solid #444;background:#222;color:#fff;font-size:11px;" placeholder="Скажи..." onkeydown="if(event.key==='Enter')widgetEvnt('tts|${ieee}#tts',this.value)">`;
					tpl += `<span class="plus flex" onclick="var inp=this.parentElement.querySelector('.tts-input');widgetEvnt('tts|${ieee}#tts',inp.value)" style="font-size:14px;">➡️</span>`;
					tpl += `</div>`;
					tpl += `<div class="switch flex" style="margin-top:4px;font-size:11px;color:#7a86a8;gap:12px;">`;
					tpl += `<span class="${ieee}#state">${state}</span>`;
					tpl += `</div>`;
				}
				break;
			}

			default:
				var state = parseInt(value.parsed)
				
				tpl += `<div class="switch flex">`
				tpl += `<div class="icon flex">${getIconSvg(device_class,28,"silver",state)}</div>`;
				tpl += `<div class="labelObj">${value.label}</div>`
				tpl += `<span class="${id}" style="color:white;">${value.parsed || "?"}</span>`
		}
		tpl += `</div>`
	}
	tpl += `</div>`
	return tpl
}


//https://codepen.io/rogie/pen/dqwJaE
function hsl(hue) { return "hsl(" + hue + ", 100%, 50%)" }
function bgHsl(hue) { return "hsl(" + hue + ", 100%, 95%)" }

function hsl2Rgb(h, s, l) {
	s = s / 100;
	l = l / 100;
	var c, x, m, rgb;
	c = (1 - Math.abs(2 * l - 1)) * s;
	x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	m = l - c / 2;
	if (h >= 0 && h < 60) rgb = [c, x, 0];
	if (h >= 60 && h < 120) rgb = [x, c, 0];
	if (h >= 120 && h < 180) rgb = [0, c, x];
	if (h >= 180 && h < 240) rgb = [0, x, c];
	if (h >= 240 && h < 300) rgb = [x, 0, c];
	if (h >= 300 && h <= 360) rgb = [c, 0, x];

	return rgb.map(function (v) {
		return 255 * (v + m) | 0;
	});
}

function rgb2Hex(r, g, b) {
	var rgb = b | (g << 8) | (r << 16);
	return '#' + (0x1000000 + rgb).toString(16).slice(1)
}

function hsl2Hex(h, s, l) {
	var rgb = hsl2Rgb(h, s, l)
	return rgb2Hex(rgb[0], rgb[1], rgb[2])
}

// ═══════════════════════════════════════════════════════════════════
//  Яндекс типы устройств — иконки, реестр, палитра выбора
// ═══════════════════════════════════════════════════════════════════

const DEVICE_SVG_PATHS = {
  "devices.types.light": `<circle cx="20" cy="17" r="8" fill="currentColor" opacity="0.85"/><path d="M16 25h8l-1 4a1 1 0 01-1 1h-4a1 1 0 01-1-1l-1-4z" fill="currentColor" opacity="0.6"/><line x1="20" y1="5" x2="20" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="7" y1="17" x2="10" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="30" y1="17" x2="33" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10.5" y1="7.5" x2="12.6" y2="9.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="29.5" y1="7.5" x2="27.4" y2="9.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  "devices.types.light.lamp": `<ellipse cx="20" cy="16" rx="7" ry="9" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.15"/><path d="M16 25h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 28h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="31" x2="20" y2="34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  "devices.types.light.ceiling": `<rect x="8" y="7" width="24" height="4" rx="2" fill="currentColor" opacity="0.7"/><path d="M12 11 Q14 22 20 24 Q26 22 28 11Z" fill="currentColor" opacity="0.3" stroke="currentColor" stroke-width="1.5"/><ellipse cx="20" cy="24" rx="6" ry="2.5" fill="currentColor" opacity="0.6"/><path d="M10 28 Q20 32 30 28" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4" fill="none"/>`,
  "devices.types.light.strip": `<rect x="5" y="16" width="30" height="8" rx="4" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><circle cx="11" cy="20" r="2" fill="currentColor"/><circle cx="17" cy="20" r="2" fill="currentColor"/><circle cx="23" cy="20" r="2" fill="currentColor"/><circle cx="29" cy="20" r="2" fill="currentColor"/><path d="M5 26 Q20 32 35 26" stroke="currentColor" stroke-width="1" fill="none" opacity="0.3" stroke-linecap="round"/>`,
  "devices.types.sensor": `<circle cx="20" cy="20" r="5" fill="currentColor"/><circle cx="20" cy="20" r="9" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.5"/><circle cx="20" cy="20" r="13" stroke="currentColor" stroke-width="1" fill="none" opacity="0.25"/>`,
  "devices.types.sensor.button": `<circle cx="20" cy="20" r="12" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/><circle cx="20" cy="20" r="7" fill="currentColor" opacity="0.4"/><circle cx="20" cy="20" r="3" fill="currentColor"/>`,
  "devices.types.sensor.climate": `<path d="M20 8v24M14 26l6 6 6-6M8 20h24M14 14l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  "devices.types.sensor.gas": `<path d="M20 32 Q12 24 12 18 Q12 10 20 10 Q28 10 28 18 Q28 24 20 32Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.15"/><text x="20" y="23" text-anchor="middle" fill="currentColor" font-size="10" font-weight="bold" font-family="sans-serif">GAS</text>`,
  "devices.types.sensor.illumination": `<circle cx="20" cy="20" r="5" fill="currentColor"/><line x1="20" y1="8" x2="20" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="29" x2="20" y2="32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="20" x2="11" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="29" y1="20" x2="32" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="11.5" y1="11.5" x2="13.6" y2="13.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="26.4" y1="26.4" x2="28.5" y2="28.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="28.5" y1="11.5" x2="26.4" y2="13.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="13.6" y1="26.4" x2="11.5" y2="28.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  "devices.types.sensor.motion": `<circle cx="20" cy="14" r="4" stroke="currentColor" stroke-width="2"/><path d="M16 20 Q14 28 16 34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M24 20 Q26 28 24 34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 22 Q20 25 24 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M28 18 Q33 18 33 23 Q33 28 28 28" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5"/><path d="M30 15 Q37 15 37 23 Q37 31 30 31" stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.25"/>`,
  "devices.types.sensor.open": `<rect x="7" y="10" width="11" height="20" rx="2" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/><rect x="22" y="10" width="11" height="20" rx="2" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/><path d="M18 20 h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 2"/><circle cx="18" cy="20" r="2" fill="currentColor"/><circle cx="22" cy="20" r="2" fill="currentColor" opacity="0.4"/>`,
  "devices.types.sensor.smoke": `<path d="M20 28 Q18 22 20 18 Q22 14 20 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M26 30 Q24 24 26 20 Q28 16 26 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/><path d="M14 30 Q12 24 14 20 Q16 16 14 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/><rect x="8" y="30" width="24" height="4" rx="2" fill="currentColor" opacity="0.4"/>`,
  "devices.types.sensor.vibration": `<path d="M6 20 Q8 14 10 20 Q12 26 14 20 Q16 14 18 20 Q20 26 22 20 Q24 14 26 20 Q28 26 30 20 Q32 14 34 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,
  "devices.types.sensor.water_leak": `<path d="M20 6 Q13 17 13 22 Q13 31 20 31 Q27 31 27 22 Q27 17 20 6Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.15"/><path d="M15 22 Q16 28 20 28" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.6"/><path d="M8 36 Q14 33 20 36 Q26 39 32 36" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>`,
  "devices.types.smart_meter": `<rect x="7" y="10" width="26" height="20" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/><path d="M14 20 Q17 14 20 20 Q23 26 26 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><line x1="7" y1="25" x2="33" y2="25" stroke="currentColor" stroke-width="1" opacity="0.3"/>`,
  "devices.types.smart_meter.cold_water": `<path d="M20 6 Q13 17 13 22 Q13 31 20 31 Q27 31 27 22 Q27 17 20 6Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><text x="20" y="25" text-anchor="middle" fill="currentColor" font-size="12" font-weight="bold" font-family="sans-serif">C</text>`,
  "devices.types.smart_meter.electricity": `<path d="M22 6 L13 22 H20 L18 34 L27 18 H20 L22 6Z" fill="currentColor" opacity="0.8"/>`,
  "devices.types.smart_meter.gas": `<rect x="9" y="12" width="22" height="18" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/><path d="M15 22 Q17 16 20 22 Q23 28 25 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M16 9 Q18 6 20 9 Q22 12 24 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5"/>`,
  "devices.types.smart_meter.heat": `<rect x="9" y="12" width="22" height="18" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/><path d="M14 22 Q16 16 18 22 Q20 28 22 22 Q24 16 26 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  "devices.types.smart_meter.hot_water": `<path d="M20 6 Q13 17 13 22 Q13 31 20 31 Q27 31 27 22 Q27 17 20 6Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><text x="20" y="25" text-anchor="middle" fill="currentColor" font-size="12" font-weight="bold" font-family="sans-serif">H</text>`,
  "devices.types.media_device": `<rect x="5" y="10" width="30" height="18" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><path d="M16 28 L13 34M24 28 L27 34M13 34 L27 34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 19 L24 14.5 L24 23.5 Z" fill="currentColor"/>`,
  "devices.types.media_device.receiver": `<rect x="5" y="14" width="30" height="14" rx="2" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><circle cx="30" cy="21" r="3" stroke="currentColor" stroke-width="1.5"/><line x1="9" y1="19" x2="22" y2="19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/><line x1="9" y1="23" x2="18" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>`,
  "devices.types.media_device.tv": `<rect x="4" y="8" width="32" height="22" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><line x1="15" y1="30" x2="13" y2="35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="25" y1="30" x2="27" y2="35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="13" y1="35" x2="27" y2="35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="8" y="12" width="24" height="14" rx="1" fill="currentColor" opacity="0.2"/>`,
  "devices.types.media_device.tv_box": `<rect x="7" y="16" width="26" height="12" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><line x1="20" y1="28" x2="20" y2="34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="34" x2="26" y2="34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="28" cy="22" r="2" fill="currentColor" opacity="0.6"/><line x1="10" y1="22" x2="20" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>`,
  "devices.types.cooking": `<path d="M10 28 Q10 16 20 16 Q30 16 30 28" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12" stroke-linecap="round"/><line x1="8" y1="28" x2="32" y2="28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 16 Q15 10 20 8 Q25 10 25 16" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5"/>`,
  "devices.types.cooking.coffee_maker": `<rect x="10" y="8" width="16" height="22" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><path d="M26 14 Q32 14 32 20 Q32 26 26 26" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="13" y="30" width="10" height="5" rx="1.5" fill="currentColor" opacity="0.5"/><circle cx="18" cy="18" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="18" cy="18" r="1.5" fill="currentColor" opacity="0.6"/>`,
  "devices.types.cooking.kettle": `<path d="M11 14 Q11 32 22 32 Q33 32 33 20 Q33 14 27 12 L11 12 Q9 12 9 18 Q9 22 11 22 Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><path d="M27 12 Q32 10 34 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><line x1="14" y1="8" x2="14" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="7" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  "devices.types.cooking.multicooker": `<ellipse cx="20" cy="24" rx="13" ry="9" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><path d="M7 22 Q20 16 33 22" stroke="currentColor" stroke-width="2" fill="none"/><ellipse cx="20" cy="22" rx="13" ry="4" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.2"/><line x1="20" y1="13" x2="20" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="7" r="2" fill="currentColor" opacity="0.5"/>`,
  "devices.types.dishwasher": `<rect x="8" y="6" width="24" height="30" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/><circle cx="20" cy="22" r="8" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.6"/><circle cx="20" cy="22" r="3" fill="currentColor" opacity="0.4"/><line x1="20" y1="14" x2="20" y2="30" stroke="currentColor" stroke-width="1" opacity="0.3"/><line x1="12" y1="22" x2="28" y2="22" stroke="currentColor" stroke-width="1" opacity="0.3"/><rect x="11" y="9" width="18" height="4" rx="1" fill="currentColor" opacity="0.3"/>`,
  "devices.types.cooking.oven": `<rect x="6" y="8" width="28" height="26" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/><rect x="10" y="14" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.6"/><circle cx="13" cy="11" r="2" fill="currentColor" opacity="0.5"/><circle cx="20" cy="11" r="2" fill="currentColor" opacity="0.5"/><circle cx="27" cy="11" r="2" fill="currentColor" opacity="0.5"/>`,
  "devices.types.cooking.refrigerator": `<rect x="10" y="5" width="20" height="32" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/><line x1="10" y1="18" x2="30" y2="18" stroke="currentColor" stroke-width="1.5"/><line x1="17" y1="11" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="17" y1="22" x2="17" y2="30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  "devices.types.iron": `<path d="M8 26 L8 20 Q8 14 20 14 L34 14 L34 20 Q34 26 28 26 Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.15"/><line x1="8" y1="26" x2="34" y2="26" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 18 Q20 17 24 18" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.5"/>`,
  "devices.types.vacuum_cleaner": `<circle cx="18" cy="18" r="10" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/><circle cx="18" cy="18" r="4" fill="currentColor" opacity="0.4"/><path d="M26 26 L34 34" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="18" cy="18" r="1.5" fill="currentColor"/>`,
  "devices.types.washing_machine": `<rect x="7" y="6" width="26" height="30" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/><circle cx="20" cy="23" r="8" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="23" r="4" stroke="currentColor" stroke-width="1" opacity="0.5"/><circle cx="13" cy="11" r="2" fill="currentColor" opacity="0.5"/><circle cx="20" cy="11" r="2" fill="currentColor" opacity="0.4"/>`,
  "devices.types.pet_drinking_fountain": `<path d="M15 10 Q15 6 20 6 Q25 6 25 10 L27 28 Q27 33 20 33 Q13 33 13 28 Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><path d="M17 16 Q20 20 23 16" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.6"/><path d="M18 22 Q20 25 22 22" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.4"/>`,
  "devices.types.pet_feeder": `<path d="M12 16 L14 10 L26 10 L28 16 Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.2" stroke-linejoin="round"/><path d="M10 28 Q10 18 20 18 Q30 18 30 28 Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><line x1="8" y1="28" x2="32" y2="28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  "devices.types.air_conditioner": `<rect x="5" y="12" width="30" height="12" rx="4" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><line x1="10" y1="24" x2="8" y2="32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="24" x2="20" y2="32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="30" y1="24" x2="32" y2="32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="18" x2="31" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>`,
  "devices.types.air_purifier": `<rect x="12" y="6" width="16" height="28" rx="8" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.4"/><path d="M16 12 Q20 10 24 12" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5"/><path d="M16 28 Q20 30 24 28" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5"/>`,
  "devices.types.fan": `<circle cx="20" cy="20" r="3" fill="currentColor"/><path d="M20 17 Q20 10 25 8 Q30 6 28 12 Q26 17 20 17Z" fill="currentColor" opacity="0.6"/><path d="M23 20 Q30 20 32 25 Q34 30 28 28 Q23 26 23 20Z" fill="currentColor" opacity="0.6"/><path d="M20 23 Q20 30 15 32 Q10 34 12 28 Q14 23 20 23Z" fill="currentColor" opacity="0.6"/><path d="M17 20 Q10 20 8 15 Q6 10 12 12 Q17 14 17 20Z" fill="currentColor" opacity="0.6"/>`,
  "devices.types.heater": `<rect x="7" y="12" width="26" height="18" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.1"/><line x1="13" y1="12" x2="13" y2="30" stroke="currentColor" stroke-width="1.5" opacity="0.5"/><line x1="18" y1="12" x2="18" y2="30" stroke="currentColor" stroke-width="1.5" opacity="0.5"/><line x1="23" y1="12" x2="23" y2="30" stroke="currentColor" stroke-width="1.5" opacity="0.5"/><line x1="28" y1="12" x2="28" y2="30" stroke="currentColor" stroke-width="1.5" opacity="0.5"/><path d="M10 8 Q12 5 14 8 Q16 11 18 8 Q20 5 22 8 Q24 11 26 8 Q28 5 30 8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.6"/>`,
  "devices.types.humidifier": `<path d="M20 6 Q14 17 14 22 Q14 31 20 31 Q26 31 26 22 Q26 17 20 6Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.15"/><path d="M15 22 Q16 28 20 28" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>`,
  "devices.types.thermostat": `<rect x="16" y="7" width="8" height="17" rx="4" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><rect x="18.5" y="9" width="3" height="10" rx="1.5" fill="currentColor" opacity="0.6"/><circle cx="20" cy="27" r="5" fill="currentColor"/><line x1="24" y1="13" x2="27" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="24" y1="17" x2="26" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  "devices.types.thermostat.ac": `<rect x="16" y="7" width="8" height="17" rx="4" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><circle cx="20" cy="27" r="5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M17 28 Q19 25 23 28" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  "devices.types.thermostat.heater": `<rect x="16" y="7" width="8" height="17" rx="4" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><circle cx="20" cy="27" r="5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M17 29 Q19 24 23 29" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.3" stroke-linecap="round"/>`,
  "devices.types.ventilation": `<circle cx="20" cy="20" r="12" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.08"/><circle cx="20" cy="20" r="3" fill="currentColor"/><path d="M20 17 Q22 12 26 11 Q30 10 29 14 Q28 18 20 17Z" fill="currentColor" opacity="0.5"/><path d="M23 20 Q28 22 29 26 Q30 30 26 29 Q22 28 23 20Z" fill="currentColor" opacity="0.5"/><path d="M20 23 Q18 28 14 29 Q10 30 11 26 Q12 22 20 23Z" fill="currentColor" opacity="0.5"/><path d="M17 20 Q12 18 11 14 Q10 10 14 11 Q18 12 17 20Z" fill="currentColor" opacity="0.5"/>`,
  "devices.types.socket": `<rect x="6" y="6" width="28" height="28" rx="6" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.10"/><circle cx="20" cy="20" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="16" cy="19" r="1.6" fill="currentColor"/><circle cx="24" cy="19" r="1.6" fill="currentColor"/>`,
  "devices.types.switch": `<rect x="7" y="14" width="26" height="14" rx="7" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><circle cx="26" cy="21" r="5" fill="currentColor"/>`,
  "devices.types.relay": `<rect x="10" y="13" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><line x1="5" y1="20" x2="10" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="30" y1="20" x2="35" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 20 L19 20 L22 15 L22 25 L25 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  "devices.types.openable": `<rect x="12" y="18" width="16" height="14" rx="2" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><path d="M15 18 L15 13 Q15 8 20 8 Q25 8 25 13 L25 18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="20" cy="26" r="2.5" fill="currentColor" opacity="0.7"/>`,
  "devices.types.openable.curtain": `<line x1="6" y1="9" x2="34" y2="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M8 9 Q12 18 10 32" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M32 9 Q28 18 30 32" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M8 9 Q14 22 20 22 Q26 22 32 9" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.15" stroke-linecap="round"/>`,
  "devices.types.openable.gate": `<rect x="5" y="10" width="13" height="22" rx="2" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><rect x="22" y="10" width="13" height="22" rx="2" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><line x1="5" y1="17" x2="18" y2="17" stroke="currentColor" stroke-width="1" opacity="0.4"/><line x1="5" y1="24" x2="18" y2="24" stroke="currentColor" stroke-width="1" opacity="0.4"/><line x1="22" y1="17" x2="35" y2="17" stroke="currentColor" stroke-width="1" opacity="0.4"/><line x1="22" y1="24" x2="35" y2="24" stroke="currentColor" stroke-width="1" opacity="0.4"/><circle cx="18" cy="21" r="2" fill="currentColor" opacity="0.6"/><circle cx="22" cy="21" r="2" fill="currentColor" opacity="0.3"/>`,
  "devices.types.openable.valve": `<circle cx="20" cy="22" r="8" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><line x1="5" y1="22" x2="12" y2="22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="28" y1="22" x2="35" y2="22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="14" x2="20" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="15" y="7" width="10" height="3" rx="1.5" fill="currentColor" opacity="0.6"/>`,
  "devices.types.openable.window": `<rect x="7" y="8" width="26" height="26" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.08"/><line x1="20" y1="8" x2="20" y2="34" stroke="currentColor" stroke-width="1.5" opacity="0.5"/><line x1="7" y1="21" x2="33" y2="21" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>`,
  "devices.types.camera": `<rect x="4" y="13" width="24" height="16" rx="3" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><path d="M28 17 L36 13 L36 27 L28 23 Z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.2" stroke-linejoin="round"/><circle cx="13" cy="21" r="4" stroke="currentColor" stroke-width="2"/><circle cx="13" cy="21" r="1.5" fill="currentColor"/>`,
  "devices.types.smart_speaker": `<rect x="14" y="10" width="12" height="22" rx="5" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.12"/><circle cx="20" cy="21" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="20" cy="21" r="3" fill="currentColor" opacity="0.5"/><path d="M9 16 Q5 21 9 26" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M5 13 Q-1 21 5 29" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/><path d="M31 16 Q35 21 31 26" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M35 13 Q41 21 35 29" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>`,
  "devices.types.other": `<path d="M8 22 L20 28 L32 22 L32 30 L20 36 L8 30 Z" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 22 L20 16 L20 28 L8 22" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 22 L20 16 L32 22 L20 28 Z" fill="currentColor" fill-opacity="0.20" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
};

const DEVICE_CATEGORIES = [
  { id:"light",      label:"Свет",       color:"#FFB800", bg:"#1C1700", types:[
    {id:"devices.types.light",label:"Свет"},{id:"devices.types.light.lamp",label:"Лампа"},
    {id:"devices.types.light.ceiling",label:"Потолочный"},{id:"devices.types.light.strip",label:"Лента"}]},
  { id:"sensor",     label:"Датчики",    color:"#CE93D8", bg:"#150A1E", types:[
    {id:"devices.types.sensor",label:"Датчик"},{id:"devices.types.sensor.button",label:"Кнопка"},
    {id:"devices.types.sensor.climate",label:"Климат"},{id:"devices.types.sensor.gas",label:"Газ"},
    {id:"devices.types.sensor.illumination",label:"Освещённость"},{id:"devices.types.sensor.motion",label:"Движение"},
    {id:"devices.types.sensor.open",label:"Открытие"},{id:"devices.types.sensor.smoke",label:"Дым"},
    {id:"devices.types.sensor.vibration",label:"Вибрация"},{id:"devices.types.sensor.water_leak",label:"Протечка"}]},
  { id:"smart_meter",label:"Счётчики",   color:"#80CBC4", bg:"#051514", types:[
    {id:"devices.types.smart_meter",label:"Счётчик"},{id:"devices.types.smart_meter.cold_water",label:"Хол. вода"},
    {id:"devices.types.smart_meter.electricity",label:"Электро"},{id:"devices.types.smart_meter.gas",label:"Газ"},
    {id:"devices.types.smart_meter.heat",label:"Тепло"},{id:"devices.types.smart_meter.hot_water",label:"Гор. вода"}]},
  { id:"media",      label:"Медиа",      color:"#F48FB1", bg:"#200A12", types:[
    {id:"devices.types.media_device",label:"Медиа"},{id:"devices.types.media_device.receiver",label:"Ресивер"},
    {id:"devices.types.media_device.tv",label:"Телевизор"},{id:"devices.types.media_device.tv_box",label:"ТВ-приставка"}]},
  { id:"cooking",    label:"Кухня",      color:"#FFAB91", bg:"#1A0E08", types:[
    {id:"devices.types.cooking",label:"Готовка"},{id:"devices.types.cooking.coffee_maker",label:"Кофемашина"},
    {id:"devices.types.cooking.kettle",label:"Чайник"},{id:"devices.types.cooking.multicooker",label:"Мультиварка"},
    {id:"devices.types.dishwasher",label:"Посудомойка"},{id:"devices.types.cooking.oven",label:"Духовка"},
    {id:"devices.types.cooking.refrigerator",label:"Холодильник"}]},
  { id:"household",  label:"Бытовая",    color:"#CFD8DC", bg:"#101418", types:[
    {id:"devices.types.iron",label:"Утюг"},{id:"devices.types.vacuum_cleaner",label:"Пылесос"},
    {id:"devices.types.washing_machine",label:"Стиральная"}]},
  { id:"pet",        label:"Питомцы",    color:"#A5D6A7", bg:"#081508", types:[
    {id:"devices.types.pet_drinking_fountain",label:"Поилка"},{id:"devices.types.pet_feeder",label:"Кормушка"}]},
  { id:"climate",    label:"Климат",     color:"#81D4FA", bg:"#061520", types:[
    {id:"devices.types.air_conditioner",label:"Кондиционер"},{id:"devices.types.air_purifier",label:"Очиститель"},
    {id:"devices.types.fan",label:"Вентилятор"},{id:"devices.types.heater",label:"Обогреватель"},
    {id:"devices.types.humidifier",label:"Увлажнитель"},{id:"devices.types.thermostat",label:"Термостат"},
    {id:"devices.types.thermostat.ac",label:"Термостат AC"},{id:"devices.types.thermostat.heater",label:"Термостат обогр."},
    {id:"devices.types.ventilation",label:"Вентиляция"}]},
  { id:"electrical", label:"Электро",    color:"#69F0AE", bg:"#021408", types:[
    {id:"devices.types.socket",label:"Розетка"},{id:"devices.types.switch",label:"Выключатель"},
    {id:"devices.types.relay",label:"Реле"}]},
  { id:"openable",   label:"Открывание", color:"#FFCC80", bg:"#1A1200", types:[
    {id:"devices.types.openable",label:"Открывание"},{id:"devices.types.openable.curtain",label:"Шторы"},
    {id:"devices.types.openable.gate",label:"Ворота"},{id:"devices.types.openable.valve",label:"Клапан"},
    {id:"devices.types.openable.window",label:"Окно"}]},
  { id:"smart_speaker", label:"Колонки",    color:"#81D4FA", bg:"#061520", types:[
    {id:"devices.types.smart_speaker",label:"Колонка"},
    {id:"devices.types.smart_speaker.yandex.station.cucumber",label:"Яндекс Станция"},
    {id:"devices.types.smart_speaker.yandex.station.micro",label:"Яндекс Станция Мини"},
    {id:"devices.types.smart_speaker.fiero.blackthorn",label:"Fiero Hi"}]},
  { id:"other",      label:"Другое",     color:"#EF9A9A", bg:"#1A0808", types:[
    {id:"devices.types.camera",label:"Камера"},{id:"devices.types.other",label:"Другое"}]},
];

// Плоский Map: id → { id, label, color, bg, category, svgPath }
const DEVICE_TYPES_MAP = new Map();
for (const cat of DEVICE_CATEGORIES) {
  for (const t of cat.types) {
    DEVICE_TYPES_MAP.set(t.id, {
      ...t,
      color: cat.color,
      bg: cat.bg,
      category: cat.id,
      svgPath: DEVICE_SVG_PATHS[t.id] || ""
    });
  }
}

/** Получить мета-объект типа устройства по id */
function getDeviceType(id) { return DEVICE_TYPES_MAP.get(id) || null; }

/**
 * Создать SVGElement для типа Яндекс устройства.
 * @param {string} id         — devices.types.*
 * @param {number} [size=24]  — ширина/высота px
 * @param {string} [color]    — цвет; если не задан — из реестра
 * @returns {SVGSVGElement|null}
 */
function renderDeviceTypeIcon(id, size = 24, color = null) {
  const type = DEVICE_TYPES_MAP.get(id);
  if (!type || !type.svgPath) return null;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 40 40");
  svg.setAttribute("fill", "none");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.style.color = color || type.color;
  svg.style.flexShrink = "0";
  svg.innerHTML = type.svgPath;
  return svg;
}

/**
 * Палитра выбора типа Яндекс устройства.
 * Использование:
 *   const picker = new DeviceTypePicker({ value: js.type, onChange: v => ... });
 *   container.appendChild(picker.el);
 *   picker.getValue() / picker.setValue(id) / picker.destroy()
 */
class DeviceTypePicker {
  constructor({ value = '', onChange = null } = {}) {
    this._value    = value;
    this._onChange = onChange;
    this._itemEls  = new Map();
    this._expanded = false; // Состояние: развернут/свернут
    this._ensureStyles();
    this.el        = this._build();
    if (value) this._applySelection(value, false);
  }
  
  getValue()  { return this._value; }
  setValue(id){ this._applySelection(id, true); }
  destroy()   { this.el.remove(); this._itemEls.clear(); }

  _ensureStyles() {
    if (document.getElementById('dtp-styles')) return;
    const s = document.createElement('style');
    s.id = 'dtp-styles';
    s.textContent = `
      .dtp-wrap{font-family:'Segoe UI',Roboto,sans-serif;width:100%;max-width:100%;box-sizing:border-box;overflow:hidden;}
      .dtp-preview{display:flex;align-items:center;gap:8px;padding:0px 5px;border-radius:7px;margin-bottom:0;border:1px solid #1E2230;background:#9E9E9E;min-height:36px;transition:background .2s,border-color .2s;cursor:pointer;}
      .dtp-preview:hover{background:#b5b5b5;border-color:#3A4060;}
      .dtp-preview-icon{width:20px;height:20px;flex-shrink:0;}
      .dtp-preview-name{font-size:12px;font-weight:600;white-space:nowrap;}
      .dtp-preview-id{font-size:10px;color:#e5e5e5;margin-left:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .dtp-preview-empty{font-size:11px;color:#3A4060;}
      .dtp-clear{margin-left:auto;background:none;border:none;color:#3A4060;cursor:pointer;font-size:16px;line-height:1;padding:0 4px;border-radius:3px;transition:color .15s;}
      .dtp-clear:hover{color:#EF9A9A;}
      
      /* ИСПРАВЛЕННЫЕ СТИЛИ ДЛЯ СКРОЛЛА */
      .dtp-cats {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
        padding-right: 2px;
        margin-top: 0;
        width: 100%;
      }
      .dtp-cats.expanded {
        max-height: 340px;
        overflow-y: auto; /* ВАЖНО: включаем скролл */
        margin-top: 8px;
      }
      .dtp-cats::-webkit-scrollbar {
        width: 4px;
      }
      .dtp-cats::-webkit-scrollbar-track {
        background: #0C0E14;
      }
      .dtp-cats::-webkit-scrollbar-thumb {
        background: #252830;
        border-radius: 2px;
      }
      .dtp-cats::-webkit-scrollbar-thumb:hover {
        background: #3A4060;
      }
      
      .dtp-cat-hdr{display:flex;align-items:center;gap:5px;font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;opacity:.6;margin-bottom:5px;}
      .dtp-cat-ll{width:12px;height:1px;opacity:.4;flex-shrink:0;} .dtp-cat-lr{flex:1;height:1px;opacity:.15;}
      .dtp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:4px;box-sizing:border-box;width:100%;}
      .dtp-item{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:4px;padding:7px 4px 5px;border-radius:8px;border:1.5px solid transparent;background:#b0c1c7;cursor:pointer;outline:none;transition:background .14s,border-color .14s,transform .14s,box-shadow .14s;-webkit-tap-highlight-color:transparent;}
      .dtp-item:hover{background:#9aabb3;border-color:#20243A;}
      .dtp-item.dtp-sel{transform:scale(1.06);border-color:#4CAF50;background:#a5d6a7;}
      .dtp-glow{position:absolute;inset:0;border-radius:7px;pointer-events:none;opacity:0;transition:opacity .14s;}
      .dtp-item.dtp-sel .dtp-glow{opacity:1;}
      .dtp-iico{width:28px;height:28px;flex-shrink:0;color:#3A4560;transition:color .14s;}
      .dtp-item:hover .dtp-iico{color:#7A8AAA;}
      .dtp-iname{font-size:8.5px;font-weight:500;color:#3A4560;text-align:center;line-height:1.25;word-break:break-word;transition:color .14s;max-width:100%;}
      .dtp-item:hover .dtp-iname{color:#7A8AAA;}
      .dtp-arrow{margin-left:auto;font-size:14px;color:#3A4060;transition:transform 0.2s;}
      .dtp-preview.expanded .dtp-arrow{transform:rotate(180deg);}
    `;
    document.head.appendChild(s);
  }

  _build() {
    const wrap = document.createElement('div');
    wrap.className = 'dtp-wrap';
    
    // Preview с кликом для сворачивания/разворачивания
    this._previewEl = document.createElement('div');
    this._previewEl.className = 'dtp-preview';
    this._previewEl.addEventListener('click', (e) => {
      // Не сворачиваем при клике на кнопку очистки
      if (!e.target.classList.contains('dtp-clear')) {
        this._toggleExpand();
      }
    });
    this._setPreviewEmpty();
    wrap.appendChild(this._previewEl);
    
    // Категории
    this._catsEl = document.createElement('div');
    this._catsEl.className = 'dtp-cats';
    for (const cat of DEVICE_CATEGORIES) this._catsEl.appendChild(this._buildCat(cat));
    wrap.appendChild(this._catsEl);
    
    return wrap;
  }

  _toggleExpand() {
    this._expanded = !this._expanded;
    if (this._expanded) {
      this._catsEl.classList.add('expanded');
      this._previewEl.classList.add('expanded');
    } else {
      this._catsEl.classList.remove('expanded');
      this._previewEl.classList.remove('expanded');
    }
  }

  _collapse() {
    if (this._expanded) {
      this._expanded = false;
      this._catsEl.classList.remove('expanded');
      this._previewEl.classList.remove('expanded');
    }
  }

  _setPreviewEmpty() {
    this._previewEl.innerHTML = '';
    this._previewEl.style.background  = '#0F1018';
    this._previewEl.style.borderColor = '#1E2230';
    const e = document.createElement('span');
    e.className = 'dtp-preview-empty';
    e.textContent = 'Выберите тип…';
    this._previewEl.appendChild(e);
    
    // Добавляем стрелку
    const arrow = document.createElement('span');
    arrow.className = 'dtp-arrow';
    arrow.textContent = '▼';
    this._previewEl.appendChild(arrow);
  }

  _buildCat(cat) {
    const wrap = document.createElement('div');
    const hdr  = document.createElement('div');
    hdr.className = 'dtp-cat-hdr'; hdr.style.color = cat.color;
    const ll = document.createElement('div'); ll.className = 'dtp-cat-ll'; ll.style.background = cat.color;
    const tt = document.createElement('span'); tt.textContent = cat.label;
    const lr = document.createElement('div'); lr.className = 'dtp-cat-lr'; lr.style.background = cat.color;
    hdr.append(ll, tt, lr);
    wrap.appendChild(hdr);
    const grid = document.createElement('div'); grid.className = 'dtp-grid';
    for (const t of cat.types) {
      const item = this._buildItem(t, cat);
      this._itemEls.set(t.id, item);
      grid.appendChild(item);
    }
    wrap.appendChild(grid);
    return wrap;
  }

  _buildItem(type, cat) {
    const item = document.createElement('button');
    item.className = 'dtp-item'; item.type = 'button'; item.title = type.id;
    const glow = document.createElement('div');
    glow.className = 'dtp-glow';
    glow.style.background = `radial-gradient(ellipse at 50% 10%,${cat.color}20 0%,transparent 65%)`;
    item.appendChild(glow);
    const iico = document.createElement('div'); iico.className = 'dtp-iico';
    const svg = this._mkSvg(type.id); if (svg) iico.appendChild(svg);
    item.appendChild(iico);
    const nm = document.createElement('span'); nm.className = 'dtp-iname'; nm.textContent = type.label;
    item.appendChild(nm);
    item.addEventListener('click', () => this._select(type.id));
    return item;
  }

  _select(id) {
    this._applySelection(id === this._value ? '' : id, true);
    this._collapse(); // Сворачиваем после выбора
  }

  _applySelection(id, notify) {
    const prev = this._value; this._value = id;
    if (prev) this._setActive(prev, false);
    if (id)   this._setActive(id,   true);
    this._updatePreview(id);
    if (notify && this._onChange && id !== prev) this._onChange(id);
  }

  _setActive(id, on) {
    const item = this._itemEls.get(id); if (!item) return;
    const t = DEVICE_TYPES_MAP.get(id);
    if (on) {
      item.classList.add('dtp-sel');
    } else {
      item.classList.remove('dtp-sel');
    }
  }

  _updatePreview(id) {
    if (!id) { this._setPreviewEmpty(); return; }
    const t = DEVICE_TYPES_MAP.get(id);
    this._previewEl.innerHTML = '';
    this._previewEl.style.background  = t.bg;
    this._previewEl.style.borderColor = t.color + '55';
    
    const iw = document.createElement('div'); iw.className = 'dtp-preview-icon';
    const svg = this._mkSvg(id); if (svg) { svg.style.color = t.color; iw.appendChild(svg); }
    this._previewEl.appendChild(iw);
    
    const nm = document.createElement('span'); nm.className = 'dtp-preview-name'; nm.style.color = t.color; nm.textContent = t.label;
    this._previewEl.appendChild(nm);
    
    const ti = document.createElement('span'); ti.className = 'dtp-preview-id'; ti.textContent = t.id;
    this._previewEl.appendChild(ti);
    
    const cl = document.createElement('button'); cl.className = 'dtp-clear'; cl.type = 'button'; cl.title = 'Сбросить'; cl.textContent = '×';
    cl.addEventListener('click', (e) => { 
      e.stopPropagation(); 
      this._select(id); // Сброс (выбор того же ID = снять выбор)
    });
    this._previewEl.appendChild(cl);
    
    // Добавляем стрелку
    const arrow = document.createElement('span');
    arrow.className = 'dtp-arrow';
    arrow.textContent = '▼';
    this._previewEl.appendChild(arrow);
  }

  _mkSvg(id) {
    const t = DEVICE_TYPES_MAP.get(id); if (!t?.svgPath) return null;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 40 40'); svg.setAttribute('fill', 'none');
    svg.style.width = '100%'; svg.style.height = '100%';
    svg.innerHTML = t.svgPath;
    return svg;
  }
}

window.DeviceTypePicker = DeviceTypePicker;
let device_type = {
  "binary_sensor": [
    {"device_class": "battery", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:battery"},
    {"device_class": "battery_charging", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:battery-charging"},
    {"device_class": "cold", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:snowflake"},
    {"device_class": "connectivity", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:wifi"},
    {"device_class": "door", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:door"},
    {"device_class": "garage_door", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:garage"},
    {"device_class": "gas", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:gas-cylinder"},
    {"device_class": "heat", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:fire"},
    {"device_class": "light", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:lightbulb"},
    {"device_class": "lock", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:lock"},
    {"device_class": "moisture", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:water"},
    {"device_class": "motion", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:motion-sensor"},
    {"device_class": "moving", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:car"},
    {"device_class": "occupancy", "off_delay": "60", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:home"},
    {"device_class": "opening", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:window-open"},
    {"device_class": "plug", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:power-plug"},
    {"device_class": "power", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:flash"},
    {"device_class": "presence", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:account"},
    {"device_class": "problem", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:alert"},
    {"device_class": "safety", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:shield"},
    {"device_class": "smoke", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:smoke-detector"},
    {"device_class": "sound", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:volume-high"},
    {"device_class": "vibration", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:vibrate"},
    {"device_class": "window", "payload_on": "1", "payload_off": "0", "state_topic": "", "icon": "mdi:window"}
  ],
  "sensor": [
    {"device_class": "generic", "state_topic": "", "icon": "mdi:chip"},
    {"device_class": "battery", "unit_of_measurement": "%", "state_topic": "", "icon": "mdi:battery"},
    {"device_class": "humidity", "unit_of_measurement": "%", "state_topic": "", "icon": "mdi:water-percent"},
    {"device_class": "illuminance", "unit_of_measurement": "lx", "state_topic": "", "icon": "mdi:brightness-5"},
    {"device_class": "signal_strength", "unit_of_measurement": "dB", "state_topic": "", "icon": "mdi:wifi"},
    {"device_class": "temperature", "unit_of_measurement": "°C", "state_topic": "", "icon": "mdi:thermometer"},
    {"device_class": "power", "unit_of_measurement": "kW", "state_topic": "", "icon": "mdi:flash"},
    {"device_class": "pressure", "unit_of_measurement": "hPa", "state_topic": "", "icon": "mdi:gauge"}
  ],
  "switch": [],
  "light": [
    {"command_topic": "", "state_topic": "", "brightness": true, "rgb": true, "icon": "mdi:lightbulb"}
  ],
  "cover": [
    {"device_class": "window", "payload_on": "OPEN", "payload_off": "CLOSE", "command_topic": "", "state_topic": "", "icon": "mdi:window-shutter"},
    {"device_class": "door", "payload_on": "OPEN", "payload_off": "CLOSE", "command_topic": "", "state_topic": "", "icon": "mdi:door"},
    {"device_class": "garage", "payload_on": "OPEN", "payload_off": "CLOSE", "command_topic": "", "state_topic": "", "icon": "mdi:garage"}
  ],
  "outlet": [
    {"command_topic": "", "state_topic": "", "icon": "mdi:power-plug"}
  ],
  "climate": [
    {"mode_command_topic": "", "temperature_command_topic": "", "icon": "mdi:thermostat"}
  ],
  "lock": [
    {"command_topic": "", "state_topic": "", "icon": "mdi:lock"}
  ],
  "alarm_control_panel": [
    {"command_topic": "", "state_topic": "", "icon": "mdi:shield-home"}
  ],
  "fan": [
    {"command_topic": "", "state_topic": "", "speed_command_topic": "", "icon": "mdi:fan"}
  ]
}