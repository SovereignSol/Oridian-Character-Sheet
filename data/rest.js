import { clampInt } from "./util.js";
export function hitDieForClass(className){
  switch((className||"").trim()){
    case "Barbarian": return "d12";
    case "Fighter":
    case "Paladin":
    case "Ranger": return "d10";
    case "Bard":
    case "Cleric":
    case "Druid":
    case "Monk":
    case "Rogue":
    case "Warlock": return "d8";
    case "Sorcerer":
    case "Wizard": return "d6";
    default: return "";
  }
}
export function defaultHitDicePools(state){
  const pools = {};
  const add=(die,count)=>{
    if(!die||!count) return;
    pools[die]=pools[die]||{max:0,remaining:0};
    pools[die].max+=count; pools[die].remaining+=count;
  };
  add(hitDieForClass(state?.primary?.className), clampInt(state?.primary?.classLevel||0,0,20));
  if(state?.multiclass) add(hitDieForClass(state?.secondary?.className), clampInt(state?.secondary?.classLevel||0,0,20));
  for(const k of Object.keys(pools)) pools[k].remaining=Math.min(pools[k].remaining,pools[k].max);
  return pools;
}
export function applyShortRestHitDice(state, spendMap){
  const next = structuredClone(state);
  next.rest = next.rest || {};
  next.rest.hitDice = next.rest.hitDice || defaultHitDicePools(next);
  let total=0;
  for(const [die,spendRaw] of Object.entries(spendMap||{})){
    const spend=clampInt(spendRaw,0,999);
    const pool=next.rest.hitDice[die];
    if(!pool) continue;
    const use=Math.min(spend,pool.remaining);
    pool.remaining-=use;
    total+=use;
  }
  const hpMax=Number(next.combat?.hpMax||0);
  const hpNow=Number(next.combat?.hpNow||0);
  next.combat.hpNow=clampInt(hpNow+total,0,hpMax||9999);
  return next;
}
export function applyLongRest(state){
  const next=structuredClone(state);
  next.rest=next.rest||{};
  next.rest.hitDice=defaultHitDicePools(next);
  next.rest.preparedUnlock=(next.rest.preparedUnlock||0)+1;
  if(next.combat){ next.combat.hpNow=next.combat.hpMax||next.combat.hpNow||0; next.combat.hpTemp=0; }
  return next;
}
