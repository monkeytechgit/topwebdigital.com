/* Top Web Digital — main.js (sin dependencias) */
(function () {
  "use strict";
  var CFG = window.TWD || {};
  var T = CFG.t || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  var locale = CFG.lang === "en" ? "en-US" : "es-MX";
  var waLink = function (msg) { return "https://wa.me/" + CFG.wa + "?text=" + encodeURIComponent(msg); };

  /* ---------- Toast ---------- */
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("is-on");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3200);
  }

  /* ---------- Header, progreso, flotantes ---------- */
  var header = $(".header"), prog = $(".progress-top"), toTop = $(".to-top"), mcta = $(".mobile-cta");
  var ticking = false;
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (header) header.classList.toggle("is-scrolled", y > 10);
    if (prog) prog.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    if (toTop) toTop.classList.toggle("is-on", y > 900);
    if (mcta) mcta.classList.toggle("is-on", y > 520);
    ticking = false;
  }
  addEventListener("scroll", function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* ---------- Barra superior ---------- */
  var topbar = $(".topbar");
  if (topbar) {
    if (store.get("twd-topbar") === "x") topbar.remove();
    var close = $(".topbar__close", topbar);
    if (close) close.addEventListener("click", function () { topbar.style.transition = "opacity .3s"; topbar.style.opacity = "0"; setTimeout(function () { topbar.remove(); }, 300); store.set("twd-topbar", "x"); });
    // lugares disponibles: 5 por semana, bajan según el día
    var d = new Date().getDay(); var left = [4, 5, 4, 3, 3, 2, 2][d];
    $$(".js-spots").forEach(function (el) { el.textContent = left; });
    $$(".topbar__spots i").forEach(function (i, n) { i.classList.toggle("on", n < left); });
  }

  /* ---------- Mega menú ---------- */
  var items = $$(".nav__item.has-mega");
  function closeAll(except) { items.forEach(function (it) { if (it !== except) { it.classList.remove("is-open"); var b = $(".nav__link", it); if (b) b.setAttribute("aria-expanded", "false"); } }); }
  items.forEach(function (it) {
    var btn = $(".nav__link", it), t;
    var open = function () { clearTimeout(t); closeAll(it); it.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); };
    var shut = function () { t = setTimeout(function () { it.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }, 160); };
    it.addEventListener("mouseenter", function () { if (matchMedia("(hover:hover)").matches) open(); });
    it.addEventListener("mouseleave", function () { if (matchMedia("(hover:hover)").matches) shut(); });
    btn.addEventListener("click", function (e) { e.preventDefault(); it.classList.contains("is-open") ? (it.classList.remove("is-open"), btn.setAttribute("aria-expanded", "false")) : open(); });
    it.addEventListener("focusout", function (e) { if (!it.contains(e.relatedTarget)) shut(); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeAll(); closeMenu(); closeModal(); } });
  document.addEventListener("click", function (e) { if (!e.target.closest(".nav__item")) closeAll(); });

  /* ---------- Menú móvil ---------- */
  var burger = $(".burger");
  function closeMenu() { document.documentElement.classList.remove("is-menu-open"); if (burger) burger.setAttribute("aria-expanded", "false"); }
  if (burger) {
    burger.addEventListener("click", function () {
      var o = document.documentElement.classList.toggle("is-menu-open");
      burger.setAttribute("aria-expanded", String(o));
    });
    $$(".drawer__scrim, .drawer a").forEach(function (el) { el.addEventListener("click", closeMenu); });
  }

  /* ---------- Revelado al hacer scroll ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("is-in"); en.target.dispatchEvent(new CustomEvent("inview")); io.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .12 }) : null;
  function watch(el) { if (io && !reduce) io.observe(el); else { el.classList.add("is-in"); el.dispatchEvent(new CustomEvent("inview")); } }
  $$(".rv, .steps, [data-count], .goal-panel:not([hidden])").forEach(watch);
  // red de seguridad: si algo quedó oculto, mostrarlo
  setTimeout(function () { $$(".rv:not(.is-in)").forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add("is-in"); }); }, 1200);

  /* ---------- Contadores ---------- */
  $$("[data-count]").forEach(function (el) {
    var end = parseFloat(el.dataset.count), dec = (el.dataset.count.split(".")[1] || "").length, pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    var fmt = function (v) { return pre + v.toLocaleString(locale, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
    el.textContent = fmt(reduce ? end : 0);
    el.addEventListener("inview", function () {
      if (reduce) return;
      var t0 = performance.now(), dur = 1600;
      (function step(t) { var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(end * e); if (p < 1) requestAnimationFrame(step); })(t0);
    });
  });

  /* ---------- Simulación de Google (hero) ---------- */
  var serp = $(".serp[data-serp]");
  if (serp) {
    var data = JSON.parse(serp.dataset.serp), qEl = $(".serp__q", serp), list = $(".serp__list", serp), urlEl = $(".serp__url", serp);
    var chips = $$(".serp__chips .chip", serp.parentNode), H = 92, cur = 0, timers = [], auto = true;
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function render(sc) {
      list.innerHTML = "";
      var all = sc.r.map(function (r) { return { t: r[0], c: r[1], d: r[2], s: r[3], you: false }; });
      all.push({ t: sc.you[0], c: sc.you[1], d: sc.you[2], s: sc.you[3], you: true });
      all.forEach(function (r, i) {
        var li = document.createElement("li");
        li.className = "serp__item" + (r.you ? " is-you" : "");
        li.innerHTML = '<span class="serp__pos tnum">' + (i + 1) + '</span><div><div class="serp__cite"><i class="serp__fav"></i>' + r.c + '</div><div class="serp__t">' + r.t + '</div><div class="serp__rating"><b>★★★★★</b> ' + r.s + '</div><div class="serp__d">' + r.d + '</div></div>' + (r.you ? '<span class="serp__badge">' + (T.top || "#1 en Google") + "</span>" : "");
        list.appendChild(li); r.el = li;
      });
      return all;
    }
    function place(order) {
      order.forEach(function (r, i) { r.el.style.transform = "translateY(" + i * H + "px)"; $(".serp__pos", r.el).textContent = i + 1; r.el.style.opacity = i > 3 ? (r.you ? ".85" : "0") : "1"; });
    }
    function play(n) {
      clear(); cur = n; var sc = data[n];
      chips.forEach(function (c, i) { c.setAttribute("aria-pressed", String(i === n)); });
      var order = render(sc); var you = order[order.length - 1];
      H = 0; order.forEach(function (r) { H = Math.max(H, r.el.offsetHeight); }); H += 6;
      list.style.height = (4 * H) + "px";
      place(order);
      if (urlEl) urlEl.textContent = "google.com/search?q=" + sc.q.replace(/ /g, "+");
      // escritura
      qEl.textContent = "";
      var i = 0;
      if (reduce) { qEl.textContent = sc.q; finish(); return; }
      (function type() { if (i <= sc.q.length) { qEl.textContent = sc.q.slice(0, i++); later(type, 45 + Math.random() * 40); } else later(climb, 700); })();
      function climb() {
        var p = order.length - 1;
        (function up() {
          if (p === 0) return finish();
          var tmp = order[p - 1]; order[p - 1] = order[p]; order[p] = tmp; p--;
          place(order); later(up, p === 0 ? 300 : 520);
        })();
      }
      function finish() {
        if (reduce) { order.unshift(order.pop()); place(order); }
        you.el.classList.add("is-top");
        if (auto) later(function () { play((cur + 1) % data.length); }, 4200);
      }
    }
    chips.forEach(function (c, i) { c.addEventListener("click", function () { auto = false; play(i); }); });
    var started = false;
    var so = "IntersectionObserver" in window ? new IntersectionObserver(function (e) { if (e[0].isIntersecting && !started) { started = true; play(0); } }) : null;
    so ? so.observe(serp) : play(0);
  }

  /* ---------- Tabs de objetivos ---------- */
  $$("[data-tabs]").forEach(function (root) {
    var tabs = $$('[role="tab"]', root);
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i); });
      tab.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); select((i + 1) % tabs.length, true); }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
      });
    });
    function select(n, focus) {
      tabs.forEach(function (t, i) {
        var on = i === n, p = document.getElementById(t.getAttribute("aria-controls"));
        t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
        if (p) { p.hidden = !on; p.classList.remove("is-in"); if (on) { void p.offsetWidth; p.classList.add("is-in"); } }
      });
      if (focus) tabs[n].focus();
    }
  });

  /* ---------- Antes / después ---------- */
  $$(".ba").forEach(function (ba) {
    var r = $(".ba__range", ba), touched = false, drag = false;
    var set = function (v) { v = Math.max(0, Math.min(100, v)); ba.style.setProperty("--pos", v + "%"); r.value = Math.round(v); };
    var fromX = function (x) { var b = ba.getBoundingClientRect(); set((x - b.left) / b.width * 100); };
    // Arrastre con mouse, dedo o pluma sobre toda la imagen
    ba.addEventListener("pointerdown", function (e) {
      if (e.button > 0) return; touched = drag = true; ba.classList.add("is-drag");
      try { ba.setPointerCapture(e.pointerId); } catch (_) {}
      fromX(e.clientX); e.preventDefault();
    });
    ba.addEventListener("pointermove", function (e) { if (drag) fromX(e.clientX); });
    var end = function () { drag = false; ba.classList.remove("is-drag"); };
    ba.addEventListener("pointerup", end); ba.addEventListener("pointercancel", end); ba.addEventListener("lostpointercapture", end);
    // Teclado (flechas) mediante el input accesible
    r.addEventListener("input", function () { touched = true; set(+r.value); });
    set(+r.value);
    // pequeño "guiño" para invitar a arrastrar (se cancela si el usuario ya interactuó)
    ba.addEventListener("inview", function () {
      if (reduce) return; var t0 = performance.now();
      (function wig(t) { if (touched) return; var p = (t - t0) / 1400; if (p > 1) { set(50); return; } set(50 + Math.sin(p * Math.PI * 2) * 14 * (1 - p)); requestAnimationFrame(wig); })(t0);
    });
    watch(ba);
  });

  /* ---------- Filtro de portafolio ---------- */
  $$("[data-filter]").forEach(function (bar) {
    var btns = $$(".chip", bar), grid = document.getElementById(bar.dataset.filter);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        var f = b.dataset.f;
        $$(".case", grid).forEach(function (c) {
          var show = f === "all" || c.dataset.cat.indexOf(f) > -1;
          c.classList.toggle("is-hidden", !show); c.classList.remove("is-showing");
          if (show) { void c.offsetWidth; c.classList.add("is-showing"); }
        });
      });
    });
  });

  /* ---------- Toggle (precios) ---------- */
  $$("[data-toggle]").forEach(function (tg) {
    var btns = $$("button", tg), pill = $(".toggle__pill", tg);
    function sel(b) {
      btns.forEach(function (x) { var on = x === b; x.setAttribute("aria-pressed", String(on)); var p = document.getElementById(x.dataset.panel); if (p) { p.hidden = !on; if (on) { p.classList.remove("is-showing"); void p.offsetWidth; p.classList.add("is-showing"); } } });
      if (pill) { pill.style.width = b.offsetWidth + "px"; pill.style.transform = "translateX(" + (b.offsetLeft - 4) + "px)"; }
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { sel(b); }); });
    var first = btns.filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })[0] || btns[0];
    requestAnimationFrame(function () { sel(first); });
    addEventListener("resize", function () { sel(btns.filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })[0]); });
  });

  /* ---------- Rangos (relleno) ---------- */
  function fill(r) { r.style.setProperty("--fill", ((r.value - r.min) / (r.max - r.min) * 100) + "%"); }
  $$('input[type="range"]').forEach(function (r) { fill(r); r.addEventListener("input", function () { fill(r); }); });

  /* ---------- Calculadora de pérdida ---------- */
  var calc = $("[data-calc]");
  if (calc) {
    var cur$ = calc.dataset.currency || "MXN";
    var money = function (v) { return v.toLocaleString(locale, { style: "currency", currency: cur$, maximumFractionDigits: 0 }); };
    var ins = $$("input", calc), outLoss = $(".calc__loss", calc), outYear = $(".calc__year", calc), outLeads = $(".js-leads", calc);
    var shown = 0;
    // Escala progresiva (data-lmin/data-lmax): fina en montos bajos, rápida en montos altos
    function val(i) {
      if (!i.dataset.lmax) return +i.value;
      var lo = +i.dataset.lmin, hi = +i.dataset.lmax, p = (+i.value - +i.min) / (+i.max - +i.min);
      if (p >= 1) return hi;
      var x = lo * Math.pow(hi / lo, p), st = Math.pow(10, Math.max(0, Math.floor(Math.log10(x)) - 1));
      return Math.max(lo, Math.round(x / st) * st);
    }
    function run() {
      var v = {}; ins.forEach(function (i) { var x = val(i); v[i.name] = x; var o = $('output[for="' + i.id + '"]', calc); if (o) o.textContent = i.dataset.money ? money(x) : x.toLocaleString(locale) + (i.dataset.suf || ""); });
      // 0.30 = parte de los clics que se lleva el top 3 local; supuesto mostrado en la nota
      var leads = Math.round(v.searches * 0.30 * (v.conv / 100));
      var loss = Math.round(leads * (v.close / 100) * v.ticket);
      outLeads.textContent = leads.toLocaleString(locale);
      outYear.textContent = money(loss * 12);
      var from = shown, t0 = performance.now(); shown = loss;
      if (reduce) { outLoss.textContent = money(loss); return; }
      (function step(t) { var p = Math.min(1, (t - t0) / 500), e = 1 - Math.pow(1 - p, 3); outLoss.textContent = money(Math.round(from + (loss - from) * e)); if (p < 1) requestAnimationFrame(step); })(t0);
    }
    ins.forEach(function (i) { i.addEventListener("input", run); });
    run();
  }

  /* ---------- Cotizador ---------- */
  var wiz = $("[data-wizard]");
  if (wiz) {
    var steps = $$(".wiz-step", wiz), bar = $(".progress span", wiz), idx = 0, P = JSON.parse(wiz.dataset.prices);
    var back = $(".js-back", wiz), next = $(".js-next", wiz), count = $(".js-stepn", wiz);
    function show(n, dir) {
      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === n); s.classList.toggle("is-back", dir < 0); });
      idx = n; bar.style.width = ((n + 1) / steps.length * 100) + "%";
      if (count) count.textContent = (n + 1) + " / " + steps.length;
      back.hidden = n === 0 || n === steps.length - 1;
      next.hidden = n >= steps.length - 2 && n === steps.length - 1;
      next.textContent = n === steps.length - 2 ? (T.seePrice || "Ver mi precio") : (T.next || "Siguiente");
      if (n === steps.length - 1) { next.hidden = true; estimate(); }
    }
    function val(name) { var c = $$('input[name="' + name + '"]:checked', wiz); return c.map(function (x) { return x.value; }); }
    function estimate() {
      var type = val("q_type")[0] || "info", pages = val("q_pages")[0] || "1-5", extras = val("q_extra"), speed = val("q_time")[0] || "normal";
      var lo = P.base[type][0], hi = P.base[type][1];
      lo += P.pages[pages][0]; hi += P.pages[pages][1];
      extras.forEach(function (x) { lo += P.extra[x][0]; hi += P.extra[x][1]; });
      if (speed === "rush") { lo *= 1.2; hi *= 1.2; }
      var r = function (v) { return Math.round(v / 100) * 100; };
      var fmt = function (v) { return v.toLocaleString(locale, { style: "currency", currency: P.cur, maximumFractionDigits: 0 }); };
      var txt = fmt(r(lo)) + " – " + fmt(r(hi));
      $(".estimate__range", wiz).textContent = txt + " " + P.cur;
      var labels = $$("input:checked", wiz).map(function (x) { return x.dataset.label; });
      $(".estimate__sum", wiz).innerHTML = labels.map(function (l) { return "<span>" + l + "</span>"; }).join("");
      var msg = (T.waQuote || "Hola, usé el cotizador de su sitio. Me interesa:") + "\n• " + labels.join("\n• ") + "\n" + (T.range || "Rango estimado") + ": " + txt + " " + P.cur;
      $(".js-wa-quote", wiz).href = waLink(msg);
      var hid = $('input[name="resumen"]', wiz.parentNode); if (hid) hid.value = msg;
    }
    next.addEventListener("click", function () {
      var cur = steps[idx];
      if ($$("input", cur).length && !$$("input:checked", cur).length && !cur.hasAttribute("data-optional")) { toast(T.pick || "Elige una opción para continuar"); cur.animate && !reduce && cur.animate([{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }], { duration: 300 }); return; }
      if (idx < steps.length - 1) show(idx + 1, 1);
    });
    back.addEventListener("click", function () { if (idx > 0) show(idx - 1, -1); });
    $$(".js-restart", wiz).forEach(function (b) { b.addEventListener("click", function () { $$("input", wiz).forEach(function (i) { i.checked = false; }); show(0, -1); }); });
    // avanzar solo al elegir (preguntas de una sola opción)
    $$('.wiz-step input[type="radio"]', wiz).forEach(function (i) { i.addEventListener("change", function () { setTimeout(function () { if (idx < steps.length - 2) show(idx + 1, 1); }, 280); }); });
    show(0, 1);
  }

  /* ---------- Auditoría gratis (Google PageSpeed Insights) ---------- */
  var audit = $("[data-audit]");
  if (audit) {
    var form = $("form", audit), res = $(".js-audit-res", audit), scan = $$(".scan li", audit), gauges = $$(".gauge", audit), err = $(".js-audit-err", audit);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var url = form.url.value.trim(); if (!/^https?:\/\//i.test(url)) url = "https://" + url;
      try { new URL(url); } catch (x) { toast(T.badUrl || "Escribe una dirección válida, por ejemplo minegocio.com"); return; }
      res.hidden = false; err.hidden = true; scan.forEach(function (l) { l.classList.remove("is-done"); });
      gauges.forEach(function (g) { $(".g-fg", g).style.strokeDashoffset = 289; $(".gauge__n", g).textContent = "–"; });
      var k = 0, sTimer = setInterval(function () { if (k < scan.length - 1) scan[k++].classList.add("is-done"); }, 1400);
      var api = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=" + encodeURIComponent(url) + "&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices&locale=" + (CFG.lang === "en" ? "en" : "es");
      fetch(api).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
        clearInterval(sTimer); scan.forEach(function (l) { l.classList.add("is-done"); });
        var c = j.lighthouseResult.categories, keys = ["performance", "seo", "accessibility", "best-practices"];
        gauges.forEach(function (g, i) {
          var s = Math.round((c[keys[i]] || { score: 0 }).score * 100), fg = $(".g-fg", g);
          fg.style.stroke = s >= 90 ? "var(--up)" : s >= 50 ? "#f59e0b" : "#ef4444";
          requestAnimationFrame(function () { fg.style.strokeDashoffset = 289 - 289 * s / 100; });
          var n = $(".gauge__n", g), t0 = performance.now();
          (function st(t) { var p = Math.min(1, (t - t0) / 1400); n.textContent = Math.round(s * p); if (p < 1) requestAnimationFrame(st); })(t0);
        });
        $(".js-audit-wa", audit).href = waLink((T.waAudit || "Hola, hice la auditoría gratis de mi sitio y quiero el reporte completo: ") + url);
      }).catch(function () {
        clearInterval(sTimer); err.hidden = false;
        $(".js-audit-wa", audit).href = waLink((T.waAudit || "Hola, quiero la auditoría gratis de mi sitio: ") + url);
      });
    });
  }

  /* ---------- FAQ con animación de altura ---------- */
  $$(".faq details").forEach(function (d) {
    var s = $("summary", d), a = $(".faq__a", d);
    s.addEventListener("click", function (e) {
      if (reduce || !a.animate) return;
      e.preventDefault();
      if (d.open) {
        var h = a.offsetHeight; var an = a.animate([{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 300, easing: "cubic-bezier(.2,.8,.2,1)" });
        d.classList.add("is-closing"); an.onfinish = function () { d.open = false; d.classList.remove("is-closing"); };
      } else {
        d.open = true; var h2 = a.offsetHeight; a.animate([{ height: "0px", opacity: 0 }, { height: h2 + "px", opacity: 1 }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
      }
    });
  });

  /* ---------- Modal (demos por giro, videos) ---------- */
  var modal = $(".modal"), lastFocus;
  function openModal(html) {
    if (!modal) return; lastFocus = document.activeElement;
    $(".modal__content", modal).innerHTML = html; modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden"; setTimeout(function () { $(".modal__close", modal).focus(); }, 50);
  }
  function closeModal() { if (!modal || !modal.classList.contains("is-open")) return; modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); document.documentElement.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  if (modal) { $$(".modal__close, .modal__scrim", modal).forEach(function (b) { b.addEventListener("click", closeModal); }); }
  document.addEventListener("click", function (e) {
    var d = e.target.closest("[data-demo]");
    if (d) { e.preventDefault(); var tp = document.getElementById("demo-" + d.dataset.demo); if (tp) openModal(tp.innerHTML); return; }
    var v = e.target.closest("[data-video]");
    if (v && v.dataset.video) { e.preventDefault(); openModal('<video src="' + v.dataset.video + '" controls autoplay playsinline style="width:100%;border-radius:16px"></video>'); }
  });

  /* ---------- Formularios ---------- */
  $$("form[data-lead]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var fd = new FormData(f), obj = {}; fd.forEach(function (v, k) { obj[k] = v; });
      obj.pagina = location.href;
      var btn = $('button[type="submit"]', f), txt = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = T.sending || "Enviando…"; }
      var done = function () { f.classList.add("is-sent"); if (btn) { btn.disabled = false; btn.textContent = txt; } if (window.gtag) gtag("event", "generate_lead", { form: f.dataset.lead }); };
      if (CFG.endpoint) {
        fetch(CFG.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(obj) })
          .then(function (r) { if (!r.ok) throw 0; done(); })
          .catch(function () { if (btn) { btn.disabled = false; btn.textContent = txt; } toast(T.formErr || "No se pudo enviar. Escríbenos por WhatsApp."); });
      } else {
        // Sin servidor configurado: el mensaje se arma y se abre en WhatsApp
        var lines = Object.keys(obj).filter(function (k) { return obj[k] && k !== "pagina"; }).map(function (k) { return k + ": " + obj[k]; });
        window.open(waLink((T.waForm || "Hola, les escribo desde su sitio web.") + "\n" + lines.join("\n")), "_blank", "noopener");
        done();
      }
    });
  });

  /* ---------- WhatsApp flotante: sugerencia ---------- */
  var wa = $(".wa-float");
  if (wa && store.get("twd-wa") !== "1") { setTimeout(function () { wa.classList.add("is-hint"); store.set("twd-wa", "1"); setTimeout(function () { wa.classList.remove("is-hint"); }, 7000); }, 9000); }

  /* ---------- Velocidad real de esta página ---------- */
  addEventListener("load", function () {
    setTimeout(function () {
      var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      var ms = nav ? nav.domContentLoadedEventEnd : (performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart);
      if (ms > 0) $$(".js-speed").forEach(function (el) { el.textContent = (ms / 1000).toLocaleString(locale, { maximumFractionDigits: 2 }); });
    }, 0);
  });

  /* ---------- Artículos: índice activo y barra de lectura ---------- */
  var rb = $(".reading-bar"), art = $(".prose");
  if (rb && art) {
    addEventListener("scroll", function () { var r = art.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); rb.style.transform = "scaleX(" + p + ")"; }, { passive: true });
    var links = $$(".toc a"), heads = links.map(function (a) { return document.getElementById(a.hash.slice(1)); }).filter(Boolean);
    if ("IntersectionObserver" in window) {
      var ho = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle("is-active", a.hash === "#" + e.target.id); }); }); }, { rootMargin: "-20% 0px -70% 0px" });
      heads.forEach(function (h) { ho.observe(h); });
    }
  }

  /* ---------- Copiar al portapapeles ---------- */
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(T.copied || "Copiado"); }).catch(function () { toast(t); });
    });
  });

  /* ---------- Transición al salir (si no hay View Transitions) ---------- */
  if (!("onpagereveal" in window) && !reduce) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a"); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank" || a.hasAttribute("download")) return;
      var u; try { u = new URL(a.href); } catch (x) { return; }
      if (u.origin !== location.origin || u.hash && u.pathname === location.pathname) return;
      e.preventDefault(); document.body.classList.add("is-leaving"); setTimeout(function () { location.href = a.href; }, 180);
    });
    addEventListener("pageshow", function () { document.body.classList.remove("is-leaving"); });
  }

  $$(".js-year").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
