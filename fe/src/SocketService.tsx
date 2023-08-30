import { address, port } from './constants';

import { io } from 'socket.io-client';


export const socket = io(`${address}:${port}`);


//export class WebSocketComponent {
//    private socket = io(`http://127.0.0.1:${getBePort()}`);
//
//    private initializeSocket() {
//        this.socket.on('cursorUpdate', (pos: IPos) => {
//            let isBrainstorm = true;
//            let batchStore;
//            let spaceId = '';
//        });
//        this.socket.on('taskUpdate', (data) => {
//        });
//    }
//
//};



//export class SocketService {
//
//    private static instance: SocketService;
//
//};

