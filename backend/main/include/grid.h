#ifndef GRID_H
#define GRID_H

#include <span>
#include <vector>

#include "point.h"
#include "segment.h"

class Grid {
public:
    Grid(Point left_down_point, Point right_up_point, std::span<Segment> borders);
    Grid(const Grid &) = default;
    Grid(Grid &&) noexcept = default;
    Grid &operator=(const Grid &) = default;
    Grid &operator=(Grid &&) noexcept = default;
    ~Grid() noexcept = default;

    bool is_intersecting(const Segment &route) const noexcept;
private:
    Point left_down_point;
    Point right_up_point;
    std::vector<Segment> _borders;
};

#endif // GRID_H
