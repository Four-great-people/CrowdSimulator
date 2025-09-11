#include "grid.h"

Grid::Grid(Point left_down_point, Point right_up_point, std::span<Segment> borders)
    : left_down_point(left_down_point),
      right_up_point(right_up_point),
      _borders({})
{
    
}

bool Grid::is_intersecting(const Segment &route) const noexcept {
    
}
