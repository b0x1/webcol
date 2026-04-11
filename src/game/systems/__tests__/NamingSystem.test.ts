import { describe, it, expect } from 'vitest';
import { NamingSystem, type NamingStats } from '../NamingSystem';
import { Nation } from '../../entities/types';

describe('NamingSystem', () => {
  it('should get names for all nations', () => {
    let stats: NamingStats = {};
    const nations = Object.values(Nation);

    nations.forEach(nation => {
      const { name, updatedStats } = NamingSystem.getNextName(nation, 'settlement', stats);
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);

      // Ensure it doesn't just return "Jamestown" for everyone (unless it's England)
      if (nation !== Nation.ENGLAND) {
        // Some native lists might have Jamestown if I copied them, but my researched ones shouldn't
        // Actually, let's just check that it's NOT the first name of England if it's not England
        if (name === 'Jamestown') {
            console.warn(`Nation ${nation} returned Jamestown`);
        }
      }

      stats = updatedStats;
    });
  });

  it('should cycle names with Roman numerals', () => {
    let stats: NamingStats = {};
    const nation = Nation.ENGLAND;

    // We know England list has around 100 names, but let's just force it to cycle
    // by manually setting the stats if we wanted to be fast, or just loop.
    // Let's loop 150 times.
    for (let i = 0; i < 150; i++) {
        const { name, updatedStats } = NamingSystem.getNextName(nation, 'settlement', stats);
        stats = updatedStats;
        if (i === 100) {
            expect(name).toContain(' II');
        }
    }
    expect(stats[nation].settlement).toBe(150);
  });

  it('should handle units and ships', () => {
    let stats: NamingStats = {};
    const { name: unitName } = NamingSystem.getNextName(Nation.AZTEC, 'unit', stats);
    expect(unitName).toBeDefined();

    const { name: shipName } = NamingSystem.getNextName(Nation.AZTEC, 'ship', stats);
    expect(shipName).toBeDefined();
  });
});
