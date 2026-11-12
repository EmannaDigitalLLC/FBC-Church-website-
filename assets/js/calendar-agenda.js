/* ============================================================
   CHURCH CALENDAR
   - Desktop / tablet: the full CalendarWiz month calendar (iframe),
     exactly as before.
   - Phones: an open, day-by-day agenda of the whole month, so every
     date and event is visible without tapping each date. Data comes
     from CalendarWiz's public event feed (same source as the calendar),
     so updating events in CalendarWiz updates this automatically.
   If the feed can't be reached, phones fall back to CalendarWiz's own
   mobile calendar.
   ============================================================ */
(function () {
  'use strict';

  var CRD = 'fbcrancho';
  var FULL_URL = 'https://www.calendarwiz.com/' + CRD;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  var root = document.getElementById('church-calendar');
  if (!root) return;

  var mq = window.matchMedia('(max-width: 760px)');
  var mode = null;
  var cache = {};
  var now = new Date();
  var todayKey = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  var state = { y: now.getFullYear(), m: now.getMonth() + 1, showEarlier: false };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------- Desktop: the full calendar, unchanged ---------- */
  function iframe(src, height, title) {
    var f = document.createElement('iframe');
    f.title = title;
    f.src = src;
    f.setAttribute('width', '100%');
    f.setAttribute('height', String(height));
    f.setAttribute('style', 'border:none; display:block;');
    return f;
  }

  function mountGrid() {
    root.classList.remove('is-agenda');
    root.appendChild(iframe(
      'https://www.calendarwiz.com/calendars/calendar.php?crd=' + CRD + '&nolog=1&cid%5B%5D=all',
      1200, 'First Baptist Church of Rancho Cordova calendar'));
  }

  /* ---------- Phones: open agenda ---------- */
  function jsonp(url) {
    return new Promise(function (resolve, reject) {
      var cb = 'cwcb_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
      var s = document.createElement('script');
      var timer = setTimeout(function () { cleanup(); reject(new Error('timeout')); }, 10000);
      function cleanup() { clearTimeout(timer); delete window[cb]; if (s.parentNode) s.parentNode.removeChild(s); }
      window[cb] = function (data) { cleanup(); resolve(data); };
      s.onerror = function () { cleanup(); reject(new Error('network')); };
      s.src = url + '&callback=' + cb;
      document.head.appendChild(s);
    });
  }

  function getMonth(y, m) {
    var key = y + '-' + m;
    if (cache[key]) return Promise.resolve(cache[key]);
    var last = new Date(y, m, 0).getDate();
    var url = 'https://www.calendarwiz.com/cwapi.php?fmt=json&view=s' +
      '&bd=1&bm=' + m + '&by=' + y + '&ed=' + last + '&em=' + m + '&ey=' + y + '&crd=' + CRD;
    return jsonp(url).then(function (data) {
      if (!data || !data.eventsummaries) throw new Error('bad data');
      cache[key] = groupByDay(data.eventsummaries);
      return cache[key];
    });
  }

  function groupByDay(list) {
    var days = {};
    list.forEach(function (e) {
      if (e.draft) return;
      var y = +e.event_year, m = +e.event_month, d = +e.event_day;
      var key = y * 10000 + m * 100 + d;
      if (!days[key]) days[key] = { key: key, y: y, m: m, d: d, events: [] };
      days[key].events.push(e);
    });
    Object.keys(days).forEach(function (k) {
      days[k].events.sort(function (a, b) {
        if (a.allday !== b.allday) return a.allday ? -1 : 1;
        return (a.start_timestamp_gmt || 0) - (b.start_timestamp_gmt || 0);
      });
    });
    return days;
  }

  function fmtTime(e) {
    if (e.allday) return 'All day';
    var s = e.starthour + ':' + e.startminute + ' ' + e.startampm;
    if (e.noend) return s;
    return s + ' – ' + e.endhour + ':' + e.endminute + ' ' + e.endampm;
  }

  function eventItem(e) {
    var li = el('li', 'agenda-item');
    var id = String(e.event_id || '');
    var tag = /^\d+$/.test(id) ? 'a' : 'div';
    var row = el(tag, 'agenda-event');
    if (tag === 'a') {
      row.href = 'https://www.calendarwiz.com/calendars/popup.php?op=view&uc_mobile=1&id=' + id + '&crd=' + CRD;
      row.target = '_blank';
      row.rel = 'noopener';
    }
    row.appendChild(el('span', 'agenda-time', fmtTime(e)));
    row.appendChild(el('span', 'agenda-title', e.title || 'Event'));
    var meta = [];
    if (e.location_name) meta.push(e.location_name);
    if (e.category_name) meta.push(e.category_name);
    if (meta.length) row.appendChild(el('span', 'agenda-meta', meta.join(' · ')));
    li.appendChild(row);
    return li;
  }

  function dayBlock(info) {
    var date = new Date(info.y, info.m - 1, info.d);
    var isToday = info.key === todayKey;
    var sec = el('section', 'agenda-day' + (isToday ? ' is-today' : ''));
    sec.setAttribute('aria-label', WEEKDAYS_LONG[date.getDay()] + ', ' + MONTHS[info.m - 1] + ' ' + info.d);
    var badge = el('div', 'agenda-badge');
    badge.setAttribute('aria-hidden', 'true');
    badge.appendChild(el('span', 'agenda-wd', WEEKDAYS[date.getDay()]));
    badge.appendChild(el('span', 'agenda-dn', String(info.d)));
    if (isToday) badge.appendChild(el('span', 'agenda-today', 'Today'));
    sec.appendChild(badge);
    var ul = el('ul', 'agenda-events');
    info.events.forEach(function (e) { ul.appendChild(eventItem(e)); });
    sec.appendChild(ul);
    return sec;
  }

  function showFallback(note) {
    root.classList.remove('is-agenda');
    root.innerHTML = '';
    if (note) root.appendChild(el('p', 'agenda-note', note));
    root.appendChild(iframe(
      'https://www.calendarwiz.com/mobile.html?crd=' + CRD + '&nolognavbar=0&cid%5B%5D=all',
      Math.max(560, window.innerHeight - 80), 'First Baptist Church of Rancho Cordova calendar'));
  }

  function mountAgenda() {
    root.classList.add('is-agenda');
    var wrap = el('div', 'agenda');

    var nav = el('div', 'agenda-nav');
    var prev = el('button', 'agenda-btn', '‹');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Previous month');
    var next = el('button', 'agenda-btn', '›');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next month');
    var title = el('h2', 'agenda-month');
    title.setAttribute('aria-live', 'polite');
    var todayBtn = el('button', 'agenda-today-btn', 'Back to this month');
    todayBtn.type = 'button';
    nav.appendChild(prev);
    nav.appendChild(title);
    nav.appendChild(next);

    var body = el('div', 'agenda-body');
    var foot = el('p', 'agenda-foot');
    var full = el('a', null, 'Open the full calendar');
    full.href = FULL_URL;
    full.target = '_blank';
    full.rel = 'noopener';
    foot.appendChild(full);

    wrap.appendChild(nav);
    wrap.appendChild(todayBtn);
    wrap.appendChild(body);
    wrap.appendChild(foot);
    root.appendChild(wrap);

    function isCurrentMonth() {
      return state.y === now.getFullYear() && state.m === now.getMonth() + 1;
    }

    function go(delta) {
      var d = new Date(state.y, state.m - 1 + delta, 1);
      state.y = d.getFullYear();
      state.m = d.getMonth() + 1;
      state.showEarlier = false;
      load();
    }

    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    todayBtn.addEventListener('click', function () {
      state.y = now.getFullYear();
      state.m = now.getMonth() + 1;
      state.showEarlier = false;
      load();
    });

    function paint(days) {
      body.innerHTML = '';
      var keys = Object.keys(days).map(Number).sort(function (a, b) { return a - b; });
      if (!keys.length) {
        body.appendChild(el('p', 'agenda-empty', 'No events are scheduled for this month yet.'));
        return;
      }
      var past = isCurrentMonth() ? keys.filter(function (k) { return k < todayKey; }) : [];
      var upcoming = keys.filter(function (k) { return past.indexOf(k) === -1; });

      if (past.length) {
        var toggle = el('button', 'agenda-earlier', state.showEarlier
          ? 'Hide earlier dates'
          : 'Show earlier dates this month (' + past.length + ' day' + (past.length === 1 ? '' : 's') + ')');
        toggle.type = 'button';
        toggle.setAttribute('aria-expanded', state.showEarlier ? 'true' : 'false');
        toggle.addEventListener('click', function () {
          state.showEarlier = !state.showEarlier;
          paint(days);
        });
        body.appendChild(toggle);
        if (state.showEarlier) {
          past.forEach(function (k) {
            var b = dayBlock(days[k]);
            b.classList.add('is-past');
            body.appendChild(b);
          });
        }
      }
      upcoming.forEach(function (k) { body.appendChild(dayBlock(days[k])); });
      if (isCurrentMonth() && !upcoming.length) {
        body.appendChild(el('p', 'agenda-empty', 'No more events are scheduled for the rest of this month.'));
      }
    }

    function load() {
      title.textContent = MONTHS[state.m - 1] + ' ' + state.y;
      todayBtn.hidden = isCurrentMonth();
      body.innerHTML = '';
      body.appendChild(el('p', 'agenda-loading', 'Loading events…'));
      var y = state.y, m = state.m;
      getMonth(y, m).then(function (days) {
        if (y !== state.y || m !== state.m || mode !== 'agenda') return; // user moved on
        paint(days);
      }).catch(function () {
        if (mode !== 'agenda') return;
        showFallback('We couldn’t load the event list just now, so here is the standard calendar.');
      });
    }

    load();
  }

  /* ---------- Pick a layout by screen width ---------- */
  function render() {
    var want = mq.matches ? 'agenda' : 'grid';
    if (want === mode) return;
    mode = want;
    root.innerHTML = '';
    if (want === 'agenda') mountAgenda(); else mountGrid();
  }

  if (mq.addEventListener) mq.addEventListener('change', render);
  else if (mq.addListener) mq.addListener(render);
  render();
})();
