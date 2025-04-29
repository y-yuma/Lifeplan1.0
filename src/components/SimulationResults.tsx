import React from 'react';
import { useSimulatorStore } from '@/store/simulator';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function SimulationResults() {
  const { 
    basicInfo, 
    cashFlow, 
    assetsLiabilities,
    parameters,
    lifeEvents,
    setCurrentStep 
  } = useSimulatorStore();
  
  const years = Array.from(
    { length: basicInfo.deathAge - basicInfo.currentAge + 1 },
    (_, i) => basicInfo.startYear + i
  );

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

  const data = {
    labels: years,
    datasets: [
      {
        label: '世帯収入',
        data: years.map(year => {
          const cf = cashFlow[year];
          if (!cf) return 0;
          return cf.mainIncome + cf.sideIncome + cf.spouseIncome;
        }),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: '生活費',
        data: years.map(year => {
          const cf = cashFlow[year];
          return cf ? cf.livingExpense : 0;
        }),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: '住居費',
        data: years.map(year => {
          const cf = cashFlow[year];
          return cf ? cf.housingExpense : 0;
        }),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: '教育費',
        data: years.map(year => {
          const cf = cashFlow[year];
          return cf ? cf.educationExpense : 0;
        }),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
      },
      {
        label: '総資産',
        data: years.map(year => investmentData.assets[year]),
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 10,
          padding: 10,
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
      title: {
        display: true,
        text: 'キャッシュフローシミュレーション',
        font: {
          size: window.innerWidth < 768 ? 14 : 16,
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '金額（万円）',
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
      x: {
        title: {
          display: true,
          text: '年齢',
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
        ticks: {
          callback: function(value: any) {
            const year = years[value];
            const age = basicInfo.currentAge + (year - basicInfo.startYear);
            return `${age}歳`;
          },
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  const getConditionSummary = () => {
    const conditions = [
      `${basicInfo.currentAge}歳`,
      `${basicInfo.occupation === 'company_employee' ? '会社員・公務員' : 
        basicInfo.occupation === 'self_employed' ? '自営業・フリーランス' :
        basicInfo.occupation === 'part_time_with_pension' ? 'パート（厚生年金あり）' :
        basicInfo.occupation === 'part_time_without_pension' ? 'パート（厚生年金なし）' :
        '専業主婦・夫'}`,
      `年収${cashFlow[basicInfo.startYear]?.mainIncome}万円`,
      `現在の総資産：${netInitialAssets}万円`,
      `資産運用利回り：${parameters.investmentReturn}%`,
      `配偶者の有無：${basicInfo.maritalStatus !== 'single' ? 'あり' : 'なし'}`,
      `結婚の予定：${basicInfo.maritalStatus === 'planning' ? 'あり' : 'なし'}`,
      `子どもの有無：${basicInfo.children.length > 0 ? 'あり' : 'なし'}`,
      `子どもを持つ予定：${basicInfo.plannedChildren.length > 0 ? 'あり' : 'なし'}`,
      `生活費：${basicInfo.monthlyLivingExpense}万円`,
      `インフレ率：${parameters.inflationRate}%`,
    ];

    return conditions.join(' | ');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">シミュレーション結果</h2>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium mb-2">設定条件</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          {getConditionSummary()}
        </p>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow">
        <div className="h-[50vh] md:h-[60vh]">
          <Line options={options} data={data} />
        </div>
      </div>

      <div className="flex justify-between space-x-4">
        <button
          type="button"
          onClick={() => setCurrentStep(6)}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          戻る
        </button>
      </div>
    </div>
  );
}