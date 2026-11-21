// RTR Room: finish the Figma file "RTR Room — UX/UI (RTR-G2)".
// Run once: Figma desktop → Plugins → Development → Import plugin from manifest… → choose this manifest.json,
// open the RTR file, then Plugins → Development → RTR Finish Design.
// The file was finished on 2026-11-20 except two small fixes; running this again rebuilds screens 04–06 with
// those fixes (badge labels, invoice table width). It: (1) renders Khmer characters with Kantumruy Pro, (2) fixes the Dashboard KPI grid and donut,
// (3) builds 04 · Invoices, 05 · Tenant Portal (mobile) and 06 · Add Room modal, (4) wires the prototype.
// Safe to re-run: frames it creates are replaced by name.

const F = 'Source Sans Pro';
const K = 'Kantumruy Pro';
const KHMER = /[ក-៿᧠-᧿]+/g;
const hex = (h) => { h = h.replace('#', ''); return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 }; };
const solid = (h, opacity = 1) => ({ type: 'SOLID', color: hex(h), opacity });
const WHITE = solid('#ffffff');

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
  return t;
}
function append(parent, child, fill) {
  parent.appendChild(child);
  if (fill === 'h' || fill === 'both') child.layoutSizingHorizontal = 'FILL';
  if (fill === 'v' || fill === 'both') child.layoutSizingVertical = 'FILL';
  return child;
}
function setText(inst, prefix, value) {
  const key = Object.keys(inst.componentProperties).find((k) => k.startsWith(prefix));
  if (key) inst.setProperties({ [key]: value });
}
async function node(id, name, page) {
  const n = await figma.getNodeByIdAsync(id);
  if (n) return n;
  return page ? page.findOne((x) => x.name === name) : null;
}

