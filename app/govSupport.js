/**
 * 정부지원·세액감면 매칭 리포트
 * - 국세청/기획재정부(조세특례제한법) 세액공제·감면과 중기부/고용노동부 무상자금지원(보조금)을
 *   회사 프로필 기준으로 매칭하여 예상 지원 규모를 추정한다.
 *
 * 중요한 구분:
 *  - type "tax_credit" (세액공제·감면): 요건을 충족하면 법에 따라 확정 적용되는 항목.
 *  - type "grant" (정부지원사업/보조금): 대부분 예산 한도 내 공모·심사를 거쳐 선정되는 항목으로,
 *    아래 금액은 "신청 자격이 있고 선정될 경우"의 참고 한도이며 확정 지원액이 아니다.
 *
 * 여기 수록된 제도는 매년 4,000개 이상 공고되는 정부지원사업 중 업종을 가리지 않고
 * 폭넓게 적용되는 대표 제도만 선별한 것이다(전수 조사가 아님). 전체 목록·최신 공고는
 * 기업마당(bizinfo.go.kr), 고용24(work24.go.kr), K-Startup(k-startup.go.kr)에서 확인해야 한다.
 * 감면율·지원단가는 매년 개정되므로 아래 수치는 2026년 기준 참고치이며, 실제 적용 전
 * 국세청/소관 부처 최신 공고 및 세무 전문가 확인이 필요하다.
 *
 * 2025년 세법개정(2026년 시행) 반영 이력:
 *  - 성과공유 중소기업 경영성과급 세액공제율 15% → 10%로 수정 (조특법 제19조)
 *  - 통합투자세액공제 기본공제율(일반 자산) 중소 3%→10%, 중견 2%→3%로 수정 (조특법 제24조)
 *  - 중소기업 특별세액감면: 중기업은 수도권 소재 시 감면 대상에서 제외되는 규정을 반영 (소기업만 수도권에서도 적용)
 *  - 법인세율 전 구간 1%p 인상(10/20/22/25%, 2026년 개시 사업연도부터) → rules.js에 반영
 */

const REGION_OPTIONS = [
  { value: "capital_over", label: "수도권과밀억제권역", regionGroup: "capital", investCoef: 1.0, startupFullExempt: false },
  { value: "capital_etc", label: "수도권(과밀억제권역 외, 인구감소지역 제외)", regionGroup: "capital", investCoef: 1.0, startupFullExempt: false },
  { value: "capital_decline", label: "수도권 인구감소지역", regionGroup: "capital", investCoef: 1.0, startupFullExempt: true },
  { value: "metro_noncapital", label: "비수도권 광역시 등", regionGroup: "noncapital", investCoef: 1.1, startupFullExempt: true },
  { value: "noncapital", label: "기타 비수도권", regionGroup: "noncapital", investCoef: 1.3, startupFullExempt: true },
  { value: "noncapital_pref", label: "기타 비수도권 우대지역(인구감소지역 등)", regionGroup: "noncapital", investCoef: 1.5, startupFullExempt: true },
];

function regionInfo(value) {
  return REGION_OPTIONS.find((r) => r.value === value) || REGION_OPTIONS[1];
}

const COMPANY_SIZES = [
  { value: "small", label: "소기업" },
  { value: "medium", label: "중기업(소기업 외 중소기업)" },
  { value: "midsize", label: "중견기업" },
  { value: "large", label: "대기업" },
];

