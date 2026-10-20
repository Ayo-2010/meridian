const CITIES = [
  { id: 'warsaw', name: 'Warsaw', country: 'Poland', tz: 'Europe/Warsaw', color: '#f0b768' },
  { id: 'london', name: 'London', country: 'United Kingdom', tz: 'Europe/London', color: '#7fa7ff' },
  { id: 'new-york', name: 'New York', country: 'United States', tz: 'America/New_York', color: '#b79cff' },
  { id: 'los-angeles', name: 'Los Angeles', country: 'United States', tz: 'America/Los_Angeles', color: '#ff9d7a' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', tz: 'Asia/Tokyo', color: '#ff8fac' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', tz: 'Australia/Sydney', color: '#8de0c2' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', tz: 'Asia/Dubai', color: '#e7c86d' },
  { id: 'lagos', name: 'Lagos', country: 'Nigeria', tz: 'Africa/Lagos', color: '#f3a86d' },
  { id: 'sao-paulo', name: 'São Paulo', country: 'Brazil', tz: 'America/Sao_Paulo', color: '#9bd477' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', tz: 'Asia/Singapore', color: '#6ed6d0' },
  { id: 'berlin', name: 'Berlin', country: 'Germany', tz: 'Europe/Berlin', color: '#c3a4ff' },
  { id: 'toronto', name: 'Toronto', country: 'Canada', tz: 'America/Toronto', color: '#f08a8a' },
  { id: 'mumbai', name: 'Mumbai', country: 'India', tz: 'Asia/Kolkata', color: '#ffc36b' },
  { id: 'auckland', name: 'Auckland', country: 'New Zealand', tz: 'Pacific/Auckland', color: '#7ed4ff' }
];

const storageKey = 'meridian-cities-v1';
const defaultIds = ['warsaw', 'new-york', 'london', 'tokyo', 'sydney', 'dubai', 'lagos', 'los-angeles'];
const state = {
  cityIds: loadCities(),
  homeId: 'warsaw',
  meetingHour: 14,
  date: ''
};

const $ = (id) => document.getElementById(id);
const cityById = (id) => CITIES.find((city) => city.id === id);
const homeCity = () => cityById(state.homeId) || CITIES[0];

function loadCities() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(stored) && stored.length) return stored.filter((id) => cityById(id)).slice(0, 8);
  } catch (error) {}
  return [...defaultIds];
}

function saveCities() {
  localStorage.setItem(storageKey, JSON.stringify(state.cityIds));
}

function partsInZone(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  const values = {};
  parts.forEach((part) => { if (part.type !== 'literal') values[part.type] = part.value; });
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second)
  };
}

