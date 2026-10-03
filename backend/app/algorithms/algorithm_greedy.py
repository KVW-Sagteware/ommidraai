from app.algorithms.osrm_functions import query_osrm_table, query_osrm_route

def evaluate_destinations_with_osrm(starts_data, starting_capacities, passengers_data, destinations_data, osrm_host="osrm:5000"):
    start_nodes = list(starts_data.keys())
    passengers = list(passengers_data.keys())
    destinations = list(destinations_data.keys())
    
    all_keys = start_nodes + passengers + destinations
    all_coords = [starts_data[k] if k in starts_data else (passengers_data[k] if k in passengers_data else destinations_data[k]) for k in all_keys]
    key_to_idx = {key: idx for idx, key in enumerate(all_keys)}
    key_to_coord = {key: coord for key, coord in zip(all_keys, all_coords)}
    
    source_keys = start_nodes + passengers
    dest_keys = passengers + destinations
    raw_matrix = query_osrm_table(all_coords, [key_to_idx[k] for k in source_keys], [key_to_idx[k] for k in dest_keys], osrm_host)
    
    distance_matrix = {}
    for s_i, src_key in enumerate(source_keys):
        distance_matrix[src_key] = {}
        for d_i, dest_key in enumerate(dest_keys):
            if raw_matrix[s_i][d_i] is not None:
                distance_matrix[src_key][dest_key] = raw_matrix[s_i][d_i]

    ranking = []
    
    for d in destinations:
        # Step 1: Clone active driver capacities for this destination run
        current_capacities = dict(starting_capacities)
        driver_paths = {s: [s] for s in start_nodes}
        driver_accumulated_distances = {s: 0 for s in start_nodes}
        remaining_passengers = set(passengers)
        
        # Step 2 & 3: Match passengers greedily to their closest valid driver or unassigned node
        while remaining_passengers:
            best_candidate = None
            min_step_distance = float('inf')
            
            for s in start_nodes:
                if current_capacities[s] <= 0:
                    continue
                
                # Look from the last physical coordinate visited by this driver
                last_node = driver_paths[s][-1]
                for p in remaining_passengers:
                    if last_node in distance_matrix and p in distance_matrix[last_node]:
                        dist = distance_matrix[last_node][p]
                        if dist < min_step_distance:
                            min_step_distance = dist
                            best_candidate = (s, p)
            
            if not best_candidate:
                break # Remaining passengers can't be reached or all vehicle seats are taken
                
            assigned_driver, picked_passenger = best_candidate
            driver_paths[assigned_driver].append(picked_passenger)
            driver_accumulated_distances[assigned_driver] += min_step_distance
            current_capacities[assigned_driver] -= 1
            remaining_passengers.remove(picked_passenger)
            
        # Step 4: Add final destination leg for each driver group
        routes_with_geometry = {}
        destination_bottleneck = 0
        
        for s in start_nodes:
            last_node = driver_paths[s][-1]
            final_leg_distance = distance_matrix.get(last_node, {}).get(d, 0) if last_node != d else 0
            total_route_distance = driver_accumulated_distances[s] + final_leg_distance
            
            # Form final output route sequence path
            final_path = driver_paths[s] + [d]
            path_coords = [key_to_coord[k] for k in final_path]
            
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
            
        ranking.append({
            "destination": d,
            "bottleneck": destination_bottleneck,
            "routes": routes_with_geometry
        })
        
    ranking.sort(key=lambda x: x["bottleneck"])
    return ranking
