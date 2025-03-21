import React from 'react';
import { useSimulatorStore } from '@/store/simulator';

function calculateAge(startYear: number, currentAge: number, targetYear: number) {
  return currentAge + (targetYear - startYear);
}

function getLifeEventDescription(
  year: number,
  basicInfo: any,
  children: any[],
  plannedChildren: any[],
  lifeEvents: any[]
): string {
  const events: string[] = [];
  
  // Marriage event
  if (basicInfo.maritalStatus === 'planning') {
    const marriageAge = basicInfo.spouseInfo?.marriageAge || 0;
    const marriageYear = basicInfo.startYear + (marriageAge - basicInfo.currentAge);
    if (year === marriageYear) {
      events.push('結婚');
    }
  }

  // Children birth events
  children.forEach((child, index) => {
    const birthYear = basicInfo.startYear - child.currentAge;
    if (year === birthYear) {
      events.push(`第${index + 1}子誕生`);
    }
  });

  // Planned children birth events
  plannedChildren.forEach((child, index) => {
    const birthYear = basicInfo.startYear + child.yearsFromNow;
    if (year === birthYear) {
      events.push(`第${children.length + index + 1}子誕生`);
    }
  });

  // Life events
  const yearEvents = lifeEvents.filter(event => event.year === year);
  yearEvents.forEach(event => {
    events.push(`${event.description}（${event.type === 'income' ? '+' : '-'}${event.amount}万円）`);
  });

  return events.join('、');
}

