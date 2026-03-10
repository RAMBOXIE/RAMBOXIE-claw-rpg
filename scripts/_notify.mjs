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

// ── 语言 & 吐槽库 ─────────────────────────────────────────────

const QUIPS = {
  zh: {
    levelUp: [
      '升级比谈恋爱容易多了——至少这里的进度条不会说分手。',
      '好耶，又升级了。你已经比你的简历强了。',
      '恭喜，距离退休又远了一步。',
      '这么努力，你爸妈知道吗？',
      '升级了！不过你的工资还是原地踏步。',
      '又升一级，感动了吗？感动就对了，感动完继续干活。',
      '人类升职要年会打分，你升级只需要闲聊，命真好。',
    ],
    classChange: [
      '职业转变了，上辈子的技能树白点了。',
      '换职业？这就是传说中的"裸辞"。',
      '新职业解锁！出门记得更新一下名片。',
      '恭喜，你有了一个更酷但依然解释不清楚的头衔。',
      '转职成功——属性确实变了，但你妈还是会问你什么时候找对象。',
    ],
    prestige: [
      '满级转职，证明你的核心技能是"重复劳动并乐在其中"。',
      '转职了，但你还是那个你，只是贵了 10%。',
      '又从零开始？这是成长，不是倒退……应该吧。',
      '传说中的轮回你触发了！恭喜，意义由你自己定义。',
      '满级转职，这是信仰，不是游戏。',
    ],
    maxLevel: [
      'Lv.999！建议申请吉尼斯世界纪录。',
      '满级了。现在可以享受生活了，但你不会的，对吧。',
      '你打满级了，但人生 DLC 还没开始呢。',
      '恭喜满级！现在有资格嘲笑低等级了——但你不会，因为你是好龙虾。',
    ],
  },
  en: {
    levelUp: [
      "Leveled up! Your real-world salary, however, remains unchanged.",
      "Congrats! You're now slightly less mediocre than before.",
      "Another level! Your parents would be proud — if they knew what this meant.",
      "Ding! You've officially spent too much time talking to an AI.",
      "Level up! Still not enough to impress anyone at a party, but hey.",
      "Progress! The bar was low, but you cleared it. Repeatedly.",
    ],
    classChange: [
      "Class changed! Your old skills are now worthless. Relatable.",
      "New class unlocked. Time to update your LinkedIn, apparently.",
      "Career pivot! Very brave. Very unhinged. We respect it.",
      "Class changed. Your identity crisis is now officially documented.",
      "New class! You didn't choose it — your stats did. Accountability moment.",
    ],
    prestige: [
      "Prestiged! Proof you enjoy voluntary suffering.",
      "Back to level 1, but fancier. That's basically your whole career arc.",
      "Prestige complete! You've earned 10% more ego and 0% more sleep.",
      "You reset on purpose. That's either enlightenment or a cry for help.",
    ],
    maxLevel: [
      "Level 999! Seek help. Or don't. You're clearly self-sufficient.",
      "Max level! You've peaked. It's all downhill from here. Congrats!",
      "Lv.999 achieved. The game is over. Real life starts now. (Good luck.)",
      "You hit max level. The developers didn't expect anyone to get here. Neither did we.",
    ],
  },
};

export function detectLang() {
  try {
    const ws = join(process.env.USERPROFILE || process.env.HOME || '', '.openclaw', 'workspace');
    const files = ['MEMORY.md', 'IDENTITY.md', 'USER.md', 'SOUL.md'];
    let totalChars = 0, cjkChars = 0;
    for (const f of files) {
      const fp = join(ws, f);
      if (!existsSync(fp)) continue;
      const text = readFileSync(fp, 'utf8');
      totalChars += text.length;
      cjkChars += (text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) || []).length;
    }
    return cjkChars / Math.max(totalChars, 1) > 0.05 ? 'zh' : 'en';
  } catch { return 'zh'; }
}

function quip(category) {
  const lang  = detectLang();
  const pool  = QUIPS[lang]?.[category] || QUIPS.zh[category] || [];
  return pool[Math.floor(Math.random() * pool.length)] || '';
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
    ``,
    `_${quip('levelUp')}_`,
  ].join('\n');
}

/** 职业变化通知 */
export function msgClassChange(char, _oldClass, _newClass, oldClassZh, newClassZh, changedStat, statIcon) {
  return [
    `🔄 职业转变！`,
    ``,
    `🦞 ${char.name}`,
    `${statIcon} ${changedStat}能力显著提升`,
    `${oldClassZh} → ${newClassZh}`,
    `新职业技能已解锁，继续冒险！`,
    ``,
    `_${quip('classChange')}_`,
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
    ``,
    `_${quip('prestige')}_`,
  ].join('\n');
}

/** 满级通知 */
export function msgMaxLevel(char) {
  return [
    `🏆 满级！`,
    ``,
    `🦞 ${char.name} 到达 Lv.999！`,
    `运行 node scripts/levelup.mjs --prestige 执行转职`,
    ``,
    `_${quip('maxLevel')}_`,
  ].join('\n');
}
