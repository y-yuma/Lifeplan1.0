import { create } from 'zustand';
import { calculateNetIncomeWithRaise, calculateHousingExpense, calculatePension } from '@/lib/calculations';

type Occupation = 'company_employee' | 'part_time_with_pension' | 'part_time_without_pension' | 'self_employed' | 'homemaker';

export interface BasicInfo {
  currentAge: number;
  startYear: number;
  deathAge: number;
  gender: 'male' | 'female';
  monthlyLivingExpense: number;
  occupation: Occupation;
  maritalStatus: 'single' | 'married' | 'planning';
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
  };
  spouseInfo?: {
    age?: number;
    currentAge?: number;
    marriageAge?: number;
    occupation?: string;
    additionalExpense?: number;
  };
  children: {
    currentAge: number;
    educationPlan: {
      nursery: string;
      preschool: string;
      elementary: string;
      juniorHigh: string;
      highSchool: string;
      university: string;
    };
  }[];
  plannedChildren: {
    yearsFromNow: number;
    educationPlan: {
      nursery: string;
      preschool: string;
      elementary: string;
      juniorHigh: string;
      highSchool: string;
      university: string;
    };
  }[];
}

export interface SideIncome {
  type: 'one-time' | 'recurring';
  oneTime?: {
    age: number;
    amount: number;
    description: string;
  };
  recurring?: {
    monthlyAmount: number;
    startAge: number;
    endAge: number;
    description: string;
  };
}

export interface IncomeInfo {
  annualIncome: number;
  raiseRate: number;
  severancePay: number;
  workStartAge: number;
  workEndAge: number;
  pensionStartAge: number;
  pensionAmount: number;
  sideIncomes: SideIncome[];
  spouse?: {
    annualIncome: number;
    severancePay: number;
    workStartAge: number;
    workEndAge: number;
    pensionAmount: number;
  };
}

export interface ExpenseInfo {
  livingExpense: number;
  housingInfo: {
    type: 'rent' | 'own';
    monthlyAmount: number;
    annualIncreaseRate?: number;
    purchaseInfo?: {
      purchaseDate: Date;
      price: number;
      loan: number;
      interestRate: number;
      term: number;
      maintenanceCost: number;
    };
  };
  educationExpense: {
    nursery: number;
    preschool: number;
    elementary: number;
    juniorHigh: number;
    highSchool: number;
    university: number;
  };
}

export interface LifeEvent {
  year: number;
  description: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
}

export interface AssetsLiabilities {
  assets: {
    cash: number;
    savings: number;
    stocks: number;
    investmentTrust: number;
    realEstate: number;
  };
  liabilities: {
    loans: number;
    creditCards: number;
  };
}

export interface Parameters {
  inflationRate: number;
  educationCostIncreaseRate: number;
  investmentReturn: number;
}

export interface CashFlowData {
  [year: number]: {
    mainIncome: number;
    sideIncome: number;
    investmentIncome: number;
    spouseIncome: number;
    livingExpense: number;
    housingExpense: number;
    educationExpense: number;
    otherExpense: number;
  };
}

