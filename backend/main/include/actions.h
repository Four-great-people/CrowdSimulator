#ifndef ACTIONS_H
#define ACTIONS_H

/*
WARNING: please, pay attention: order is crucial here
*/
enum class Action {
    UP,
    DOWN,
    LEFT,
    RIGHT,
    WAIT,
// ----------------
    LEFT_UP,
    RIGHT_UP,
    LEFT_DOWN,
    RIGHT_DOWN
};

constexpr int get_cost(Action action) {
    if (action <= Action::WAIT) {
        return 2;
    }
    return 3;
}

#endif // ACTIONS_H
