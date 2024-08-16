import { Injectable } from '@nestjs/common';
import { Field, SelfProof, ZkProgram, verify } from 'o1js';
import { setupAndDeploy } from './deploy';
import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';

const Add = ZkProgram({
  name: 'add-example',
  publicInput: Field,

  methods: {
    init: {
      privateInputs: [],
      async method(state: Field) {
        state.assertEquals(Field(0));
      },
    },

    addNumber: {
      privateInputs: [SelfProof, Field],
      async method(
        newState: Field,
        earlierProof: SelfProof<Field, void>,
        numberToAdd: Field
      ) {
        earlierProof.verify();
        newState.assertEquals(earlierProof.publicInput.add(numberToAdd));
      },
    },

    add: {
      privateInputs: [SelfProof, SelfProof],
      async method(
        newState: Field,
        earlierProof1: SelfProof<Field, void>,
        earlierProof2: SelfProof<Field, void>
      ) {
        earlierProof1.verify();
        earlierProof2.verify();
        newState.assertEquals(
          earlierProof1.publicInput.add(earlierProof2.publicInput)
        );
      },
    },
  },
});

interface DeployAlias {
  networkId: string;
  url: string;
  keyPath: string;
  feepayerKeyPath: string;
  feepayerAlias: string;
  fee: string;
}

interface Config {
  version: number;
  deployAliases: {
    [key: string]: DeployAlias;
  };
}


@Injectable()
export class AppService {
  getHello(): string {
    console.log("h1");
    return 'Hello World!';
  }

  async prove() {

      console.log('Compiling...');
      const { verificationKey } = await Add.compile();

      console.log('Making proof 0');
      const proof0 = await Add.init(Field(0));

      console.log('Making proof 1');
      const proof1 = await Add.addNumber(Field(4), proof0, Field(4));

      console.log('Making proof 2');
      const proof2 = await Add.add(Field(4), proof1, proof0);

      console.log('Verifying proof 2');
      console.log('Proof 2 data', proof2.publicInput.toString());

      const ok = await verify(proof2.toJSON(), verificationKey);
      console.log('Verification result:', ok);

      return { success: true, verificationResult: ok };
  }

  async deploy(alias: string){
    setupAndDeploy(alias);
  }

  async config(newAliasName: string): Promise<void> {
    try {
      // Read the existing config file
      const configPath = path.resolve(process.cwd(), 'config.json');
      const configContent = await fs.readFile(configPath, 'utf8');
      const config: Config = JSON.parse(configContent);
  
      // Check if the alias already exists
      if (config.deployAliases[newAliasName]) {
        console.log(`Deploy alias "${newAliasName}" already exists. Skipping.`);
        return;
      }
  
      // Create the new deploy alias object
      const newAlias: DeployAlias = {
        networkId: "testnet",
        url: "https://api.minascan.io/node/devnet/v1/graphql",
        keyPath: `keys/${newAliasName}.json`,
        feepayerKeyPath: "C:\\Users\\user/.cache/zkapp-cli/keys/a.json",
        feepayerAlias: "account1",
        fee: "0.1"
      };
  
      // Add the new alias to the config
      config.deployAliases[newAliasName] = newAlias;
  
      // Write the updated config back to the file
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  
      console.log(`Successfully added new deploy alias "${newAliasName}" to config.json`);
    } catch (error) {
      console.error('Error adding new deploy alias:', error);
    }
  }

}


