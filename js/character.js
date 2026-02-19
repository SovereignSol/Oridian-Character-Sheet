export const CHAR_STORAGE_KEY = "dnd_character_state_v1";

export const abilityList = ["STR","DEX","CON","INT","WIS","CHA"];

export const skillMeta = [
  { id:"acrobatics", label:"Acrobatics", ability:"DEX" },
  { id:"animalHandling", label:"Animal Handling", ability:"WIS" },
  { id:"arcana", label:"Arcana", ability:"INT" },
  { id:"athletics", label:"Athletics", ability:"STR" },
  { id:"deception", label:"Deception", ability:"CHA" },
  { id:"history", label:"History", ability:"INT" },
  { id:"insight", label:"Insight", ability:"WIS" },
  { id:"intimidation", label:"Intimidation", ability:"CHA" },
  { id:"investigation", label:"Investigation", ability:"INT" },
  { id:"medicine", label:"Medicine", ability:"WIS" },
  { id:"nature", label:"Nature", ability:"INT" },
  { id:"perception", label:"Perception", ability:"WIS" },
  { id:"performance", label:"Performance", ability:"CHA" },
  { id:"persuasion", label:"Persuasion", ability:"CHA" },
  { id:"religion", label:"Religion", ability:"INT" },
  { id:"sleightOfHand", label:"Sleight of Hand", ability:"DEX" },
  { id:"stealth", label:"Stealth", ability:"DEX" },
  { id:"survival", label:"Survival", ability:"WIS" },
];

export function defaultCharacterState() {
  const skills = {};
  for (const s of skillMeta) skills[s.id] = 0; // 0 none, 1 prof, 2 expertise

  return {
    version: 4,
    id: cryptoRandomId(),

    name: "",
    race: "",
    alignment: "",

    inspirationPoints: 0,

    multiclass: false,

    abilities: { STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10 },
    saves: { STR:false, DEX:false, CON:false, INT:false, WIS:false, CHA:false },
    skills,

    proficiencyMisc: 0,
    perceptionMisc: 0,

    combat: { hpMax: 10, hpNow: 10, hpTemp: 0, acBase: 10, speed: 30, initiativeMisc: 0 },

    // Derived from class levels, stored for convenience and Combat Tracker sync.
    level: 1,

    primary: { className: "", classLevel: 1, subclass: "", subclassPackageUrl: "", spellMod: 0 },
    secondary: { className: "", classLevel: 0, subclass: "", subclassPackageUrl: "", spellMod: 0 },

    background: "",

    // feat/feature/asi picks
    picks: [],

    details: { appearance: "", backstory: "", allies: "", treasure: "" },
    spells: { notes: "" },
  };
}

export function clampInt(v, min, max) {
  const n = Number(v);
  const i = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, i));
}

export function deriveAndClamp(state) {
  const s = structuredClone(state);

  s.inspirationPoints = clampInt(s.inspirationPoints, 0, 99);

  for (const a of abilityList) s.abilities[a] = clampInt(s.abilities[a], 1, 30);

  s.primary.classLevel = clampInt(s.primary.classLevel, 0, 20);
  s.secondary.classLevel = clampInt(s.secondary.classLevel, 0, 20);

  const total = Math.max(1, s.primary.classLevel + (s.multiclass ? s.secondary.classLevel : 0));
  s.level = clampInt(total, 1, 20);

  s.combat.hpMax = clampInt(s.combat.hpMax, 0, 9999);
  s.combat.hpNow = clampInt(s.combat.hpNow, 0, s.combat.hpMax);
  s.combat.hpTemp = clampInt(s.combat.hpTemp, 0, 9999);

  return s;
}

export function loadCharacterState() {
  try {
    const raw = localStorage.getItem(CHAR_STORAGE_KEY);
    if (!raw) return deriveAndClamp(defaultCharacterState());
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return deriveAndClamp(defaultCharacterState());

    const b = defaultCharacterState();
    const merged = {
      ...b,
      ...p,
      abilities: { ...b.abilities, ...(p.abilities || {}) },
      saves: { ...b.saves, ...(p.saves || {}) },
      skills: { ...b.skills, ...(p.skills || {}) },
      combat: { ...b.combat, ...(p.combat || {}) },
      primary: { ...b.primary, ...(p.primary || {}) },
      secondary: { ...b.secondary, ...(p.secondary || {}) },
      details: { ...b.details, ...(p.details || {}) },
      spells: { ...b.spells, ...(p.spells || {}) },
      picks: Array.isArray(p.picks) ? p.picks : b.picks,
    };

    return deriveAndClamp(merged);
  } catch {
    return deriveAndClamp(defaultCharacterState());
  }
}

export function saveCharacterState(s) {
  const fixed = deriveAndClamp(s);
  localStorage.setItem(CHAR_STORAGE_KEY, JSON.stringify(fixed));
  return fixed;
}

export function abilityMod(score) {
  const n = Number(score);
  const s = Number.isFinite(n) ? Math.trunc(n) : 10;
  return Math.floor((s - 10) / 2);
}

export function proficiencyBonus(level) {
  const l = clampInt(level, 1, 20);
  if (l >= 17) return 6;
  if (l >= 13) return 5;
  if (l >= 9) return 4;
  if (l >= 5) return 3;
  return 2;
}

export function formatSigned(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function saveBonus(state, ability) {
  const base = abilityMod(state.abilities[ability]);
  const prof = state.saves[ability] ? proficiencyBonus(state.level) : 0;
  return base + prof;
}

export function skillBonus(state, skillId) {
  const meta = skillMeta.find(s => s.id === skillId);
  const abil = (meta && meta.ability) ? meta.ability : "INT";
  const base = abilityMod(state.abilities[abil]);
  const pb = proficiencyBonus(state.level);
  const lvl = Number(state.skills[skillId] || 0);
  const add = (lvl === 1) ? pb : (lvl === 2 ? pb * 2 : 0);
  return base + add;
}

export function passivePerception(state) {
  return 10 + skillBonus(state, "perception") + clampInt(state.perceptionMisc, -50, 50);
}

export function initiative(state) {
  return abilityMod(state.abilities.DEX) + clampInt(state.combat.initiativeMisc, -99, 99);
}

function cryptoRandomId() {
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(x => x.toString(16).padStart(2, "0")).join("");
}
