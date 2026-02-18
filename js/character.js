// Sol: Local-first character sheet state + calculations (no build tools).
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
    version: 1,
    id: cryptoRandomId(),
    name: "New Character",
    playerName: "",
    race: "",
    background: "",
    alignment: "",
    xp: "",
    level: 1,
    multiclass: false,
    inspiration: false,

    abilities: { STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10 },
    saves: { STR:false, DEX:false, CON:false, INT:false, WIS:false, CHA:false },
    skills,

    proficiencyMisc: 0,
    perceptionMisc: 0,

    combat: { hpMax: 10, hpNow: 10, hpTemp: 0, acBase: 10, speed: 30, initiativeMisc: 0 },

    primary: { classKey: "", subclass: "", classLevel: 1, spellMod: 0, subclassPackageUrl: "" },
    secondary: { classKey: "", subclass: "", classLevel: 0, spellMod: 0, subclassPackageUrl: "" },

    spells: {
    spellcastingClass: "",
    spellcastingAbility: "INT",
    spellsKnown: 0,
    saveDcMisc: 0,
    attackBonusMisc: 0,
    cantrips: [],
    levels: { "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": [] }
  },

  bio: {
    age: "",
    height: "",
    weight: "",
    eyes: "",
    skin: "",
    hair: "",
    appearance: "",
    backstory: "",
    allies: "",
    treasure: "",
    additionalFeatures: "",
    symbol: ""
  },

  notes: "",
};
}

export function loadCharacterState() {
  try {
    const raw = localStorage.getItem(CHAR_STORAGE_KEY);
    if (!raw) return defaultCharacterState();
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return defaultCharacterState();
    const b = defaultCharacterState();
    const merged = {
      ...b,
      ...p,
      version: 1,
      id: (typeof p.id === "string") ? p.id : b.id,
      abilities: { ...b.abilities, ...(p.abilities || {}) },
      saves: { ...b.saves, ...(p.saves || {}) },
      skills: { ...b.skills, ...(p.skills || {}) },
      combat: { ...b.combat, ...(p.combat || {}) },
      primary: { ...b.primary, ...(p.primary || {}) },
      secondary: { ...b.secondary, ...(p.secondary || {}) },
      spells: { ...b.spells, ...(p.spells || {}), levels: { ...b.spells.levels, ...((p.spells||{}).levels || {}) } },
      bio: { ...b.bio, ...(p.bio || {}) },
    };
    merged.level = clampInt(merged.level, 1, 20);
    for (const a of abilityList) merged.abilities[a] = clampInt(merged.abilities[a], 1, 30);
    merged.primary.classLevel = clampInt(merged.primary.classLevel, 0, 20);
    merged.secondary.classLevel = clampInt(merged.secondary.classLevel, 0, 20);
    return merged;
  } catch {
    return defaultCharacterState();
  }
}

export function saveCharacterState(s) {
  localStorage.setItem(CHAR_STORAGE_KEY, JSON.stringify(s));
}

export function abilityMod(score) {
  const s = Number.isFinite(Number(score)) ? Math.trunc(Number(score)) : 10;
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

export function clampInt(v, min, max) {
  const n = Number(v);
  const i = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, i));
}

function cryptoRandomId() {
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(x => x.toString(16).padStart(2, "0")).join("");
}
