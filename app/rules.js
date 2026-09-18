/**
 * 경정청구(更正請求) 계산 규칙 모음
 * - 세목별 항목 정의 + 세액 계산 로직을 한 곳에 모아 관리한다.
 * - 새 세목/항목을 추가하려면 이 파일에 정의를 추가하고 app.js는 그대로 재사용한다.
 */

// 2026년 1월 1일 이후 개시하는 사업연도부터 적용되는 법인세율(법인세법 제55조 개정, 전 구간 1%p 인상)
// 2억 이하 10%, 2억~200억 20%, 200억~3,000억 22%, 3,000억 초과 25% (지방소득세 별도, 국세만 계산)
// 주의: 경정청구 대상 연도가 2025년 이전 사업연도라면 그 당시 세율(9/19/21/24%)이 적용되므로
// 실제 청구 시에는 해당 사업연도 기준 세율을 별도로 확인해야 한다.
const CORP_TAX_BRACKETS = [
  { limit: 200_000_000, rate: 0.10, cumDeduction: 0 },
  { limit: 20_000_000_000, rate: 0.20, cumDeduction: 20_000_000 },
  { limit: 300_000_000_000, rate: 0.22, cumDeduction: 420_000_000 },
  { limit: Infinity, rate: 0.25, cumDeduction: 9_420_000_000 },
];

function calcCorpTax(base) {
  if (!(base > 0)) return 0;
  const bracket = CORP_TAX_BRACKETS.find((b) => base <= b.limit);
  return base * bracket.rate - bracket.cumDeduction;
}

const VAT_RATE = 0.1;

// 경정청구 기한: 국세기본법 제45조의2 - 법정신고기한 경과 후 5년 이내
const CLAIM_PERIOD_YEARS = 5;

function calcClaimDeadline(legalDueDateStr) {
  if (!legalDueDateStr) return null;
  const due = new Date(legalDueDateStr);
  if (Number.isNaN(due.getTime())) return null;
  const deadline = new Date(due);
  deadline.setFullYear(deadline.getFullYear() + CLAIM_PERIOD_YEARS);
  const today = new Date();
  const remainingDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  return {
    deadlineDate: deadline,
    withinPeriod: remainingDays >= 0,
    remainingDays,
  };
}

/**
 * 항목 타입
 * - "deduction": 과세표준(손금)에 가산되는 금액 → 한계세율 구조로 세액 차이 계산
 * - "credit": 세액에서 직접 차감되는 금액(세액공제) → 입력액이 곧 환급액
 * - "input_vat": 매입세액 자체 누락분 → 입력액이 곧 환급액
 */

const CORP_TAX_ITEMS = [
  {
    id: "dep",
    name: "감가상각비 과소계상액",
    desc: "내용연수·상각방법 오류 등으로 손금 처리되지 않은 감가상각비",
    type: "deduction",
  },
  {
    id: "badDebt",
    name: "대손금 손금산입 누락액",
    desc: "대손 요건(소멸시효 완성, 회생계획 인가 등)을 충족했으나 손금산입하지 않은 채권",
    type: "deduction",
  },
  {
    id: "nol",
    name: "이월결손금 공제 누락액",
    desc: "공제 가능한 이월결손금을 과세표준 계산 시 반영하지 않은 금액",
    type: "deduction",
  },
  {
    id: "taxCredit",
    name: "세액공제 누락액",
    desc: "연구인력개발비 세액공제, 통합투자세액공제, 고용증대세액공제 등 적용 누락분",
    type: "credit",
  },
  {
    id: "entertainment",
    name: "기업업무추진비 한도 재계산 차액",
    desc: "한도 계산 오류로 과다 부인되었던 기업업무추진비 중 손금 인정 가능분",
    type: "deduction",
  },
  {
    id: "severance",
    name: "퇴직급여충당금·퇴직연금 손금산입 누락액",
    desc: "한도 내에서 손금산입 가능하나 반영되지 않은 퇴직급여 관련 금액",
    type: "deduction",
  },
  {
    id: "inventory",
    name: "재고자산평가손실 누락액",
    desc: "저가법 등 평가방법에 따라 인정되는 평가손실 중 반영 누락분",
    type: "deduction",
  },
  {
    id: "fx",
    name: "외화환산손실 반영 누락액",
    desc: "사업연도 종료일 환율 기준 외화자산·부채 평가손실 중 미반영분",
    type: "deduction",
  },
  {
    id: "interest",
    name: "가지급금 인정이자 과다계상 환원액",
    desc: "인정이자율 적용 오류 등으로 과다 계상된 익금 중 환원 가능액",
    type: "deduction",
  },
  {
    id: "donation",
    name: "기부금 한도초과 이월공제 누락액",
    desc: "이월공제 가능한 기부금 한도초과액 중 당기 손금산입 누락분",
    type: "deduction",
  },
];

