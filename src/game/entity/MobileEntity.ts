import Entity from './Entity';
import { AxialCoordinate } from './Coordinates';

abstract class MobileEntity extends Entity {

  move(newPosition: AxialCoordinate): void {
    this.position = newPosition;
  }
}

export default MobileEntity;
