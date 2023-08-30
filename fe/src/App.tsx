import './App.css'
import { Layer, Line, Stage, Rect } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node';
import { useState, useRef, useEffect } from 'react';
import { address,port } from './constants';
import { socket } from './SocketService';
import { generateId } from './util';
import CursorComponent from './CursorComponent';


function App() {

  const [points, setPoints] = useState<number[]>();
  const [isDrawing, setisDrawing] = useState<boolean>(false);
  const [cursors, setCursors] = useState({} as any);
  const stageRef = useRef<Stage>(null);

  const handleMouseDown = () => {
    setisDrawing(true);
  }

  const handleMouseUp = () => {
    setisDrawing(false);
  }

  const handleLeave = () => {
    setisDrawing(false);
  }

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (isDrawing && stageRef.current) {
      const pointer = stageRef.current.getPointerPosition();
      const newPoints = points ? [...points, pointer.x, pointer.y] : [pointer.x, pointer.y];
      setPoints(newPoints);
    }
  };


  const [id, setId] = useState<string>(generateId());

  const [positions, setPositions] = useState<IPosID[]>([]);


  const sendCursor = (pos: IPosID) => {
    if (socket.connected) {
      socket.emit("cursor", { ...pos, userId: id });
    }
  }

  useEffect(() => {

    socket.on('cursor-update', (data: IPosID[]) => {
      
      /*if (!cursors[data[0].userId]) {  // Verifica che il cursore con quell'ID esista
        console.log("newCursor")

        setCursors((prevCursors: any) => ({
          ...prevCursors,
          [data[0].userId]: { x: data[0].x, y: data[0].y }  // Aggiorna la posizione del cursore specifico
        }));
      }*/
      setCursors((prevCursors: any) => ({
        ...prevCursors,
        [data[0].userId]: { x: data[0].x, y: data[0].y }  // Aggiorna la posizione del cursore specifico
      }));
      //setPositions(posId);
    });

    return () => {
      socket.off('cursor-update');
    }

  });


  const cursorMove = (e:React.MouseEvent) => { 

    const pos : IPos ={ x:e.clientX,y:e.clientY};

    sendCursor({...pos, userId:id});

  };

  return (
    <div
    onMouseMove={cursorMove}
    className={"fullDiv"}
    >
<div>
      {Object.entries(cursors).map(([id, position]) => (
        <CursorComponent key={id} x={(position as any).x} y={(position as any).y} id={''} />
      ))}
    </div>

      <Stage
        ref={stageRef}
        width={1024} height={1024}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleLeave}
        onMouseUp={handleMouseUp}
      >

        <Layer
          width={1024}
          height={1024}
        >

          <Rect
            x={100}
            y={100}
            width={100}
            height={100}
            fill={'blue'}
          />

          {points &&

            <Line
              points={points}
              stroke={'red'}
              strokeWidth={10}
              lineJoin='round'
              lineCap='round'
            />
          }



        </Layer>

      </Stage>
    </div>
  )
}

export default App
