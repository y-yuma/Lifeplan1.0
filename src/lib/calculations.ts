// Tax calculation utilities
export function calculateSalaryDeduction(annualIncome: number): number {
  // Convert from 万円 to actual yen for calculation
  const incomeInYen = annualIncome * 10000;
  
  if (incomeInYen <= 8_500_000) {
    const deduction = Math.min(Math.max((incomeInYen * 0.3) + 80_000, 550_000), 1_950_000);
    // Convert back to 万円
    return Math.floor(deduction / 10000);
  }
  // Convert 1,950,000 yen to 万円
  return 195;
}

export function calculateIncomeTax(taxableIncome: number): number {
  // Convert from 万円 to actual yen for calculation
  const taxableIncomeInYen = taxableIncome * 10000;
  
  // Tax brackets in actual yen
  const brackets = [
    { limit: 1_950_000, rate: 0.05, deduction: 0 },
    { limit: 3_300_000, rate: 0.10, deduction: 97_500 },
    { limit: 6_950_000, rate: 0.20, deduction: 427_500 },
    { limit: 9_000_000, rate: 0.23, deduction: 636_000 },
    { limit: 18_000_000, rate: 0.33, deduction: 1_536_000 },
    { limit: 40_000_000, rate: 0.40, deduction: 2_796_000 },
    { limit: Infinity, rate: 0.45, deduction: 4_796_000 },
  ];

  const bracket = brackets.find(b => taxableIncomeInYen <= b.limit);
  if (!bracket) return 0;

  const taxInYen = Math.floor((taxableIncomeInYen * bracket.rate) - bracket.deduction);
  // Convert back to 万円
  return Math.floor(taxInYen / 10000);
}

export function calculateSocialInsuranceRate(annualIncome: number): number {
  // 年収850万円未満は15%、以上は7.7%
  return annualIncome < 850 ? 0.15 : 0.077;
}

// Housing cost calculation utilities
export function calculateMonthlyMortgage(
  loanAmount: number,
  interestRate: number,
  termYears: number
): number {
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = termYears * 12;
  
  if (monthlyRate === 0) {
    return loanAmount / numberOfPayments;
  }

  const monthlyPayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return Number(monthlyPayment.toFixed(1));
}

export function calculateHousingExpense(
  housingInfo: {
    type: 'rent' | 'own';
    rent?: {
      monthlyRent: number;
      annualIncreaseRate: number;
    };
    own?: {
      purchaseYear: number;
      purchasePrice: number;
      loanAmount: number;
      interestRate: number;
      loanTermYears: number;
      maintenanceCostRate: number;
    };
  },
  currentYear: number
): number {
  if (housingInfo.type === 'rent' && housingInfo.rent) {
    const yearsSinceStart = currentYear - new Date().getFullYear();
    const annualRent = housingInfo.rent.monthlyRent * 12;
    return Number((annualRent * Math.pow(1 + housingInfo.rent.annualIncreaseRate / 100, yearsSinceStart)).toFixed(1));
  } else if (housingInfo.type === 'own' && housingInfo.own) {
    const monthlyMortgage = calculateMonthlyMortgage(
      housingInfo.own.loanAmount,
      housingInfo.own.interestRate,
      housingInfo.own.loanTermYears
    );
    const annualMortgage = monthlyMortgage * 12;
    const maintenanceCost = housingInfo.own.purchasePrice * (housingInfo.own.maintenanceCostRate / 100);
    
    if (currentYear < housingInfo.own.purchaseYear) {
      return 0;
    }
    
    const loanEndYear = housingInfo.own.purchaseYear + housingInfo.own.loanTermYears;
    if (currentYear >= loanEndYear) {
      return maintenanceCost;
    }
    
    return Number((annualMortgage + maintenanceCost).toFixed(1));
  }
  
  return 0;
}

