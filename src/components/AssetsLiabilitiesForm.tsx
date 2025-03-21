import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSimulatorStore } from '@/store/simulator';

const assetsLiabilitiesSchema = z.object({
  assets: z.object({
    cash: z.number().min(0),
    savings: z.number().min(0),
    stocks: z.number().min(0),
    investmentTrust: z.number().min(0),
    realEstate: z.number().min(0),
  }),
  liabilities: z.object({
    loans: z.number().min(0),
    creditCards: z.number().min(0),
  }),
});

type AssetsLiabilitiesFormData = z.infer<typeof assetsLiabilitiesSchema>;

export function AssetsLiabilitiesForm() {
  const { assetsLiabilities, setAssetsLiabilities, setCurrentStep } = useSimulatorStore();
  const { register, handleSubmit, watch } = useForm<AssetsLiabilitiesFormData>({
    resolver: zodResolver(assetsLiabilitiesSchema),
    defaultValues: assetsLiabilities,
  });

  const values = watch();
  const totalAssets = Object.values(values?.assets || {}).reduce((sum, value) => sum + (value || 0), 0);
  const totalLiabilities = Object.values(values?.liabilities || {}).reduce((sum, value) => sum + (value || 0), 0);

  const onSubmit = (data: AssetsLiabilitiesFormData) => {
    setAssetsLiabilities(data);
    setCurrentStep(5);
  };

  const handleBack = () => {
    setCurrentStep(3);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">資産・負債情報</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">資産</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">現金（万円）</label>
              <input
                type="number"
                {...register('assets.cash', { valueAsNumber: true })}
                className="w-full rounded-md border border-gray-200 px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">預金（万円）</label>
              <input
                type="number"
                {...register('assets.savings', { valueAsNumber: true })}
                className="w-full rounded-md border border-gray-200 px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">株式（万円）</label>
              <input
                type="number"
                {...register('assets.stocks', { valueAsNumber: true })}
                className="w-full rounded-md border border-gray-200 px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">投資信託（万円）</label>
              <input
                type="number"
                {...register('assets.investmentTrust', { valueAsNumber: true })}
                className="w-full rounded-md border border-gray-200 px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">不動産（万円）</label>
              <input
                type="number"
                {...register('assets.realEstate', { valueAsNumber: true })}
                className="w-full rounded-md border border-gray-200 px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">合計資産</label>
              <div className="w-full rounded-md border border-gray-200 px-3 py-2 bg-gray-50">
                {totalAssets}万円
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold">負債</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">ローン残高（万円）</label>
              <input
                type="number"
                {...register('liabilities.loans', { valueAsNumber: true })}
                className="w-full rounded-md border border-gray-200 px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">クレジットカード残高（万円）</label>
              <input
                type="number"
                {...register('liabilities.creditCards', { valueAsNumber: true })}
                className="w-full rounded-md border border-gray-200 px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">合計負債</label>
              <div className="w-full rounded-md border border-gray-200 px-3 py-2 bg-gray-50">
                {totalLiabilities}万円
              </div>
            </div>
          </div>
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
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            次へ
          </button>
        </div>
      </form>
    </div>
  );
}