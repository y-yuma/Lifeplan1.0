import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSimulatorStore } from '@/store/simulator';
import { calculatePension } from '@/lib/calculations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ages = Array.from({ length: 121 }, (_, i) => i);

const sideIncomeSchema = z.object({
  type: z.enum(['one-time', 'recurring']),
  oneTime: z.object({
    age: z.number().min(0).max(120),
    amount: z.number().min(0),
    description: z.string(),
  }).optional(),
  recurring: z.object({
    monthlyAmount: z.number().min(0),
    startAge: z.number().min(0).max(120),
    endAge: z.number().min(0).max(120),
    description: z.string(),
  }).optional(),
});

const incomeInfoSchema = z.object({
  annualIncome: z.number().min(0),
  raiseRate: z.number().min(0),
  severancePay: z.number().min(0),
  workStartAge: z.number().min(0).max(120),
  workEndAge: z.number().min(0).max(120),
  pensionStartAge: z.number().min(0).max(120),
  pensionAmount: z.number().min(0),
  sideIncomes: z.array(sideIncomeSchema),
  spouse: z.object({
    annualIncome: z.number().min(0),
    severancePay: z.number().min(0),
    workStartAge: z.number().min(0).max(120),
    workEndAge: z.number().min(0).max(120),
    pensionAmount: z.number().min(0),
  }).optional(),
});

type IncomeFormData = z.infer<typeof incomeInfoSchema>;

