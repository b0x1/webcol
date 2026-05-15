import { RECRUITMENT_COSTS } from '@shared/game/constants';
import { calculatePopulation } from '@shared/game/entities/Settlement';
import { createUnit } from '@shared/game/entities/Unit';
import type { Player } from '@shared/game/entities/Player';
import type { Settlement } from '@shared/game/entities/Settlement';
import type { Position } from '@shared/game/entities/Position';
import type { Unit } from '@shared/game/entities/Unit';
import {
  Attitude,
  BuildingType,
  GoodType,
  JobType,
  Nation,
  TurnPhase,
  UnitType,
  type Occupation,
} from '@shared/game/entities/types';
import { GameSystem } from '@shared/game/systems/GameSystem';
import { NamingSystem } from '@shared/game/systems/NamingSystem';
import { TurnEngine } from '@shared/game/systems/TurnEngine';
import { MovementSystem } from '@shared/game/systems/MovementSystem';
import { UnitSystem } from '@shared/game/systems/UnitSystem';
import { SettlementSystem } from '@shared/game/systems/SettlementSystem';
import { EconomySystem } from '@shared/game/systems/EconomySystem';
import { ForeignInteractionSystem } from '@shared/game/systems/ForeignInteractionSystem';
import { CombatSystem } from '@shared/game/systems/CombatSystem';
import { AISystem } from '@shared/game/systems/AISystem';
import { TraversalUtils } from '@shared/game/utils/TraversalUtils';
import { generateId, random } from './utils';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type {
  GameCommand,
  GameEffect,
  GameStateMessage,
  NewGameParams,
  SaveGameState,
} from '@shared/game/protocol';
import { createInitialAuthoritativeGameState } from './createInitialAuthoritativeGameState';

type Listener = (message: GameStateMessage) => void;

export class LocalGameServer {
  private state: AuthoritativeGameState = createInitialAuthoritativeGameState();
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({ type: 'state', state: this.getState(), effects: [] });
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(command: GameCommand): GameStateMessage {
    const effects = this.applyCommand(command);
    const message: GameStateMessage = {
      type: 'state',
      state: this.getState(),
      effects,
    };

    for (const listener of this.listeners) {
      listener(message);
    }

    return message;
  }

  getState(): AuthoritativeGameState {
    return structuredClone(this.state);
  }

  replaceState(state: AuthoritativeGameState): void {
    this.state = structuredClone(state);
  }

  private applyCommand(command: GameCommand): readonly GameEffect[] {
    switch (command.type) {
      case 'initGame':
        return this.initGame(command.params);
      case 'loadGame':
        return this.loadGame(command.state);
      case 'resetGame':
        return this.resetGame();
      case 'moveUnit':
        return this.moveUnit(command.unitId, command.to);
      case 'activateUnit':
        return this.activateUnit(command.unitId);
      case 'stowUnit':
        return this.stowUnit(command.unitId);
      case 'skipUnit':
        return this.skipUnit(command.unitId);
      case 'endTurn':
        return this.endTurn();
      case 'foundSettlement':
        return this.foundSettlement(command.unitId);
      case 'buyBuilding':
        return this.buyBuilding(command.settlementId, command.building);
      case 'assignJob':
        return this.assignJob(command.settlementId, command.unitId, command.job);
      case 'sellGood':
        return this.sellGood(command.unitId, command.good, command.amount);
      case 'buyGood':
        return this.buyGood(command.unitId, command.good, command.amount);
      case 'recruitUnit':
        return this.recruitUnit(command.unitType, command.fromUnitId);
      case 'tradeWithSettlement':
        return this.tradeWithSettlement(command.settlementId, command.unitId, command.goodOffered);
      case 'learnFromSettlement':
        return this.learnFromSettlement(command.settlementId, command.unitId);
      case 'attackSettlement':
        return this.attackSettlement(command.settlementId, command.unitId);
      case 'resolveCombat':
        return this.resolveCombat(command.attackerId, command.target);
    }
  }

