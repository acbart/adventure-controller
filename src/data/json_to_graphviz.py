from collections import defaultdict
import json


with open('castle_graph.json') as data_file:
    data = json.load(data_file)
    
regions = defaultdict(list)
for room_id, room in data['rooms'].items():
    regions[room['region']].append(room_id)

with open('castle_graph.txt', 'w') as out:
    print("digraph G {", file=out)
    print("  splines=true;", file=out)
    
    for region, room_ids in regions.items():
        print(f"  subgraph cluster_{region} {{", file=out)
        print(f'    label="{region.title()}"', file=out)
        print("    "+";".join(room_ids) + ';', file=out)
        print( "  }", file=out)
        print(region+":", len(room_ids))
    
    links = set()
    for room_id, room in data['rooms'].items():
        print(f'  {room_id} [label="{room["name"]}"];', file=out)
        for door in room['doors']:
            pair = tuple(sorted((room_id, door)))
            if pair not in links:
                print(f"  {room_id} -> {door} [dir=both];", file=out)
                links.add(pair)
        #for door in room['warps']:
        #    pair = tuple(sorted((room_id, door)))
        #    if pair not in links:
        #        print(f'  {room_id} -> {door} [style="dashed", dir=both];', file=out)
        #        links.add(pair)
    print("}", file=out)