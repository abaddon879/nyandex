// frontend/src/utils/StatCalculator.jsx

export const StatCalculator = {
  getFinalStats: (stats, level, plus, rarityId = 2, catId = 0) => {
    if (!stats) return { health: 0, attack_power: 0, dps: 0, hits: [], attack_frequency_s: 0 };
    
    const totalLevel = (parseInt(level) || 1) + (parseInt(plus) || 0);
    
    // --- 1. SCALING LOGIC (Same as before) ---
    let cap1 = 60; 
    let cap2 = 80;

    if (rarityId === 0 || rarityId === 1) { cap1 = 60; cap2 = 999; } 
    else if (rarityId === 2) { cap1 = 70; cap2 = 90; }

    if (catId === 25) { cap1 = 30; cap2 = 999; }

    let multiplier = 1;
    const phase1Levels = Math.min(totalLevel, cap1) - 1;
    if (phase1Levels > 0) multiplier += phase1Levels * 0.20;

    if (totalLevel > cap1) {
        const phase2Levels = Math.min(totalLevel, cap2) - cap1;
        multiplier += phase2Levels * 0.10;
    }

    if (totalLevel > cap2) {
        const phase3Levels = totalLevel - cap2;
        multiplier += phase3Levels * 0.05;
    }

    const calculatedHealth = Math.round(stats.health * multiplier);
    const calculatedAttack = Math.round(stats.attack_power * multiplier);


    // --- 2. TRUE FREQUENCY CALCULATION ---
    const rawTba = stats.attack_frequency_f;
    const waitTimeFrames = Math.max(0, (rawTba * 2) - 1);
    
    const lastHitFrame = (stats.hits && stats.hits.length > 0) 
        ? Math.max(...stats.hits.map(h => h.frame)) 
        : stats.attack_hit_1_f;

    const animLength = lastHitFrame + (stats.attack_backswing_f || 0);
    const foreswing = stats.hits && stats.hits.length > 0 ? stats.hits[0].frame : 0;

    // THE REAL FORMULA
    const trueFrequencyFrames = Math.max(animLength, foreswing + waitTimeFrames);
    const frequencySeconds = trueFrequencyFrames / 30;
    
    const dps = frequencySeconds > 0 ? Math.round(calculatedAttack / frequencySeconds) : 0;

    const calculatedHits = (stats.hits || []).map(hit => ({
        damage: Math.round(hit.damage * multiplier),
        frame: hit.frame
    }));

    return {
        health: calculatedHealth,
        attack_power: calculatedAttack,
        dps: dps,
        // [NEW] Return this so the UI can display the Real Frequency
        attack_frequency_s: frequencySeconds, 
        hits: calculatedHits
    };
  }
};