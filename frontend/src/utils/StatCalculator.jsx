// frontend/src/utils/StatCalculator.js

export const StatCalculator = {
  getFinalStats: (stats, level, plus) => {
    if (!stats) return { health: 0, attack_power: 0, dps: 0, hits: [] };
    
    const totalLevel = (parseInt(level) || 1) + (parseInt(plus) || 0);
    
    // Basic Battle Cats Formula: Base * (1 + (Level - 1) * 0.2)
    const multiplier = 1 + (totalLevel - 1) * 0.2;

    const calculatedHealth = Math.floor(stats.health * multiplier);
    const calculatedAttack = Math.floor(stats.attack_power * multiplier); // This is total sum
    
    // DPS calculation remains based on total power
    const frequencySeconds = stats.attack_frequency_f / 30;
    const dps = frequencySeconds > 0 ? Math.round(calculatedAttack / frequencySeconds) : 0;

    // [NEW] Calculate scaled damage for each individual hit
    const calculatedHits = (stats.hits || []).map(hit => ({
        damage: Math.floor(hit.damage * multiplier),
        frame: hit.frame
    }));

    return {
        health: calculatedHealth,
        attack_power: calculatedAttack,
        dps: dps,
        hits: calculatedHits // Return the array for the UI
    };
  }
};