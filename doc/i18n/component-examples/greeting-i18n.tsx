/**
 * 这是 greeting.tsx 的国际化示例版本
 * 
 * 原始文件路径：components/greeting.tsx
 */

import { useTranslations } from 'next-intl';

interface GreetingProps {
  isLoggedIn: boolean;
  userName?: string;
  isNewChat: boolean;
}

export default function Greeting({ isLoggedIn, userName, isNewChat }: GreetingProps) {
  // 使用 next-intl 的 useTranslations hook 获取翻译函数
  const t = useTranslations('Greeting');
  
  // 根据用户登录状态和是否是新聊天来显示不同的问候语
  if (!isLoggedIn) {
    return (
      <div className="mb-6 mt-2">
        <h1 className="text-3xl font-semibold">{t('welcomeGuest')}</h1>
        <p className="mt-2 text-secondary">{t('guestMessage')}</p>
      </div>
    );
  }

  if (isNewChat) {
    return (
      <div className="mb-6 mt-2">
        <h1 className="text-3xl font-semibold">
          {t('helloUser', { name: userName })}
        </h1>
        <p className="mt-2 text-secondary">{t('newChatMessage')}</p>
      </div>
    );
  }

  return (
    <div className="mb-6 mt-2">
      <h1 className="text-3xl font-semibold">
        {t('welcomeBack', { name: userName })}
      </h1>
      <p className="mt-2 text-secondary">{t('continueMessage')}</p>
    </div>
  );
} 