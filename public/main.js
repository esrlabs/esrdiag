"use strict";

function createFormChecker(service_input, did_rid_input, request_input, source_input, target_input) {

  function parseBytes(string) {
    var failed = false;
    var byteStrs = [];
    var bytes = [];
    var parts;
    
    if (string.match(/^[ \t]*$/)) {
      return [];
    }

    string = string.replace(/^[ \t]+/,"");
    string = string.replace(/[ \t]+$/,"");
    parts = string.split(/[ \t]*[,;.][ \t]*|[ \t]+/);

    $.each(parts, function(i, p) {
      p = p.replace(/^0[xX]/, "");

      if (p.length > 2 && (p.length % 2) > 0) {
        failed = true;
      } 
      while (p.length > 2) {
        byteStrs.push(p.slice(0, 2));
        p = p.slice(2);
      }
      byteStrs.push(p);
    });

    $.each(byteStrs, function(i, b) {
      if (b.match(/^[0-9a-fA-F]+$/)) {
        bytes.push(parseInt(b, 16));
      }
      else {
        failed = true;
      }
    })

    if (failed) {
      return false;
    }
    else {
      return bytes;
    }
  }

  function bytesToString(bytes) {
    var str = "";
    $.each(bytes, function(i, b) {
      var s = b.toString(16).toUpperCase();
      if (s.length === 1) {
        s = "0"+s;
      }
      if (i > 0) {
        str += " ";
      }
      str += s;
    });
    return str;
  }

  function check_input_request() {
    if (parseBytes(request_input.val()) === false) {
      request_input.addClass("input_error");
      return false;
    }
    else {
      request_input.removeClass("input_error");
      return true;
    }
  }

  function check_input_source() {
    var bytes = parseBytes(source_input.val());
    if ((bytes === false) || (bytes.length !== 1)) {
      source_input.addClass("input_error");
      return false;
    }
    else {
      source_input.removeClass("input_error");
      return true;
    }
  }

  function check_input_target() {
    var bytes = parseBytes(target_input.val());
    if ((bytes === false) || (bytes.length !== 1)) {
      target_input.addClass("input_error");
      return false;
    }
    else {
      target_input.removeClass("input_error");
      return true;
    }
  }

  function check_input_service() {
    var bytes = parseBytes(service_input.val());
    if ((bytes === false) || (bytes.length === 0) || (bytes.length > 2)) {
      service_input.addClass("input_error");
      return false;
    }
    else if ((bytes.length === 1) && (bytes[0] === 0x31) || (bytes.length === 2) && (bytes[0] !== 0x31)) {
      service_input.addClass("input_error");
      return false;
    }
    else  {
      service_input.removeClass("input_error");
      return true;
    }
  }

  function check_input_did_rid() {
    var bytes = parseBytes(did_rid_input.val());
    var bytesService = parseBytes(service_input.val());
    if ((bytes.length === 1) || (bytes.length > 2)) {
      did_rid_input.addClass("input_error");
      return false;
    }
    else if (((bytes.length === 0) && ((bytesService[0] === 0x22) || (bytesService[0] === 0x2E) || (bytesService[0] === 0x2F) || (bytesService[0] === 0x31))) ||
             ((bytes.length === 2) && ((bytesService[0] !== 0x22) && (bytesService[0] !== 0x2E) && (bytesService[0] !== 0x2F) && (bytesService[0] !== 0x31)))) {
      did_rid_input.addClass("input_error");
      return false;
    }
    else  {
      did_rid_input.removeClass("input_error");
      return true;
    }
  }

  function update_request() {
    var bytes = parseBytes(service_input.val()).concat(parseBytes(did_rid_input.val()));
    request_input.val(bytesToString(bytes));
  }

  service_input.on("change keyup", function(e) {
    if (check_input_service() !== false) {
      update_request();
    }
  });
  did_rid_input.on("change keyup", function(e) {
    if (check_input_did_rid() !== false) {
      update_request();
    }
  });
  request_input.on("change keyup", function(e) {
    check_input_request();
  });

  source_input.on("change keyup", function(e) {
    check_input_source();
  });

  target_input.on("change keyup", function(e) {
    check_input_target();
  });

  check_input_service();
  check_input_did_rid();
  check_input_source();
  check_input_target();
  check_input_request();
}

function createConnector(channel_dropdown, connect_button, receive_handler) {
  var state = "disconnected";

  function init_channel_input() {
    $.ajax({ 
      url: "/channels",
      dataType: "json"
    }).done(function(json) {
      $.each(json, function(i, c) {
        var op = $(document.createElement("option"));
        op.attr("value", c.id);
        op.text(c.name);
        channel_dropdown.append(op);
      })
    });
  }

  function open_close_device(e) {
    if (state === "disconnected") {
      $.ajax({ 
        url: "/connect",
        type: "POST",
        data: JSON.stringify({ channel: channel_dropdown.val() })
      });
      state = "connecting";
      connect_button.removeClass();
      connect_button.addClass("btn btn-warning");
      connect_button.text("Connecting...");
    }
    else if (state === "connected") {
      $.ajax({ 
        url: "/disconnect",
        type: "POST",
        data: JSON.stringify({ channel: channel_dropdown.val() })
      });
      state = "disconnecting";
      connect_button.removeClass();
      connect_button.addClass("btn btn-warning");
      connect_button.text("Disconnecting...");
    }
    e.preventDefault();
  }

  connect_button.on("click", open_close_device);

  window.setInterval(function() {
    $.ajax({ 
      url: "/state",
      type: "POST",
      data: JSON.stringify({ channel: channel_dropdown.val() }),
      dataType: "json"
    }).done(function(json) {
      console.log(json.is_connected);
      if (json.connected) {
        state = "connected";
        connect_button.removeClass();
        connect_button.addClass("btn btn-success");
        connect_button.text("Disconnect");
        channel_dropdown.prop("disabled", true);
        if (json.output) {
          $.each(json.output, function(i, o) {
            receive_handler(o);
          });
        }
      }
      else {
        state = "disconnected";
        connect_button.removeClass();
        connect_button.addClass("btn btn-default");
        connect_button.text("Connect");
        channel_dropdown.prop("disabled", false);
      }
    });
  }, 1000);

  init_channel_input();
}

