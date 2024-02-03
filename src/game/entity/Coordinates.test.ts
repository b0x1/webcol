import { AxialCoordinate } from './Coordinates';

describe('AxialCoordinate', () => {
  it('should create an instance of AxialCoordinate with provided values', () => {
    const axialCoordinate = new AxialCoordinate(2, 3);

    expect(axialCoordinate.q).toBe(2);
    expect(axialCoordinate.r).toBe(3);
  });

  it('should correctly convert AxialCoordinate to Cube coordinates', () => {
    const axialCoordinate = new AxialCoordinate(2, 3);
    const cubeCoordinates = axialCoordinate.toCube();

    expect(cubeCoordinates.x).toBe(2);
    expect(cubeCoordinates.y).toBe(-5); // -2 - 3
    expect(cubeCoordinates.z).toBe(3);
  });

  it('should correctly calculate distance between two AxialCoordinates', () => {
    const axialCoordinate1 = new AxialCoordinate(-3, +2);
    const axialCoordinate2 = new AxialCoordinate(+2, 0);

    expect(axialCoordinate1.calculateDistanceTo(axialCoordinate2)).toBe(5);
  });

});
