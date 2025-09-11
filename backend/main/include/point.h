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

    int get_x() const noexcept;
    int get_y() const noexcept;
private:
    int _x;
    int _y;
};

#endif // POINT_H
