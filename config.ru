require 'json'

request = Struct.new(:path, :body)
response = Struct.new(:content_type, :body)

requests = []
channels = []

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
    reqdesc = requests.shift
    res.body = JSON({ 
      :connected => channels.include?(cid),
      :output => reqdesc && [
        {:request => reqdesc},
        {:response => { 
          :source => reqdesc["target"], :target => reqdesc["source"],
          :response => "12 34 56 78" } }
      ]
    })
    res.content_type = "text/json"
  when "/request"
    requests.push(JSON(req.body))
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

