const STORAGE_KEY = "smartResidenceOwnerGuardDemoV3";
const SHARED_STATE_KEY = "smartResidenceQrSharedStateV3";

if (typeof window.FIREBASE_CONFIG === "undefined") {
  window.FIREBASE_CONFIG = null;
}

const roleDescriptions = {
  resident: "Chu nha tao ma QR cho shipper, doi ky thuat hoac khach.",
  security: "Bao ve quet QR, xem thong tin va xac nhan dung doi tuong.",
  manager: "Ban quan ly giam sat QR, log ra vao, cu dan va phan anh."
};

const demoAccounts = {
  chu_nha_a1205: {
    password: "123456",
    role: "resident",
    name: "Tran Minh Khoa",
    label: "Chu nha A-1205",
    apartment: "A-1205"
  },
  bao_ve_01: {
    password: "123456",
    role: "security",
    name: "Bao ve ca sang",
    label: "Bao ve cong chinh"
  },
  quan_ly: {
    password: "123456",
    role: "manager",
    name: "Ban quan ly",
    label: "Quan ly van hanh"
  }
};

const defaultSectionByRole = {
  resident: "residentPortal",
  security: "securityGate",
  manager: "dashboard"
};

const passStatusLabels = {
  active: "Dang hieu luc",
  waitingOwner: "Cho chu nha xac nhan",
  ownerApproved: "Chu nha da dong y",
  checkedIn: "Da xac nhan vao",
  rejected: "Bi tu choi",
  expired: "Het han"
};

const ticketStatusLabels = {
  new: "Moi tiep nhan",
  processing: "Dang xu ly",
  done: "Da xu ly"
};

const els = {
  loginForm: document.getElementById("loginForm"),
  usernameInput: document.getElementById("usernameInput"),
  passwordInput: document.getElementById("passwordInput"),
  loginMessage: document.getElementById("loginMessage"),
  logoutButton: document.getElementById("logoutButton"),
  sessionName: document.getElementById("sessionName"),
  roleDescription: document.getElementById("roleDescription"),
  syncStatus: document.getElementById("syncStatus"),
  ownerSyncNote: document.getElementById("ownerSyncNote"),
  currentTime: document.getElementById("currentTime"),
  activePasses: document.getElementById("activePasses"),
  todayVisits: document.getElementById("todayVisits"),
  expiredPasses: document.getElementById("expiredPasses"),
  processingTickets: document.getElementById("processingTickets"),
  hourlyChart: document.getElementById("hourlyChart"),
  residentPassForm: document.getElementById("residentPassForm"),
  visitorName: document.getElementById("visitorName"),
  visitorType: document.getElementById("visitorType"),
  visitorPhone: document.getElementById("visitorPhone"),
  apartmentSelect: document.getElementById("apartmentSelect"),
  expireAt: document.getElementById("expireAt"),
  visitCode: document.getElementById("visitCode"),
  visitNote: document.getElementById("visitNote"),
  ownerQrCanvas: document.getElementById("ownerQrCanvas"),
  ownerQrStatus: document.getElementById("ownerQrStatus"),
  ownerShareGuest: document.getElementById("ownerShareGuest"),
  ownerShareMeta: document.getElementById("ownerShareMeta"),
  ownerShareToken: document.getElementById("ownerShareToken"),
  copyTokenButton: document.getElementById("copyTokenButton"),
  createdPassList: document.getElementById("createdPassList"),
  createdPassCount: document.getElementById("createdPassCount"),
  ownerConfirmList: document.getElementById("ownerConfirmList"),
  ownerConfirmCount: document.getElementById("ownerConfirmCount"),
  scanSelect: document.getElementById("scanSelect"),
  manualToken: document.getElementById("manualToken"),
  scanButton: document.getElementById("scanButton"),
  invalidScanButton: document.getElementById("invalidScanButton"),
  scanResult: document.getElementById("scanResult"),
  cameraCheckButton: document.getElementById("cameraCheckButton"),
  cameraStatus: document.getElementById("cameraStatus"),
  cameraPreview: document.getElementById("cameraPreview"),
  scanStatusBadge: document.getElementById("scanStatusBadge"),
  scanDetail: document.getElementById("scanDetail"),
  confirmEntryButton: document.getElementById("confirmEntryButton"),
  rejectEntryButton: document.getElementById("rejectEntryButton"),
  accessLogBody: document.getElementById("accessLogBody"),
  logCount: document.getElementById("logCount"),
  ticketForm: document.getElementById("ticketForm"),
  ticketTitle: document.getElementById("ticketTitle"),
  ticketCategory: document.getElementById("ticketCategory"),
  ticketContent: document.getElementById("ticketContent"),
  ticketList: document.getElementById("ticketList"),
  ticketCount: document.getElementById("ticketCount"),
  ticketCategoryChart: document.getElementById("ticketCategoryChart"),
  statusChart: document.getElementById("statusChart"),
  weeklyChart: document.getElementById("weeklyChart"),
  residentBody: document.getElementById("residentBody"),
  residentCount: document.getElementById("residentCount"),
  seedButton: document.getElementById("seedButton"),
  clearButton: document.getElementById("clearButton")
};

