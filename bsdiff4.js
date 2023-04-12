import { Buffer } from "node:buffer";
import do_diff from "./bsdiff4util.js";
import SnappyJS from "snappyjs";

const MAGIC = "BSDIFF40"; //8bytes
///////////////////////////////////////////////////////////////////
// A function that writes a BSDIFF4-format patch to ArrayBuffer obj
///////////////////////////////////////////////////////////////////
export async function writePatch({ controlArrays, bdiff, bextra }) {
  try {
    // Compress each block, compress() returns either arraybuffer or uint8 when passed in.
    // Control arrays is casted to int32array to facilitate having signed bytes object.
    let control_buffer = new ArrayBuffer(controlArrays.flat().length * 4);
    let control_view = new Int32Array(control_buffer);
    control_view.set(controlArrays.flat());
    controlArrays = SnappyJS.compress(control_view.buffer); //returns array buffer
    bdiff = SnappyJS.compress(bdiff);
    bextra = SnappyJS.compress(bextra);

    //combining control&diff data
    let newPatchControl = Buffer.alloc(32);
    //write magic number for integrity control
    newPatchControl.write(MAGIC, 0, 8);
    //write lengths of control header data, giving each 8 bytes of space
    newPatchControl.write(controlArrays.byteLength.toString(), 8);
    newPatchControl.write(bdiff.byteLength.toString(), 16);
    newPatchControl.write(bextra.byteLength.toString(), 24);
    //arrays casted to uint8 in order to produce single Buffer output
    const Views2Write = Buffer.concat([
      newPatchControl,
      new Uint8Array(controlArrays),
      new Uint8Array(bdiff),
      new Uint8Array(bextra),
    ]);

    return Views2Write;
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
// A function that reads a BSDIFF4 patch from ArrayBuffer object
///////////////////////////////////////////////////////////////////
export async function readPatch(patch) {
  try {
    //magic check
    const magic = patch.toString("utf8", 0, 8); //read and decode magic
    if (magic != MAGIC) throw new Error("Bad patch magic");

    // Length headers, reading and decoding utf8 format data from buffer.
    // Casting read string data to Numbers using parseInt.
    const len_control = parseInt(patch.toString("utf8", 8, 16));
    const len_diff = parseInt(patch.toString("utf8", 16, 24));
    const len_extra = parseInt(patch.toString("utf8", 24, 32));
    // read the control data
    const control_offset = 32 + len_control;
    const control = patch.subarray(32, control_offset);
    //Patch holds uint8 views on data stored in control array, therfore
    // each 4 bytes represent a single number (storing int32).
    //To reconstruct the inital control array, uncompressed delta
    // has to be casted back to int32.
    let control_uncompressed = SnappyJS.uncompress(control);
    control_uncompressed = new Int32Array(control_uncompressed.buffer);
    control_uncompressed = [...control_uncompressed]; //convert to array object

    // read the diff and extra blocks
    const bdiff_offset = control_offset + len_diff;
    const bdiff = patch.subarray(control_offset, bdiff_offset);
    let bdiff_uncompressed = SnappyJS.uncompress(bdiff);
    const bextra = patch.subarray(bdiff_offset);
    const bextra_uncompressed = SnappyJS.uncompress(bextra);
    const result = [
      [control_uncompressed],
      bdiff_uncompressed.buffer,
      bextra_uncompressed.buffer,
    ];
    return result;
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
// A function that returns a BSDIFF4-format patch
// (from src_bytes to dst_bytes) as Buffer.
///////////////////////////////////////////////////////////////////
export async function diff(oldData, newData) {
  try {
    const delta = await do_diff({
      oldData: oldData,
      oldDataLength: oldData.length,
      newData: newData,
      newDataLength: newData.length,
    });
    const patch = await writePatch({
      controlArrays: delta[0],
      bdiff: delta[1],
      bextra: delta[2],
    });
    return patch;
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
// A function that only calculates delta bewteen two files.
///////////////////////////////////////////////////////////////////
export async function diffOnly(oldData, newData) {
  try {
    const delta = await do_diff(
      oldData,
      oldData.length,
      newData,
      newData.length
    );
    return delta;
  } catch (Error) {
    console.error(Error);
  }
}
