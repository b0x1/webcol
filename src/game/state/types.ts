import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Position } from '../entities/Position';
import type { CombatResult } from '../systems/CombatSystem';
import type { NamingStats } from '../systems/NamingSystem';
import type { BuildingType, GoodType, Nation, TurnPhase, UnitType } from '../entities/types';

export interface GameState {
  players: Player[];
  currentPlayerId: string;
  turn: number;
  phase: TurnPhase;
  selectedUnitId: string | null;
  selectedSettlementId: string | null;
  europePrices: Record<GoodType, number>;
  map: Tile[][];
  selectedTile: Tile | null;
  combatResult: CombatResult | null;
  namingStats: NamingStats;

  selectUnit: (unitId: string | null) => void;
  selectTile: (tile: Tile | null, options?: { skipAutoSelection?: boolean }) => void;
  selectNextUnit: () => void;
  skipUnit: (unitId: string) => void;
  selectSettlement: (settlementId: string | null) => void;
  moveUnit: (unitId: string, to: Position) => void;
  endTurn: () => void;
  foundSettlement: (unitId: string) => void;
  buyBuilding: (settlementId: string, building: BuildingType) => void;
  assignJob: (settlementId: string, unitId: string, job: string | null) => void;
  sellGood: (unitId: string, good: GoodType, amount: number) => void;
  buyGood: (unitId: string, good: GoodType, amount: number) => void;
  recruitUnit: (unitType: UnitType) => void;
  tradeWithSettlement: (settlementId: string, unitId: string, goodOffered: GoodType) => void;
  learnFromSettlement: (settlementId: string, unitId: string) => void;
  attackSettlement: (settlementId: string, unitId: string) => void;
  resolveCombat: (attackerId: string, target: Position) => void;
  clearCombatResult: () => void;
  loadGameState: (state: Partial<GameState>) => void;
  initGame: (params: { playerName: string; nation: Nation; mapSize: 'Small' | 'Medium' | 'Large'; aiCount: number }) => void;
  resetGame: () => void;
}
