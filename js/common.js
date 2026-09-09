/* ============================================================
   common.js — shared behavior for EEE 133 lecture site
   ============================================================ */
(function () {
  "use strict";

  var LS_KEY = "e133.state.v1";

  /* ---------- state ---------- */
  function loadState() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveState(s) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function lecState(key) {
    var s = loadState();
    if (!s[key]) s[key] = { depth: 0, done: false, quiz: {} };
    return s[key];
  }
  function setLecState(key, patch) {
    var s = loadState();
    if (!s[key]) s[key] = { depth: 0, done: false, quiz: {} };
    Object.keys(patch).forEach(function (k) { s[key][k] = patch[k]; });
    saveState(s);
  }

  var LEC_KEY = document.body ? document.body.dataset.lecture || "" : "";

  /* ---------- theme ---------- */
  var savedTheme = null;
  try { savedTheme = localStorage.getItem("e133.theme"); } catch (e) {}
  var theme = savedTheme || "light";
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var btn = document.getElementById("themeBtn");
    if (btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
    (window.__e133Redraw || []).forEach(function (fn) { try { fn(); } catch (e) {} });
  }
  applyTheme(theme);
  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest ? ev.target.closest("#themeBtn") : null;
    if (!btn) return;
    theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem("e133.theme", theme); } catch (e) {}
    applyTheme(theme);
  });

  /* ---------- TOC scrollspy ---------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
  var sections = tocLinks
    .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
    .filter(Boolean);

  function setActive(id) {
    tocLinks.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + id);
    });
  }

  if (sections.length && "IntersectionObserver" in window) {
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        visible[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0;
      });
      var best = null, bestTop = Infinity;
      sections.forEach(function (sec) {
        if (visible[sec.id]) {
          var top = sec.getBoundingClientRect().top;
          if (top < bestTop) { bestTop = top; best = sec.id; }
        }
      });
      if (best) setActive(best);
    }, { rootMargin: "-72px 0px -55% 0px", threshold: [0, 0.1, 0.5] });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- reading depth (progress) ---------- */
  var pill = document.getElementById("progPill");
  function updatePill() {
    if (!pill || !LEC_KEY) return;
    var st = lecState(LEC_KEY);
    var pct = Math.round((st.depth || 0) * 100);
    pill.textContent = "Read " + pct + "%" + (st.done ? " ✓" : "");
  }

  if (LEC_KEY) {
    var depthTimer = null;
    window.addEventListener("scroll", function () {
      if (depthTimer) return;
      depthTimer = setTimeout(function () {
        depthTimer = null;
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        var d = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
        var cur = lecState(LEC_KEY);
        if (d > (cur.depth || 0) + 0.005) {
          setLecState(LEC_KEY, { depth: d });
          updatePill();
        }
      }, 250);
    }, { passive: true });
    updatePill();
  }

  /* ---------- worked-example accordions ---------- */
  Array.prototype.slice.call(document.querySelectorAll(".step > .step-head")).forEach(function (head) {
    head.addEventListener("click", function () {
      head.parentElement.classList.toggle("open");
    });
  });

  /* ---------- quiz engine ----------
     <div class="quiz" data-quiz="l02">
       <div class="quiz-q" data-answer="1" data-expl="...">
         <div class="q">...</div>
         <div class="quiz-opts">
           <button class="quiz-opt">...</button> xN
         </div>
         <div class="quiz-expl"></div>
       </div>
     </div>
  */
  Array.prototype.slice.call(document.querySelectorAll(".quiz")).forEach(function (quizEl) {
    var name = quizEl.dataset.quiz || "quiz";
    var qs = Array.prototype.slice.call(quizEl.querySelectorAll(".quiz-q"));
    var scoreEl = quizEl.querySelector(".quiz-score");

    qs.forEach(function (qEl) {
      var correct = parseInt(qEl.dataset.answer, 10);
      var opts = Array.prototype.slice.call(qEl.querySelectorAll(".quiz-opt"));
      var expl = qEl.querySelector(".quiz-expl");
      var answered = false;

      opts.forEach(function (opt, oi) {
        opt.addEventListener("click", function () {
          if (answered) return;
          answered = true;
          opts.forEach(function (o) { o.disabled = true; });
          if (oi === correct) opt.classList.add("correct");
          else { opt.classList.add("wrong"); opts[correct].classList.add("correct"); }

          if (expl) {
            var good = oi === correct;
            expl.innerHTML = '<b class="' + (good ? "good" : "bad") + '">' +
              (good ? "✔ Correct. " : "✘ Not quite. ") + "</b>" + (qEl.dataset.expl || "");
            expl.classList.add("show");
          }

          // score: a question counts only if the picked option was correct
          var st = LEC_KEY ? lecState(LEC_KEY) : { quiz: {} };
          var score = qs.filter(function (e) {
            return e.querySelector(".quiz-opt.correct") && !e.querySelector(".quiz-opt.wrong");
          }).length;
          st.quiz[name] = { score: score, total: qs.length };
          if (LEC_KEY) setLecState(LEC_KEY, { quiz: st.quiz });
          if (scoreEl) scoreEl.textContent = "Score: " + score + " / " + qs.length;
        });
      });
    });

    // restore saved score display (without revealing answers)
    if (LEC_KEY && scoreEl) {
      var saved = lecState(LEC_KEY).quiz[name];
      if (saved) scoreEl.textContent = "Score: " + saved.score + " / " + qs.length + " (best)";
    }
  });

  /* ---------- flashcards ---------- */
  Array.prototype.slice.call(document.querySelectorAll(".flashcard")).forEach(function (fc) {
    fc.addEventListener("click", function () { fc.classList.toggle("flipped"); });
  });

  /* ---------- mark-complete buttons ---------- */
  Array.prototype.slice.call(document.querySelectorAll("[data-mark-complete]")).forEach(function (btn) {
    var key = btn.dataset.markComplete;
    function refresh() {
      var done = !!lecState(key).done;
      btn.textContent = done ? "✓ Completed — tap to unmark" : "Mark lecture complete";
      btn.classList.toggle("primary", !done);
    }
    if (LEC_KEY) refresh();
    btn.addEventListener("click", function () {
      var st = lecState(key);
      st.done = !st.done;
      setLecState(key, { done: st.done });
      refresh();
      updatePill();
    });
  });

  /* ---------- dashboard refresh (index.html) ---------- */
  if (document.body.dataset.dashboard === "true") {
    var CARDS = [
      { key: "02", el: "lcard-02" },
      { key: "03", el: "lcard-03" },
      { key: "04", el: "lcard-04" },
      { key: "05", el: "lcard-05" },
      { key: "06", el: "lcard-06" }
    ];
    CARDS.forEach(function (c) {
      var card = document.getElementById(c.el);
      if (!card) return;
      var st = lecState(c.key);
      var pct = Math.round((st.depth || 0) * 100);
      if (st.done) pct = 100;
      var bar = card.querySelector(".bar-fill");
      if (bar) bar.style.width = pct + "%";
      var badge = card.querySelector(".done-badge");
      if (badge) badge.style.display = st.done ? "" : "none";
    });
    var overall = document.getElementById("overallPct");
    if (overall) {
      var sum = CARDS.reduce(function (acc, c) {
        var st = lecState(c.key);
        return acc + (st.done ? 1 : (st.depth || 0));
      }, 0);
      overall.textContent = Math.round((sum / CARDS.length) * 100) + "%";
    }
  }

  /* ---------- formula auto-fit (keep wide equations from scrolling) ---------- */
  function fitFormulas() {
    Array.prototype.slice.call(document.querySelectorAll(".formula")).forEach(function (box) {
      var m = box.querySelector("mjx-container");
      if (!m) return;
      var line = m.querySelector("mjx-mrow") || m;
      m.style.transform = "";
      m.style.height = "";
      var avail = box.clientWidth - 46;                 /* horizontal padding + slack */
      var w = line.offsetWidth;
      if (w > 0 && isFinite(avail) && w > avail) {
        var s = avail / w;
        var h = m.offsetHeight;
        m.style.display = "block";
        m.style.transformOrigin = "top center";
        m.style.transform = "scale(" + s + ")";
        m.style.height = Math.round(h * s) + "px";
      }
    });
  }
  if (document.querySelectorAll(".formula").length) {
    var fitTries = 0;
    (function queueFit() {
      if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
        MathJax.startup.promise.then(function () { fitFormulas(); });
      } else if (++fitTries < 50) {                     /* give up after ~6 s */
        setTimeout(queueFit, 120);
      }
    })();
    var fitRt = null;
    window.addEventListener("resize", function () {
      if (fitRt) return;
      fitRt = setTimeout(function () { fitRt = null; fitFormulas(); }, 150);
    });
  }

  /* ---------- expose redraw registry ---------- */
  window.E133 = {
    onRedraw: function (fn) { (window.__e133Redraw = window.__e133Redraw || []).push(fn); },
    state: loadState,
    fmt: window.Plot ? Plot.fmt : String
  };
})();
