class Person {
    id: number;
    position: { x: number, y: number };
    goal: { x: number, y: number };
    reachedGoal: boolean;

    constructor(id: number, position: { x: number, y: number }, goal: { x: number, y: number }) {
        this.id = id;
        this.position = position;
        this.goal = goal;
        this.reachedGoal = false;
    }

    updatePosition(newPosition: { x: number, y: number }) {
        this.position = newPosition;
    }

    updateGoal(newGoal: { x: number, y: number }) {
        this.goal = newGoal;
    }

    getInfo() {
        return {
            id: this.id,
            position: this.position,
            goal: this.goal,
        };
    }
}

export default Person;