/**
 * Claw RPG — 通知助手
 * 通过 OpenClaw gateway 推送 Telegram 消息
 * 所有重要事件（升级 / 职业变化 / 转职）统一走这里
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SKILL_ROOT } from './_paths.mjs';

function loadGateway() {
  const paths = [
    join(process.env.USERPROFILE || '', '.openclaw', 'openclaw.json'),
    join(process.env.HOME || '', '.openclaw', 'openclaw.json'),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      try { return JSON.parse(readFileSync(p, 'utf8')); } catch {}
    }
  }
  return null;
}

function loadChatId() {
  const cfg = join(SKILL_ROOT, 'config.json');
  if (existsSync(cfg)) {
    try { return JSON.parse(readFileSync(cfg, 'utf8'))?.telegram_chat_id || ''; } catch {}
  }
  return '';
}

/**
 * 推送通知
 * @param {string} text - 消息正文（支持 emoji）
 * @returns {Promise<boolean>} 是否发送成功
 */
export async function notify(text) {
  const gw     = loadGateway();
  const chatId = loadChatId();

  if (!gw || !chatId) return false; // 未配置，静默跳过

  const token = gw?.gateway?.auth?.token;
  const port  = gw?.gateway?.port || 18789;

  try {
    const res = await fetch(`http://localhost:${port}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        tool: 'message',
        input: { action: 'send', target: chatId, message: text },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── 事件模板 ──────────────────────────────────────────────────

/** 升级通知 */
export function msgLevelUp(char, oldLevel, newLevel) {
  const multi = newLevel - oldLevel;
  return [
    `⚔️ 升级！`,
    ``,
    `🦞 ${char.name}`,
    `Lv.${oldLevel} → Lv.${newLevel}${multi > 1 ? `（连升 ${multi} 级！）` : ''}`,
    `当前 XP：${char.xp.toLocaleString()}`,
  ].join('\n');
}

/** 职业变化通知 */
export function msgClassChange(char, oldClass, newClass, oldClassZh, newClassZh, changedStat, statIcon) {
  return [
    `🔄 职业转变！`,
    ``,
    `🦞 ${char.name}`,
    `${statIcon} ${changedStat}能力显著提升`,
    `${oldClassZh} → ${newClassZh}`,
    `新职业技能已解锁，继续冒险！`,
  ].join('\n');
}

/** 转职通知 */
export function msgPrestige(char, newPrestige, title) {
  return [
    `🌟 传说时刻——转职！`,
    ``,
    `🦞 ${char.name} 完成第 ${newPrestige} 次转职`,
    `称号：${title}`,
    `全属性永久 +10%`,
    `等级归一，再铸传奇！`,
  ].join('\n');
}

/** 满级通知 */
export function msgMaxLevel(char) {
  return [
    `🏆 满级！`,
    ``,
    `🦞 ${char.name} 到达 Lv.999！`,
    `运行 node scripts/levelup.mjs --prestige 执行转职`,
  ].join('\n');
}
