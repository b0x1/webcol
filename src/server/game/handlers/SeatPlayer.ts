import { AISystem } from '@shared/game/systems/AISystem';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type { GameCommand, GameEffect } from '@shared/game/protocol';
import { SettlementCommandHandler } from '@server/game/handlers/SettlementCommandHandler';
import { UnitCommandHandler } from '@server/game/handlers/UnitCommandHandler';

export function playSeat(
  state: AuthoritativeGameState,
  random: () => number,
  generateId: (prefix: string) => string,
): readonly GameEffect[] {
  const effects: GameEffect[] = [];
  for (const command of AISystem.chooseCommands(state)) {
    effects.push(...applySeatCommand(state, command, random, generateId));
  }
  return effects;
}

function applySeatCommand(
  state: AuthoritativeGameState,
  command: GameCommand,
  random: () => number,
  generateId: (prefix: string) => string,
): readonly GameEffect[] {
  switch (command.type) {
    case 'moveUnit':
      return UnitCommandHandler.moveUnit(state, command.unitId, command.to);
    case 'foundSettlement':
      return SettlementCommandHandler.foundSettlement(state, command.unitId, random, generateId);
    case 'assignJob':
      return SettlementCommandHandler.assignJob(state, command.settlementId, command.unitId, command.job);
    case 'skipUnit':
      return UnitCommandHandler.skipUnit(state, command.unitId);
    default:
      return [];
  }
}
