export class Wall {
    first: { x: number; y: number };
    second: { x: number; y: number };
    direction: 'horizontal' | 'vertical';

    constructor(first: { x: number; y: number }, second: { x: number; y: number }) {
        this.first = first;
        this.second = second;
        this.direction = first.x === second.x ? 'vertical' : 'horizontal';
    }

    toJSON() {
        return {
            first: this.first,
            second: this.second
        };
    }

    clone(): Wall {
        return new Wall(
            { ...this.first },
            { ...this.second }
        );
    }
}

export default Wall