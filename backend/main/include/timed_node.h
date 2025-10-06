#ifndef TIMED_NODE_H
#define TIMED_NODE_H

#include "point.h"
#include <memory>

struct TimedNode {
    Point position;
    int g;
    int h;
    int f;
    int time;
    std::shared_ptr<TimedNode> parent;
    
    TimedNode(Point pos, int g_val, int h_val, int t, std::shared_ptr<TimedNode> p = nullptr)
        : position(pos), g(g_val), h(h_val), f(g_val + h_val), time(t), parent(p) {}
    
    struct Compare {
        bool operator()(const std::shared_ptr<TimedNode>& a, const std::shared_ptr<TimedNode>& b) const {
            return a->f > b->f;
        }
    };
};

#endif // TIMED_NODE_H