const PROFILE_FIELDS = [
  { id: "companySize", label: "기업 규모", type: "select", options: COMPANY_SIZES, group: "기업 기본정보" },
  { id: "eligibleIndustry", label: "조특법 감면대상 업종(제조업·건설업·정보통신업 등 18개 업종)에 해당", type: "checkbox", group: "기업 기본정보" },
  { id: "region", label: "사업장 소재지", type: "select", options: REGION_OPTIONS, group: "기업 기본정보" },
  { id: "foundedDate", label: "설립(창업)일자", type: "date", group: "기업 기본정보" },
  { id: "founderAge", label: "대표자 만 나이", type: "number", group: "기업 기본정보" },
  { id: "manufacturing", label: "제조업을 영위함", type: "checkbox", group: "기업 기본정보" },
  { id: "preStartup", label: "아직 사업자등록 전 예비창업자임", type: "checkbox", group: "기업 기본정보" },

  { id: "corpTaxBase", label: "최근 사업연도 법인세 산출세액(원)", type: "number", group: "재무·투자 정보" },
  { id: "investAmount", label: "올해 신규 사업용 설비투자금액(원)", type: "number", group: "재무·투자 정보" },
  { id: "rndAmount", label: "올해 연구인력개발비 지출액(원)", type: "number", group: "재무·투자 정보" },
  { id: "bonusAmount", label: "경영성과급 지급액(원)", type: "number", group: "재무·투자 정보" },

  { id: "employeeCount", label: "현재 상시근로자수(명)", type: "number", group: "고용 정보" },
  { id: "increasedGeneral", label: "올해 상시근로자 증가인원 - 일반(명)", type: "number", group: "고용 정보" },
  { id: "increasedPreferred", label: "올해 상시근로자 증가인원 - 청년·장애인·60세이상·경력단절여성 등 우대(명)", type: "number", group: "고용 정보" },
  { id: "youthHires", label: "청년(만 15~34세) 신규채용 인원(명)", type: "number", group: "고용 정보" },
  { id: "duruNuriTarget", label: "두루누리 대상(월평균보수 270만원 미만 신규가입) 근로자수(명)", type: "number", group: "고용 정보" },
];

function yearsSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

function num(v) {
  return Number(v) || 0;
}

function isYouthFounder(profile) {
  return profile.founderAge !== "" && profile.founderAge !== undefined && Number(profile.founderAge) <= 34;
}

function isSmallOrMediumSME(profile) {
  return profile.companySize === "small" || profile.companySize === "medium";
}

