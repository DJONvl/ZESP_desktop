//#region Custom blockly template functions
function getCode(fn, data) {
  const regexFn = /function\s([a-z_0-9]+)\(\)\s+{(.+)}/gsi;
  const regexTabs = /^ {0,4}\t*/gm;
  const str = fn.toString();

  const fnName = str.replace(regexFn, '$1');
  const fnBody = str.replace(regexFn, '$2');
  let result = fnBody.replace(regexTabs, '');

  Object.entries(data).forEach(entry => {
    const [key, value] = entry;
    result = result.replaceAll(`\$${key}`, value);
  })

  return `\n// ## ${fnName} ##${result}\n`;
}

function getMilliseconds(value, units) {
  switch (units) {
    case '0': return value * 60 * 1000;
    case '1': return value * 1000;
    case '2': return value;
    default: throw Error(`Unknown units value provided: ${units}`);
  }
}
//#endregion

// ** Plugins auto generated code **

//#region autolight plugin script
Blockly.Blocks['autolight'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("LIGHT AUTO SWITCHER");
    this.appendValueInput("mac_light")
      .setCheck("String")
      .appendField("MAC light device:");
    this.appendValueInput("mac_sensor")
      .setCheck("String")
      .appendField("MAC sensor device:");
    this.appendDummyInput()
      .appendField("Turn off delay:")
      .appendField(new Blockly.FieldNumber(5, 0), "turn_off_delay")
      .appendField(new Blockly.FieldDropdown([["Minutes", "0"], ["Seconds", "1"], ["Milliseconds", "2"]]), "turn_off_delay_units");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("Automatic light control with sensor");
    this.setHelpUrl("https://t.me/blockly_zesp");
  }
};

Blockly.JavaScript['autolight'] = function (block) {
  const value_mac_light = Blockly.JavaScript.valueToCode(block, 'mac_light', Blockly.JavaScript.ORDER_ATOMIC);
  const value_mac_sensor = Blockly.JavaScript.valueToCode(block, 'mac_sensor', Blockly.JavaScript.ORDER_ATOMIC);
  const dropdown_turn_off_delay_units = block.getFieldValue('turn_off_delay_units');
  const number_turn_off_delay = block.getFieldValue('turn_off_delay');
  const number_turn_off_delay_ms = getMilliseconds(number_turn_off_delay, dropdown_turn_off_delay_units)

  const autolight_timer = Blockly.JavaScript.variableDB_.getDistinctName('autolight_timer');

  var code = getCode(autolight, {
    value_mac_light,
    value_mac_sensor,
    number_turn_off_delay_ms,
    autolight_timer
  })

  return code;
};

function autolight() {
  var $autolight_timer = null;
  zigbeeEvent.on($value_mac_sensor, (args) => {
    if (args.Data == '01') {
      cmd_ON_OFF($value_mac_light, '01', 1, false);

      if ($autolight_timer) clearTimeout($autolight_timer);
      $autolight_timer = setTimeout(function () {
        cmd_ON_OFF($value_mac_light, '01', 0, false);
      }, $number_turn_off_delay_ms);
    }
  });
}
//#endregion

//#region blockly_hub_blinker plugin script
Blockly.Blocks['hub_blinker'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Hub blinker  |");
    this.appendDummyInput()
      .appendField("Count:")
      .appendField(new Blockly.FieldNumber(10, 1), "hub_blinks_count");
    this.appendDummyInput()
      .appendField(" Interval (ms):")
      .appendField(new Blockly.FieldNumber(1000, 100), "hub_blinks_interval");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("Hub light blinker");
    this.setHelpUrl("https://t.me/blockly_zesp");
  }
};

Blockly.JavaScript['hub_blinker'] = function (block) {
  var number_hub_blinks_count = block.getFieldValue('hub_blinks_count');
  var number_hub_blinks_interval = block.getFieldValue('hub_blinks_interval');

  const hub_blinker_timer = Blockly.JavaScript.variableDB_.getDistinctName('hub_blinker_timer');
  const hub_blinker_counter = Blockly.JavaScript.variableDB_.getDistinctName('hub_blinker_counter');

  return getCode(hub_blinker, { number_hub_blinks_count, number_hub_blinks_interval, hub_blinker_timer, hub_blinker_counter });
};

