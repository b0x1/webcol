import React from 'react';
import { JobType } from '../../game/entities/types';
import { Unit } from '../../game/entities/Unit';
import { useGameStore } from '../../game/state/gameStore';

interface Props {
  colonyId: string;
  units: Unit[];
  workforce: Map<string, JobType>;
}

export const WorkforcePanel: React.FC<Props> = ({ colonyId, units, workforce }) => {
  const assignJob = useGameStore((state) => state.assignJob);

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#34495e',
      borderRadius: '8px',
      height: '100%',
      overflowY: 'auto'
    }}>
      <h3 style={{ marginTop: 0 }}>Workforce</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {units.map((unit) => {
          const currentJob = workforce.get(unit.id) || JobType.FARMER;
          return (
            <div key={unit.id} style={{
              padding: '8px',
              backgroundColor: '#2c3e50',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.9em' }}>{unit.type}</div>
                <div style={{ fontSize: '0.7em', color: '#bdc3c7' }}>ID: {unit.id.slice(0, 8)}</div>
              </div>
              <select
                value={currentJob}
                onChange={(e) => assignJob(colonyId, unit.id, e.target.value as JobType)}
                style={{
                  backgroundColor: '#34495e',
                  color: 'white',
                  border: '1px solid #7f8c8d',
                  borderRadius: '2px',
                  padding: '2px'
                }}
              >
                {Object.values(JobType).map((job) => (
                  <option key={job} value={job}>{job}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};
