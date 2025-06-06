import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'zh';
  
  try {
    // 根据语言选择协议文件
    const fileName = locale === 'zh' ? 'aggrement.md' : 'aggrement_en.md';
    const filePath = join(process.cwd(), 'public', fileName);
    
    // 读取文件内容
    const content = await readFile(filePath, 'utf-8');
    
    return NextResponse.json({ 
      content,
      locale,
      fileName 
    });
  } catch (error) {
    console.error('Error reading agreement file:', error);
    
    // 返回默认错误内容
    const defaultContent = locale === 'zh' 
      ? '协议内容加载失败，请稍后重试。'
      : 'Failed to load agreement content. Please try again later.';
    
    return NextResponse.json(
      { 
        content: defaultContent,
        error: 'Failed to load agreement file' 
      },
      { status: 500 }
    );
  }
} 