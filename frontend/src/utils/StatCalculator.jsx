// frontend/src/utils/StatCalculator.js

export const StatCalculator = {
  getFinalStats: (stats, level, plus) => {
    if (!stats) return { health: 0, attack_power: 0, dps: 0 };
    
    const totalLevel = (parseInt(level) || 1) + (parseInt(plus) || 0);
    
    // Basic Battle Cats Formula: Base * (1 + (Level - 1) * 0.2)
    // This effectively adds 20% of base stats per level.
    const multiplier = 1 + (totalLevel - 1) * 0.2;

    const calculatedHealth = Math.floor(stats.health * multiplier);
    const calculatedAttack = Math.floor(stats.attack_power * multiplier);
    
    // DPS = Attack / (Attack Frequency in Seconds)
    // Frequency is in frames (30 frames = 1 second)
    const frequencySeconds = stats.attack_frequency_f / 30;
    const dps = frequencySeconds > 0 ? Math.round(calculatedAttack / frequencySeconds) : 0;

    return {
        health: calculatedHealth,
        attack_power: calculatedAttack,
        dps: dps
    };
  }
};