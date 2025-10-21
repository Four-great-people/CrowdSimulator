#include "catable.h"
#include <algorithm>
#include <limits>

void CATable::add_trajectory(int traj_id, const std::vector<Point>& trajectory) {
    if (trajectory.size() == 0) {
        return;
    }
    int t = 0;
    Point last_point = trajectory[0];
    TimePoint tp = {last_point.get_x(), last_point.get_y(), t};
    _pos_time_table[tp] = traj_id;
    _last_visit_table[last_point] = std::max(t, _last_visit_table[last_point]);
    for (int i = 1; i < trajectory.size(); ++i) {
        const Point& coord = trajectory[i];
        t += (coord - last_point).diag_norm_multiplied2();
        TimePoint tp = {coord.get_x(), coord.get_y(), t};
        _pos_time_table[tp] = traj_id;
        _last_visit_table[coord] = std::max(t, _last_visit_table[coord]);
    }
	
}

bool CATable::check_move(const Point& from, const Point& to, int start_time) const {
    int new_time = start_time + (to - from).diag_norm_multiplied2();
	if (from == to) {
        return is_cell_available(from.get_x(), from.get_y(), new_time);
    }
    if (!is_cell_available(to.get_x(), to.get_y(), new_time)) {
        return false;
    }

    return is_reverse_move_valid(from, to, start_time, new_time);
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