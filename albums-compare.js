/**
 * 1001 Albums Generator — group comparison widget
 * ------------------------------------------------
 * Companion to albums-widget.js. Fetches several projects and renders a
 * side-by-side comparison into <div id="albums-compare"></div>.
 *
 * Edit the PROJECTS list below to add/remove people. `page` is an optional
 * link to that person's own page on this site.
 *
 * Shares the same localStorage cache (10 min) as albums-widget.js, so
 * navigating between the individual pages and this one stays well inside
 * the API's 3 requests/minute limit. Requests are made one at a time.
 */
(function () {
  "use strict";

  var PROJECTS = [
    { id: "j125", label: "Jonny", page: "albums-jonny.html" },
    { id: "scuba-steves-music-journey", label: "Scuba Steve", page: "albums-steve.html" },
    { id: "chris-flaig", label: "Chris", page: "albums-chris.html" },
    { id: "slevin7", label: "Slevin", page: "albums-slevin.html" }
  ];

  var API_BASE = "https://1001albumsgenerator.com/api/v1/projects/";
  var CACHE_TTL_MS = 10 * 60 * 1000;
  var TOTAL_ALBUMS = 1001;

  var CSS = `
  .a1001c {
    color-scheme: light;
    --surface: #fcfcfb;
    --ink:     #0b0b0b;
    --ink-2:   #52514e;
    --muted:   #898781;
    --grid:    #e1e0d9;
    --border:  rgba(11, 11, 11, 0.10);
    --accent:  #2a78d6;
    --p1: #2a78d6; --p2: #1baf7a; --p3: #eda100; --p4: #008300;

    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 22px;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-width: 720px;
    line-height: 1.45;
  }
  @media (prefers-color-scheme: dark) {
    .a1001c {
      color-scheme: dark;
      --surface: #1a1a19;
      --ink:     #ffffff;
      --ink-2:   #c3c2b7;
      --muted:   #898781;
      --grid:    #2c2c2a;
      --border:  rgba(255, 255, 255, 0.10);
      --accent:  #3987e5;
      --p1: #3987e5; --p2: #199e70; --p3: #c98500; --p4: #008300;
    }
  }
  .a1001c * { box-sizing: border-box; margin: 0; }
  .a1001c a { color: var(--accent); text-decoration: none; }
  .a1001c a:hover { text-decoration: underline; }

  .a1001c-title { font-size: 1.05rem; font-weight: 700; margin-bottom: 18px; }

  .a1001c-section {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted);
    margin: 22px 0 10px; padding-top: 16px; border-top: 1px solid var(--grid);
  }
  .a1001c-section:first-of-type { margin-top: 0; padding-top: 0; border-top: none; }

  .a1001c-today {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }
  .a1001c-today-card {
    border: 1px solid var(--border); border-radius: 10px;
    padding: 10px; min-width: 0;
  }
  .a1001c-today-card img {
    width: 100%; aspect-ratio: 1; object-fit: cover;
    border-radius: 6px; border: 1px solid var(--border); margin-bottom: 8px;
  }
  .a1001c-person {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.78rem; font-weight: 700; margin-bottom: 3px;
  }
  .a1001c-person a { color: inherit; }
  .a1001c-dot {
    width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
  }
  .a1001c-today-album {
    font-size: 0.85rem; font-weight: 600;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .a1001c-today-artist {
    font-size: 0.76rem; color: var(--ink-2);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .a1001c-bars { display: grid; grid-template-columns: auto 1fr auto; gap: 8px 12px; align-items: center; }
  .a1001c-bar-label { font-size: 0.82rem; color: var(--ink-2); white-space: nowrap; }
  .a1001c-bar-label a { color: inherit; }
  .a1001c-track { height: 14px; background: var(--grid); border-radius: 4px; overflow: hidden; }
  .a1001c-track.bare { background: none; }
  .a1001c-fill { height: 100%; border-radius: 0 4px 4px 0; }
  .a1001c-bar-value { font-size: 0.82rem; color: var(--ink-2); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .a1001c-crown { font-size: 0.8rem; }

  .a1001c-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .a1001c-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .a1001c-table th, .a1001c-table td { padding: 6px 8px; text-align: right; }
  .a1001c-table th:first-child, .a1001c-table td:first-child { text-align: left; color: var(--ink-2); font-weight: 400; }
  .a1001c-table thead th { font-size: 0.76rem; color: var(--muted); font-weight: 700; border-bottom: 1px solid var(--grid); }
  .a1001c-table thead .a1001c-person { white-space: nowrap; justify-content: flex-end; }
  .a1001c-table tbody tr + tr td { border-top: 1px solid var(--grid); }
  .a1001c-table td { font-variant-numeric: tabular-nums; }

  .a1001c-note { font-size: 0.74rem; color: var(--muted); margin-top: 14px; }
  .a1001c-error { color: var(--ink-2); font-size: 0.9rem; }
  `;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function albumImage(album, size) {
    var imgs = (album && album.images) || [];
    var best = null;
    for (var i = 0; i < imgs.length; i++) {
      if (!best || Math.abs(imgs[i].width - size) < Math.abs(best.width - size)) best = imgs[i];
    }
    return best ? best.url : "";
  }

  function fetchProject(project) {
    var cacheKey = "a1001:" + project;
    var stale = null;
    try {
      var cached = JSON.parse(localStorage.getItem(cacheKey));
      if (cached && cached.data) {
        if (Date.now() - cached.at < CACHE_TTL_MS) return Promise.resolve(cached.data);
        stale = cached.data;
      }
    } catch (e) { /* ignore bad cache */ }

    function doFetch() {
      return fetch(API_BASE + encodeURIComponent(project)).then(function (res) {
        if (!res.ok) throw new Error(project + ": API responded " + res.status);
        return res.json();
      }).then(function (data) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), data: data }));
        } catch (e) { /* no cache — fine */ }
        return data;
      });
    }

    // With 4+ people a cold load can trip the 3 req/min limit: fall back to
    // stale cache if we have it, otherwise wait out the window and retry once.
    return doFetch().catch(function (err) {
      if (stale) return stale;
      return new Promise(function (resolve) { setTimeout(resolve, 25000); })
        .then(doFetch);
    });
  }

  // One request at a time, to stay polite with the rate limit.
  function fetchAll(projects) {
    var results = [];
    var chain = Promise.resolve();
    projects.forEach(function (p) {
      chain = chain.then(function () {
        return fetchProject(p.id).then(function (data) { results.push({ cfg: p, data: data }); });
      });
    });
    return chain.then(function () { return results; });
  }

  function summarize(entry) {
    var history = entry.data.history || [];
    var rated = [], skipped = 0, sum = 0, fives = 0, ones = 0;
    var globalSum = 0, globalN = 0;
    history.forEach(function (h) {
      if (typeof h.rating === "number" && h.rating >= 1 && h.rating <= 5) {
        rated.push(h.rating); sum += h.rating;
        if (h.rating === 5) fives++;
        if (h.rating === 1) ones++;
      } else if (h.rating === "did-not-listen") {
        skipped++;
      }
      if (typeof h.globalRating === "number") { globalSum += h.globalRating; globalN++; }
    });
    return {
      cfg: entry.cfg,
      current: entry.data.currentAlbum,
      heard: history.length,
      rated: rated.length,
      skipped: skipped,
      fives: fives,
      ones: ones,
      avg: rated.length ? sum / rated.length : null,
      globalAvg: globalN ? globalSum / globalN : null
    };
  }

  function personColor(i) { return "var(--p" + Math.min(i + 1, 4) + ")"; }

  function personLabel(s, i) {
    var name = esc(s.cfg.label);
    if (s.cfg.page) name = '<a href="' + esc(s.cfg.page) + '">' + name + "</a>";
    return '<span class="a1001c-person"><span class="a1001c-dot" style="background:' + personColor(i) + '"></span>' + name + "</span>";
  }

  function render(root, entries) {
    var people = entries.map(summarize);
    var maxHeard = Math.max.apply(null, people.map(function (p) { return p.heard; }).concat([1]));

    var html = '<div class="a1001c-title">1001 Albums — the group race</div>';

    html += '<div class="a1001c-section">Today’s albums</div><div class="a1001c-today">';
    people.forEach(function (s, i) {
      var cur = s.current;
      html += '<div class="a1001c-today-card">' +
        (cur ? '<img src="' + esc(albumImage(cur, 300)) + '" alt="Cover art: ' + esc(cur.name) + '" loading="lazy">' : "") +
        personLabel(s, i) +
        (cur
          ? '<div class="a1001c-today-album" title="' + esc(cur.name) + '">' + esc(cur.name) + "</div>" +
            '<div class="a1001c-today-artist" title="' + esc(cur.artist) + '">' + esc(cur.artist) + (cur.releaseDate ? " · " + esc(cur.releaseDate) : "") + "</div>"
          : '<div class="a1001c-today-artist">no current album</div>') +
        "</div>";
    });
    html += "</div>";

    html += '<div class="a1001c-section">Albums heard</div><div class="a1001c-bars">';
    people.forEach(function (s, i) {
      var w = (s.heard / maxHeard) * 100;
      var lead = s.heard === maxHeard && maxHeard > 0 ? ' <span class="a1001c-crown" title="in the lead">👑</span>' : "";
      html += '<span class="a1001c-bar-label">' + personLabel(s, i) + "</span>" +
        '<div class="a1001c-track bare"><div class="a1001c-fill" style="width:' + w.toFixed(1) + "%;background:" + personColor(i) + '"></div></div>' +
        '<span class="a1001c-bar-value">' + s.heard + " · " + ((s.heard / TOTAL_ALBUMS) * 100).toFixed(1) + "%" + lead + "</span>";
    });
    html += "</div>";

    html += '<div class="a1001c-section">Average rating given</div><div class="a1001c-bars">';
    people.forEach(function (s, i) {
      var avg = s.avg;
      var w = avg != null ? (avg / 5) * 100 : 0;
      html += '<span class="a1001c-bar-label">' + personLabel(s, i) + "</span>" +
        '<div class="a1001c-track"><div class="a1001c-fill" style="width:' + w.toFixed(1) + "%;background:" + personColor(i) + '"></div></div>' +
        '<span class="a1001c-bar-value">' + (avg != null ? avg.toFixed(2) : "–") + " / 5</span>";
    });
    html += "</div>";

    html += '<div class="a1001c-section">Details</div>' +
      '<div class="a1001c-scroll"><table class="a1001c-table"><thead><tr><th></th>';
    people.forEach(function (s, i) { html += "<th>" + personLabel(s, i) + "</th>"; });
    html += "</tr></thead><tbody>";
    [
      ["Albums heard", function (s) { return s.heard; }],
      ["Rated", function (s) { return s.rated; }],
      ["Skipped", function (s) { return s.skipped; }],
      ["5★ given", function (s) { return s.fives; }],
      ["1★ given", function (s) { return s.ones; }],
      ["Your average", function (s) { return s.avg != null ? s.avg.toFixed(2) : "–"; }],
      ["Global average (same albums)", function (s) { return s.globalAvg != null ? s.globalAvg.toFixed(2) : "–"; }]
    ].forEach(function (row) {
      html += "<tr><td>" + row[0] + "</td>";
      people.forEach(function (s) { html += "<td>" + row[1](s) + "</td>"; });
      html += "</tr>";
    });
    html += "</tbody></table></div>";

    html += '<div class="a1001c-note">Data from 1001albumsgenerator.com, refreshed at most every 10 minutes.</div>';

    root.innerHTML = html;
  }

  function init() {
    var root = document.getElementById("albums-compare");
    if (!root) return;
    root.classList.add("a1001c");

    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    root.innerHTML = '<p class="a1001c-error">Loading everyone’s progress…</p>';
    fetchAll(PROJECTS).then(function (entries) {
      render(root, entries);
    }).catch(function (err) {
      root.innerHTML = '<p class="a1001c-error">Couldn’t load the comparison (' + esc(err.message) + "). It’ll retry next page load.</p>";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
