#!/usr/bin/env bun
import { readFileSync } from "fs";
import { resolve, dirname, basename } from "path";
import { spawn } from "child_process";

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Viewer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--bg-primary:#fdfaf7;--bg-secondary:#f8f5f1;--text-primary:#111;--text-secondary:#2d2d2d;--text-muted:#6b6b6b;--border:#e5e5e5;--code-bg:#f4f1ed;--font-serif:'Cormorant Garamond','Hoefler Text',Garamond,Georgia,serif;--font-sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;--content-width:680px;--reading-width:600px}
    html{font-size:16px;-webkit-font-smoothing:antialiased}
    body{font-family:var(--font-serif);background:var(--bg-primary);color:var(--text-primary);line-height:1.6;min-height:100vh}
    header{position:fixed;top:0;left:0;right:0;background:var(--bg-primary);border-bottom:1px solid var(--border);z-index:100}
    .header-inner{max-width:1200px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
    .logo{font-family:var(--font-serif);font-size:24px;font-weight:600;color:var(--text-primary);text-decoration:none;letter-spacing:-0.02em}
    main{padding-top:80px;min-height:100vh}
    .article-container{display:none;max-width:var(--content-width);margin:0 auto;padding:60px 24px 120px}
    .article-container.visible{display:block;animation:fadeIn 0.4s ease}
    .article-meta{margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid var(--border)}
    .article-meta .date{font-family:var(--font-sans);font-size:13px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em}
    .article-content{max-width:var(--reading-width)}
    .article-content h1{font-family:var(--font-serif);font-size:48px;font-weight:500;line-height:1.15;margin-bottom:24px;letter-spacing:-0.02em}
    .article-content h2{font-family:var(--font-serif);font-size:32px;font-weight:600;line-height:1.25;margin-top:56px;margin-bottom:20px}
    .article-content h3{font-family:var(--font-serif);font-size:26px;font-weight:600;line-height:1.3;margin-top:44px;margin-bottom:16px}
    .article-content h4{font-family:var(--font-serif);font-size:22px;font-weight:600;margin-top:36px;margin-bottom:12px}
    .article-content p{font-family:var(--font-serif);font-size:20px;line-height:1.7;color:var(--text-secondary);margin-bottom:24px}
    .article-content a{color:var(--text-primary);text-decoration:underline;text-underline-offset:2px}
    .article-content strong{font-weight:600;color:var(--text-primary)}
    .article-content em{font-style:italic}
    .article-content ul,.article-content ol{font-family:var(--font-serif);font-size:20px;line-height:1.7;color:var(--text-secondary);margin-bottom:24px;padding-left:28px}
    .article-content li{margin-bottom:8px}
    .article-content blockquote{font-family:var(--font-serif);font-size:22px;font-style:italic;line-height:1.6;color:var(--text-secondary);margin:36px 0;padding:0 0 0 28px;border-left:3px solid var(--text-primary)}
    .article-content blockquote p{margin-bottom:0;font-size:inherit}
    .article-content hr{border:none;height:1px;background:var(--border);margin:48px 0}
    .article-content img{max-width:100%;height:auto;border-radius:8px;margin:32px 0;display:block}
    .article-content code{font-family:'SF Mono','Fira Code',Menlo,Monaco,monospace;font-size:0.875em;background:var(--code-bg);padding:2px 6px;border-radius:4px}
    .article-content pre{background:#1e1e1e;border-radius:8px;padding:24px;overflow-x:auto;margin:32px 0;font-size:14px;line-height:1.6}
    .article-content pre code{background:none;padding:0;color:#d4d4d4}
    .article-content table{width:100%;border-collapse:collapse;margin:32px 0;font-family:var(--font-sans);font-size:15px}
    .article-content th,.article-content td{padding:12px 16px;text-align:left;border-bottom:1px solid var(--border)}
    .article-content th{font-weight:600;background:var(--bg-secondary)}
    footer{max-width:var(--content-width);margin:0 auto;padding:40px 24px;border-top:1px solid var(--border);text-align:center}
    footer p{font-family:var(--font-sans);font-size:13px;color:var(--text-muted)}
    .hljs-keyword{color:#569cd6}.hljs-string{color:#ce9178}.hljs-number{color:#b5cea8}.hljs-comment{color:#6a9955;font-style:italic}.hljs-function{color:#dcdcaa}.hljs-class{color:#4ec9b0}.hljs-variable{color:#9cdcfe}
    @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:768px){.article-content h1{font-size:36px}.article-content h2{font-size:28px}.article-content p,.article-content ul,.article-content ol{font-size:18px}}
  </style>
</head>
<body>
  <header><div class="header-inner"><a href="#" class="logo">Markdown</a></div></header>
  <main>
    <article class="article-container visible" id="articleContainer">
      <div class="article-meta"><div class="date" id="articleDate"></div></div>
      <div class="article-content" id="articleContent"></div>
    </article>
  </main>
  <footer><p>mdview - A beautiful markdown viewer</p></footer>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
  <script>
    marked.setOptions({breaks:true,gfm:true,highlight:(code,lang)=>{if(lang&&hljs.getLanguage(lang)){try{return hljs.highlight(code,{language:lang}).value}catch(e){}}return hljs.highlightAuto(code).value}});
    const urlParams=new URLSearchParams(window.location.search);
    const fileParam=urlParams.get('file');
    if(fileParam){
      fetch(fileParam).then(r=>r.text()).then(md=>{
        document.getElementById('articleContent').innerHTML=marked.parse(md);
        document.getElementById('articleDate').textContent=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
        const h1=document.querySelector('.article-content h1');
        if(h1)document.title=h1.textContent+' — Markdown Viewer';
        document.querySelectorAll('pre code').forEach(b=>{if(!b.classList.contains('hljs'))hljs.highlightElement(b)});
      });
    }
  </script>
</body>
</html>`;

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: mdview <file.md>");
  console.log("Opens a markdown file in a beautiful viewer");
  process.exit(1);
}

const filePath = resolve(args[0]);
const fileDir = dirname(filePath);
const fileName = basename(filePath);

let mdContent: string;
try {
  mdContent = readFileSync(filePath, "utf-8");
} catch {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

const port = 8420 + Math.floor(Math.random() * 80);

const server = Bun.serve({
  port,
  fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Serve index.html
    if (path === "/" || path === "/index.html") {
      return new Response(HTML_CONTENT, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Serve the markdown file
    if (path === `/${fileName}`) {
      return new Response(mdContent, {
        headers: { "Content-Type": "text/markdown" },
      });
    }

    // Serve other files from the markdown file's directory (for images)
    try {
      const localPath = resolve(fileDir, path.slice(1));
      const file = Bun.file(localPath);
      return new Response(file);
    } catch {
      return new Response("Not found", { status: 404 });
    }
  },
});

const openUrl = `http://localhost:${port}/?file=${encodeURIComponent(fileName)}`;
console.log(`Opening ${fileName}...`);

// Open browser
const platform = process.platform;
if (platform === "darwin") {
  spawn("open", [openUrl]);
} else if (platform === "linux") {
  spawn("xdg-open", [openUrl]);
} else if (platform === "win32") {
  spawn("cmd", ["/c", "start", openUrl]);
}

console.log(`Server: http://localhost:${port}`);
console.log("Press Ctrl+C to stop");

process.on("SIGINT", () => {
  server.stop();
  process.exit(0);
});
