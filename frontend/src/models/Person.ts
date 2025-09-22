class Person {
    id: number;
    position: { x: number, y: number };
    goal: { x: number, y: number };
    reachedGoal: boolean;

    constructor(id: number, position: { x: number, y: number }, goal: { x: number, y: number }, reachedGoal: boolean = false) {
        this.id = id;
        this.position = position;
        this.goal = goal;
        this.reachedGoal = reachedGoal;
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

    clone(): Person {
        return new Person(
            this.id,
            { ...this.position },
            { ...this.goal },
            this.reachedGoal
        );
    }
}

export default Person;