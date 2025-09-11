#include "person.h"

Person::Person(Point position, Point goal, Grid *grid)
    : _position(position),
      _goal(goal),
      _personal_grid(grid)
{
    
}

std::vector<Point> Person::calculate_route() const {
    
}
