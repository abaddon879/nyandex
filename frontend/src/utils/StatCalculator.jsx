export const StatCalculator = {
  /**
   * Calculates final stats using the exact level curve from the DB.
   * @param {Object} stats - Base stats (health, attack_power, etc)
   * @param {number} level - Current Level
   * @param {number} plus - Plus Level
   * @param {Array<number>} levelCurve - The array of growth % (e.g. [20, 20, 10...])
   * @param {Object} treasures - Treasure bonuses { attack: 300, health: 300 }
   */
  getFinalStats: (stats, level, plus, levelCurve, treasures = { attack: 0, health: 0 }) => {
    // Default safe return
    if (!stats) return { health: 0, attack_power: 0, dps: 0, hits: [], attack_frequency_s: 0, recharge_time_s: 0 };

    const totalLevel = (parseInt(level) || 1) + (parseInt(plus) || 0);
    
    // --- 1. CALCULATE LEVEL MULTIPLIER ---
    // Level 1 is base (100%). We sum the growth for every level AFTER level 1.
    let growthPercentage = 0;

    // If we have a curve, use it. Otherwise default to 0 growth (safe fallback).
    if (levelCurve && Array.isArray(levelCurve) && levelCurve.length > 0) {
        for (let l = 2; l <= totalLevel; l++) {
            // The curve array stores growth in blocks of 10 levels.
            // Index 0 = Levels 2-10
            // Index 1 = Levels 11-20, etc.
            const curveIndex = Math.floor((l - 1) / 10);
            
            // Use the value from the array, or the last value if we exceed the array length
            const rate = levelCurve[curveIndex] !== undefined 
                ? levelCurve[curveIndex] 
                : levelCurve[levelCurve.length - 1];
    
            growthPercentage += rate;
        }
    }

    const levelMult = 1 + (growthPercentage / 100);

    // --- 2. TREASURE MULTIPLIER ---
    const treasureMultHp = 1 + (treasures.health / 100 * 0.5);
    const treasureMultAtk = 1 + (treasures.attack / 100 * 0.5);

    // --- 3. CORE STATS (Floored) ---
    const calculatedHealth = Math.floor(stats.health * levelMult * treasureMultHp);
    const calculatedAttack = Math.floor(stats.attack_power * levelMult * treasureMultAtk);

    // --- 4. FREQUENCY & DPS ---
    const rawTba = stats.attack_frequency_f;
    // The game logic: Wait Time = (Frequency * 2) - 1
    const waitTimeFrames = Math.max(0, (rawTba * 2) - 1);
    
    // Find the last hit frame to know when the attack animation technically "ends" for cooldown purposes
    const lastHitFrame = (stats.hits && stats.hits.length > 0) 
        ? Math.max(...stats.hits.map(h => h.frame)) 
        : stats.attack_hit_1_f;

    const animLength = lastHitFrame + (stats.attack_backswing_f || 0);
    const cooldownEndFrame = lastHitFrame + waitTimeFrames;
    
    // The actual cycle is the longer of the Animation or the Cooldown
    const trueFrequencyFrames = Math.max(animLength, cooldownEndFrame);
    const frequencySeconds = trueFrequencyFrames / 30;
    
    const dps = frequencySeconds > 0 ? Math.round(calculatedAttack / frequencySeconds) : 0;

    // --- 5. RECHARGE ---
    const rechargeSeconds = Math.max(0, (stats.recharge_time_f * 2 - 254) / 30);

    // --- 6. HITS ---
    const calculatedHits = (stats.hits || []).map(hit => ({
        damage: Math.floor(hit.damage * levelMult * treasureMultAtk),
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