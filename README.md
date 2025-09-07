# Camera Proxy Server

A simple Node.js + Express proxy that fetches camera stream from an HTTP source and exposes it over HTTPS (via Render.com).

### Proxy target:
http://85.173.234.243/site/embed.html?id=5517&html5

### Live Proxy Endpoint (after deploy):
https://camera-proxy-viro.onrender.com

---

##  One‑click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

##  Embed example

```html
<iframe
  src="https://camera-proxy-viro.onrender.com"
  width="640"
  height="480"
  frameborder="0"
  allowfullscreen>
</iframe>