interface SimulatorState {
  currentStep: number;
  basicInfo: BasicInfo;
  incomeInfo: IncomeInfo;
  expenseInfo: ExpenseInfo;
  lifeEvents: LifeEvent[];
  assetsLiabilities: AssetsLiabilities;
  parameters: Parameters;
  cashFlow: CashFlowData;
  setCurrentStep: (step: number) => void;
  setBasicInfo: (info: Partial<BasicInfo>) => void;
  setIncomeInfo: (info: Partial<IncomeInfo>) => void;
  setExpenseInfo: (info: Partial<ExpenseInfo>) => void;
  addLifeEvent: (event: LifeEvent) => void;
  removeLifeEvent: (index: number) => void;
  setAssetsLiabilities: (info: Partial<AssetsLiabilities>) => void;
  setParameters: (params: Partial<Parameters>) => void;
  setCashFlow: (data: CashFlowData) => void;
  updateCashFlowValue: (year: number, field: keyof CashFlowData[number], value: number) => void;
  initializeCashFlow: () => void;
}

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  currentStep: 1,
  basicInfo: {
    currentAge: 30,
    startYear: 2025,
    deathAge: 80,
    gender: 'male',
    monthlyLivingExpense: 0,
    occupation: 'company_employee',
    maritalStatus: 'single',
    housingInfo: {
      type: 'rent',
      rent: {
        monthlyRent: 0,
        annualIncreaseRate: 0,
      },
    },
    children: [],
    plannedChildren: [],
  },
  incomeInfo: {
    annualIncome: 0,
    raiseRate: 0,
    severancePay: 0,
    workStartAge: 22,
    workEndAge: 60,
    pensionStartAge: 65,
    pensionAmount: 0,
    sideIncomes: [],
    spouse: undefined,
  },
  expenseInfo: {
    livingExpense: 0,
    housingInfo: {
      type: 'rent',
      monthlyAmount: 0,
    },
    educationExpense: {
      nursery: 0,
      preschool: 0,
      elementary: 0,
      juniorHigh: 0,
      highSchool: 0,
      university: 0,
    },
  },
  lifeEvents: [],
  assetsLiabilities: {
    assets: {
      cash: 0,
      savings: 0,
      stocks: 0,
      investmentTrust: 0,
      realEstate: 0,
    },
    liabilities: {
      loans: 0,
      creditCards: 0,
    },
  },
  parameters: {
    inflationRate: 1,
    educationCostIncreaseRate: 2,
    investmentReturn: 3,
  },
  cashFlow: {},
  setCurrentStep: (step) => set({ currentStep: step }),
  setBasicInfo: (info) => {
    set((state) => ({ basicInfo: { ...state.basicInfo, ...info } }));
    get().initializeCashFlow();
  },
  setIncomeInfo: (info) => {
    set((state) => ({ incomeInfo: { ...state.incomeInfo, ...info } }));
    get().initializeCashFlow();
  },
  setExpenseInfo: (info) => {
    set((state) => ({ expenseInfo: { ...state.expenseInfo, ...info } }));
    get().initializeCashFlow();
  },
  addLifeEvent: (event) => {
    set((state) => ({ lifeEvents: [...state.lifeEvents, event] }));
    get().initializeCashFlow();
  },
  removeLifeEvent: (index) => {
    set((state) => ({
      lifeEvents: state.lifeEvents.filter((_, i) => i !== index),
    }));
    get().initializeCashFlow();
  },
  setAssetsLiabilities: (info) => {
    set((state) => ({
      assetsLiabilities: { ...state.assetsLiabilities, ...info },
    }));
    get().initializeCashFlow();
  },
  setParameters: (params) => {
    set((state) => ({
      parameters: { ...state.parameters, ...params },
    }));
    get().initializeCashFlow();
  },
  setCashFlow: (data) => set({ cashFlow: data }),
  updateCashFlowValue: (year, field, value) => {
    set((state) => ({
      cashFlow: {
        ...state.cashFlow,
        [year]: {
          ...state.cashFlow[year],
          [field]: value,
        },
      },
    }));
  },
  initializeCashFlow: () => {
    const state = get();
    const { basicInfo, incomeInfo, lifeEvents, assetsLiabilities, parameters } = state;
    const yearsUntilDeath = basicInfo.deathAge - basicInfo.currentAge;
    const years = Array.from(
      { length: yearsUntilDeath + 1 },
      (_, i) => basicInfo.startYear + i
    );

    const newCashFlow: CashFlowData = {};

    // Calculate initial total assets
    const initialAssets = Object.values(assetsLiabilities.assets).reduce((sum, value) => sum + value, 0) -
                         Object.values(assetsLiabilities.liabilities).reduce((sum, value) => sum + value, 0);

    let previousYearAssets = initialAssets;

    years.forEach((year) => {
      const yearsSinceStart = year - basicInfo.startYear;
      const age = basicInfo.currentAge + yearsSinceStart;
      const inflationMultiplier = Math.pow(1 + parameters.inflationRate / 100, yearsSinceStart);

      // Calculate main income
      let mainIncome = 0;
      if (age >= incomeInfo.workStartAge && age <= incomeInfo.workEndAge) {
        mainIncome = calculateNetIncomeWithRaise(
          incomeInfo.annualIncome,
          basicInfo.occupation,
          incomeInfo.raiseRate,
          year,
          basicInfo.startYear
        );
      }
      if (age >= incomeInfo.pensionStartAge) {
        mainIncome += calculatePension(
          incomeInfo.annualIncome,
          incomeInfo.workStartAge,
          incomeInfo.workEndAge,
          incomeInfo.pensionStartAge,
          basicInfo.occupation
        );
      }

      // Calculate spouse income
      let spouseIncome = 0;
      if (basicInfo.maritalStatus === 'married' && basicInfo.spouseInfo?.currentAge !== undefined && incomeInfo.spouse) {
        const spouseAge = basicInfo.spouseInfo.currentAge + yearsSinceStart;
        if (spouseAge >= incomeInfo.spouse.workStartAge && spouseAge <= incomeInfo.spouse.workEndAge) {
          spouseIncome = calculateNetIncomeWithRaise(
            incomeInfo.spouse.annualIncome,
            basicInfo.spouseInfo.occupation || 'company_employee',
            0,
            year,
            basicInfo.startYear
          );
        }
        if (spouseAge >= incomeInfo.pensionStartAge) {
          spouseIncome += calculatePension(
            incomeInfo.spouse.annualIncome,
            incomeInfo.spouse.workStartAge,
            incomeInfo.spouse.workEndAge,
            incomeInfo.pensionStartAge,
            basicInfo.spouseInfo.occupation || 'company_employee'
          );
        }
      } else if (basicInfo.maritalStatus === 'planning' && basicInfo.spouseInfo?.marriageAge !== undefined) {
        const marriageYear = basicInfo.startYear + (basicInfo.spouseInfo.marriageAge - basicInfo.currentAge);
        if (year >= marriageYear && incomeInfo.spouse && basicInfo.spouseInfo.age !== undefined) {
          const spouseAge = basicInfo.spouseInfo.age + (year - marriageYear);
          if (spouseAge >= incomeInfo.spouse.workStartAge && spouseAge <= incomeInfo.spouse.workEndAge) {
            spouseIncome = calculateNetIncomeWithRaise(
              incomeInfo.spouse.annualIncome,
              basicInfo.spouseInfo.occupation || 'company_employee',
              0,
              year,
              marriageYear
            );
          }
          if (spouseAge >= incomeInfo.pensionStartAge) {
            spouseIncome += calculatePension(
              incomeInfo.spouse.annualIncome,
              incomeInfo.spouse.workStartAge,
              incomeInfo.spouse.workEndAge,
              incomeInfo.pensionStartAge,
              basicInfo.spouseInfo.occupation || 'company_employee'
            );
          }
        }
      }

      // Calculate investment return
      const investmentReturn = previousYearAssets > 0 ? 
        Number((previousYearAssets * (parameters.investmentReturn / 100)).toFixed(1)) : 0;

      // Calculate living expenses with inflation
      const livingExpense = Number((basicInfo.monthlyLivingExpense * 12 * inflationMultiplier).toFixed(1));

      // Calculate housing expenses
      const housingExpense = Number(calculateHousingExpense(basicInfo.housingInfo, year).toFixed(1));

      // Calculate education expenses
      const educationExpense = calculateEducationExpense(
        basicInfo.children,
        basicInfo.plannedChildren,
        year,
        basicInfo.currentAge,
        basicInfo.startYear,
        parameters.educationCostIncreaseRate
      );

      // Calculate other expenses from life events
      const otherExpense = calculateLifeEventExpense(lifeEvents, year);

      // Store cash flow data
      newCashFlow[year] = {
        mainIncome: Number(mainIncome.toFixed(1)),
        sideIncome: 0,
        investmentIncome: Number(investmentReturn.toFixed(1)),
        spouseIncome: Number(spouseIncome.toFixed(1)),
        livingExpense: Number(livingExpense.toFixed(1)),
        housingExpense: Number(housingExpense.toFixed(1)),
        educationExpense: Number(educationExpense.toFixed(1)),
        otherExpense: Number(otherExpense.toFixed(1)),
      };

      // Update previous year assets for next iteration
      const income = mainIncome + spouseIncome + investmentReturn;
      const expenses = livingExpense + housingExpense + educationExpense + otherExpense;
      previousYearAssets = Number((previousYearAssets + income - expenses).toFixed(1));
    });

    set({ cashFlow: newCashFlow });
  },
}));

