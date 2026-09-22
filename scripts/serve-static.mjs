import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist/client");
const types = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".svg":"image/svg+xml", ".rsc":"text/x-component" };
createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,"http://localhost");
    if (!url.pathname.startsWith("/system-snacks/")) { res.writeHead(302,{Location:"/system-snacks/"}); res.end(); return; }
    const relative = decodeURIComponent(url.pathname.slice("/system-snacks/".length)) || "index.html";
    const file = path.resolve(root,relative);
    if (!file.startsWith(root+path.sep)) throw new Error("Invalid path");
    const body=await readFile(file);
    res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream","Cache-Control":"no-store"});res.end(body);
  } catch { res.writeHead(404);res.end("Not found"); }
}).listen(4173,"127.0.0.1",()=>console.log("Static production preview: http://127.0.0.1:4173/system-snacks/"));
