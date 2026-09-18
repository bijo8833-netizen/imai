const state = {
  activeTax: "corp",
};

function fmtWon(n) {
  const v = Math.round(n || 0);
  return v.toLocaleString("ko-KR") + "원";
}

function renderTabs() {
  const tabBar = document.getElementById("tabBar");
  tabBar.innerHTML = "";
  Object.entries(TAX_TYPES).forEach(([key, def]) => {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (key === state.activeTax ? " active" : "");
    btn.textContent = def.label;
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

  renderResult(def, result, deadline);
}

function renderResult(def, result, deadline) {
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
    note.textContent = `손금 항목 반영 시: 과세표준 ${fmtWon(result.base)} → ${fmtWon(Math.max(result.base - result.addBack, 0))} (산출세액 ${fmtWon(result.taxBefore)} → ${fmtWon(result.taxAfter)}). 위 금액은 국세(법인세) 기준이며 지방소득세는 별도 경정청구 대상입니다.`;
    card.appendChild(note);
  }

  container.appendChild(card);
}

document.addEventListener("DOMContentLoaded", () => {
  renderTabs();
  renderForm();
});