let state = loadState();
let scannedPassId = null;
let cameraStream = null;
let scannerFrameId = null;
let realtimeRef = null;
let applyingRemoteState = false;

function createSeedState() {
  const now = new Date();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  return {
    version: 3,
    session: null,
    residents: [
      { id: 1, name: "Tran Minh Khoa", apartment: "A-1205", phone: "0901 234 567", status: "Dang o" },
      { id: 2, name: "Nguyen Thu Ha", apartment: "B-0810", phone: "0918 456 789", status: "Dang o" },
      { id: 3, name: "Le Quoc Anh", apartment: "C-1512", phone: "0933 222 111", status: "Tam vang" },
      { id: 4, name: "Pham Gia Han", apartment: "A-0702", phone: "0988 111 222", status: "Dang o" }
    ],
    passes: [
      {
        id: 201,
        token: "SR-A1205-SHIP01",
        visitorName: "Shipper giao hang",
        type: "Shipper",
        phone: "0888 222 333",
        apartment: "A-1205",
        code: "SPX-9082",
        note: "Giao hang tai sanh A",
        status: "active",
        expireAt: new Date(now.getTime() + 5 * hour).toISOString(),
        createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        createdBy: "Tran Minh Khoa"
      },
      {
        id: 202,
        token: "SR-B0810-KT002",
        visitorName: "Doi ky thuat may lanh",
        type: "Doi ky thuat",
        phone: "0777 555 666",
        apartment: "B-0810",
        code: "KT-ML-02",
        note: "Sua may lanh phong khach",
        status: "active",
        expireAt: new Date(now.getTime() + 2 * hour).toISOString(),
        createdAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
        createdBy: "Nguyen Thu Ha"
      },
      {
        id: 203,
        token: "SR-C1512-OLD03",
        visitorName: "Khach tham cu",
        type: "Khach tham",
        phone: "0900 111 222",
        apartment: "C-1512",
        code: "",
        note: "Ma mau da het han",
        status: "active",
        expireAt: new Date(now.getTime() - hour).toISOString(),
        createdAt: new Date(now.getTime() - 8 * hour).toISOString(),
        createdBy: "Le Quoc Anh"
      }
    ],
    accessLogs: [
      {
        time: new Date(now.getTime() - 80 * 60 * 1000).toISOString(),
        visitorName: "Shipper giao hang",
        apartment: "A-1205",
        type: "Shipper",
        result: "Hop le",
        note: "Bao ve doi chieu dung QR do chu nha tao"
      }
    ],
    tickets: [
      {
        id: 101,
        title: "Den hanh lang tang 12 bi hong",
        category: "Dien nuoc",
        content: "Khu vuc gan thang may toi vao buoi toi.",
        apartment: "A-1205",
        status: "processing",
        createdAt: new Date(now.getTime() - 2 * day).toISOString()
      },
      {
        id: 102,
        title: "Thang may B rung nhe khi di chuyen",
        category: "Thang may",
        content: "Can kiem tra de dam bao an toan.",
        apartment: "B-0810",
        status: "new",
        createdAt: new Date(now.getTime() - 5 * hour).toISOString()
      }
    ]
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createSeedState();
    const parsed = JSON.parse(saved);
    return parsed.version === 3 ? normalizeState(parsed) : createSeedState();
  } catch {
    return createSeedState();
  }
}

function normalizeState(nextState) {
  return {
    ...createSeedState(),
    ...nextState,
    session: nextState.session || null,
    residents: Array.isArray(nextState.residents) ? nextState.residents : [],
    passes: Array.isArray(nextState.passes) ? nextState.passes : [],
    accessLogs: Array.isArray(nextState.accessLogs) ? nextState.accessLogs : [],
    tickets: Array.isArray(nextState.tickets) ? nextState.tickets : []
  };
}

function getSharedStateSnapshot() {
  const { session, ...sharedState } = state;
  return sharedState;
}

function setSyncStatus(message, mode = "offline") {
  if (els.syncStatus) {
    els.syncStatus.textContent = message;
    els.syncStatus.className = `sidebar-status ${mode}`;
  }
  if (els.ownerSyncNote) {
    els.ownerSyncNote.textContent = mode === "online"
      ? "Dong bo online dang bat: yeu cau tu dien thoai bao ve se hien tren dien thoai chu nha."
      : "Demo dang dung du lieu cuc bo. Hai dien thoai khac nhau can dien cau hinh Firebase trong firebase-config.js de dong bo.";
  }
}

