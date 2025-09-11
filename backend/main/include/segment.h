#ifndef SEGMENT_H
#define SEGMENT_H

#include "point.h"

class Segment {
public:
    Segment(const Point &first, const Point &second);
    Segment(const Segment &) = default;
    Segment(Segment &&) noexcept = default;
    Segment &operator=(const Segment &) = default;
    Segment &operator=(Segment &&) noexcept = default;
    ~Segment() noexcept = default;

    const Point &get_first() const noexcept;
    const Point &get_second() const noexcept;
    bool is_intersecting(const Segment &route) const noexcept;
private:
    Point first;
    Point second;
};

#endif // SEGMENT_H
