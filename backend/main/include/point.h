#ifndef POINT_H
#define POINT_H

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
private:
    int _x;
    int _y;
};

#endif // POINT_H