function saveState(options = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const shouldSyncRemote = options.remote !== false;
  if (shouldSyncRemote && realtimeRef && !applyingRemoteState) {
    realtimeRef.set(getSharedStateSnapshot()).catch(() => {
      setSyncStatus("Dong bo: loi ghi Firebase, dang giu du lieu cuc bo.", "offline");
    });
  }
}

function applyRemoteSharedState(remoteState) {
  if (!remoteState || remoteState.version !== 3) return;
  const session = state.session || null;
  const selectedPassId = scannedPassId;
  applyingRemoteState = true;
  state = normalizeState({ ...remoteState, session });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();

  const selectedPass = state.passes.find((pass) => pass.id === selectedPassId);
  if (selectedPass) {
    const status = currentPassStatus(selectedPass);
    renderScanDetail(selectedPass, ["active", "waitingOwner", "ownerApproved"].includes(status) ? "success" : "error");
    if (getCurrentRole() === "security" && status === "ownerApproved") {
      els.scanResult.className = "result-box success";
      els.scanResult.textContent = "Chu nha da dong y. Bao ve co the ghi nhan cho vao.";
    }
    if (getCurrentRole() === "security" && status === "rejected") {
      els.scanResult.className = "result-box error";
      els.scanResult.textContent = "Chu nha da tu choi. Bao ve khong cho vao.";
    }
  }
  applyingRemoteState = false;
}

function initRealtimeSync() {
  const config = window.FIREBASE_CONFIG;
  if (!config || !config.databaseURL || !window.firebase) {
    setSyncStatus("Dong bo: dang dung du lieu cuc bo.", "offline");
    return;
  }

  try {
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(config);
    }
    realtimeRef = window.firebase.database().ref(SHARED_STATE_KEY);
    setSyncStatus("Dong bo: dang ket noi Firebase...", "offline");

    realtimeRef.once("value").then((snapshot) => {
      if (!snapshot.exists()) {
        return realtimeRef.set(getSharedStateSnapshot());
      }
      applyRemoteSharedState(snapshot.val());
      return null;
    }).then(() => {
      setSyncStatus("Dong bo: online voi Firebase.", "online");
    }).catch(() => {
      setSyncStatus("Dong bo: khong ket noi duoc Firebase.", "offline");
    });

    realtimeRef.on("value", (snapshot) => {
      if (!snapshot.exists()) return;
      applyRemoteSharedState(snapshot.val());
      setSyncStatus("Dong bo: online voi Firebase.", "online");
    });
  } catch {
    setSyncStatus("Dong bo: cau hinh Firebase chua dung.", "offline");
  }
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function isToday(value) {
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function isExpired(pass) {
  return new Date(pass.expireAt).getTime() < Date.now();
}

function currentPassStatus(pass) {
  if (pass.status === "active" && isExpired(pass)) return "expired";
  return pass.status;
}

function setDefaultExpireTime() {
  const date = new Date(Date.now() + 4 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  els.expireAt.value = date.toISOString().slice(0, 16);
}

function generateToken(apartment) {
  const compactApartment = apartment.replace(/[^A-Z0-9]/gi, "");
  return `SR-${compactApartment}-${Date.now().toString(36).toUpperCase()}`;
}

function getQrPayload(pass) {
  return JSON.stringify({
    app: "SmartResidenceOS",
    version: 3,
    token: pass.token,
    visitorName: pass.visitorName,
    type: pass.type,
    phone: pass.phone,
    apartment: pass.apartment,
    code: pass.code,
    note: pass.note,
    expireAt: pass.expireAt,
    createdAt: pass.createdAt,
    createdBy: pass.createdBy
  });
}

function parseScannedInput(rawValue) {
  const value = rawValue.trim();
  try {
    const payload = JSON.parse(value);
    if (payload?.app === "SmartResidenceOS" && payload.token) {
      return { token: payload.token, payload };
    }
  } catch {
    return { token: value, payload: null };
  }
  return { token: value, payload: null };
}

function importPassFromPayload(payload) {
  if (!payload?.token || state.passes.some((pass) => pass.token === payload.token)) return null;
  const pass = {
    id: Date.now(),
    token: payload.token,
    visitorName: payload.visitorName || "Nguoi den",
    type: payload.type || "Khach tham",
    phone: payload.phone || "",
    apartment: payload.apartment || "",
    code: payload.code || "",
    note: payload.note || "",
    status: "active",
    expireAt: payload.expireAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    createdAt: payload.createdAt || new Date().toISOString(),
    createdBy: payload.createdBy || "Chu nha"
  };
  state.passes.unshift(pass);
  return pass;
}

function showSection(sectionId) {
  if (!state.session && sectionId !== "loginPage") {
    sectionId = "loginPage";
  }
  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.toggle("active", section.id === sectionId);
  });
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionId);
  });
}

