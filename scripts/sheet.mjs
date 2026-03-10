#!/usr/bin/env node
/**
 * Claw RPG — 角色卡（终端）
 *
 * 用法：
 *   node scripts/sheet.mjs
 *   node scripts/sheet.mjs --json   # 仅输出 JSON
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { CHARACTER_FILE } from './_paths.mjs';
import {
  xpToNextLevel, levelProgress, prestigeTitle,
  CLASSES, STAT_NAMES, proficiencyBonus
} from './_formulas.mjs';

const jsonOnly = process.argv.includes('--json');

function statBar(val, max = 18) {
  const filled = Math.round((val / max) * 12);
  return '█'.repeat(filled) + '░'.repeat(12 - filled);
}

function xpBar(progress, width = 24) {
  const filled = Math.round((progress / 100) * width);
  return '▓'.repeat(filled) + '░'.repeat(width - filled);
}

function run() {
  if (!existsSync(CHARACTER_FILE)) {
    console.error('❌ 角色卡未找到，请先运行：node scripts/init.mjs');
    process.exit(1);
  }

  const char     = JSON.parse(readFileSync(CHARACTER_FILE, 'utf8'));
  const cls      = CLASSES[char.class] || {};
  const title    = prestigeTitle(char.prestige);
  const progress = levelProgress(char.xp);
  const toNext   = xpToNextLevel(char.xp);
  const prof     = proficiencyBonus(char.level);
  const bar      = xpBar(progress);

  if (jsonOnly) {
    process.stdout.write(JSON.stringify(char, null, 2) + '\n');
    return char;
  }

  const W = 52;
  const line  = '─'.repeat(W);
  const dline = '═'.repeat(W);

  console.log(`\n╔${dline}╗`);
  console.log(`║  🦞  CLAW RPG  —  角色卡${' '.repeat(W - 26)}║`);
  console.log(`╠${dline}╣`);
  console.log(`║  ${char.name.padEnd(20)}  ${cls.icon || '?'} ${(cls.zh || char.class).padEnd(10)}  ║`);
  console.log(`║  称号: ${title.padEnd(16)}  转职: x${String(char.prestige).padEnd(4)}  ║`);
  console.log(`║  等级: Lv.${String(char.level).padEnd(4)}  精通加成: +${prof}${' '.repeat(W - 26)}║`);
  console.log(`╠${dline}╣`);

  // XP 进度
  const pct = String(progress).padStart(3);
  console.log(`║  XP  ${bar}  ${pct}%  ║`);
  const xpStr = `${char.xp.toLocaleString()} XP${toNext > 0 ? '  还差 ' + toNext.toLocaleString() : '  【满级】'}`;
  console.log(`║  ${xpStr.padEnd(W)}║`);
  console.log(`╠${dline}╣`);

  // 属性
  console.log(`║  ── 属性 ${'─'.repeat(W - 8)}║`);
  for (const [k, info] of Object.entries(STAT_NAMES)) {
    const val = char.stats?.[k] ?? 10;
    const mod = Math.floor((val - 10) / 2);
    const modStr = (mod >= 0 ? '+' : '') + mod;
    const b = statBar(val);
    console.log(`║  ${info.icon} ${info.zh.padEnd(4)}  [${b}]  ${String(val).padStart(2)} (${modStr.padStart(2)})  ║`);
  }
  console.log(`╠${dline}╣`);

  // 技能
  console.log(`║  ── 已解锁技能 ${'─'.repeat(W - 14)}║`);
  const abilities = char.abilities || [];
  if (abilities.length === 0) {
    console.log(`║  （暂无技能）${' '.repeat(W - 13)}║`);
  } else {
    // 每行最多 3 个
    for (let i = 0; i < abilities.length; i += 3) {
      const row = abilities.slice(i, i+3).join('  ·  ');
      console.log(`║  ${row.padEnd(W)}║`);
    }
  }
  console.log(`╠${dline}╣`);

  // Token 统计
  const totalConv = char.conversations || 0;
  const tokIn  = (char.tokens?.consumed || 0).toLocaleString();
  const tokOut = (char.tokens?.produced || 0).toLocaleString();
  console.log(`║  ── 战绩 ${'─'.repeat(W - 8)}║`);
  console.log(`║  对话次数: ${String(totalConv).padEnd(8)} 消耗 Token: ${tokIn.padEnd(10)} ║`);
  console.log(`║  职业历史: ${(char.classHistory?.length || 0)} 次变化  产出 Token: ${tokOut.padEnd(10)} ║`);
  console.log(`╚${dline}╝\n`);

  process.stdout.write('\n__JSON_OUTPUT__\n' + JSON.stringify({
    name: char.name, class: char.class, level: char.level,
    xp: char.xp, progress, stats: char.stats, abilities: char.abilities
  }) + '\n');

  return char;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run();
}

export { run };