const VAT_ITEMS = [
  {
    id: "unlisted",
    name: "매입세금계산서 합산신고 누락분",
    desc: "수취했으나 신고 시 누락된 매입세금계산서의 매입세액",
    type: "input_vat",
  },
  {
    id: "cardReceipt",
    name: "신용카드매출전표 등 수령분 매입세액",
    desc: "신용카드·현금영수증 수령분 중 공제 가능하나 반영되지 않은 매입세액",
    type: "input_vat",
  },
  {
    id: "deemedInput",
    name: "의제매입세액공제 누락·과소분",
    desc: "면세 농산물 등 원재료 매입에 대한 의제매입세액공제 누락 또는 과소 계상분",
    type: "input_vat",
  },
  {
    id: "badDebtVat",
    name: "대손세액공제 누락분",
    desc: "대손 확정된 채권에 대한 대손세액공제 미반영분",
    type: "input_vat",
  },
  {
    id: "nonDeductibleFix",
    name: "불공제매입세액 과다 반영 환원분",
    desc: "공제받지 못할 매입세액으로 잘못 분류되어 불공제 처리된 금액 중 공제 가능분",
    type: "input_vat",
  },
  {
    id: "zeroRate",
    name: "영세율 매출 누락신고에 따른 재계산 차액",
    desc: "영세율 적용 대상 매출 누락으로 발생한 매입세액 재계산 차액",
    type: "input_vat",
  },
];

const TAX_TYPES = {
  corp: {
    label: "법인세",
    items: CORP_TAX_ITEMS,
    computeRefund(baseInput, checkedItems) {
      const base = Number(baseInput) || 0;
      let addBack = 0;
      let creditSum = 0;
      const lines = [];

      for (const item of CORP_TAX_ITEMS) {
        const entry = checkedItems[item.id];
        if (!entry || !entry.checked) continue;
        const amount = Number(entry.amount) || 0;
        if (amount <= 0) continue;
        if (item.type === "deduction") {
          addBack += amount;
          lines.push({ item, amount, effect: null });
        } else if (item.type === "credit") {
          creditSum += amount;
          lines.push({ item, amount, effect: amount });
        }
      }

      const taxBefore = calcCorpTax(base);
      const taxAfter = calcCorpTax(Math.max(base - addBack, 0));
      const deductionRefund = Math.max(taxBefore - taxAfter, 0);

      for (const line of lines) {
        if (line.effect === null) {
          // 손금 항목 개별 기여분은 비례 배분으로 근사 표시(참고용)
          line.effect = addBack > 0 ? (deductionRefund * line.amount) / addBack : 0;
        }
      }

      const total = deductionRefund + creditSum;
      return { lines, total, base, addBack, taxBefore, taxAfter, creditSum };
    },
  },
  vat: {
    label: "부가가치세",
    items: VAT_ITEMS,
    computeRefund(_baseInput, checkedItems) {
      let total = 0;
      const lines = [];
      for (const item of VAT_ITEMS) {
        const entry = checkedItems[item.id];
        if (!entry || !entry.checked) continue;
        const amount = Number(entry.amount) || 0;
        if (amount <= 0) continue;
        total += amount;
        lines.push({ item, amount, effect: amount });
      }
      return { lines, total };
    },
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calcCorpTax,
    calcClaimDeadline,
    TAX_TYPES,
    VAT_RATE,
    CLAIM_PERIOD_YEARS,
  };
}
