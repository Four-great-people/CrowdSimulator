#ifndef POINT_H
#define POINT_H

#include <functional>
class Point {
   public:
    Point(int x, int y);
    Point(const Point &) = default;
    Point(Point &&) noexcept = default;
    Point &operator=(const Point &) = default;
    Point &operator=(Point &&) noexcept = default;
    ~Point() noexcept = default;

    bool operator==(const Point &other) const noexcept;
    bool operator!=(const Point &other) const noexcept;
    Point operator-(const Point &other) const noexcept;

    int get_x() const noexcept;
    int get_y() const noexcept;
    long long cross_product(const Point &other) const noexcept;
    std::vector<Point> get_neighbors() const noexcept;
    long long abs_norm() const noexcept;

   private:
    int _x;
    int _y;
};

namespace std {
template <>
struct hash<Point> {
    std::size_t operator()(const Point &point) const noexcept {
        return 31 * std::hash<int>()(point.get_x()) +
               std::hash<int>()(point.get_y());
    }
};
}  // namespace std

#endif  // POINT_H
