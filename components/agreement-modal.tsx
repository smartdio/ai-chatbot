'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgreementModal({ isOpen, onClose }: AgreementModalProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const tAuth = useTranslations('Auth');
  const locale = useLocale();

  // 创建安全的翻译函数
  const safeT = (key: string) => {
    try {
      return tAuth(key);
    } catch (error) {
      console.error(`Translation error for key: ${key}`, error);
      return key;
    }
  };

  useEffect(() => {
    if (isOpen && !content) {
      fetchAgreementContent();
    }
  }, [isOpen, locale]);

  const fetchAgreementContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/agreement?locale=${locale}`);
      if (!response.ok) {
        throw new Error('Failed to fetch agreement');
      }
      const data = await response.json();
      setContent(data.content);
    } catch (err) {
      setError('Failed to load agreement content');
      console.error('Error fetching agreement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {safeT('userAgreement')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {error && (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          
          {content && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div 
                className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white">
            {safeT('close')}
          </Button>
        </div>
      </div>
    </div>
  );
} 