// Pension calculation utilities
export function calculatePension(
  annualIncome: number,
  workStartAge: number,
  workEndAge: number,
  pensionStartAge: number = 65,
  occupation: string = 'company_employee'
): number {
  // For occupations without welfare pension, return fixed amount
  if (occupation === 'part_time_without_pension' || 
      occupation === 'self_employed' || 
      occupation === 'homemaker') {
    return 76.8; // 76.8万円/年 = 6.4万円/月
  }

  // Basic pension amount (老齢基礎年金) - Fixed at 768,000 yen per year
  const basicPensionYearly = 768_000;

  // Only company employees and part-time workers with pension get welfare pension
  const hasWelfarePension = occupation === 'company_employee' || occupation === 'part_time_with_pension';

  let totalPensionYearly = basicPensionYearly;

  // Calculate welfare pension (厚生年金) only for eligible occupations
  if (hasWelfarePension) {
    // Calculate average monthly salary (in yen)
    const averageMonthlySalary = (annualIncome * 10000) / 12;

    // Calculate standard salary (capped at 1.3M yen)
    const standardSalary = Math.min(averageMonthlySalary, 1_300_000);

    // Calculate ratio based on working period
    const workingMonths = (workEndAge - workStartAge) * 12;
    const ratio = Math.min(workingMonths / 480, 1); // 480 months = 40 years

    // Fixed coefficient k = 0.217
    const k = 0.217;

    // Calculate monthly proportional pension
    const monthlyPensionProportional = standardSalary * ratio * k;

    // Calculate annual proportional pension
    const annualPensionProportional = monthlyPensionProportional * 12;

    // Add welfare pension to total
    totalPensionYearly += annualPensionProportional;
  }

  // Calculate delayed payment adjustment
  const delayedMonths = Math.max(0, (pensionStartAge - 65) * 12);
  const increaseRate = Math.min(delayedMonths * 0.007, 0.42); // 0.7% per month, max 42%
  const adjustedTotalPensionYearly = totalPensionYearly * (1 + increaseRate);
  
  // Convert to 万円 and round to 1 decimal place
  return Number((adjustedTotalPensionYearly / 10000).toFixed(1));
}

export function calculateNetIncome(
  annualIncome: number, // in 万円
  occupation: string
): { 
  netIncome: number;
  deductions: {
    salaryDeduction: number;
    socialInsurance: number;
    incomeTax: number;
    residentTax: number;
    total: number;
  };
} {
  // 自営業・フリーランスまたは専業主婦・夫の場合は控除なし
  if (occupation === 'self_employed' || occupation === 'homemaker') {
    return {
      netIncome: annualIncome,
      deductions: {
        salaryDeduction: 0,
        socialInsurance: 0,
        incomeTax: 0,
        residentTax: 0,
        total: 0
      }
    };
  }

  // パート（厚生年金なし）の場合は社会保険料なし
  const hasSocialInsurance = occupation === 'company_employee' || 
                           occupation === 'part_time_with_pension';

  // 給与所得控除 (in 万円)
  const salaryDeduction = calculateSalaryDeduction(annualIncome);

  // 社会保険料（年収に応じて変動）
  const socialInsuranceRate = calculateSocialInsuranceRate(annualIncome);
  const socialInsurance = hasSocialInsurance ? Math.floor(annualIncome * socialInsuranceRate) : 0;

  // 課税所得 (in 万円)
  const taxableIncome = Math.max(0, annualIncome - (salaryDeduction + socialInsurance));

  // 所得税 (in 万円)
  const incomeTax = calculateIncomeTax(taxableIncome);

  // 住民税（課税所得の10%）
  const residentTax = Math.floor(taxableIncome * 0.10);

  // 総控除額 (in 万円)
  const totalDeductions = socialInsurance + incomeTax + residentTax;

  // 手取り収入 (in 万円)
  const netIncome = annualIncome - totalDeductions;

  return {
    netIncome,
    deductions: {
      salaryDeduction,
      socialInsurance,
      incomeTax,
      residentTax,
      total: totalDeductions
    }
  };
}

export function calculateNetIncomeWithRaise(
  baseAnnualIncome: number, // in 万円
  occupation: string,
  raiseRate: number,
  year: number,
  startYear: number,
  workStartAge?: number,
  workEndAge?: number,
  currentAge?: number,
  pensionAmount?: number,
  pensionStartAge?: number
): number {
  const raisedIncome = Math.floor(
    baseAnnualIncome * Math.pow(1 + raiseRate / 100, year - startYear)
  );
  return calculateNetIncome(raisedIncome, occupation).netIncome;
}