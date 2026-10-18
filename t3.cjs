const { chromium } = require("playwright");
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:800}});
  await p.goto("http://127.0.0.1:3102/",{waitUntil:"domcontentloaded"}); await p.waitForTimeout(4000);
  await p.getByRole("button",{name:/Amostragem GEE/i}).first().click(); await p.waitForTimeout(700);
  console.log("dialogos:", await p.locator('[role="dialog"]').count(), "| foco ao abrir:", await p.evaluate(()=>document.activeElement.tagName+" "+(document.activeElement.closest("[role=dialog]")?"no-dialogo":"fora")));
  const inputs = p.locator('[role="dialog"] input'); console.log("inputs:", await inputs.count());
  const inp = inputs.first(); await inp.click(); await inp.fill(""); await p.keyboard.type("1234",{delay:150}); await p.waitForTimeout(500);
  console.log("valor:", JSON.stringify(await inp.inputValue()), "| foco:", JSON.stringify(await p.evaluate(()=>({tag:document.activeElement.tagName,type:document.activeElement.getAttribute("type")}))));
  // Tab preso no dialogo
  for (let i=0;i<30;i++) await p.keyboard.press("Tab");
  console.log("apos 30 Tab, foco dentro do dialogo:", await p.evaluate(()=>!!document.activeElement.closest("[role=dialog]")));
  await p.keyboard.press("Escape"); await p.waitForTimeout(500);
  console.log("apos Escape dialogos:", await p.locator('[role="dialog"]').count(), "| foco:", await p.evaluate(()=>document.activeElement.tagName+" "+(document.activeElement.getAttribute("aria-label")||"").slice(0,30)));
  await b.close();
})();
