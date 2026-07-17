/**
 * 1001 Albums Generator — progress widget
 * ----------------------------------------
 * Drop-in widget for a static site (GitHub Pages friendly).
 *
 * Usage — add these two lines to any page:
 *
 *   <div id="albums-1001" data-project="YOUR-PROJECT-NAME"></div>
 *   <script src="albums-widget.js" defer></script>
 *
 * data-project is your project name or sharer ID from 1001albumsgenerator.com
 * (same as the last part of your project URL).
 *
 * The API is limited to 3 requests/minute, so responses are cached in
 * localStorage for 10 minutes. New albums only appear daily anyway.
 */
(function () {
  "use strict";

  var API_BASE = "https://1001albumsgenerator.com/api/v1/projects/";
  var CACHE_TTL_MS = 10 * 60 * 1000;
  var TOTAL_ALBUMS = 1001;
  var RECENT_COUNT = 10;

  var CSS = `
  .a1001 {
    color-scheme: light;
    --surface:    #fcfcfb;
    --ink:        #0b0b0b;
    --ink-2:      #52514e;
    --muted:      #898781;
    --grid:       #e1e0d9;
    --border:     rgba(11, 11, 11, 0.10);
    --accent:     #2a78d6;
    --rate-1: #86b6ef; --rate-2: #5598e7; --rate-3: #2a78d6;
    --rate-4: #1c5cab; --rate-5: #104281;

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
    .a1001 {
      color-scheme: dark;
      --surface: #1a1a19;
      --ink:     #ffffff;
      --ink-2:   #c3c2b7;
      --muted:   #898781;
      --grid:    #2c2c2a;
      --border:  rgba(255, 255, 255, 0.10);
      --accent:  #3987e5;
      --rate-1: #9ec5f4; --rate-2: #6da7ec; --rate-3: #3987e5;
      --rate-4: #256abf; --rate-5: #184f95;
    }
  }
  .a1001 * { box-sizing: border-box; margin: 0; }
  .a1001 a { color: var(--accent); text-decoration: none; }
  .a1001 a:hover { text-decoration: underline; }

  .a1001-head {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 12px; flex-wrap: wrap; margin-bottom: 18px;
  }
  .a1001-title { font-size: 1.05rem; font-weight: 700; }
  .a1001-sub { font-size: 0.8rem; color: var(--muted); }

  .a1001-current { display: flex; gap: 18px; align-items: flex-start; }
  .a1001-art {
    width: 132px; height: 132px; border-radius: 8px; flex-shrink: 0;
    object-fit: cover; border: 1px solid var(--border);
  }
  .a1001-kicker {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 6px;
  }
  .a1001-album { font-size: 1.25rem; font-weight: 750; letter-spacing: -0.01em; }
  .a1001-artist { font-size: 0.95rem; color: var(--ink-2); margin-top: 2px; }
  .a1001-genres { font-size: 0.8rem; color: var(--muted); margin-top: 6px; }
  .a1001-links { margin-top: 10px; display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.82rem; }

  .a1001-progress { margin-top: 20px; }
  .a1001-progress-label {
    display: flex; justify-content: space-between;
    font-size: 0.8rem; color: var(--ink-2); margin-bottom: 6px;
  }
  .a1001-bar {
    height: 8px; border-radius: 4px; background: var(--grid); overflow: hidden;
  }
  .a1001-bar > span {
    display: block; height: 100%; border-radius: 4px; background: var(--accent);
  }

  .a1001-tiles {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px; margin-top: 16px;
  }
  .a1001-tile {
    border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px;
  }
  .a1001-tile b { display: block; font-size: 1.35rem; font-weight: 750; }
  .a1001-tile span { font-size: 0.72rem; color: var(--muted); }

  .a1001-section {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted);
    margin: 22px 0 10px; padding-top: 16px; border-top: 1px solid var(--grid);
  }

  .a1001-dist { display: grid; grid-template-columns: auto 1fr auto; gap: 6px 10px; align-items: center; }
  .a1001-dist-star { font-size: 0.78rem; color: var(--ink-2); white-space: nowrap; }
  .a1001-dist-track { height: 14px; background: none; }
  .a1001-dist-fill { height: 100%; border-radius: 0 4px 4px 0; min-width: 2px; }
  .a1001-dist-fill.zero { min-width: 0; }
  .a1001-dist-n { font-size: 0.78rem; color: var(--ink-2); font-variant-numeric: tabular-nums; }

  .a1001-recent { list-style: none; padding: 0; display: flex; flex-direction: column; }
  .a1001-recent li {
    display: flex; align-items: center; gap: 12px; padding: 8px 0;
    border-bottom: 1px solid var(--grid);
  }
  .a1001-recent li:last-child { border-bottom: none; }
  .a1001-thumb {
    width: 40px; height: 40px; border-radius: 5px; object-fit: cover;
    border: 1px solid var(--border); flex-shrink: 0;
  }
  .a1001-recent-info { flex: 1; min-width: 0; }
  .a1001-recent-name {
    font-size: 0.88rem; font-weight: 600;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .a1001-recent-artist {
    font-size: 0.78rem; color: var(--ink-2);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .a1001-recent-rating { text-align: right; flex-shrink: 0; }
  .a1001-stars { font-size: 0.82rem; letter-spacing: 1px; color: var(--accent); white-space: nowrap; }
  .a1001-stars .off { color: var(--grid); }
  .a1001-global { font-size: 0.7rem; color: var(--muted); }

  .a1001-error { color: var(--ink-2); font-size: 0.9rem; }

  @media (max-width: 480px) {
    .a1001-current { flex-direction: column; }
    .a1001-art { width: 100%; height: auto; aspect-ratio: 1; }
  }
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

  function stars(rating) {
    var out = "";
    for (var i = 1; i <= 5; i++) {
      out += i <= rating ? "★" : '<span class="off">★</span>';
    }
    return '<span class="a1001-stars" aria-label="' + rating + ' out of 5">' + out + "</span>";
  }

  function fetchProject(project) {
    var cacheKey = "a1001:" + project;
    try {
      var cached = JSON.parse(localStorage.getItem(cacheKey));
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        return Promise.resolve(cached.data);
      }
    } catch (e) { /* ignore bad cache */ }

    return fetch(API_BASE + encodeURIComponent(project)).then(function (res) {
      if (!res.ok) throw new Error("API responded " + res.status);
      return res.json();
    }).then(function (data) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), data: data }));
      } catch (e) { /* storage full/blocked — fine, just no cache */ }
      return data;
    });
  }

  function streamingLink(album, service) {
    if (service === "apple" && album.appleMusicId) {
      return '<a href="https://music.apple.com/album/' + esc(album.appleMusicId) + '" target="_blank" rel="noopener">Apple Music</a>';
    }
    if (album.spotifyId) {
      return '<a href="https://open.spotify.com/album/' + esc(album.spotifyId) + '" target="_blank" rel="noopener">Spotify</a>';
    }
    return "";
  }

  function render(root, data, music) {
    var history = data.history || [];
    var rated = history.filter(function (h) { return typeof h.rating === "number" && h.rating >= 1 && h.rating <= 5; });
    var counts = [0, 0, 0, 0, 0];
    var sum = 0;
    rated.forEach(function (h) { counts[h.rating - 1]++; sum += h.rating; });
    var avg = rated.length ? (sum / rated.length) : null;
    var maxCount = Math.max.apply(null, counts.concat([1]));
    var pct = Math.min(100, (history.length / TOTAL_ALBUMS) * 100);
    var cur = data.currentAlbum;

    var globalSum = 0, globalN = 0;
    history.forEach(function (h) {
      if (typeof h.globalRating === "number") { globalSum += h.globalRating; globalN++; }
    });

    var html = "";

    html += '<div class="a1001-head">' +
      '<div class="a1001-title">1001 Albums' + (data.name ? " — " + esc(data.name) : "") + "</div>" +
      (data.shareableUrl ? '<a class="a1001-sub" href="' + esc(data.shareableUrl) + '" target="_blank" rel="noopener">full stats ↗</a>' : "") +
      "</div>";

    if (cur) {
      html += '<div class="a1001-current">' +
        '<img class="a1001-art" src="' + esc(albumImage(cur, 300)) + '" alt="Cover art: ' + esc(cur.name) + '">' +
        "<div>" +
        '<div class="a1001-kicker">Today’s album</div>' +
        '<div class="a1001-album">' + esc(cur.name) + "</div>" +
        '<div class="a1001-artist">' + esc(cur.artist) + (cur.releaseDate ? " · " + esc(cur.releaseDate) : "") + "</div>" +
        (cur.genres && cur.genres.length ? '<div class="a1001-genres">' + esc(cur.genres.join(", ")) + "</div>" : "") +
        '<div class="a1001-links">' +
        streamingLink(cur, music) +
        (cur.wikipediaUrl ? '<a href="' + esc(cur.wikipediaUrl) + '" target="_blank" rel="noopener">Wikipedia</a>' : "") +
        (cur.globalReviewsUrl ? '<a href="' + esc(cur.globalReviewsUrl) + '" target="_blank" rel="noopener">Reviews</a>' : "") +
        "</div></div></div>";
    }

    html += '<div class="a1001-progress">' +
      '<div class="a1001-progress-label"><span>' + history.length + " of " + TOTAL_ALBUMS + " albums</span><span>" + pct.toFixed(1) + "%</span></div>" +
      '<div class="a1001-bar"><span style="width:' + pct.toFixed(2) + '%"></span></div>' +
      "</div>";

    html += '<div class="a1001-tiles">' +
      '<div class="a1001-tile"><b>' + history.length + "</b><span>albums heard</span></div>" +
      '<div class="a1001-tile"><b>' + (avg != null ? avg.toFixed(2) : "–") + "</b><span>your avg rating</span></div>" +
      '<div class="a1001-tile"><b>' + (globalN ? (globalSum / globalN).toFixed(2) : "–") + "</b><span>global avg rating</span></div>" +
      "</div>";

    if (rated.length) {
      html += '<div class="a1001-section">Your ratings (' + rated.length + " rated)</div>";
      html += '<div class="a1001-dist" role="img" aria-label="Rating distribution">';
      for (var r = 5; r >= 1; r--) {
        var n = counts[r - 1];
        var w = (n / maxCount) * 100;
        html += '<span class="a1001-dist-star">' + r + " ★</span>" +
          '<div class="a1001-dist-track"><div class="a1001-dist-fill' + (n === 0 ? " zero" : "") + '" style="width:' + w.toFixed(1) + "%;background:var(--rate-" + r + ')" title="' + n + " album" + (n === 1 ? "" : "s") + " rated " + r + '"></div></div>' +
          '<span class="a1001-dist-n">' + n + "</span>";
      }
      html += "</div>";
    }

    var recent = history.slice(-RECENT_COUNT).reverse();
    if (recent.length) {
      html += '<div class="a1001-section">Recent albums</div><ul class="a1001-recent">';
      recent.forEach(function (h) {
        var a = h.album || {};
        html += "<li>" +
          '<img class="a1001-thumb" src="' + esc(albumImage(a, 64)) + '" alt="" loading="lazy">' +
          '<div class="a1001-recent-info">' +
          '<div class="a1001-recent-name">' + esc(a.name) + "</div>" +
          '<div class="a1001-recent-artist">' + esc(a.artist) + "</div>" +
          "</div>" +
          '<div class="a1001-recent-rating">' +
          (typeof h.rating === "number" ? stars(h.rating) :
            '<span class="a1001-global">' + (h.rating === "did-not-listen" ? "skipped" : "not rated") + "</span>") +
          (typeof h.globalRating === "number" ? '<div class="a1001-global">global ' + h.globalRating.toFixed(1) + "</div>" : "") +
          "</div></li>";
      });
      html += "</ul>";
    }

    root.innerHTML = html;
  }

  function init() {
    var root = document.getElementById("albums-1001");
    if (!root) return;
    var project = root.getAttribute("data-project");
    var music = root.getAttribute("data-music") || "spotify";
    root.classList.add("a1001");

    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    if (!project) {
      root.innerHTML = '<p class="a1001-error">Missing data-project attribute on #albums-1001.</p>';
      return;
    }

    root.innerHTML = '<p class="a1001-error">Loading album progress…</p>';
    fetchProject(project).then(function (data) {
      render(root, data, music);
    }).catch(function (err) {
      root.innerHTML = '<p class="a1001-error">Couldn’t load 1001 Albums data (' + esc(err.message) + "). It’ll retry next page load.</p>";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
