import { Field, MerkleMap, PublicKey, fetchAccount } from 'o1js';

import {
  type WorkerFunctions,
  type ZkappWorkerReponse,
  type ZkappWorkerRequest,
} from './zkappWorker';

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------

  setActiveInstanceToDevnet() {
    return this._call('setActiveInstanceToDevnet', {});
  }

  loadContract() {
    return this._call('loadContract', {});
  }

  compileContract() {
    return this._call('compileContract', {});
  }

  fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): ReturnType<typeof fetchAccount> {
    const result = this._call('fetchAccount', {
      publicKey58: publicKey.toBase58(),
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  initZkappInstance(publicKey: PublicKey) {
    return this._call('initZkappInstance', {
      publicKey58: publicKey.toBase58(),
    });
  }


  async getMerkleMapRoot(): Promise<Field> {
    const result = await this._call('getMerkleMapRoot', {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  createUpdateRootTransaction(key: number | null, value: number | null, fetchedmerklemap: string | null) {


    return this._call('createUpdateRootTransaction', { key, value, fetchedmerklemap});
  }



  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL('./zkappWorker.ts', import.meta.url));
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}