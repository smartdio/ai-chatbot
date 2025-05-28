#!/usr/bin/env node

/**
 * PATH_PRE 配置测试脚本
 * 用于验证路径前缀配置是否正确工作
 */

// 模拟不同的 PATH_PRE 值进行测试
const testCases = [
  { PATH_PRE: '', expected: { prefix: '', login: '/login', home: '/' } },
  { PATH_PRE: '/chatbot', expected: { prefix: '/chatbot', login: '/chatbot/login', home: '/chatbot/' } },
  { PATH_PRE: '/api/v1', expected: { prefix: '/api/v1', login: '/api/v1/login', home: '/api/v1/' } },
  { PATH_PRE: 'app/', expected: { prefix: '/app', login: '/app/login', home: '/app/' } },
  { PATH_PRE: '/app/', expected: { prefix: '/app', login: '/app/login', home: '/app/' } },
];

console.log('🧪 PATH_PRE 配置测试\n');

testCases.forEach((testCase, index) => {
  console.log(`测试案例 ${index + 1}: PATH_PRE="${testCase.PATH_PRE}"`);
  
  // 设置环境变量
  process.env.PATH_PRE = testCase.PATH_PRE;
  
  // 清除模块缓存以重新加载配置
  delete require.cache[require.resolve('../lib/path-config.ts')];
  
  try {
    // 动态导入配置（注意：在实际项目中这需要编译后的 JS 文件）
    const { getPathPrefix, addPathPrefix, PATH_CONFIG } = require('../lib/path-config.ts');
    
    const actualPrefix = getPathPrefix();
    const actualLogin = addPathPrefix('/login');
    const actualHome = addPathPrefix('/');
    
    const passed = 
      actualPrefix === testCase.expected.prefix &&
      actualLogin === testCase.expected.login &&
      actualHome === testCase.expected.home;
    
    console.log(`  前缀: "${actualPrefix}" ${actualPrefix === testCase.expected.prefix ? '✅' : '❌'}`);
    console.log(`  登录: "${actualLogin}" ${actualLogin === testCase.expected.login ? '✅' : '❌'}`);
    console.log(`  首页: "${actualHome}" ${actualHome === testCase.expected.home ? '✅' : '❌'}`);
    console.log(`  结果: ${passed ? '✅ 通过' : '❌ 失败'}\n`);
    
  } catch (error) {
    console.log(`  ❌ 错误: ${error.message}\n`);
  }
});

console.log('📋 使用说明:');
console.log('1. 在 .env.local 中设置 PATH_PRE 环境变量');
console.log('2. 重启开发服务器');
console.log('3. 访问相应的路径测试功能');
console.log('\n示例:');
console.log('PATH_PRE=/chatbot npm run dev');
console.log('然后访问: http://localhost:3000/chatbot/login'); 