function getCurrentRole() {
  return state.session?.role || null;
}

function isResidentOwner() {
  return getCurrentRole() === "resident" && Boolean(state.session?.apartment);
}

function canCurrentUserSeePass(pass) {
  return !isResidentOwner() || pass.apartment === state.session.apartment;
}

function applySession() {
  const role = getCurrentRole();
  document.body.classList.toggle("logged-out", !role);

  if (!role) {
    els.sessionName.textContent = "Chua dang nhap";
    els.roleDescription.textContent = "Dang nhap bang tai khoan chu nha hoac bao ve de su dung dung giao dien.";
    els.logoutButton.classList.add("hidden");
    document.querySelectorAll(".nav-button").forEach((button) => {
      button.classList.add("hidden");
      button.classList.remove("active");
    });
    document.querySelectorAll(".role-content").forEach((node) => node.classList.add("hidden"));
    showSection("loginPage");
    saveState({ remote: false });
    return;
  }

  els.sessionName.textContent = `${state.session.label}`;
  els.roleDescription.textContent = roleDescriptions[role];
  els.logoutButton.classList.remove("hidden");

  document.querySelectorAll(".nav-button").forEach((button) => {
    const roles = button.dataset.roles.split(" ");
    button.classList.toggle("hidden", !roles.includes(role));
  });

  document.querySelectorAll(".role-content").forEach((node) => {
    const roles = node.dataset.roles.split(" ");
    node.classList.toggle("hidden", !roles.includes(role));
  });
  saveState({ remote: false });
}

function login(username, password) {
  const normalized = username.trim();
  const account = demoAccounts[normalized];
  if (!account || account.password !== password) {
    els.loginMessage.textContent = "Sai ten dang nhap hoac mat khau.";
    els.loginMessage.className = "login-message error";
    return;
  }

  state.session = {
    username: normalized,
    role: account.role,
    name: account.name,
    label: account.label,
    apartment: account.apartment || null
  };
  els.loginForm.reset();
  els.loginMessage.textContent = "";
  renderAll();
  showSection(defaultSectionByRole[account.role]);
}

function drawFallbackQr(token, canvas) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cells = 25;
  const cell = Math.floor(size / cells);
  const margin = Math.floor((size - cells * cell) / 2);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#1d2928";

  function finder(x, y) {
    ctx.fillRect(margin + x * cell, margin + y * cell, 7 * cell, 7 * cell);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(margin + (x + 1) * cell, margin + (y + 1) * cell, 5 * cell, 5 * cell);
    ctx.fillStyle = "#1d2928";
    ctx.fillRect(margin + (x + 2) * cell, margin + (y + 2) * cell, 3 * cell, 3 * cell);
  }

  finder(1, 1);
  finder(17, 1);
  finder(1, 17);

  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      const inFinder = (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16);
      if (inFinder) continue;
      const value = (hash + x * 17 + y * 29 + x * y * 7) % 11;
      if (value < 5) {
        ctx.fillRect(margin + x * cell, margin + y * cell, cell - 1, cell - 1);
      }
    }
  }
}

function drawQr(token, canvas) {
  if (window.QRCode && typeof window.QRCode.toCanvas === "function") {
    window.QRCode.toCanvas(canvas, token, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: canvas.width,
      color: {
        dark: "#1d2928",
        light: "#ffffff"
      }
    }, () => {});
    return;
  }

  drawFallbackQr(token, canvas);
}

function updateOwnerPreview(pass) {
  drawQr(getQrPayload(pass), els.ownerQrCanvas);
  const status = currentPassStatus(pass);
  els.ownerQrStatus.textContent = passStatusLabels[status];
  els.ownerShareGuest.textContent = `${pass.visitorName} - ${pass.apartment}`;
  els.ownerShareMeta.textContent = `${pass.type}. Hieu luc den ${formatDateTime(pass.expireAt)}. ${pass.code || pass.note || ""}`;
  els.ownerShareToken.textContent = pass.token;
}

function renderDashboard() {
  els.currentTime.textContent = formatDateTime(new Date().toISOString());
  els.activePasses.textContent = state.passes.filter((pass) => currentPassStatus(pass) === "active").length;
  els.todayVisits.textContent = state.accessLogs.filter((log) => isToday(log.time) && log.result === "Hop le").length;
  els.expiredPasses.textContent = state.passes.filter((pass) => currentPassStatus(pass) === "expired").length;
  els.processingTickets.textContent = state.tickets.filter((ticket) => ticket.status !== "done").length;

  const buckets = ["06-09", "09-12", "12-15", "15-18", "18-21"];
  const values = buckets.map((range) => {
    const [start, end] = range.split("-").map(Number);
    return state.accessLogs.filter((log) => {
      const hour = new Date(log.time).getHours();
      return isToday(log.time) && log.result === "Hop le" && hour >= start && hour < end;
    }).length;
  });
  renderBars(els.hourlyChart, buckets, values);
}

