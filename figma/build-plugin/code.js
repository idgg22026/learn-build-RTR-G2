// RTR Room: build the complete UX/UI in an EMPTY Figma design file. No AI calls needed.
// Figma desktop → Plugins → Development → Import plugin from manifest… → this manifest.json
// Then open an empty design file → Plugins → Development → RTR Build Design.
// Creates: page "🎨 Design System" (variables, text/effect styles, Button, Status Badge, Input, Nav Item, KPI Card)
// and page "📱 Screens & Prototype" (App Sidebar, App Navbar, 01 Login, 02 Dashboard, 03 Rooms, 04 Invoices,
// 05 Tenant Portal mobile, 06 Add Room modal) with clickable prototype links.

const F = 'Source Sans Pro';
const K = 'Kantumruy Pro'; // Khmer glyphs (Source Sans Pro has none)
const KH = /[ក-៿᧠-᧿]+/g;
const hex = (h) => { h = h.replace('#', ''); return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 }; };
const solid = (h, o = 1) => ({ type: 'SOLID', color: hex(h), opacity: o });
const WHITE = solid('#ffffff');
const grad = (a, b, t = [[0.7, 0.7, 0], [-0.7, 0.7, 0.3]]) => ({ type: 'GRADIENT_LINEAR', gradientTransform: t, gradientStops: [{ position: 0, color: { ...hex(a), a: 1 } }, { position: 1, color: { ...hex(b), a: 1 } }] });
const shadow = (a, y, r, c = [20, 33, 61]) => ({ type: 'DROP_SHADOW', color: { r: c[0] / 255, g: c[1] / 255, b: c[2] / 255, a }, offset: { x: 0, y }, radius: r, spread: 0, visible: true, blendMode: 'NORMAL' });

function al(dir, props = {}) {
  const f = figma.createFrame();
  f.layoutMode = dir;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = [];
  for (const [k, v] of Object.entries(props)) f[k] = v;
  return f;
}
function txt(s, style, size, paint) {
  const t = figma.createText();
  t.fontName = { family: F, style };
  t.fontSize = size;
  t.characters = s;
  t.fills = [paint || solid('#14213d')];
  KH.lastIndex = 0;
  let m;
  while ((m = KH.exec(s))) t.setRangeFontName(m.index, m.index + m[0].length, { family: K, style });
  return t;
}
function add(parent, child, fill) {
  parent.appendChild(child);
  if (fill === 'h' || fill === 'both') child.layoutSizingHorizontal = 'FILL';
  if (fill === 'v' || fill === 'both') child.layoutSizingVertical = 'FILL';
  return child;
}
function spacer(parent) { const s = figma.createFrame(); s.name = 'Spacer'; s.fills = []; s.resize(1, 1); parent.appendChild(s); s.layoutGrow = 1; return s; }
function setText(inst, prefix, value) {
  const key = Object.keys(inst.componentProperties).find((k) => k.startsWith(prefix));
  if (key) inst.setProperties({ [key]: value });
}
function svg(markup, name) { const n = figma.createNodeFromSvg(markup); n.name = name; return n; }
const GRID_ICON = '<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="6" height="6" rx="1.5" fill="#fbbf24"/><rect x="10" y="2" width="6" height="6" rx="1.5" fill="#fbbf24"/><rect x="2" y="10" width="6" height="6" rx="1.5" fill="#fbbf24"/><rect x="10" y="10" width="6" height="6" rx="1.5" fill="#fbbf24"/></svg>';
const BUILDING = (c1, c2) => `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="1" width="12" height="16" rx="1.5" fill="${c1}"/><rect x="5.5" y="4" width="2.5" height="2.5" fill="${c2}"/><rect x="10" y="4" width="2.5" height="2.5" fill="${c2}"/><rect x="5.5" y="8.5" width="2.5" height="2.5" fill="${c2}"/><rect x="10" y="8.5" width="2.5" height="2.5" fill="${c2}"/><rect x="7.5" y="13" width="3" height="4" fill="${c2}"/></svg>`;

