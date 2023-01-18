import houseRaw from "./house_graph.json";

export interface Room {
    items: string[];
    name: string;
    id: number;
    doors: string[];
    warps: string[];
    map: string;
    image: string;
    image2: string;
}

export interface HouseGraph {
    universal: Record<string, string>;
    rooms: Record<string, Room>;
}

export const house = houseRaw as unknown as HouseGraph;

export const MISSING_IMAGE = "missing.jpg";

/**
 * Extract possible fields from the Room based on things that are strings
 * https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
 */
type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: 
      Base[Key] extends Condition ? Key : never
};
type AllowedNames<Base, Condition> = 
        FilterFlags<Base, Condition>[keyof Base];
type SubType<Base, Condition> = 
        Pick<Base, AllowedNames<Base, Condition>>;

export type ViewMode = keyof Omit<SubType<Room, string>, "name">;


export function sortRoomsByPage([keyA, roomA]: [string, Room], [keyB, roomB]: [string, Room]) {
  return roomA.id - roomB.id;
}