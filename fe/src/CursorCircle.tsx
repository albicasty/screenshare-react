import { Circle } from "react-konva";
import { IPos } from "./types";

interface ICircle  { 
    pos : IPos;
    color: string ; 
}

const CursorCircle : React.FC<ICircle>= ({pos,color}) => {
    return (  
        <Circle
        radius={4}
        x={pos.x}
        y={pos.y}
        fill={'blue'}
        />

    );
}
 
export default CursorCircle;