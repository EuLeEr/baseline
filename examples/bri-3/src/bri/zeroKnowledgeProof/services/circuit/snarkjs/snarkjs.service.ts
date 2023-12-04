import { Injectable } from '@nestjs/common';
import { Witness } from '../../../models/witness';
import { Proof } from '../../../models/proof';
import { ICircuitService } from '../circuitService.interface';
import { computeEddsaSigPublicInputs } from './utils/computePublicInputs';
import * as snarkjs from 'snarkjs';
import { Transaction } from '../../../../transactions/models/transaction';
import MerkleTree from 'merkletreejs';
import * as fs from 'fs';
import * as wc from '../../../../../../zeroKnowledgeArtifacts/circuits/workstep1/workstep1_js/witness_calculator';
const WITNESS_FILE = './zeroKnowledgeArtifacts/circuits/workstep1/witness.txt';

@Injectable()
export class SnarkjsCircuitService implements ICircuitService {
  public witness: Witness;

  public async createWitness(
    inputs: {
      tx: Transaction;
      merkelizedPayload: MerkleTree;
    },
    circuitName: string,
    pathToCircuit: string,
    pathToProvingKey: string,
    pathToVerificationKey: string,
  ): Promise<Witness> {
    this.witness = new Witness();

    const preparedInputs = await this.prepareInputs(inputs, circuitName);

    const { proof, publicInputs } = await this.executeCircuit(
      preparedInputs,
      pathToCircuit,
      pathToProvingKey,
    );

    this.witness.proof = proof;

    this.witness.publicInputs = publicInputs;

    this.witness.verificationKey = JSON.parse(
      fs.readFileSync(pathToVerificationKey, 'utf8'),
    );
    return this.witness;
  }

  public async verifyProofUsingWitness(witness: Witness): Promise<boolean> {
    const isVerified = await snarkjs.plonk.verify(
      witness.verificationKey,
      witness.publicInputs,
      witness.proof.value,
    );
    return isVerified;
  }

  private async executeCircuit(
    inputs: object,
    pathToCircuit: string,
    pathToProvingKey: string,
  ): Promise<{ proof: Proof; publicInputs: string[] }> {
    const buffer = fs.readFileSync(pathToCircuit);
    const witnessCalculator = await wc(buffer);

    const buff = await witnessCalculator.calculateWTNSBin(inputs, 0);
    fs.writeFileSync(WITNESS_FILE, buff);

    const { proof, publicSignals: publicInputs } = await snarkjs.plonk.prove(
      pathToProvingKey,
      WITNESS_FILE,
    );

    const newProof = {
      value: proof,
      protocol: proof.protocol,
      curve: proof.curve,
    } as Proof;

    return { proof: newProof, publicInputs };
  }

  private async prepareInputs(
    inputs: {
      tx: Transaction;
      merkelizedPayload: MerkleTree;
    },
    circuitName: string,
  ): Promise<object> {
    return await this[circuitName](inputs);
  }

  // TODO: Mil5 - How to parametrize this for different use-cases?
  private async workstep1(inputs: {
    tx: Transaction;
    merkelizedPayload: MerkleTree;
  }): Promise<object> {
    //1. Ecdsa signature
    const { message, A, R8, S } = await computeEddsaSigPublicInputs(inputs.tx);

    //2. Items
    const payload = JSON.parse(inputs.tx.payload);

    const itemPrices: number[] = [];
    const itemAmount: number[] = [];

    payload.items.forEach((item: object) => {
      itemPrices.push(item['price']);
      itemAmount.push(item['amount']);
    });

    const preparedInputs = {
      invoiceStatus: this.calculateStringCharCodeSum(payload.status),
      invoiceAmount: payload.amount,
      itemPrices,
      itemAmount,
      message,
      A,
      R8,
      S,
    };

    return preparedInputs;
  }

  private async workstep2(inputs: {
    tx: Transaction;
    merkelizedPayload: MerkleTree;
  }): Promise<object> {
    //1. Eddsa signature
    const { message, A, R8, S } = await computeEddsaSigPublicInputs(inputs.tx);

    const payload = JSON.parse(inputs.tx.payload);

    const preparedInputs = {
      invoiceStatus: payload.status,
      message,
      A,
      R8,
      S,
    };

    return preparedInputs;
  }

  private async workstep3(inputs: {
    tx: Transaction;
    merkelizedPayload: MerkleTree;
  }): Promise<object> {
    //1. Eddsa signature
    const { message, A, R8, S } = await computeEddsaSigPublicInputs(inputs.tx);

    const payload = JSON.parse(inputs.tx.payload);

    const preparedInputs = {
      invoiceStatus: payload.status,
      message,
      A,
      R8,
      S,
    };

    return preparedInputs;
  }

  private calculateStringCharCodeSum(status: string): number {
    let sum = 0;

    for (let i = 0; i < status.length; i++) {
      sum += status.charCodeAt(i);
    }

    return sum;
  }
}
