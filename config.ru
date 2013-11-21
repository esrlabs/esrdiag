$:.unshift(File.dirname(__FILE__))
require 'json'
require 'can_driver'

request = Struct.new(:path, :body)
response = Struct.new(:content_type, :body)

requests = []
channels = []

CanDriver.init

app = proc do |env|
  req = request.new(env["PATH_INFO"], env["rack.input"].read)
  res = response.new

  path = nil
  case req.path
  when "/"
    path = "public/index.html"
  when "/favicon.ico"
  when "/open"
    res.body = ""
  when "/channels"
    res.body = JSON([
      { :name => "Ethernet", :id => "eth" },
      { :name => "Vector Ch1", :id => "vch1"},
      { :name => "Vector Ch2", :id => "vch2"}
    ])
    res.content_type = "text/json"
  when "/connect"
    cid = JSON(req.body)["channel"]
    puts "connecting to #{cid}"
    channels << cid
  when "/disconnect"
    cid = JSON(req.body)["channel"]
    puts "disconnecting from #{cid}"
    channels.delete(cid)
  when "/state"
    cid = JSON(req.body)["channel"]
    outpacks = []
    reqdesc = requests.shift
    if reqdesc
      outpacks << {:request => reqdesc}
    end
    while (resbytes = CanDriver.receive).size > 0
      outpacks << {:response => {
        :source => (reqdesc && reqdesc["target"]) || "?", 
        :target => (reqdesc && reqdesc["source"]) || "?",
        :response => resbytes.collect{|b| b.to_s(16)}.join(" ")
      }}
    end
    res.body = JSON({ 
      :connected => channels.include?(cid),
      :output => outpacks
    })
    res.content_type = "text/json"
  when "/request"
    cid = JSON(req.body)["channel"]
    puts "request from #{cid}"
    # TODO: use channel id
    reqdesc = JSON(req.body)["request"]
    bytes = reqdesc["request"].split(" ").collect{|b| b.to_i(16)}
    CanDriver.send(reqdesc["target"].to_i(16), bytes)
    requests.push(reqdesc)
    res.body = ""
  else
    path = "public/"+req.path
  end
  if path
    File.open(path, "rb") do |f|
      res.body = f.read
    end
  end

  [200, { "Content-Type" => res.content_type || ""}, [res.body || ""]]
end
run app

