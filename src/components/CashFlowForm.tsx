import React, { useEffect } from 'react';
import { useSimulatorStore } from '@/store/simulator';
import { Download } from 'lucide-react';

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
    cashFlow,
    assetsLiabilities,
    parameters,
    lifeEvents,
    setCurrentStep,
    updateCashFlowValue,
    initializeCashFlow,
  } = useSimulatorStore();
  
  const yearsUntilDeath = basicInfo.deathAge - basicInfo.currentAge;
  const years = Array.from(
    { length: yearsUntilDeath + 1 },
    (_, i) => basicInfo.startYear + i
  );

  useEffect(() => {
    if (Object.keys(cashFlow).length === 0) {
      initializeCashFlow();
    }
  }, []);

  // Calculate initial total assets
  const initialAssets = Object.values(assetsLiabilities.assets).reduce((sum, value) => sum + value, 0);
  const initialLiabilities = Object.values(assetsLiabilities.liabilities).reduce((sum, value) => sum + value, 0);
  const netInitialAssets = initialAssets - initialLiabilities;

  // Calculate yearly balances first
  const yearlyBalances = years.reduce((acc: { [year: number]: number }, year) => {
    const cf = cashFlow[year];
    if (!cf) {
      acc[year] = 0;
      return acc;
    }

    const income = cf.mainIncome + cf.sideIncome + cf.spouseIncome;
    const expenses = cf.livingExpense + cf.housingExpense + cf.educationExpense + cf.otherExpense;
    
    const yearLifeEvents = lifeEvents.filter(event => event.year === year);
    const lifeEventImpact = yearLifeEvents.reduce((sum, event) => {
      return sum + (event.type === 'income' ? event.amount : -event.amount);
    }, 0);

    acc[year] = income - expenses + lifeEventImpact;
    return acc;
  }, {});

  // Calculate investment assets and returns for each year
  const investmentData = years.reduce((acc: { 
    assets: { [year: number]: number },
    returns: { [year: number]: number }
  }, year, index) => {
    if (index === 0) {
      // 初年度は純資産＋その年の収支
      const firstYearTotal = netInitialAssets + yearlyBalances[year];
      acc.assets[year] = firstYearTotal;
      acc.returns[year] = Number((firstYearTotal * (parameters.investmentReturn / 100)).toFixed(1));
      return acc;
    }

    const prevYear = years[index - 1];
    const prevAssets = acc.assets[prevYear];
    const prevReturns = acc.returns[prevYear];
    
    // 前年の資産に運用収益を加え、さらに当年の収支を加算
    const currentYearAssets = prevAssets + prevReturns + yearlyBalances[year];
    acc.assets[year] = Number(currentYearAssets.toFixed(1));
    acc.returns[year] = Number((currentYearAssets * (parameters.investmentReturn / 100)).toFixed(1));

    return acc;
  }, { assets: {}, returns: {} });

  const handleExportCSV = () => {
    // ヘッダー行の作成
    const headers = [
      '年度',
      '年齢',
      'イベント',
      '主たる収入（万円）',
      '副業収入（万円）',
      '配偶者の収入（万円）',
      '運用資産（万円）',
      '運用収益（万円）',
      '生活費（万円）',
      '住居費（万円）',
      '教育費（万円）',
      'その他収支（万円）',
      '収支（万円）',
      '総資産（万円）'
    ];

    // データ行の作成
    const rows = years.map(year => {
      const cf = cashFlow[year] || {
        mainIncome: 0,
        sideIncome: 0,
        spouseIncome: 0,
        livingExpense: 0,
        housingExpense: 0,
        educationExpense: 0,
        otherExpense: 0
      };

      return [
        year,
        calculateAge(basicInfo.startYear, basicInfo.currentAge, year),
        getLifeEventDescription(year, basicInfo, basicInfo.children, basicInfo.plannedChildren, lifeEvents),
        cf.mainIncome,
        cf.sideIncome,
        cf.spouseIncome,
        investmentData.assets[year],
        investmentData.returns[year],
        cf.livingExpense,
        cf.housingExpense,
        cf.educationExpense,
        cf.otherExpense,
        yearlyBalances[year],
        investmentData.assets[year]
      ];
    });

    // CSVデータの作成
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // BOMを追加してExcelで文字化けを防ぐ
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `キャッシュフロー_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNext = () => {
    setCurrentStep(7);
  };

  const handleBack = () => {
    setCurrentStep(5);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">キャッシュフロー</h2>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          <Download className="h-4 w-4" />
          CSVエクスポート
        </button>
      </div>

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
                    readOnly
                    className="w-24 text-right border-gray-200 rounded-md bg-gray-50"
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
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-white">その他収支（万円）</td>
              {years.map(year => {
                const yearLifeEvents = lifeEvents.filter(event => event.year === year);
                const lifeEventImpact = yearLifeEvents.reduce((sum, event) => {
                  return sum + (event.type === 'income' ? event.amount : -event.amount);
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
                const balance = yearlyBalances[year];
                return (
                  <td key={year} className={`px-4 py-2 text-right text-sm ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {balance}万円
                  </td>
                );
              })}
            </tr>
            <tr className="bg-gray-50 font-medium">
              <td className="px-4 py-2 text-sm text-gray-900 sticky left-0 bg-gray-50">総資産</td>
              {years.map(year => {
                const assets = investmentData.assets[year];
                return (
                  <td key={year} className={`px-4 py-2 text-right text-sm ${assets >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {assets}万円
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