// frontend/src/utils/StatCalculator.jsx

export const StatCalculator = {
  /**
   * Calculates final stats.
   * To match Wiki: set treasures = { attack: 300, health: 300 }
   * To match Base/DB: set treasures = { attack: 0, health: 0 }
   */
  getFinalStats: (stats, level, plus, rarityId = 2, catId = 0, treasures = { attack: 0, health: 0 }) => {
    if (!stats) return { health: 0, attack_power: 0, dps: 0, hits: [], attack_frequency_s: 0, recharge_time_s: 0 };
    
    const totalLevel = (parseInt(level) || 1) + (parseInt(plus) || 0);
    
    // --- 1. TREASURE MULTIPLIER ---
    const treasureMultHp = 1 + (treasures.health / 100 * 0.5);
    const treasureMultAtk = 1 + (treasures.attack / 100 * 0.5);

    // --- 2. LEVEL SCALING CURVE ---
    let cap1 = 60, cap2 = 80;
    if (rarityId === 0 || rarityId === 1) { cap1 = 60; cap2 = 999; } 
    else if (rarityId === 2) { cap1 = 70; cap2 = 90; }
    if (catId === 25) { cap1 = 30; cap2 = 999; } // Bahamut Exception

    let levelMult = 1;
    const phase1Levels = Math.min(totalLevel, cap1) - 1;
    if (phase1Levels > 0) levelMult += phase1Levels * 0.20;

    if (totalLevel > cap1) {
        const phase2Levels = Math.min(totalLevel, cap2) - cap1;
        levelMult += phase2Levels * 0.10;
    }

    if (totalLevel > cap2) {
        const phase3Levels = totalLevel - cap2;
        levelMult += phase3Levels * 0.05;
    }

    // --- 3. CALCULATE CORE STATS ---
    const calculatedHealth = Math.round(stats.health * levelMult * treasureMultHp);
    const calculatedAttack = Math.round(stats.attack_power * levelMult * treasureMultAtk);


    // --- 4. FREQUENCY & DPS (FIXED) ---
    const rawTba = stats.attack_frequency_f;
    const waitTimeFrames = Math.max(0, (rawTba * 2) - 1);
    
    // Identify the frame of the LAST hit
    const lastHitFrame = (stats.hits && stats.hits.length > 0) 
        ? Math.max(...stats.hits.map(h => h.frame)) 
        : stats.attack_hit_1_f;

    // Full animation duration
    const animLength = lastHitFrame + (stats.attack_backswing_f || 0);

    // Earliest possible next attack (Wait Time starts after Last Hit)
    const cooldownEndFrame = lastHitFrame + waitTimeFrames;

    // Real cycle is whichever takes longer: Animation or Cooldown
    const trueFrequencyFrames = Math.max(animLength, cooldownEndFrame);
    const frequencySeconds = trueFrequencyFrames / 30;
    
    // DPS
    const dps = frequencySeconds > 0 ? Math.round(calculatedAttack / frequencySeconds) : 0;


    // --- 5. RECHARGE ---
    const rechargeSeconds = Math.max(0, (stats.recharge_time_f * 2 - 254) / 30);

    // --- 6. HITS ---
    const calculatedHits = (stats.hits || []).map(hit => ({
        damage: Math.round(hit.damage * levelMult * treasureMultAtk),
        frame: hit.frame
    }));

    return {
        health: calculatedHealth,
        attack_power: calculatedAttack,
        dps: dps,
        attack_frequency_s: frequencySeconds,
        recharge_time_s: rechargeSeconds,
        hits: calculatedHits
    };
  }
};