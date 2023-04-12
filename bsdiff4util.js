///////////////////////////////////////////////////////////////////
// An adaptation of ternary-split Quicksort of Bentley and McIlroy.
// A recursive function used in the sorting function. Splits
// src and dst data accroding to given index and length.
///////////////////////////////////////////////////////////////////
function split(I, V, st, len, h) {
  try {
    let i, j, k, x, tmp, jj, kk;
    if (len < 16) {
      for (k = st; k < st + len; k += j) {
        j = 1;
        x = V.at(I[k] + h);
        for (i = 1; k + i < st + len; i++) {
          if (V.at(I[k + i] + h) < x) {
            x = V.at(I[k + i] + h);

            j = 0;
          }
          if (V.at(I[k + i] + h) == x) {
            tmp = I.at(k + j);
            I[k + j] = I.at(k + i);
            I[k + i] = tmp;
            j++;
          }
        }
        for (i = 0; i < j; i++) {
          V[I[k + i]] = k + j - 1;
        }
        if (j == 1) I[k] = -1;
      }
    } else {
      const y = Math.floor(st + len / 2);
      x = V.at(I.at(y) + h);
      if (isNaN(x)) throw new Error(" x was a NaN");
      jj = 0;
      kk = 0;

      for (i = st; i < st + len; i++) {
        if (V.at(I[i] + h) < x) jj++;
        if (V.at(I[i] + h) == x) kk++;
      }
      jj += st;
      kk += jj;
      i = st;
      j = 0;
      k = 0;
      while (i < jj) {
        if (V.at(I[i] + h) < x) i++;
        else if (V.at(I[i] + h) == x) {
          tmp = I.at(i);
          I[i] = I.at(jj + j);
          I[jj + j] = tmp;
          j++;
        } else {
          tmp = I.at(i);
          I[i] = I.at(kk + k);
          I[kk + k] = tmp;
          k++;
        }
      }

      while (jj + j < kk) {
        if (V.at(I[jj + j] + h) == x) j++;
        else {
          tmp = I.at(jj + j);
          I[jj + j] = I.at(kk + k);
          I[kk + k] = tmp;
          k++;
        }
      }

      if (jj > st) split(I, V, st, jj - st, h);
      for (i = 0; i < kk - jj; i++) V[I[jj + i]] = kk - 1;
      if (jj == kk - 1) I[jj] = -1;
      if (st + len > kk) split(I, V, kk, st + len - kk, h);
    }
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
// A quick suffix sorting algorithm proposed in N.J. Larsson,
// K. Sadakane, "Faster suffix sorting" 1999
///////////////////////////////////////////////////////////////////
async function qsufsort(I, V, oldData, oldLength) {
  try {
    let buckets = [];
    // i = position in group, h = depth of search, len = negated length of sorted groups of suffixes
    let i, h, len, pi, s;
    //Bucket sorting calc
    for (i = 0; i < 256; i++) buckets[i] = 0;
    for (i = 0; i < oldLength; i++) buckets[oldData[i]]++;
    for (i = 1; i < 256; i++) buckets[i] += buckets[i - 1];
    for (i = 255; i > 0; i--) buckets[i] = buckets[i - 1];
    buckets[0] = 0;
    //Placing suffixes from oldData in I array
    for (i = 0; i < oldLength; i++) I[++buckets[oldData[i]]] = i;
    I[0] = oldLength;
    // Input transformation into array V
    for (i = 0; i < oldLength; i++) V[i] = buckets[oldData[i]];
    V[oldLength] = 0; //0 representing the sentinel symbol

    for (i = 1; i < 256; i++) {
      if (buckets[i] == buckets[i - 1] + 1) I[buckets[i]] = -1;
    }
    I[0] = -1;

    for (h = 1; I[0] != -(oldLength + 1); h += h) {
      pi = I;
      len = 0;
      for (i = 0; i < oldLength + 1; ) {
        /*
        If negated length of sorted group detected,
        increase negated length var and increase 
        iterator to skip over sorted group
        */
        s = pi.at(i);
        if (s < 0) {
          i -= s;
          len += s;
        } //Treat element as unsorted
        else {
          //Combining sorted groups before i
          if (len) pi[i + len] = len;
          len = V[s] + 1 - i;
          split(I, V, i, len, h);
          i += len; //next group of suffixes
          len = 0;
        }
      }
      //Combining sorted gorups at the end of I
      if (len) pi[i + len] = len;
    }
    /* Reconstructing the (I) suffix array from its inverse (V)*/
    for (i = 0; i < oldLength + 1; i++) {
      I[V[i]] = i;
    }
  } catch (Error) {
    console.error(Error);
  }
}

///////////////////////////////////////////////////////////////////
// A function for checking the biggest common length of two arrays.
///////////////////////////////////////////////////////////////////
function matchlen(old, oldsize, neww, newsize) {
  let i;
  for (i = 0; i < oldsize && i < newsize; i++) {
    if (old[i] !== neww[i]) break;
  }
  return i;
}

///////////////////////////////////////////////////////////////////
// A recursive function that searches for groups of repetitions and returns
//the postion where the group ends.
///////////////////////////////////////////////////////////////////
function search(I, oldData, oldSize, newData, newSize, st, en, pos) {
  try {
    let x;
    if (en - st < 2) {
      const oldDataScanX = oldData.subarray(I[st]);
      const oldDataScanY = oldData.subarray(I[en]);
      x = matchlen(oldDataScanX, oldDataScanX.length, newData, newSize);
      const y = matchlen(oldDataScanY, oldDataScanY.length, newData, newSize);

      if (x > y) {
        pos[0] = I[st];
        return x;
      } else {
        pos[0] = I[en];
        return y;
      }
    }

    const b = Math.floor((en - st) / 2); // round down to a whole number
    x = st + b;
    const ix = Math.min(oldSize - I[x], newSize);

    if (oldData.compare(newData, 0, ix, I[x], ix) > 0) {
      return search(I, oldData, oldSize, newData, newSize, st, x, pos);
    } else {
      return search(I, oldData, oldSize, newData, newSize, x, en, pos);
    }
  } catch (Error) {
    console.error(Error);
  }
}

export default async function do_diff(
  oldData,
  oldDataLength,
  newData,
  newDataLength
) {
  try {
    let lastscan, lastpos, lastoffset, oldscore, scsc, overlap, Ss;
    let lens, dblen, eblen, scan, len, s, Sf, lenf, Sb, lenb, i;
    let pos = [0]; //made to be an array in order to use it by reference

    // create the control array
    let controlArrays = [];
    let cArray = [0, 0, 0];

    //Array of containing outputs of qsufsorting (permutations of analysed suffixes from oldData).
    // It is supposed to hold all numbers in range <0, oldDataLength>.
    // At the oldDataLength + 1 postion held is a "unique sentinel symbol".
    // The final state of I will be referred to sorted suffix array.
    let I = new Int32Array(oldDataLength + 1);

    //Array being an inverse permutation of the sorted suffix array I.
    let V = new Int32Array(oldDataLength + 1);

    //perform suffix sort on original data
    await qsufsort(I, V, oldData, oldDataLength);

    //db(diff blocks) and eb(extra blocks) variables declared as arrays in order to
    // facilitate storing negative and positive numbers
    // both bigger than 8bit range.
    let db = [];
    let eb = [];
    dblen = 0;
    eblen = 0;

    //perform the diff
    len = 0;
    scan = 0;
    lastscan = 0;
    lastpos = 0;
    lastoffset = 0;
    while (scan < newDataLength) {
      oldscore = 0;
      //do suffix scan between old and new file
      for (scsc = scan += len; scan < newDataLength; scan++) {
        len = search(
          I,
          oldData,
          oldDataLength,
          newData.subarray(scan),
          newDataLength - scan,
          0,
          oldDataLength,
          pos
        );
        if (isNaN(len) || isNaN(pos[0]))
          throw new Error("search function error");
        for (; scsc < scan + len; scsc++) {
          if (
            scsc + lastoffset < oldDataLength &&
            oldData[scsc + lastoffset] == newData[scsc]
          )
            oldscore++;
        }
        if ((len == oldscore && len != 0) || len > oldscore + 8) break;
        if (
          scan + lastoffset < oldDataLength &&
          oldData[scan + lastoffset] == newData[scan]
        )
          oldscore--;
      }

      //if suffix scan completed
      if (len != oldscore || scan == newDataLength) {
        s = 0;
        Sf = 0;
        lenf = 0;
        for (i = 0; lastscan + i < scan && lastpos + i < oldDataLength; ) {
          if (oldData[lastpos + i] == newData[lastscan + i]) s++;
          i++;
          if (s * 2 - i > Sf * 2 - lenf) {
            Sf = s;
            lenf = i;
          }
        }

        lenb = 0;
        if (scan < newDataLength) {
          s = 0;
          Sb = 0;
          for (i = 1; scan >= lastscan + i && pos[0] >= i; i++) {
            if (oldData[pos[0] - i] == newData[scan - i]) s++;
            if (s * 2 - i > Sb * 2 - lenb) {
              Sb = s;
              lenb = i;
            }
          }
        }

        //if there's an overlap
        if (lastscan + lenf > scan - lenb) {
          //console.log("overlap");
          overlap = lastscan + lenf - (scan - lenb);
          s = 0;
          Ss = 0;
          lens = 0;
          for (i = 0; i < overlap; i++) {
            if (
              newData[lastscan + lenf - overlap + i] ==
              oldData[lastpos + lenf - overlap + i]
            )
              s++;
            if (newData[scan - lenb + i] == oldData[pos[0] - lenb + i]) s--;
            if (s > Ss) {
              Ss = s;
              lens = i + 1;
            }
          }

          lenf += lens - overlap;
          lenb -= lens;
        }

        //populate diff bytes and extra bytes arrays
        for (i = 0; i < lenf; i++) {
          db[dblen + i] = newData[lastscan + i] - oldData[lastpos + i];
        }
        for (i = 0; i < scan - lenb - (lastscan + lenf); i++) {
          eb[eblen + i] = newData[lastscan + lenf + i];
        }
        dblen += lenf;
        eblen += scan - lenb - (lastscan + lenf);

        //populating control array
        cArray[0] = lenf;
        cArray[1] = scan - lenb - (lastscan + lenf);
        cArray[2] = pos[0] - lenb - (lastpos + lenf);
        controlArrays.push(cArray);

        lastscan = scan - lenb;
        lastpos = pos[0] - lenb;
        lastoffset = pos[0] - scan;
      }
    }

    //prepare results to return
    let results = [0, 0, 0];
    results[0] = controlArrays;
    const dbBuff = new Uint8Array(db); //facilitating char* cast from original code
    results[1] = dbBuff.buffer; // saving the underlying arraybuffer
    const ebBuff = new Uint8Array(eb);
    results[2] = ebBuff.buffer;

    return results;
  } catch (Error) {
    console.error(Error);
  }
}
