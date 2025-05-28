'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { PATH_CONFIG } from '@/lib/path-config';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { login, type LoginActionState } from '../actions';

export default function Page() {
  const router = useRouter();
  
  // 添加翻译hooks
  const tAuth = useTranslations('Auth');
  const tErrors = useTranslations('Errors');
  
  // 创建安全的翻译函数
  const safeT = (namespace: 'Auth' | 'Errors', key: string, params?: Record<string, string>) => {
    try {
      return namespace === 'Auth' ? tAuth(key, params) : tErrors(key, params);
    } catch (error) {
      console.error(`Translation error for key: ${key} in ${namespace}`, error);
      return key;
    }
  };

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: safeT('Auth', 'invalidCredentials'),
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: safeT('Auth', 'validationFailed'),
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100/70 to-blue-50 dark:from-blue-950/30 dark:via-blue-900/20 dark:to-blue-950/30 backdrop-blur-sm">
      <div className="w-full max-w-md flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 mb-3">
              <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" style={{width: '100%', height: '100%', fillRule: 'evenodd', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2}}>
                <g>
                  <path d="M85.142,80.701c-0.745,0.058 -1.497,0.088 -2.257,0.088l-26.378,0l0.568,5.122c0.028,0.252 0.042,0.505 0.042,0.758c0,8.973 -4.078,17.294 -9.326,22.518c-4.205,4.185 -9.201,6.38 -13.635,6.38l-1.648,0c-3.958,0 -7.637,-1.771 -10.499,-5.062c-3.115,-3.583 -5.256,-9.231 -5.256,-15.391l-0,-54.759c-0,-15.654 12.708,-28.363 28.362,-28.363l37.77,-0c15.654,-0 28.362,12.709 28.362,28.363l0,12.072c0,8.202 -3.489,15.596 -9.063,20.777c5.331,4.233 8.751,10.769 8.751,18.099c0,12.749 -10.351,23.1 -23.1,23.1c-0.254,0 -0.507,-0.014 -0.758,-0.042c-0,0 -15.223,-0.49 -19.091,-0.443c-2.02,0.025 -2.248,-0.455 -5.319,1.294c-2.232,1.271 -5.82,2.553 -7.677,0.984c-2.902,-2.452 -2.229,-6.512 0.223,-9.414c-0,-0 4.175,-6.527 12.606,-6.63c3.811,-0.046 17.958,0.226 20.334,0.479c5.004,-0.168 9.015,-4.284 9.015,-9.328c0,-4.242 -3.38,-8.117 -7.45,-9.353c-0.873,-0.265 -1.948,-0.739 -2.839,-0.921c-0.442,-0.091 -1.105,-0.214 -1.737,-0.328Zm-53.17,20.215c0.758,0.892 1.409,0.989 2.184,0.898c1.152,-0.136 2.649,-1.098 3.933,-2.375c2.907,-2.894 5.169,-7.469 5.271,-12.422l-1.369,-12.346c-0.216,-1.944 0.407,-3.888 1.711,-5.345c1.305,-1.457 3.168,-2.29 5.124,-2.29l34.059,-0c8.063,-0 14.609,-6.546 14.609,-14.609l-0,-12.072c-0,-8.063 -6.546,-14.61 -14.609,-14.61l-37.77,0c-8.063,0 -14.609,6.547 -14.609,14.61l0,54.759c0,2.199 0.301,4.433 1.466,5.802Z" style={{fill: '#0041a2'}}/>
                  <ellipse cx="51.111" cy="45.475" rx="5.179" ry="6.633" style={{fill: '#0041a2'}}/>
                  <ellipse cx="83.419" cy="45.475" rx="5.179" ry="6.633" style={{fill: '#0041a2'}}/>
                </g>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              PsyBot {safeT('Auth', 'signIn')}
            </h2>
          </div>
          <p className="text-sm text-blue-700/80 dark:text-blue-300/80">
            {safeT('Auth', 'useEmailPassword')}
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>
            {safeT('Auth', 'signIn')}
          </SubmitButton>
          <p className="text-center text-sm text-blue-700/80 mt-4 dark:text-blue-300/80">
            {safeT('Auth', 'dontHaveAccount')}{' '}
            <Link
              href={PATH_CONFIG.register}
              className="font-semibold text-blue-800 hover:text-blue-900 hover:underline dark:text-blue-200 dark:hover:text-blue-100"
            >
              {safeT('Auth', 'signUp')}
            </Link>
            {' ' + safeT('Auth', 'signUpForFree')}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