export function IncomeForm() {
  const { incomeInfo, setIncomeInfo, basicInfo, setCurrentStep } = useSimulatorStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeInfoSchema),
    defaultValues: {
      ...incomeInfo,
      pensionAmount: Number((calculatePension(
        incomeInfo.annualIncome,
        incomeInfo.workStartAge,
        incomeInfo.workEndAge,
        incomeInfo.pensionStartAge,
        basicInfo.occupation
      ) / 12).toFixed(1)), // Convert annual to monthly and format to 1 decimal place
    },
  });

  const sideIncomes = watch('sideIncomes') || [];
  const showSpouseInfo = basicInfo.maritalStatus !== 'single';
  const annualIncome = watch('annualIncome');
  const workStartAge = watch('workStartAge');
  const workEndAge = watch('workEndAge');
  const pensionStartAge = watch('pensionStartAge');

  // Spouse-related watched values
  const spouseAnnualIncome = watch('spouse.annualIncome');
  const spouseWorkStartAge = watch('spouse.workStartAge');
  const spouseWorkEndAge = watch('spouse.workEndAge');

  // Update pension amount when relevant fields change
  useEffect(() => {
    if (annualIncome !== undefined && workStartAge !== undefined && workEndAge !== undefined && pensionStartAge !== undefined) {
      const annualPension = calculatePension(annualIncome, workStartAge, workEndAge, pensionStartAge, basicInfo.occupation);
      const monthlyPension = Number((annualPension / 12).toFixed(1)); // Format to 1 decimal place
      setValue('pensionAmount', monthlyPension);
    }
  }, [annualIncome, workStartAge, workEndAge, pensionStartAge, basicInfo.occupation, setValue]);

  // Update spouse's pension amount when relevant fields change
  useEffect(() => {
    if (showSpouseInfo && spouseAnnualIncome !== undefined && spouseWorkStartAge !== undefined && spouseWorkEndAge !== undefined) {
      const spouseAnnualPension = calculatePension(
        spouseAnnualIncome,
        spouseWorkStartAge,
        spouseWorkEndAge,
        pensionStartAge,
        basicInfo.spouseInfo?.occupation || 'company_employee'
      );
      const spouseMonthlyPension = Number((spouseAnnualPension / 12).toFixed(1)); // Format to 1 decimal place
      setValue('spouse.pensionAmount', spouseMonthlyPension);
    }
  }, [showSpouseInfo, spouseAnnualIncome, spouseWorkStartAge, spouseWorkEndAge, pensionStartAge, basicInfo.spouseInfo?.occupation, setValue]);

  const onSubmit = (data: IncomeFormData) => {
    setIncomeInfo(data);
    setCurrentStep(3);
  };

  const addSideIncome = () => {
    setValue('sideIncomes', [
      ...sideIncomes,
      {
        type: 'one-time',
        oneTime: {
          age: 30,
          amount: 0,
          description: '',
        },
      },
    ]);
  };

  const removeSideIncome = (index: number) => {
    setValue(
      'sideIncomes',
      sideIncomes.filter((_, i) => i !== index)
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">収入情報</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">年収（万円）</label>
            <input
              type="number"
              {...register('annualIncome', { valueAsNumber: true })}
              className="w-full rounded-md border border-gray-200 px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">昇給率（%）</label>
            <input
              type="number"
              step="0.1"
              {...register('raiseRate', { valueAsNumber: true })}
              className="w-full rounded-md border border-gray-200 px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">退職金（万円）</label>
            <input
              type="number"
              {...register('severancePay', { valueAsNumber: true })}
              className="w-full rounded-md border border-gray-200 px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">就業開始年齢</label>
            <Select
              defaultValue={incomeInfo.workStartAge?.toString()}
              onValueChange={(value) => setValue('workStartAge', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="年齢を選択" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {ages.map((age) => (
                  <SelectItem key={age} value={age.toString()}>
                    {age}歳
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">就業終了年齢</label>
            <Select
              defaultValue={incomeInfo.workEndAge?.toString()}
              onValueChange={(value) => setValue('workEndAge', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="年齢を選択" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {ages.map((age) => (
                  <SelectItem key={age} value={age.toString()}>
                    {age}歳
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">年金受給開始年齢</label>
            <Select
              defaultValue={incomeInfo.pensionStartAge?.toString()}
              onValueChange={(value) => setValue('pensionStartAge', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="年齢を選択" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {ages.map((age) => (
                  <SelectItem key={age} value={age.toString()}>
                    {age}歳
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">年金受給額（万円/月）</label>
            <input
              type="number"
              step="0.1"
              {...register('pensionAmount', { valueAsNumber: true })}
              className="w-full rounded-md border border-gray-200 px-3 py-2 bg-gray-50"
              readOnly
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">副業収入</h3>
            <button
              type="button"
              onClick={addSideIncome}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              副業を追加
            </button>
          </div>

          {sideIncomes.map((income, index) => (
            <div key={index} className="space-y-4 border-l-2 border-gray-200 pl-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <label className="text-sm font-medium">収入タイプ</label>
                  <Select
                    defaultValue={income.type}
                    onValueChange={(value) => {
                      setValue(`sideIncomes.${index}.type`, value as 'one-time' | 'recurring');
                      if (value === 'one-time') {
                        setValue(`sideIncomes.${index}.oneTime`, {
                          age: 30,
                          amount: 0,
                          description: '',
                        });
                        setValue(`sideIncomes.${index}.recurring`, undefined);
                      } else {
                        setValue(`sideIncomes.${index}.recurring`, {
                          monthlyAmount: 0,
                          startAge: 30,
                          endAge: 60,
                          description: '',
                        });
                        setValue(`sideIncomes.${index}.oneTime`, undefined);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="タイプを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">単発</SelectItem>
                      <SelectItem value="recurring">継続</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="button"
                  onClick={() => removeSideIncome(index)}
                  className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  削除
                </button>
              </div>

              {income.type === 'one-time' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">年齢</label>
                    <Select
                      defaultValue={income.oneTime?.age?.toString()}
                      onValueChange={(value) =>
                        setValue(`sideIncomes.${index}.oneTime.age`, parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="年齢を選択" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {ages.map((age) => (
                          <SelectItem key={age} value={age.toString()}>
                            {age}歳
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">報酬金額（万円）</label>
                    <input
                      type="number"
                      {...register(`sideIncomes.${index}.oneTime.amount` as const, {
                        valueAsNumber: true,
                      })}
                      className="w-full rounded-md border border-gray-200 px-3 py-2"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">内容</label>
                    <input
                      type="text"
                      {...register(`sideIncomes.${index}.oneTime.description` as const)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2"
                    />
                  </div>
                </div>
              )}

              {income.type === 'recurring' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">月額報酬（万円）</label>
                    <input
                      type="number"
                      {...register(`sideIncomes.${index}.recurring.monthlyAmount` as const, {
                        valueAsNumber: true,
                      })}
                      className="w-full rounded-md border border-gray-200 px-3 py-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">開始年齢</label>
                    <Select
                      defaultValue={income.recurring?.startAge?.toString()}
                      onValueChange={(value) =>
                        setValue(`sideIncomes.${index}.recurring.startAge`, parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="年齢を選択" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {ages.map((age) => (
                          <SelectItem key={age} value={age.toString()}>
                            {age}歳
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">終了年齢</label>
                    <Select
                      defaultValue={income.recurring?.endAge?.toString()}
                      onValueChange={(value) =>
                        setValue(`sideIncomes.${index}.recurring.endAge`, parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="年齢を選択" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {ages.map((age) => (
                          <SelectItem key={age} value={age.toString()}>
                            {age}歳
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">内容</label>
                    <input
                      type="text"
                      {...register(`sideIncomes.${index}.recurring.description` as const)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {showSpouseInfo && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">配偶者の収入情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">年収（万円）</label>
                <input
                  type="number"
                  {...register('spouse.annualIncome', { valueAsNumber: true })}
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">退職金（万円）</label>
                <input
                  type="number"
                  {...register('spouse.severancePay', { valueAsNumber: true })}
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">就業開始年齢</label>
                <Select
                  defaultValue={incomeInfo.spouse?.workStartAge?.toString()}
                  onValueChange={(value) => setValue('spouse.workStartAge', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="年齢を選択" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {ages.map((age) => (
                      <SelectItem key={age} value={age.toString()}>
                        {age}歳
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">就業終了年齢</label>
                <Select
                  defaultValue={incomeInfo.spouse?.workEndAge?.toString()}
                  onValueChange={(value) => setValue('spouse.workEndAge', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="年齢を選択" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {ages.map((age) => (
                      <SelectItem key={age} value={age.toString()}>
                        {age}歳
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">年金受給額（万円/月）</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('spouse.pensionAmount', { valueAsNumber: true })}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 bg-gray-50"
                  readOnly
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between space-x-4">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
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
  );
}