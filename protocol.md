#Services


##channels

request available channels

URL: /channels

Request: empty

Response:

  [
    { :name => "Ethernet", :id => "eth" },
    { :name => "Vector Ch1", :id => "vch1"},
    { :name => "Vector Ch2", :id => "vch2"}
  ]

##connect

connect a channel to the io device

URL: /connect

Request:

  { :channel => <channel id> }

Response: empty

##disconnect

disconnect a channel to the io device

URL: /disconnect

Request:

  { :channel => <channel id> }

Response: empty

##state

fetch current state, this includes new response messages

URL: /state

Request:

  { :channel => <channel id> }

Reponse:

  { 
    :connected => <true|false>,
    :output => [
      {:request => { :source => <source id>, :target => <target id>, :response => <data> } },
      {:response => { :source => <source id>, :target => <target id>, :response => <data> } },
      ...
    ]
  }

##request

execute a diagnostic job

URL: /request

Request:

  { 
    :channel => <channel id>,
    :request => { :source => <source id>, :target => <target id>, :response => <data> }
  }

Response:

  empty

