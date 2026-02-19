export const EQUIP_GROUPS = [
  { id:"head", label:"Head", slots:3 },
  { id:"neck", label:"Neck", slots:3 },
  { id:"body", label:"Body/Armor", slots:3 },
  { id:"waist", label:"Waist", slots:3 },
  { id:"legs", label:"Legs", slots:3 },
  { id:"feet", label:"Feet", slots:3 },
  { id:"face", label:"Face", slots:3 },
  { id:"shoulders", label:"Shoulders", slots:3 },
  { id:"torso", label:"Torso", slots:3 },
  { id:"arms", label:"Arms", slots:3 },
];
export function emptyItem(){ return { name:"", short:"", long:"", acBonus:"" }; }
export function defaultEquipment(){
  const slots = {};
  for (const g of EQUIP_GROUPS) slots[g.id] = Array.from({length:g.slots}).map(()=>emptyItem());
  slots.ringsRight = Array.from({length:6}).map(()=>emptyItem());
  slots.ringsLeft = Array.from({length:6}).map(()=>emptyItem());
  slots.shields = Array.from({length:3}).map(()=>({...emptyItem(), acBonus:""}));
  slots.weapons = Array.from({length:6}).map(()=>({...emptyItem(), hitDice:"", equipped:false}));
  return { portraitDataUrl:"", slots, bag:{ items:[] } };
}
export function computeEquipmentAcBonus(eq){
  let total = 0;
  const slots = eq?.slots || {};
  for (const k of Object.keys(slots)) {
    const arr = slots[k];
    if (!Array.isArray(arr)) continue;
    for (const it of arr) {
      const n = Number(it?.acBonus);
      if (Number.isFinite(n)) total += n;
    }
  }
  return total;
}
export function getEquippedWeaponDice(eq){
  const w = eq?.slots?.weapons;
  if (!Array.isArray(w)) return "";
  const found = w.find(x => x && x.equipped);
  return (found?.hitDice || "").trim();
}