function renderBars(container, labels, values) {
  const max = Math.max(1, ...values);
  container.innerHTML = labels.map((label, index) => {
    const value = values[index];
    const width = Math.max(6, Math.round((value / max) * 100));
    return `
      <div class="bar-row">
        <span>${label}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
        <b>${value}</b>
      </div>
    `;
  }).join("");
}

function renderApartmentOptions() {
  const residents = isResidentOwner()
    ? state.residents.filter((resident) => resident.apartment === state.session.apartment)
    : state.residents;
  els.apartmentSelect.innerHTML = residents.map((resident) => {
    return `<option value="${resident.apartment}">${resident.apartment} - ${resident.name}</option>`;
  }).join("");
}

function renderPasses() {
  const visiblePasses = state.passes.filter(canCurrentUserSeePass);
  els.createdPassCount.textContent = `${visiblePasses.length} QR`;
  els.createdPassList.innerHTML = visiblePasses.map((pass) => {
    const status = currentPassStatus(pass);
    return `
      <article class="item-card">
        <div>
          <h3>${pass.visitorName}</h3>
          <p>${pass.type} | ${pass.apartment} | ${pass.code || "Khong co ma phu"}</p>
          <div class="item-meta">
            <span>Chu nha: ${pass.createdBy}</span>
            <span>Het han: ${formatDateTime(pass.expireAt)}</span>
            <span>${pass.token}</span>
          </div>
        </div>
        <div class="item-actions">
          <span class="status-pill ${statusClass(status)}">${passStatusLabels[status]}</span>
          <button class="mini-button" type="button" data-show-pass="${pass.id}">Xem QR</button>
        </div>
      </article>
    `;
  }).join("");

  els.scanSelect.innerHTML = state.passes.map((pass) => {
    const status = currentPassStatus(pass);
    return `<option value="${pass.token}">${pass.visitorName} / ${pass.apartment} / ${passStatusLabels[status]}</option>`;
  }).join("");
}

function renderOwnerConfirmations() {
  const waiting = state.passes.filter((pass) => currentPassStatus(pass) === "waitingOwner" && canCurrentUserSeePass(pass));
  els.ownerConfirmCount.textContent = `${waiting.length} yeu cau`;
  els.ownerConfirmList.innerHTML = waiting.length ? waiting.map((pass) => `
    <article class="item-card">
      <div>
        <h3>${pass.visitorName}</h3>
        <p>Bao ve da quet QR va can chu nha xac nhan truoc khi cho vao.</p>
        <div class="item-meta">
          <span>${pass.type}</span>
          <span>${pass.apartment}</span>
          <span>${pass.phone || "Khong co SDT"}</span>
          <span>${pass.code || "Khong co ma phu"}</span>
          <span>Quet luc: ${pass.guardScannedAt ? formatDateTime(pass.guardScannedAt) : "Vua quet"}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="mini-button approve-action" type="button" data-owner-approve="${pass.id}">Dung doi tuong</button>
        <button class="mini-button" type="button" data-owner-reject="${pass.id}">Tu choi</button>
      </div>
    </article>
  `).join("") : `
    <div class="item-card empty-confirm-card">
      <div>
        <h3>Chua co yeu cau tu bao ve</h3>
        <p>Khi bao ve quet QR hop le, thong tin nguoi den se hien o day de chu nha chon dung doi tuong hoac tu choi.</p>
      </div>
      <div class="item-actions">
        <button class="mini-button approve-action" type="button" disabled>Dung doi tuong</button>
        <button class="mini-button" type="button" disabled>Tu choi</button>
      </div>
    </div>
  `;
}