const PROGRAMS = [
  // ---------- 세액공제·감면 (국세청 / 기획재정부, 조세특례제한법) ----------
  {
    id: "startupExemption",
    ministry: "국세청·기획재정부",
    name: "창업중소기업(청년창업) 세액감면",
    legalBasis: "조세특례제한법 제6조",
    type: "tax_credit",
    eligible(p) {
      const yrs = yearsSince(p.foundedDate);
      return isSmallOrMediumSME(p) && p.eligibleIndustry && yrs !== null && yrs <= 5 && p.corpTaxBase > 0;
    },
    estimate(p) {
      const region = regionInfo(p.region);
      const youth = isYouthFounder(p);
      let rate;
      if (youth) {
        rate = region.startupFullExempt ? 1.0 : 0.75;
      } else {
        rate = region.regionGroup === "capital" && p.region === "capital_over" ? 0 : 0.5;
      }
      const amount = num(p.corpTaxBase) * rate;
      return {
        amount,
        confirmed: true,
        noteText: `감면율 ${Math.round(rate * 100)}% 적용(최초 소득 발생 과세연도부터 4~5년간). 창업일로부터 정확한 감면기간·중복배제 규정은 세무사 확인 필요.`,
      };
    },
  },
  {
    id: "specialDeduction",
    ministry: "국세청·기획재정부",
    name: "중소기업 특별세액감면",
    legalBasis: "조세특례제한법 제7조",
    type: "tax_credit",
    eligible(p) {
      if (!isSmallOrMediumSME(p) || !p.eligibleIndustry || !(p.corpTaxBase > 0)) return false;
      // 중기업(소기업 외 중소기업)은 수도권 소재 시 특별세액감면 대상에서 제외된다. 소기업은 수도권에서도 적용된다.
      if (p.companySize === "medium" && regionInfo(p.region).regionGroup === "capital") return false;
      return true;
    },
    estimate(p) {
      const rate = p.companySize === "small" ? 0.2 : 0.15;
      const raw = num(p.corpTaxBase) * rate;
      const amount = Math.min(raw, 100_000_000);
      return {
        amount,
        confirmed: true,
        noteText: `감면율 ${Math.round(rate * 100)}%(업종·규모별 5~30%, 연간 감면한도 1억원). 중기업은 수도권 소재 시 대상이 아니며, 소기업만 수도권에서도 적용됩니다. 창업중소기업 세액감면과 중복 적용 불가하며 유리한 항목을 선택해야 합니다.`,
      };
    },
  },
  {
    id: "integratedInvestment",
    ministry: "국세청·기획재정부",
    name: "통합투자세액공제",
    legalBasis: "조세특례제한법 제24조",
    type: "tax_credit",
    eligible(p) {
      return num(p.investAmount) > 0;
    },
    estimate(p) {
      const region = regionInfo(p.region);
      const baseRate = p.companySize === "small" || p.companySize === "medium" ? 0.10 : p.companySize === "midsize" ? 0.03 : 0.01;
      const amount = num(p.investAmount) * baseRate * region.investCoef;
      return {
        amount,
        confirmed: true,
        noteText: `기본공제율 ${Math.round(baseRate * 100)}% × 지역계수 ${region.investCoef} 적용(기본공제만 반영, 투자증가분 추가공제 별도).`,
      };
    },
  },
  {
    id: "rndCredit",
    ministry: "국세청·기획재정부",
    name: "연구인력개발비 세액공제",
    legalBasis: "조세특례제한법 제10조",
    type: "tax_credit",
    eligible(p) {
      return num(p.rndAmount) > 0;
    },
    estimate(p) {
      const rate = isSmallOrMediumSME(p) ? 0.25 : p.companySize === "midsize" ? 0.15 : 0.02;
      const amount = num(p.rndAmount) * rate;
      return {
        amount,
        confirmed: true,
        noteText: `일반 연구·인력개발비를 당기분 방식으로 계산한 공제율(중소 25%/중견 8~15%/대기업 0~2%)입니다. 전년 대비 지출 증가분에 적용하는 증가분 방식(중소 50%/중견 40%/대기업 25%)이 더 유리할 수 있으니 두 방식을 비교해야 합니다. 신성장·원천기술 R&D는 별도 우대율이 적용됩니다.`,
      };
    },
  },
  {
    id: "integratedEmployment",
    ministry: "국세청·기획재정부",
    name: "통합고용세액공제",
    legalBasis: "조세특례제한법 제29조의8",
    type: "tax_credit",
    eligible(p) {
      return num(p.increasedGeneral) + num(p.increasedPreferred) > 0;
    },
    estimate(p) {
      const capital = regionInfo(p.region).regionGroup === "capital";
      let generalUnit, preferredUnit;
      if (isSmallOrMediumSME(p)) {
        generalUnit = 8_500_000;
        preferredUnit = capital ? 14_500_000 : 15_500_000;
      } else if (p.companySize === "midsize") {
        generalUnit = 4_500_000;
        preferredUnit = 8_000_000;
      } else {
        generalUnit = 0;
        preferredUnit = 4_000_000;
      }
      const amount = num(p.increasedGeneral) * generalUnit + num(p.increasedPreferred) * preferredUnit;
      return {
        amount,
        confirmed: true,
        noteText: "1인당 단가는 2026년 개편안 기준 근사치이며, 중견·대기업은 최소고용증가 인원수(각 5명·10명) 초과분만 공제됩니다. 실제 공제는 세액공제기간(통상 2~3년) 동안 유지요건 충족 시 확정됩니다.",
      };
    },
  },
  {
    id: "performanceShare",
    ministry: "국세청·기획재정부",
    name: "성과공유 중소기업 경영성과급 세액공제",
    legalBasis: "조세특례제한법 제19조",
    type: "tax_credit",
    eligible(p) {
      return p.companySize === "small" || p.companySize === "medium" ? num(p.bonusAmount) > 0 : false;
    },
    estimate(p) {
      const amount = num(p.bonusAmount) * 0.10;
      return { amount, confirmed: true, noteText: "중소기업이 경영성과급을 지급한 경우 지급액의 10% 세액공제(2027년 12월 31일까지 지급분). 직전 과세연도 대비 상시근로자 수가 감소하면 공제가 배제됩니다." };
    },
  },

  // ---------- 무상자금지원 (고용노동부) ----------
  {
    id: "youthLeap",
    ministry: "고용노동부",
    name: "청년일자리도약장려금",
    type: "grant",
    eligible(p) {
      return num(p.employeeCount) >= 1 && num(p.youthHires) > 0;
    },
    estimate(p) {
      const amountMax = num(p.youthHires) * 12_000_000;
      return {
        amountRange: [0, amountMax],
        confirmed: false,
        noteText: "청년(15~34세)을 신규채용해 6개월 이상 고용을 유지한 우선지원대상기업 기준, 최대 1,200만원/인(2년 지급구조). 사업장 규모·업종별 세부요건은 고용24에서 확인 필요.",
      };
    },
  },
  {
    id: "employmentCreation",
    ministry: "고용노동부",
    name: "고용창출장려금",
    type: "grant",
    eligible(p) {
      return num(p.increasedGeneral) + num(p.increasedPreferred) > 0;
    },
    estimate(p) {
      const headcount = num(p.increasedGeneral) + num(p.increasedPreferred);
      const amountMax = headcount * 12_000_000;
      return {
        amountRange: [0, amountMax],
        confirmed: false,
        noteText: "신규 고용창출 유형(신중년적합직무, 국내복귀기업 등)에 따라 1인당 연 360만~1,200만원 수준으로 차등 지급되며, 유형별 요건 확인이 필요합니다.",
      };
    },
  },
  {
    id: "duruNuri",
    ministry: "고용노동부",
    name: "두루누리 사회보험료 지원",
    type: "grant",
    eligible(p) {
      return num(p.employeeCount) > 0 && num(p.employeeCount) < 10 && num(p.duruNuriTarget) > 0;
    },
    estimate(p) {
      const amount = num(p.duruNuriTarget) * 121_980 * 12;
      return {
        amount,
        confirmed: false,
        noteText: "상시근로자 10인 미만 사업장의 월평균보수 270만원 미만 신규가입 근로자에 대해 국민연금·고용보험료의 최대 80%(사업주부담분 1인당 월 최대 약 121,980원)를 보험료에서 자동 차감하는 방식으로 지원합니다.",
      };
    },
  },

  // ---------- 무상자금지원 (중소벤처기업부, 공모형 사업화·바우처 지원) ----------
  {
    id: "preStartupPackage",
    ministry: "중소벤처기업부",
    name: "예비창업패키지",
    type: "grant",
    eligible(p) {
      return !!p.preStartup;
    },
    estimate() {
      return {
        amountRange: [20_000_000, 100_000_000],
        confirmed: false,
        noteText: "사업자등록 전 예비창업자 대상 사업화 자금 지원(평균 약 4천만원, 최대 1억원). 공모·심사를 통해 선정되며 경쟁률이 높습니다(최근 공고 기준 약 49:1).",
      };
    },
  },
  {
    id: "earlyStartupPackage",
    ministry: "중소벤처기업부",
    name: "초기창업패키지",
    type: "grant",
    eligible(p) {
      const yrs = yearsSince(p.foundedDate);
      return yrs !== null && yrs <= 3;
    },
    estimate() {
      return {
        amountRange: [30_000_000, 100_000_000],
        confirmed: false,
        noteText: "업력 3년 이내 기업 대상 사업화 자금(평균 약 7천만원, 최대 1억원, 딥테크 분야는 최대 1.5억원). 공모·심사형 사업입니다.",
      };
    },
  },
  {
    id: "leapStartupPackage",
    ministry: "중소벤처기업부",
    name: "창업도약패키지",
    type: "grant",
    eligible(p) {
      const yrs = yearsSince(p.foundedDate);
      return yrs !== null && yrs > 3 && yrs <= 7;
    },
    estimate() {
      return {
        amountRange: [30_000_000, 100_000_000],
        confirmed: false,
        noteText: "업력 3~7년 기업의 스케일업을 지원하는 사업화 자금(공고별 상이). 정확한 한도는 해당 연도 공고 확인이 필요합니다.",
      };
    },
  },
  {
    id: "innovationVoucher",
    ministry: "중소벤처기업부",
    name: "중소기업 혁신바우처",
    type: "grant",
    eligible(p) {
      return isSmallOrMediumSME(p);
    },
    estimate() {
      return {
        amountRange: [0, 50_000_000],
        confirmed: false,
        noteText: "컨설팅·마케팅·기술지원 등에 사용 가능한 바우처를 기업당 최대 5천만원 이내로 지원(자부담 비율 존재).",
      };
    },
  },
  {
    id: "smartFactory",
    ministry: "중소벤처기업부",
    name: "스마트공장 구축지원",
    type: "grant",
    eligible(p) {
      return !!p.manufacturing && isSmallOrMediumSME(p);
    },
    estimate() {
      return {
        amountRange: [0, 150_000_000],
        confirmed: false,
        noteText: "제조 중소기업의 스마트공장 구축·고도화 비용을 정부 매칭(통상 총사업비의 50% 내외)으로 지원, 최대 약 1.5억원 수준. 연도별 공고 한도 확인 필요.",
      };
    },
  },
];

function matchPrograms(profile) {
  return PROGRAMS.filter((prog) => {
    try {
      return prog.eligible(profile);
    } catch (e) {
      return false;
    }
  }).map((prog) => ({ program: prog, result: prog.estimate(profile) }));
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PROGRAMS, PROFILE_FIELDS, REGION_OPTIONS, COMPANY_SIZES, matchPrograms, yearsSince };
}
