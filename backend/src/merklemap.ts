import { MerkleMap, MerkleTree, Field } from "o1js";
import {
  fieldToBase64,
  fieldFromBase64,
  bigintFromBase64,
  bigintToBase64,
} from "zkcloudworker";
 


let merklemap = new MerkleMap();

merklemap.set(Field(11212602), Field(16202))
console.log(merklemap)

