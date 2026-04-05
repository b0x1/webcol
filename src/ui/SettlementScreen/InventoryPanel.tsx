import React from 'react';
import { GoodType, JobType, BuildingType, TerrainType } from '../../game/entities/types';
import type { Tile } from '../../game/entities/Tile';
import { useGameStore } from '../../game/state/gameStore';
import type { Settlement } from '../../game/entities/Settlement';
import type { Unit } from '../../game/entities/Unit';
import type { Player } from '../../game/entities/Player';

interface Props {
  inventory: Map<GoodType, number>;
  workforce: Map<string, JobType | string>;
  buildings: BuildingType[];
  population: number;
  map: Tile[][];
  settlementX: number;
  settlementY: number;
}

export const InventoryPanel: React.FC<Props> = ({ inventory, workforce, buildings, population, map, settlementX, settlementY }) => {
  const calculateProduction = (good: GoodType) => {
    let prod = 0;

    // Base production from workforce
    workforce.forEach((assignment, unitId) => {
      const unit = (useGameStore.getState().players.flatMap((p: Player) => p.settlements).flatMap((s: Settlement) => s.units).find((u: Unit) => u.id === unitId));
      let amount = 3;
      if (unit?.specialty === assignment) {
        amount *= 2;
      }

      if (Object.values(JobType).includes(assignment as JobType)) {
        if (assignment === JobType.FARMER && good === GoodType.FOOD) prod += amount;
        if (assignment === JobType.LUMBERJACK && good === GoodType.LUMBER) prod += amount;
        if (assignment === JobType.MINER && good === GoodType.ORE) prod += amount;

        if (assignment === JobType.TOBACCONIST && buildings.includes(BuildingType.TOBACCONISTS_SHOP)) {
          if (good === GoodType.TOBACCO) prod -= amount;
          if (good === GoodType.CIGARS) prod += amount;
        }
        if (assignment === JobType.DISTILLER && buildings.includes(BuildingType.DISTILLERY)) {
          if (good === GoodType.SUGAR) prod -= amount;
          if (good === GoodType.RUM) prod += amount;
        }
        if (assignment === JobType.TAILOR && buildings.includes(BuildingType.TAILORS_SHOP)) {
          if (good === GoodType.FURS) prod -= amount;
          if (good === GoodType.COATS) prod += amount;
        }
        if (assignment === JobType.BLACKSMITH && (buildings.includes(BuildingType.BLACKSMITHS_HOUSE) || buildings.includes(BuildingType.BLACKSMITHS_SHOP) || buildings.includes(BuildingType.IRON_WORKS))) {
          if (good === GoodType.ORE) prod -= amount;
          if (good === GoodType.TOOLS) prod += amount;
        }
        if (assignment === JobType.ARMORER && buildings.includes(BuildingType.ARMORY)) {
          if (good === GoodType.TOOLS) prod -= amount;
          if (good === GoodType.MUSKETS) prod += amount;
        }
        if (assignment === JobType.WEAVER && buildings.includes(BuildingType.WEAVERS_SHOP)) {
           if (good === GoodType.COTTON) prod -= amount;
           if (good === GoodType.CLOTH) prod += amount;
        }
      } else {
        const parts = (assignment as string).split('-');
        if (parts.length === 2) {
          const tx = parseInt(parts[0]);
          const ty = parseInt(parts[1]);
          const tile = map[ty]?.[tx];
          if (tile) {
            let tileGood: GoodType | null = null;
            switch (tile.terrainType) {
              case TerrainType.GRASSLAND:
              case TerrainType.PRAIRIE:
                tileGood = GoodType.FOOD;
                break;
              case TerrainType.PLAINS:
                tileGood = GoodType.FOOD;
                break;
              case TerrainType.FOREST:
                tileGood = GoodType.LUMBER;
                break;
              case TerrainType.HILLS:
              case TerrainType.MOUNTAINS:
                tileGood = GoodType.ORE;
                break;
              case TerrainType.SWAMP:
                tileGood = GoodType.SUGAR;
                break;
              case TerrainType.MARSH:
                tileGood = GoodType.TOBACCO;
                break;
              case TerrainType.TUNDRA:
                tileGood = GoodType.FURS;
                break;
            }
            if (tileGood === good) {
              prod += amount;
            }
          }
        }
      }
    });

    // Building bonuses
    if (good === GoodType.LUMBER && buildings.includes(BuildingType.LUMBER_MILL)) prod += 2;
    if (good === GoodType.ORE && buildings.includes(BuildingType.IRON_WORKS)) prod += 2;

    // Food consumption
    if (good === GoodType.FOOD) {
        prod -= population * 2;
    }

    return prod;
  };

  const cap = buildings.includes(BuildingType.WAREHOUSE) ? 400 : 200;

  return (
    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 shadow-inner">
      <h3 className="text-lg font-black uppercase tracking-tight mb-4 text-slate-300 flex justify-between items-center">
        Inventory
        <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Cap: {cap}</span>
      </h3>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-500 text-[10px] uppercase tracking-widest">
            <th className="pb-2 font-bold">Good</th>
            <th className="pb-2 font-bold">Stock</th>
            <th className="pb-2 font-bold text-right">Net/Turn</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(GoodType).map((good) => {
            const stock = inventory.get(good) || 0;
            const net = calculateProduction(good);
            return (
              <tr key={good} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                <td className="py-2 text-slate-300 font-medium capitalize">{good.toLowerCase().replace('_', ' ')}</td>
                <td className="py-2 font-mono font-bold">{stock}</td>
                <td className={`py-2 text-right font-mono font-bold ${net > 0 ? 'text-green-400' : net < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                  {net > 0 ? '+' : ''}{net}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
