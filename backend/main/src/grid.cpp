#include "grid.h"

#include <algorithm>

#include "border.h"
#include "point.h"

Grid::Grid(std::span<Border> borders, Point lower_left, Point upper_right)
    : _borders(borders.begin(), borders.end()),
      _lower_left_point(lower_left),
      _upper_right_point(upper_right) {}

bool Grid::is_intersecting(const Segment &route) const noexcept {
    return std::any_of(
        _borders.begin(), _borders.end(),
        [&route](const auto &border) { return border.is_intersecting(route); });
}

bool Grid::is_incorrect_move(const Segment &route) const noexcept {
    const Point &position = route.get_second();
    return is_intersecting(route) ||
           position.get_x() > get_upper_right().get_x() ||
           position.get_x() < get_lower_left().get_x() ||
           position.get_y() > get_upper_right().get_y() ||
           position.get_y() < get_lower_left().get_y();
}

Point Grid::get_lower_left() const noexcept { return _lower_left_point; }

Point Grid::get_upper_right() const noexcept { return _upper_right_point; }
