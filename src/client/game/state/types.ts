import type { Tile } from '@shared/game/entities/Tile';
import type { Position } from '@shared/game/entities/Position';
import type { CombatResult } from '@shared/game/systems/CombatSystem';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type { NewGameParams, SaveGameState } from '@shared/game/protocol';
import type { BuildingType, GoodType, UnitType } from '@shared/game/entities/types';

export interface ClientViewState {
  selectedUnitId: string | null;
  selectedSettlementId: string | null;
  selectedTile: Tile | null;
  combatResult: CombatResult | null;
}

export interface GameState extends AuthoritativeGameState, ClientViewState {
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
  transferGood: (
    unitId: string,
    settlementId: string,
    good: GoodType,
    amount: number,
    direction: 'load' | 'unload',
  ) => void;
  sailToEurope: (unitId: string) => void;
  returnFromEurope: (unitId: string) => void;
  improveTile: (unitId: string) => void;
  recruitUnit: (unitType: UnitType) => void;
  tradeWithSettlement: (settlementId: string, unitId: string, goodOffered: GoodType) => void;
  learnFromSettlement: (settlementId: string, unitId: string) => void;
  attackSettlement: (settlementId: string, unitId: string) => void;
  resolveCombat: (attackerId: string, target: Position) => void;
  clearCombatResult: () => void;
  loadGameState: (state: SaveGameState) => void;
  initGame: (params: NewGameParams) => void;
  resetGame: () => void;
}
