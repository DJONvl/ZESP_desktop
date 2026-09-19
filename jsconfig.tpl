{
  "APP": {
    "Lang": {
      "list": [
        "en",
        "ru"
      ],
      "val": "ru"
    },
    "agent": {
      "list": [
        "Bonzi",
        "Clippy",
        "F1",
        "Genie",
        "Genius",
        "Links",
        "Merlin",
        "Peedy",
        "Rocky",
        "Rover"
      ],
      "onchange": "setAgent",
      "val": "Genie"
    },
    "button_reg": {
      "label": "Обновление",
      "onClick": "checkUpdate"
    },
    "version": "dev"
  },
  "ZIGBEE": {
    "Adapter": {
      "val": "zigate",
      "list": [
        "none",
        "telink",
        "znp",
        "zigate",
        "zboss",
        "ezsp",
        "router"
      ]
    },
    "Transport": {
      "val": "/dev/ttymxc1",
      "list": [
        "COMX",
        "/dev/ttymxc1",
        "/dev/ttymxc3",
        "host:192.168.43.234:20108"
      ]
    },
    "Speed": "1000000",
    "Chanel": "11",
    "PanID": "6756",
    "ExtPanID": "DDDDDDDDDDDDDDDD",
    "Key": "01030507090B0D0F00020406080A0C0D",
    "modeRouter": "0"
  },
  "MQTT": {
    "mqttEnable": "0",
    "mqttup": "zespNew",
    "mqtt": "192.168.1.1",
    "mqttPort": "1883",
    "mqttLogin": "",
    "mqttPassw": "",
    "Home_Assistant": "0",
    "mqttDiscowery": "0",
    "DiscoweryAdr": "192.168.1.1",
    "DiscoweryPort": "1883",
    "DiscoweryPrefix": "homeassistant"
  },
  "Telegram_Bot": {
    "Enable": "0",
    "bot_token": "",
    "password": "123456",
    "chat_id": ""
  },
  "ZIGBEE2MQTT": {
    "z2m_Enable": "0",
    "internal": "1",
    "z2m_ip": "192.168.1.1",
    "z2m_port": "8090"
  },
  "Ya": {
    "ya_Enable": "0",
    "ac_id": "",
    "ac_login": "",
    "ac_pass": "",
    "button_reg": {
      "label": "Регистрация",
      "onClick": "yaRegister"
    },
    "ya_Import": "0",
    "ya_Sid": "",
    "ya_Token": "",
    "button_aut": {
      "label": "Авторизовать",
      "onClick": "qrLogin"
    }
  },
  "Weather": {
    "Weather_ApiKey": "",
    "Weather_City": ""
  },
  "HomeAssistant": {
    "ha_Enable": "0",
    "ha_ip": "192.168.1.1:8123",
    "ha_authToken": ""
  },
  "Brain": {
    "provider": {
      "list": [
        "none",
        "opencode",
        "openai",
        "deepseek",
        "ollama"
      ],
      "val": "none"
    },
    "opencode_url": "http://192.168.1.150:4096",
    "opencode_model": "opencode-go/qwen3.7-plus",
    "openai_url": "https://api.openai.com/v1/chat/completions",
    "openai_model": "gpt-4o",
    "openai_key": "",
    "deepseek_url": "https://api.deepseek.com/v1/chat/completions",
    "deepseek_model": "deepseek-chat",
    "deepseek_key": "",
    "ollama_url": "http://localhost:11434/v1/chat/completions",
    "ollama_model": "llama3",
    "system_prompt": "Ты — ассистент умного дома. Отвечай кратко. Инструменты ZESP доступны."
  }
}