async function main() {
  for (const s of ['Regular', 'SemiBold', 'Bold']) { await figma.loadFontAsync({ family: F, style: s }); await figma.loadFontAsync({ family: K, style: s }); }

  const ds = figma.root.children[0];
  ds.name = '🎨 Design System';
  await figma.setCurrentPageAsync(ds);

  // ================= Variables & styles =================
  const col = figma.variables.createVariableCollection('RTR Tokens');
  col.renameMode(col.modes[0].modeId, 'Light');
  const mode = col.modes[0].modeId;
  const COLORS = {
    'color/navy': ['#0f1b3d', ['FRAME_FILL', 'SHAPE_FILL'], '--rtr-navy'],
    'color/navy-2': ['#14213d', ['FRAME_FILL', 'SHAPE_FILL'], '--rtr-navy-2'],
    'color/primary': ['#2563eb', ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR', 'TEXT_FILL'], '--rtr-blue'],
    'color/page': ['#f4f6fb', ['FRAME_FILL', 'SHAPE_FILL'], '--rtr-page'],
    'color/surface': ['#ffffff', ['FRAME_FILL', 'SHAPE_FILL'], '--rtr-surface'],
    'color/border': ['#e5e7eb', ['STROKE_COLOR'], '--rtr-border'],
    'color/text/ink': ['#14213d', ['TEXT_FILL'], '--rtr-ink'],
    'color/text/muted': ['#6b7280', ['TEXT_FILL'], '--rtr-muted'],
    'color/text/on-dark': ['#c7d2e8', ['TEXT_FILL'], '--rtr-on-dark'],
    'color/accent/amber': ['#fbbf24', ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'], '--rtr-amber'],
    'color/accent/orange': ['#f97316', ['FRAME_FILL', 'SHAPE_FILL'], '--rtr-orange'],
    'color/status/success': ['#16a34a', ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'], '--rtr-success'],
    'color/status/warning': ['#f59e0b', ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'], '--rtr-warning'],
    'color/status/danger': ['#ef4444', ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'], '--rtr-danger'],
    'color/status/info': ['#0ea5e9', ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'], '--rtr-info'],
  };
  const V = {};
  for (const [n, [h, scopes, css]] of Object.entries(COLORS)) {
    const v = figma.variables.createVariable(n, col, 'COLOR');
    v.setValueForMode(mode, hex(h)); v.scopes = scopes; v.setVariableCodeSyntax('WEB', `var(${css})`); V[n] = v;
  }
  for (const [n, val, scopes] of [['spacing/xs', 4, ['GAP']], ['spacing/sm', 8, ['GAP']], ['spacing/md', 16, ['GAP']], ['spacing/lg', 24, ['GAP']], ['radius/sm', 8, ['CORNER_RADIUS']], ['radius/md', 10, ['CORNER_RADIUS']], ['radius/lg', 14, ['CORNER_RADIUS']], ['radius/full', 999, ['CORNER_RADIUS']]]) {
    const v = figma.variables.createVariable(n, col, 'FLOAT');
    v.setValueForMode(mode, val); v.scopes = scopes; v.setVariableCodeSyntax('WEB', `var(--rtr-${n.replace('/', '-')})`);
  }
  const B = (name) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', V[name]);
  for (const [n, st, sz, lh] of [['Heading/H1', 'Bold', 28, 34], ['Heading/H2', 'Bold', 20, 26], ['Heading/Card title', 'Bold', 16, 22], ['Body/Regular', 'Regular', 15, 22], ['Body/Strong', 'SemiBold', 15, 22], ['Caption', 'Regular', 13, 18], ['Label/Overline', 'Bold', 11, 14], ['Number/KPI', 'Bold', 26, 32]]) {
    const t = figma.createTextStyle(); t.name = n; t.fontName = { family: F, style: st }; t.fontSize = sz; t.lineHeight = { unit: 'PIXELS', value: lh };
  }
  const styled = []; // nodes that get the Shadow/Card effect style at the end (async setter)
  const cardStyle = figma.createEffectStyle(); cardStyle.name = 'Shadow/Card'; cardStyle.effects = [shadow(0.08, 4, 14)];

  // ================= Design System board =================
  const board = al('VERTICAL', { name: 'Design System Board', itemSpacing: 36, paddingLeft: 48, paddingRight: 48, paddingTop: 48, paddingBottom: 48 });
  board.fills = [solid('#f4f6fb')];
  ds.appendChild(board);
  board.appendChild(txt('RTR Room — Design System', 'Bold', 36));
  board.appendChild(txt('Tokens from vuejs-app/src/assets/rtr-theme.css · AdminLTE 3 + Bootstrap 4 · Source Sans Pro + Kantumruy Pro (ខ្មែរ)', 'Regular', 16, solid('#6b7280')));
  const section = (n) => { const s = al('VERTICAL', { name: n, itemSpacing: 14 }); s.appendChild(txt(n, 'Bold', 22)); board.appendChild(s); return s; };
  const grid = (set, wrapW) => {
    set.layoutMode = 'HORIZONTAL'; set.itemSpacing = 14; set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 16;
    set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO';
    if (wrapW) { set.layoutWrap = 'WRAP'; set.counterAxisSpacing = 14; set.primaryAxisSizingMode = 'FIXED'; set.resize(wrapW, 100); set.counterAxisSizingMode = 'AUTO'; }
  };

  const swS = section('Color Tokens');
  const sw = al('HORIZONTAL', { name: 'Swatches', itemSpacing: 12 });
  swS.appendChild(sw);
  sw.layoutWrap = 'WRAP'; sw.counterAxisSpacing = 12; sw.primaryAxisSizingMode = 'FIXED'; sw.resize(940, 100); sw.counterAxisSizingMode = 'AUTO';
  for (const [n, [h]] of Object.entries(COLORS)) {
    const c = al('VERTICAL', { name: n, itemSpacing: 6, paddingLeft: 8, paddingRight: 8, paddingTop: 8, paddingBottom: 10, cornerRadius: 10 });
    c.fills = [WHITE];
    const r = figma.createRectangle(); r.resize(160, 52); r.cornerRadius = 8; r.fills = [B(n)]; r.strokes = [solid('#e5e7eb')];
    c.appendChild(r); c.appendChild(txt(n.replace('color/', ''), 'Bold', 13)); c.appendChild(txt(h, 'Regular', 12, solid('#6b7280')));
    sw.appendChild(c);
  }

  // Button
  const btnS = section('Buttons');
  const btns = [];
  for (const [n, fill, stroke, tc] of [['Primary', 'color/primary', null, '#ffffff'], ['Outline', null, 'color/primary', null], ['Warning', 'color/status/warning', null, '#14213d'], ['Danger', null, 'color/status/danger', null]]) {
    const c = figma.createComponent(); c.name = 'Style=' + n;
    c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
    c.paddingLeft = c.paddingRight = 16; c.paddingTop = c.paddingBottom = 9; c.cornerRadius = 8; c.counterAxisAlignItems = 'CENTER'; c.primaryAxisAlignItems = 'CENTER';
    c.fills = fill ? [B(fill)] : [WHITE];
    if (stroke) c.strokes = [B(stroke)];
    const t = txt('+ Add Room', 'SemiBold', 15, tc ? solid(tc) : B(stroke)); c.appendChild(t);
    const k = c.addComponentProperty('Label', 'TEXT', '+ Add Room'); t.componentPropertyReferences = { characters: k };
    btns.push(c);
  }
  const btnSet = figma.combineAsVariants(btns, btnS); btnSet.name = 'Button'; grid(btnSet);
  btnSet.description = 'Bootstrap .btn, 8px radius. Primary = main action, Outline = secondary, Warning = waiting items, Danger = delete (owner only).';

  // Status Badge
  const bS = section('Status Badges');
  const badges = [];
  for (const [n, bg, fg] of [['Paid', '#16a34a', '#ffffff'], ['Unpaid', '#f59e0b', '#14213d'], ['Partial', '#0ea5e9', '#ffffff'], ['Overdue', '#ef4444', '#ffffff'], ['Available', '#16a34a', '#ffffff'], ['Occupied', '#2563eb', '#ffffff'], ['Maintenance', '#f59e0b', '#14213d'], ['Owner use', '#6b7280', '#ffffff']]) {
    const c = figma.createComponent(); c.name = 'Status=' + n;
    c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
    c.paddingLeft = c.paddingRight = 8; c.paddingTop = c.paddingBottom = 3; c.cornerRadius = 4; c.fills = [solid(bg)];
    const t = txt(n, 'Bold', 12, solid(fg)); c.appendChild(t);
    const k = c.addComponentProperty('Text', 'TEXT', n); t.componentPropertyReferences = { characters: k };
    badges.push(c);
  }
  const badgeSet = figma.combineAsVariants(badges, bS); badgeSet.name = 'Status Badge'; grid(badgeSet);
  badgeSet.description = 'RoomStatusBadge.vue / TenantStatusBadge.vue / invoice status.';

  // Input
  const fS = section('Form Controls');
  const inputC = figma.createComponent(); inputC.name = 'Input';
  inputC.layoutMode = 'HORIZONTAL'; inputC.counterAxisAlignItems = 'CENTER'; inputC.paddingLeft = inputC.paddingRight = 12; inputC.paddingTop = inputC.paddingBottom = 9; inputC.cornerRadius = 8;
  inputC.primaryAxisSizingMode = 'FIXED'; inputC.counterAxisSizingMode = 'AUTO'; inputC.resize(320, 40);
  inputC.fills = [B('color/surface')]; inputC.strokes = [B('color/border')];
  const it = txt('Search room number or type...', 'Regular', 15, B('color/text/muted')); inputC.appendChild(it); it.layoutSizingHorizontal = 'FILL';
  const ik = inputC.addComponentProperty('Placeholder', 'TEXT', 'Search room number or type...'); it.componentPropertyReferences = { characters: ik };
  inputC.description = '.form-control, 8px radius. Search, filters and modal forms.';
  fS.appendChild(inputC);

  // Nav Item
  const nS = section('Sidebar Nav Item');
  const navBack = al('HORIZONTAL', { name: 'Nav backdrop', paddingLeft: 12, paddingRight: 12, paddingTop: 12, paddingBottom: 12, cornerRadius: 12 });
  navBack.fills = [solid('#0f1b3d')]; nS.appendChild(navBack);
  const navs = [];
  for (const st of ['Default', 'Active']) {
    const c = figma.createComponent(); c.name = 'State=' + st;
    c.layoutMode = 'HORIZONTAL'; c.counterAxisAlignItems = 'CENTER'; c.itemSpacing = 10; c.paddingLeft = c.paddingRight = 12; c.paddingTop = c.paddingBottom = 9; c.cornerRadius = 10;
    c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.resize(224, 40);
    if (st === 'Active') { c.fills = [grad('#2563eb', '#3b82f6', [[1, 0, 0], [0, 1, 0]])]; c.effects = [shadow(0.45, 6, 16, [37, 99, 235])]; } else c.fills = [];
    c.appendChild(svg(GRID_ICON, 'icon'));
    const t = txt('Rooms', 'SemiBold', 15, st === 'Active' ? WHITE : B('color/text/on-dark')); c.appendChild(t);
    const k = c.addComponentProperty('Label', 'TEXT', 'Rooms'); t.componentPropertyReferences = { characters: k };
    navs.push(c);
  }
  const navSet = figma.combineAsVariants(navs, navBack); navSet.name = 'Nav Item'; grid(navSet); navSet.fills = [];
  navSet.description = 'Sidebar.vue menu link. Active = blue gradient pill with glow.';

  // KPI Card
  const kS = section('KPI Card (Dashboard)');
  const kpis = [];
  for (const [n, a, b] of [['Purple', '#6366f1', '#8b5cf6'], ['Green', '#16a34a', '#22c55e'], ['Orange', '#ea580c', '#f97316'], ['Blue', '#2563eb', '#3b82f6'], ['Pink', '#db2777', '#ec4899'], ['Teal', '#0d9488', '#14b8a6']]) {
    const c = figma.createComponent(); c.name = 'Color=' + n;
    c.layoutMode = 'VERTICAL'; c.itemSpacing = 4; c.paddingLeft = c.paddingRight = 16; c.paddingTop = c.paddingBottom = 14; c.cornerRadius = 14;
    c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED'; c.resize(280, 132);
    c.fills = [grad(a, b)]; c.effects = [shadow(0.15, 6, 18)];
    const t1 = txt('Income', 'Regular', 15, WHITE), t2 = txt('៛3,261,000', 'Bold', 26, WHITE), t3 = txt('▲ 4.2% vs last month', 'Regular', 13, solid('#ffffff', 0.9));
    [t1, t2, t3].forEach((x) => c.appendChild(x));
    const k1 = c.addComponentProperty('Title', 'TEXT', 'Income'), k2 = c.addComponentProperty('Value', 'TEXT', '៛3,261,000'), k3 = c.addComponentProperty('Sub', 'TEXT', '▲ 4.2% vs last month');
    t1.componentPropertyReferences = { characters: k1 }; t2.componentPropertyReferences = { characters: k2 }; t3.componentPropertyReferences = { characters: k3 };
    kpis.push(c);
  }
  const kpiSet = figma.combineAsVariants(kpis, kS); kpiSet.name = 'KPI Card'; grid(kpiSet, 940);
  kpiSet.description = 'components/dashboard/KpiCard.vue: gradient card, 14px radius, title + value + change vs last month.';

  const variant = (set, name) => set.children.find((c) => c.name === name);

  // ================= Screens page =================
  const page = figma.createPage(); page.name = '📱 Screens & Prototype';
  await figma.setCurrentPageAsync(page);

  // App Sidebar component
  const sb = figma.createComponent(); sb.name = 'App Sidebar'; sb.x = 0; sb.y = -1100;
  sb.layoutMode = 'VERTICAL'; sb.primaryAxisSizingMode = 'FIXED'; sb.counterAxisSizingMode = 'FIXED'; sb.resize(256, 900);
  sb.paddingLeft = sb.paddingRight = 12; sb.itemSpacing = 2; sb.paddingBottom = 16;
  sb.fills = [grad('#0f1b3d', '#0c1530', [[0, 1, 0], [-1, 0, 1]])];
  page.appendChild(sb);
  const brand = add(sb, al('HORIZONTAL', { name: 'Brand', itemSpacing: 10, paddingTop: 12, paddingBottom: 12, paddingLeft: 4, counterAxisAlignItems: 'CENTER' }), 'h');
  const logo = al('HORIZONTAL', { name: 'Logo', cornerRadius: 10, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
  logo.primaryAxisSizingMode = 'FIXED'; logo.counterAxisSizingMode = 'FIXED'; logo.resize(36, 36); logo.fills = [grad('#fbbf24', '#f97316')];
  logo.appendChild(svg(BUILDING('#ffffff', '#f97316'), 'icon/building'));
  brand.appendChild(logo);
  const bt = al('VERTICAL', { name: 'Brand text' }); bt.appendChild(txt('RTR Room', 'Bold', 18, WHITE)); bt.appendChild(txt('Room rental manager', 'Regular', 12, B('color/accent/amber'))); brand.appendChild(bt);
  for (const [g, items] of [['MAIN', ['Dashboard']], ['PROPERTY', ['Rooms', 'Tenants', 'Utilities', 'Requests']], ['MONEY', ['Invoices', 'Expenses', 'Reports']], ['ADMIN', ['Logins', 'Help']]]) {
    const hw = al('HORIZONTAL', { name: 'Header ' + g, paddingLeft: 12, paddingTop: 14, paddingBottom: 6 });
    const h = txt(g, 'Bold', 11, solid('#6b7a99')); h.letterSpacing = { unit: 'PIXELS', value: 1.2 }; hw.appendChild(h); sb.appendChild(hw);
    for (const label of items) { const inst = navs[0].createInstance(); inst.name = 'Nav/' + label; setText(inst, 'Label', label); add(sb, inst, 'h'); }
  }
  spacer(sb).layoutSizingHorizontal = 'FILL';
  const w = add(sb, al('VERTICAL', { name: 'Today widget', itemSpacing: 6, paddingLeft: 14, paddingRight: 14, paddingTop: 14, paddingBottom: 14, cornerRadius: 14 }), 'h');
  w.fills = [solid('#ffffff', 0.06)]; w.strokes = [solid('#fbbf24', 0.25)];
  w.appendChild(txt('Today', 'Bold', 15, B('color/accent/amber')));
  for (const [a, b] of [['Exchange rate', '$1 = ៛4,100'], ['Meter reading', '28 Nov · 17 days left']]) {
    const r = add(w, al('HORIZONTAL', { name: a, primaryAxisAlignItems: 'SPACE_BETWEEN' }), 'h');
    r.appendChild(txt(a, 'Regular', 13, solid('#a5b1cc'))); r.appendChild(txt(b, 'Bold', 13, WHITE));
  }
  const bar = add(w, al('HORIZONTAL', { name: 'progress', cornerRadius: 3 }), 'h');
  bar.counterAxisSizingMode = 'FIXED'; bar.resize(200, 6); bar.fills = [solid('#ffffff', 0.12)];
  const fillBar = figma.createRectangle(); fillBar.resize(120, 6); fillBar.cornerRadius = 3; fillBar.fills = [solid('#22c55e')]; bar.appendChild(fillBar);
  w.appendChild(txt('3 / 5 rooms read for November', 'Regular', 11, solid('#8a96b3')));
  sb.description = 'components/includes/Sidebar.vue: navy gradient menu. Owner-only: Expenses, Reports, Logins.';

  // App Navbar component
  const nb = figma.createComponent(); nb.name = 'App Navbar'; nb.x = 300; nb.y = -1100;
  nb.layoutMode = 'HORIZONTAL'; nb.primaryAxisSizingMode = 'FIXED'; nb.counterAxisSizingMode = 'FIXED'; nb.resize(1184, 60);
  nb.counterAxisAlignItems = 'CENTER'; nb.paddingLeft = nb.paddingRight = 20; nb.itemSpacing = 14; nb.fills = [B('color/surface')]; nb.effects = [shadow(0.06, 2, 10)];
  page.appendChild(nb);
  nb.appendChild(txt('☰', 'Regular', 18, B('color/text/muted')));
  const pt = txt('Dashboard', 'Bold', 17); pt.name = 'Page title'; nb.appendChild(pt);
  const ptk = nb.addComponentProperty('Title', 'TEXT', 'Dashboard'); pt.componentPropertyReferences = { characters: ptk };
  spacer(nb);
  const lang = al('HORIZONTAL', { name: 'Lang switch', itemSpacing: 2, paddingLeft: 3, paddingRight: 3, paddingTop: 3, paddingBottom: 3, cornerRadius: 999 });
  lang.fills = [B('color/page')]; lang.strokes = [B('color/border')];
  const l1 = al('HORIZONTAL', { paddingLeft: 10, paddingRight: 10, paddingTop: 3, paddingBottom: 3, cornerRadius: 999 }); l1.appendChild(txt('ខ្មែរ', 'SemiBold', 13, B('color/text/muted')));
  const l2 = al('HORIZONTAL', { paddingLeft: 10, paddingRight: 10, paddingTop: 3, paddingBottom: 3, cornerRadius: 999 }); l2.fills = [B('color/primary')]; l2.appendChild(txt('EN', 'SemiBold', 13, WHITE));
  lang.appendChild(l1); lang.appendChild(l2); nb.appendChild(lang);
  const chip = al('HORIZONTAL', { name: 'Date chip', paddingLeft: 14, paddingRight: 14, paddingTop: 5, paddingBottom: 5, cornerRadius: 999 }); chip.fills = [B('color/page')]; chip.strokes = [B('color/border')];
  chip.appendChild(txt('Wed 11 Nov 2026', 'Regular', 13)); nb.appendChild(chip);
  const bell = al('HORIZONTAL', { name: 'Notifications', itemSpacing: 2, counterAxisAlignItems: 'CENTER' });
  const bellDot = figma.createEllipse(); bellDot.resize(16, 16); bellDot.fills = [solid('#6b7280')]; bell.appendChild(bellDot);
  const cnt = al('HORIZONTAL', { name: 'count', paddingLeft: 5, paddingRight: 5, cornerRadius: 9 }); cnt.fills = [solid('#ef4444')]; cnt.appendChild(txt('8', 'Bold', 11, WHITE)); bell.appendChild(cnt);
  nb.appendChild(bell);
  const user = al('HORIZONTAL', { name: 'User', itemSpacing: 10, counterAxisAlignItems: 'CENTER' });
  const av = al('HORIZONTAL', { name: 'Avatar', cornerRadius: 999, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
  av.primaryAxisSizingMode = 'FIXED'; av.counterAxisSizingMode = 'FIXED'; av.resize(38, 38); av.fills = [grad('#2563eb', '#7c3aed')];
  av.appendChild(txt('SD', 'Bold', 13, WHITE)); user.appendChild(av);
  const un = al('VERTICAL', { name: 'Name' }); un.appendChild(txt('Owner (Demo)', 'Bold', 14)); un.appendChild(txt('Owner', 'SemiBold', 12, solid('#16a34a'))); user.appendChild(un);
  nb.appendChild(user);
  nb.description = 'components/includes/Navbar.vue: title, Khmer/English switch, date, notifications, user menu.';

  // Screen shell
  function shell(name, x, active, title) {
    const f = figma.createFrame();
    f.name = name; f.resize(1440, 900); f.x = x; f.y = 0; f.fills = [solid('#f4f6fb')]; f.clipsContent = true;
    f.layoutMode = 'HORIZONTAL'; f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED';
    page.appendChild(f);
    const s = sb.createInstance(); add(f, s, 'v');
    const nav = s.findOne((n) => n.type === 'INSTANCE' && n.name === 'Nav/' + active);
    if (nav) nav.setProperties({ State: 'Active' });
    const main = add(f, al('VERTICAL', { name: 'Main' }), 'both');
    const bar2 = nb.createInstance(); add(main, bar2, 'h'); setText(bar2, 'Title', title);
    const content = add(main, al('VERTICAL', { name: 'Content', itemSpacing: 16, paddingLeft: 20, paddingRight: 20, paddingTop: 18, paddingBottom: 18 }), 'both');
    return { f, content };
  }
  function header(content, title, sub, buttons) {
    const h = add(content, al('HORIZONTAL', { name: 'Content header', itemSpacing: 10, counterAxisAlignItems: 'CENTER' }), 'h');
    const l = al('VERTICAL', { name: 'Heading', itemSpacing: 2 }); l.appendChild(txt(title, 'Bold', 28)); if (sub) l.appendChild(txt(sub, 'Regular', 14, solid('#6b7280'))); h.appendChild(l);
    spacer(h);
    return buttons.map(([st, label]) => { const b = variant(btnSet, 'Style=' + st).createInstance(); setText(b, 'Label', label); h.appendChild(b); return b; });
  }
  function card(parent, name) { const c = add(parent, al('VERTICAL', { name, cornerRadius: 14, clipsContent: true }), 'h'); c.fills = [WHITE]; styled.push(c); return c; }
  function table(cardNode, cols, rows) {
    const mk = (cells, head) => {
      const r = add(cardNode, al('HORIZONTAL', { name: head ? 'Table head' : 'Row', paddingLeft: 18, paddingRight: 18, paddingTop: head ? 10 : 12, paddingBottom: head ? 10 : 12, counterAxisAlignItems: 'CENTER' }), 'h');
      r.strokes = [solid('#eef1f6')]; r.strokeTopWeight = 1; r.strokeBottomWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0;
      cells.forEach((cell, i) => {
        const c = al(cols[i][1] ? 'VERTICAL' : 'HORIZONTAL', { name: cols[i][0] || 'Actions', itemSpacing: cols[i][1] ? 2 : 6 });
        r.appendChild(c);
        if (cols[i][1]) { c.counterAxisSizingMode = 'FIXED'; c.resize(cols[i][1], 20); c.primaryAxisSizingMode = 'AUTO'; } else { c.layoutGrow = 1; c.primaryAxisAlignItems = 'MAX'; }
        for (const n of cell) c.appendChild(n);
      });
      return r;
    };
    mk(cols.map(([h]) => [txt(h || ' ', 'SemiBold', 13, solid('#4b5563'))]), true);
    return rows.map((cells) => mk(cells, false));
  }
  const outlineBtn = (label, color) => { const b = al('HORIZONTAL', { name: label, paddingLeft: 9, paddingRight: 9, paddingTop: 5, paddingBottom: 5, cornerRadius: 6 }); b.strokes = [solid(color)]; b.appendChild(txt(label, 'SemiBold', 12, solid(color))); return b; };
  const badge = (st) => { const b = variant(badgeSet, 'Status=' + st).createInstance(); setText(b, 'Text', st); return b; };

  // 01 · Login
  const login = figma.createFrame(); login.name = '01 · Login'; login.resize(1440, 900); login.x = 0; login.y = 0; login.fills = [solid('#252b36')];
  login.layoutMode = 'HORIZONTAL'; login.primaryAxisSizingMode = 'FIXED'; login.counterAxisSizingMode = 'FIXED'; login.primaryAxisAlignItems = 'CENTER'; login.counterAxisAlignItems = 'CENTER';
  page.appendChild(login);
  const lc = al('VERTICAL', { name: 'Login card', itemSpacing: 16, paddingLeft: 32, paddingRight: 32, paddingTop: 28, paddingBottom: 28, cornerRadius: 14, counterAxisAlignItems: 'CENTER' });
  lc.fills = [WHITE]; login.appendChild(lc); lc.counterAxisSizingMode = 'FIXED'; lc.resize(440, 100); lc.primaryAxisSizingMode = 'AUTO';
  const lsw = lang.clone(); lc.appendChild(lsw); lsw.layoutAlign = 'MAX';
  const ttl = al('HORIZONTAL', { name: 'Title', itemSpacing: 8, counterAxisAlignItems: 'CENTER' });
  const lg = svg(BUILDING('#2563eb', '#ffffff'), 'icon/building'); lg.resize(26, 26); ttl.appendChild(lg); ttl.appendChild(txt('RTR Room', 'Bold', 30)); lc.appendChild(ttl);
  lc.appendChild(txt('Log in with your phone number and password', 'Regular', 15, solid('#6b7280')));
  for (const [n, p] of [['Phone', '012 345 678'], ['Password', '••••••••']]) { const i = inputC.createInstance(); i.name = n; setText(i, 'Placeholder', p); add(lc, i, 'h'); }
  const loginBtn = variant(btnSet, 'Style=Primary').createInstance(); loginBtn.name = 'Login button'; setText(loginBtn, 'Label', '→  Log in'); add(lc, loginBtn, 'h');
  lc.appendChild(txt('Demo: 010000001 / Demo1234', 'Regular', 13, solid('#6b7280')));

  // 02 · Dashboard
  const D = shell('02 · Dashboard', 1540, 'Dashboard', 'Dashboard');
  header(D.content, 'Dashboard', 'Invoices for October 2026 · Nov 2025 – Oct 2026', [['Outline', 'October 2026  ▾']]);
  const kg = add(D.content, al('HORIZONTAL', { name: 'KPI grid', itemSpacing: 16 }), 'h');
  kg.layoutWrap = 'WRAP'; kg.counterAxisSpacing = 16;
  for (const [c, a, b, s] of [['Purple', 'Income', '៛3,261,000', '▲ 4.2% vs last month'], ['Green', 'Collected', '៛1,598,700', '49% of ៛3.26M'], ['Orange', 'Net profit', '៛3,199,500', '▲ 4.2% · margin 98.1%'], ['Blue', 'Occupied rooms', '5 / 6', '31 days · −៛615K empty'], ['Pink', 'Tenants', '5', '+1 occupant · 1 moving out'], ['Teal', 'Outstanding', '៛1,662,300', '3 invoices · 1 overdue']]) {
    const k = variant(kpiSet, 'Color=' + c).createInstance(); kg.appendChild(k); k.resize(368, 132); setText(k, 'Title', a); setText(k, 'Value', b); setText(k, 'Sub', s);
  }
  const cr = add(D.content, al('HORIZONTAL', { name: 'Charts row', itemSpacing: 16 }), 'h');
  const c1 = al('VERTICAL', { name: 'Income & expenses card', itemSpacing: 10, paddingLeft: 18, paddingRight: 18, paddingTop: 18, paddingBottom: 18, cornerRadius: 14 });
  c1.fills = [WHITE]; styled.push(c1); cr.appendChild(c1); c1.layoutGrow = 1;
  c1.appendChild(txt('Income and expenses · 12 months', 'Bold', 17));
  const lgd = al('HORIZONTAL', { name: 'Legend', itemSpacing: 14 }); lgd.appendChild(txt('● Income', 'Regular', 13, solid('#2563eb'))); lgd.appendChild(txt('● Expenses', 'Regular', 13, solid('#ef4444'))); c1.appendChild(lgd);
  const chart = svg('<svg width="640" height="220" viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg"><g stroke="#eef1f6"><line x1="0" y1="20" x2="640" y2="20"/><line x1="0" y1="70" x2="640" y2="70"/><line x1="0" y1="120" x2="640" y2="120"/><line x1="0" y1="170" x2="640" y2="170"/><line x1="0" y1="210" x2="640" y2="210"/></g><path d="M10 210 L330 210 L380 45 L440 44 L500 43 L620 35 L620 210 Z" fill="#2563eb" fill-opacity="0.12"/><path d="M10 210 L330 210 L380 45 L440 44 L500 43 L620 35" stroke="#2563eb" stroke-width="2.5" fill="none"/><path d="M10 210 L500 210 L560 206 L620 206" stroke="#ef4444" stroke-width="2.5" fill="none"/></svg>', 'Trend chart (TrendChart.vue)');
  add(c1, chart, 'h');
  const c2 = al('VERTICAL', { name: 'Income by type card', itemSpacing: 14, paddingLeft: 18, paddingRight: 18, paddingTop: 18, paddingBottom: 18, cornerRadius: 14 });
  c2.fills = [WHITE]; styled.push(c2); cr.appendChild(c2); c2.counterAxisSizingMode = 'FIXED'; c2.resize(420, 100); c2.layoutSizingVertical = 'FILL';
  c2.appendChild(txt('Income by type · October', 'Bold', 17));
  const dr = al('HORIZONTAL', { name: 'Donut row', itemSpacing: 20, counterAxisAlignItems: 'CENTER' }); c2.appendChild(dr);
  const donut = figma.createFrame(); donut.name = 'Donut (DonutChart.vue)'; donut.resize(150, 150); donut.fills = [];
  let start = -Math.PI / 2;
  for (const [c, p] of [['#f59e0b', 0.868], ['#2563eb', 0.003], ['#22c55e', 0.129]]) {
    const e = figma.createEllipse(); e.resize(150, 150); const end = start + p * 2 * Math.PI;
    e.arcData = { startingAngle: start, endingAngle: end, innerRadius: 0.68 }; e.fills = [solid(c)]; donut.appendChild(e); start = end;
  }
  const dt = txt('៛3.26M', 'Bold', 18); donut.appendChild(dt); dt.x = 75 - dt.width / 2; dt.y = 64;
  dr.appendChild(donut);
  const dl = al('VERTICAL', { name: 'Donut legend', itemSpacing: 10 }); dr.appendChild(dl);
  for (const [c, a, b] of [['#f59e0b', 'Rent  86.8%', '៛2,829,000'], ['#2563eb', 'Water  0.3%', '៛10,400'], ['#22c55e', 'Electricity  12.9%', '៛421,600']]) {
    const i = al('VERTICAL'); i.appendChild(txt('● ' + a, 'SemiBold', 14, solid(c))); i.appendChild(txt(b, 'Regular', 13, solid('#6b7280'))); dl.appendChild(i);
  }

  // 03 · Rooms
  const R = shell('03 · Rooms', 3080, 'Rooms', 'Rooms');
  const [addRoomBtn] = header(R.content, 'Rooms', '6 rooms · 5 occupied · 1 available', [['Primary', '+ Add Room']]);
  addRoomBtn.name = 'Add Room button';
  const rc = card(R.content, 'Rooms table card');
  const rf = add(rc, al('HORIZONTAL', { name: 'Filters', itemSpacing: 12, paddingLeft: 18, paddingRight: 18, paddingTop: 14, paddingBottom: 14 }), 'h');
  const s1 = inputC.createInstance(); rf.appendChild(s1); s1.resize(480, 40);
  const s2 = inputC.createInstance(); setText(s2, 'Placeholder', 'All statuses   ▾'); rf.appendChild(s2); s2.resize(220, 40);
  table(rc, [['Room', 150], ['Floor', 110], ['Type', 170], ['Rent / month', 170], ['Status', 200], ['', 0]],
    [['D101', '1', 'Single', '$120.00', 'Occupied'], ['D102', '1', 'Single', '$120.00', 'Occupied'], ['D103', '1', 'Double', '$150.00', 'Occupied'], ['D104', '2', 'Double', '$150.00', 'Occupied'], ['D105', '2', 'Single', '$140.00', 'Occupied'], ['D106', '2', 'Single', '$120.00', 'Available']]
      .map(([n, fl, t, p, s]) => [[txt(n, 'Bold', 15)], [txt(fl, 'Regular', 15)], [txt(t, 'Regular', 15)], [txt(p, 'Regular', 15)], [badge(s)], [outlineBtn('Items', '#0ea5e9'), outlineBtn('Edit', '#2563eb'), outlineBtn('Delete', '#ef4444')]]));
  const foot = add(rc, al('HORIZONTAL', { name: 'Pagination', paddingLeft: 18, paddingRight: 18, paddingTop: 12, paddingBottom: 12, primaryAxisAlignItems: 'SPACE_BETWEEN', counterAxisAlignItems: 'CENTER' }), 'h');
  foot.fills = [solid('#fafbfd')]; foot.appendChild(txt('Showing 1–6 of 6', 'Regular', 13, solid('#6b7280')));
  const pg = al('HORIZONTAL', { name: 'pages' });
  for (const [l, a] of [['«', 0], ['1', 1], ['»', 0]]) { const p = al('HORIZONTAL', { paddingLeft: 10, paddingRight: 10, paddingTop: 4, paddingBottom: 4 }); p.fills = [a ? B('color/primary') : WHITE]; p.strokes = [B('color/border')]; p.appendChild(txt(l, 'SemiBold', 13, a ? WHITE : B('color/primary'))); pg.appendChild(p); }
  foot.appendChild(pg);

  // 04 · Invoices
  const I = shell('04 · Invoices', 4620, 'Invoices', 'Invoices');
  header(I.content, 'Invoices', 'Utilities of the chosen month + rent of the next month', [['Outline', 'ABA KHQR'], ['Warning', 'Proofs  1'], ['Primary', 'Generate invoices']]);
  const stats = add(I.content, al('HORIZONTAL', { name: 'Summary boxes', itemSpacing: 16 }), 'h');
  for (const [c, label, value] of [['#6b7280', 'Invoices', '5'], ['#2563eb', 'Billed', '៛3,261,000'], ['#16a34a', 'Collected', '៛1,598,700'], ['#ef4444', 'Outstanding · 1 overdue', '៛1,662,300']]) {
    const box = add(stats, al('HORIZONTAL', { name: 'Info box ' + label, itemSpacing: 12, paddingLeft: 10, paddingRight: 16, paddingTop: 10, paddingBottom: 10, counterAxisAlignItems: 'CENTER', cornerRadius: 12 }), 'h');
    box.fills = [WHITE]; styled.push(box);
    const ic = al('HORIZONTAL', { name: 'icon', cornerRadius: 10, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
    ic.primaryAxisSizingMode = 'FIXED'; ic.counterAxisSizingMode = 'FIXED'; ic.resize(56, 56); ic.fills = [solid(c)];
    const sq = figma.createRectangle(); sq.resize(20, 24); sq.cornerRadius = 3; sq.fills = [WHITE]; ic.appendChild(sq);
    box.appendChild(ic);
    const col2 = al('VERTICAL', { itemSpacing: 2 }); col2.appendChild(txt(label, 'Regular', 15, solid('#374151'))); col2.appendChild(txt(value, 'Bold', 17)); box.appendChild(col2);
  }
  const ic2 = card(I.content, 'Invoice table card');
  const ifl = add(ic2, al('HORIZONTAL', { name: 'Filters', itemSpacing: 12, paddingLeft: 18, paddingRight: 18, paddingTop: 14, paddingBottom: 14 }), 'h');
  for (const [p, wdt] of [['◀   October 2026   ▶', 260], ['Search invoice number, room or tenant...', 460], ['All statuses   ▾', 220]]) { const i = inputC.createInstance(); setText(i, 'Placeholder', p); ifl.appendChild(i); i.resize(wdt, 40); }
  table(ic2, [['Invoice', 230], ['Room / tenant', 200], ['Total', 140], ['Balance', 140], ['Due', 130], ['Status', 150], ['', 0]],
    [['INV-202610-0001', 'D101', 'Tenant A', '៛572,100', '៛0', '-', 'Paid'], ['INV-202610-0002', 'D102', 'Tenant B', '៛604,600', '៛604,600', '-', 'Unpaid'], ['INV-202610-0003', 'D103', 'Tenant C', '៛660,500', '៛250,500', '-', 'Partial'], ['INV-202610-0004', 'D104', 'Tenant D', '៛807,200', '៛807,200', '2026-11-06', 'Overdue'], ['INV-202610-0005', 'D105', 'Tenant E', '៛616,600', '៛0', '-', 'Paid']]
      .map(([no, room, who, total, bal, due, st]) => [
        [txt(no, 'Bold', 15, solid('#2563eb')), txt('Utilities 2026-10 · Rent 2026-11', 'Regular', 12, solid('#6b7280'))],
        [txt(room, 'Bold', 15), txt(who, 'Regular', 13, solid('#6b7280'))],
        [txt(total, 'Regular', 15)], [txt(bal, 'Bold', 15)],
        [txt(due, due === '-' ? 'Regular' : 'Bold', 15, solid(due === '-' ? '#14213d' : '#ef4444'))],
        [badge(st)], [outlineBtn('Open', '#2563eb'), outlineBtn('Print', '#6b7280')],
      ]));

  // 05 · Tenant Portal (mobile)
  const P = figma.createFrame(); P.name = '05 · Tenant Portal (mobile)'; P.resize(390, 844); P.x = 6160; P.y = 0; P.fills = [solid('#eef1f6')]; P.clipsContent = true;
  P.layoutMode = 'VERTICAL'; P.primaryAxisSizingMode = 'FIXED'; P.counterAxisSizingMode = 'FIXED';
  page.appendChild(P);
  const ph = add(P, al('HORIZONTAL', { name: 'Portal header', paddingLeft: 18, paddingRight: 18, paddingTop: 16, paddingBottom: 16, counterAxisAlignItems: 'CENTER', itemSpacing: 8 }), 'h');
  ph.fills = [solid('#343a40')];
  const who = al('VERTICAL', { name: 'Tenant' }); who.appendChild(txt('Tenant B', 'Bold', 20, WHITE)); who.appendChild(txt('Room D102', 'Regular', 14, solid('#d1d5db'))); ph.appendChild(who);
  spacer(ph); ph.appendChild(txt('ខ្មែរ | EN', 'SemiBold', 13, WHITE));
  const body = add(P, al('VERTICAL', { name: 'Portal body', itemSpacing: 14, paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16 }), 'both');
  const ann = add(body, al('VERTICAL', { name: 'Announcement', itemSpacing: 2, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, cornerRadius: 8 }), 'h');
  ann.fills = [solid('#17a2b8')]; ann.appendChild(txt('Water cut on Sunday 8–10 AM', 'Bold', 15, WHITE)); ann.appendChild(txt('Please keep some water ready. Thank you.', 'Regular', 13, WHITE));
  const balC = add(body, al('VERTICAL', { name: 'Balance card', itemSpacing: 6, paddingLeft: 20, paddingRight: 20, paddingTop: 18, paddingBottom: 18, cornerRadius: 16 }), 'h');
  balC.fills = [solid('#0d6efd')];
  balC.appendChild(txt('Amount to pay', 'Regular', 14, WHITE)); balC.appendChild(txt('៛604,600', 'Bold', 34, WHITE)); balC.appendChild(txt('≈ $147.46', 'Regular', 14, WHITE));
  const vb = al('HORIZONTAL', { name: 'View invoice', paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6, cornerRadius: 8 }); vb.fills = [WHITE]; vb.appendChild(txt('View invoice  ›', 'SemiBold', 14)); balC.appendChild(vb);
  const roomC = add(body, al('VERTICAL', { name: 'My room card', itemSpacing: 10, paddingLeft: 20, paddingRight: 20, paddingTop: 16, paddingBottom: 16, cornerRadius: 16 }), 'h');
  roomC.fills = [WHITE]; roomC.appendChild(txt('My room', 'Bold', 17));
  for (const [a, b] of [['Room', 'D102'], ['Move-in date', '1 Jul 2026'], ['Monthly rent', '$120.00'], ['Deposit', '$120.00']]) {
    const r = add(roomC, al('HORIZONTAL', { name: a, primaryAxisAlignItems: 'SPACE_BETWEEN' }), 'h'); r.appendChild(txt(a, 'Regular', 15, solid('#6b7280'))); r.appendChild(txt(b, 'Bold', 15));
  }
  const tabs = add(P, al('HORIZONTAL', { name: 'Bottom tab bar', paddingTop: 10, paddingBottom: 14, paddingLeft: 18, paddingRight: 18, primaryAxisAlignItems: 'SPACE_BETWEEN' }), 'h');
  tabs.fills = [WHITE]; tabs.strokes = [solid('#e5e7eb')]; tabs.strokeTopWeight = 1; tabs.strokeBottomWeight = 0; tabs.strokeLeftWeight = 0; tabs.strokeRightWeight = 0;
  for (const [label, on] of [['Home', 1], ['Invoices', 0], ['Utilities', 0], ['Repairs', 0], ['Deposit', 0]]) {
    const t = al('VERTICAL', { name: 'Tab ' + label, counterAxisAlignItems: 'CENTER', itemSpacing: 4 });
    const d = figma.createEllipse(); d.resize(18, 18); d.fills = [solid(on ? '#0d6efd' : '#9ca3af')]; t.appendChild(d);
    t.appendChild(txt(label, on ? 'Bold' : 'Regular', 12, solid(on ? '#0d6efd' : '#6b7280'))); tabs.appendChild(t);
  }

  // 06 · Add Room (modal)
  const M = al('VERTICAL', { name: '06 · Add Room (modal)', cornerRadius: 12, clipsContent: true });
  page.appendChild(M); M.counterAxisSizingMode = 'FIXED'; M.resize(500, 100); M.primaryAxisSizingMode = 'AUTO'; M.x = 3080; M.y = 1000; M.fills = [WHITE]; M.effects = [shadow(0.25, 12, 32, [0, 0, 0])];
  const mh = add(M, al('HORIZONTAL', { name: 'Modal header', paddingLeft: 20, paddingRight: 20, paddingTop: 16, paddingBottom: 16, primaryAxisAlignItems: 'SPACE_BETWEEN' }), 'h');
  mh.strokes = [solid('#eef1f6')]; mh.strokeBottomWeight = 1; mh.strokeTopWeight = 0; mh.strokeLeftWeight = 0; mh.strokeRightWeight = 0;
  mh.appendChild(txt('Add Room', 'Bold', 18));
  const closeX = txt('×', 'Regular', 22, solid('#6b7280')); closeX.name = 'Close'; mh.appendChild(closeX);
  const mb = add(M, al('VERTICAL', { name: 'Modal body', itemSpacing: 12, paddingLeft: 20, paddingRight: 20, paddingTop: 16, paddingBottom: 16 }), 'h');
  for (const [label, p] of [['Room number *', 'D101'], ['Floor', '2'], ['Type', 'Single'], ['Rent / month (USD) *', '120.00'], ['Status', 'Available   ▾']]) {
    const g = add(mb, al('VERTICAL', { name: label, itemSpacing: 4 }), 'h'); g.appendChild(txt(label, 'SemiBold', 14));
    const i = inputC.createInstance(); setText(i, 'Placeholder', p); add(g, i, 'h');
    if (label === 'Room number *') { i.strokes = [solid('#ef4444')]; g.appendChild(txt('The room number has already been taken.', 'Regular', 13, solid('#ef4444'))); }
  }
  const mf = add(M, al('HORIZONTAL', { name: 'Modal footer', itemSpacing: 10, paddingLeft: 20, paddingRight: 20, paddingTop: 14, paddingBottom: 14, primaryAxisAlignItems: 'MAX' }), 'h');
  mf.fills = [solid('#fafbfd')];
  const cancel = variant(btnSet, 'Style=Outline').createInstance(); cancel.name = 'Cancel'; setText(cancel, 'Label', 'Cancel'); mf.appendChild(cancel);
  const save = variant(btnSet, 'Style=Primary').createInstance(); save.name = 'Save'; setText(save, 'Label', 'Save'); mf.appendChild(save);

  for (const n of styled) await n.setEffectStyleIdAsync(cardStyle.id);

  // ================= Prototype =================
  const go = (dest, navigation = 'NAVIGATE') => [{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: dest.id, navigation, transition: { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 }, preserveScrollPosition: false }] }];
  const closeIt = [{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'CLOSE' }] }];
  await loginBtn.setReactionsAsync(go(D.f));
  const targets = { Dashboard: D.f, Rooms: R.f, Invoices: I.f };
  for (const screen of [D.f, R.f, I.f]) {
    for (const [label, dest] of Object.entries(targets)) {
      const nav = screen.findOne((n) => n.type === 'INSTANCE' && n.name === 'Nav/' + label);
      if (nav && dest !== screen) await nav.setReactionsAsync(go(dest));
    }
  }
  await addRoomBtn.setReactionsAsync(go(M, 'OVERLAY'));
  for (const n of [closeX, cancel, save]) await n.setReactionsAsync(closeIt);
  page.flowStartingPoints = [{ nodeId: login.id, name: 'Admin: login → dashboard → rooms / invoices' }, { nodeId: P.id, name: 'Tenant portal (mobile)' }];

  figma.viewport.scrollAndZoomIntoView([login, D.f, R.f, I.f, P]);
  figma.closePlugin('RTR design built: design system, 6 screens and prototype. Press ▶ Present to try it.');
}

main().catch((e) => figma.closePlugin('Error: ' + e.message));
