import React, { useEffect } from 'react';
import { address } from './constants';
import { io } from 'socket.io-client';


const WebSocketComponent: React.FC = () => {
  useEffect(() => {
    const socket = new WebSocket(address);

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      // You can send initial data or perform other actions here
    };

    socket.onmessage = (event) => {
      console.log('Received message:', event.data);
      // Handle incoming messages from the server
    };

    socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      // Handle WebSocket closure
    };

    return () => {
      // Clean up the WebSocket connection when component unmounts
      socket.close();
    };
  }, []);

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
};

export default WebSocketComponent;


export class SocketService {

  private static instance: BatchService;
  private socket = io(`http://127.0.0.1:${getBePort()}`);

  static getInstance = () => {
      if (!BatchService.instance) {
          BatchService.instance = new BatchService();
      }
      return BatchService.instance;
  }

  constructor() {
      if (BatchService.instance) {
          throw new Error("Error: Instantiation failed: Use BatchService.getInstance() instead of new.");
      }
      this.initializeSocket();
      BatchService.instance = this;
  }

  private initializeSocket() {
      this.socket.on('taskStatusUpdate', (data: any) => {
          let isBrainstorm = true;
          let batchStore;
          let spaceId = '';
          batchStore = structuredClone(store.getState().brainstorm.pool.find(batch => batch.id === data.taskId));
          if (!batchStore) {
              isBrainstorm = false;
              for (const space of store.getState().spaces.space) {
                  let res = space.pool.filter((batch) => batch.id === data.taskId)
                  if (res.length > 0) {
                      spaceId = space.id;
                      batchStore = structuredClone(res[0]);
                  }
              }
          }
          if (batchStore && batchStore.status !== 'running') {
              if (isBrainstorm) {
                  store.dispatch(changeState({ id: data.taskId, status: 'running' }))
              } else {
                  store.dispatch(changeStateEv({ batchId: data.taskId, poolId: spaceId, status: 'running' }));
              }
          }
      }
      );
      this.socket.on('taskUpdate', (data) => {
          if (data && data.status && data.taskId) {
              // Handle the update based on the data received
              let isBrainstorm = true;
              let batchStoreEv;
              let batchStore = store.getState().brainstorm.pool.filter((batch) => batch.id === data.taskId);
              let spaceId ='';
              if(batchStore.length === 0) {
                  isBrainstorm = false;
                  for(const space of store.getState().spaces.space) {
                      let res = space.pool.filter((batch) => batch.id === data.taskId)
                      if(res.length > 0) {
                          spaceId = space.id;
                          batchStoreEv = res[0];
                      }
                  }
              }
              switch (data.status) {
                  case 'COMPLETED':
                      const batch = {
                          images: (data.result.result as string[]).map((image) => { return { data: image } as IImage }),
                          metadata: batchStore.length > 0 ? batchStore[0].metadata : batchStoreEv?.metadata,
                      }
      
                      if (isBrainstorm) {
                          store.dispatch(addBatch({ id: data.taskId, ...batch , status:'completed'}));
                      } else {
                          store.dispatch(addNewBatch({ id: data.taskId, images: batch.images, image2image: 
                              {
                                  poolId: spaceId 
                              } as any, status:'completed' }));
                      }
                      break;
                  case 'FAILED':
                      if(isBrainstorm) { 
                          store.dispatch(addBatch({ id: data.taskId, images: this.initImagesPreflight(batchStore[0].metadata), metadata: batchStore[0].metadata, status: 'failed' }));
                      } else { 
                          store.dispatch(changeStateEv({ batchId: data.taskId, poolId: spaceId, status: 'failed' }));
                      }
                      break;
                  case 'STOPPED':

                      break;
                  
              }
          }
      });
  }


  imageSaveAsBatch = async (imageBase64: string, width: number = 512, height: number = 512) => {
      const apiService = ArthemyClientService.getInstance();
      const res = await apiService.saveImage(imageBase64);
      return res;
  }

  removeBatch = (id: string) => {
      console.log("stop generation", id)
      store.dispatch(deleteBatch({ id: id }));
      BatchService.getInstance().stop(id)
      //TasksManagerService.getInstance().abortTaskByExternalId(id);
  }

  initImagesPreflight = (batchMeta: any) => {
      let outputs = batchMeta.num_outputs;
      let images = [];
      for (let i = 0; i < outputs; i++) {
          images.push({ data: "default", id: generateId() } as IImage);
      }
      return images;
  }

  stop = async (batchId: string) => {
      await ArthemyClientService.getInstance().stop(batchId as string);
  }

