'use client';

import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';

import { LoaderIcon } from '@/components/icons';

import { Button } from './ui/button';

export function SubmitButton({
  children,
  isSuccessful,
}: {
  children: React.ReactNode;
  isSuccessful: boolean;
}) {
  const { pending } = useFormStatus();
  
  // 添加翻译hooks
  const t = useTranslations('Form');
  
  // 创建安全的翻译函数
  const safeT = (key: string, params?: Record<string, string>) => {
    try {
      return t(key, params);
    } catch (error) {
      console.error(`Translation error for key: ${key}`, error);
      return key;
    }
  };

  return (
    <Button
      type={pending ? 'button' : 'submit'}
      aria-disabled={pending || isSuccessful}
      disabled={pending || isSuccessful}
      className="relative"
    >
      {children}

      {(pending || isSuccessful) && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {pending || isSuccessful ? safeT('loading') : safeT('submitForm')}
      </output>
    </Button>
  );
}