function offsetAt(date, tz) {
  const p = partsInZone(date, tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime();
}

function zonedToUtc(year, month, day, hour, tz) {
  let utc = Date.UTC(year, month - 1, day, hour, 0, 0);
  for (let i = 0; i < 3; i += 1) {
    const offset = offsetAt(new Date(utc), tz);
    utc = Date.UTC(year, month - 1, day, hour, 0, 0) - offset;
  }
  return new Date(utc);
}

function datePartsFromValue(value) {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

function addDays(value, amount) {
  const { year, month, day } = datePartsFromValue(value);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function todayInZone(tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function formattedDate(value) {
  const { year, month, day } = datePartsFromValue(value);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function shortDate(value) {
  const { year, month, day } = datePartsFromValue(value);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
}

function cityInfo(city, dateValue, hour) {
  const { year, month, day } = datePartsFromValue(dateValue);
  const instant = zonedToUtc(year, month, day, hour, homeCity().tz);
  const local = partsInZone(instant, city.tz);
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: city.tz }).format(instant);
  const homeDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const localDate = `${local.year}-${String(local.month).padStart(2, '0')}-${String(local.day).padStart(2, '0')}`;
  let dayShift = 0;
  if (localDate > homeDate) dayShift = 1;
  if (localDate < homeDate) dayShift = -1;
  return {
    instant,
    hour: local.hour,
    minute: local.minute,
    weekday,
    dayShift,
    label: `${String(local.hour).padStart(2, '0')}:${String(local.minute).padStart(2, '0')}`
  };
}

function isWork(hour) { return hour >= 9 && hour < 17; }
function isAwake(hour) { return hour >= 7 && hour < 22; }

function renderCityList() {
  const list = $('city-list');
  list.innerHTML = '';
  state.cityIds.forEach((id) => {
    const city = cityById(id);
    const now = new Date();
    const p = partsInZone(now, city.tz);
    const row = document.createElement('div');
    row.className = 'city-row';
    row.style.setProperty('--c', city.color);
    row.innerHTML = `<span class="pip"></span><div><b>${city.name}</b><small>${city.country}</small></div><div class="live">${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}</div>`;
    if (id !== state.homeId) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove ${city.name}`);
      remove.addEventListener('click', () => {
        state.cityIds = state.cityIds.filter((cityId) => cityId !== id);
        saveCities(); renderAll();
      });
      row.appendChild(remove);
    } else {
      const homeTag = document.createElement('span');
      homeTag.className = 'remove';
      homeTag.textContent = '●';
      homeTag.title = 'Home time zone';
      row.appendChild(homeTag);
    }
    list.appendChild(row);
  });
  $('city-count').textContent = String(state.cityIds.length).padStart(2, '0');
  const picker = $('city-picker');
  picker.innerHTML = '';
  CITIES.filter((city) => !state.cityIds.includes(city.id)).forEach((city) => {
    const option = document.createElement('option');
    option.value = city.id;
    option.textContent = `${city.name} · ${city.tz.split('/').pop().replace(/_/g, ' ')}`;
    picker.appendChild(option);
  });
  $('add-city').disabled = !picker.options.length;
}

function renderTimeline() {
  const hours = $('hour-head');
  hours.innerHTML = '';
  for (let hour = 0; hour < 24; hour += 1) {
    const span = document.createElement('span');
    span.className = `hour-label${isWork(hour) ? ' work-label' : ''}`;
    span.textContent = hour % 3 === 0 ? `${String(hour).padStart(2, '0')}` : '';
    const homeLocal = cityInfo(homeCity(), state.date, hour).hour;
    if (isWork(homeLocal)) span.classList.add('work-label');
    hours.appendChild(span);
  }
  const rows = $('rows');
  rows.innerHTML = '';
  state.cityIds.forEach((id) => {
    const city = cityById(id);
    const line = document.createElement('div');
    line.className = 'city-line';
    line.style.setProperty('--c', city.color);
    const selected = cityInfo(city, state.date, state.meetingHour);
    const name = document.createElement('div');
    name.className = 'city-name';
    name.innerHTML = `<span class="pip"></span><div><b>${city.name}</b><small>${city.tz.replace('_', ' ')}</small></div><div class="local"><b>${selected.label}</b><small>${selected.weekday}${selected.dayShift ? ` ${selected.dayShift > 0 ? '+1' : '−1'}` : ''}</small></div>`;
    line.appendChild(name);
    for (let hour = 0; hour < 24; hour += 1) {
      const info = cityInfo(city, state.date, hour);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      if (isWork(info.hour)) cell.classList.add('work');
      else if (isAwake(info.hour)) cell.classList.add('awake');
      else cell.classList.add('sleep');
      if (hour === state.meetingHour) cell.classList.add('selected');
      if (info.dayShift === 1) cell.classList.add('nextday');
      cell.title = `${city.name} · ${String(info.hour).padStart(2, '0')}:${String(info.minute).padStart(2, '0')} ${info.weekday}`;
      cell.setAttribute('aria-label', cell.title);
      cell.addEventListener('click', () => setMeetingHour(hour));
      line.appendChild(cell);
    }
    rows.appendChild(line);
  });
}

function setMeetingHour(hour) {
  state.meetingHour = (hour + 24) % 24;
  $('hour-range').value = state.meetingHour;
  renderAll();
}

function renderMeeting() {
  const city = homeCity();
  const info = cityInfo(city, state.date, state.meetingHour);
  $('meeting-time').textContent = info.label;
  $('meeting-date').textContent = formattedDate(state.date);
  const utc = info.instant.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  $('meeting-utc').textContent = `${utc} UTC`;
  const shifts = state.cityIds.map((id) => cityInfo(cityById(id), state.date, state.meetingHour).dayShift);
  const ahead = shifts.filter((shift) => shift > 0).length;
  const behind = shifts.filter((shift) => shift < 0).length;
  $('meeting-day').textContent = ahead || behind ? `${ahead} ahead · ${behind} behind` : `Same day in ${state.cityIds.length} cities`;
  $('home-label').textContent = `${city.name} · ${city.tz}`;
  $('date-input').value = state.date;
}

function hourScore(hour) {
  let work = 0;
  let awake = 0;
  state.cityIds.forEach((id) => {
    const localHour = cityInfo(cityById(id), state.date, hour).hour;
    if (isWork(localHour)) work += 1;
    if (isAwake(localHour)) awake += 1;
  });
  return { hour, work, awake };
}

function renderRanked() {
  const ranked = Array.from({ length: 24 }, (_, hour) => hourScore(hour))
    .sort((a, b) => b.work - a.work || b.awake - a.awake || a.hour - b.hour)
    .slice(0, 8);
  const best = ranked[0];
  $('overlap').innerHTML = `<strong>${best.work}/${state.cityIds.length}</strong><span>cities in working hours at ${String(best.hour).padStart(2, '0')}:00 home time</span>`;
  const lane = $('ranked');
  lane.innerHTML = '';
  ranked.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rank';
    button.innerHTML = `<span class="num">${String(index + 1).padStart(2, '0')}</span><strong>${String(item.hour).padStart(2, '0')}:00</strong><span>${item.work} working · ${item.awake} awake</span><span class="bar"><i style="width:${Math.round((item.work / state.cityIds.length) * 100)}%"></i></span>`;
    button.addEventListener('click', () => setMeetingHour(item.hour));
    lane.appendChild(button);
  });
  const hasDst = state.cityIds.some((id) => {
    const city = cityById(id);
    const a = offsetAt(zonedToUtc(...Object.values(datePartsFromValue(state.date)), 12, city.tz), city.tz);
    const b = offsetAt(zonedToUtc(...Object.values(datePartsFromValue(addDays(state.date, 180))), 12, city.tz), city.tz);
    return a !== b;
  });
  $('dst-note').textContent = hasDst ? 'DST differences accounted for' : 'All times are location-aware';
}

function renderHomeSelect() {
  const select = $('home-select');
  select.innerHTML = '';
  state.cityIds.forEach((id) => {
    const city = cityById(id);
    const option = document.createElement('option');
    option.value = id;
    option.textContent = `${city.name} · ${city.tz}`;
    select.appendChild(option);
  });
  if (!state.cityIds.includes(state.homeId)) state.homeId = state.cityIds[0];
  select.value = state.homeId;
}

function renderAll() {
  renderCityList();
  renderHomeSelect();
  renderTimeline();
  renderMeeting();
  renderRanked();
}

function tickClocks() {
  const now = new Date();
  const p = partsInZone(now, homeCity().tz);
  $('home-now').textContent = `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}:${String(p.second).padStart(2, '0')}`;
  document.querySelectorAll('.city-row').forEach((row, index) => {
    const city = cityById(state.cityIds[index]);
    if (!city) return;
    const local = partsInZone(now, city.tz);
    const target = row.querySelector('.live');
    if (target) target.textContent = `${String(local.hour).padStart(2, '0')}:${String(local.minute).padStart(2, '0')}`;
  });
}

function init() {
  state.date = todayInZone(homeCity().tz);
  $('date-input').value = state.date;
  $('hour-range').value = state.meetingHour;
  renderAll();
  tickClocks();
  setInterval(tickClocks, 1000);
  $('date-input').addEventListener('change', () => {
    if (!$('date-input').value) return;
    state.date = $('date-input').value;
    renderAll();
  });
  $('prev-day').addEventListener('click', () => { state.date = addDays(state.date, -1); renderAll(); });
  $('next-day').addEventListener('click', () => { state.date = addDays(state.date, 1); renderAll(); });
  $('minus-hour').addEventListener('click', () => setMeetingHour(state.meetingHour - 1));
  $('plus-hour').addEventListener('click', () => setMeetingHour(state.meetingHour + 1));
  $('hour-range').addEventListener('input', (event) => setMeetingHour(Number(event.target.value)));
  $('home-select').addEventListener('change', (event) => {
    state.homeId = event.target.value;
    state.date = todayInZone(homeCity().tz);
    renderAll();
  });
  $('add-city').addEventListener('click', () => {
    const id = $('city-picker').value;
    if (!id || state.cityIds.includes(id) || state.cityIds.length >= 8) return;
    state.cityIds.push(id);
    saveCities();
    renderAll();
  });
  document.addEventListener('keydown', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;
    if (event.key === 'ArrowLeft') { state.date = addDays(state.date, -1); renderAll(); }
    if (event.key === 'ArrowRight') { state.date = addDays(state.date, 1); renderAll(); }
    if (event.key === 'ArrowUp') setMeetingHour(state.meetingHour + 1);
    if (event.key === 'ArrowDown') setMeetingHour(state.meetingHour - 1);
  });
  $('year').textContent = `© ${new Date().getFullYear()}`;
}

init();
