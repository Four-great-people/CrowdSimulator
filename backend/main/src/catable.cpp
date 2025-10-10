#include "catable.h"
#include <algorithm>
#include <limits>

void CATable::add_trajectory(int traj_id, const std::vector<Point>& trajectory) {
    for (int t = 0; t < trajectory.size(); ++t) {
        const Point& coord = trajectory[t];
        TimePoint tp = {coord.get_x(), coord.get_y(), t};
        _pos_time_table[tp] = traj_id;
        _last_visit_table[coord] = std::max(t, _last_visit_table[coord]);
    }
	
}

bool CATable::check_move(const Point& from, const Point& to, int start_time) const {
	if (from == to) {
        return is_cell_available(from.get_x(), from.get_y(), start_time + 1);
    }
    if (!is_cell_available(to.get_x(), to.get_y(), start_time + 1)) {
        return false;
    }

    return is_reverse_move_valid(from, to, start_time, start_time + 1);
}

int CATable::last_visited(const Point& point) const {
    auto last_it = _last_visit_table.find(point);
    if (last_it != _last_visit_table.end()) {
        return last_it->second;
    }
    return -1;
}

bool CATable::is_cell_available(int x, int y, int t) const {
    TimePoint tp = {x, y, t};
    return _pos_time_table.find(tp) == _pos_time_table.end();
}

bool CATable::is_reverse_move_valid(const Point& from, const Point& to, int t_start, int t_end) const {
    bool someone_moving_from_to_to_from = 
        !is_cell_available(from.get_x(), from.get_y(), t_end) && 
        !is_cell_available(to.get_x(), to.get_y(), t_start);
    
    return !someone_moving_from_to_to_from;
}

std::vector<Point> CATable::get_neighbors_timestep(const Point& point, int time) const {
    auto neighbors = point.get_neighbors();
    neighbors.push_back(point);
    
    std::vector<Point> valid_neighbors;
    for (const auto& neighbor : neighbors) {
        if (check_move(point, neighbor, time)) {
            valid_neighbors.push_back(neighbor);
        }
    }
    
    return valid_neighbors;
}