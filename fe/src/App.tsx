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
      socket.emit("draw", newPoints);
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

  const [message,setMessage] = useState<boolean>(false);

  const clickButton  = () => {
    if(socket.connected) {
      socket.emit("button");
    }
  };

  useEffect(() => {

    socket.on('cursor-update', (data: IPosID[]) => {
      setCursors((prevCursors: any) => ({
        ...prevCursors,
        [data[0].userId]: { x: data[0].x, y: data[0].y }  // Aggiorna la posizione del cursore specifico
      }));
      //setPositions(posId);
    });

    socket.on('draw-update', (data: any[]) => {
      setPoints(data);
      //setPositions(posId);
    });
    socket.on('button-click', (data) => { 
      showMessage();
    });

    return () => {
      socket.off('cursor-update');
      socket.off('buttonClicked');
    }

  });

  const [newPos,setNewPos] = useState<IPos>();

  const handleButtonClick = (e:React.MouseEvent) => { 
    clickButton();
    showMessage();
  };

  const showMessage =  () => { 
      setMessage(true);
      setTimeout( () => {
        setMessage(false)
      },5000);
  };


  const cursorMove = (e:React.MouseEvent) => { 

    const pos : IPos ={ x:e.clientX,y:e.clientY};
    setNewPos (pos);

    sendCursor({...pos, userId:id});

  };

  return (
    <div
    onMouseMove={cursorMove}
    className={"fullDiv"}
    >
<div>
      {Object.entries(cursors).map(([id, position]) => (
        <CursorComponent key={id} x={(position as any).x} y={(position as any).y} id={''} color="blue" />
      ))}
      {newPos &&  <CursorComponent key={id} x={newPos.x} y={newPos.y} id={''} color="red"/> } 
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

      <button type='button'
      onClick={handleButtonClick}
      > Click me if you can</button>
      {message && <p style={{color:'red'}}>You dare to click me</p>}
    </div>
  )
}

export default App
