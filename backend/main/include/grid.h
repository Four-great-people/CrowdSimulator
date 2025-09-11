#ifndef GRID_H
#define GRID_H

#include <span>
#include <vector>

#include "segment.h"

class Grid {
public:
    explicit Grid(std::span<Segment> borders);
    Grid(const Grid &) = default;
    Grid(Grid &&) noexcept = default;
    Grid &operator=(const Grid &) = default;
    Grid &operator=(Grid &&) noexcept = default;
    ~Grid() noexcept = default;

    bool is_intersecting(const Segment &route) const noexcept;
private:
    std::vector<Segment> _borders;
};

#endif // GRID_H
