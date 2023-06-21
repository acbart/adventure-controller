import { Graph, GraphConfiguration } from "react-d3-graph";
import { house, Room } from "../data/house";

//export type Node = Room | {id: string};
export interface Node {
  id: string;
  title: string;
}
export type Edge = {source: string, target: string};

export type GraphData = {nodes: Node[], links: Edge[]};

export function getUniqueLinks(graph: Record<string, Room>): Edge[] {
  const seenLinks: Record<string, Set<string>> = {};
  const links: Edge[] = [];
  Object.entries(graph).forEach(([name, room]: [string, Room]) => {
    room.doors.concat(room.warps).forEach((door: string) => {
      const [left, right] = name.localeCompare(door) > 0 ? [name, door] : [door, name];
      if (!(left in seenLinks)) {
        seenLinks[left] = new Set([right]);
        links.push({source: left, target: right})
      } else if (!seenLinks[left].has(right)) {
        seenLinks[left].add(right);
        links.push({source: left, target: right})
      }
    })
  });
  return links;
}

export function getVisitedRooms(graph: Record<string, Room>) {
  return Object.entries(house.rooms).map(([name, room]: [string, Room]) => {
    return {id: name, title: room.name};
  });
}

export function NodeView(node: Node): JSX.Element {
  return <div className={`flex-container room-node frater`}>
      <div className="name">{node.title}</div>

      <div className="flex-container fill-space flex-container-row">
        <div className="fill-space">
          {/* <div className="icon" style={{ backgroundImage: `url('${isMale ? ICON_TYPES.MAN : ICON_TYPES.WOMAN}')` }} /> */}
        </div>

        <div className="icon-bar">
          {/* {person.hasBike && <div className="icon" style={{ backgroundImage: `url('${ICON_TYPES.BIKE}')` }} />}
          {person.hasCar && <div className="icon" style={{ backgroundImage: `url('${ICON_TYPES.CAR}')` }} />} */}
        </div>
      </div>
    </div>;
}

export function MapOverview(): JSX.Element {
  const visitedRooms: Set<string> = new Set(["thelivingroom"]);
  const graph: GraphData = {
    nodes: getVisitedRooms(house.rooms),
    links: getUniqueLinks(house.rooms)
  };

  const graphConfig: Partial<GraphConfiguration<Node, Edge>> = {
    nodeHighlightBehavior: true,
    maxZoom: 8,
    minZoom: .1,
    d3: {
      gravity: -15,
      //disableLinkForce: true,
      //linkStrength: 10,
      //linkLength: 200
    },
    node: {
      color: "darkred",
      //size: 100,
      highlightStrokeColor: "blue",
      fontColor: "white",
      labelProperty: "title",
      renderLabel: false,
      labelPosition: "center",
      viewGenerator: NodeView,
      size: {
        width: 900,
        height: 700,
      },
    },
    link: {
      highlightColor: "lightblue",
      // type: "CURVE_SMOOTH"
    },
  };

  const onClickNode = function(nodeId: string) {
    window.alert(`Clicked node ${nodeId}`);
  };
  
  const onClickLink = function(source: string, target: string) {
    window.alert(`Clicked link between ${source} and ${target}`);
  };
  
  

  return (
    <Graph
      id="graph-id" // id is mandatory
      data={graph}
      config={graphConfig}
      onClickNode={onClickNode}
      onClickLink={onClickLink}
    />
  );
}