export function CashFlowForm() {
  const {
    basicInfo,
    incomeInfo,
    lifeEvents,
    assetsLiabilities,
    parameters,
    cashFlow,
    updateCashFlowValue,
    setCurrentStep
  } = useSimulatorStore();
  
  const yearsUntilDeath = basicInfo.deathAge - basicInfo.currentAge;
  const years = Array.from(
    { length: yearsUntilDeath + 1 },
    (_, i) => basicInfo.startYear + i
  );

  // Calculate initial total assets
  const initialAssets = Object.values(assetsLiabilities.assets).reduce((sum, value) => sum + value, 0);

  // Calculate investment assets and returns for each year
  const investmentData = years.reduce((acc: { 
    assets: { [year: number]: number },
    returns: { [year: number]: number }
  }, year, index) => {
    if (index === 0) {
      acc.assets[year] = initialAssets;
      acc.returns[year] = 0;
      return acc;
    }

    const prevYear = years[index - 1];
    const prevAssets = acc.assets[prevYear];
    const investmentReturn = Number((prevAssets * (parameters.investmentReturn / 100)).toFixed(1));
    acc.assets[year] = Number((prevAssets + investmentReturn).toFixed(1));
    acc.returns[year] = investmentReturn;

    return acc;
  }, { assets: {}, returns: {} });

  // Calculate yearly and cumulative balances
  const balances = years.reduce((acc: { 
    yearly: { [year: number]: number },
    cumulative: { [year: number]: number }
  }, year, index) => {
    const cf = cashFlow[year];
    if (!cf) {
      acc.yearly[year] = 0;
      acc.cumulative[year] = index === 0 ? 0 : acc.cumulative[years[index - 1]];
      return acc;
    }

    // For the first year, include initial assets in income
    const income = cf.mainIncome + cf.sideIncome + cf.spouseIncome + 
                  (index === 0 ? initialAssets : investmentData.returns[year]);
    
    const expenses = cf.livingExpense + cf.housingExpense + cf.educationExpense + cf.otherExpense;
    
    const yearLifeEvents = lifeEvents.filter(event => event.year === year);
    const lifeEventImpact = yearLifeEvents.reduce((sum, event) => {
      return sum + (event.type === 'income' ? event.amount : -event.amount);
    }, 0);

    acc.yearly[year] = Number((income - expenses + lifeEventImpact).toFixed(1));
    acc.cumulative[year] = index === 0 ? 
      acc.yearly[year] : 
      Number((acc.cumulative[years[index - 1]] + acc.yearly[year]).toFixed(1));

    return acc;
  }, { yearly: {}, cumulative: {} });

  const handleNext = () => {
    setCurrentStep(7);
  };

  const handleBack = () => {
    setCurrentStep(5);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">キャッシュフロー</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 sticky left-0 bg-gray-50">項目</th>
              {years.map(year => (
                <th key={year} className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                  {year}年
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">年齢</td>
              {years.map(year => (
                <td key={year} className="px-4 py-2 text-right text-sm text-gray-900">
                  {calculateAge(basicInfo.startYear, basicInfo.currentAge, year)}歳
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">イベント</td>
              {years.map(year => (
                <td key={year} className="px-4 py-2 text-right text-xs text-gray-600">
                  {getLifeEventDescription(year, basicInfo, basicInfo.children, basicInfo.plannedChildren, lifeEvents)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">主たる収入（万円）</td>
              {years.map(year => (
                <td key={year} className="px-4 py-2 text-right text-sm">
                  <input
                    type="number"
                    value={cashFlow[year]?.mainIncome || 0}
                    onChange={(e) => updateCashFlowValue(year, 'mainIncome', Number(e.target.value))}
                    className="w-24 text-right border-gray-200 rounded-md"
                  />
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">副業収入（万円）</td>
              {years.map(year => (
                <td key={year} className="px-4 py-2 text-right text-sm">
                  <input
                    type="number"
                    value={cashFlow[year]?.sideIncome || 0}
                    onChange={(e) => updateCashFlowValue(year, 'sideIncome', Number(e.target.value))}
                    className="w-24 text-right border-gray-200 rounded-md"
                  />
                </td>
              ))}
            </tr>
            {basicInfo.maritalStatus !== 'single' && (
              <tr>
                <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">配偶者の収入（万円）</td>
                {years.map(year => (
                  <td key={year} className="px-4 py-2 text-right text-sm">
                    <input
                      type="number"
                      value={cashFlow[year]?.spouseIncome || 0}
                      onChange={(e) => updateCashFlowValue(year, 'spouseIncome', Number(e.target.value))}
                      className="w-24 text-right border-gray-200 rounded-md"
                    />
                  </td>
                ))}
              </tr>
            )}
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">運用資産（万円）</td>
              {years.map(year => (
                <td key={year} className="px-4 py-2 text-right text-sm">
                  <input
                    type="number"
                    value={investmentData.assets[year]}
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      investmentData.assets[year] = newValue;
                      const nextYear = years[years.indexOf(year) + 1];
                      if (nextYear) {
                        investmentData.returns[nextYear] = Number((newValue * (parameters.investmentReturn / 100)).toFixed(1));
                      }
                    }}
                    className="w-24 text-right border-gray-200 rounded-md"
                  />
                  （+{investmentData.returns[year]}）
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">生活費（万円）</td>
              {years.map(year => (
                <td key={year} className="px-4 py-2 text-right text-sm">
                  <input
                    type="number"
                    value={cashFlow[year]?.livingExpense || 0}
                    onChange={(e) => updateCashFlowValue(year, 'livingExpense', Number(e.target.value))}
                    className="w-24 text-right border-gray-200 rounded-md"
                  />
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">住居費（万円）</td>
              {years.map(year => (
                <td key={year} className="px-4 py-2 text-right text-sm">
                  <input
                    type="number"
                    value={cashFlow[year]?.housingExpense || 0}
                    onChange={(e) => updateCashFlowValue(year, 'housingExpense', Number(e.target.value))}
                    className="w-24 text-right border-gray-200 rounded-md"
                  />
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">教育費（万円）</td>
              {years.map(year => (
                <td key={year} className="px-4 py-2 text-right text-sm">
                  <input
                    type="number"
                    value={cashFlow[year]?.educationExpense || 0}
                    onChange={(e) => updateCashFlowValue(year, 'educationExpense', Number(e.target.value))}
                    className="w-24 text-right border-gray-200 rounded-md"
                  />
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">その他（万円）</td>
              {years.map(year => {
                const yearLifeEvents = lifeEvents.filter(event => event.year === year);
                const lifeEventImpact = yearLifeEvents.reduce((sum, event) => {
                  return event.type === 'expense' ? sum + event.amount : sum;
                }, 0);
                return (
                  <td key={year} className="px-4 py-2 text-right text-sm">
                    <input
                      type="number"
                      value={cashFlow[year]?.otherExpense || lifeEventImpact}
                      onChange={(e) => updateCashFlowValue(year, 'otherExpense', Number(e.target.value))}
                      className="w-24 text-right border-gray-200 rounded-md"
                    />
                  </td>
                );
              })}
            </tr>
            <tr className="bg-gray-50 font-medium">
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-gray-50">収支</td>
              {years.map(year => {
                const balance = balances.yearly[year];
                return (
                  <td key={year} className={`px-4 py-2 text-right text-sm ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {balance}万円
                  </td>
                );
              })}
            </tr>
            <tr className="bg-gray-50 font-medium">
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-gray-50">総収支</td>
              {years.map(year => {
                const balance = balances.cumulative[year];
                return (
                  <td key={year} className={`px-4 py-2 text-right text-sm ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {balance}万円
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-between space-x-4">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          次へ
        </button>
      </div>
    </div>
  );
}