  private initGame(params: NewGameParams): readonly GameEffect[] {
    const { map, players, namingStats } = GameSystem.initGame({
      ...params,
      random,
      generateId,
    });

    this.state = {
      ...createInitialAuthoritativeGameState(),
      map,
      players,
      namingStats,
      currentPlayerId: 'player-1',
    };

    return [{ type: 'gameStarted' }];
  }

  private loadGame(savedState: SaveGameState): readonly GameEffect[] {
    this.state = {
      ...createInitialAuthoritativeGameState(),
      ...savedState,
      namingStats: this.state.namingStats,
    };

    return [{ type: 'gameStarted' }, { type: 'gameLoaded' }];
  }

  private resetGame(): readonly GameEffect[] {
    this.state = createInitialAuthoritativeGameState();
    return [{ type: 'returnToMainMenu' }];
  }

  private moveUnit(unitId: string, to: Position): readonly GameEffect[] {
    const player = this.selectCurrentPlayer();
    if (!player) {
      return [];
    }

    const unitIndex = player.units.findIndex((candidate) => candidate.id === unitId);
    const unit = player.units[unitIndex];
    if (!unit) {
      return [];
    }

    if (!UnitSystem.canMoveTo(unit, to.x, to.y, this.state.map)) {
      return [];
    }

    const targetTile = this.state.map[to.y]?.[to.x];
    if (!targetTile) {
      return [];
    }

    const from = { ...unit.position };
    unit.position = { ...to };
    unit.movesRemaining -= MovementSystem.getMovementCost(unit, targetTile);

    const settlement = TraversalUtils.findSettlementAt([player], to);
    if (settlement) {
      UnitSystem.enterSettlement(unit, player, settlement);
    }

    return [{
      type: 'unitMoved',
      id: unitId,
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
    }];
  }

  private activateUnit(unitId: string): readonly GameEffect[] {
    const player = this.selectCurrentPlayer();
    if (!player) {
      return [];
    }

    UnitSystem.exitSettlement(unitId, player);
    return [];
  }

  private stowUnit(unitId: string): readonly GameEffect[] {
    const player = this.selectCurrentPlayer();
    if (!player) {
      return [];
    }

    const unit = player.units.find((candidate) => candidate.id === unitId);
    if (!unit) {
      return [];
    }

    const settlement = TraversalUtils.findSettlementAt([player], unit.position);
    if (!settlement) {
      return [];
    }

    UnitSystem.enterSettlement(unit, player, settlement);
    return [];
  }

  private skipUnit(unitId: string): readonly GameEffect[] {
    const player = this.selectCurrentPlayer();
    if (!player) {
      return [];
    }

    const unit = player.units.find((candidate) => candidate.id === unitId);
    if (!unit) {
      return [];
    }

    unit.isSkipping = true;
    return [];
  }

  private foundSettlement(unitId: string): readonly GameEffect[] {
    const player = this.selectCurrentPlayer();
    if (!player) {
      return [];
    }

    const unitIndex = player.units.findIndex((candidate) => candidate.id === unitId);
    const unit = player.units[unitIndex];
    if (!unit) {
      return [];
    }

    const allSettlements = TraversalUtils.getAllSettlements(this.state.players);
    if (!SettlementSystem.canFoundSettlement(player, unit, this.state.map, allSettlements)) {
      return [];
    }

    const namingResult = NamingSystem.getNextName(player.nation, 'settlement', this.state.namingStats);
    this.state.namingStats = namingResult.updatedStats;

    const newSettlement = SettlementSystem.createSettlement(
      player,
      unit,
      namingResult.name,
      [BuildingType.TOWN_HALL, BuildingType.CARPENTERS_SHOP, BuildingType.BLACKSMITHS_HOUSE],
      this.state.map,
      random,
      generateId,
    );

    player.units.splice(unitIndex, 1);
    player.settlements.push(newSettlement);

    return [];
  }

