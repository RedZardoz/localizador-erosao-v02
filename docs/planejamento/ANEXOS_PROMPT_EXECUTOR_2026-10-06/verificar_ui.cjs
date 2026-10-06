// Verificacao automatica de front-end do SAREL v2 (Playwright). Uso:
//   node verificar_ui.cjs http://127.0.0.1:3000 <saida.json>
// Requer o app rodando (npm run dev ou npm start) e o pacote 'playwright' resolvivel
// (NODE_PATH=$(npm root -g) se instalado globalmente). Sai com codigo 1 se houver falha.
const { chromium } = require("playwright");
const fs = require("fs");
const base = process.argv[2] || "http://127.0.0.1:3000";
const saida = process.argv[3] || "ui_resultado.json";
const LARGURAS = [1440, 1280, 1024, 768, 390];
const MODAIS = [
  ["Amostragem GEE", /Amostragem GEE|Triagem Amostral/i],
  ["Campanha & Rótulos", /Campanha/i],
  ["Matriz de Treino", /Matriz de Treino|Montagem da Matriz/i],
  ["Configurações", /Configurações/i],
  ["Exportar", /^Exportar|Exportar dados/i],
];
const PROIBIDOS = [
  [/10 invariantes/i, "U06: numero de invariantes defasado"],
  [/Erosão Laminar \(Classe 1\)/, "C20: limiar espectral exibido como classe"],
  [/Padrão-Ouro 10-50/i, "U05: legenda defasada (D16 = 72 poligonos de 5,02 ha)"],
  [/Aguardando Decisão D13/, "C15: D13 esta decidida"],
  [/Calcular Métricas Matriciais/, "C19: metricas de demonstracao sem selo"],
  [/Perito SAREL Coletor/, "C25: observador padrao do sistema"],
];
(async () => {
  const falhas = [], medidas = {};
  const b = await chromium.launch();
  for (const w of LARGURAS) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    const erros = []; p.on("pageerror", (e) => erros.push(String(e).slice(0, 200)));
    const r = await p.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(3500);
    if (!r || r.status() !== 200) falhas.push(`${w}px: HTTP ${r && r.status()}`);
    const m = await p.evaluate(() => {
      const h = document.querySelector("header");
      const bs = h ? [...h.querySelectorAll("button,a,[role=button]")] : [];
      const fora = bs.filter((x) => { const q = x.getBoundingClientRect(); return q.width > 0 && (q.right > innerWidth + 1 || q.left < -1); })
        .map((x) => (x.innerText || x.title || x.getAttribute("aria-label") || "?").trim().slice(0, 30));
      const pequenos = [...document.querySelectorAll("button,a,input,select,[role=button]")].filter((x) => {
        const q = x.getBoundingClientRect(); return q.width > 0 && q.height > 0 && (q.width < 24 || q.height < 24); }).length;
      return { sw: document.documentElement.scrollWidth, iw: innerWidth, fora, pequenos };
    });
    medidas[w] = { ...m, errosPagina: erros };
    if (m.fora.length) falhas.push(`${w}px: controles do cabecalho fora da tela: ${m.fora.join(" | ")}`);
    if (m.sw > m.iw + 1) falhas.push(`${w}px: rolagem horizontal da pagina (${m.sw} > ${m.iw})`);
    if (m.pequenos) falhas.push(`${w}px: ${m.pequenos} alvos menores que 24x24 px (WCAG 2.2, 2.5.8)`);
    await p.close();
  }
  // modais (somente 1440 px)
  for (const [nome, re] of MODAIS) {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 120000 }); await p.waitForTimeout(3500);
    const el = p.locator("header button, header a, button[title], button[aria-label]").filter({ hasText: re }).first();
    let alvo = el; if (!(await el.count())) alvo = p.locator(`[title*="${nome}"],[aria-label*="${nome}"]`).first();
    if (!(await alvo.count())) { falhas.push(`modal "${nome}": botao nao encontrado`); await p.close(); continue; }
    await alvo.click({ force: true, timeout: 5000 }).catch(() => {}); await p.waitForTimeout(2000);
    const info = await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      const raiz = d || [...document.querySelectorAll("div.fixed")].sort((a, b) => b.innerText.length - a.innerText.length)[0] || document.body;
      const sem = [...raiz.querySelectorAll("input,select,textarea,button")].filter((x) => {
        const nomeAcc = x.getAttribute("aria-label") || x.getAttribute("aria-labelledby") || x.title || (x.innerText || "").trim() ||
          (x.id && document.querySelector(`label[for="${CSS.escape(x.id)}"]`)) || x.closest("label");
        return !nomeAcc; }).length;
      return { temRole: !!d, ariaModal: d && d.getAttribute("aria-modal"), rotulo: d && (d.getAttribute("aria-label") || d.getAttribute("aria-labelledby")),
               semNome: sem, texto: document.body.innerText };
    });
    if (!info.temRole) falhas.push(`modal "${nome}": sem role="dialog"`);
    else { if (info.ariaModal !== "true") falhas.push(`modal "${nome}": sem aria-modal="true"`); if (!info.rotulo) falhas.push(`modal "${nome}": sem aria-label/aria-labelledby`); }
    if (info.semNome) falhas.push(`modal "${nome}": ${info.semNome} controles sem nome acessivel`);
    for (const [re2, motivo] of PROIBIDOS) if (re2.test(info.texto)) falhas.push(`modal "${nome}": texto proibido (${motivo})`);
    await p.keyboard.press("Escape"); await p.waitForTimeout(600);
    if (info.temRole && (await p.locator('[role="dialog"]').count())) falhas.push(`modal "${nome}": Escape nao fecha`);
    medidas["modal:" + nome] = { temRole: info.temRole, semNome: info.semNome };
    await p.close();
  }
  await b.close();
  fs.writeFileSync(saida, JSON.stringify({ base, falhas, medidas }, null, 1));
  console.log(falhas.length ? "FALHAS (" + falhas.length + "):\n - " + falhas.join("\n - ") : "UI OK");
  process.exit(falhas.length ? 1 : 0);
})();
