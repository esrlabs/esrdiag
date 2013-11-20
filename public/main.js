"use strict";

function createConnector(channel_dropdown, connect_button) {
  var state = "disconnected";

  function init_channel_input() {
    $.ajax({ 
      url: "/channels",
      dataType: "json"
    }).done(function(json) {
      $.each(json.channels, function(i, c) {
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
      url: "/is_connected",
      type: "POST",
      data: JSON.stringify({ channel: channel_dropdown.val() }),
      dataType: "json"
    }).done(function(json) {
      console.log(json.is_connected);
      if (json.is_connected) {
        state = "connected";
        connect_button.removeClass();
        connect_button.addClass("btn btn-success");
        connect_button.text("Disconnect");
        channel_dropdown.prop("disabled", true);
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