async function main() {
  for (const s of ['Regular', 'SemiBold', 'Bold']) await figma.loadFontAsync({ family: F, style: s });
  for (const s of ['Regular', 'SemiBold', 'Bold']) await figma.loadFontAsync({ family: K, style: s });

  const dsPage = figma.root.children.find((p) => p.name.includes('Design System')) || figma.root.children[0];
  const page = figma.root.children.find((p) => p.name.includes('Screens')) || figma.root.children[1];
  await dsPage.loadAsync();
  await page.loadAsync();
  await figma.setCurrentPageAsync(page);

  // Components made by the first build (IDs from the build, names as fallback)
  const sidebarC = await node('3:2', 'App Sidebar', page);
  const navbarC = await node('3:105', 'App Navbar', page);
  const btnSet = await node('2:15', 'Button', dsPage);
  const badgeSet = await node('2:34', 'Status Badge', dsPage);
  const inputC = await node('2:37', 'Input', dsPage);
  const variant = (set, name) => set.children.find((c) => c.name === name);

  // Remove frames from an earlier run of this plugin
  for (const name of ['04 · Invoices', '05 · Tenant Portal (mobile)', '06 · Add Room (modal)']) {
    page.findChildren((n) => n.name === name).forEach((n) => n.remove());
  }

  // ---------- (2) Dashboard fixes ----------
  const dash = await node('4:65', '02 · Dashboard', page);
  const grid = dash.findOne((n) => n.name === 'KPI grid');
  if (grid) grid.children.forEach((k) => k.resize(368, 132));
  const oldDonut = dash.findOne((n) => n.name === 'Donut (DonutChart.vue)');
  if (oldDonut) {
    const parent = oldDonut.parent;
    const idx = parent.children.indexOf(oldDonut);
    oldDonut.remove();
    const fr = figma.createFrame();
    fr.name = 'Donut (DonutChart.vue)';
    fr.resize(150, 150);
    fr.fills = [];
    let start = -Math.PI / 2;
    for (const [c, p] of [['#f59e0b', 0.868], ['#2563eb', 0.003], ['#22c55e', 0.129]]) {
      const e = figma.createEllipse();
      e.resize(150, 150);
      const end = start + p * 2 * Math.PI;
      e.arcData = { startingAngle: start, endingAngle: end, innerRadius: 0.68 };
      e.fills = [solid(c)];
      fr.appendChild(e);
      start = end;
    }
    const t = txt('៛3.26M', 'Bold', 18);
    fr.appendChild(t);
    t.x = 75 - t.width / 2;
    t.y = 62;
    parent.insertChild(idx, fr);
  }

  // ---------- (3) New screens ----------
  function shell(name, x, active, title) {
    const f = figma.createFrame();
    f.name = name;
    f.resize(1440, 900);
    f.x = x;
    f.y = 0;
    f.fills = [solid('#f4f6fb')];
    f.clipsContent = true;
    f.layoutMode = 'HORIZONTAL';
    f.primaryAxisSizingMode = 'FIXED';
    f.counterAxisSizingMode = 'FIXED';
    page.appendChild(f);
    const sb = sidebarC.createInstance();
    append(f, sb, 'v');
    const nav = sb.findOne((n) => n.type === 'INSTANCE' && n.name === 'Nav/' + active);
    if (nav) nav.setProperties({ State: 'Active' });
    const main = append(f, al('VERTICAL', { name: 'Main' }), 'both');
    const nb = navbarC.createInstance();
    append(main, nb, 'h');
    setText(nb, 'Title', title);
    const content = append(main, al('VERTICAL', { name: 'Content', itemSpacing: 16, paddingLeft: 20, paddingRight: 20, paddingTop: 18, paddingBottom: 18 }), 'both');
    return { f, content };
  }

  // 04 · Invoices
  const I = shell('04 · Invoices', 4620, 'Invoices', 'Invoices');
  const head = append(I.content, al('HORIZONTAL', { name: 'Content header', itemSpacing: 10, counterAxisAlignItems: 'CENTER' }), 'h');
  const hl = al('VERTICAL', { name: 'Heading', itemSpacing: 2 });
  hl.appendChild(txt('Invoices', 'Bold', 28));
  hl.appendChild(txt('Utilities of the chosen month + rent of the next month', 'Regular', 14, solid('#6b7280')));
  head.appendChild(hl);
  const sp = figma.createFrame(); sp.fills = []; sp.resize(1, 1); head.appendChild(sp); sp.layoutGrow = 1;
  for (const [st, label] of [['Outline', 'ABA KHQR'], ['Warning', 'Proofs  1'], ['Primary', 'Generate invoices']]) {
    const b = variant(btnSet, 'Style=' + st).createInstance(); setText(b, 'Label', label); head.appendChild(b);
  }
  const stats = append(I.content, al('HORIZONTAL', { name: 'Summary boxes', itemSpacing: 16 }), 'h');
  for (const [c, label, value] of [['#6b7280', 'Invoices', '5'], ['#2563eb', 'Billed', '៛3,261,000'], ['#16a34a', 'Collected', '៛1,598,700'], ['#ef4444', 'Outstanding · 1 overdue', '៛1,662,300']]) {
    const box = append(stats, al('HORIZONTAL', { name: 'Info box ' + label, itemSpacing: 12, paddingLeft: 10, paddingRight: 16, paddingTop: 10, paddingBottom: 10, counterAxisAlignItems: 'CENTER', cornerRadius: 12 }), 'h');
    box.fills = [WHITE];
    const ic = al('HORIZONTAL', { name: 'icon', cornerRadius: 10, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
    ic.primaryAxisSizingMode = 'FIXED'; ic.counterAxisSizingMode = 'FIXED'; ic.resize(56, 56); ic.fills = [solid(c)];
    ic.appendChild(txt('■', 'Bold', 20, WHITE));
    box.appendChild(ic);
    const col = al('VERTICAL', { itemSpacing: 2 });
    col.appendChild(txt(label, 'Regular', 15, solid('#374151')));
    col.appendChild(txt(value, 'Bold', 17));
    box.appendChild(col);
  }
  const card = append(I.content, al('VERTICAL', { name: 'Invoice table card', cornerRadius: 14, clipsContent: true }), 'h');
  card.fills = [WHITE];
  const filt = append(card, al('HORIZONTAL', { name: 'Filters', itemSpacing: 12, paddingLeft: 18, paddingRight: 18, paddingTop: 14, paddingBottom: 14 }), 'h');
  const month = inputC.createInstance(); setText(month, 'Placeholder', '◀   October 2026   ▶'); filt.appendChild(month); month.resize(260, 40);
  const search = inputC.createInstance(); setText(search, 'Placeholder', 'Search invoice number, room or tenant...'); filt.appendChild(search); search.resize(460, 40);
  const status = inputC.createInstance(); setText(status, 'Placeholder', 'All statuses   ▾'); filt.appendChild(status); status.resize(220, 40);
  const cols = [['Invoice', 230], ['Room / tenant', 200], ['Total', 140], ['Balance', 140], ['Due', 130], ['Status', 150], ['', 0]];
  function row(cells, isHead) {
    const r = append(card, al('HORIZONTAL', { name: isHead ? 'Table head' : 'Row ' + cells[0][0], paddingLeft: 18, paddingRight: 18, paddingTop: isHead ? 10 : 12, paddingBottom: isHead ? 10 : 12, counterAxisAlignItems: 'CENTER' }), 'h');
    r.strokes = [solid('#eef1f6')]; r.strokeTopWeight = 1; r.strokeBottomWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0;
    cells.forEach((cell, i) => {
      const c = al('VERTICAL', { name: cols[i][0] || 'Actions', itemSpacing: 2 });
      r.appendChild(c);
      if (cols[i][1]) { c.resize(cols[i][1], 20); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; } else { c.layoutGrow = 1; c.counterAxisAlignItems = 'MAX'; }
      for (const n of cell) c.appendChild(n);
    });
    return r;
  }
  row(cols.map(([h]) => [txt(h, 'SemiBold', 13, solid('#4b5563'))]), true);
  const invoices = [
    ['INV-202610-0001', 'D101', 'Tenant A', '៛572,100', '៛0', '-', 'Paid'],
    ['INV-202610-0002', 'D102', 'Tenant B', '៛604,600', '៛604,600', '-', 'Unpaid'],
    ['INV-202610-0003', 'D103', 'Tenant C', '៛660,500', '៛250,500', '-', 'Partial'],
    ['INV-202610-0004', 'D104', 'Tenant D', '៛807,200', '៛807,200', '2026-11-06', 'Overdue'],
    ['INV-202610-0005', 'D105', 'Tenant E', '៛616,600', '៛0', '-', 'Paid'],
  ];
  for (const [no, room, who, total, bal, due, st] of invoices) {
    const badge = variant(badgeSet, 'Status=' + st).createInstance();
    setText(badge, 'Text', st);
    const open = al('HORIZONTAL', { paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5, cornerRadius: 6 }); open.strokes = [solid('#2563eb')]; open.appendChild(txt('Open', 'SemiBold', 12, solid('#2563eb')));
    row([
      [txt(no, 'Bold', 15, solid('#2563eb')), txt('Utilities 2026-10 · Rent 2026-11', 'Regular', 12, solid('#6b7280'))],
      [txt(room, 'Bold', 15), txt(who, 'Regular', 13, solid('#6b7280'))],
      [txt(total, 'Regular', 15)],
      [txt(bal, 'Bold', 15)],
      [txt(due, due === '-' ? 'Regular' : 'Bold', 15, due === '-' ? solid('#14213d') : solid('#ef4444'))],
      [badge],
      [open],
    ]);
  }

  // 05 · Tenant Portal (mobile)
  const P = figma.createFrame();
  P.name = '05 · Tenant Portal (mobile)'; P.resize(390, 844); P.x = 6160; P.y = 0; P.fills = [solid('#eef1f6')]; P.clipsContent = true;
  P.layoutMode = 'VERTICAL'; P.primaryAxisSizingMode = 'FIXED'; P.counterAxisSizingMode = 'FIXED';
  page.appendChild(P);
  const ph = append(P, al('HORIZONTAL', { name: 'Portal header', paddingLeft: 18, paddingRight: 18, paddingTop: 16, paddingBottom: 16, counterAxisAlignItems: 'CENTER', itemSpacing: 8 }), 'h');
  ph.fills = [solid('#343a40')];
  const who = al('VERTICAL'); who.appendChild(txt('Tenant B', 'Bold', 20, WHITE)); who.appendChild(txt('Room D102', 'Regular', 14, solid('#d1d5db'))); ph.appendChild(who);
  const sp2 = figma.createFrame(); sp2.fills = []; sp2.resize(1, 1); ph.appendChild(sp2); sp2.layoutGrow = 1;
  ph.appendChild(txt('ខ្មែរ | EN', 'SemiBold', 13, WHITE));
  const body = append(P, al('VERTICAL', { name: 'Portal body', itemSpacing: 14, paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16 }), 'both');
  const ann = append(body, al('VERTICAL', { name: 'Announcement', itemSpacing: 2, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, cornerRadius: 8 }), 'h');
  ann.fills = [solid('#17a2b8')];
  ann.appendChild(txt('📢  Water cut on Sunday 8–10 AM', 'Bold', 15, WHITE));
  ann.appendChild(txt('Please keep some water ready. Thank you.', 'Regular', 13, WHITE));
  const bal = append(body, al('VERTICAL', { name: 'Balance card', itemSpacing: 6, paddingLeft: 20, paddingRight: 20, paddingTop: 18, paddingBottom: 18, cornerRadius: 16 }), 'h');
  bal.fills = [solid('#0d6efd')];
  bal.appendChild(txt('Amount to pay', 'Regular', 14, WHITE));
  bal.appendChild(txt('៛604,600', 'Bold', 34, WHITE));
  bal.appendChild(txt('≈ $147.46', 'Regular', 14, WHITE));
  const vb = al('HORIZONTAL', { name: 'View invoice', paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6, cornerRadius: 8 }); vb.fills = [WHITE]; vb.appendChild(txt('View invoice  ›', 'SemiBold', 14)); bal.appendChild(vb);
  const room = append(body, al('VERTICAL', { name: 'My room card', itemSpacing: 10, paddingLeft: 20, paddingRight: 20, paddingTop: 16, paddingBottom: 16, cornerRadius: 16 }), 'h');
  room.fills = [WHITE];
  room.appendChild(txt('🏠  My room', 'Bold', 17));
  for (const [a, b] of [['Room', 'D102'], ['Move-in date', '1 Jul 2026'], ['Monthly rent', '$120.00'], ['Deposit', '$120.00']]) {
    const r = append(room, al('HORIZONTAL', { name: a, primaryAxisAlignItems: 'SPACE_BETWEEN' }), 'h');
    r.appendChild(txt(a, 'Regular', 15, solid('#6b7280'))); r.appendChild(txt(b, 'Bold', 15));
  }
  const tabs = append(P, al('HORIZONTAL', { name: 'Bottom tab bar', paddingTop: 10, paddingBottom: 14, primaryAxisAlignItems: 'SPACE_BETWEEN', paddingLeft: 18, paddingRight: 18 }), 'h');
  tabs.fills = [WHITE]; tabs.strokes = [solid('#e5e7eb')]; tabs.strokeTopWeight = 1; tabs.strokeBottomWeight = 0; tabs.strokeLeftWeight = 0; tabs.strokeRightWeight = 0;
  for (const [ic, label, on] of [['⌂', 'Home', 1], ['▤', 'Invoices', 0], ['ϟ', 'Utilities', 0], ['⚒', 'Repairs', 0], ['◎', 'Deposit', 0]]) {
    const t = al('VERTICAL', { name: 'Tab ' + label, counterAxisAlignItems: 'CENTER', itemSpacing: 2 });
    t.appendChild(txt(ic, 'Bold', 18, solid(on ? '#0d6efd' : '#6b7280')));
    t.appendChild(txt(label, on ? 'Bold' : 'Regular', 12, solid(on ? '#0d6efd' : '#6b7280')));
    tabs.appendChild(t);
  }

  // 06 · Add Room (modal) — used as a prototype overlay
  const M = al('VERTICAL', { name: '06 · Add Room (modal)', itemSpacing: 0, cornerRadius: 12, clipsContent: true });
  M.counterAxisSizingMode = 'FIXED'; M.resize(500, 100); M.x = 3080; M.y = 1000; M.fills = [WHITE];
  M.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.25 }, offset: { x: 0, y: 12 }, radius: 32, spread: 0, visible: true, blendMode: 'NORMAL' }];
  page.appendChild(M);
  const mh = append(M, al('HORIZONTAL', { name: 'Modal header', paddingLeft: 20, paddingRight: 20, paddingTop: 16, paddingBottom: 16, primaryAxisAlignItems: 'SPACE_BETWEEN' }), 'h');
  mh.strokes = [solid('#eef1f6')]; mh.strokeBottomWeight = 1; mh.strokeTopWeight = 0; mh.strokeLeftWeight = 0; mh.strokeRightWeight = 0;
  mh.appendChild(txt('Add Room', 'Bold', 18));
  const closeX = txt('×', 'Regular', 22, solid('#6b7280')); closeX.name = 'Close'; mh.appendChild(closeX);
  const mb = append(M, al('VERTICAL', { name: 'Modal body', itemSpacing: 12, paddingLeft: 20, paddingRight: 20, paddingTop: 16, paddingBottom: 16 }), 'h');
  for (const [label, ph2] of [['Room number *', 'e.g. D107'], ['Floor', '2'], ['Type', 'Single'], ['Rent / month (USD) *', '120.00'], ['Status', 'Available   ▾']]) {
    const g = append(mb, al('VERTICAL', { name: label, itemSpacing: 4 }), 'h');
    g.appendChild(txt(label, 'SemiBold', 14));
    const i = inputC.createInstance(); setText(i, 'Placeholder', ph2); append(g, i, 'h');
  }
  const err = txt('The room number has already been taken.', 'Regular', 13, solid('#ef4444')); err.name = 'Validation example'; mb.insertChild(1, err);
  const mf = append(M, al('HORIZONTAL', { name: 'Modal footer', itemSpacing: 10, paddingLeft: 20, paddingRight: 20, paddingTop: 14, paddingBottom: 14, primaryAxisAlignItems: 'MAX' }), 'h');
  mf.fills = [solid('#fafbfd')];
  const cancel = variant(btnSet, 'Style=Outline').createInstance(); setText(cancel, 'Label', 'Cancel'); cancel.name = 'Cancel'; mf.appendChild(cancel);
  const save = variant(btnSet, 'Style=Primary').createInstance(); setText(save, 'Label', 'Save'); save.name = 'Save'; mf.appendChild(save);

  // ---------- (4) Prototype ----------
  const login = await node('3:126', '01 · Login', page);
  const rooms = await node('4:263', '03 · Rooms', page);
  const go = (dest, navigation = 'NAVIGATE') => [{
    trigger: { type: 'ON_CLICK' },
    actions: [{ type: 'NODE', destinationId: dest.id, navigation, transition: { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 }, preserveScrollPosition: false }],
  }];
  const closeOverlay = [{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'CLOSE' }] }];

  const loginBtn = login.findOne((n) => n.name === 'Login button');
  if (loginBtn) await loginBtn.setReactionsAsync(go(dash));
  const targets = { Dashboard: dash, Rooms: rooms, Invoices: I.f };
  for (const screen of [dash, rooms, I.f]) {
    for (const [label, dest] of Object.entries(targets)) {
      const nav = screen.findOne((n) => n.type === 'INSTANCE' && n.name === 'Nav/' + label);
      if (nav && dest !== screen) await nav.setReactionsAsync(go(dest));
    }
  }
  const addBtn = rooms.findOne((n) => n.name === 'Add Room button');
  if (addBtn) await addBtn.setReactionsAsync(go(M, 'OVERLAY'));
  await closeX.setReactionsAsync(closeOverlay);
  await cancel.setReactionsAsync(closeOverlay);
  await save.setReactionsAsync(closeOverlay);
  page.flowStartingPoints = [
    { nodeId: login.id, name: 'Admin: login → dashboard → rooms / invoices' },
    { nodeId: P.id, name: 'Tenant portal (mobile)' },
  ];

  // Status badges: show the label of their own variant (Rooms screen and any older copies)
  for (const inst of page.findAllWithCriteria({ types: ['INSTANCE'] })) {
    const mc = await inst.getMainComponentAsync();
    if (mc && mc.parent && mc.parent.type === 'COMPONENT_SET' && mc.parent.name === 'Status Badge') {
      setText(inst, 'Text', mc.name.replace('Status=', ''));
    }
  }

  // ---------- (1) Khmer glyphs → Kantumruy Pro (both pages) ----------
  let fixed = 0;
  for (const pg of [dsPage, page]) {
    for (const t of pg.findAllWithCriteria({ types: ['TEXT'] })) {
      const s = t.characters;
      if (!KHMER.test(s)) continue;
      KHMER.lastIndex = 0;
      for (const seg of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName);
      let m;
      while ((m = KHMER.exec(s))) {
        const style = t.getRangeFontName(m.index, m.index + 1).style;
        t.setRangeFontName(m.index, m.index + m[0].length, { family: K, style: ['Bold', 'SemiBold'].includes(style) ? style : 'Regular' });
        fixed++;
      }
    }
  }

  figma.viewport.scrollAndZoomIntoView([login, dash, rooms, I.f, P]);
  figma.closePlugin(`RTR design finished: 3 screens added, prototype wired, ${fixed} Khmer runs fixed.`);
}

main().catch((e) => figma.closePlugin('Error: ' + e.message));
