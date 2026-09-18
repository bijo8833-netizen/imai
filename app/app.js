const state = {
  activeTax: "corp",
};

const TABS = [
  { key: "corp", label: "법인세 경정청구" },
  { key: "vat", label: "부가가치세 경정청구" },
  { key: "gov", label: "정부지원·세액감면 매칭" },
];

function fmtWon(n) {
  const v = Math.round(n || 0);
  return v.toLocaleString("ko-KR") + "원";
}

function renderTabs() {
  const tabBar = document.getElementById("tabBar");
  tabBar.innerHTML = "";
  TABS.forEach(({ key, label }) => {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (key === state.activeTax ? " active" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      state.activeTax = key;
      renderTabs();
      renderForm();
      document.getElementById("result").innerHTML = "";
    });
    tabBar.appendChild(btn);
  });
}

function renderForm() {
  if (state.activeTax === "gov") {
    renderGovForm();
  } else {
    renderClaimForm();
  }
}

// ---------------- 경정청구 (법인세/부가가치세) ----------------

function renderClaimForm() {
  const def = TAX_TYPES[state.activeTax];
  const panel = document.getElementById("panel");
  panel.innerHTML = "";

  const commonRow = document.createElement("div");
  commonRow.className = "field-row";

  const dueField = document.createElement("div");
  dueField.className = "field";
  dueField.innerHTML = `
    <label>법정신고기한</label>
    <input type="date" id="legalDueDate" />
  `;
  commonRow.appendChild(dueField);

  if (state.activeTax === "corp") {
    const baseField = document.createElement("div");
    baseField.className = "field";
    baseField.innerHTML = `
      <label>기신고 과세표준(원)</label>
      <input type="number" id="baseInput" min="0" step="1" placeholder="예: 500000000" />
    `;
    commonRow.appendChild(baseField);
  }

  panel.appendChild(commonRow);

  const sectionTitle = document.createElement("h2");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = "경정청구 가능 항목 체크 및 금액 입력";
  panel.appendChild(sectionTitle);

  def.items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `
      <input type="checkbox" id="chk_${item.id}" />
      <div>
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
      </div>
      <input type="number" id="amt_${item.id}" min="0" step="1" placeholder="금액(원)" />
    `;
    panel.appendChild(row);
  });

  const actions = document.createElement("div");
  actions.className = "actions";
  const calcBtn = document.createElement("button");
  calcBtn.className = "primary";
  calcBtn.textContent = "경정청구 항목 · 예상 환급액 계산하기";
  calcBtn.addEventListener("click", handleCalculate);
  actions.appendChild(calcBtn);
  panel.appendChild(actions);

  renderMultiYearSection(panel, def);
}

// ---------------- 여러 연도 한번에 계산 (엑셀 업로드) ----------------

function renderMultiYearSection(panel, def) {
  const title = document.createElement("h2");
  title.className = "section-title";
  title.textContent = "여러 연도 한번에 계산 (엑셀 업로드)";
  panel.appendChild(title);

  const note = document.createElement("p");
  note.className = "empty-note";
  note.textContent = "경정청구는 법정신고기한으로부터 5년 이내 신고분까지 가능합니다. 최근 5개 사업연도(또는 신고기간) 자료를 엑셀 한 장에 입력해서 한번에 확인해 보세요.";
  panel.appendChild(note);

  const uploadRow = document.createElement("div");
  uploadRow.className = "actions";

  const templateBtn = document.createElement("button");
  templateBtn.className = "primary";
  templateBtn.style.background = "#6b7280";
  templateBtn.textContent = "엑셀 템플릿 다운로드";
  templateBtn.addEventListener("click", () => downloadTemplate(state.activeTax));
  uploadRow.appendChild(templateBtn);

  const fileLabel = document.createElement("label");
  fileLabel.className = "primary";
  fileLabel.style.cssText = "background:#15803d;display:inline-flex;align-items:center;cursor:pointer;";
  fileLabel.textContent = "엑셀 파일 업로드";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".xlsx,.xls,.csv";
  fileInput.style.display = "none";
  fileInput.addEventListener("change", handleMultiYearUpload);
  fileLabel.appendChild(fileInput);
  uploadRow.appendChild(fileLabel);

  panel.appendChild(uploadRow);

  const resultDiv = document.createElement("div");
  resultDiv.id = "multiYearResult";
  panel.appendChild(resultDiv);
}

