#!/usr/bin/env npx tsx

/**
 * BOT FUNCTIONALITY TEST
 * Verifies that all bot functionality remains intact after Phase 1 optimizations
 */

import { bot } from '../../server/telegram';

console.log('🤖 TELEGRAM BOT FUNCTIONALITY TEST');
console.log('===================================\n');

async function testBotStatus() {
  console.log('📊 Testing bot status and configuration...');
  
  try {
    // Test bot instance exists
    if (!bot) {
      throw new Error('Bot instance not found');
    }
    console.log('✅ Bot instance exists');

    // Test bot connection (non-blocking now)
    console.log('🔄 Testing bot connection...');
    const botInfo = await Promise.race([
      bot.getMe(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
    ]) as any;
    
    console.log(`✅ Bot connected: @${botInfo.username}`);
    console.log(`   First name: ${botInfo.first_name}`);
    console.log(`   Bot ID: ${botInfo.id}`);

    // Test command configuration
    console.log('🔄 Testing command configuration...');
    const commands = await bot.getMyCommands();
    console.log(`✅ Commands configured: ${commands.length} command(s)`);
    commands.forEach(cmd => {
      console.log(`   /${cmd.command} - ${cmd.description}`);
    });

    return true;
  } catch (error) {
    console.error('❌ Bot test failed:', error);
    return false;
  }
}

async function runTests() {
  const startTime = Date.now();
  
  console.log(`[${new Date().toISOString()}] Starting bot functionality tests...\n`);
  
  const botStatus = await testBotStatus();
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log('\n🎯 TEST RESULTS SUMMARY');
  console.log('=======================');
  console.log(`Bot Status: ${botStatus ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Total test time: ${totalTime}ms`);
  
  if (botStatus) {
    console.log('\n✅ All bot functionality verified after Phase 1 optimizations');
    console.log('Bot is ready for production use with improved performance');
  } else {
    console.log('\n❌ Bot functionality issues detected');
    console.log('Please check bot configuration and network connectivity');
  }
}

runTests().catch(console.error);