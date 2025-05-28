#!/usr/bin/env node

/**
 * 静态资源路径测试脚本
 * 用于验证PATH_PRE配置下的静态资源是否正确加载
 */

const http = require('http');
const { spawn } = require('child_process');

// 测试配置
const TEST_CONFIG = {
  port: 3001,
  pathPrefix: '/chat',
  testPaths: [
    '/_next/static/chunks/main.js',
    '/_next/static/css/app.css',
    '/favicon.ico',
    '/images/psybot-icon.svg'
  ]
};

console.log('🧪 静态资源路径测试\n');

// 模拟请求测试
function testStaticAsset(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: TEST_CONFIG.port,
      path: `${TEST_CONFIG.pathPrefix}${path}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      const status = res.statusCode;
      const success = status === 200 || status === 304;
      
      console.log(`${success ? '✅' : '❌'} ${path} -> ${status}`);
      resolve({ path, status, success });
    });

    req.on('error', (err) => {
      console.log(`❌ ${path} -> 错误: ${err.message}`);
      resolve({ path, status: 'ERROR', success: false });
    });

    req.setTimeout(5000, () => {
      console.log(`❌ ${path} -> 超时`);
      resolve({ path, status: 'TIMEOUT', success: false });
    });

    req.end();
  });
}

// 主测试函数
async function runTests() {
  console.log(`测试配置:`);
  console.log(`- 端口: ${TEST_CONFIG.port}`);
  console.log(`- 路径前缀: ${TEST_CONFIG.pathPrefix}`);
  console.log(`- 测试URL: http://localhost:${TEST_CONFIG.port}${TEST_CONFIG.pathPrefix}\n`);

  console.log('测试静态资源路径:\n');

  const results = [];
  for (const path of TEST_CONFIG.testPaths) {
    const result = await testStaticAsset(path);
    results.push(result);
  }

  console.log('\n📊 测试结果:');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`成功: ${successful}/${total}`);
  
  if (successful === total) {
    console.log('🎉 所有静态资源路径测试通过！');
  } else {
    console.log('⚠️  部分静态资源路径测试失败');
    console.log('\n💡 解决建议:');
    console.log('1. 确保 next.config.ts 中设置了正确的 basePath 和 assetPrefix');
    console.log('2. 检查中间件是否正确处理静态资源');
    console.log('3. 重新构建项目: PATH_PRE=/chat npm run build');
    console.log('4. 启动服务器: PATH_PRE=/chat npm start');
  }
}

// 检查服务器是否运行
function checkServer() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: TEST_CONFIG.port,
      path: TEST_CONFIG.pathPrefix,
      method: 'GET'
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(2000, () => {
      resolve(false);
    });

    req.end();
  });
}

// 启动测试
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ 服务器未运行');
    console.log('\n请先启动服务器:');
    console.log(`PATH_PRE=${TEST_CONFIG.pathPrefix} npm run dev`);
    console.log('或者:');
    console.log(`PATH_PRE=${TEST_CONFIG.pathPrefix} npm run build && PATH_PRE=${TEST_CONFIG.pathPrefix} npm start`);
    return;
  }

  await runTests();
}

main().catch(console.error); 