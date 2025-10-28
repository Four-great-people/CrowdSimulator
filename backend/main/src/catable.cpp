#include "catable.h"
#include <algorithm>

void CATable::add_trajectory(int traj_id, const std::vector<Point>& trajectory) {
    if (trajectory.size() == 0) {
        return;
    }
    int t = 0;
    Point last_point = trajectory[0];
    for (int i = 1; i < trajectory.size(); ++i) {
        const Point& coord = trajectory[i];
        int move_cost = (coord - last_point).diag_norm_multiplied2();
        for (int add_t = 0; add_t < move_cost; ++add_t) {
            add_time_point(last_point.get_x(), last_point.get_y(), t + add_t);
        }
        t += move_cost;
        last_point = coord;
    }
	add_time_point(last_point.get_x(), last_point.get_y(), t);
}

void CATable::add_time_point(int x, int y, int t) {
    TimePoint tp = {x, y, t};
    Point coord(x, y);
    _pos_time_table.insert(tp);
    _last_visit_table[coord] = std::max(t, _last_visit_table[coord]);
}

bool CATable::check_move(const Point& from, const Point& to, int start_time) const {
	if (from == to) {
        for (int add_time = 1; add_time <= wait_cost; ++add_time) {
            if (!is_cell_available(from.get_x(), from.get_y(), start_time + add_time)) {
                return false;
            }
        }
        return true;
    }
    int new_time = start_time + (to - from).diag_norm_multiplied2();
    if (!is_cell_available(to.get_x(), to.get_y(), new_time)) {
        return false;
    }
    for (int time = start_time + 1; time < new_time; ++time) {
        if (!is_cell_available(from.get_x(), from.get_y(), time)) {
            return false;
        }
    }

    // We don't care about points in <to> until we want to get there.
    // Since <from> is available, no one come there from <to> before <new_time>
    // So we are only interested in time of swap, that is from <new_time - 1> to <new_time>
    return is_reverse_move_valid(from, to, new_time - 1, new_time);
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