function renderScanDetail(pass, mode = "neutral") {
  if (!pass) {
    scannedPassId = null;
    els.scanStatusBadge.textContent = "Chua quet";
    els.scanDetail.className = "scan-detail empty";
    els.scanDetail.textContent = "Quet QR de hien thong tin nguoi den, can ho, loai doi tuong, han su dung va ghi chu cua chu nha.";
    els.confirmEntryButton.disabled = true;
    els.rejectEntryButton.disabled = true;
    return;
  }

  const status = currentPassStatus(pass);
  scannedPassId = pass.id;
  els.scanStatusBadge.textContent = passStatusLabels[status];
  els.scanDetail.className = `scan-detail ${mode}`;
  els.scanDetail.innerHTML = `
    <h3>${pass.visitorName}</h3>
    <dl>
      <div><dt>Loai doi tuong</dt><dd>${pass.type}</dd></div>
      <div><dt>Can ho</dt><dd>${pass.apartment}</dd></div>
      <div><dt>So dien thoai</dt><dd>${pass.phone || "Khong co"}</dd></div>
      <div><dt>Bien so / ma don</dt><dd>${pass.code || "Khong co"}</dd></div>
      <div><dt>Chu nha tao QR</dt><dd>${pass.createdBy}</dd></div>
      <div><dt>Het han</dt><dd>${formatDateTime(pass.expireAt)}</dd></div>
      <div><dt>Ghi chu</dt><dd>${pass.note || "Khong co"}</dd></div>
      <div><dt>Token</dt><dd>${pass.token}</dd></div>
    </dl>
  `;

  const canConfirm = status === "ownerApproved";
  els.confirmEntryButton.disabled = !canConfirm;
  els.rejectEntryButton.disabled = status === "expired" || status === "checkedIn";
}

function renderAccessLogs() {
  els.logCount.textContent = `${state.accessLogs.length} luot`;
  els.accessLogBody.innerHTML = state.accessLogs.slice().reverse().map((log) => {
    const resultClass = log.result === "Hop le" ? "status-approved" : "status-rejected";
    return `
      <tr>
        <td>${formatDateTime(log.time)}</td>
        <td>${log.visitorName}</td>
        <td>${log.apartment}</td>
        <td>${log.type}</td>
        <td><span class="status-pill ${resultClass}">${log.result}</span></td>
        <td>${log.note}</td>
      </tr>
    `;
  }).join("");
}

function renderResidents() {
  els.residentCount.textContent = `${state.residents.length} cu dan`;
  els.residentBody.innerHTML = state.residents.map((resident) => `
    <tr>
      <td><strong>${resident.name}</strong></td>
      <td>${resident.apartment}</td>
      <td>${resident.phone}</td>
      <td><span class="status-pill status-approved">${resident.status}</span></td>
    </tr>
  `).join("");
}

