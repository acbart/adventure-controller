import { ElementDefinition, StylesheetCSS } from 'cytoscape';
import React, { useEffect, useMemo, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

import { house, Room } from "../data/house";
import { determineBestModeAvailable } from './ViewModeSetter';

//export type Node = Room | {id: string};
export interface Node {
  id: string;
  label: string;
}
export type Edge = {source: string, target: string};

export type GraphData = {nodes: Node[], links: Edge[]};

export interface CytoscapeData<T> {
  data: T;
}

export function makeLink(left: string, right: string) {
  return {data: {source: left, target: right, id: `${left}-${right}`}}
}

export function getImageSelectors(rooms: CytoscapeData<Node>[]): StylesheetCSS[] {
  return rooms.map((roomNode: CytoscapeData<Node>) => {
    const room = house.rooms[roomNode.data.id];
    const filename = `house_images/${room[determineBestModeAvailable('image', room)]}`;
    return {
      selector: "#"+roomNode.data.id,
      css: {
        backgroundImage: filename,
        borderColor: house.regions[room.region].color
      }
    };
  }) as StylesheetCSS[];
}

export function getUniqueLinks(graph: Record<string, Room>,
  visitedNodes: Record<string, boolean>,
  keptNodes: Record<string, boolean>): CytoscapeData<Edge>[] {
  const seenLinks: Record<string, Set<string>> = {};
  const links: CytoscapeData<Edge>[] = [];
  Object.entries(graph).forEach(([name, room]: [string, Room]) => {
    room.doors.concat(room.warps).forEach((door: string) => {
      const [left, right] = name.localeCompare(door) > 0 ? [name, door] : [door, name];
      if (visitedNodes[left] && visitedNodes[right] && keptNodes[left] && keptNodes[right]) {
        if (!(left in seenLinks)) {
          seenLinks[left] = new Set([right]);
          links.push(makeLink(left, right));
        } else if (!seenLinks[left].has(right)) {
          seenLinks[left].add(right);
          links.push(makeLink(left, right));
        }
      }
    })
  });
  return links;
}

export function getVisitedRooms(graph: Record<string, Room>, visitedNodes: Record<string, boolean>, mapFilter: string): CytoscapeData<Node>[] {
  return Object.entries(house.rooms).filter(([name, room]: [string, Room]) => {
    return visitedNodes[name];
  })
  .filter(([name, room]: [string, Room]) => {
    return !mapFilter || !(mapFilter in house.regions) ||
      house.regions[mapFilter].tags.includes(room.region);
  })
  .map(([name, room]: [string, Room]) => {
    return {data: {id: name, label: room.name}};
  });
}

export function makeMapOverview(visitedNodes: Record<string, boolean>, mapFilter: string) {
  const nodes = getVisitedRooms(house.rooms, visitedNodes, mapFilter);
  const keptNodes = Object.fromEntries(nodes.map((room) => [room.data.id, true]));
  const elements = {
    nodes: nodes,
    edges: getUniqueLinks(house.rooms, visitedNodes, keptNodes)
  };
  const layout = {
    name: "cose", // cose, spread
    nodeDimensionsIncludeLabels: false,
    randomize: true,
    animate: true,
    componentSpacing: 20,
    padding: 5,
    nodeOverlap: 1,
    fit: true,
    rankDir: "LR"
  };
  const style = [
    {
      selector: 'node',
      css: {
        backgroundFit: 'cover',
        backgroundOpacity: .5,
        shape: 'rectangle',
        width: '120px',
        height: '90px',
        borderColor: "#FFF",
        borderWidth: 1,
        /*textBackgroundColor: '#FDD',
        textBackgroundShape: "roundrectangle",
        textBackgroundOpacity: 1,
        textBorderColor: "#000",
        textBorderWidth: 1,
        textBorderOpacity: 1,
        textBackgroundPadding: 4,
        // backgroundColor: '#FDD',
        // 'color': 'black',
        'shape': 'circle',
        'content': 'data(label)',
        textValign: 'center',
        textHalign: 'center'*/
      }
    },
    { 
      selector: ':parent',
      css: {
        textValign: 'top',
        textHalign: 'center'
      }},
    {
      selector: 'edge',
      css: {
        'width': 2,
        'line-color': 'white',
        // 'target-arrow-color': '#ccc',
        // 'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    },
    ...getImageSelectors(elements.nodes)
  ];
  return {
    elements,
    maxZoom: 2,
    minZoom: .1,
    layout,
    style,
  };
}

export function AltMapOverview({visitedNodes, mapFilter}: {visitedNodes: Record<string, boolean>, mapFilter: string}) {
  const elements = useMemo(()=>({
    nodes: getVisitedRooms(house.rooms, visitedNodes, mapFilter),
    edges: getUniqueLinks(house.rooms, visitedNodes, {})
  }), [visitedNodes, mapFilter]);
  const layout = {
    name: "cose",
    nodeDimensionsIncludeLabels: false
  };
  const style = [
    {
      selector: 'node',
      css: {
        textBackgroundColor: '#FDD',
        textBackgroundShape: "roundrectangle",
        textBackgroundOpacity: 1,
        textBorderColor: "#000",
        textBorderWidth: 1,
        textBorderOpacity: 1,
        textBackgroundPadding: 4,
        // backgroundColor: '#FDD',
        // 'color': 'black',
        'shape': 'rectangle',
        'content': 'data(label)',
        textValign: 'center',
        textHalign: 'center'
      }
    },
    { 
      selector: ':parent',
      css: {
        textValign: 'top',
        textHalign: 'center'
      }},
    {
      selector: 'edge',
      css: {
        'width': 1,
        'line-color': 'white',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
  ];
  return <CytoscapeComponent
    elements={CytoscapeComponent.normalizeElements(elements)}
    maxZoom={2}
    minZoom={.3}
    layout={layout}
    stylesheet={style}
    style={{width: '100%', height: '400px'}}
  />;
};