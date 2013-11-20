require 'json'

request = Struct.new(:path, :body)
response = Struct.new(:content_type, :body)

output = []
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
    res.body = JSON({ :channels => [
      { :name => "Ethernet", :id => "eth" },
      { :name => "Vector Ch1", :id => "vch1"},
      { :name => "Vector Ch2", :id => "vch2"}
    ]})
    res.content_type = "text/json"
  when "/connect"
    cid = JSON(req.body)["channel"]
    puts "connecting to #{cid}"
    channels << cid
  when "/is_connected"
    cid = JSON(req.body)["channel"]
    res.body = JSON({ :is_connected => channels.include?(cid) })
    res.content_type = "text/json"
  when "/request"
    output.push(req.body)
    res.body = ""
  when "/output"
    res.body = JSON({ :response => output.shift })
    res.content_type = "text/json"
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