  private buyBuilding(settlementId: string, building: BuildingType): readonly GameEffect[] {
    const player = this.selectCurrentPlayer();
    if (!player) {
      return [];
    }

    // Input validation: Ensure valid building type
    if (!Object.values(BuildingType).includes(building)) {
      return [];
    }

    const settlement = player.settlements.find((candidate) => candidate.id === settlementId);
    if (!settlement) {
      return [];
    }

    if (!settlement.buildings.includes(building) && !settlement.productionQueue.includes(building)) {
      settlement.productionQueue.push(building);
    }

    return [];
  }

  private assignJob(settlementId: string, unitId: string, job: string | null): readonly GameEffect[] {
    const settlement = this.selectSettlementById(settlementId);
    if (!settlement) {
      return [];
    }

    const owner = this.selectSettlementOwner(settlementId);
    if (owner?.id !== this.state.currentPlayerId) {
      return [];
    }

    if (job === null) {
      this.unassignUnitFromJob(settlement, owner, unitId);
      settlement.population = calculatePopulation(settlement);
      return [];
    }

    const validatedOccupation = this.validateOccupation(job);
    if (!validatedOccupation) {
      return [];
    }

    const unit = this.ensureUnitInSettlement(settlement, owner, unitId);
    if (!unit) {
      return [];
    }

    unit.occupation = validatedOccupation;
    settlement.population = calculatePopulation(settlement);
    return [];
  }

  private unassignUnitFromJob(settlement: Settlement, owner: Player, unitId: string): void {
    const unitIndex = settlement.units.findIndex((candidate) => candidate.id === unitId);
    const unit = settlement.units[unitIndex];
    if (unit) {
      unit.occupation = { kind: 'RURE', state: 'MOVING' };
      if (!owner.units.some((candidate) => candidate.id === unitId)) {
        owner.units.push({ ...unit });
      }
      settlement.units.splice(unitIndex, 1);
    }
  }

  private validateOccupation(job: string): Occupation | null {
    if (Object.values(JobType).includes(job as JobType)) {
      return job as JobType;
    }

    if (job.includes(',')) {
      const [rawX, rawY] = job.split(',').map(Number);
      if (
        rawX !== undefined &&
        rawY !== undefined &&
        Number.isInteger(rawX) &&
        Number.isInteger(rawY) &&
        rawX >= 0 &&
        rawY >= 0
      ) {
        return { kind: 'FIELD_WORK', tileX: rawX, tileY: rawY };
      }
    }

    return null;
  }

  private ensureUnitInSettlement(
    settlement: Settlement,
    owner: Player,
    unitId: string
  ): Unit | undefined {
    let unit = settlement.units.find((candidate) => candidate.id === unitId);
    if (!unit) {
      const playerUnitIndex = owner.units.findIndex((candidate) => candidate.id === unitId);
      const playerUnit = owner.units[playerUnitIndex];
      if (playerUnit) {
        unit = { ...playerUnit };
        settlement.units.push(unit);
        owner.units.splice(playerUnitIndex, 1);
      }
    }
    return unit;
  }

  private sellGood(unitId: string, good: GoodType, amount: number): readonly GameEffect[] {
    // Input validation: Ensure valid good type and positive amount
    if (!Object.values(GoodType).includes(good) || amount <= 0 || !Number.isInteger(amount)) {
      return [];
    }

    const player = this.selectCurrentPlayer();
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    if (!player || !unit) {
      return [];
    }

    const price = this.state.europePrices[good];
    const { goldGained, newPrice, actualSellAmount } = EconomySystem.sellGood(
      player,
      unit,
      good,
      amount,
      price
    );

    if (actualSellAmount <= 0) {
      return [];
    }

    unit.cargo.set(good, (unit.cargo.get(good) ?? 0) - actualSellAmount);
    player.gold += goldGained;
    this.state.europePrices[good] = newPrice;
    return [];
  }

