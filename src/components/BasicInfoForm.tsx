import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSimulatorStore } from '@/store/simulator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 251 }, (_, i) => 1900 + i);
const ages = Array.from({ length: 121 }, (_, i) => i);
const yearsFromNow = Array.from({ length: 31 }, (_, i) => i);

const educationTypes = ['公立', '私立', '行かない'] as const;
const universityTypes = ['公立大学（文系）', '公立大学（理系）', '私立大学（文系）', '私立大学（理系）', '行かない'] as const;

const basicInfoSchema = z.object({
  currentAge: z.number().min(0).max(120),
  startYear: z.number().min(1900).max(2150),
  deathAge: z.number().min(0).max(120),
  gender: z.enum(['male', 'female']),
  monthlyLivingExpense: z.number().min(0),
  occupation: z.enum(['company_employee', 'part_time_with_pension', 'part_time_without_pension', 'self_employed', 'homemaker']),
  maritalStatus: z.enum(['single', 'married', 'planning']),
  housingInfo: z.object({
    type: z.enum(['rent', 'own']),
    rent: z.object({
      monthlyRent: z.number().min(0),
      annualIncreaseRate: z.number().min(0),
    }).optional(),
    own: z.object({
      purchaseYear: z.number().min(1900).max(2150),
      purchasePrice: z.number().min(0),
      loanAmount: z.number().min(0),
      interestRate: z.number().min(0),
      loanTermYears: z.number().min(1).max(50),
      maintenanceCostRate: z.number().min(0).max(100),
    }).optional(),
  }),
  spouseInfo: z.object({
    age: z.number().min(0).max(120).optional(),
    currentAge: z.number().min(0).max(120).optional(),
    marriageAge: z.number().min(0).max(120).optional(),
    occupation: z.enum(['company_employee', 'part_time_with_pension', 'part_time_without_pension', 'self_employed', 'homemaker']).optional(),
    additionalExpense: z.number().min(0).optional(),
  }).optional(),
  children: z.array(
    z.object({
      currentAge: z.number().min(0).max(120),
      educationPlan: z.object({
        nursery: z.enum(educationTypes),
        preschool: z.enum(educationTypes),
        elementary: z.enum(educationTypes),
        juniorHigh: z.enum(educationTypes),
        highSchool: z.enum(educationTypes),
        university: z.enum(universityTypes),
      }),
    })
  ),
  plannedChildren: z.array(
    z.object({
      yearsFromNow: z.number().min(0).max(30),
      educationPlan: z.object({
        nursery: z.enum(educationTypes),
        preschool: z.enum(educationTypes),
        elementary: z.enum(educationTypes),
        juniorHigh: z.enum(educationTypes),
        highSchool: z.enum(educationTypes),
        university: z.enum(universityTypes),
      }),
    })
  ),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

export function BasicInfoForm() {
  const { basicInfo, setBasicInfo, setCurrentStep } = useSimulatorStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      ...basicInfo,
      maritalStatus: basicInfo.maritalStatus || 'single',
      housingInfo: basicInfo.housingInfo || {
        type: 'rent',
        rent: {
          monthlyRent: 0,
          annualIncreaseRate: 0,
        },
      },
    },
  });

  const maritalStatus = watch('maritalStatus');
  const children = watch('children') || [];
  const plannedChildren = watch('plannedChildren') || [];

  const onSubmit = (data: BasicInfoFormData) => {
    setBasicInfo(data);
    setCurrentStep(2);
  };

  const handleMaritalStatusChange = (value: string) => {
    setValue('maritalStatus', value as 'single' | 'married' | 'planning');
    setValue('spouseInfo', undefined);
  };

  const addChild = () => {
    setValue('children', [
      ...children,
      {
        currentAge: 0,
        educationPlan: {
          nursery: '公立',
          preschool: '公立',
          elementary: '公立',
          juniorHigh: '公立',
          highSchool: '公立',
          university: '公立大学（文系）',
        },
      },
    ]);
  };

  const removeChild = (index: number) => {
    setValue(
      'children',
      children.filter((_, i) => i !== index)
    );
  };

  const addPlannedChild = () => {
    setValue('plannedChildren', [
      ...plannedChildren,
      {
        yearsFromNow: 0,
        educationPlan: {
          nursery: '公立',
          preschool: '公立',
          elementary: '公立',
          juniorHigh: '公立',
          highSchool: '公立',
          university: '公立大学（文系）',
        },
      },
    ]);
  };

  const removePlannedChild = (index: number) => {
    setValue(
      'plannedChildren',
      plannedChildren.filter((_, i) => i !== index)
    );
  };

  const renderEducationSelect = (level: string, index: number, isPlannedChild: boolean = false) => {
    const path = isPlannedChild ? `plannedChildren.${index}.educationPlan.${level}` : `children.${index}.educationPlan.${level}`;
    const types = level === 'university' ? universityTypes : educationTypes;
    const labels = {
      nursery: '保育所',
      preschool: '幼稚園',
      elementary: '小学校',
      juniorHigh: '中学校',
      highSchool: '高校',
      university: '大学',
    };

    return (
      <div key={level} className="space-y-2">
        <label className="text-sm font-medium">
          {labels[level as keyof typeof labels]}
        </label>
        <Select
          defaultValue={isPlannedChild ? plannedChildren[index]?.educationPlan[level] : children[index]?.educationPlan[level]}
          onValueChange={(value) => setValue(path, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="種別を選択" />
          </SelectTrigger>
          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">基本個人情報</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">現在の年齢</label>
            <Select 
              defaultValue={basicInfo.currentAge?.toString()}
              onValueChange={(value) => setValue('currentAge', parseInt(value))}
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
            {errors.currentAge && (
              <p className="text-sm text-red-500">{errors.currentAge.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">開始年度</label>
            <Select
              defaultValue={basicInfo.startYear?.toString()}
              onValueChange={(value) => setValue('startYear', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="年度を選択" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.startYear && (
              <p className="text-sm text-red-500">{errors.startYear.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">死亡想定年齢</label>
            <Select
              defaultValue={basicInfo.deathAge?.toString()}
              onValueChange={(value) => setValue('deathAge', parseInt(value))}
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
            {errors.deathAge && (
              <p className="text-sm text-red-500">{errors.deathAge.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">性別</label>
            <Select
              defaultValue={basicInfo.gender}
              onValueChange={(value) => setValue('gender', value as 'male' | 'female')}
            >
              <SelectTrigger>
                <SelectValue placeholder="性別を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">男性</SelectItem>
                <SelectItem value="female">女性</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-red-500">{errors.gender.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">月額生活費（万円）</label>
          <input
            type="number"
            defaultValue={basicInfo.monthlyLivingExpense}
            onChange={(e) => setValue('monthlyLivingExpense', parseFloat(e.target.value))}
            className="w-full rounded-md border border-gray-200 px-3 py-2"
          />
          {errors.monthlyLivingExpense && (
            <p className="text-sm text-red-500">{errors.monthlyLivingExpense.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">職業</label>
          <Select
            defaultValue={basicInfo.occupation}
            onValueChange={(value) => setValue('occupation', value as BasicInfoFormData['occupation'])}
          >
            <SelectTrigger>
              <SelectValue placeholder="職業を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company_employee">会社員・公務員（契約社員含む）</SelectItem>
              <SelectItem value="part_time_with_pension">パート・アルバイト（厚生年金あり）</SelectItem>
              <SelectItem value="part_time_without_pension">パート・アルバイト（厚生年金なし）</SelectItem>
              <SelectItem value="self_employed">自営業・フリーランス</SelectItem>
              <SelectItem value="homemaker">専業主婦・夫（収入なし）</SelectItem>
            </SelectContent>
          </Select>
          {errors.occupation && (
            <p className="text-sm text-red-500">職業を選択してください</p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">住居費設定</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  checked={watch('housingInfo.type') === 'rent'}
                  onChange={() => setValue('housingInfo', {
                    type: 'rent',
                    rent: {
                      monthlyRent: 0,
                      annualIncreaseRate: 0,
                    }
                  })}
                />
                <span className="ml-2">賃貸</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  checked={watch('housingInfo.type') === 'own'}
                  onChange={() => setValue('housingInfo', {
                    type: 'own',
                    own: {
                      purchaseYear: watch('startYear'),
                      purchasePrice: 0,
                      loanAmount: 0,
                      interestRate: 0,
                      loanTermYears: 35,
                      maintenanceCostRate: 1,
                    }
                  })}
                />
                <span className="ml-2">住宅購入／ローン</span>
              </label>
            </div>

            {watch('housingInfo.type') === 'rent' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">初期賃料（万円/月）</label>
                  <input
                    type="number"
                    {...register('housingInfo.rent.monthlyRent', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">年間上昇率（%）</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('housingInfo.rent.annualIncreaseRate', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                  />
                </div>
              </div>
            )}

            {watch('housingInfo.type') === 'own' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">購入予定年</label>
                  <input
                    type="number"
                    {...register('housingInfo.own.purchaseYear', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">購入金額（万円）</label>
                  <input
                    type="number"
                    {...register('housingInfo.own.purchasePrice', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">借入額（万円）</label>
                  <input
                    type="number"
                    {...register('housingInfo.own.loanAmount', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ローン金利（%）</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('housingInfo.own.interestRate', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">返済期間（年）</label>
                  <input
                    type="number"
                    {...register('housingInfo.own.loanTermYears', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">住宅維持費率（%）</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('housingInfo.own.maintenanceCostRate', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-200 px-3 py-2"
                  />
                  <p className="text-xs text-gray-500">購入金額に対する年間の維持費の割合</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">配偶者情報</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">婚姻状況</label>
            <Select
              defaultValue={maritalStatus}
              onValueChange={handleMaritalStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="状況を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">未婚</SelectItem>
                <SelectItem value="married">既婚</SelectItem>
                <SelectItem value="planning">結婚予定</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {maritalStatus === 'married' && (
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">配偶者の現在の年齢</label>
                <Select
                  defaultValue={basicInfo.spouseInfo?.currentAge?.toString()}
                  onValueChange={(value) => setValue('spouseInfo.currentAge', parseInt(value))}
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
                <label className="text-sm font-medium">配偶者の職業</label>
                <Select
                  defaultValue={basicInfo.spouseInfo?.occupation}
                  onValueChange={(value) => setValue('spouseInfo.occupation', value as BasicInfoFormData['occupation'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="職業を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_employee">会社員・公務員（契約社員含む）</SelectItem>
                    <SelectItem value="part_time_with_pension">パート・アルバイト（厚生年金あり）</SelectItem>
                    <SelectItem value="part_time_without_pension">パート・アルバイト（厚生年金なし）</SelectItem>
                    <SelectItem value="self_employed">自営業・フリーランス</SelectItem>
                    <SelectItem value="homemaker">専業主婦・夫（収入なし）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {maritalStatus === 'planning' && (
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">結婚予定年齢</label>
                <Select
                  defaultValue={basicInfo.spouseInfo?.marriageAge?.toString()}
                  onValueChange={(value) => setValue('spouseInfo.marriageAge', parseInt(value))}
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
                <label className="text-sm font-medium">結婚時配偶者の年齢</label>
                <Select
                  defaultValue={basicInfo.spouseInfo?.age?.toString()}
                  onValueChange={(value) => setValue('spouseInfo.age', parseInt(value))}
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
                <label className="text-sm font-medium">配偶者の職業</label>
                <Select
                  defaultValue={basicInfo.spouseInfo?.occupation}
                  onValueChange={(value) => setValue('spouseInfo.occupation', value as BasicInfoFormData['occupation'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="職業を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_employee">会社員・公務員（契約社員含む）</SelectItem>
                    <SelectItem value="part_time_with_pension">パート・アルバイト（厚生年金あり）</SelectItem>
                    <SelectItem value="part_time_without_pension">パート・アルバイト（厚生年金なし）</SelectItem>
                    <SelectItem value="self_employed">自営業・フリーランス</SelectItem>
                    <SelectItem value="homemaker">専業主婦・夫（収入なし）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">結婚による生活費の増加（万円）</label>
                <input
                  type="number"
                  defaultValue={basicInfo.spouseInfo?.additionalExpense}
                  onChange={(e) => setValue('spouseInfo.additionalExpense', parseFloat(e.target.value))}
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">子ども情報</h3>
            <button
              type="button"
              onClick={addChild}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              子どもを追加
            </button>
          </div>

          {children.map((child, index) => (
            <div key={index} className="space-y-4 border-l-2 border-gray-200 pl-4">
              <div className="flex justify-between items-center">
                <h4 className="text-md font-medium">第{index + 1}子</h4>
                <button
                  type="button"
                  onClick={() => removeChild(index)}
                  className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  削除
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">現在の年齢</label>
                <Select
                  defaultValue={child.currentAge?.toString()}
                  onValueChange={(value) =>
                    setValue(`children.${index}.currentAge`, parseInt(value))
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

              <div className="space-y-4">
                <h5 className="text-sm font-medium">教育プラン</h5>
                {['nursery', 'preschool', 'elementary', 'juniorHigh', 'highSchool', 'university'].map(
                  (level) => renderEducationSelect(level, index)
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">出生予定の子ども</h3>
            <button
              type="button"
              onClick={addPlannedChild}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              出生予定を追加
            </button>
          </div>

          {plannedChildren.map((child, index) => (
            <div key={index} className="space-y-4 border-l-2 border-gray-200 pl-4">
              <div className="flex justify-between items-center">
                <h4 className="text-md font-medium">出生予定 {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removePlannedChild(index)}
                  className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  削除
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">出生予定時期（何年後）</label>
                <Select
                  defaultValue={child.yearsFromNow?.toString()}
                  onValueChange={(value) =>
                    setValue(`plannedChildren.${index}.yearsFromNow`, parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="年数を選択" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {yearsFromNow.map((years) => (
                      <SelectItem key={years} value={years.toString()}>
                        {years}年後
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h5 className="text-sm font-medium">教育プラン</h5>
                {['nursery', 'preschool', 'elementary', 'juniorHigh', 'highSchool', 'university'].map(
                  (level) => renderEducationSelect(level, index, true)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
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