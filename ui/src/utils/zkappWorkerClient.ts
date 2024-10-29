// zkappWorkerClient.ts
import { Field, MerkleMap, PublicKey, fetchAccount } from 'o1js';
import {
  type WorkerFunctions,
  type ZkappWorkerReponse,
  type ZkappWorkerRequest,
} from './zkappWorker';

export default class ZkappWorkerClient {
  worker: Worker | null;
  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };
  nextId: number;

  constructor() {
    this.promises = {};
    this.nextId = 0;
    this.worker = null;

    // Only initialize worker in browser environment
    if (typeof window !== 'undefined') {
      try {
        this.worker = new Worker(new URL('./zkappWorker.ts', import.meta.url));
        this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
          this.promises[event.data.id].resolve(event.data.data);
          delete this.promises[event.data.id];
        };

        this.worker.onerror = (error) => {
          console.error('Worker error:', error);
          Object.keys(this.promises).forEach((key) => {
            this.promises[Number(key)].reject(error);
          });
        };
      } catch (error) {
        console.error('Failed to initialize worker:', error);
      }
    }
  }

  _call(fn: WorkerFunctions, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker is not initialized - browser environment required'));
        return;
      }

      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      try {
        this.worker.postMessage(message);
        this.nextId++;
      } catch (error) {
        delete this.promises[this.nextId];
        reject(error);
      }
    });
  }

  async setActiveInstanceToDevnet() {
    return await this._call('setActiveInstanceToDevnet', {});
  }

  async loadContract() {
    return await this._call('loadContract', {});
  }

  async compileContract() {
    return await this._call('compileContract', {});
  }

  async fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): Promise<ReturnType<typeof fetchAccount>> {
    const result = await this._call('fetchAccount', {
      publicKey58: publicKey.toBase58(),
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  async initZkappInstance(publicKey: PublicKey) {
    return await this._call('initZkappInstance', {
      publicKey58: publicKey.toBase58(),
    });
  }

  async getMerkleMapRoot(): Promise<Field> {
    const result = await this._call('getMerkleMapRoot', {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  async createUpdateRootTransaction(
    key: number | null,
    value: number | null,
    fetchedmerklemap: string | null
  ) {
    return await this._call('createUpdateRootTransaction', {
      key,
      value,
      fetchedmerklemap,
    });
  }

  // Add a method to check if worker is available
  isWorkerAvailable(): boolean {
    return this.worker !== null;
  }

  // Add a cleanup method
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.promises = {};
  }
}
