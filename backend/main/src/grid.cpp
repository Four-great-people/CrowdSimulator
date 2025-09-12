#include "grid.h"

#include <algorithm>

Grid::Grid(std::span<Segment> borders, Point lower_left, Point upper_right)
    : _borders(borders.begin(), borders.end()),
      _lower_left_point(lower_left),
      _upper_right_point(upper_right) {}

bool Grid::is_intersecting(const Segment &route) const noexcept {
    return std::any_of(
        _borders.begin(), _borders.end(),
        [&route](const auto &border) { return border.is_intersecting(route); });
}

Point Grid::get_lower_left() const noexcept { return _lower_left_point; }

Point Grid::get_upper_right() const noexcept { return _upper_right_point; }
