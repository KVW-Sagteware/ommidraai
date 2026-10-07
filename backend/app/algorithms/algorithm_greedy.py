from app.algorithms.osrm_functions import query_osrm_table, query_osrm_route
from app.algorithms.RedBlackTree import RedBlackTree

# Local cache for group rankings to avoid recomputation
# ---
group_ranking_cache = {}
# ---

# Build a Red-Black Tree from a ranking list
# ---
def _build_ranking_tree(ranking):
    tree = RedBlackTree()
    for item in ranking:
        tree.insert((item["bottleneck"], item["destination"]), item)
    return tree
# ---

# Build a distance matrix from the given data
# ---
def _build_distance_matrix(starts_data, passengers_data, destinations_data, osrm_host="osrm:5000"):
    start_nodes = [("start", name) for name in starts_data]
    passengers = [("passenger", name) for name in passengers_data]
    destinations = [("destination", name) for name in destinations_data]

    all_keys = start_nodes + passengers + destinations
    all_coords = (
        [starts_data[name] for _, name in start_nodes]
        + [passengers_data[name] for _, name in passengers]
        + [destinations_data[name] for _, name in destinations]
    )
    key_to_idx = {key: idx for idx, key in enumerate(all_keys)}
    key_to_coord = dict(zip(all_keys, all_coords))

    source_keys = start_nodes + passengers
    dest_keys = passengers + destinations
    raw_matrix = query_osrm_table(all_coords, [key_to_idx[k] for k in source_keys], [key_to_idx[k] for k in dest_keys], osrm_host)

    distance_matrix = {}
    for s_i, src_key in enumerate(source_keys):
        distance_matrix[src_key] = {}
        for d_i, dest_key in enumerate(dest_keys):
            if raw_matrix[s_i][d_i] is not None:
                distance_matrix[src_key][dest_key] = raw_matrix[s_i][d_i]

    return distance_matrix, key_to_coord
# ---

# Evaluate a single destination using the precomputed distance matrix
# ---
def _evaluate_destination_with_matrix(d, starts_data, starting_capacities, passengers_data, distance_matrix, key_to_coord, osrm_host="osrm:5000"):
    start_names = list(starts_data.keys())
    passenger_names = list(passengers_data.keys())
    destination_node = ("destination", d)

    current_capacities = dict(starting_capacities)
    driver_paths = {s: [s] for s in start_names}
    driver_path_nodes = {s: [("start", s)] for s in start_names}
    driver_accumulated_distances = {s: 0 for s in start_names}
    remaining_passengers = set(passenger_names)

    while remaining_passengers:
        best_candidate = None
        min_step_distance = float('inf')

        for s in start_names:
            if current_capacities[s] <= 0:
                continue

            last_node = driver_path_nodes[s][-1]
            for p in remaining_passengers:
                passenger_node = ("passenger", p)
                if last_node in distance_matrix and passenger_node in distance_matrix[last_node]:
                    dist = distance_matrix[last_node][passenger_node]
                    if dist < min_step_distance:
                        min_step_distance = dist
                        best_candidate = (s, p)

        if not best_candidate:
            break

        assigned_driver, picked_passenger = best_candidate
        driver_paths[assigned_driver].append(picked_passenger)
        driver_path_nodes[assigned_driver].append(("passenger", picked_passenger))
        driver_accumulated_distances[assigned_driver] += min_step_distance
        current_capacities[assigned_driver] -= 1
        remaining_passengers.remove(picked_passenger)

    routes_with_geometry = {}
    destination_bottleneck = 0

    for s in start_names:
        last_node = driver_path_nodes[s][-1]
        final_leg_distance = distance_matrix.get(last_node, {}).get(destination_node, 0)
        total_route_distance = driver_accumulated_distances[s] + final_leg_distance

        final_path = driver_paths[s] + [d]
        path_coords = [key_to_coord[k] for k in driver_path_nodes[s] + [destination_node]]

        try:
            geometry, osrm_route_distance = query_osrm_route(path_coords, osrm_host)
            if osrm_route_distance:
                total_route_distance = osrm_route_distance
        except Exception:
            geometry = None

        routes_with_geometry[s] = {
            "distance": total_route_distance,
            "geometry": geometry,
            "path": final_path
        }
        destination_bottleneck = max(destination_bottleneck, total_route_distance)

    return {
        "destination": d,
        "bottleneck": destination_bottleneck,
        "routes": routes_with_geometry
    }
# ---

# Evaluate all destinations using the precomputed distance matrix and OSRM
# ---
def evaluate_destinations_with_osrm(starts_data, starting_capacities, passengers_data, destinations_data, osrm_host="osrm:5000", group_id=None):
    start_nodes = list(starts_data.keys())
    destinations = list(destinations_data.keys())

    if not start_nodes or not destinations:
        ranking = []
        if group_id is not None:
            group_ranking_cache[group_id] = _build_ranking_tree(ranking)
        return ranking

    distance_matrix, key_to_coord = _build_distance_matrix(starts_data, passengers_data, destinations_data, osrm_host)

    ranking = []
    for d in destinations:
        ranking.append(_evaluate_destination_with_matrix(d, starts_data, starting_capacities, passengers_data, distance_matrix, key_to_coord, osrm_host))

    if group_id is not None:
        group_ranking_cache[group_id] = _build_ranking_tree(ranking)

    return ranking
