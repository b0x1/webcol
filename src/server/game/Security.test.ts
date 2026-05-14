import { describe, expect, it } from 'vitest';
import { EconomySystem } from '@shared/game/systems/EconomySystem';
import { LocalGameServer } from './LocalGameServer';
import { GoodType, JobType, Nation, UnitType } from '@shared/game/entities/types';
import type { BuildingType } from '@shared/game/entities/types';
import type { Player } from '@shared/game/entities/Player';
import type { Unit } from '@shared/game/entities/Unit';
import { createInitialAuthoritativeGameState } from './createInitialAuthoritativeGameState';

describe('Security Vulnerabilities', () => {
  describe('EconomySystem Gold Exploit', () => {
    it('prevents buying negative amounts of goods to gain gold (exploit)', () => {
      const initialGold = 100;
      const amount = -1000;
      const price = 5;

      const result = EconomySystem.buyGood(initialGold, GoodType.FOOD, amount, price);

      expect(result.cost).toBeGreaterThanOrEqual(0);
      expect(result.canAfford).toBe(false);
    });

    it('prevents selling negative amounts of goods (logic error)', () => {
      const amount = -1000;
      const price = 5;
      const unit = { cargo: new Map([[GoodType.FOOD, 100]]) } as unknown as Unit;

      const result = EconomySystem.sellGood({} as unknown as Player, unit, GoodType.FOOD, amount, price);

      expect(result.actualSellAmount).toBeGreaterThanOrEqual(0);
      expect(result.goldGained).toBeGreaterThanOrEqual(0);
    });
  });

  describe('LocalGameServer Input Validation', () => {
    it('prevents assigning invalid job strings that could cause logic errors', () => {
      const server = new LocalGameServer();
      const state = createInitialAuthoritativeGameState();

      const player: Player = {
        id: 'player-1',
        name: 'Test',
        isHuman: true,
        gold: 100,
        nation: Nation.ENGLAND,
        units: [],
        settlements: [{
          id: 's1',
          ownerId: 'player-1',
          name: 'Test Settlement',
          position: { x: 0, y: 0 },
          population: 1,
          buildings: [],
          inventory: new Map(),
          productionQueue: [],
          units: [{
            id: 'u1',
            ownerId: 'player-1',
            name: 'Unit 1',
            type: UnitType.COLONIST,
            position: { x: 0, y: 0 },
            movesRemaining: 3,
            maxMoves: 3,
            isSkipping: false,
            cargo: new Map(),
            occupation: { kind: 'RURE', state: 'MOVING' },
            turnsInJob: 0
          }],
          goods: new Map(),
          hammers: 0,
          culture: 'EUROPEAN',
          organization: 'STATE',
          attitude: 'NEUTRAL'
        }]
      };

      state.players = [player];
      state.currentPlayerId = 'player-1';
      server.replaceState(state);

      server.dispatch({
        type: 'assignJob',
        settlementId: 's1',
        unitId: 'u1',
        job: 'INVALID_JOB_TYPE' as unknown as string
      });

      const playerState = server.getState().players[0];
      const updatedSettlement = playerState?.settlements[0];
      const unit = updatedSettlement?.units[0];

      expect(unit?.occupation).toEqual({ kind: 'RURE', state: 'MOVING' });
    });

    it('prevents buying invalid building types', () => {
        const server = new LocalGameServer();
        const state = createInitialAuthoritativeGameState();

        const player: Player = {
          id: 'player-1',
          name: 'Test',
          isHuman: true,
          gold: 100,
          nation: Nation.ENGLAND,
          units: [],
          settlements: [{
            id: 's1',
            ownerId: 'player-1',
            name: 'Test Settlement',
            position: { x: 0, y: 0 },
            population: 0,
            buildings: [],
            inventory: new Map(),
            productionQueue: [],
            units: [],
            goods: new Map(),
            hammers: 0,
            culture: 'EUROPEAN',
            organization: 'STATE',
            attitude: 'NEUTRAL'
          }]
        };

        state.players = [player];
        state.currentPlayerId = 'player-1';
        server.replaceState(state);

        server.dispatch({
          type: 'buyBuilding',
          settlementId: 's1',
          building: 'INVALID_BUILDING' as unknown as BuildingType
        });

        const playerState = server.getState().players[0];
        const updatedSettlement = playerState?.settlements[0];
        expect(updatedSettlement?.productionQueue).not.toContain('INVALID_BUILDING');
    });

    it('prevents a player from assigning jobs in a settlement they do not own (authorization bypass)', () => {
      const server = new LocalGameServer();
      const state = createInitialAuthoritativeGameState();

      const player1: Player = {
        id: 'player-1',
        name: 'Player 1',
        isHuman: true,
        gold: 100,
        nation: Nation.ENGLAND,
        units: [],
        settlements: []
      };

      const player2: Player = {
        id: 'player-2',
        name: 'Player 2',
        isHuman: false,
        gold: 100,
        nation: Nation.FRANCE,
        units: [],
        settlements: [{
          id: 's2',
          ownerId: 'player-2',
          name: 'Player 2 Settlement',
          position: { x: 5, y: 5 },
          population: 1,
          buildings: [],
          inventory: new Map(),
          productionQueue: [],
          units: [{
            id: 'u2',
            ownerId: 'player-2',
            name: 'Unit 2',
            type: UnitType.COLONIST,
            position: { x: 5, y: 5 },
            movesRemaining: 3,
            maxMoves: 3,
            isSkipping: false,
            cargo: new Map(),
            occupation: { kind: 'RURE', state: 'MOVING' },
            turnsInJob: 0
          }],
          goods: new Map(),
          hammers: 0,
          culture: 'EUROPEAN',
          organization: 'STATE',
          attitude: 'NEUTRAL'
        }]
      };

      state.players = [player1, player2];
      state.currentPlayerId = 'player-1'; // It's Player 1's turn
      server.replaceState(state);

      // Player 1 tries to assign a job to Player 2's unit in Player 2's settlement
      server.dispatch({
        type: 'assignJob',
        settlementId: 's2',
        unitId: 'u2',
        job: JobType.CARPENTER
      });

      const updatedPlayer2 = server.getState().players.find(p => p.id === 'player-2');
      const unit = updatedPlayer2?.settlements[0]?.units[0];

      // Occupation should still be RURE/MOVING, not FARMER
      expect(unit?.occupation).toEqual({ kind: 'RURE', state: 'MOVING' });
    });
  });
});
