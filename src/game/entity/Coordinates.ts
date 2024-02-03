export class AxialCoordinate {
    constructor(public q: integer, public r: integer) {
    }

    toCube(): CubeCoordinate {
        const x = this.q;
        const z = this.r;
        const y = -x - z;
        return new CubeCoordinate(x, y, z);
    }

    calculateDistanceTo(other: AxialCoordinate): number {
        const cubeCoordinatesThis: CubeCoordinate = this.toCube();
        const cubeCoordinatesOther: CubeCoordinate = other.toCube();

        return (
            (Math.abs(cubeCoordinatesThis.x - cubeCoordinatesOther.x) +
                Math.abs(cubeCoordinatesThis.y - cubeCoordinatesOther.y) +
                Math.abs(cubeCoordinatesThis.z - cubeCoordinatesOther.z)) / 2
        );
    }

}

export class CubeCoordinate {
    constructor(public x: integer, public y: integer, public z: integer) {

    }
}