# ---

# Get a cached ranking for a given group
# ---
def get_cached_ranking(group_id, starts_data=None, starting_capacities=None, passengers_data=None, destinations_data=None, osrm_host="osrm:5000"):
    if group_id in group_ranking_cache:
        return group_ranking_cache[group_id].inorder_traversal()

    if starts_data is None or starting_capacities is None or destinations_data is None:
        return []

    ranking = evaluate_destinations_with_osrm(
        starts_data=starts_data,
        starting_capacities=starting_capacities,
        passengers_data=passengers_data,
        destinations_data=destinations_data,
        osrm_host=osrm_host,
        group_id=group_id,
    )
    return group_ranking_cache[group_id].inorder_traversal() if group_id in group_ranking_cache else ranking
# ---

# Add a single destination to the cached ranking for a given group
# ---
def add_single_destination_to_cache(group_id, new_dest, starts_data, starting_capacities, passengers_data, destinations_data, osrm_host="osrm:5000"):
    if group_id not in group_ranking_cache:
        return evaluate_destinations_with_osrm(
            starts_data=starts_data,
            starting_capacities=starting_capacities,
            passengers_data=passengers_data,
            destinations_data=destinations_data,
            osrm_host=osrm_host,
            group_id=group_id,
        )

    if new_dest not in destinations_data:
        return group_ranking_cache[group_id].inorder_traversal()

    single_dest_dict = {new_dest: destinations_data[new_dest]}
    distance_matrix, key_to_coord = _build_distance_matrix(starts_data, passengers_data, single_dest_dict, osrm_host)
    new_destination_result = _evaluate_destination_with_matrix(
        new_dest,
        starts_data,
        starting_capacities,
        passengers_data,
        distance_matrix,
        key_to_coord,
        osrm_host,
    )

    group_ranking_cache[group_id].insert((new_destination_result["bottleneck"], new_destination_result["destination"]), new_destination_result)
    return group_ranking_cache[group_id].inorder_traversal()
# ---

# Remove a destination from the cached ranking for a given group
# ---
def remove_destination_from_cache(group_id, dest_id):
    if group_id not in group_ranking_cache:
        return []

    tree = group_ranking_cache[group_id]
    tree.delete_by_destination(dest_id)
    return tree.inorder_traversal()
# ---

# Load the ranking for a group on the page
# ---
def group_page_load_ranking(group_id, starts_data, starting_capacities, passengers_data, destinations_data, osrm_host="osrm:5000"):
    cached_ranking = get_cached_ranking(group_id)
    if cached_ranking:
        print(f"\033[1m Returning cached ranking for group {group_id} \033[0m")
        group_ranking_cache[group_id].print_tree()
        return cached_ranking

    ranking = evaluate_destinations_with_osrm(
        starts_data=starts_data,
        starting_capacities=starting_capacities,
        passengers_data=passengers_data,
        destinations_data=destinations_data,
        osrm_host=osrm_host,
        group_id=group_id,
    )
    print(f"\033[1m Computed new ranking for group {group_id} \033[0m")
    group_ranking_cache[group_id].print_tree()
    return group_ranking_cache[group_id].inorder_traversal() if group_id in group_ranking_cache else ranking
# ---

# Add a destination to a group and update the cached ranking
# ---
def add_destination_to_group(group_id, new_dest, starts_data, starting_capacities, passengers_data, destinations_data, osrm_host="osrm:5000"):
    ranking = add_single_destination_to_cache(
        group_id=group_id,
        new_dest=new_dest,
        starts_data=starts_data,
        starting_capacities=starting_capacities,
        passengers_data=passengers_data,
        destinations_data=destinations_data,
        osrm_host=osrm_host,
    )
    print(f"\033[1m Added destination {new_dest} to group {group_id} ranking \033[0m")
    group_ranking_cache[group_id].print_tree()
    return ranking
# ---

# Remove a destination from a group and update the cached ranking
# ---
def delete_destination_from_group(group_id, dest_id):
    ranking = remove_destination_from_cache(group_id, dest_id)
    print(f"\033[1m Removed destination {dest_id} from group {group_id} ranking \033[0m")
    if group_id in group_ranking_cache:
        group_ranking_cache[group_id].print_tree()
    return ranking
# ---

# Refresh the ranking for a group after an input overhaul
# ---
def refresh_group_ranking_after_input_overhaul(group_id, starts_data, starting_capacities, passengers_data, destinations_data, osrm_host="osrm:5000"):
    ranking = evaluate_destinations_with_osrm(
        starts_data=starts_data,
        starting_capacities=starting_capacities,
        passengers_data=passengers_data,
        destinations_data=destinations_data,
        osrm_host=osrm_host,
        group_id=group_id,
    )
    print(f"\033[1m Refreshed ranking for group {group_id} after input overhaul \033[0m")
    group_ranking_cache[group_id].print_tree()
    return group_ranking_cache[group_id].inorder_traversal() if group_id in group_ranking_cache else ranking
# ---