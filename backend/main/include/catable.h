#ifndef CATABLE_H
#define CATABLE_H

#include "actions.h"
#include "point.h"
#include <unordered_map>
#include <unordered_set>
#include <vector>

struct TimePoint {
    int x;
    int y;
    int t;
    
    bool operator==(const TimePoint& other) const {
        return x == other.x && y == other.y && t == other.t;
    }
};

struct TimePointHash {
    std::size_t operator()(const TimePoint& tp) const {
        return std::hash<int>()(tp.x) ^ 
               (std::hash<int>()(tp.y) << 1) ^ 
               (std::hash<int>()(tp.t) << 2);
    }
};

class CATable {
private:
    std::unordered_set<TimePoint, TimePointHash> _pos_time_table;
    std::unordered_map<Point, int> _last_visit_table;

public:
    void add_trajectory(int traj_id, const std::vector<Point>& trajectory);
    bool check_move(const Point& from, const Point& to, int start_time) const;
    int last_visited(const Point& point) const;
	bool has_agents_nearby(const Point& point, int radius = 1) const;
    std::vector<Point> get_neighbors_timestep(const Point& point, int time) const;

    constexpr static int wait_cost = get_cost(Action::WAIT);
    
private:
    bool is_cell_available(int x, int y, int t) const;
    bool is_reverse_move_valid(const Point& from, const Point& to, int t_start, int t_end) const;
    void add_time_point(int x, int y, int t);
};

#endif // CATABLE_H