  updateImages = (batchMeta: any, processedImages: any[]) => {
      let outputs = batchMeta.num_outputs;
      let images = [];
      for (let i = 0; i < outputs; i++) {
          if(i < processedImages.length) {
              images.push({ data: processedImages[i], id: generateId() } as IImage);
          } else {
              images.push({ data: "default", id: generateId() } as IImage);
          }
      }
      return images;
  }
  generate = async (batchMeta: any, isBrainstorm: boolean, img2img: IImg2Img, batch_Id?: string, options?: any) => {
      let batchMetaTagToString = structuredClone(batchMeta);
      batchMetaTagToString.prompt = convertTagToString(batchMeta.prompt);
      batchMetaTagToString.positive_prompt = convertTagToString(batchMeta.positive_prompt);
      batchMetaTagToString.negative_prompt = convertTagToString(batchMeta.negative_prompt);
      batchMetaTagToString.output_lossless = true;
      batchMetaTagToString.guidance_scale = batchMeta.guidance_scale.value;
      type lLabel = "Low" | "Mid" | "High";
      type lSteps = 10 | 10 | 25;
      type lOffset = 0 | 5 | 10;
      type lSampler = "unipc_tu" | "dpmpp_sde" | "dpmpp_sde";
      const lookupSteps : Record<lLabel, lSteps> = { Low: 10, Mid: 10, High: 25 };
      const lookupGuidanceOffset : Record<lLabel, lOffset> = { Low: 0, Mid: 5, High: 10 };
      const lookupSampler : Record<lLabel, lSampler> = { Low: "unipc_tu", Mid: "dpmpp_sde", High: "dpmpp_sde" };
      batchMetaTagToString.num_inference_steps = (lookupSteps[batchMeta.num_inference_steps.label as lLabel] || 17) + (lookupGuidanceOffset[batchMeta.guidance_scale.label as lLabel] || 0);
      batchMetaTagToString.sampler_name = lookupSampler[batchMeta.num_inference_steps.label as lLabel] || "dpmpp_sde";
      batchMetaTagToString.prompt_strength = adjustPromptStrength(batchMeta.prompt_strength / 100);
      // Image generation fails at 0 steps (for now), so as a fix we make sure steps is at least 1.
      batchMetaTagToString.num_inference_steps = (Math.floor(batchMetaTagToString.num_inference_steps * batchMetaTagToString.prompt_strength) < 1 && batchMeta.init_image !== null ? Math.ceil(1 / batchMetaTagToString.prompt_strength) : batchMetaTagToString.num_inference_steps) as string;

      let renderRequest = await ArthemyClientService.getInstance().startRender(batchMetaTagToString, options);
      let batchId: string = batch_Id ?? renderRequest.taskId;
      //preflight batch
      if (isBrainstorm) {
          store.dispatch(addBatch({ id: batchId, images: this.initImagesPreflight(batchMeta), metadata: batchMeta, status: 'generate' }));
      } else {
          store.dispatch(createNewBatch({ images: this.initImagesPreflight(batchMeta), image2image: img2img, batchMeta: batchMeta, newId: batchId }));
          //addbatch in evolution
      }

      /*this.socket.on('taskUpdate', (data) => {

          if (renderRequest.taskId == null) {
              return { status: TaskStatus.WONTDO };
          }

          let stream = data;

          if (stream?.status == "FAILED") {
              if (isBrainstorm) {
                  store.dispatch(addBatch({ id: batchId, images: this.initImagesPreflight(batchMeta), metadata: batchMeta, status: 'failed' }));
              } else  {
                  store.dispatch(addNewBatch({ id: batchId, images: this.initImagesPreflight(batchMeta), image2image: img2img,status:'failed' }));
              }
              return { status: TaskStatus.FAILED };
          }

          if (stream?.status == "STOPPED") {
              if (isBrainstorm) {
                  if (stream?.result === 'timeout') {
                      store.dispatch(addBatch({ id: batchId, images: this.initImagesPreflight(batchMeta), metadata: batchMeta, status: 'timeout' }));
                      return { status: TaskStatus.FAILED }; 
                  }
                  store.dispatch(addBatch({ id: batchId, images: this.initImagesPreflight(batchMeta), metadata: batchMeta, status: 'stopped' }));
              }
              return { status: TaskStatus.WONTDO };
          }

          if (stream?.status == "COMPLETED") {
              const batch = {
                  images: (stream.result as string[]).map((image) => { return { data: image } as IImage }),
                  metadata: batchMeta,
              }

              if (isBrainstorm) {
                  store.dispatch(addBatch({ id: batchId, ...batch }));
              } else {
                  store.dispatch(addNewBatch({ id: batchId, images: batch.images, image2image: img2img,status:'completed' }));
              }
              return { status: TaskStatus.COMPLETED };
          }
          return { status: TaskStatus.RUNNING };
      }, batchId, renderRequest.taskId);*/
  }
}