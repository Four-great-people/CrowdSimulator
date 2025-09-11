#include "grid.h"

#include <algorithm>

Grid::Grid(std::span<Segment> borders)
    : _borders(borders.begin(), borders.end()) {}

bool Grid::is_intersecting(const Segment &route) const noexcept {
    return std::any_of(
        _borders.begin(), _borders.end(),
        [&route](const auto &border) { return border.is_intersecting(route); });
}
