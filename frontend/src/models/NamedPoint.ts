class NamedPoint {
    id: number;
    position: { x: number, y: number };
    reachedGoal: boolean;

    constructor(id: number, position: { x: number, y: number }, reachedGoal: boolean = false) {
        this.id = id;
        this.position = position;
        this.reachedGoal = reachedGoal;
    }

    updatePosition(newPosition: { x: number, y: number }) {
        this.position = newPosition;
    }

    getInfo() {
        return {
            id: this.id,
            position: this.position,
        };
    }

    clone(): NamedPoint {
        return new NamedPoint(
            this.id,
            { ...this.position },
            this.reachedGoal
        );
    }
}

export default NamedPoint;