  private buyGood(unitId: string, good: GoodType, amount: number): readonly GameEffect[] {
    // Input validation: Ensure valid good type and positive amount
    if (!Object.values(GoodType).includes(good) || amount <= 0 || !Number.isInteger(amount)) {
      return [];
    }

    const player = this.selectCurrentPlayer();
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    if (!player || !unit) {
      return [];
    }

    const { cost, canAfford } = EconomySystem.buyGood(
      player.gold,
      good,
      amount,
      this.state.europePrices[good]
    );

    if (!canAfford) {
      return [];
    }

    unit.cargo.set(good, (unit.cargo.get(good) ?? 0) + amount);
    player.gold -= cost;
    return [];
  }

  private recruitUnit(unitType: UnitType, fromUnitId: string | null): readonly GameEffect[] {
    const player = this.selectCurrentPlayer();
    if (!player) {
      return [];
    }

    // Input validation: Ensure valid recruitable unit type
    const costs: Record<string, number> = {
      ...RECRUITMENT_COSTS,
      [UnitType.SHIP]: 0,
    };
    if (!Object.keys(costs).includes(unitType)) {
      return [];
    }

    const selectedShip = player.units.find(
      (unit) => unit.id === fromUnitId && unit.type === UnitType.SHIP
    );

    if (!selectedShip) {
      return [];
    }

    let goldCost = costs[unitType] ?? 0;
    if (unitType === UnitType.SOLDIER && player.nation === Nation.SPAIN) {
      goldCost = 600;
    }

    if (player.gold < goldCost) {
      return [];
    }

    let musketsToConsume = 0;
    if (unitType === UnitType.SOLDIER) {
      musketsToConsume = 50;
      const currentMuskets = selectedShip.cargo.get(GoodType.MUSKETS) ?? 0;
      if (currentMuskets < musketsToConsume) {
        return [];
      }
    }

    if (musketsToConsume > 0) {
      selectedShip.cargo.set(
        GoodType.MUSKETS,
        (selectedShip.cargo.get(GoodType.MUSKETS) ?? 0) - musketsToConsume
      );
    }

    player.gold -= goldCost;
    const namingResult = NamingSystem.getNextName(
      player.nation,
      unitType === UnitType.SHIP ? 'ship' : 'unit',
      this.state.namingStats
    );
    this.state.namingStats = namingResult.updatedStats;

    player.units.push(createUnit(
      generateId('unit'),
      player.id,
      namingResult.name,
      unitType,
      selectedShip.position.x,
      selectedShip.position.y,
      1
    ));

    return [];
  }

  private tradeWithSettlement(settlementId: string, unitId: string, goodOffered: GoodType): readonly GameEffect[] {
    // Input validation: Ensure valid good type
    if (!Object.values(GoodType).includes(goodOffered)) {
      return [];
    }

    const player = this.selectCurrentPlayer();
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    if (!player || !unit) {
      return [];
    }

    const foreignPlayer = this.selectSettlementOwner(settlementId);
    if (!foreignPlayer) {
      return [];
    }

    const settlementIndex = foreignPlayer.settlements.findIndex((candidate) => candidate.id === settlementId);
    const settlement = foreignPlayer.settlements[settlementIndex];
    if (!settlement) {
      return [];
    }

    // Defensive guard: Ensure unit has the good before trading to avoid unhandled exception
    if ((unit.cargo.get(goodOffered) ?? 0) <= 0) {
      return [];
    }

    const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.trade(
      settlement,
      unit,
      goodOffered,
      random
    );

    foreignPlayer.settlements[settlementIndex] = updatedSettlement;
    const unitIndex = player.units.findIndex((candidate) => candidate.id === unitId);
    if (player.units[unitIndex]) {
      player.units[unitIndex] = updatedUnit;
    }

    return [];
  }

