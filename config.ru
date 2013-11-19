require 'json'

request = Struct.new(:path, :body)
response = Struct.new(:content_type, :body)

output = []

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

