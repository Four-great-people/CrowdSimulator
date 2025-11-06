#ifndef TIMED_NODE_H
#define TIMED_NODE_H

#include <memory>

#include "point.h"

struct TimedNode {
    Point position;
    int g;
    int h;
    int f;
    int time;
    int self_index;
    int parent_index;

    TimedNode(Point pos, int g_val, int h_val, int t, int ind, int p = -1)
        : position(pos),
          g(g_val),
          h(h_val),
          f(g_val + h_val),
          time(t),
          self_index(ind),
          parent_index(p) {}

    struct Compare {
        bool operator()(const std::shared_ptr<TimedNode>& a,
                        const std::shared_ptr<TimedNode>& b) const {
            return a->f > b->f;
        }
    };
};

#endif  // TIMED_NODE_H
