/**
 * TOY ANALYTIC RADIATIVE TRANSFER — for explaining surface–atmosphere ambiguity only.
 * This is a crude single-layer approximation, NOT libRadtran or DISORT output, and its numbers have
 * no quantitative validity. It exists so the inverse problem can be explored interactively.
 *
 *   R_TOA(λ) = R_path(λ) + T↓(λ) T↑(λ) ρ_s / (1 − S(λ) ρ_s)
 *   τ(λ)     = τ_R(λ) + τ_550 (λ/550)^−α,   α = 1.3
 *   R_path   = ω P τ / (4 μ0 μ),  T↓ = exp(−0.5 τ / μ0),  T↑ = exp(−0.5 τ / μ),  S = 0.12 τ / (1 + τ)
 */
const OMEGA = 0.92;
const PHASE = 0.9;
const ALPHA = 1.3;

export function tau(lambda: number, tau550: number): number {
  const um = lambda / 1000;
  return 0.0088 * Math.pow(um, -4.05) + tau550 * Math.pow(lambda / 550, -ALPHA);
}

export function parts(lambda: number, tau550: number, szaDeg: number, mu: number) {
  const mu0 = Math.cos((szaDeg * Math.PI) / 180);
  const t = tau(lambda, tau550);
  const Rp = (OMEGA * PHASE * t) / (4 * mu0 * mu) * Math.exp(-0.3 * t);
  const T = Math.exp(-0.5 * t / mu0) * Math.exp(-0.5 * t / mu);
  const S = (0.12 * t) / (1 + t);
  return { Rp, T, S };
}

export function toaReflectance(lambda: number, tau550: number, albedo: number, szaDeg: number, mu: number): number {
  const { Rp, T, S } = parts(lambda, tau550, szaDeg, mu);
  return Rp + (T * albedo) / (1 - S * albedo);
}

/** For a given τ550, the surface albedo that reproduces an observed R (analytic inverse; null if outside [0,1]). */
export function albedoFor(lambda: number, tau550: number, R: number, szaDeg: number, mu: number): number | null {
  const { Rp, T, S } = parts(lambda, tau550, szaDeg, mu);
  const d = R - Rp;
  const a = d / (T + S * d);
  return a >= 0 && a <= 1 ? a : null;
}