function renderTickets() {
  els.ticketCount.textContent = `${state.tickets.length} ticket`;
  els.ticketList.innerHTML = state.tickets.slice().reverse().map((ticket) => {
    const canProgress = ticket.status !== "done";
    const nextStatus = ticket.status === "new" ? "processing" : "done";
    return `
      <article class="item-card">
        <div>
          <h3>${ticket.title}</h3>
          <p>${ticket.content}</p>
          <div class="item-meta">
            <span>${ticket.apartment}</span>
            <span>${ticket.category}</span>
            <span>${formatDateTime(ticket.createdAt)}</span>
          </div>
        </div>
        <div class="item-actions">
          <span class="status-pill ${statusClass(ticket.status)}">${ticketStatusLabels[ticket.status]}</span>
          ${canProgress ? `<button class="mini-button" type="button" data-ticket="${ticket.id}" data-next="${nextStatus}">Chuyen trang thai</button>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

function renderTicketCharts() {
  const categories = ["An ninh", "Ve sinh", "Dien nuoc", "Thang may", "Khac"];
  els.ticketCategoryChart.innerHTML = categories.map((category) => {
    const count = state.tickets.filter((ticket) => ticket.category === category).length;
    return `<div class="category-item"><span>${category}</span><strong>${count}</strong></div>`;
  }).join("");

  const statuses = ["new", "processing", "done"];
  els.statusChart.innerHTML = statuses.map((status) => {
    const count = state.tickets.filter((ticket) => ticket.status === status).length;
    return `<div class="status-item"><span>${ticketStatusLabels[status]}</span><strong>${count}</strong></div>`;
  }).join("");
}

function renderReports() {
  const labels = [];
  const values = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
    values.push(state.accessLogs.filter((log) => new Date(log.time).toDateString() === date.toDateString() && log.result === "Hop le").length);
  }
  renderBars(els.weeklyChart, labels, values);
}

function statusClass(status) {
  if (status === "active" || status === "ownerApproved" || status === "checkedIn" || status === "done") return "status-approved";
  if (status === "waitingOwner" || status === "processing") return "status-pending";
  if (status === "expired" || status === "rejected") return "status-rejected";
  return "status-new";
}

function scanToken(rawValue) {
  const scanned = parseScannedInput(rawValue);
  let pass = state.passes.find((item) => item.token === scanned.token);
  if (!pass && scanned.payload) {
    pass = importPassFromPayload(scanned.payload);
    if (pass) saveState();
  }

  if (!pass) {
    scannedPassId = null;
    els.scanResult.className = "result-box error";
    els.scanResult.textContent = "Khong hop le: ma QR khong ton tai trong he thong.";
    renderScanDetail(null);
    return;
  }

  const status = currentPassStatus(pass);
  const scanMode = ["active", "waitingOwner", "ownerApproved"].includes(status) ? "success" : "error";
  renderScanDetail(pass, scanMode);

  if (status === "active") {
    pass.status = "waitingOwner";
    pass.guardScannedAt = new Date().toISOString();
    saveState();
    renderAll();
    renderScanDetail(pass, "success");
    els.scanResult.className = "result-box success";
    els.scanResult.textContent = "QR dung. He thong da gui yeu cau xac nhan den chu nha. Chi cho vao sau khi chu nha dong y.";
  } else if (status === "expired") {
    els.scanResult.className = "result-box error";
    els.scanResult.textContent = "QR da het han. Bao ve khong nen cho vao.";
  } else if (status === "waitingOwner") {
    els.scanResult.className = "result-box neutral";
    els.scanResult.textContent = "Dang cho chu nha xac nhan. Chua duoc cho vao.";
  } else if (status === "ownerApproved") {
    els.scanResult.className = "result-box success";
    els.scanResult.textContent = "Chu nha da dong y. Bao ve co the ghi nhan cho vao.";
  } else if (status === "checkedIn") {
    els.scanResult.className = "result-box error";
    els.scanResult.textContent = "QR nay da duoc xac nhan vao truoc do.";
  } else {
    els.scanResult.className = "result-box error";
    els.scanResult.textContent = "QR khong con hop le.";
  }
}

function logGateDecision(result, note, nextStatus) {
  const pass = state.passes.find((item) => item.id === scannedPassId);
  if (!pass) return;
  pass.status = nextStatus;
  state.accessLogs.push({
    time: new Date().toISOString(),
    visitorName: pass.visitorName,
    apartment: pass.apartment,
    type: pass.type,
    result,
    note
  });
  saveState();
  els.scanResult.className = result === "Hop le" ? "result-box success" : "result-box error";
  els.scanResult.textContent = note;
  renderAll();
  renderScanDetail(pass, result === "Hop le" ? "success" : "error");
}

function ownerDecide(passId, approved) {
  const pass = state.passes.find((item) => item.id === passId);
  if (!pass) return;
  pass.ownerDecisionAt = new Date().toISOString();
  pass.status = approved ? "ownerApproved" : "rejected";
  pass.ownerDecision = approved ? "approved" : "rejected";
  saveState();
  renderAll();
}

function stopCameraScanner() {
  if (scannerFrameId) {
    cancelAnimationFrame(scannerFrameId);
    scannerFrameId = null;
  }
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
}

function decodeCameraFrame(video, canvas) {
  if (!cameraStream) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA && window.jsQR) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = window.jsQR(imageData.data, imageData.width, imageData.height);
    if (qr && qr.data) {
      els.cameraStatus.textContent = `Da doc QR: ${qr.data}`;
      els.cameraStatus.className = "camera-status success";
      els.manualToken.value = qr.data;
      scanToken(qr.data);
      stopCameraScanner();
      return;
    }
  }

  scannerFrameId = requestAnimationFrame(() => decodeCameraFrame(video, canvas));
}

async function checkCameraAccess() {
  if (!window.isSecureContext) {
    els.cameraStatus.textContent = "Trinh duyet dang chan camera vi trang nay mo bang HTTP. Hay chay bang HTTPS hoac mo tren localhost cua chinh thiet bi.";
    els.cameraStatus.className = "camera-status error";
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    els.cameraStatus.textContent = "Trinh duyet hien tai khong ho tro mo camera tu trang web nay.";
    els.cameraStatus.className = "camera-status error";
    return;
  }

  if (!window.jsQR) {
    els.cameraStatus.textContent = "Chua tai duoc thu vien doc QR. Hay kiem tra ket noi mang roi tai lai trang.";
    els.cameraStatus.className = "camera-status error";
    return;
  }

  try {
    stopCameraScanner();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    cameraStream = stream;
    els.cameraPreview.srcObject = stream;
    els.cameraPreview.classList.remove("hidden");
    els.cameraStatus.textContent = "Camera da mo. Dua ma QR vao khung de he thong tu dong doc.";
    els.cameraStatus.className = "camera-status success";
    const scanCanvas = document.createElement("canvas");
    scannerFrameId = requestAnimationFrame(() => decodeCameraFrame(els.cameraPreview, scanCanvas));
  } catch (error) {
    els.cameraStatus.textContent = "Khong mo duoc camera. Co the ban chua cap quyen, trinh duyet chan quyen, hoac trang chua chay qua HTTPS.";
    els.cameraStatus.className = "camera-status error";
  }
}

