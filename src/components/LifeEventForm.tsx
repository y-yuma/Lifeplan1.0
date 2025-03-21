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
import { ArrowUpDown, Trash2 } from 'lucide-react';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 51 }, (_, i) => currentYear + i);

const lifeEventSchema = z.object({
  year: z.number(),
  description: z.string().min(1, "内容を入力してください"),
  type: z.enum(['income', 'expense']),
  category: z.string(),
  amount: z.number().min(0, "金額を入力してください"),
});

type LifeEventFormData = z.infer<typeof lifeEventSchema>;

const categories = {
  income: ['給与', '賞与', '副業', 'その他'],
  expense: ['生活費', '住居費', '教育費', '医療費', '旅行', 'その他']
};

export function LifeEventForm() {
  const { lifeEvents, addLifeEvent, removeLifeEvent, setCurrentStep } = useSimulatorStore();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<LifeEventFormData>({
    resolver: zodResolver(lifeEventSchema),
    defaultValues: {
      year: currentYear,
      type: 'expense',
      amount: 0,
      category: 'その他',
    },
  });

  const eventType = watch('type');

  const onSubmit = (data: LifeEventFormData) => {
    addLifeEvent(data);
    reset({
      year: currentYear,
      type: 'expense',
      amount: 0,
      description: '',
      category: 'その他',
    });
  };

  const handleNext = () => {
    setCurrentStep(4);
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">ライフイベント</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">年度</label>
            <Select
              defaultValue={currentYear.toString()}
              onValueChange={(value) => setValue('year', parseInt(value))}
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
            {errors.year && (
              <p className="text-sm text-red-500">{errors.year.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">イベント内容</label>
            <input
              type="text"
              {...register('description')}
              className="w-full rounded-md border border-gray-200 px-3 py-2"
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">種類</label>
            <Select
              defaultValue={eventType}
              onValueChange={(value) => {
                setValue('type', value as 'income' | 'expense');
                setValue('category', 'その他');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="種類を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">収入</SelectItem>
                <SelectItem value="expense">支出</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">カテゴリ</label>
            <Select
              defaultValue="その他"
              onValueChange={(value) => setValue('category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories[eventType].map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">金額（万円）</label>
            <input
              type="number"
              {...register('amount', { valueAsNumber: true })}
              className="w-full rounded-md border border-gray-200 px-3 py-2"
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              追加
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {lifeEvents.map((event, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <span className="text-sm">{event.year}年</span>
              <span className="text-sm">{event.description}</span>
              <span className={`px-2 py-1 rounded text-sm ${
                event.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {event.type === 'income' ? '収入' : '支出'}
              </span>
              <span className="text-sm">{event.category}</span>
              <span className="text-sm font-medium">{event.amount}万円</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const temp = [...lifeEvents];
                  if (index > 0) {
                    [temp[index], temp[index - 1]] = [temp[index - 1], temp[index]];
                    useSimulatorStore.setState({ lifeEvents: temp });
                  }
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeLifeEvent(index)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
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