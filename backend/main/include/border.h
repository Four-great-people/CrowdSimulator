#ifndef BORDER_H
#define BORDER_H

#include "segment.h"

class Border {
public:
    Border(const Point &first, const Point &second);
    explicit Border(const Segment &segment);
    Border(const Border &) = default;
    Border(Border &&) noexcept = default;
    Border &operator=(const Border &) = default;
    Border &operator=(Border &&) noexcept = default;
    ~Border() noexcept = default;

    const Point &get_first() const noexcept;
    const Point &get_second() const noexcept;
    bool is_intersecting(const Segment &route) const noexcept;
private:
    Point _first;
    Point _second;
};

#endif // BORDER_H