  private learnFromSettlement(settlementId: string, unitId: string): readonly GameEffect[] {
    const player = this.selectCurrentPlayer();
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    if (!player || !unit) {
      return [];
    }

    const foreignPlayer = this.selectSettlementOwner(settlementId);
    if (!foreignPlayer) {
      return [];
    }

    const settlementIndex = foreignPlayer.settlements.findIndex((candidate) => candidate.id === settlementId);
    const settlement = foreignPlayer.settlements[settlementIndex];
    if (!settlement) {
      return [];
    }

    // Defensive guards: Ensure preconditions are met before learning to avoid unhandled exceptions
    if (settlement.attitude !== Attitude.FRIENDLY || unit.type !== UnitType.COLONIST) {
      return [];
    }

    const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.learn(settlement, unit);
    foreignPlayer.settlements[settlementIndex] = updatedSettlement;

    const unitIndex = player.units.findIndex((candidate) => candidate.id === unitId);
    if (player.units[unitIndex]) {
      player.units[unitIndex] = updatedUnit;
    }

    return [];
  }

  private attackSettlement(settlementId: string, unitId: string): readonly GameEffect[] {
    const settlement = this.selectSettlementById(settlementId);
    if (!settlement) {
      return [];
    }

    return this.resolveCombat(unitId, settlement.position);
  }

  private resolveCombat(attackerId: string, target: Position): readonly GameEffect[] {
    const player = this.selectCurrentPlayer();
    if (!player) {
      return [];
    }

    const attacker = player.units.find((candidate) => candidate.id === attackerId);
    if (!attacker) {
      return [];
    }

    const otherPlayers = this.state.players.filter((candidate) => candidate.id !== this.state.currentPlayerId);
    const defenderUnit = TraversalUtils.findUnitsAt(otherPlayers, target)[0];
    const defenderSettlement = TraversalUtils.findSettlementAt(this.state.players, target);
    const defender = defenderUnit ?? (
      defenderSettlement && defenderSettlement.ownerId !== this.state.currentPlayerId
        ? defenderSettlement
        : undefined
    );

    if (!defender) {
      return [];
    }

    const defenderTile = this.state.map[target.y]?.[target.x];
    if (!defenderTile) {
      return [];
    }

    const result = CombatSystem.resolveCombat(
      attacker,
      defender,
      defenderTile,
      defenderSettlement,
      random
    );

    if (result.winner === 'attacker') {
      this.handleCombatVictory(player, attacker, defender, target);
    } else {
      this.handleCombatDefeat(player, attackerId);
    }

    return [{ type: 'combatResolved', result }];
  }

  private handleCombatVictory(
    attackerPlayer: Player,
    attackerUnit: Unit,
    defender: Unit | Settlement,
    target: Position
  ): void {
    const defenderPlayer = this.selectUnitOwner(defender.id);
    if (defenderPlayer) {
      const unitIndex = defenderPlayer.units.findIndex((candidate) => candidate.id === defender.id);
      if (unitIndex !== -1) {
        defenderPlayer.units.splice(unitIndex, 1);
      }
    }

    const capturedSettlementPlayer = this.selectSettlementOwner(defender.id);
    if (capturedSettlementPlayer && capturedSettlementPlayer.id !== this.state.currentPlayerId) {
      const settlementIndex = capturedSettlementPlayer.settlements.findIndex(
        (candidate) => candidate.id === defender.id
      );
      const settlement = capturedSettlementPlayer.settlements[settlementIndex];
      if (settlement) {
        if (settlement.units.length > 1) {
          settlement.units.pop();
          settlement.population = calculatePopulation(settlement);
        }

        attackerUnit.position = { ...target };
        attackerUnit.movesRemaining = 0;
        settlement.ownerId = attackerPlayer.id;
        settlement.units.forEach((unit) => {
          unit.ownerId = attackerPlayer.id;
        });

        attackerPlayer.settlements.push(settlement);
        capturedSettlementPlayer.settlements.splice(settlementIndex, 1);
      }
    }
  }