function templateHeaders(taxType) {
  const def = TAX_TYPES[taxType];
  const periodLabel = taxType === "corp" ? "사업연도" : "과세기간";
  const headers = [periodLabel, "법정신고기한(YYYY-MM-DD)"];
  if (taxType === "corp") headers.push("과세표준(원)");
  def.items.forEach((item) => headers.push(item.name));
  return headers;
}

function downloadTemplate(taxType) {
  const headers = templateHeaders(taxType);
  const exampleRow = headers.map((h) => {
    if (h.includes("사업연도")) return "2021";
    if (h.includes("과세기간")) return "2021년 1기 확정";
    if (h.includes("법정신고기한")) return "2022-03-31";
    if (h.includes("과세표준")) return 500000000;
    return 0;
  });
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, taxType === "corp" ? "법인세" : "부가가치세");
  const filename = taxType === "corp" ? "법인세_경정청구_5년치_템플릿.xlsx" : "부가가치세_경정청구_5년치_템플릿.xlsx";
  XLSX.writeFile(wb, filename);
}

function handleMultiYearUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const taxType = state.activeTax;
  const def = TAX_TYPES[taxType];

  const reader = new FileReader();
  reader.onload = (e) => {
    let rows;
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    } catch (err) {
      renderMultiYearError("엑셀 파일을 읽지 못했습니다. 템플릿 형식에 맞게 입력했는지 확인해 주세요.");
      return;
    }
    if (!rows.length) {
      renderMultiYearError("업로드한 파일에 데이터 행이 없습니다.");
      return;
    }
    const periodKey = taxType === "corp" ? "사업연도" : "과세기간";
    const results = rows.map((row) => {
      const period = String(row[periodKey] ?? "").trim() || "(연도 미입력)";
      const legalDueDate = normalizeDate(row["법정신고기한(YYYY-MM-DD)"]);
      const baseInput = taxType === "corp" ? row["과세표준(원)"] : null;

      const checkedItems = {};
      def.items.forEach((item) => {
        const amount = Number(row[item.name]) || 0;
        checkedItems[item.id] = { checked: amount > 0, amount };
      });

      const calc = def.computeRefund(baseInput, checkedItems);
      const deadline = calcClaimDeadline(legalDueDate);
      return { period, legalDueDate, calc, deadline };
    });
    renderMultiYearResult(results);
  };
  reader.readAsArrayBuffer(file);
  event.target.value = "";
}

function normalizeDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value).trim();
  const m = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return s;
}

function renderMultiYearError(message) {
  const container = document.getElementById("multiYearResult");
  container.innerHTML = `<p class="empty-note">${message}</p>`;
}

