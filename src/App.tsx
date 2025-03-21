import React from 'react';
import { useSimulatorStore } from './store/simulator';
import { Progress } from './components/ui/progress';
import { BasicInfoForm } from './components/BasicInfoForm';
import { IncomeForm } from './components/IncomeForm';
import { LifeEventForm } from './components/LifeEventForm';
import { CashFlowForm } from './components/CashFlowForm';
import { AssetsLiabilitiesForm } from './components/AssetsLiabilitiesForm';
import { ParametersForm } from './components/ParametersForm';
import { SimulationResults } from './components/SimulationResults';

const STEPS = [
  '基本情報',
  '収入',
  'ライフイベント',
  '資産・負債',
  'パラメータ',
  'キャッシュフロー',
  'シミュレーション結果'
];

function App() {
  const { currentStep } = useSimulatorStore();
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoForm />;
      case 2:
        return <IncomeForm />;
      case 3:
        return <LifeEventForm />;
      case 4:
        return <AssetsLiabilitiesForm />;
      case 5:
        return <ParametersForm />;
      case 6:
        return <CashFlowForm />;
      case 7:
        return <SimulationResults />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">ライフプランシミュレーター</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`text-sm ${
                  index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {index + 1}. {step}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}

export default App;