function hub_blinker() {
  miLampSet(100, '#ffffff', 0); // reset hub light

  var $hub_blinker_counter = $number_hub_blinks_count;
  var $hub_blinker_timer = setInterval(() => {
    miLampSet(100, '#ffffff', 2); // toggle light state
    $hub_blinker_counter -= 0.5;

    if ($hub_blinker_counter <= 0) {
      if ($hub_blinker_timer) clearInterval($hub_blinker_timer);
      $hub_blinker_timer = null;
    }
  }, $number_hub_blinks_interval / 2);
}
//#endregion

//#region on_zigbee_event plugin script
//#region filter by all properties
Blockly.Blocks['on_zigbee_event'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("ON ZIGBEE EVENT  |");
    this.appendValueInput("mac_device")
      .setCheck("String")
      .appendField("MAC Device:");
    this.appendDummyInput()
      .appendField("Endpoint:")
      .appendField(new Blockly.FieldTextInput("01"), "endpoint");
    this.appendDummyInput()
      .appendField("Cluster:")
      .appendField(new Blockly.FieldTextInput("0006"), "cluster");
    this.appendDummyInput()
      .appendField("Attribute:")
      .appendField(new Blockly.FieldTextInput("0000"), "addtribute");
    this.appendDummyInput()
      .appendField("Data:")
      .appendField(new Blockly.FieldTextInput("01"), "event_data");
    this.appendStatementInput("on_event_statement")
      .setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Trigger for filtered events");
    this.setHelpUrl("https://t.me/blockly_zesp");
  }
};

Blockly.JavaScript['on_zigbee_event'] = function (block) {
  var value_mac_device = Blockly.JavaScript.valueToCode(block, 'mac_device', Blockly.JavaScript.ORDER_ATOMIC);
  var text_endpoint = block.getFieldValue('endpoint');
  var text_cluster = block.getFieldValue('cluster');
  var text_addtribute = block.getFieldValue('addtribute');
  var text_event_data = block.getFieldValue('event_data');
  var statements_on_event_statement = Blockly.JavaScript.statementToCode(block, 'on_event_statement');

  return getCode(onZigbeeEvent, {
    value_mac_device,
    text_endpoint,
    text_cluster,
    text_addtribute,
    text_event_data,
    statements_on_event_statement
  });
};

function onZigbeeEvent() {
  zigbeeEvent.on($value_mac_device, (data) => {
    if (data.EndPoint == '$text_endpoint' && data.ClusterId == '$text_cluster' && data.AttribId == '$text_addtribute' && data.Data == '$text_event_data') {
      $statements_on_event_statement
    }
  });
}
//#endregion

//#region filter by data only
Blockly.Blocks['on_zigbee_event2'] = {
  init: function () {
    this.appendDummyInput()
      .appendField("ON ZIGBEE EVENT  |");
    this.appendValueInput("mac_device")
      .setCheck("String")
      .appendField("MAC Device:");
    this.appendDummyInput()
      .appendField("Data:")
      .appendField(new Blockly.FieldTextInput("01"), "event_data");
    this.appendStatementInput("on_event_statement")
      .setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Trigger for filtered events");
    this.setHelpUrl("https://t.me/blockly_zesp");
  }
};

Blockly.JavaScript['on_zigbee_event2'] = function (block) {
  var value_mac_device = Blockly.JavaScript.valueToCode(block, 'mac_device', Blockly.JavaScript.ORDER_ATOMIC);
  var text_event_data = block.getFieldValue('event_data');
  var statements_on_event_statement = Blockly.JavaScript.statementToCode(block, 'on_event_statement');

  return getCode(onZigbeeEvent2, {
    value_mac_device,
    text_event_data,
    statements_on_event_statement
  });
};

function onZigbeeEvent2() {
  zigbeeEvent.on($value_mac_device, (data) => {
    if (data.Data == '$text_event_data') {
      $statements_on_event_statement
    }
  });
}
//#endregion
//#endregion