function renderMultiYearResult(results) {
  const container = document.getElementById("multiYearResult");
  container.innerHTML = "";

  const withinTotal = results
    .filter((r) => r.deadline && r.deadline.withinPeriod)
    .reduce((s, r) => s + r.calc.total, 0);
  const allTotal = results.reduce((s, r) => s + r.calc.total, 0);

  const card = document.createElement("div");
  card.className = "result-card";
  card.innerHTML = `
    <div>청구기한(5년) 이내 연도 합계 &nbsp; <span class="total">${fmtWon(withinTotal)}</span></div>
    <p class="empty-note" style="margin-top:6px;">업로드한 전체 연도 합계(기한 경과분 포함): ${fmtWon(allTotal)}</p>
  `;

  const table = document.createElement("table");
  table.className = "result-table";
  table.innerHTML = `
    <thead><tr><th>연도/기간</th><th>법정신고기한</th><th>청구기한 상태</th><th>예상 환급액</th></tr></thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");
  results.forEach((r) => {
    const tr = document.createElement("tr");
    let statusHtml = "-";
    if (r.deadline) {
      const cls = r.deadline.withinPeriod ? "ok" : "warn";
      const text = r.deadline.withinPeriod
        ? `기한 이내(잔여 ${r.deadline.remainingDays.toLocaleString("ko-KR")}일)`
        : "기한 경과";
      statusHtml = `<span class="deadline-badge ${cls}">${text}</span>`;
    }
    tr.innerHTML = `
      <td>${r.period}</td>
      <td>${r.legalDueDate || "-"}</td>
      <td>${statusHtml}</td>
      <td>${fmtWon(r.calc.total)}</td>
    `;
    tbody.appendChild(tr);
  });
  card.appendChild(table);
  container.appendChild(card);
}

function collectCheckedItems(def) {
  const checked = {};
  def.items.forEach((item) => {
    const chk = document.getElementById(`chk_${item.id}`);
    const amt = document.getElementById(`amt_${item.id}`);
    checked[item.id] = {
      checked: chk.checked,
      amount: amt.value,
    };
  });
  return checked;
}

function handleCalculate() {
  const def = TAX_TYPES[state.activeTax];
  const checkedItems = collectCheckedItems(def);
  const baseInput = state.activeTax === "corp" ? document.getElementById("baseInput").value : null;
  const legalDueDate = document.getElementById("legalDueDate").value;

  const result = def.computeRefund(baseInput, checkedItems);
  const deadline = calcClaimDeadline(legalDueDate);

  renderClaimResult(def, result, deadline);
}

function renderClaimResult(def, result, deadline) {
  const container = document.getElementById("result");
  container.innerHTML = "";

  if (!result.lines.length) {
    const note = document.createElement("p");
    note.className = "empty-note";
    note.textContent = "체크된 항목이 없거나 입력 금액이 0원입니다. 해당되는 항목을 선택하고 금액을 입력해 주세요.";
    container.appendChild(note);
    return;
  }

  const card = document.createElement("div");
  card.className = "result-card";

  const totalLine = document.createElement("div");
  totalLine.innerHTML = `${def.label} 예상 환급(경정청구) 세액 &nbsp; <span class="total">${fmtWon(result.total)}</span>`;
  card.appendChild(totalLine);

  if (deadline) {
    const badge = document.createElement("span");
    badge.className = "deadline-badge " + (deadline.withinPeriod ? "ok" : "warn");
    if (deadline.withinPeriod) {
      badge.textContent = `경정청구 기한(5년) 이내 · 잔여 ${deadline.remainingDays.toLocaleString("ko-KR")}일 (기한: ${deadline.deadlineDate.toLocaleDateString("ko-KR")})`;
    } else {
      badge.textContent = `경정청구 기한(5년) 경과 · 기한: ${deadline.deadlineDate.toLocaleDateString("ko-KR")}`;
    }
    card.appendChild(document.createElement("br"));
    card.appendChild(badge);
  }

  const table = document.createElement("table");
  table.className = "result-table";
  table.innerHTML = `
    <thead>
      <tr><th>항목</th><th>입력 금액</th><th>예상 환급 기여분</th></tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");
  result.lines.forEach((line) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${line.item.name}</td>
      <td>${fmtWon(line.amount)}</td>
      <td>${fmtWon(line.effect)}</td>
    `;
    tbody.appendChild(tr);
  });
  card.appendChild(table);

  if (state.activeTax === "corp") {
    const note = document.createElement("p");
    note.className = "empty-note";
    note.style.marginTop = "12px";
    note.textContent = `손금 항목 반영 시: 과세표준 ${fmtWon(result.base)} → ${fmtWon(Math.max(result.base - result.addBack, 0))} (산출세액 ${fmtWon(result.taxBefore)} → ${fmtWon(result.taxAfter)}). 위 금액은 국세(법인세) 기준이며 지방소득세는 별도 경정청구 대상입니다. 세율은 2026년 사업연도 기준(10/20/22/25%)이며, 2025년 이전 사업연도를 경정청구할 때는 해당 연도의 세율(9/19/21/24%)을 별도로 확인해야 합니다.`;
    card.appendChild(note);
  }

  container.appendChild(card);
}

// ---------------- 정부지원·세액감면 매칭 ----------------

function renderGovForm() {
  const panel = document.getElementById("panel");
  panel.innerHTML = "";

  const groups = {};
  PROFILE_FIELDS.forEach((f) => {
    if (!groups[f.group]) groups[f.group] = [];
    groups[f.group].push(f);
  });

  Object.entries(groups).forEach(([groupName, fields]) => {
    const title = document.createElement("h2");
    title.className = "section-title";
    title.textContent = groupName;
    panel.appendChild(title);

    const row = document.createElement("div");
    row.className = "field-row";

    fields.forEach((f) => {
      const field = document.createElement("div");
      field.className = "field";

      if (f.type === "select") {
        const opts = f.options.map((o) => `<option value="${o.value}">${o.label}</option>`).join("");
        field.innerHTML = `<label>${f.label}</label><select id="gov_${f.id}">${opts}</select>`;
      } else if (f.type === "checkbox") {
        field.innerHTML = `
          <label style="display:flex;align-items:center;gap:6px;">
            <input type="checkbox" id="gov_${f.id}" style="width:16px;height:16px;" /> ${f.label}
          </label>
        `;
      } else if (f.type === "date") {
        field.innerHTML = `<label>${f.label}</label><input type="date" id="gov_${f.id}" />`;
      } else {
        field.innerHTML = `<label>${f.label}</label><input type="number" id="gov_${f.id}" min="0" step="1" placeholder="0" />`;
      }
      row.appendChild(field);
    });

    panel.appendChild(row);
  });

  const actions = document.createElement("div");
  actions.className = "actions";
  const calcBtn = document.createElement("button");
  calcBtn.className = "primary";
  calcBtn.textContent = "해당 항목 · 예상 지원금액 리포트 생성";
  calcBtn.addEventListener("click", handleGovCalculate);
  actions.appendChild(calcBtn);
  panel.appendChild(actions);
}

function collectGovProfile() {
  const profile = {};
  PROFILE_FIELDS.forEach((f) => {
    const el = document.getElementById(`gov_${f.id}`);
    if (f.type === "checkbox") {
      profile[f.id] = el.checked;
    } else if (f.type === "number") {
      profile[f.id] = Number(el.value) || 0;
    } else {
      profile[f.id] = el.value;
    }
  });
  return profile;
}

function handleGovCalculate() {
  const profile = collectGovProfile();
  const matched = matchPrograms(profile);
  renderGovResult(matched);
}

function renderGovResult(matched) {
  const container = document.getElementById("result");
  container.innerHTML = "";

  if (!matched.length) {
    const note = document.createElement("p");
    note.className = "empty-note";
    note.textContent = "입력된 정보 기준으로 매칭되는 항목이 없습니다. 위 입력값을 확인해 주세요.";
    container.appendChild(note);
    return;
  }

  const taxItems = matched.filter((m) => m.program.type === "tax_credit");
  const grantItems = matched.filter((m) => m.program.type === "grant");

  const taxTotal = taxItems.reduce((s, m) => s + (m.result.amount || 0), 0);
  const grantMin = grantItems.reduce((s, m) => s + (m.result.amount ?? (m.result.amountRange ? m.result.amountRange[0] : 0)), 0);
  const grantMax = grantItems.reduce((s, m) => s + (m.result.amount ?? (m.result.amountRange ? m.result.amountRange[1] : 0)), 0);

  const summary = document.createElement("div");
  summary.className = "result-card";
  summary.innerHTML = `
    <div>세액공제·감면(확정형) 합계 &nbsp; <span class="total">${fmtWon(taxTotal)}</span></div>
    <div style="margin-top:6px;">정부지원사업(공모형, 참고 한도) &nbsp; <span class="total">${fmtWon(grantMin)} ~ ${fmtWon(grantMax)}</span></div>
    <p class="empty-note" style="margin-top:10px;">세액공제·감면은 요건 충족 시 법에 따라 확정 적용되는 금액이며, 정부지원사업은 예산 한도 내 공모·심사를 거쳐 선정되는 것으로 위 금액은 신청 가능 한도(참고치)일 뿐 확정 지원액이 아닙니다.</p>
  `;
  container.appendChild(summary);

  renderGovGroup(container, "세액공제·감면 (확정형)", taxItems);
  renderGovGroup(container, "정부지원사업 · 보조금 (공모/심사형)", grantItems);
}

function renderGovGroup(container, title, items) {
  if (!items.length) return;

  const heading = document.createElement("h2");
  heading.className = "section-title";
  heading.textContent = title;
  container.appendChild(heading);

  const byMinistry = {};
  items.forEach((m) => {
    if (!byMinistry[m.program.ministry]) byMinistry[m.program.ministry] = [];
    byMinistry[m.program.ministry].push(m);
  });

  Object.entries(byMinistry).forEach(([ministry, list]) => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.style.marginBottom = "14px";

    const ministryTitle = document.createElement("div");
    ministryTitle.style.fontWeight = "700";
    ministryTitle.style.marginBottom = "8px";
    ministryTitle.textContent = ministry;
    card.appendChild(ministryTitle);

    const table = document.createElement("table");
    table.className = "result-table";
    table.innerHTML = `
      <thead><tr><th>제도명</th><th>근거/유형</th><th>예상 금액</th><th>비고</th></tr></thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");
    list.forEach((m) => {
      const amountText = m.result.amount != null
        ? fmtWon(m.result.amount)
        : `${fmtWon(m.result.amountRange[0])} ~ ${fmtWon(m.result.amountRange[1])}`;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.program.name}</td>
        <td>${m.program.legalBasis || (m.program.type === "grant" ? "공모형 지원사업" : "")}</td>
        <td>${amountText}</td>
        <td style="max-width:320px;font-size:12px;color:var(--muted);">${m.result.noteText}</td>
      `;
      tbody.appendChild(tr);
    });
    card.appendChild(table);
    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderTabs();
  renderForm();
});
