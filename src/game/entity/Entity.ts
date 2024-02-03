import { Sprite } from "../component/Sprite";
import { AxialCoordinate } from "./Coordinates";

abstract class Entity {

    constructor(public position: AxialCoordinate, public sprite: Sprite) {

    }

}

export default Entity;