function createPassFromForm() {
  const resident = state.residents.find((item) => item.apartment === els.apartmentSelect.value);
  const pass = {
    id: Date.now(),
    token: generateToken(els.apartmentSelect.value),
    visitorName: els.visitorName.value.trim(),
    type: els.visitorType.value,
    phone: els.visitorPhone.value.trim(),
    apartment: els.apartmentSelect.value,
    code: els.visitCode.value.trim(),
    note: els.visitNote.value.trim(),
    status: "active",
    expireAt: new Date(els.expireAt.value).toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: state.session?.name || (resident ? resident.name : "Chu nha")
  };
  state.passes.unshift(pass);
  updateOwnerPreview(pass);
}

function bindEvents() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => showSection(button.dataset.section));
  });

  els.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    login(els.usernameInput.value, els.passwordInput.value);
  });

  document.querySelectorAll("[data-demo-login]").forEach((button) => {
    button.addEventListener("click", () => {
      const kind = button.dataset.demoLogin;
      const presets = {
        owner: ["chu_nha_a1205", "123456"],
        guard: ["bao_ve_01", "123456"],
        manager: ["quan_ly", "123456"]
      };
      els.usernameInput.value = presets[kind][0];
      els.passwordInput.value = presets[kind][1];
    });
  });

  els.logoutButton.addEventListener("click", () => {
    state.session = null;
    scannedPassId = null;
    saveState({ remote: false });
    renderScanDetail(null);
    applySession();
  });

  els.residentPassForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createPassFromForm();
    saveState();
    els.residentPassForm.reset();
    setDefaultExpireTime();
    renderAll();
  });

  els.createdPassList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-show-pass]");
    if (!button) return;
    const pass = state.passes.find((item) => String(item.id) === button.dataset.showPass);
    if (pass) updateOwnerPreview(pass);
  });

  els.ownerConfirmList.addEventListener("click", (event) => {
    const approveButton = event.target.closest("[data-owner-approve]");
    const rejectButton = event.target.closest("[data-owner-reject]");
    const id = approveButton?.dataset.ownerApprove || rejectButton?.dataset.ownerReject;
    if (!id) return;
    ownerDecide(Number(id), Boolean(approveButton));
  });

  els.copyTokenButton.addEventListener("click", async () => {
    const token = els.ownerShareToken.textContent.trim();
    try {
      await navigator.clipboard.writeText(token);
      els.copyTokenButton.textContent = "Da sao chep token";
    } catch {
      els.copyTokenButton.textContent = "Token da san sang de gui";
    }
    setTimeout(() => {
      els.copyTokenButton.textContent = "Sao chep token de gui";
    }, 1800);
  });

  els.scanButton.addEventListener("click", () => {
    const token = els.manualToken.value.trim() || els.scanSelect.value;
    scanToken(token);
  });

  els.invalidScanButton.addEventListener("click", () => scanToken("SR-INVALID-CODE"));

  els.cameraCheckButton.addEventListener("click", checkCameraAccess);

  els.confirmEntryButton.addEventListener("click", () => {
    logGateDecision("Hop le", "Chu nha da dong y. Bao ve ghi nhan cho vao.", "checkedIn");
  });

  els.rejectEntryButton.addEventListener("click", () => {
    logGateDecision("Tu choi", "Bao ve tu choi vi nguoi den khong khop thong tin QR.", "rejected");
  });

  els.ticketForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.tickets.push({
      id: Date.now(),
      title: els.ticketTitle.value.trim(),
      category: els.ticketCategory.value,
      content: els.ticketContent.value.trim(),
      apartment: els.apartmentSelect.value || state.residents[0].apartment,
      status: "new",
      createdAt: new Date().toISOString()
    });
    saveState();
    els.ticketForm.reset();
    renderAll();
  });

  els.ticketList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ticket]");
    if (!button) return;
    const ticket = state.tickets.find((item) => String(item.id) === button.dataset.ticket);
    if (!ticket) return;
    ticket.status = button.dataset.next;
    saveState();
    renderAll();
  });

  els.seedButton.addEventListener("click", () => {
    state = createSeedState();
    scannedPassId = null;
    saveState();
    init();
  });

  els.clearButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = createSeedState();
    scannedPassId = null;
    saveState();
    init();
  });
}

function renderAll() {
  renderDashboard();
  renderApartmentOptions();
  renderPasses();
  renderOwnerConfirmations();
  renderAccessLogs();
  renderResidents();
  renderTickets();
  renderTicketCharts();
  renderReports();
  applySession();
}

function init() {
  setDefaultExpireTime();
  const firstActive = state.passes.find((pass) => currentPassStatus(pass) === "active") || state.passes[0];
  if (firstActive) updateOwnerPreview(firstActive);
  else drawQr("SMART-RESIDENCE-OS", els.ownerQrCanvas);
  renderScanDetail(null);
  renderAll();
  showSection(state.session ? defaultSectionByRole[state.session.role] : "loginPage");
}

bindEvents();
init();
initRealtimeSync();
