/** Minimal dense linear algebra for small matrices (the simulator uses 4×4). */
export type Mat = number[][];
export type Vec = number[];

export const zeros = (r: number, c: number): Mat => Array.from({ length: r }, () => Array(c).fill(0));
export const eye = (n: number): Mat => zeros(n, n).map((row, i) => row.map((_, j) => (i === j ? 1 : 0)));
export const diag = (v: Vec): Mat => v.map((x, i) => v.map((_, j) => (i === j ? x : 0)));
export const transpose = (A: Mat): Mat => A[0].map((_, j) => A.map((row) => row[j]));
export const add = (A: Mat, B: Mat): Mat => A.map((row, i) => row.map((x, j) => x + B[i][j]));
export const scale = (A: Mat, s: number): Mat => A.map((row) => row.map((x) => x * s));

export function matmul(A: Mat, B: Mat): Mat {
  const n = A.length, m = B[0].length, k = B.length;
  const C = zeros(n, m);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    let s = 0;
    for (let t = 0; t < k; t++) s += A[i][t] * B[t][j];
    C[i][j] = s;
  }
  return C;
}
export const matvec = (A: Mat, x: Vec): Vec => A.map((row) => row.reduce((s, a, j) => s + a * x[j], 0));

/** Gauss–Jordan inverse with partial pivoting. */
export function inverse(A: Mat): Mat {
  const n = A.length;
  const M = A.map((row, i) => [...row, ...eye(n)[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-14) throw new Error('Matrix is singular');
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c];
    for (let j = 0; j < 2 * n; j++) M[c][j] /= piv;
    for (let r = 0; r < n; r++) if (r !== c) {
      const f = M[r][c];
      for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((row) => row.slice(n));
}

/** log-determinant of a symmetric positive-definite matrix via Cholesky. */
export function logdetSPD(A: Mat): number {
  const n = A.length;
  const L = zeros(n, n);
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = A[i][j];
    for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    if (i === j) {
      if (s <= 0) throw new Error('Matrix not positive definite');
      L[i][i] = Math.sqrt(s);
    } else L[i][j] = s / L[j][j];
  }
  let ld = 0;
  for (let i = 0; i < n; i++) ld += 2 * Math.log(L[i][i]);
  return ld;
}

export const trace = (A: Mat): number => A.reduce((s, row, i) => s + row[i], 0);
export const symmetrize = (A: Mat): Mat => A.map((row, i) => row.map((x, j) => 0.5 * (x + A[j][i])));