  private handleCombatDefeat(player: Player, attackerId: string): void {
    const attackerIndex = player.units.findIndex((candidate) => candidate.id === attackerId);
    if (attackerIndex !== -1) {
      player.units.splice(attackerIndex, 1);
    }
  }

  private endTurn(): readonly GameEffect[] {
    const effects: GameEffect[] = [];
    const phases: TurnPhase[] = [
      TurnPhase.MOVEMENT,
      TurnPhase.PRODUCTION,
      TurnPhase.TRADE,
      TurnPhase.AI,
      TurnPhase.END_TURN,
    ];

    for (;;) {
      const currentPhaseIndex = phases.indexOf(this.state.phase);
      if (currentPhaseIndex < phases.length - 1) {
        this.state.phase = phases[currentPhaseIndex + 1] ?? TurnPhase.MOVEMENT;
      } else {
        if (this.state.players.length === 0) {
          this.state.phase = TurnPhase.MOVEMENT;
          return effects;
        }
        this.advanceToNextPlayer(effects);
        this.state.phase = TurnPhase.MOVEMENT;
      }

      this.processPhase(effects);

      if (this.isHumanControllablePhase()) {
        return effects;
      }
    }
  }

  private advanceToNextPlayer(effects: GameEffect[]): void {
    const currentPlayerIndex = this.state.players.findIndex(
      (player) => player.id === this.state.currentPlayerId
    );
    const nextPlayerIndex = (currentPlayerIndex + 1) % this.state.players.length;
    const nextPlayer = this.state.players[nextPlayerIndex];
    if (!nextPlayer) {
      return;
    }

    const nextTurn = nextPlayerIndex === 0 ? this.state.turn + 1 : this.state.turn;
    if (nextTurn > this.state.turn && nextPlayerIndex === 0) {
      effects.push({ type: 'autosaveRequested' });
    }

    this.state.players.forEach((player) => {
      if (player.id === nextPlayer.id) {
        player.units.forEach((unit) => {
          unit.movesRemaining = unit.maxMoves;
          unit.isSkipping = false;
        });
      }
    });

    this.state.currentPlayerId = nextPlayer.id;
    this.state.turn = nextTurn;
  }

  private processPhase(effects: GameEffect[]): void {
    if (this.state.phase === TurnPhase.PRODUCTION) {
      const result = TurnEngine.runProduction(
        this.state.players,
        this.state.map,
        this.state.namingStats,
        generateId
      );
      this.state.players = result.players;
      this.state.namingStats = result.namingStats;
      effects.push(...result.effects);
    } else if (this.state.phase === TurnPhase.AI) {
      const aiResult = AISystem.runAITurn(
        this.state.players,
        this.state.map,
        this.state.namingStats,
        random,
        generateId,
      );

      this.state.players = aiResult.players;
      this.state.namingStats = aiResult.namingStats;
      effects.push(...aiResult.effects);
    }
  }

  private isHumanControllablePhase(): boolean {
    if (this.state.phase !== TurnPhase.MOVEMENT) {
      return false;
    }

    const currentPlayer = this.selectCurrentPlayer();
    return !!currentPlayer?.isHuman;
  }

  private selectCurrentPlayer(): Player | undefined {
    return TraversalUtils.findPlayerById(this.state.players, this.state.currentPlayerId);
  }

  private selectSettlementById(settlementId: string): Settlement | undefined {
    return TraversalUtils.findSettlementById(this.state.players, settlementId);
  }

  private selectSettlementOwner(settlementId: string): Player | undefined {
    return TraversalUtils.findSettlementOwner(this.state.players, settlementId);
  }

  private selectUnitOwner(unitId: string): Player | undefined {
    return TraversalUtils.findUnitOwner(this.state.players, unitId);
  }
}
