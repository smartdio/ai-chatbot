'use client';

import Form from 'next/form';
import { useTranslations } from 'next-intl';

import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
  showAgreement = false,
  agreementChecked = false,
  onAgreementChange,
  onAgreementClick,
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  showAgreement?: boolean;
  agreementChecked?: boolean;
  onAgreementChange?: (checked: boolean) => void;
  onAgreementClick?: () => void;
}) {
  const t = useTranslations('Auth');
  
  // 创建安全的翻译函数
  const safeT = (key: string) => {
    try {
      return t(key);
    } catch (error) {
      console.error(`Translation error for key: ${key}`, error);
      return key;
    }
  };
  
  return (
    <Form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          {safeT('email')}
        </Label>

        <Input
          id="email"
          name="email"
          className="bg-muted text-md md:text-sm"
          type="email"
          placeholder="user@acme.com"
          autoComplete="email"
          required
          autoFocus
          defaultValue={defaultEmail}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="text-zinc-600 font-normal dark:text-zinc-400"
        >
          {safeT('password')}
        </Label>

        <Input
          id="password"
          name="password"
          className="bg-muted text-md md:text-sm"
          type="password"
          required
        />
      </div>

      {showAgreement && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="agreement"
              checked={agreementChecked}
              onCheckedChange={onAgreementChange}
              className="mt-0.5"
            />
            <Label
              htmlFor="agreement"
              className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed cursor-pointer"
            >
              {safeT('agreeToTerms')}{' '}
              <button
                type="button"
                onClick={onAgreementClick}
                className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {safeT('userAgreement')}
              </button>
            </Label>
          </div>
        </div>
      )}

      {children}
    </Form>
  );
}
