import { clampInt } from "./util.js";

export function findSubclass(subclassesData, className, subName) {
  const c = (subclassesData?.classes || []).find(x => x.class === className);
  if (!c) return null;
  return (c.subclasses || []).find(s => s.name === subName) || null;
}

export function getSubclassPreparedByLevel(subclassesData, className, subName, totalLevel) {
  const sub = findSubclass(subclassesData, className, subName);
  const byLv = sub?.spellRules?.alwaysPreparedByLevel;
  if (!byLv || typeof byLv !== "object") return [];
  const out = [];
  for (const [unlockStr, spellIds] of Object.entries(byLv)) {
    const unlock = clampInt(unlockStr, 0, 20);
    if (totalLevel >= unlock && Array.isArray(spellIds)) out.push(...spellIds);
  }
  return Array.from(new Set(out));
}

export function classSpellIdsUpToLevel(spellcastingData, className, maxSpellLevel) {
  const list = spellcastingData?.classes?.[className]?.spellListByLevel;
  if (!list) return [];
  const ids = [];
  for (let lv = 0; lv <= maxSpellLevel; lv++) {
    const arr = list[String(lv)] || [];
    for (const s of arr) ids.push(s.id);
  }
  return Array.from(new Set(ids));
}

export function isPreparedCaster(className) {
  return ["Cleric", "Druid", "Wizard", "Paladin"].includes(className);
}

export function isKnownCaster(className, subName) {
  const base = ["Bard", "Sorcerer", "Warlock", "Ranger"];
  if (base.includes(className)) return true;
  if (className === "Rogue" && subName === "Arcane Trickster") return true;
  if (className === "Fighter" && subName === "Eldritch Knight") return true;
  return false;
}

export function maxSpellLevelFor(spellcastingData, className, classLevel) {
  const progName = spellcastingData?.classes?.[className]?.progression;
  if (!progName) return 0;
  const prog = spellcastingData?.progressions?.[progName];
  const m = prog?.maxSpellLevel?.[String(clampInt(classLevel, 0, 20))];
  return Number.isFinite(m) ? m : 0;
}
