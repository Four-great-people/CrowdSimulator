#ifndef GRID_H
#define GRID_H

#include <span>
#include <vector>

#include "border.h"
#include "segment.h"

class Grid {
 public:
    explicit Grid(std::span<Border> borders, Point lower_left = Point(-50, -50),
                  Point upper_right = Point(50, 50));
    Grid(const Grid &) = default;
    Grid(Grid &&) noexcept = default;
    Grid &operator=(const Grid &) = default;
    Grid &operator=(Grid &&) noexcept = default;
    ~Grid() noexcept = default;

    bool is_intersecting(const Segment &route) const noexcept;
    bool is_incorrect_move(const Segment &route) const noexcept;
    Point get_lower_left() const noexcept;
    Point get_upper_right() const noexcept;

 private:
    std::vector<Border> _borders;
    Point _lower_left_point;
    Point _upper_right_point;
};

#endif  // GRID_H