function calculateEducationExpense(
  children: any[],
  plannedChildren: any[],
  year: number,
  currentAge: number,
  startYear: number,
  educationCostIncreaseRate: number
): number {
  // Calculate expenses for existing children
  const existingChildrenExpense = children.reduce((total, child) => {
    const childAge = child.currentAge + (year - startYear);
    let expense = 0;

    const costs = {
      nursery: child.educationPlan.nursery === '私立' ? 50 : 23.3,
      preschool: child.educationPlan.preschool === '私立' ? 100 : 58.3,
      elementary: child.educationPlan.elementary === '私立' ? 83.3 : 41.7,
      juniorHigh: child.educationPlan.juniorHigh === '私立' ? 133.3 : 66.7,
      highSchool: child.educationPlan.highSchool === '私立' ? 250 : 83.3,
    };

    if (childAge >= 0 && childAge <= 2) expense = child.educationPlan.nursery !== '行かない' ? costs.nursery : 0;
    if (childAge >= 3 && childAge <= 5) expense = child.educationPlan.preschool !== '行かない' ? costs.preschool : 0;
    if (childAge >= 6 && childAge <= 11) expense = child.educationPlan.elementary !== '行かない' ? costs.elementary : 0;
    if (childAge >= 12 && childAge <= 14) expense = child.educationPlan.juniorHigh !== '行かない' ? costs.juniorHigh : 0;
    if (childAge >= 15 && childAge <= 17) expense = child.educationPlan.highSchool !== '行かない' ? costs.highSchool : 0;
    if (childAge >= 18 && childAge <= 21) expense = child.educationPlan.university !== '行かない' ? getUniversityCost(child.educationPlan.university) : 0;

    const yearsSinceStart = year - startYear;
    const increaseMultiplier = Math.pow(1 + educationCostIncreaseRate / 100, yearsSinceStart);
    return total + (expense * increaseMultiplier);
  }, 0);

  // Calculate expenses for planned children
  const plannedChildrenExpense = plannedChildren.reduce((total, child) => {
    const yearsSinceStart = year - startYear;
    if (yearsSinceStart >= child.yearsFromNow) {
      const childAge = yearsSinceStart - child.yearsFromNow;
      let expense = 0;

      const costs = {
        nursery: child.educationPlan.nursery === '私立' ? 50 : 23.3,
        preschool: child.educationPlan.preschool === '私立' ? 100 : 58.3,
        elementary: child.educationPlan.elementary === '私立' ? 83.3 : 41.7,
        juniorHigh: child.educationPlan.juniorHigh === '私立' ? 133.3 : 66.7,
        highSchool: child.educationPlan.highSchool === '私立' ? 250 : 83.3,
      };

      if (childAge >= 0 && childAge <= 2) expense = child.educationPlan.nursery !== '行かない' ? costs.nursery : 0;
      if (childAge >= 3 && childAge <= 5) expense = child.educationPlan.preschool !== '行かない' ? costs.preschool : 0;
      if (childAge >= 6 && childAge <= 11) expense = child.educationPlan.elementary !== '行かない' ? costs.elementary : 0;
      if (childAge >= 12 && childAge <= 14) expense = child.educationPlan.juniorHigh !== '行かない' ? costs.juniorHigh : 0;
      if (childAge >= 15 && childAge <= 17) expense = child.educationPlan.highSchool !== '行かない' ? costs.highSchool : 0;
      if (childAge >= 18 && childAge <= 21) expense = child.educationPlan.university !== '行かない' ? getUniversityCost(child.educationPlan.university) : 0;

      const increaseMultiplier = Math.pow(1 + educationCostIncreaseRate / 100, yearsSinceStart);
      return total + (expense * increaseMultiplier);
    }
    return total;
  }, 0);

  return Number((existingChildrenExpense + plannedChildrenExpense).toFixed(1));
}

function calculateLifeEventExpense(lifeEvents: any[], year: number) {
  const expense = lifeEvents.reduce((total, event) => {
    if (event.year === year) {
      if (event.type === 'expense') {
        return total + event.amount;
      } else {
        return total - event.amount;
      }
    }
    return total;
  }, 0);
  return Number(expense.toFixed(1));
}

function getUniversityCost(universityType: string) {
  switch (universityType) {
    case '公立大学（文系）':
      return 325;
    case '公立大学（理系）':
      return 375;
    case '私立大学（文系）':
      return 550;
    case '私立大学（理系）':
      return 650;
    default:
      return 0;
  }
}