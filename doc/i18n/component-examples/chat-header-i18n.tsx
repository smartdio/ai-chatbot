/**
 * 这是服务器组件国际化示例
 * 
 * 原始文件：components/chat-header.tsx
 */

// 服务器组件中使用 getTranslations
import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/language-switcher';

interface ChatHeaderProps {
  chatId: string;
  title: string;
  isPublic: boolean;
}

export async function ChatHeader({ chatId, title, isPublic }: ChatHeaderProps) {
  // 在服务器组件中使用 getTranslations
  const t = await getTranslations('ChatHeader');
  
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-semibold">{title || t('untitledChat')}</h1>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
          {isPublic ? t('public') : t('private')}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* 集成语言切换器 */}
        <LanguageSwitcher />
        
        {/* 其他操作按钮 */}
        <button
          aria-label={t('shareChat')}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {/* 图标 */}
          <span className="sr-only">{t('shareChat')}</span>
        </button>
        
        <button
          aria-label={t('settings')}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {/* 图标 */}
          <span className="sr-only">{t('settings')}</span>
        </button>
      </div>
    </div>
  );
} 